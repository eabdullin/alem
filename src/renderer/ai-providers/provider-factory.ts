import {
  findProviderBySelectedModel,
  isAiProvider,
} from "./provider-lookup";
import {
  getProviderInfoById,
  getVisibleProviderInfos,
} from "./provider-catalog";
import type { AiProvider, ProviderInfo, ToolConfig } from "./types";
import { BaseProvider } from "./base-provider";
import { OpenAIProvider } from "./openai-provider";
import { AnthropicProvider } from "./anthropic-provider";
import { GoogleProvider } from "./google-provider";
import { XaiProvider } from "./xai-provider";
import { MoonshotProvider } from "./moonshot-provider";

type ProviderCtor = new (
  apiKey: string,
  selectedModelId: string,
  toolConfig?: ToolConfig,
) => BaseProvider;

const PROVIDER_CTORS: Record<AiProvider, ProviderCtor> = {
  openai: OpenAIProvider,
  anthropic: AnthropicProvider,
  google: GoogleProvider,
  moonshotai: MoonshotProvider,
  xai: XaiProvider,
};

export class ProviderFactory {
  create(apiKey: string, selectedModelId: string, toolConfig?: ToolConfig): BaseProvider {
    const providerId = this.getProviderIdForModel(selectedModelId);
    if (!providerId) {
      throw new Error(
        `Model "${selectedModelId}" is not available. Please select an enabled model in Settings.`,
      );
    }
    return this.createForProvider(providerId, apiKey, selectedModelId, toolConfig);
  }

  createForProvider(
    providerId: AiProvider,
    apiKey: string,
    selectedModelId: string,
    toolConfig?: ToolConfig,
  ): BaseProvider {
    const Ctor = PROVIDER_CTORS[providerId];
    return new Ctor(apiKey, selectedModelId, toolConfig);
  }

  getProviderIdForModel(selectedModelId: string): AiProvider | undefined {
    return findProviderBySelectedModel(selectedModelId);
  }

  getProviderInfo(providerId: string): ProviderInfo | undefined {
    if (!isAiProvider(providerId)) {
      return undefined;
    }
    return getProviderInfoById(providerId);
  }

  getProviderName(providerId: AiProvider): string {
    const provider = getProviderInfoById(providerId);
    if (!provider) {
      throw new Error(`Provider "${providerId}" is not configured.`);
    }
    return provider.name;
  }

  listProviders(): ProviderInfo[] {
    return getVisibleProviderInfos();
  }
}

export const providerFactory = new ProviderFactory();
