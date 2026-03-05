import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { BaseProvider } from "./base-provider";
import type { LanguageModel } from "ai";
import type {
  ProviderInfo,
  ProviderOptions,
  ResolvedModelConfig,
  ToolConfig,
} from "./types";

type GoogleThinkingLevel = "minimal" | "low" | "medium" | "high";
type GoogleModelRuntime = {
  modelId: string;
  thinkingLevel?: GoogleThinkingLevel;
};

export const GOOGLE_PROVIDER_INFO: ProviderInfo = {
  id: "google",
  name: "Google",
  description: "Gemini 3.1 Pro, Gemini 3 Flash (preview)",
  apiKeyUrl: "https://aistudio.google.com/app/apikey",
  logoPath: "./provider-logos/google.svg",
  models: [
    {
      id: "gemini-3.1-pro-preview-low",
      displayName: "Gemini 3.1 Pro (Low)",
      description:
        "Advanced intelligence, complex problem-solving skills, and powerful agentic and vibe coding capabilities. New Preview.",
    },
    {
      id: "gemini-3.1-pro-preview-high",
      displayName: "Gemini 3.1 Pro (High)",
      description:
        "Deeper thinking mode for complex tasks with stronger reasoning depth.",
    },
    {
      id: "gemini-3-flash-preview-low",
      displayName: "Gemini 3 Flash (Low)",
      description:
        "Frontier-class performance rivaling larger models at a fraction of the cost. Preview.",
    },
    {
      id: "gemini-3-flash-preview-medium",
      displayName: "Gemini 3 Flash (Medium)",
      description:
        "Balanced thinking mode for practical speed and answer quality.",
    },
    {
      id: "gemini-3-flash-preview-high",
      displayName: "Gemini 3 Flash (High)",
      description:
        "Higher thinking mode for difficult prompts and deeper analysis.",
    },
    {
      id: "gemini-3-flash-preview-minimal",
      displayName: "Gemini 3 Flash (Minimal)",
      description:
        "Minimal thinking mode for fastest responses when latency is critical.",
    },
  ],
};

const GOOGLE_MODEL_RUNTIME: Record<string, GoogleModelRuntime> = {
  "gemini-3.1-pro-preview-low": {
    modelId: "gemini-3.1-pro-preview",
    thinkingLevel: "low",
  },
  "gemini-3.1-pro-preview-high": {
    modelId: "gemini-3.1-pro-preview",
    thinkingLevel: "high",
  },
  "gemini-3-flash-preview-low": {
    modelId: "gemini-3-flash-preview",
    thinkingLevel: "low",
  },
  "gemini-3-flash-preview-medium": {
    modelId: "gemini-3-flash-preview",
    thinkingLevel: "medium",
  },
  "gemini-3-flash-preview-high": {
    modelId: "gemini-3-flash-preview",
    thinkingLevel: "high",
  },
  "gemini-3-flash-preview-minimal": {
    modelId: "gemini-3-flash-preview",
    thinkingLevel: "minimal",
  },
};

export class GoogleProvider extends BaseProvider {
  constructor(apiKey: string, selectedModelId: string, toolConfig?: ToolConfig) {
    super("google", apiKey, selectedModelId, GOOGLE_PROVIDER_INFO, toolConfig);
  }

  protected createLanguageModel(modelId: string): LanguageModel {
    return createGoogleGenerativeAI({ apiKey: this.apiKey })(modelId);
  }

  protected resolveRuntimeModelId(selectedModelId: string): string {
    return this.getRuntime(selectedModelId).modelId;
  }

  protected isReasoningSelection(selectedModelId: string): boolean {
    return Boolean(this.getRuntime(selectedModelId).thinkingLevel);
  }

  protected createProviderOptions(
    resolvedModel: ResolvedModelConfig,
  ): ProviderOptions | undefined {
    const { thinkingLevel } = this.getRuntime(resolvedModel.selectedModelId);
    if (!thinkingLevel) {
      return undefined;
    }
    return {
      google: {
        thinkingConfig: {
          includeThoughts: true,
          thinkingLevel,
        },
      },
    };
  }

  protected getMaxTokensForResolvedModel(resolvedModel: ResolvedModelConfig): number {
    if (resolvedModel.modelId.includes("gemini")) {
      if (resolvedModel.modelId.includes("flash")) return 1000000;
      return 2000000;
    }
    return 200000;
  }

  protected getModelCostInfo() {
    return {
      pricingUrl: "https://ai.google.dev/pricing",
      note: "Preview models can have different pricing and limits.",
    };
  }

  protected validateApiKeyFormat(apiKey: string): boolean {
    return apiKey.trim().length >= 20;
  }

  private getRuntime(selectedModelId: string): GoogleModelRuntime {
    const runtime = GOOGLE_MODEL_RUNTIME[selectedModelId];
    if (!runtime) {
      throw new Error(`Google model "${selectedModelId}" is not configured.`);
    }
    return runtime;
  }
}
