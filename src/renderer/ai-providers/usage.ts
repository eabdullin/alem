import type { QurtUIMessage } from "@/types/ui-message";

export interface TokenUsageSummary {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  cachedInputTokens: number;
}

/**
 * Calculate total token usage from assistant messages.
 * Usage is read from message.metadata.totalUsage per AI SDK UI metadata shape.
 */
export function calculateTokenUsage(messages: QurtUIMessage[]): TokenUsageSummary {
  const result: TokenUsageSummary = {
    totalTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    reasoningTokens: 0,
    cachedInputTokens: 0,
  };

  for (const msg of messages) {
    const usage = msg.metadata?.totalUsage;
    if (!usage) continue;

    if (usage.totalTokens) result.totalTokens = usage.totalTokens;
    if (usage.inputTokens) result.inputTokens = usage.inputTokens;
    if (usage.outputTokens) result.outputTokens = usage.outputTokens;
    if (usage.reasoningTokens) result.reasoningTokens = usage.reasoningTokens;
    if (usage.cachedInputTokens) result.cachedInputTokens = usage.cachedInputTokens;

    if (result.reasoningTokens === 0 && usage.outputTokenDetails?.reasoningTokens) {
      result.reasoningTokens = usage.outputTokenDetails.reasoningTokens;
    }
    if (result.cachedInputTokens === 0 && usage.inputTokenDetails?.cacheReadTokens) {
      result.cachedInputTokens = usage.inputTokenDetails.cacheReadTokens;
    }
  }

  return result;
}
