import { describe, it, expect } from "vitest";
import { settings } from "./settings";

describe("settings", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(settings)).toBe(true);
    expect(settings.length).toBeGreaterThan(0);
  });

  it("each item has id, title, and icon", () => {
    for (const item of settings) {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("icon");
      expect(typeof item.id).toBe("string");
      expect(typeof item.title).toBe("string");
      expect(typeof item.icon).toBe("string");
    }
  });

  it("includes ai-providers and terminal", () => {
    const ids = settings.map((s) => s.id);
    expect(ids).toContain("ai-providers");
    expect(ids).toContain("terminal");
    expect(ids).toContain("appearance");
    expect(ids).toContain("help");
  });
});
