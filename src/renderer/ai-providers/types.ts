export type AiProvider =
  | "openai"
  | "anthropic"
  | "google"
  | "moonshotai"
  | "xai";

export interface ProviderModelInfo {
  id: string;
  displayName: string;
  description: string;
}

export interface ProviderInfo {
  id: AiProvider;
  name: string;
  description: string;
  apiKeyUrl?: string;
  logoPath: string;
  models: ProviderModelInfo[];
}

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue | undefined };

export type ProviderOptions = Record<
  string,
  { [key: string]: JsonValue | undefined }
>;

export interface ToolConfig {
  workspaceRoot?: string;
  browserChatId?: string;
  searchProviderId?: string;
}

export interface ResolvedModelConfig {
  providerId: AiProvider;
  providerInfo: ProviderInfo;
  modelInfo: ProviderModelInfo;
  selectedModelId: string;
  modelId: string;
  isReasoning: boolean;
}

export interface ModelCostInfo {
  /** Public pricing URL for current rates. */
  pricingUrl?: string;
  /** Optional note for provider-specific pricing details. */
  note?: string;
}

export interface ModelUsageInfo {
  /** Context window / max token limit for this model family. */
  maxTokens: number;
  /** Cost metadata for display in UI. */
  cost: ModelCostInfo;
}
