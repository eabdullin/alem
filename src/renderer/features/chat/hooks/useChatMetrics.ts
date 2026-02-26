import { useMemo } from "react";
import { providerService } from "@/services/provider-service";
import type { UIMessage } from "ai";

type UseChatMetricsOptions = {
  provider: string;
  model: string;
  messages: UIMessage[];
};

export function useChatMetrics({
  provider,
  model,
  messages,
}: UseChatMetricsOptions) {
  const tokenUsage = useMemo(() => {
    return providerService.calculateTokenUsage(messages);
  }, [messages]);

  const isReasoningModel = useMemo(() => {
    if (!model) return false;
    return providerService.isReasoningModel(provider, model);
  }, [model, provider]);

  const maxTokens = useMemo(() => {
    if (!model) return 0;
    return providerService.getMaxTokens(provider, model);
  }, [provider, model]);

  const resolvedModelId = useMemo(() => {
    if (!model) return "";
    const resolved = providerService.resolveModel(provider, model);
    return resolved.modelId;
  }, [provider, model]);

  return {
    isReasoningModel,
    tokenUsage,
    maxTokens,
    resolvedModelId,
  };
}
