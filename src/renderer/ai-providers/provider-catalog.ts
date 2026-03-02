import type { ProviderInfo, AiProvider } from "./types";
import { OPENAI_PROVIDER_INFO } from "./openai-provider";
import { ANTHROPIC_PROVIDER_INFO } from "./anthropic-provider";
import { GOOGLE_PROVIDER_INFO } from "./google-provider";
import { MOONSHOT_PROVIDER_INFO } from "./moonshot-provider";
import { XAI_PROVIDER_INFO } from "./xai-provider";

const ALL_PROVIDER_INFOS: Record<AiProvider, ProviderInfo> = {
  openai: OPENAI_PROVIDER_INFO,
  anthropic: ANTHROPIC_PROVIDER_INFO,
  google: GOOGLE_PROVIDER_INFO,
  moonshotai: MOONSHOT_PROVIDER_INFO,
  xai: XAI_PROVIDER_INFO,
};

// Preserve current product behavior: moonshot is not shown in UI catalog yet.
const VISIBLE_PROVIDER_IDS: AiProvider[] = ["openai", "anthropic", "google", "xai"];

export function getAllProviderInfos(): ProviderInfo[] {
  return Object.values(ALL_PROVIDER_INFOS);
}

export function getVisibleProviderInfos(): ProviderInfo[] {
  return VISIBLE_PROVIDER_IDS.map((id) => ALL_PROVIDER_INFOS[id]);
}

export function getProviderInfoById(providerId: AiProvider): ProviderInfo | undefined {
  return ALL_PROVIDER_INFOS[providerId];
}
