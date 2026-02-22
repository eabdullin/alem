/**
 * Shorten a URL to its display domain (e.g. www.x.com, github.com).
 * Used for web search result badges in Chain of Thought.
 */
export function urlToDomain(url: string): string {
  if (!url || typeof url !== "string") return "";
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = u.hostname;
    return host ? host : url;
  } catch {
    return url;
  }
}
