import { describe, it, expect } from "vitest";
import {
  extractBrowserHosts,
  shouldAutoApprove,
  addToolToChatRules,
  addHostToBrowserAllowlist,
} from "./tool-approval-service";

describe("extractBrowserHosts", () => {
  it("returns empty for null/undefined", () => {
    expect(extractBrowserHosts(null)).toEqual([]);
    expect(extractBrowserHosts(undefined)).toEqual([]);
  });

  it("returns empty for non-object input", () => {
    expect(extractBrowserHosts("")).toEqual([]);
    expect(extractBrowserHosts(123)).toEqual([]);
  });

  it("returns empty when actions missing", () => {
    expect(extractBrowserHosts({})).toEqual([]);
  });

  it("extracts host from navigate action", () => {
    expect(
      extractBrowserHosts({
        actions: [{ action: "navigate", url: "https://example.com/page" }],
      }),
    ).toEqual(["example.com"]);
  });

  it("extracts host from open action with url", () => {
    expect(
      extractBrowserHosts({
        actions: [{ action: "open", url: "https://github.com" }],
      }),
    ).toEqual(["github.com"]);
  });

  it("ignores open without url", () => {
    expect(
      extractBrowserHosts({
        actions: [{ action: "open" }],
      }),
    ).toEqual([]);
  });

  it("ignores click, type, scroll, wait, close", () => {
    expect(
      extractBrowserHosts({
        actions: [
          { action: "click", x: 10, y: 20 },
          { action: "type", text: "hello" },
          { action: "scroll", direction: "down" },
          { action: "wait", seconds: 1 },
          { action: "close" },
        ],
      }),
    ).toEqual([]);
  });

  it("extracts multiple unique hosts", () => {
    expect(
      extractBrowserHosts({
        actions: [
          { action: "navigate", url: "https://a.com" },
          { action: "navigate", url: "https://b.com" },
          { action: "navigate", url: "https://a.com/other" },
        ],
      }),
    ).toEqual(["a.com", "b.com"]);
  });

  it("handles url without protocol", () => {
    expect(
      extractBrowserHosts({
        actions: [{ action: "navigate", url: "example.com" }],
      }),
    ).toEqual(["example.com"]);
  });
});

describe("shouldAutoApprove", () => {
  it("returns true when chat scope is all", () => {
    expect(
      shouldAutoApprove({
        toolName: "run_terminal",
        input: {},
        chatId: "c1",
        chatRules: { scope: "all" },
        browserAllowedHosts: [],
      }),
    ).toBe(true);
  });

  it("returns true when chat scope is tools and tool is in list", () => {
    expect(
      shouldAutoApprove({
        toolName: "apply_file_patch",
        input: {},
        chatId: "c1",
        chatRules: { scope: "tools", toolIds: ["apply_file_patch", "run_terminal"] },
        browserAllowedHosts: [],
      }),
    ).toBe(true);
  });

  it("returns false when chat scope is tools and tool not in list", () => {
    expect(
      shouldAutoApprove({
        toolName: "browser_control",
        input: {},
        chatId: "c1",
        chatRules: { scope: "tools", toolIds: ["apply_file_patch"] },
        browserAllowedHosts: [],
      }),
    ).toBe(false);
  });

  it("returns false when no rules", () => {
    expect(
      shouldAutoApprove({
        toolName: "run_terminal",
        input: {},
        chatId: "c1",
        chatRules: undefined,
        browserAllowedHosts: [],
      }),
    ).toBe(false);
  });

  it("returns true for browser when all hosts in allowlist", () => {
    expect(
      shouldAutoApprove({
        toolName: "browser_control",
        input: {
          actions: [{ action: "navigate", url: "https://example.com" }],
        },
        chatId: "c1",
        chatRules: undefined,
        browserAllowedHosts: ["example.com"],
      }),
    ).toBe(true);
  });

  it("returns false for browser when host not in allowlist", () => {
    expect(
      shouldAutoApprove({
        toolName: "browser_control",
        input: {
          actions: [{ action: "navigate", url: "https://other.com" }],
        },
        chatId: "c1",
        chatRules: undefined,
        browserAllowedHosts: ["example.com"],
      }),
    ).toBe(false);
  });

  it("returns false for browser with no URL actions even if allowlist has hosts", () => {
    expect(
      shouldAutoApprove({
        toolName: "browser_control",
        input: {
          actions: [{ action: "click", x: 10, y: 20 }],
        },
        chatId: "c1",
        chatRules: undefined,
        browserAllowedHosts: ["example.com"],
      }),
    ).toBe(false);
  });

  it("returns false when one of multiple hosts not in allowlist", () => {
    expect(
      shouldAutoApprove({
        toolName: "browser_control",
        input: {
          actions: [
            { action: "navigate", url: "https://a.com" },
            { action: "navigate", url: "https://b.com" },
          ],
        },
        chatId: "c1",
        chatRules: undefined,
        browserAllowedHosts: ["a.com"],
      }),
    ).toBe(false);
  });
});

describe("addToolToChatRules", () => {
  it("creates tools rule when current is undefined", () => {
    expect(addToolToChatRules(undefined, "run_terminal")).toEqual({
      scope: "tools",
      toolIds: ["run_terminal"],
    });
  });

  it("adds to existing tools list", () => {
    expect(
      addToolToChatRules(
        { scope: "tools", toolIds: ["apply_file_patch"] },
        "run_terminal",
      ),
    ).toEqual({
      scope: "tools",
      toolIds: ["apply_file_patch", "run_terminal"],
    });
  });

  it("does not duplicate tool", () => {
    expect(
      addToolToChatRules(
        { scope: "tools", toolIds: ["run_terminal"] },
        "run_terminal",
      ),
    ).toEqual({
      scope: "tools",
      toolIds: ["run_terminal"],
    });
  });

  it("returns current when scope is all", () => {
    expect(addToolToChatRules({ scope: "all" }, "run_terminal")).toEqual({
      scope: "all",
    });
  });
});

describe("addHostToBrowserAllowlist", () => {
  it("adds host to empty list", () => {
    expect(addHostToBrowserAllowlist([], "example.com")).toEqual([
      "example.com",
    ]);
  });

  it("adds host to existing list", () => {
    expect(
      addHostToBrowserAllowlist(["a.com"], "b.com"),
    ).toEqual(["a.com", "b.com"]);
  });

  it("does not duplicate host", () => {
    expect(
      addHostToBrowserAllowlist(["example.com"], "example.com"),
    ).toEqual(["example.com"]);
  });

  it("trims and lowercases host", () => {
    expect(
      addHostToBrowserAllowlist([], "  EXAMPLE.COM  "),
    ).toEqual(["example.com"]);
  });

  it("returns current for empty trimmed host", () => {
    expect(addHostToBrowserAllowlist(["a.com"], "  ")).toEqual(["a.com"]);
  });
});
