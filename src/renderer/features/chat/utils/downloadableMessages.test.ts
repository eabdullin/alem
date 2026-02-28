import { describe, it, expect } from "vitest";
import { toDownloadableMessages } from "./downloadableMessages";

describe("toDownloadableMessages", () => {
  it("returns empty array for empty messages", () => {
    expect(toDownloadableMessages([])).toEqual([]);
  });

  it("converts text-only user message", () => {
    const messages = [
      {
        id: "1",
        role: "user" as const,
        parts: [{ type: "text" as const, text: "Hello" }],
      },
    ];
    expect(toDownloadableMessages(messages)).toEqual([
      { content: "Hello", role: "user" },
    ]);
  });

  it("includes reasoning when present", () => {
    const messages = [
      {
        id: "1",
        role: "assistant" as const,
        parts: [
          { type: "reasoning" as const, text: "Let me think...", state: "done" as const },
          { type: "text" as const, text: "Here is the answer." },
        ],
      },
    ];
    expect(toDownloadableMessages(messages)).toEqual([
      {
        content: "Here is the answer.\n\n*Reasoning:*\n\n> Let me think...",
        role: "assistant",
      },
    ]);
  });

  it("skips empty reasoning", () => {
    const messages = [
      {
        id: "1",
        role: "assistant" as const,
        parts: [
          { type: "reasoning" as const, text: "   ", state: "done" as const },
          { type: "text" as const, text: "Answer" },
        ],
      },
    ];
    expect(toDownloadableMessages(messages)).toEqual([
      { content: "Answer", role: "assistant" },
    ]);
  });

  it("includes tool summary for tool parts (no verbose output)", () => {
    const messages = [
      {
        id: "1",
        role: "assistant" as const,
        parts: [
          { type: "text" as const, text: "Done." },
          {
            type: "dynamic-tool" as const,
            toolName: "run_terminal",
            toolCallId: "tc1",
            input: { command: ["ls"] },
            output: {
              stdout: "file1.txt\nfile2.txt",
              stderr: "",
              outcome: { type: "exit" as const, exit_code: 0 },
              duration_ms: 50,
              truncated: false,
            },
            state: "output-available" as const,
          },
        ],
      },
    ];
    const result = toDownloadableMessages(messages);
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe("assistant");
    expect(result[0].content).toContain("Done.");
    expect(result[0].content).toContain("**Terminal:**");
    expect(result[0].content).toContain("ls");
    expect(result[0].content).toContain("exit 0");
    expect(result[0].content).toContain("50ms");
    expect(result[0].content).not.toContain("file1.txt");
    expect(result[0].content).not.toContain("stdout");
  });

  it("includes error text when present", () => {
    const messages = [
      {
        id: "1",
        role: "assistant" as const,
        parts: [
          {
            type: "dynamic-tool" as const,
            toolName: "run_terminal",
            toolCallId: "tc1",
            input: {},
            errorText: "Command failed",
            state: "output-error" as const,
          },
        ],
      },
    ];
    const result = toDownloadableMessages(messages);
    expect(result[0].content).toContain("Error: Command failed");
  });

  it("formats browser_control tool with actions and result", () => {
    const messages = [
      {
        id: "1",
        role: "assistant" as const,
        parts: [
          {
            type: "dynamic-tool" as const,
            toolName: "browser_control",
            toolCallId: "tc1",
            input: {
              actions: [
                { action: "navigate" as const, url: "https://example.com" },
                { action: "click" as const, x: 10, y: 20 },
                { action: "type" as const, text: "hello" },
              ],
            },
            output: { ok: true, url: "https://example.com" },
            state: "output-available" as const,
          },
        ],
      },
    ];
    const result = toDownloadableMessages(messages);
    expect(result[0].content).toContain("**Browser:**");
    expect(result[0].content).toContain("Navigate to https://example.com");
    expect(result[0].content).toContain("Click at (10, 20)");
    expect(result[0].content).toContain('Type "hello"');
    expect(result[0].content).toContain("Done, URL: https://example.com");
  });

  it("formats apply_file_patch tool output", () => {
    const messages = [
      {
        id: "1",
        role: "assistant" as const,
        parts: [
          {
            type: "dynamic-tool" as const,
            toolName: "apply_file_patch",
            toolCallId: "tc1",
            input: {},
            output: {
              status: "applied",
              files_changed: ["a.ts", "b.ts"],
              rejected_ops: [{ path: "c.ts", reason: "conflict" }],
            },
            state: "output-available" as const,
          },
        ],
      },
    ];
    const result = toDownloadableMessages(messages);
    expect(result[0].content).toContain("**File patch:**");
    expect(result[0].content).toContain("status: applied");
    expect(result[0].content).toContain("files: a.ts, b.ts");
    expect(result[0].content).toContain("rejected: c.ts: conflict");
  });

  it("formats unknown tool with input preview", () => {
    const messages = [
      {
        id: "1",
        role: "assistant" as const,
        parts: [
          {
            type: "dynamic-tool" as const,
            toolName: "custom_tool",
            toolCallId: "tc1",
            input: { foo: "bar" },
            output: {},
            state: "output-available" as const,
          },
        ],
      },
    ];
    const result = toDownloadableMessages(messages);
    expect(result[0].content).toContain("**custom_tool:**");
    expect(result[0].content).toContain('{"foo":"bar"}');
  });
});
