import { ToolSet, type LanguageModel, type UIMessage } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import {
  PROVIDERS,
  DEFAULT_ENABLED_MODELS,
  resolveProviderModel,
  type ProviderInfo,
  type ProviderModelInfo,
} from "@/constants/providers";

export type AiProvider = "openai" | "anthropic" | "google";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue | undefined };

/**
 * Configuration for agent tools
 */
export interface ToolConfig {
  terminalWorkspaceOverride?: string;
  browserChatId?: string;
}

/**
 * Configuration for creating an agent
 */
export interface AgentConfig {
  provider: AiProvider;
  model: string;
  apiKey: string;
  mode?: "ask" | "agent";
  toolConfig?: ToolConfig;
}

/**
 * Resolved model configuration with provider-specific settings
 */
export interface ResolvedModelConfig {
  modelId: string;
  reasoningEffort?: ProviderModelInfo["reasoningEffort"];
  googleThinkingLevel?: ProviderModelInfo["googleThinkingLevel"];
  anthropicThinkingBudgetTokens?: ProviderModelInfo["anthropicThinkingBudgetTokens"];
  isReasoning: boolean;
}

/**
 * Provider options for AI SDK
 */
export type ProviderOptions = Record<string, { [key: string]: JsonValue | undefined }>;

/**
 * Centralized service for managing AI providers, models, and their configurations.
 * This service handles:
 * - Provider and model resolution
 * - SDK client creation
 * - Provider-specific settings (reasoning effort, thinking levels)
 * - Tool configuration including web search
 * - API key management
 * - Enabled models
 */
export class ProviderService {
  private static instance: ProviderService;

  private constructor() {}

  /**
   * Get the singleton instance of ProviderService
   */
  static getInstance(): ProviderService {
    if (!ProviderService.instance) {
      ProviderService.instance = new ProviderService();
    }
    return ProviderService.instance;
  }

  /**
   * Get all available providers
   */
  getProviders(): ProviderInfo[] {
    return PROVIDERS;
  }

  /**
   * Validate provider ID and return it, or return default
   */
  validateProvider(providerId: string | undefined, defaultProvider: AiProvider = "openai"): AiProvider {
    if (providerId === "openai" || providerId === "anthropic" || providerId === "google") {
      return providerId;
    }
    return defaultProvider;
  }

  /**
   * Get provider by ID
   */
  getProvider(providerId: string): ProviderInfo | undefined {
    return PROVIDERS.find((p) => p.id === providerId);
  }

  /**
   * Get model info by provider and model ID
   */
  getModelInfo(providerId: string, modelId: string): ProviderModelInfo | undefined {
    const provider = this.getProvider(providerId);
    return provider?.models.find((m) => m.id === modelId);
  }

  /**
   * Get default enabled models for a provider
   */
  getDefaultEnabledModels(providerId: AiProvider): string[] {
    return DEFAULT_ENABLED_MODELS[providerId] || [];
  }

  /**
   * Check if a model ID is valid for a provider
   */
  isValidModel(providerId: string, modelId: string): boolean {
    return !!this.getModelInfo(providerId, modelId);
  }

  /**
   * Resolve model configuration with provider-specific settings
   */
  resolveModel(providerId: string, selectedModelId: string): ResolvedModelConfig {
    const resolved = resolveProviderModel(providerId, selectedModelId);
    return {
      modelId: resolved.modelId,
      reasoningEffort: resolved.reasoningEffort,
      googleThinkingLevel: resolved.googleThinkingLevel,
      anthropicThinkingBudgetTokens: resolved.anthropicThinkingBudgetTokens,
      isReasoning: !!(
        resolved.reasoningEffort ||
        resolved.googleThinkingLevel ||
        resolved.anthropicThinkingBudgetTokens
      ),
    };
  }

