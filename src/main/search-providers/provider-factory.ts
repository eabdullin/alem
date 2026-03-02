import type { SearchProvider, SearchProviderId } from "../../shared/search-providers/types";
import { BraveSearchProvider } from "./brave-search-provider";
import { ExaSearchProvider } from "./exa-search-provider";
import { DuckDuckGoBrowserSearchProvider } from "./duckduckgo-browser-search-provider";

const API_KEY_PROVIDERS: SearchProviderId[] = ["brave", "exa"];

export function createSearchProvider(
  id: SearchProviderId,
  apiKey?: string
): SearchProvider {
  switch (id) {
    case "duckduckgo-browser":
      return new DuckDuckGoBrowserSearchProvider();
    case "brave":
      if (!apiKey?.trim()) {
        throw new Error("Brave Search API key is required.");
      }
      return new BraveSearchProvider(apiKey);
    case "exa":
      if (!apiKey?.trim()) {
        throw new Error("Exa API key is required.");
      }
      return new ExaSearchProvider(apiKey);
    default:
      throw new Error(`Unknown search provider: ${id}`);
  }
}

export function searchProviderNeedsApiKey(id: SearchProviderId): boolean {
  return API_KEY_PROVIDERS.includes(id);
}
