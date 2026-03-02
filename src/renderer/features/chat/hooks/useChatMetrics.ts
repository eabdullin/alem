import { useMemo } from "react";
import { providerFactory } from "@/ai-providers/provider-factory";
import { calculateTokenUsage } from "@/ai-providers/usage";
import type { UIMessage } from "ai";

type UseChatMetricsOptions = {
  model: string;
  messages: UIMessage[];
};

export function useChatMetrics({ model, messages }: UseChatMetricsOptions) {
  const providerInstance = useMemo(() => {
    if (!model) return null;
    const providerId = providerFactory.getProviderIdForModel(model);
    if (!providerId) return null;
    try {
      return providerFactory.createForProvider(providerId, "", model);
    } catch {
      return null;
    }
  }, [model]);

  const tokenUsage = useMemo(() => {
    return calculateTokenUsage(messages);
  }, [messages]);

  const isReasoningModel = useMemo(() => {
    return providerInstance?.resolvedModel.isReasoning ?? false;
  }, [providerInstance]);

  const maxTokens = useMemo(() => {
    if (!providerInstance) return 0;
    return providerInstance.getMaxTokens(model);
  }, [model, providerInstance]);

  const resolvedModelId = useMemo(() => {
    return providerInstance?.resolvedModel.modelId ?? "";
  }, [providerInstance]);

  return {
    isReasoningModel,
    tokenUsage,
    maxTokens,
    resolvedModelId,
  };
}
