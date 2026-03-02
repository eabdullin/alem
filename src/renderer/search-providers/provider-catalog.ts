import type {
  SearchProviderInfo,
  SearchProviderId,
} from "@/shared/search-providers/types";

export const ALL_SEARCH_PROVIDER_INFOS: Record<SearchProviderId, SearchProviderInfo> = {
  brave: {
    id: "brave",
    name: "Brave Search",
    description: "Privacy-first web search. Requires API key.",
    apiKeyUrl: "https://api.search.brave.com/app/documentation",
    needsApiKey: true,
  },
  exa: {
    id: "exa",
    name: "Exa AI",
    description: "AI-powered semantic search. Requires API key.",
    apiKeyUrl: "https://dashboard.exa.ai/api-keys",
    needsApiKey: true,
  },
  "duckduckgo-browser": {
    id: "duckduckgo-browser",
    name: "DuckDuckGo (Browser)",
    description:
      "DuckDuckGo via browser. No API key.",
    needsApiKey: false,
  },
};

const VISIBLE_SEARCH_PROVIDER_IDS: SearchProviderId[] = [
  "duckduckgo-browser",
  "brave",
  "exa",
];

export function getVisibleSearchProviderInfos(): SearchProviderInfo[] {
  return VISIBLE_SEARCH_PROVIDER_IDS.map((id) => ALL_SEARCH_PROVIDER_INFOS[id]);
}

export function getSearchProviderInfoById(
  id: SearchProviderId
): SearchProviderInfo | undefined {
  return ALL_SEARCH_PROVIDER_INFOS[id];
}
