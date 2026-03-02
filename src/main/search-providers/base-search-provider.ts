import type {
  SearchProvider,
  SearchProviderId,
  SearchResult,
} from "../../shared/search-providers/types";

export abstract class BaseSearchProvider implements SearchProvider {
  abstract readonly id: SearchProviderId;

  abstract executeSearch(query: string): Promise<SearchResult[]>;
}
