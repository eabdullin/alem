import { createXai } from "@ai-sdk/xai";
import { BaseProvider } from "./base-provider";
import type { LanguageModel } from "ai";
import type {
  ProviderInfo,
  ProviderOptions,
  ResolvedModelConfig,
  ToolConfig,
} from "./types";

type XaiReasoningEffort = "low" | "high";
type XaiModelRuntime = {
  modelId: string;
  reasoningEffort?: XaiReasoningEffort;
};

export const XAI_PROVIDER_INFO: ProviderInfo = {
  id: "xai",
  name: "xAI",
  description: "Grok 4 — reasoning and vision models",
  apiKeyUrl: "https://console.x.ai",
  logoPath: "./provider-logos/xai.svg",
  models: [
    {
      id: "grok-4-1-fast-reasoning-high",
      displayName: "Grok 4.1 Fast Reasoning (High)",
      description:
        "Vision and reasoning model with high reasoning effort for complex tasks.",
    },
    {
      id: "grok-4-1-fast-reasoning-low",
      displayName: "Grok 4.1 Fast Reasoning (Low)",
      description:
        "Vision and reasoning model with low reasoning effort for faster responses.",
    },
  ],
};

const XAI_MODEL_RUNTIME: Record<string, XaiModelRuntime> = {
  "grok-4-1-fast-reasoning-high": {
    modelId: "grok-4-1-fast-reasoning",
    reasoningEffort: "high",
  },
  "grok-4-1-fast-reasoning-low": {
    modelId: "grok-4-1-fast-reasoning",
    reasoningEffort: "low",
  },
};

export class XaiProvider extends BaseProvider {
  constructor(apiKey: string, selectedModelId: string, toolConfig?: ToolConfig) {
    super("xai", apiKey, selectedModelId, XAI_PROVIDER_INFO, toolConfig);
  }

  protected createLanguageModel(modelId: string): LanguageModel {
    return createXai({ apiKey: this.apiKey }).responses(modelId);
  }

  protected resolveRuntimeModelId(selectedModelId: string): string {
    return this.getRuntime(selectedModelId).modelId;
  }

  protected isReasoningSelection(selectedModelId: string): boolean {
    return Boolean(this.getRuntime(selectedModelId).reasoningEffort);
  }

  protected createProviderOptions(
    resolvedModel: ResolvedModelConfig,
  ): ProviderOptions | undefined {
    const { reasoningEffort } = this.getRuntime(resolvedModel.selectedModelId);
    if (!reasoningEffort) {
      return undefined;
    }
    return {
      xai: {
        reasoningEffort,
      },
    };
  }

  protected getMaxTokensForResolvedModel(): number {
    return 128000;
  }

  protected getModelCostInfo() {
    return {
      pricingUrl: "https://console.x.ai",
      note: "Check xAI console pricing for current token rates.",
    };
  }

  protected validateApiKeyFormat(apiKey: string): boolean {
    return apiKey.trim().length >= 20;
  }

  private getRuntime(selectedModelId: string): XaiModelRuntime {
    const runtime = XAI_MODEL_RUNTIME[selectedModelId];
    if (!runtime) {
      throw new Error(`xAI model "${selectedModelId}" is not configured.`);
    }
    return runtime;
  }
}
