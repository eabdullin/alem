import { describe, it, expect } from "vitest";
import { urlToDomain } from "./url-to-domain";

describe("urlToDomain", () => {
  it("extracts domain from full URL", () => {
    expect(urlToDomain("https://www.example.com/path")).toBe("www.example.com");
    expect(urlToDomain("https://github.com/user/repo")).toBe("github.com");
    expect(urlToDomain("http://sub.domain.co.uk/page")).toBe("sub.domain.co.uk");
  });

  it("handles URL without protocol by prepending https", () => {
    expect(urlToDomain("www.x.com")).toBe("www.x.com");
    expect(urlToDomain("example.com")).toBe("example.com");
  });

  it("returns empty string for empty input", () => {
    expect(urlToDomain("")).toBe("");
  });

  it("returns original string when URL parsing fails", () => {
    expect(urlToDomain("not-a-valid-url!!!")).toBe("not-a-valid-url!!!");
  });

  it("handles non-string input by returning empty string", () => {
    // @ts-expect-error testing runtime behavior
    expect(urlToDomain(null)).toBe("");
    // @ts-expect-error testing runtime behavior
    expect(urlToDomain(undefined)).toBe("");
  });
});
