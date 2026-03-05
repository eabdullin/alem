/**
 * Secure file reader for the agent.
 * - Workspace-bounded paths (realpath, no escape)
 * - Supports text, PDF, DOCX, RTF
 * - Content truncation for large files
 * - Binary detection for unsupported formats
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import log from "../logger";
import type {
  ReadFileRequest,
  ReadFileResult,
} from "../../shared/tools/read-file/types";

export type {
  ReadFileRequest,
  ReadFileResult,
} from "../../shared/tools/read-file/types";

/** Maximum content size in characters returned to the model. */
const MAX_CONTENT_CHARS = 100_000;

/** Maximum file size in bytes to attempt reading. */
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

/** Text file extensions (case-insensitive). */
const TEXT_EXTENSIONS = new Set([
  ".txt", ".md", ".markdown", ".json", ".jsonl", ".json5",
  ".html", ".htm", ".xml", ".svg", ".css", ".scss", ".less",
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
  ".py", ".rb", ".java", ".kt", ".kts", ".scala",
  ".go", ".rs", ".c", ".cpp", ".h", ".hpp", ".cs",
  ".swift", ".m", ".mm", ".php", ".lua", ".r",
  ".sh", ".bash", ".zsh", ".fish", ".ps1", ".bat", ".cmd",
  ".yaml", ".yml", ".toml", ".ini", ".cfg", ".conf",
  ".env", ".env.local", ".env.example",
  ".sql", ".graphql", ".gql", ".proto",
  ".csv", ".tsv", ".log",
  ".gitignore", ".gitattributes", ".editorconfig",
  ".eslintrc", ".prettierrc", ".babelrc",
  ".lock",
]);

/** Known files without extensions that are text. */
const TEXT_FILENAMES = new Set([
  "Makefile", "Dockerfile", "Vagrantfile", "Gemfile",
  "Rakefile", "Procfile", "LICENSE", "README", "CHANGELOG",
  "Taskfile", "Justfile",
]);

// ---------------------------------------------------------------------------
// Security helpers (same patterns as filePatchRunner.ts)
// ---------------------------------------------------------------------------

function ensureInsideRoot(absolutePath: string, root: string): boolean {
  const normalized = path.normalize(absolutePath);
  const rel = path.relative(root, normalized);
  return !rel.startsWith("..") && !path.isAbsolute(rel);
}

async function resolveRealPath(
  workspaceRoot: string,
  relPath: string,
): Promise<string> {
  const abs = path.join(workspaceRoot, relPath);
  try {
    return await fs.realpath(abs);
  } catch {
    return path.resolve(abs);
  }
}

function isLikelyBinary(content: Buffer): boolean {
  if (content.length === 0) return false;
  if (content.includes(0)) return true;
  const sample = content.slice(0, 8192);
  let nonText = 0;
  for (let i = 0; i < sample.length; i++) {
    const b = sample[i];
    if (b < 9 || (b > 13 && b < 32 && b !== 127)) nonText++;
  }
  return nonText / sample.length > 0.05;
}

// ---------------------------------------------------------------------------
// Format detection
// ---------------------------------------------------------------------------

function detectFormat(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".pdf": return "pdf";
    case ".docx": return "docx";
    case ".rtf": return "rtf";
    default: {
      if (TEXT_EXTENSIONS.has(ext)) return "text";
      const basename = path.basename(filePath);
      if (TEXT_FILENAMES.has(basename)) return "text";
      if (!ext) return "text";
      return "unknown";
    }
  }
}

// ---------------------------------------------------------------------------
// Content helpers
// ---------------------------------------------------------------------------

function truncateContent(text: string): { content: string; truncated: boolean } {
  if (text.length <= MAX_CONTENT_CHARS) {
    return { content: text, truncated: false };
  }
  return {
    content: text.slice(0, MAX_CONTENT_CHARS) + "\n\n[Content truncated]",
    truncated: true,
  };
}

