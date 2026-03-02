export type SearchProviderId = "duckduckgo-browser" | "brave" | "exa";

export interface SearchResult {
  url: string;
  title?: string;
  snippet?: string;
}

export interface SearchProvider {
  readonly id: SearchProviderId;
  executeSearch(query: string): Promise<SearchResult[]>;
}

export interface SearchProviderInfo {
  id: SearchProviderId;
  name: string;
  description: string;
  apiKeyUrl?: string;
  logoPath?: string;
  /** Whether this provider requires an API key. */
  needsApiKey: boolean;
}
