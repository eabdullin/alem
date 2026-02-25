/**
 * Secure file patch runner for the agent.
 * - Workspace-bounded paths (realpath, no escape)
 * - Binary files blocked by default
 * - Optional base_hashes validation
 * - Per-file atomic apply
 * - Checkpoint before write for revert
 */

import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { applyPatch, parsePatch } from "diff";
import type { ParsedDiff } from "diff";
import {
  restoreCheckpoint,
  saveCheckpoint,
  type FileSnapshot,
} from "./filePatchCheckpoints";
import type {
  FilePatchRequest,
  FilePatchResult,
  RejectedOp,
  FileChangeStats,
} from "../../shared/tools/file-patch/types";

export type { FilePatchRequest, FilePatchResult } from "../../shared/tools/file-patch/types";

const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".webp",
  ".bmp",
  ".svg",
  ".pdf",
  ".zip",
  ".tar",
  ".gz",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".mp3",
  ".mp4",
  ".wav",
  ".flac",
]);

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

function sha256Hex(content: Buffer | string): string {
  const buf = typeof content === "string" ? Buffer.from(content, "utf8") : content;
  return createHash("sha256").update(buf).digest("hex");
}

function normalizePatchPath(p: string): string {
  let s = p.trim();
  if (s.startsWith("a/")) s = s.slice(2);
  else if (s.startsWith("b/")) s = s.slice(2);
  return s.replace(/\\/g, "/");
}

function ensureInsideRoot(absolutePath: string, root: string): boolean {
  const normalized = path.normalize(absolutePath);
  const rel = path.relative(root, normalized);
  return !rel.startsWith("..") && !path.isAbsolute(rel);
}

async function resolveRealPath(
  workspaceRoot: string,
  relPath: string
): Promise<string> {
  const abs = path.join(workspaceRoot, relPath);
  try {
    return await fs.realpath(abs);
  } catch {
    return path.resolve(abs);
  }
}

interface ParsedFileOp {
  path: string;
  patch: ParsedDiff;
  isNewFile: boolean;
}

function parseUnifiedDiff(patchText: string): ParsedFileOp[] {
  const parsed = parsePatch(patchText);
  const ops: ParsedFileOp[] = [];
  for (const p of parsed) {
    const targetPath = normalizePatchPath(p.newFileName || p.oldFileName || "");
    if (!targetPath) continue;
    const isNewFile = !p.oldFileName || p.oldFileName === "/dev/null";
    ops.push({ path: targetPath, patch: p, isNewFile });
  }
  return ops;
}

const STRICT_DSL_FILE = /^\*\*\*\s+Update\s+File:\s*(.+)$/;
const STRICT_DSL_BEGIN = /^\*\*\*\s+Begin\s+Patch\s*$/;
const STRICT_DSL_END = /^\*\*\*\s+End\s+Patch\s*$/;

function parseStrictDsl(patchText: string): ParsedFileOp[] {
  const ops: ParsedFileOp[] = [];
  const lines = patchText.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    if (!STRICT_DSL_BEGIN.test(lines[i])) {
      i++;
      continue;
    }
    i++;

    let currentPath: string | null = null;
    const hunks: string[] = [];

    while (i < lines.length) {
      const line = lines[i];
      const fileMatch = STRICT_DSL_FILE.exec(line);
      if (fileMatch) {
        currentPath = fileMatch[1].trim().replace(/\\/g, "/");
        i++;
        continue;
      }
      if (STRICT_DSL_END.test(line)) {
        i++;
        break;
      }
      if (currentPath && (line.startsWith("+") || line.startsWith("-") || line.startsWith(" "))) {
        hunks.push(line);
      }
      i++;
    }

    if (currentPath && hunks.length > 0) {
      let oldCount = 0;
      let newCount = 0;
      for (const l of hunks) {
        if (l.startsWith("-")) oldCount++;
        else if (l.startsWith("+")) newCount++;
        else {
          oldCount++;
          newCount++;
        }
      }
      const isNewFile = oldCount === 0;
      const header = isNewFile
        ? `--- /dev/null\n+++ b/${currentPath}\n`
        : `--- a/${currentPath}\n+++ b/${currentPath}\n`;
      const hunkHeader = isNewFile
        ? `@@ -0,0 +1,${newCount} @@\n`
        : `@@ -1,${oldCount} +1,${newCount} @@\n`;
      const patchStr = header + hunkHeader + hunks.map((l) => l + "\n").join("");
      const parsed = parsePatch(patchStr);
      if (parsed[0]) {
        ops.push({
          path: currentPath,
          patch: parsed[0],
          isNewFile,
        });
      }
    }
  }

  return ops;
}