// ---------------------------------------------------------------------------
// Format-specific readers
// ---------------------------------------------------------------------------

async function readTextFile(absPath: string): Promise<{ content: string; truncated: boolean }> {
  const buf = await fs.readFile(absPath);
  if (isLikelyBinary(buf)) {
    throw new Error("File appears to be binary and cannot be read as text.");
  }
  return truncateContent(buf.toString("utf8"));
}

async function readPdfFile(absPath: string): Promise<{ content: string; truncated: boolean }> {
  const { PDFParse } = await import("pdf-parse");
  const buf = await fs.readFile(absPath);
  const pdf = new PDFParse({ data: new Uint8Array(buf) });
  const result = await pdf.getText();
  await pdf.destroy();
  return truncateContent(result.text);
}

async function readDocxFile(absPath: string): Promise<{ content: string; truncated: boolean }> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ path: absPath });
  return truncateContent(result.value);
}

async function readRtfFile(absPath: string): Promise<{ content: string; truncated: boolean }> {
  const buf = await fs.readFile(absPath);
  const text = stripRtfToPlainText(buf.toString("utf8"));
  return truncateContent(text);
}

/**
 * Simple RTF-to-plain-text stripper.
 * Handles basic RTF by removing control words, groups, and extracting text runs.
 */
function stripRtfToPlainText(rtf: string): string {
  let text = rtf;
  // Replace \par and \pard with newlines
  text = text.replace(/\\par[d]?\s?/g, "\n");
  // Replace \tab with tab
  text = text.replace(/\\tab\s?/g, "\t");
  // Decode \'XX hex escapes
  text = text.replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
  // Decode \uN Unicode escapes
  text = text.replace(/\\u(\d+)\s?\??/g, (_, code) =>
    String.fromCodePoint(parseInt(code, 10)),
  );
  // Remove all other control words
  text = text.replace(/\\[a-zA-Z]+[-]?\d*\s?/g, "");
  // Remove braces
  text = text.replace(/[{}]/g, "");
  // Collapse excessive newlines
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function runReadFile(request: ReadFileRequest): Promise<ReadFileResult> {
  const relPath = request.path.replace(/\\/g, "/");
  const workspaceRoot = request.workspaceRoot;

  // Resolve and validate path
  let absPath: string;
  try {
    absPath = await resolveRealPath(workspaceRoot, relPath);
  } catch {
    return { content: "", path: relPath, format: "unknown", error: "Path resolution failed." };
  }

  if (!ensureInsideRoot(absPath, workspaceRoot)) {
    return { content: "", path: relPath, format: "unknown", error: "Path escapes workspace root." };
  }

  // Check file exists and size
  let stat: import("node:fs").Stats;
  try {
    stat = await fs.stat(absPath);
  } catch {
    return { content: "", path: relPath, format: "unknown", error: "File not found." };
  }

  if (!stat.isFile()) {
    return { content: "", path: relPath, format: "unknown", error: "Path is not a file." };
  }

  if (stat.size > MAX_FILE_SIZE_BYTES) {
    return {
      content: "",
      path: relPath,
      format: "unknown",
      error: `File is too large (${Math.round(stat.size / 1024 / 1024)}MB). Maximum is ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.`,
    };
  }

  const format = detectFormat(relPath);

  try {
    let result: { content: string; truncated: boolean };

    switch (format) {
      case "pdf":
        result = await readPdfFile(absPath);
        break;
      case "docx":
        result = await readDocxFile(absPath);
        break;
      case "rtf":
        result = await readRtfFile(absPath);
        break;
      default:
        // text, unknown — attempt text read with binary detection
        result = await readTextFile(absPath);
        break;
    }

    return {
      content: result.content,
      path: relPath,
      truncated: result.truncated || undefined,
      format: format === "unknown" ? "text" : format,
    };
  } catch (err) {
    log.error("ReadFile: failed to read", relPath, err);
    return {
      content: "",
      path: relPath,
      format,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
