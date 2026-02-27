import { describe, it, expect } from "vitest";
import { parseWebSearchOutput } from "./parse-web-search-output";

describe("parseWebSearchOutput", () => {
  it("returns empty array for null or undefined", () => {
    expect(parseWebSearchOutput("any", null)).toEqual([]);
    expect(parseWebSearchOutput("any", undefined)).toEqual([]);
  });

  it("parses Anthropic format: array of { url, title }", () => {
    const output = [
      { url: "https://a.com", title: "Site A" },
      { url: "https://b.com", title: "Site B" },
    ];
    expect(parseWebSearchOutput("web_search", output)).toEqual([
      { url: "https://a.com", title: "Site A", snippet: undefined },
      { url: "https://b.com", title: "Site B", snippet: undefined },
    ]);
  });

  it("parses Anthropic format with uri instead of url", () => {
    const output = [{ uri: "https://c.com", name: "Site C" }];
    expect(parseWebSearchOutput("web_search", output)).toEqual([
      { url: "https://c.com", title: "Site C", snippet: undefined },
    ]);
  });

  it("parses OpenAI format: sources array with type url", () => {
    const output = {
      action: "search",
      sources: [
        { type: "url", url: "https://openai.com" },
        { type: "api", name: "API Source" },
      ],
    };
    expect(parseWebSearchOutput("web_search", output)).toEqual([
      { url: "https://openai.com", title: undefined, snippet: undefined },
      { url: "", title: "API Source", snippet: undefined },
    ]);
  });

  it("parses xAI format: sources with title, url, snippet", () => {
    const output = {
      sources: [
        { url: "https://x.ai", title: "xAI", snippet: "AI company" },
      ],
    };
    expect(parseWebSearchOutput("web_search", output)).toEqual([
      { url: "https://x.ai", title: "xAI", snippet: "AI company" },
    ]);
  });

  it("parses Google format: groundingMetadata.groundingChunks", () => {
    const output = {
      groundingMetadata: {
        groundingChunks: [
          { web: { uri: "https://google.com", title: "Google" } },
        ],
      },
    };
    expect(parseWebSearchOutput("google_search", output)).toEqual([
      { url: "https://google.com", title: "Google", snippet: undefined },
    ]);
  });

  it("parses generic results/items array", () => {
    const output = {
      results: [
        { url: "https://r.com", title: "R", snippet: "Snippet" },
        { link: "https://l.com", description: "Desc" },
      ],
    };
    expect(parseWebSearchOutput("search", output)).toEqual([
      { url: "https://r.com", title: "R", snippet: "Snippet" },
      { url: "https://l.com", title: undefined, snippet: "Desc" },
    ]);
  });

  it("skips invalid items", () => {
    const output = [
      { url: "https://valid.com" },
      null,
      {},
      { title: "No URL" },
    ];
    expect(parseWebSearchOutput("search", output)).toEqual([
      { url: "https://valid.com", title: undefined, snippet: undefined },
    ]);
  });
});