function parsePatchText(patchText: string): ParsedFileOp[] {
  const trimmed = patchText.trim();
  if (!trimmed) return [];

  const unified = parseUnifiedDiff(trimmed);
  if (unified.length > 0) return unified;

  const strict = parseStrictDsl(trimmed);
  if (strict.length > 0) return strict;

  return [];
}

function countChanges(patch: ParsedDiff): { additions: number; deletions: number } {
  let additions = 0;
  let deletions = 0;
  for (const hunk of patch.hunks) {
    for (const line of hunk.lines) {
      if (line.startsWith("+")) additions++;
      else if (line.startsWith("-")) deletions++;
    }
  }
  return { additions, deletions };
}

export interface RunFilePatchOptions {
  request: FilePatchRequest;
  workspaceRoot: string;
}

export async function runFilePatch({
  request,
  workspaceRoot,
}: RunFilePatchOptions): Promise<FilePatchResult> {
  const filesChanged: string[] = [];
  const rejectedOps: RejectedOp[] = [];
  const postHashes: Record<string, string> = {};
  const diffPreview: FileChangeStats[] = [];
  const snapshots: FileSnapshot[] = [];

  const ops = parsePatchText(request.patch);
  if (ops.length === 0) {
    return {
      status: "error",
      files_changed: [],
      rejected_ops: [{ path: "", reason: "Could not parse patch (unified diff or strict DSL expected)." }],
      post_hashes: {},
    };
  }

  const baseHashes = request.base_hashes ?? {};

  for (const op of ops) {
    const relPath = op.path;
    let absPath: string;
    try {
      absPath = await resolveRealPath(workspaceRoot, relPath);
    } catch (err) {
      rejectedOps.push({
        path: relPath,
        reason: `Path resolution failed: ${err instanceof Error ? err.message : String(err)}`,
      });
      continue;
    }

    if (!ensureInsideRoot(absPath, workspaceRoot)) {
      rejectedOps.push({ path: relPath, reason: "Path escapes workspace root." });
      continue;
    }

    const ext = path.extname(relPath).toLowerCase();
    if (BINARY_EXTENSIONS.has(ext)) {
      rejectedOps.push({ path: relPath, reason: "Binary file type blocked by default." });
      continue;
    }

    let oldContent: string;
    let existed: boolean;

    try {
      const buf = await fs.readFile(absPath);
      if (isLikelyBinary(buf)) {
        rejectedOps.push({ path: relPath, reason: "File appears to be binary." });
        continue;
      }
      oldContent = buf.toString("utf8");
      existed = true;
    } catch {
      if (!op.isNewFile) {
        rejectedOps.push({ path: relPath, reason: "File not found." });
        continue;
      }
      oldContent = "";
      existed = false;
    }

    const expectedHash = baseHashes[relPath];
    if (expectedHash) {
      const actual = sha256Hex(oldContent);
      if (actual !== expectedHash) {
        rejectedOps.push({
          path: relPath,
          reason: `base_hashes mismatch (expected ${expectedHash.slice(0, 8)}..., got ${actual.slice(0, 8)}...).`,
        });
        continue;
      }
    }

    const applied = applyPatch(oldContent, op.patch);
    if (applied === false) {
      rejectedOps.push({ path: relPath, reason: "Patch did not apply (context mismatch)." });
      continue;
    }

    snapshots.push({
      path: relPath,
      existed,
      contentBase64: existed ? Buffer.from(oldContent, "utf8").toString("base64") : undefined,
    });

    await fs.mkdir(path.dirname(absPath), { recursive: true });
    await fs.writeFile(absPath, applied, "utf8");

    filesChanged.push(relPath);
    postHashes[relPath] = sha256Hex(applied);
    const { additions, deletions } = countChanges(op.patch);
    diffPreview.push({ path: relPath, additions, deletions });
  }

  let checkpointId: string | undefined;
  if (snapshots.length > 0) {
    checkpointId = await saveCheckpoint(workspaceRoot, snapshots);
  }

  const status =
    rejectedOps.length === 0
      ? "ok"
      : filesChanged.length > 0
        ? "partial"
        : "error";

  return {
    status,
    files_changed: filesChanged,
    rejected_ops: rejectedOps,
    post_hashes: postHashes,
    checkpoint_id: checkpointId,
    diff_preview: diffPreview.length > 0 ? diffPreview : undefined,
  };
}
