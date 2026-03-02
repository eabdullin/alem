import { describe, it, expect } from "vitest";
import {
  getGeneralToolSet,
  getToolDefinitions,
  getToolDefinition,
  getToolDisplay,
} from "./registry";

describe("tools registry", () => {
  describe("getToolDefinitions", () => {
    it("returns array of tool definitions", () => {
      const defs = getToolDefinitions();
      expect(Array.isArray(defs)).toBe(true);
      expect(defs.length).toBeGreaterThan(0);
    });

    it("each definition has id, displayToolIds, Display", () => {
      const defs = getToolDefinitions();
      for (const def of defs) {
        expect(def).toHaveProperty("id");
        expect(def).toHaveProperty("displayToolIds");
        expect(Array.isArray(def.displayToolIds)).toBe(true);
        expect(def.Display).toBeDefined();
      }
    });

    it("web-search has getToolSet", () => {
      const defs = getToolDefinitions();
      const webSearch = defs.find((d) => d.id === "web-search");
      expect(webSearch).toBeDefined();
      expect(webSearch?.getToolSet).toBeDefined();
    });

    it("fetch has getToolSet", () => {
      const defs = getToolDefinitions();
      const fetch = defs.find((d) => d.id === "fetch");
      expect(fetch).toBeDefined();
      expect(fetch?.getToolSet).toBeDefined();
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

    it("returns definition for web_fetch", () => {
      const def = getToolDefinition("web_fetch");
      expect(def).toBeDefined();
      expect(def?.id).toBe("fetch");
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

  describe("getGeneralToolSet", () => {
    it("returns local tool set", () => {
      const toolSet = getGeneralToolSet();
      expect(toolSet).toBeDefined();
      expect(typeof toolSet).toBe("object");
      expect(toolSet.web_search).toBeDefined();
      expect(toolSet.web_fetch).toBeDefined();
      expect(toolSet.run_terminal).toBeDefined();
      expect(toolSet.apply_file_patch).toBeDefined();
      expect(toolSet.browser_control).toBeDefined();
      expect(toolSet.memory).toBeDefined();
    });

    it("does not include provider-native google_search", () => {
      const toolSet = getGeneralToolSet();
      expect(toolSet.google_search).toBeUndefined();
    });
  });
});
