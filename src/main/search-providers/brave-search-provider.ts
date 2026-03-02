import { BaseSearchProvider } from "./base-search-provider";
import type { SearchResult } from "../../shared/search-providers/types";

const BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search";

export class BraveSearchProvider extends BaseSearchProvider {
  readonly id = "brave" as const;

  constructor(private readonly apiKey: string) {
    super();
  }

  async executeSearch(query: string): Promise<SearchResult[]> {
    const url = new URL(BRAVE_SEARCH_URL);
    url.searchParams.set("q", query);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Brave Search API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      web?: { results?: Array<{ url?: string; title?: string; description?: string }> };
    };

    const results = data.web?.results ?? [];
    return results.map((r) => ({
      url: r.url ?? "",
      title: r.title,
      snippet: r.description,
    }));
  }
}
