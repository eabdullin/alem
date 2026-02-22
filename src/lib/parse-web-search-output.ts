/**
 * Parsed search result for display in ChainOfThoughtSearchResults.
 * Provider-agnostic shape after normalizing OpenAI, Anthropic, and Google outputs.
 */
export interface ParsedSearchResult {
  url: string;
  title?: string;
  snippet?: string;
}

/**
 * Normalize web search tool output from different providers into a common list
 * of { url, title?, snippet? } for use with ChainOfThoughtSearchResults.
 *
 * - OpenAI web_search: output.sources (array of { type: 'url', url } or { type: 'api', name })
 * - Anthropic web_search_20250305: output is array of { url, title, ... }
 * - Google google_search: groundingMetadata.groundingChunks with web.uri / web.title
 */
export function parseWebSearchOutput(
  _toolName: string,
  output: unknown
): ParsedSearchResult[] {
  if (output == null) return [];

  const out: ParsedSearchResult[] = [];

  // Anthropic: array of { type: 'web_search_result', url, title, pageAge, encryptedContent }
  if (Array.isArray(output)) {
    for (const item of output) {
      if (typeof item !== "object" || item === null) continue;
      const o = item as Record<string, unknown>;
      const url =
        typeof o.url === "string"
          ? o.url
          : typeof (o as { uri?: string }).uri === "string"
            ? (o as { uri: string }).uri
            : undefined;
      if (!url) continue;
      const title =
        typeof o.title === "string"
          ? o.title
          : typeof (o as { name?: string }).name === "string"
            ? (o as { name: string }).name
            : undefined;
      out.push({ url, title: title || undefined, snippet: undefined });
    }
    if (out.length > 0) return out;
  }

  // Plain object
  if (typeof output !== "object") return [];

  const obj = output as Record<string, unknown>;

  // OpenAI: { action, sources?: Array<{ type: 'url', url } | { type: 'api', name }> }
  const sources = obj.sources;
  if (Array.isArray(sources)) {
    for (const s of sources) {
      if (typeof s !== "object" || s === null) continue;
      const src = s as Record<string, unknown>;
      if (src.type === "url" && typeof src.url === "string") {
        out.push({ url: src.url, title: undefined, snippet: undefined });
      } else if (src.type === "api" && typeof src.name === "string") {
        out.push({ url: "", title: src.name, snippet: undefined });
      }
    }
    if (out.length > 0) return out;
  }

  // Google: groundingMetadata.groundingChunks or groundingChunks
  const groundingChunks =
    (obj.groundingChunks as Array<Record<string, unknown>> | undefined) ??
    (
      obj.groundingMetadata as {
        groundingChunks?: Array<Record<string, unknown>>;
      } | undefined
    )?.groundingChunks;

  if (Array.isArray(groundingChunks)) {
    for (const chunk of groundingChunks) {
      const web = chunk?.web as { uri?: string; title?: string } | undefined;
      if (web && typeof web.uri === "string") {
        out.push({
          url: web.uri,
          title: typeof web.title === "string" ? web.title : undefined,
          snippet: undefined,
        });
      }
    }
    if (out.length > 0) return out;
  }

  // Generic: object with results / items array of { url, title?, snippet? }
  const results =
    (obj.results as Array<Record<string, unknown>> | undefined) ??
    (obj.items as Array<Record<string, unknown>> | undefined) ??
    (obj.searchResults as Array<Record<string, unknown>> | undefined);

  if (Array.isArray(results)) {
    for (const r of results) {
      if (typeof r !== "object" || r === null) continue;
      const url =
        typeof r.url === "string"
          ? r.url
          : typeof (r as { link?: string }).link === "string"
            ? (r as { link: string }).link
            : typeof (r as { uri?: string }).uri === "string"
              ? (r as { uri: string }).uri
              : undefined;
      if (!url) continue;
      const title = typeof r.title === "string" ? r.title : undefined;
      const snippet =
        typeof r.snippet === "string"
          ? r.snippet
          : typeof (r as { description?: string }).description === "string"
            ? (r as { description: string }).description
            : undefined;
      out.push({
        url,
        title: title || undefined,
        snippet: snippet || undefined,
      });
    }
  }

  return out;
}
