import type { ToolSet } from "ai";
import { tool, zodSchema } from "ai";
import { z } from "zod";

const fetchUrlInputSchema = z.object({
  url: z.string().url().describe("The URL to fetch (http or https only)"),
});

const description = `Fetch the content of a web page by URL. Returns the main text content as Markdown. Use when you need to read the contents of a specific URL (article, documentation, etc.). Only http and https URLs are supported.`;

export function getFetchToolSet(): ToolSet {
  return {
    web_fetch: tool({
      description,
      inputSchema: zodSchema(fetchUrlInputSchema),
      execute: async (input) => {
        if (typeof window === "undefined" || !window.qurt?.fetchUrl) {
          return {
            content: "",
            url: input.url,
            error: "URL fetch is not available.",
          };
        }
        try {
          return await window.qurt.fetchUrl({ url: input.url });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return { content: "", url: input.url, error: message };
        }
      },
    }),
  };
}
