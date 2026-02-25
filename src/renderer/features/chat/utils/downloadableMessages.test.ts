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
        content: "Here is the answer.\n\nReasoning:\nLet me think...",
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

  it("includes tool serialization for tool parts", () => {
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
            output: "file1.txt",
            state: "output-available" as const,
          },
        ],
      },
    ];
    const result = toDownloadableMessages(messages);
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe("assistant");
    expect(result[0].content).toContain("Done.");
    expect(result[0].content).toContain("Tool run_terminal");
    expect(result[0].content).toContain("command");
    expect(result[0].content).toContain("ls");
    expect(result[0].content).toContain("Result: \"file1.txt\"");
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
});
