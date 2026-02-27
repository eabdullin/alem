import { describe, it, expect } from "vitest";
import {
  getTextFromParts,
  getToolPartName,
  getToolStepStatus,
  getAttachmentIdFromUrl,
} from "./messageParts";

describe("getTextFromParts (shared)", () => {
  it("returns empty string for empty parts", () => {
    expect(getTextFromParts([])).toBe("");
  });

  it("extracts text from text parts", () => {
    const parts = [
      { type: "text" as const, text: "Hello " },
      { type: "text" as const, text: "world" },
    ];
    expect(getTextFromParts(parts)).toBe("Hello world");
  });
});

describe("getToolPartName (shared)", () => {
  it("returns toolName for dynamic-tool", () => {
    const part = {
      type: "dynamic-tool" as const,
      toolName: "run_terminal",
      toolCallId: "tc-1",
      state: "output-available" as const,
      input: {},
      output: "",
    };
    expect(getToolPartName(part)).toBe("run_terminal");
  });

  it("returns sliced name for tool-* type", () => {
    const part = {
      type: "tool-apply_file_patch" as const,
      toolCallId: "tc-1",
      state: "output-available" as const,
      input: {},
      output: "",
    };
    expect(getToolPartName(part)).toBe("apply_file_patch");
  });

  it("returns empty string for non-tool part", () => {
    expect(getToolPartName({ type: "text" as const, text: "x" })).toBe("");
  });
});

describe("getToolStepStatus (shared)", () => {
  it("returns complete when part has no state", () => {
    const part = { type: "text" as const, text: "x" };
    expect(getToolStepStatus(part)).toBe("complete");
  });

  it("returns active for input-available", () => {
    const part = {
      type: "dynamic-tool" as const,
      toolName: "x",
      toolCallId: "tc-1",
      state: "input-available" as const,
      input: {},
    };
    expect(getToolStepStatus(part)).toBe("active");
  });

  it("returns complete for default/unknown state", () => {
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

describe("getAttachmentIdFromUrl (shared)", () => {
  it("extracts id when url starts with prefix", () => {
    expect(getAttachmentIdFromUrl("custom://abc-123", "custom://")).toBe("abc-123");
  });

  it("returns undefined when url does not start with prefix", () => {
    expect(getAttachmentIdFromUrl("https://example.com", "qurt-attachment://")).toBeUndefined();
    expect(getAttachmentIdFromUrl("data:image/png;base64,x", "qurt-attachment://")).toBeUndefined();
  });

  it("returns empty string when url equals prefix", () => {
    expect(getAttachmentIdFromUrl("qurt-attachment://", "qurt-attachment://")).toBe("");
  });
});
