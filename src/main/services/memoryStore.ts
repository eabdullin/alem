import { app } from "electron";
import {
  access,
  appendFile,
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { join, relative } from "node:path";

const MEMORY_DIR = ".memory";
const MEMORY_ROOT = join(app.getPath("userData"), MEMORY_DIR);
const CORE_MEMORY_PATH = join(MEMORY_ROOT, "core.md");
const NOTES_PATH = join(MEMORY_ROOT, "notes.md");
const CONVERSATIONS_PATH = join(MEMORY_ROOT, "conversations.jsonl");

const MEMORY_FILES = ["core.md", "notes.md", "conversations.jsonl"] as const;

const DEFAULT_CORE_MEMORY = `# Core Memory
- Keep this short.
- Put stable user facts here.
`;

const DEFAULT_NOTES = `# Notes
Use this file for detailed memories and timestamped notes.
`;

async function ensureFile(path: string, content: string): Promise<void> {
  try {
    await access(path);
  } catch {
    await writeFile(path, content, "utf8");
  }
}

export async function ensureMemoryFilesystem(): Promise<void> {
  await mkdir(MEMORY_ROOT, { recursive: true });
  await ensureFile(CORE_MEMORY_PATH, DEFAULT_CORE_MEMORY);
  await ensureFile(NOTES_PATH, DEFAULT_NOTES);
  await ensureFile(CONVERSATIONS_PATH, "");
}

export async function readCoreMemory(): Promise<string> {
  try {
    return await readFile(CORE_MEMORY_PATH, "utf8");
  } catch {
    return "";
  }
}

export interface ConversationEntry {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export async function appendConversation(
  entry: ConversationEntry
): Promise<void> {
  await ensureMemoryFilesystem();
  await appendFile(
    CONVERSATIONS_PATH,
    `${JSON.stringify(entry)}\n`,
    "utf8"
  );
}

export type MemoryCommand = "view" | "create" | "update" | "search";

export interface MemoryCommandInput {
  command: MemoryCommand;
  path?: string;
  content?: string;
  mode?: "append" | "overwrite";
  query?: string;
}

function resolveMemoryPath(inputPath: string): string {
  const relativePath = inputPath
    .trim()
    .replace(/^\/?memories\/?/, "")
    .replace(/^\/?\.memory\/?/, "")
    .replace(/^\/+/, "");

  if (!MEMORY_FILES.includes(relativePath as (typeof MEMORY_FILES)[number])) {
    throw new Error(`Unsupported memory path: ${inputPath}`);
  }

  return join(MEMORY_ROOT, relativePath);
}

export async function runMemoryCommand(
  input: MemoryCommandInput
): Promise<string> {
  const { command, path, content, mode, query } = input;

  await ensureMemoryFilesystem();

  switch (command) {
    case "view": {
      if (!path) throw new Error("path is required for view");
      return await readFile(resolveMemoryPath(path), "utf8");
    }
    case "create":
    case "update": {
      if (!path) throw new Error("path is required");
      if (!content) throw new Error("content is required");
      const target = resolveMemoryPath(path);
      if (mode === "append") {
        await appendFile(target, content, "utf8");
      } else {
        await writeFile(target, content, "utf8");
      }
      return `${command === "create" ? "Created" : "Updated"} ${path}`;
    }
    case "search": {
      if (!query) throw new Error("query is required for search");
      const terms = query
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
      const files = path
        ? [resolveMemoryPath(path)]
        : MEMORY_FILES.map((f) => join(MEMORY_ROOT, f));
      const matches: string[] = [];

      for (const filePath of files) {
        const lines = (await readFile(filePath, "utf8")).split("\n");
        for (const [i, line] of lines.entries()) {
          const lower = line.toLowerCase();
          if (terms.some((t) => lower.includes(t))) {
            matches.push(
              `${relative(MEMORY_ROOT, filePath)}:${i + 1}:${line}`
            );
          }
        }
      }

      return matches.length > 0 ? matches.join("\n") : "No matches found.";
    }
  }
}