  /**
   * Check if a model is a reasoning model
   */
  isReasoningModel(providerId: string, modelId: string): boolean {
    return this.resolveModel(providerId, modelId).isReasoning;
  }

/**
 * Create a LanguageModel instance for the given provider and model
 */
createChatModel(provider: AiProvider, model: string, apiKey: string): LanguageModel {
    switch (provider) {
      case "openai":
        return createOpenAI({ apiKey })(model);
      case "anthropic":
        return createAnthropic({ apiKey })(model);
      case "google":
        return createGoogleGenerativeAI({ apiKey })(model);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Create provider options based on model configuration
   */
  createProviderOptions(config: ResolvedModelConfig): ProviderOptions | undefined {
    const optionsMap: ProviderOptions = {};

    if (config.reasoningEffort) {
      optionsMap.openai = {
        reasoningEffort: config.reasoningEffort,
        reasoningSummary: "auto",
      };
    }

    if (config.googleThinkingLevel) {
      optionsMap.google = {
        thinkingConfig: {
          includeThoughts: true,
          thinkingLevel: config.googleThinkingLevel,
        },
      };
    }

    if (config.anthropicThinkingBudgetTokens) {
      optionsMap.anthropic = {
        thinking: {
          type: "enabled",
          budgetTokens: config.anthropicThinkingBudgetTokens,
        },
      };
    }

    return Object.keys(optionsMap).length > 0 ? optionsMap : undefined;
  }

  /**
   * Create web search tool set for the given provider
   */
  createWebSearchToolSet(provider: AiProvider, apiKey: string): ToolSet {
    switch (provider) {
      case "openai": {
        const openai = createOpenAI({ apiKey });
        return {
          web_search: openai.tools.webSearch({
            searchContextSize: "medium",
          }),
        } as ToolSet;
      }
      case "google": {
        const google = createGoogleGenerativeAI({ apiKey });
        return {
          google_search: google.tools.googleSearch({
            mode: "MODE_DYNAMIC",
          }),
        } as ToolSet;
      }
      case "anthropic": {
        const anthropic = createAnthropic({ apiKey });
        return {
          web_search: anthropic.tools.webSearch_20250305({
            maxUses: 3,
          }),
        } as ToolSet;
      }
      default:
        throw new Error(`Unsupported provider for web search: ${provider}`);
    }
  }

  /**
   * Get max tokens for a model
   */
  getMaxTokens(providerId: string, modelId: string): number {
    const modelInfo = this.getModelInfo(providerId, modelId);
    
    // Default max tokens based on model family
    if (modelId?.includes("gpt-5")) {
      if (modelId?.includes("nano")) return 200000;
      if (modelId?.includes("mini")) return 200000;
      return 1000000; // GPT-5.2
    }
    
    if (modelId?.includes("claude")) {
      if (modelId?.includes("haiku")) return 200000;
      return 200000; // Opus and Sonnet
    }
    
    if (modelId?.includes("gemini")) {
      if (modelId?.includes("flash")) return 1000000;
      return 2000000; // Pro
    }
    
    // Default fallback
    return 200000;
  }

  /**
   * Calculate total token usage from messages.
   * Usage is stored in message.metadata?.totalUsage (LanguageModelUsage) per the AI SDK.
   * @see https://ai-sdk.dev/docs/ai-sdk-ui/chatbot#usage-information
   */
  calculateTokenUsage(
    messages: UIMessage[]
  ): {
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    reasoningTokens: number;
    cachedInputTokens: number;
  } {
    const result = { totalTokens: 0, inputTokens: 0, outputTokens: 0, reasoningTokens: 0, cachedInputTokens: 0 };

    for (const msg of messages) {
      const metadata = (msg as { metadata?: { totalUsage?: { totalTokens?: number; inputTokens?: number; outputTokens?: number; reasoningTokens?: number; cachedInputTokens?: number; outputTokenDetails?: { reasoningTokens?: number }; inputTokenDetails?: { cacheReadTokens?: number } } } }).metadata;
      const usage = metadata?.totalUsage;
      if (!usage) continue;

      if (usage.totalTokens){
        result.totalTokens = usage.totalTokens;
      }
    }

    return result;
  }

  /**
   * Validate API key format (basic validation)
   */
  validateApiKey(provider: AiProvider, apiKey: string): boolean {
    if (!apiKey.trim()) {
      return false;
    }

    // Basic length checks per provider
    switch (provider) {
      case "openai":
        // OpenAI keys typically start with "sk-" and are at least 20 chars
        return apiKey.length >= 20;
      case "anthropic":
        // Anthropic keys typically start with "sk-ant-" and are at least 30 chars
        return apiKey.length >= 30;
      case "google":
        // Google API keys are typically at least 20 chars
        return apiKey.length >= 20;
      default:
        return apiKey.length > 0;
    }
  }

  /**
   * Get provider name for display
   */
  getProviderName(provider: AiProvider): string {
    const names: Record<AiProvider, string> = {
      openai: "OpenAI",
      anthropic: "Anthropic",
      google: "Google",
    };
    return names[provider];
  }

  /**
   * Get error message for missing API key
   */
  getApiKeyErrorMessage(provider: AiProvider): string {
    return `${this.getProviderName(provider)} API key is not configured.`;
  }
}

// Export singleton instance
export const providerService = ProviderService.getInstance();
