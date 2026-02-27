import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const testRoot = mkdtempSync(join(tmpdir(), "qurt-memory-test-"));
vi.mock("electron", () => ({
  app: { getPath: () => testRoot },
}));

afterEach(() => {
  rmSync(testRoot, { recursive: true, force: true });
});

describe("memoryStore", () => {
  beforeEach(async () => {
    vi.resetModules();
    const { ensureMemoryFilesystem } = await import("./memoryStore");
    await ensureMemoryFilesystem();
  });

  it("runMemoryCommand view reads core.md", async () => {
    const { runMemoryCommand } = await import("./memoryStore");
    const result = await runMemoryCommand({
      command: "view",
      path: "/memories/core.md",
    });
    expect(result).toContain("Core Memory");
  });

  it("runMemoryCommand view accepts .memory path", async () => {
    const { runMemoryCommand } = await import("./memoryStore");
    const result = await runMemoryCommand({
      command: "view",
      path: "/.memory/core.md",
    });
    expect(result).toContain("Core Memory");
  });

  it("runMemoryCommand view rejects unknown path", async () => {
    const { runMemoryCommand } = await import("./memoryStore");
    await expect(
      runMemoryCommand({
        command: "view",
        path: "/memories/evil.md",
      }),
    ).rejects.toThrow("Unsupported memory path");
  });

  it("runMemoryCommand update overwrites by default", async () => {
    const { runMemoryCommand } = await import("./memoryStore");
    await runMemoryCommand({
      command: "update",
      path: "core.md",
      content: "New content",
    });
    const result = await runMemoryCommand({
      command: "view",
      path: "core.md",
    });
    expect(result).toBe("New content");
  });

  it("runMemoryCommand update append mode", async () => {
    const { runMemoryCommand } = await import("./memoryStore");
    await runMemoryCommand({
      command: "update",
      path: "notes.md",
      content: "First line\n",
      mode: "overwrite",
    });
    await runMemoryCommand({
      command: "update",
      path: "notes.md",
      content: "Second line",
      mode: "append",
    });
    const result = await runMemoryCommand({
      command: "view",
      path: "notes.md",
    });
    expect(result).toContain("First line");
    expect(result).toContain("Second line");
  });

  it("runMemoryCommand search finds matching lines", async () => {
    const { runMemoryCommand } = await import("./memoryStore");
    await runMemoryCommand({
      command: "update",
      path: "notes.md",
      content: "Line with keyword\nOther line\nAnother keyword here",
      mode: "overwrite",
    });
    const result = await runMemoryCommand({
      command: "search",
      query: "keyword",
    });
    expect(result).toContain("keyword");
    expect(result).not.toBe("No matches found.");
  });

  it("runMemoryCommand search returns no matches when absent", async () => {
    const { runMemoryCommand } = await import("./memoryStore");
    const result = await runMemoryCommand({
      command: "search",
      query: "nonexistentxyz",
    });
    expect(result).toBe("No matches found.");
  });

  it("readCoreMemory returns content after bootstrap", async () => {
    const { readCoreMemory } = await import("./memoryStore");
    const result = await readCoreMemory();
    expect(result).toContain("Core Memory");
  });

  it("appendConversation adds JSONL line", async () => {
    const { appendConversation, runMemoryCommand } = await import("./memoryStore");
    await appendConversation({
      role: "user",
      content: "Hello",
      timestamp: "2026-01-01T00:00:00.000Z",
    });
    const result = await runMemoryCommand({
      command: "search",
      path: "conversations.jsonl",
      query: "Hello",
    });
    expect(result).toContain("Hello");
  });
});
