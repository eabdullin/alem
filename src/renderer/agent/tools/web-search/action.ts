import type { ToolSet } from "ai";
import { tool, zodSchema } from "ai";
import { z } from "zod";
import type { ToolSetOptions } from "../types";

const webSearchInputSchema = z.object({
  query: z.string().describe("Search query for the web"),
});

const description = `Search the web for live or recent information. Use when the user asks about current events, facts, or content that may change. Provide a clear search query.`;

export function getWebSearchToolSet(
  options?: ToolSetOptions
): ToolSet {
  const searchProviderId = options?.searchProviderId ?? "duckduckgo-browser";

  return {
    web_search: tool({
      description,
      inputSchema: zodSchema(webSearchInputSchema),
      execute: async (input) => {
        if (typeof window === "undefined" || !window.qurt?.searchWeb) {
          return { results: [], error: "Web search is not available." };
        }
        try {
          const { results } = await window.qurt.searchWeb({
            query: input.query,
            providerId: searchProviderId,
          });
          return { results };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return { results: [], error: message };
        }
      },
    }),
  };
}
