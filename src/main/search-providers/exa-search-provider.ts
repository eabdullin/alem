import Exa from "exa-js";
import { BaseSearchProvider } from "./base-search-provider";
import type { SearchResult } from "../../shared/search-providers/types";

export class ExaSearchProvider extends BaseSearchProvider {
  readonly id = "exa" as const;

  constructor(private readonly apiKey: string) {
    super();
  }

  async executeSearch(query: string): Promise<SearchResult[]> {
    const exa = new Exa(this.apiKey);
    const response = await exa.search(query, { numResults: 10 });
    const results = response.results ?? [];
    return results.map((r) => ({
      url: r.url,
      title: r.title ?? undefined,
      snippet: undefined,
    }));
  }
}
