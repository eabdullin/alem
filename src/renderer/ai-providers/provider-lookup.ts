import {
  getAllProviderInfos,
  getProviderInfoById,
} from "./provider-catalog";
import type {
  AiProvider,
  ProviderInfo,
} from "./types";

const KNOWN_PROVIDERS: ReadonlySet<AiProvider> = new Set([
  "openai",
  "anthropic",
  "google",
  "moonshotai",
  "xai",
]);

export function isAiProvider(value: string | undefined): value is AiProvider {
  return !!value && KNOWN_PROVIDERS.has(value as AiProvider);
}

export function getProviderInfo(providerId: AiProvider): ProviderInfo | undefined {
  return getProviderInfoById(providerId);
}

export function getProviderInfoOrThrow(providerId: AiProvider): ProviderInfo {
  const provider = getProviderInfo(providerId);
  if (!provider) {
    throw new Error(`Provider "${providerId}" is not configured.`);
  }
  return provider;
}

export function findProviderBySelectedModel(
  selectedModelId: string,
): AiProvider | undefined {
  for (const provider of getAllProviderInfos()) {
    if (provider.models.some((model) => model.id === selectedModelId)) {
      return provider.id as AiProvider;
    }
  }
  return undefined;
}

