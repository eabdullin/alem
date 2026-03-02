import { useState, useEffect, useContext, useRef } from "react";
import { QurtContext } from "@/App";
import { getVisibleSearchProviderInfos } from "@/search-providers/provider-catalog";
import type { SearchProviderId } from "@/shared/search-providers/types";

const SEARCH_API_KEY_IDS: Record<SearchProviderId, string> = {
  "duckduckgo-browser": "",
  brave: "search-brave",
  exa: "search-exa",
};

const SearchProviders = () => {
  const { settings, updateSettings } = useContext(QurtContext);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [tempKey, setTempKey] = useState("");

  const providers = getVisibleSearchProviderInfos();
  const rawProvider =
    (settings?.activeSearchProvider as string) ?? "duckduckgo-browser";
  const activeSearchProvider: SearchProviderId =
    rawProvider === "google-browser" || rawProvider === "duckduckgo"
      ? "duckduckgo-browser"
      : (rawProvider as SearchProviderId);

  useEffect(() => {
    if (window.qurt) {
      window.qurt.getAllApiKeys().then(setApiKeys);
    }
  }, []);

  const migratedRef = useRef(false);
  useEffect(() => {
    if (
      !migratedRef.current &&
      (rawProvider === "google-browser" || rawProvider === "duckduckgo") &&
      settings
    ) {
      migratedRef.current = true;
      updateSettings({ ...settings, activeSearchProvider: "duckduckgo-browser" });
    }
  }, [rawProvider, settings, updateSettings]);

  const handleSaveKey = async (providerId: SearchProviderId) => {
    const keyId = SEARCH_API_KEY_IDS[providerId];
    if (!keyId || !window.qurt) return;
    await window.qurt.saveApiKey(keyId, tempKey);
    setApiKeys((prev) => ({ ...prev, [keyId]: tempKey }));
    setEditingProvider(null);
    setTempKey("");
  };

  const handleSelectProvider = async (providerId: SearchProviderId) => {
    await updateSettings({ ...settings, activeSearchProvider: providerId });
  };

  const getApiKeyForProvider = (providerId: SearchProviderId): string => {
    const keyId = SEARCH_API_KEY_IDS[providerId];
    return keyId ? (apiKeys[keyId] ?? "") : "";
  };

  const isConfigured = (providerId: SearchProviderId): boolean => {
    if (providerId === "duckduckgo-browser")
      return true;
    return !!getApiKeyForProvider(providerId);
  };

  return (
    <div>
      <div className="mb-8">
        <div className="h5 mb-1">Search Providers</div>
        <p className="base2 text-n-4">
          Choose which search provider to use for web search.           DuckDuckGo (Browser) works without an API key. Brave and Exa require API
          keys.
        </p>
      </div>

      <div className="space-y-4">
        {providers.map((provider) => {
          const configured = isConfigured(provider.id);
          const isActive = activeSearchProvider === provider.id;
          const canSelect =
            provider.id === "duckduckgo-browser" ||
            configured;

          return (
            <div
              key={provider.id}
              className={`p-5 rounded-xl border-2 transition-colors ${
                configured || editingProvider === provider.id
                  ? "border-n-3 dark:border-n-5"
                  : "border-n-3 dark:border-n-5 opacity-70"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-semibold base2">{provider.name}</span>
                  {configured && (
                    <span className="px-2 py-0.5 rounded-md bg-primary-2/10 text-primary-2 caption1">
                      Connected
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {provider.needsApiKey && (
                    <button
                      className="btn-stroke-light btn-small"
                      onClick={() => {
                        setEditingProvider(provider.id);
                        setTempKey(getApiKeyForProvider(provider.id));
                      }}
                    >
                      {configured ? "Edit Key" : "Add Key"}
                    </button>
                  )}
                  <button
                    className={`btn-small ${
                      isActive
                        ? "btn-blue"
                        : canSelect
                          ? "btn-stroke-light"
                          : "btn-stroke-light opacity-50 cursor-not-allowed"
                    }`}
                    onClick={() => canSelect && handleSelectProvider(provider.id)}
                    disabled={!canSelect}
                  >
                    {isActive ? "Active" : "Use"}
                  </button>
                </div>
              </div>
              <p className="caption1 text-n-4 mb-3">{provider.description}</p>
              {provider.apiKeyUrl && (
                <a
                  href={provider.apiKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    if (provider.apiKeyUrl) {
                      window.qurt?.openExternal(provider.apiKeyUrl);
                    }
                  }}
                  className="caption1 text-primary-1 hover:underline mb-3 inline-block"
                >
                  Get API key →
                </a>
              )}

              {editingProvider === provider.id && (
                <div className="flex gap-2 mb-3">
                  <input
                    className="grow h-10 px-4 bg-n-2 border-2 border-transparent rounded-lg outline-none base2 text-n-7 transition-colors placeholder:text-n-4 focus:border-primary-1 dark:bg-n-7 dark:text-n-1"
                    type="password"
                    placeholder="Enter API key..."
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    autoFocus
                  />
                  <button
                    className="btn-blue btn-small"
                    onClick={() => handleSaveKey(provider.id)}
                  >
                    Save
                  </button>
                  <button
                    className="btn-stroke-light btn-small"
                    onClick={() => {
                      setEditingProvider(null);
                      setTempKey("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SearchProviders;
