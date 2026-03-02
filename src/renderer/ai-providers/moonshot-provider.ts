import { createMoonshotAI } from "@ai-sdk/moonshotai";
import { BaseProvider } from "./base-provider";
import type { LanguageModel, ToolSet } from "ai";
import type {
  ProviderInfo,
  ProviderOptions,
  ResolvedModelConfig,
  ToolConfig,
} from "./types";

type MoonshotModelRuntime = {
  modelId: string;
  thinkingBudgetTokens?: number;
};

export const MOONSHOT_PROVIDER_INFO: ProviderInfo = {
  id: "moonshotai",
  name: "Moonshot AI",
  description: "Kimi K2.5, Kimi K2 Thinking",
  apiKeyUrl: "https://platform.moonshot.ai",
  logoPath: "./provider-logos/moonshotai.png",
  models: [
    {
      id: "kimi-k2.5",
      displayName: "Kimi K2.5",
      description:
        "Open model with strong multimodal, coding, and agentic capabilities.",
    },
    {
      id: "kimi-k2-thinking",
      displayName: "Kimi K2 Thinking",
      description: "Step-by-step reasoning model for complex multi-step tasks.",
    },
  ],
};

const MOONSHOT_MODEL_RUNTIME: Record<string, MoonshotModelRuntime> = {
  "kimi-k2.5": { modelId: "kimi-k2.5" },
  "kimi-k2-thinking": {
    modelId: "kimi-k2-thinking",
    thinkingBudgetTokens: 2048,
  },
};

export class MoonshotProvider extends BaseProvider {
  constructor(apiKey: string, selectedModelId: string, toolConfig?: ToolConfig) {
    super(
      "moonshotai",
      apiKey,
      selectedModelId,
      MOONSHOT_PROVIDER_INFO,
      toolConfig,
    );
  }

  protected createLanguageModel(modelId: string): LanguageModel {
    return createMoonshotAI({ apiKey: this.apiKey })(modelId);
  }

  static createWebSearchToolSet(_apiKey: string): ToolSet {
    // Moonshot provider-side web search is currently not wired in this SDK flow.
    return {} as ToolSet;
  }

  protected getProviderSpecificTools(): ToolSet {
    return MoonshotProvider.createWebSearchToolSet(this.apiKey);
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
      moonshotai: {
        thinking: {
          type: "enabled",
          budgetTokens: thinkingBudgetTokens,
        },
        reasoningHistory: "interleaved",
      },
    };
  }

  protected getMaxTokensForResolvedModel(): number {
    return 256000;
  }

  protected getModelCostInfo() {
    return {
      pricingUrl: "https://platform.moonshot.ai",
      note: "See Moonshot model pricing for current token costs.",
    };
  }

  protected validateApiKeyFormat(apiKey: string): boolean {
    return apiKey.trim().length >= 20;
  }

  private getRuntime(selectedModelId: string): MoonshotModelRuntime {
    const runtime = MOONSHOT_MODEL_RUNTIME[selectedModelId];
    if (!runtime) {
      throw new Error(`Moonshot model "${selectedModelId}" is not configured.`);
    }
    return runtime;
  }
}
