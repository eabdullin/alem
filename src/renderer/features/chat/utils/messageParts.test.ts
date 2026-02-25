import { describe, it, expect } from "vitest";
import {
  getTextFromParts,
  getAttachmentIdFromUrl,
  getToolPartName,
  getToolStepStatus,
} from "./messageParts";

describe("getTextFromParts", () => {
  it("returns empty string for empty parts", () => {
    expect(getTextFromParts([])).toBe("");
  });

  it("extracts and joins text from text parts", () => {
    const parts = [
      { type: "text" as const, text: "Hello " },
      { type: "text" as const, text: "world" },
    ];
    expect(getTextFromParts(parts)).toBe("Hello world");
  });

  it("ignores non-text parts", () => {
    const parts = [
      { type: "text" as const, text: "Hi" },
      { type: "reasoning" as const, text: "thinking...", state: "done" as const },
    ];
    expect(getTextFromParts(parts)).toBe("Hi");
  });
});

describe("getAttachmentIdFromUrl", () => {
  it("extracts id from alem-attachment URL", () => {
    expect(getAttachmentIdFromUrl("alem-attachment://abc123")).toBe("abc123");
  });

  it("returns undefined for non-prefix URL", () => {
    expect(getAttachmentIdFromUrl("data:image/png;base64,xxx")).toBeUndefined();
    expect(getAttachmentIdFromUrl("https://example.com/file")).toBeUndefined();
  });

  it("returns empty string when URL is only prefix", () => {
    expect(getAttachmentIdFromUrl("alem-attachment://")).toBe("");
  });
});

describe("getToolPartName", () => {
  it("returns toolName for dynamic-tool part", () => {
    const part = {
      type: "dynamic-tool" as const,
      toolName: "apply_file_patch",
      toolCallId: "tc-1",
      state: "output-available" as const,
      input: {},
      output: "",
    };
    expect(getToolPartName(part)).toBe("apply_file_patch");
  });

  it("returns name for tool-* part", () => {
    const part = {
      type: "tool-run_terminal" as const,
      toolCallId: "tc-1",
      state: "output-available" as const,
      input: {},
      output: "",
    };
    expect(getToolPartName(part)).toBe("run_terminal");
  });

  it("returns empty string for non-tool part", () => {
    const part = { type: "text" as const, text: "x" };
    expect(getToolPartName(part)).toBe("");
  });
});

describe("getToolStepStatus", () => {
  it("returns complete when part has output-available state", () => {
    const part = {
      type: "dynamic-tool" as const,
      toolName: "x",
      toolCallId: "tc-1",
      state: "output-available" as const,
      input: {},
      output: "",
    };
    expect(getToolStepStatus(part)).toBe("complete");
  });

  it("returns active for input-streaming", () => {
    const part = {
      type: "dynamic-tool" as const,
      toolName: "x",
      toolCallId: "tc-1",
      state: "input-streaming" as const,
      input: {},
    };
    expect(getToolStepStatus(part)).toBe("active");
  });

  it("returns active for approval-requested", () => {
    const part = {
      type: "dynamic-tool" as const,
      toolName: "x",
      toolCallId: "tc-1",
      state: "approval-requested" as const,
      approval: { id: "a" },
      input: {},
    };
    expect(getToolStepStatus(part)).toBe("active");
  });

  it("returns pending for approval-responded", () => {
    const part = {
      type: "dynamic-tool" as const,
      toolName: "x",
      toolCallId: "tc-1",
      state: "approval-responded" as const,
      approval: { id: "a", approved: true as const },
      input: {},
    };
    expect(getToolStepStatus(part)).toBe("pending");
  });

  it("returns complete for output-available state", () => {
    const part = {
      type: "dynamic-tool" as const,
      toolName: "x",
      toolCallId: "tc-1",
      state: "output-available" as const,
      input: {},
      output: "",
    };
    expect(getToolStepStatus(part)).toBe("complete");
  });
});
