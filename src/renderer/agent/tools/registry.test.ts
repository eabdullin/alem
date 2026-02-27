import { describe, it, expect } from "vitest";
import {
  getToolDefinitions,
  getToolDefinition,
  getToolDisplay,
  getToolSetForProvider,
} from "./registry";

describe("tools registry", () => {
  describe("getToolDefinitions", () => {
    it("returns array of tool definitions", () => {
      const defs = getToolDefinitions();
      expect(Array.isArray(defs)).toBe(true);
      expect(defs.length).toBeGreaterThan(0);
    });

    it("each definition has id, displayToolIds, getToolSet, Display", () => {
      const defs = getToolDefinitions();
      for (const def of defs) {
        expect(def).toHaveProperty("id");
        expect(def).toHaveProperty("displayToolIds");
        expect(Array.isArray(def.displayToolIds)).toBe(true);
        expect(typeof def.getToolSet).toBe("function");
        expect(def.Display).toBeDefined();
      }
    });
  });

  describe("getToolDefinition", () => {
    it("returns definition for known tool name", () => {
      const def = getToolDefinition("web_search");
      expect(def).toBeDefined();
      expect(def?.id).toBe("web-search");
    });

    it("returns definition for google_search", () => {
      const def = getToolDefinition("google_search");
      expect(def).toBeDefined();
      expect(def?.id).toBe("web-search");
    });

    it("returns definition for run_terminal", () => {
      const def = getToolDefinition("run_terminal");
      expect(def).toBeDefined();
      expect(def?.id).toBe("terminal");
    });

    it("returns undefined for unknown tool", () => {
      expect(getToolDefinition("unknown_tool_xyz")).toBeUndefined();
    });
  });

  describe("getToolDisplay", () => {
    it("returns Display component for known tool", () => {
      const Display = getToolDisplay("web_search");
      expect(Display).toBeDefined();
      expect(typeof Display).toBe("function");
    });

    it("returns undefined for unknown tool", () => {
      expect(getToolDisplay("unknown_tool_xyz")).toBeUndefined();
    });
  });

  describe("getToolSetForProvider", () => {
    it("returns ToolSet object for openai", () => {
      const toolSet = getToolSetForProvider("openai", "test-key");
      expect(toolSet).toBeDefined();
      expect(typeof toolSet).toBe("object");
      expect(toolSet.run_terminal).toBeDefined();
      expect(toolSet.web_search).toBeDefined();
    });

    it("returns only web_search for xai (XAI_WEB_SEARCH_ONLY)", () => {
      const toolSet = getToolSetForProvider("xai", "test-key");
      expect(toolSet.web_search).toBeDefined();
      expect(toolSet.run_terminal).toBeUndefined();
      expect(toolSet.browser_control).toBeUndefined();
    });

    it("returns full tool set for anthropic", () => {
      const toolSet = getToolSetForProvider("anthropic", "test-key");
      expect(toolSet.run_terminal).toBeDefined();
      expect(toolSet.web_search).toBeDefined();
    });
  });
});
