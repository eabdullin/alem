import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UIMessage } from "ai";
import {
  getTextFromParts,
  canRestoreAtIndex,
  listCheckpoints,
  restoreCheckpoint,
  createCheckpoint,
} from "./checkpoint-service";

// ── Helpers ──────────────────────────────────────────────────────────

function makeUserMessage(text: string, id = "u1"): UIMessage {
  return {
    id,
    role: "user",
    parts: [{ type: "text", text }],
  };
}

function makeAssistantTextMessage(text: string, id = "a1"): UIMessage {
  return {
    id,
    role: "assistant",
    parts: [{ type: "text", text }],
  };
}

// ── getTextFromParts ─────────────────────────────────────────────────

describe("getTextFromParts", () => {
  it("extracts text from a single text part", () => {
    expect(getTextFromParts([{ type: "text", text: "Hello" }])).toBe("Hello");
  });

  it("concatenates multiple text parts", () => {
    const parts: UIMessage["parts"] = [
      { type: "text", text: "Hello " },
      { type: "text", text: "World" },
    ];
    expect(getTextFromParts(parts)).toBe("Hello World");
  });

  it("ignores non-text parts", () => {
    const parts: UIMessage["parts"] = [
      { type: "text", text: "Hello" },
      {
        type: "tool-invocation",
        toolInvocationId: "call-1",
        toolName: "test",
        state: "call",
        args: {},
      } as any,
    ];
    expect(getTextFromParts(parts)).toBe("Hello");
  });

  it("returns empty string for empty parts", () => {
    expect(getTextFromParts([])).toBe("");
  });

  it("returns empty string when no text parts present", () => {
    const parts: UIMessage["parts"] = [
      {
        type: "tool-invocation",
        toolInvocationId: "call-1",
        toolName: "test",
        state: "call",
        args: {},
      } as any,
    ];
    expect(getTextFromParts(parts)).toBe("");
  });
});

// ── canRestoreAtIndex ────────────────────────────────────────────────

describe("canRestoreAtIndex", () => {
  it("returns false for assistant message index", () => {
    const messages = [
      makeAssistantTextMessage("Hi"),
      makeUserMessage("Hello"),
    ];
    expect(canRestoreAtIndex(messages, 0)).toBe(false);
  });

  it("returns false when user message is last", () => {
    const messages = [makeUserMessage("Hello", "u1")];
    expect(canRestoreAtIndex(messages, 0)).toBe(false);
  });

  it("returns true when messages exist after user message", () => {
    const messages = [
      makeUserMessage("Hello", "u1"),
      makeAssistantTextMessage("World", "a1"),
    ];
    expect(canRestoreAtIndex(messages, 0)).toBe(true);
  });

  it("returns true for middle user message", () => {
    const messages = [
      makeUserMessage("First", "u1"),
      makeAssistantTextMessage("R1", "a1"),
      makeUserMessage("Second", "u2"),
      makeAssistantTextMessage("R2", "a2"),
    ];
    expect(canRestoreAtIndex(messages, 0)).toBe(true);
    expect(canRestoreAtIndex(messages, 2)).toBe(true);
  });

  it("returns false for out-of-bounds index", () => {
    const messages = [makeUserMessage("Hello", "u1")];
    expect(canRestoreAtIndex(messages, 5)).toBe(false);
  });

  it("returns false for negative index", () => {
    const messages = [makeUserMessage("Hello", "u1")];
    expect(canRestoreAtIndex(messages, -1)).toBe(false);
  });
});

// ── listCheckpoints ──────────────────────────────────────────────────

