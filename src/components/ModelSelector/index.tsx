import { useContext, useMemo } from "react";
import { AlemContext } from "@/App";
import { DEFAULT_ENABLED_MODELS, PROVIDERS } from "@/constants/providers";
import Select from "@/components/Select";

type ModelOption = {
  id: string;
  title: string;
  providerId: string;
  modelId: string;
};

type ModelSelectorProps = {
  direction?: "up" | "down";
  compact?: boolean;
};

const ModelSelector = ({
  direction = "down",
  compact = false,
}: ModelSelectorProps) => {
  const { settings, updateSettings } = useContext(AlemContext);

  const activeProvider = settings?.activeProvider || "openai";
  const activeModel = settings?.activeModel || "gpt-5-mini-medium";
  const enabledModels: Record<string, string[]> = useMemo(
    () => settings?.enabledModels || DEFAULT_ENABLED_MODELS,
    [settings?.enabledModels],
  );

  const items = useMemo<ModelOption[]>(() => {
    return PROVIDERS.flatMap((provider) =>
      (enabledModels[provider.id] || [])
        .map((modelId) => {
          const model = provider.models.find((m) => m.id === modelId);
          if (!model) return null;
          return {
            id: `${provider.id}-${model.id}`,
            title: `${provider.name} · ${model.displayName}`,
            providerId: provider.id,
            modelId: model.id,
          };
        })
        .filter((item): item is ModelOption => item !== null),
    );
  }, [enabledModels]);

  const value = useMemo(
    () =>
      items.find(
        (item) => item.providerId === activeProvider && item.modelId === activeModel,
      ) ?? items[0],
    [items, activeProvider, activeModel],
  );

  const handleChange = (item: ModelOption) => {
    void updateSettings({
      ...settings,
      activeProvider: item.providerId,
      activeModel: item.modelId,
    });
  };

  if (items.length === 0) {
    return (
      <span className="caption2 font-semibold text-n-4">
        No models enabled
      </span>
    );
  }

  return (
    <Select
      items={items}
      value={value}
      onChange={handleChange}
      small={compact}
      up={direction === "up"}
      noShadow
      className="min-w-0"
      classButton="caption2 border-0"
      classOptions="border-0"
      classOption="caption2"
    />
  );
};

export default ModelSelector;
