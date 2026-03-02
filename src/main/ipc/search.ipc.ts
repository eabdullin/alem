import { ipcMain } from "electron";
import { getStore } from "../services/appStore";
import { createSearchProvider, searchProviderNeedsApiKey } from "../search-providers/provider-factory";
import { IPC_CHANNELS } from "../../shared/ipc/channels";

export function registerSearchIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.SEARCH_WEB,
    async (
      _event,
      input: { query: string; providerId: string }
    ): Promise<{ results: Array<{ url: string; title?: string; snippet?: string }> }> => {
      const { query, providerId: rawProviderId } = input;
      if (!query?.trim()) {
        return { results: [] };
      }
      const providerId =
        rawProviderId === "google-browser" || rawProviderId === "duckduckgo"
          ? "duckduckgo-browser"
          : rawProviderId;

      let apiKey: string | undefined;
      if (searchProviderNeedsApiKey(providerId as "brave" | "exa")) {
        const store = getStore();
        const keys = store.get("apiKeys", {}) as Record<string, string>;
        const keyId = providerId === "brave" ? "search-brave" : "search-exa";
        apiKey = keys[keyId];
      }

      const provider = createSearchProvider(
        providerId as "duckduckgo-browser" | "brave" | "exa",
        apiKey
      );
      const results = await provider.executeSearch(query.trim());
      return { results };
    }
  );
}
