import { createOpenAI } from "@ai-sdk/openai";
import { BaseProvider } from "./base-provider";
import type { LanguageModel } from "ai";
import type {
  ProviderInfo,
  ProviderOptions,
  ResolvedModelConfig,
  ToolConfig,
} from "./types";

type OpenAiReasoningEffort = "low" | "medium" | "high" | "xhigh";
type OpenAiModelRuntime = {
  modelId: string;
  reasoningEffort?: OpenAiReasoningEffort;
};

export const OPENAI_PROVIDER_INFO: ProviderInfo = {
  id: "openai",
  name: "OpenAI",
  description: "GPT-5.4, GPT-5.2, GPT-5 mini, GPT-5 nano",
  apiKeyUrl: "https://platform.openai.com/api-keys",
  logoPath: "./provider-logos/openai.svg",
  models: [
    {
      id: "gpt-5.4-none",
      displayName: "GPT-5.4",
      description: "OpenAI's most capable frontier model for professional work.",
    },
    {
      id: "gpt-5.4-low",
      displayName: "GPT-5.4 (Low)",
      description: "Fast reasoning for complex professional tasks.",
    },
    {
      id: "gpt-5.4-medium",
      displayName: "GPT-5.4 (Medium)",
      description: "Balanced reasoning depth for strong quality with practical latency.",
    },
    {
      id: "gpt-5.4-high",
      displayName: "GPT-5.4 (High)",
      description: "Deeper reasoning for harder tasks that need extra thought.",
    },
    {
      id: "gpt-5.4-xhigh",
      displayName: "GPT-5.4 (XHigh)",
      description: "Maximum reasoning effort for the most complex problem-solving tasks.",
    },
    {
      id: "gpt-5.2-low",
      displayName: "GPT-5.2 (Low)",
      description: "The best model for coding and agentic tasks across industries.",
    },
    {
      id: "gpt-5.2-medium",
      displayName: "GPT-5.2 (Medium)",
      description: "Balanced reasoning depth for strong quality with practical latency.",
    },
    {
      id: "gpt-5.2-high",
      displayName: "GPT-5.2 (High)",
      description: "Deeper reasoning for harder tasks that need extra thought.",
    },
    {
      id: "gpt-5.2-xhigh",
      displayName: "GPT-5.2 (XHigh)",
      description: "Maximum reasoning effort for the most complex problem-solving tasks.",
    },
    {
      id: "gpt-5-mini-low",
      displayName: "GPT-5 mini (Low)",
      description: "A faster, cost-efficient version of GPT-5 for well-defined tasks.",
    },
    {
      id: "gpt-5-mini-medium",
      displayName: "GPT-5 mini (Medium)",
      description: "Balanced speed and quality for everyday development workflows.",
    },
    {
      id: "gpt-5-mini-high",
      displayName: "GPT-5 mini (High)",
      description: "Higher reasoning depth when you want better answer quality.",
    },
    {
      id: "gpt-5-nano-low",
      displayName: "GPT-5 nano (Low)",
      description: "Fastest, most cost-efficient version of GPT-5.",
    },
    {
      id: "gpt-5-nano-medium",
      displayName: "GPT-5 nano (Medium)",
      description: "Budget-friendly model with balanced reasoning for simple requests.",
    },
    {
      id: "gpt-5-nano-high",
      displayName: "GPT-5 nano (High)",
      description: "More deliberate reasoning while keeping costs lower than larger models.",
    },
  ],
};

const OPENAI_MODEL_RUNTIME: Record<string, OpenAiModelRuntime> = {
  "gpt-5.4-none": { modelId: "gpt-5.4" },
  "gpt-5.4-low": { modelId: "gpt-5.4", reasoningEffort: "low" },
  "gpt-5.4-medium": { modelId: "gpt-5.4", reasoningEffort: "medium" },
  "gpt-5.4-high": { modelId: "gpt-5.4", reasoningEffort: "high" },
  "gpt-5.4-xhigh": { modelId: "gpt-5.4", reasoningEffort: "xhigh" },
  "gpt-5.2-low": { modelId: "gpt-5.2", reasoningEffort: "low" },
  "gpt-5.2-medium": { modelId: "gpt-5.2", reasoningEffort: "medium" },
  "gpt-5.2-high": { modelId: "gpt-5.2", reasoningEffort: "high" },
  "gpt-5.2-xhigh": { modelId: "gpt-5.2", reasoningEffort: "xhigh" },
  "gpt-5-mini-low": { modelId: "gpt-5-mini", reasoningEffort: "low" },
  "gpt-5-mini-medium": { modelId: "gpt-5-mini", reasoningEffort: "medium" },
  "gpt-5-mini-high": { modelId: "gpt-5-mini", reasoningEffort: "high" },
  "gpt-5-nano-low": { modelId: "gpt-5-nano", reasoningEffort: "low" },
  "gpt-5-nano-medium": { modelId: "gpt-5-nano", reasoningEffort: "medium" },
  "gpt-5-nano-high": { modelId: "gpt-5-nano", reasoningEffort: "high" },
};

export class OpenAIProvider extends BaseProvider {
  constructor(apiKey: string, selectedModelId: string, toolConfig?: ToolConfig) {
    super("openai", apiKey, selectedModelId, OPENAI_PROVIDER_INFO, toolConfig);
  }

  protected createLanguageModel(modelId: string): LanguageModel {
    return createOpenAI({ apiKey: this.apiKey })(modelId);
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
      openai: {
        reasoningEffort,
        reasoningSummary: "auto",
      },
    };
  }

  protected getMaxTokensForResolvedModel(resolvedModel: ResolvedModelConfig): number {
    if (resolvedModel.modelId.includes("gpt-5")) {
      if (resolvedModel.modelId.includes("nano")) return 200000;
      if (resolvedModel.modelId.includes("mini")) return 200000;
      if (resolvedModel.modelId.includes("5.4")) return 1050000;
      return 1000000;
    }
    return 200000;
  }

  protected getModelCostInfo() {
    return {
      pricingUrl: "https://platform.openai.com/docs/pricing",
      note: "Rates vary by model tier and cached-token support.",
    };
  }

  protected validateApiKeyFormat(apiKey: string): boolean {
    const value = apiKey.trim();
    return value.length >= 20 && value.startsWith("sk-");
  }

  private getRuntime(selectedModelId: string): OpenAiModelRuntime {
    const runtime = OPENAI_MODEL_RUNTIME[selectedModelId];
    if (!runtime) {
      throw new Error(`OpenAI model "${selectedModelId}" is not configured.`);
    }
    return runtime;
  }
}
