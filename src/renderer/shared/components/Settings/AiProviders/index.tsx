import { useState, useEffect, useContext, useMemo } from "react";
import { AlemContext } from "@/App";
import ProviderLogo from "@/components/ProviderLogos";
import { PROVIDERS, type ProviderInfo } from "@/constants/providers";

const AiProviders = () => {
  const { settings, updateSettings } = useContext(AlemContext);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [tempKey, setTempKey] = useState("");
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(
    new Set()
  );

  const enabledModels: Record<string, string[]> =
    settings?.enabledModels ?? {};

  const sortedProviders = useMemo(() => {
    const configured: ProviderInfo[] = [];
    const notConfigured: ProviderInfo[] = [];
    for (const p of PROVIDERS) {
      if (apiKeys[p.id]) configured.push(p);
      else notConfigured.push(p);
    }
    return [...configured, ...notConfigured];
  }, [apiKeys]);

  useEffect(() => {
    if (window.alem) {
      window.alem.getAllApiKeys().then(setApiKeys);
    }
  }, []);

  const handleSaveKey = async (providerId: string) => {
    if (window.alem) {
      await window.alem.saveApiKey(providerId, tempKey);
      setApiKeys((prev) => ({ ...prev, [providerId]: tempKey }));
    }
    setEditingProvider(null);
    setTempKey("");
  };

  const toggleModel = async (providerId: string, model: string) => {
    const current = enabledModels[providerId] || [];
    let next: string[];

    if (current.includes(model)) {
      next = current.filter((m) => m !== model);
    } else {
      next = [...current, model];
    }

    const newEnabled = { ...enabledModels, [providerId]: next };

    const isActiveModelRemoved =
      settings?.activeProvider === providerId &&
      settings?.activeModel === model &&
      !next.includes(model);

    let newSettings = { ...settings, enabledModels: newEnabled };

    if (isActiveModelRemoved) {
      const fallback = findFirstEnabled(newEnabled);
      if (fallback) {
        newSettings.activeProvider = fallback.provider;
        newSettings.activeModel = fallback.model;
      } else {
        newSettings.activeModel = "";
      }
    }

    await updateSettings(newSettings);
  };

  const findFirstEnabled = (
    enabled: Record<string, string[]>
  ): { provider: string; model: string } | null => {
    for (const provider of PROVIDERS) {
      const models = enabled[provider.id];
      if (models && models.length > 0) {
        return { provider: provider.id, model: models[0] };
      }
    }
    return null;
  };

  return (
    <div>
      <div className="mb-8">
        <div className="h5 mb-1">AI Providers</div>
        <p className="base2 text-n-4">
          Configure your API keys and select which models to make available.
        </p>
      </div>

      <div className="space-y-4">
        {sortedProviders.map((provider) => {
          const isConfigured = !!apiKeys[provider.id];
          const providerEnabled = enabledModels[provider.id] || [];
          const configuredModels = provider.models.filter((m) =>
            providerEnabled.includes(m.id)
          );
          const otherModels = provider.models.filter(
            (m) => !providerEnabled.includes(m.id)
          );
          const isExpanded = expandedProviders.has(provider.id);
          const hasHiddenModels = isConfigured
            ? otherModels.length > 0
            : provider.models.length > 0;
          const visibleModels = isConfigured
            ? isExpanded
              ? provider.models
              : configuredModels
            : isExpanded
              ? provider.models
              : [];

          const toggleExpanded = () => {
            setExpandedProviders((prev) => {
              const next = new Set(prev);
              if (next.has(provider.id)) next.delete(provider.id);
              else next.add(provider.id);
              return next;
            });
          };

          return (
            <div
              key={provider.id}
              className={`p-5 rounded-xl border-2 transition-colors ${
                isConfigured || editingProvider === provider.id
                  ? "border-n-3 dark:border-n-5"
                  : "border-n-3 dark:border-n-5 opacity-70"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <ProviderLogo providerId={provider.id} className="h-6" />
                  {isConfigured && (
                    <span className="px-2 py-0.5 rounded-md bg-primary-2/10 text-primary-2 caption1">
                      Connected
                    </span>
                  )}
                </div>
                <button
                  className="btn-stroke-light btn-small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingProvider(provider.id);
                    setTempKey(apiKeys[provider.id] || "");
                    if (!isConfigured) {
                      setExpandedProviders((prev) => new Set(prev).add(provider.id));
                    }
                  }}
                >
                  {isConfigured ? "Edit Key" : "Add Key"}
                </button>
              </div>
              <p className="caption1 text-n-4 mb-3">{provider.description}</p>
              {provider.apiKeyUrl && (
                <a
                  href={provider.apiKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    window.alem?.openExternal(provider.apiKeyUrl!);
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
                      if (!isConfigured) {
                        setExpandedProviders((prev) => {
                          const next = new Set(prev);
                          next.delete(provider.id);
                          return next;
                        });
                      }
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {visibleModels.map((model) => {
                  const isEnabled = providerEnabled.includes(model.id);
                  return (
                    <button
                      key={model.id}
                      className={`px-3 py-1.5 rounded-lg caption1 font-semibold transition-colors ${
                        isEnabled
                          ? "bg-primary-1 text-n-1"
                          : "bg-n-3 text-n-5 hover:bg-n-4/50 dark:bg-n-5 dark:text-n-3 dark:hover:bg-n-4"
                      } ${!isConfigured ? "pointer-events-none opacity-50" : ""}`}
                      title={model.description}
                      onClick={() => toggleModel(provider.id, model.id)}
                      disabled={!isConfigured}
                    >
                      {model.displayName}
                    </button>
                  );
                })}
                {hasHiddenModels && (
                  <button
                    type="button"
                    className="caption1 text-primary-1 hover:underline font-medium"
                    onClick={toggleExpanded}
                  >
                    {isExpanded
                      ? "Show less"
                      : isConfigured
                        ? `Show more (+${otherModels.length})`
                        : "Show models"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AiProviders;
