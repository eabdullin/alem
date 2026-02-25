import { useContext, useMemo } from "react";
import { AlemContext } from "@/App";
import { DEFAULT_ENABLED_MODELS, PROVIDERS } from "@/constants/providers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      value={value?.id}
      onValueChange={(id) => {
        const item = items.find((i) => i.id === id);
        if (item) handleChange(item);
      }}
    >
      <SelectTrigger
        title={value?.title}
        className={`border-0 shadow-none bg-n-1 dark:bg-n-6 h-9 px-3 rounded-md overflow-hidden [&>span]:truncate [&>span]:min-w-0 transition-colors hover:bg-accent hover:text-n-7 dark:hover:bg-accent dark:text-n-4 dark:hover:text-n-1 ${
          compact ? "min-w-[8rem] max-w-[12rem]" : "min-w-[10rem] max-w-[16rem]"
        }`}
      >
        <SelectValue placeholder="Model" />
      </SelectTrigger>
      <SelectContent
        side={direction === "up" ? "top" : "bottom"}
        className="min-w-[14rem]"
      >
        {items.map((item) => (
          <SelectItem key={item.id} value={item.id} className="caption">
            {item.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ModelSelector;