describe("listCheckpoints", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns empty array when qurt bridge is unavailable", async () => {
    (globalThis as any).window = {};
    const result = await listCheckpoints("/test/workspace");
    expect(result).toEqual([]);
  });

  it("returns empty array when listCheckpoints is not on qurt", async () => {
    (globalThis as any).window = { qurt: {} };
    const result = await listCheckpoints("/test/workspace");
    expect(result).toEqual([]);
  });

  it("calls window.qurt.listCheckpoints with correct payload", async () => {
    const mockTimestamps: string[] = [
      "2025-01-01T00:00:00Z",
      "2025-01-02T00:00:00Z",
    ];
    (globalThis as any).window = {
      qurt: {
        listCheckpoints: vi.fn().mockResolvedValue(mockTimestamps),
      },
    };

    const result = await listCheckpoints("/my/workspace");
    expect(result).toEqual(mockTimestamps);
    expect(window.qurt!.listCheckpoints).toHaveBeenCalledWith({
      workspaceRoot: "/my/workspace",
    });
  });

  it("returns empty array when IPC returns empty", async () => {
    (globalThis as any).window = {
      qurt: {
        listCheckpoints: vi.fn().mockResolvedValue([]),
      },
    };
    const result = await listCheckpoints("/test/workspace");
    expect(result).toEqual([]);
  });
});

// ── restoreCheckpoint ────────────────────────────────────────────────

describe("restoreCheckpoint", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns error when qurt bridge is unavailable", async () => {
    (globalThis as any).window = {};
    const result = await restoreCheckpoint("/test/workspace", "ts-1");
    expect(result.restored).toBe(false);
    expect(result.error).toBe("Restore is not available.");
  });

  it("returns error when restoreCheckpoints is not on qurt", async () => {
    (globalThis as any).window = { qurt: {} };
    const result = await restoreCheckpoint("/test/workspace", "ts-1");
    expect(result.restored).toBe(false);
    expect(result.error).toBe("Restore is not available.");
  });

  it("calls window.qurt.restoreCheckpoints with correct payload", async () => {
    (globalThis as any).window = {
      qurt: {
        restoreCheckpoints: vi.fn().mockResolvedValue({ restored: true }),
      },
    };

    const result = await restoreCheckpoint("/my/workspace", "ts-1");
    expect(result.restored).toBe(true);
    expect(window.qurt!.restoreCheckpoints).toHaveBeenCalledWith({
      workspaceRoot: "/my/workspace",
      timestamp: "ts-1",
    });
  });

  it("forwards error from IPC", async () => {
    (globalThis as any).window = {
      qurt: {
        restoreCheckpoints: vi.fn().mockResolvedValue({
          restored: false,
          error: "No mirror found",
        }),
      },
    };

    const result = await restoreCheckpoint("/test/workspace", "ts-1");
    expect(result.restored).toBe(false);
    expect(result.error).toBe("No mirror found");
  });
});

// ── createCheckpoint ─────────────────────────────────────────────────

describe("createCheckpoint", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns { created: false } when qurt bridge is unavailable", async () => {
    (globalThis as any).window = {};
    const result = await createCheckpoint("/test/workspace");
    expect(result.created).toBe(false);
  });

  it("returns { created: false } when createCheckpoint is not on qurt", async () => {
    (globalThis as any).window = { qurt: {} };
    const result = await createCheckpoint("/test/workspace");
    expect(result.created).toBe(false);
  });

  it("calls window.qurt.createCheckpoint with correct payload", async () => {
    (globalThis as any).window = {
      qurt: {
        createCheckpoint: vi.fn().mockResolvedValue({ created: true, timestamp: "2025-01-01T00:00:00Z" }),
      },
    };

    const result = await createCheckpoint("/my/workspace");
    expect(result.created).toBe(true);
    expect(result.timestamp).toBe("2025-01-01T00:00:00Z");
    expect(window.qurt!.createCheckpoint).toHaveBeenCalledWith({
      workspaceRoot: "/my/workspace",
    });
  });

  it("calls window.qurt.createCheckpoint with just workspaceRoot", async () => {
    (globalThis as any).window = {
      qurt: {
        createCheckpoint: vi.fn().mockResolvedValue({ created: true, timestamp: "ts" }),
      },
    };

    await createCheckpoint("/my/workspace");
    expect(window.qurt!.createCheckpoint).toHaveBeenCalledWith({
      workspaceRoot: "/my/workspace",
    });
  });
});
