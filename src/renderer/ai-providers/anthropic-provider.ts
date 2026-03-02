import { createAnthropic } from "@ai-sdk/anthropic";
import { BaseProvider } from "./base-provider";
import type { LanguageModel } from "ai";
import type {
  ProviderInfo,
  ProviderOptions,
  ResolvedModelConfig,
  ToolConfig,
} from "./types";

const ANTHROPIC_THINKING_BUDGET_TOKENS = 16000;
type AnthropicModelRuntime = {
  modelId: string;
  thinkingBudgetTokens?: number;
};

export const ANTHROPIC_PROVIDER_INFO: ProviderInfo = {
  id: "anthropic",
  name: "Anthropic",
  description: "Claude Opus 4.6, Claude Sonnet 4.6, Claude Haiku 4.5",
  apiKeyUrl: "https://console.anthropic.com/settings/keys",
  logoPath: "./provider-logos/anthropic.svg",
  models: [
    {
      id: "claude-opus-4-6-non-thinking",
      displayName: "Claude Opus 4.6 (Non-thinking)",
      description: "The most intelligent model for building agents and coding.",
    },
    {
      id: "claude-opus-4-6-thinking",
      displayName: "Claude Opus 4.6 (Thinking)",
      description:
        "Extended thinking enabled for harder multi-step coding and reasoning tasks.",
    },
    {
      id: "claude-sonnet-4-6-non-thinking",
      displayName: "Claude Sonnet 4.6 (Non-thinking)",
      description: "The best combination of speed and intelligence.",
    },
    {
      id: "claude-sonnet-4-6-thinking",
      displayName: "Claude Sonnet 4.6 (Thinking)",
      description: "Extended thinking enabled for complex multi-step problem solving.",
    },
    {
      id: "claude-haiku-4-5",
      displayName: "Claude Haiku 4.5",
      description: "The fastest model with near-frontier intelligence.",
    },
  ],
};

const ANTHROPIC_MODEL_RUNTIME: Record<string, AnthropicModelRuntime> = {
  "claude-opus-4-6-non-thinking": { modelId: "claude-opus-4-6" },
  "claude-opus-4-6-thinking": {
    modelId: "claude-opus-4-6",
    thinkingBudgetTokens: ANTHROPIC_THINKING_BUDGET_TOKENS,
  },
  "claude-sonnet-4-6-non-thinking": { modelId: "claude-sonnet-4-6" },
  "claude-sonnet-4-6-thinking": {
    modelId: "claude-sonnet-4-6",
    thinkingBudgetTokens: ANTHROPIC_THINKING_BUDGET_TOKENS,
  },
  "claude-haiku-4-5": { modelId: "claude-haiku-4-5" },
};

export class AnthropicProvider extends BaseProvider {
  constructor(apiKey: string, selectedModelId: string, toolConfig?: ToolConfig) {
    super(
      "anthropic",
      apiKey,
      selectedModelId,
      ANTHROPIC_PROVIDER_INFO,
      toolConfig,
    );
  }

  protected createLanguageModel(modelId: string): LanguageModel {
    return createAnthropic({ apiKey: this.apiKey })(modelId);
  }

  protected resolveRuntimeModelId(selectedModelId: string): string {
    return this.getRuntime(selectedModelId).modelId;
  }

  protected isReasoningSelection(selectedModelId: string): boolean {
    return Boolean(this.getRuntime(selectedModelId).thinkingBudgetTokens);
  }

  protected createProviderOptions(
    resolvedModel: ResolvedModelConfig,
  ): ProviderOptions | undefined {
    const { thinkingBudgetTokens } = this.getRuntime(resolvedModel.selectedModelId);
    if (!thinkingBudgetTokens) {
      return undefined;
    }
    return {
      anthropic: {
        thinking: {
          type: "enabled",
          budgetTokens: thinkingBudgetTokens,
        },
      },
    };
  }

  protected getMaxTokensForResolvedModel(): number {
    return 200000;
  }

  protected getModelCostInfo() {
    return {
      pricingUrl: "https://www.anthropic.com/pricing",
      note: "Pricing depends on model family and prompt caching usage.",
    };
  }

  protected validateApiKeyFormat(apiKey: string): boolean {
    const value = apiKey.trim();
    return value.length >= 30 && value.startsWith("sk-ant-");
  }

  private getRuntime(selectedModelId: string): AnthropicModelRuntime {
    const runtime = ANTHROPIC_MODEL_RUNTIME[selectedModelId];
    if (!runtime) {
      throw new Error(`Anthropic model "${selectedModelId}" is not configured.`);
    }
    return runtime;
  }
}
