export interface ProviderModelInfo {
  id: string;
  modelId?: string;
  reasoningEffort?: "low" | "medium" | "high" | "xhigh";
  googleThinkingLevel?: "minimal" | "low" | "medium" | "high";
  anthropicThinkingBudgetTokens?: number;
  /** xAI reasoning models: reasoningEffort for grok-4-1-fast-reasoning etc. */
  xaiReasoningEffort?: "low" | "high";
  /** Moonshot AI thinking models: budget tokens for kimi-k2-thinking */
  moonshotaiThinkingBudgetTokens?: number;
  displayName: string;
  description: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  /** URL where users can obtain an API key for this provider */
  apiKeyUrl?: string;
  /** Path to provider logo in public folder (e.g. /provider-logos/openai.svg) */
  logoPath: string;
  models: ProviderModelInfo[];
}

const ANTHROPIC_THINKING_BUDGET_TOKENS = 16000;

export const PROVIDERS: ProviderInfo[] = [
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-5.2, GPT-5 mini, GPT-5 nano",
    apiKeyUrl: "https://platform.openai.com/api-keys",
    logoPath: "/provider-logos/openai.svg",
    models: [
      {
        id: "gpt-5.2-low",
        modelId: "gpt-5.2",
        reasoningEffort: "low",
        displayName: "GPT-5.2 (Low)",
        description:
          "The best model for coding and agentic tasks across industries.",
      },
      {
        id: "gpt-5.2-medium",
        modelId: "gpt-5.2",
        reasoningEffort: "medium",
        displayName: "GPT-5.2 (Medium)",
        description:
          "Balanced reasoning depth for strong quality with practical latency.",
      },
      {
        id: "gpt-5.2-high",
        modelId: "gpt-5.2",
        reasoningEffort: "high",
        displayName: "GPT-5.2 (High)",
        description: "Deeper reasoning for harder tasks that need extra thought.",
      },
      {
        id: "gpt-5.2-xhigh",
        modelId: "gpt-5.2",
        reasoningEffort: "xhigh",
        displayName: "GPT-5.2 (XHigh)",
        description:
          "Maximum reasoning effort for the most complex problem-solving tasks.",
      },
      {
        id: "gpt-5-mini-low",
        modelId: "gpt-5-mini",
        reasoningEffort: "low",
        displayName: "GPT-5 mini (Low)",
        description:
          "A faster, cost-efficient version of GPT-5 for well-defined tasks.",
      },
      {
        id: "gpt-5-mini-medium",
        modelId: "gpt-5-mini",
        reasoningEffort: "medium",
        displayName: "GPT-5 mini (Medium)",
        description:
          "Balanced speed and quality for everyday development workflows.",
      },
      {
        id: "gpt-5-mini-high",
        modelId: "gpt-5-mini",
        reasoningEffort: "high",
        displayName: "GPT-5 mini (High)",
        description: "Higher reasoning depth when you want better answer quality.",
      },
      {
        id: "gpt-5-nano-low",
        modelId: "gpt-5-nano",
        reasoningEffort: "low",
        displayName: "GPT-5 nano (Low)",
        description: "Fastest, most cost-efficient version of GPT-5.",
      },
      {
        id: "gpt-5-nano-medium",
        modelId: "gpt-5-nano",
        reasoningEffort: "medium",
        displayName: "GPT-5 nano (Medium)",
        description:
          "Budget-friendly model with balanced reasoning for simple requests.",
      },
      {
        id: "gpt-5-nano-high",
        modelId: "gpt-5-nano",
        reasoningEffort: "high",
        displayName: "GPT-5 nano (High)",
        description:
          "More deliberate reasoning while keeping costs lower than larger models.",
      },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude Opus 4.6, Claude Sonnet 4.6, Claude Haiku 4.5",
    apiKeyUrl: "https://console.anthropic.com/settings/keys",
    logoPath: "/provider-logos/anthropic.svg",
    models: [
      {
        id: "claude-opus-4-6-non-thinking",
        modelId: "claude-opus-4-6",
        displayName: "Claude Opus 4.6 (Non-thinking)",
        description:
          "The most intelligent model for building agents and coding.",
      },
      {
        id: "claude-opus-4-6-thinking",
        modelId: "claude-opus-4-6",
        anthropicThinkingBudgetTokens: ANTHROPIC_THINKING_BUDGET_TOKENS,
        displayName: "Claude Opus 4.6 (Thinking)",
        description:
          "Extended thinking enabled for harder multi-step coding and reasoning tasks.",
      },
      {
        id: "claude-sonnet-4-6-non-thinking",
        modelId: "claude-sonnet-4-6",
        displayName: "Claude Sonnet 4.6 (Non-thinking)",
        description:
          "The best combination of speed and intelligence.",
      },
      {
        id: "claude-sonnet-4-6-thinking",
        modelId: "claude-sonnet-4-6",
        anthropicThinkingBudgetTokens: ANTHROPIC_THINKING_BUDGET_TOKENS,
        displayName: "Claude Sonnet 4.6 (Thinking)",
        description: "Extended thinking enabled for complex multi-step problem solving.",
      },
      {
        id: "claude-haiku-4-5",
        displayName: "Claude Haiku 4.5",
        description: "The fastest model with near-frontier intelligence.",
      },
    ],
  },
  {
    id: "google",
    name: "Google",
    description: "Gemini 3.1 Pro, Gemini 3 Flash (preview)",
    apiKeyUrl: "https://aistudio.google.com/app/apikey",
    logoPath: "/provider-logos/google.svg",
    models: [
      {
        id: "gemini-3.1-pro-preview-low",
        modelId: "gemini-3.1-pro-preview",
        googleThinkingLevel: "low",
        displayName: "Gemini 3.1 Pro (Low)",
        description:
          "Advanced intelligence, complex problem-solving skills, and powerful agentic and vibe coding capabilities. New Preview.",
      },
      {
        id: "gemini-3.1-pro-preview-high",
        modelId: "gemini-3.1-pro-preview",
        googleThinkingLevel: "high",
        displayName: "Gemini 3.1 Pro (High)",
        description:
          "Deeper thinking mode for complex tasks with stronger reasoning depth.",
      },
      {
        id: "gemini-3-flash-preview-low",
        modelId: "gemini-3-flash-preview",
        googleThinkingLevel: "low",
        displayName: "Gemini 3 Flash (Low)",
        description:
          "Frontier-class performance rivaling larger models at a fraction of the cost. Preview.",
      },
      {
        id: "gemini-3-flash-preview-medium",
        modelId: "gemini-3-flash-preview",
        googleThinkingLevel: "medium",
        displayName: "Gemini 3 Flash (Medium)",
        description:
          "Balanced thinking mode for practical speed and answer quality.",
      },
      {
        id: "gemini-3-flash-preview-high",
        modelId: "gemini-3-flash-preview",
        googleThinkingLevel: "high",
        displayName: "Gemini 3 Flash (High)",
        description:
          "Higher thinking mode for difficult prompts and deeper analysis.",
      },
      {
        id: "gemini-3-flash-preview-minimal",
        modelId: "gemini-3-flash-preview",
        googleThinkingLevel: "minimal",
        displayName: "Gemini 3 Flash (Minimal)",
        description:
          "Minimal thinking mode for fastest responses when latency is critical.",
      },
    ],
  },
  {
    id: "moonshotai",
    name: "Moonshot AI",
    description: "Kimi K2.5, Kimi K2 Thinking — visual agentic intelligence",
    apiKeyUrl: "https://platform.moonshot.ai",
    logoPath: "/provider-logos/moonshotai.png",
    models: [
      {
        id: "kimi-k2.5",
        modelId: "kimi-k2.5",
        displayName: "Kimi K2.5",
        description:
          "Most powerful open-source model with vision, coding, and agent swarm. Native multimodal.",
      },
      {
        id: "kimi-k2-thinking",
        modelId: "kimi-k2-thinking",
        moonshotaiThinkingBudgetTokens: 2048,
        displayName: "Kimi K2 Thinking",
        description:
          "Step-by-step reasoning model for complex multi-step tasks.",
      },
    ],
  },
  {
    id: "xai",
    name: "xAI",
    description: "Grok 4 — reasoning and vision models",
    apiKeyUrl: "https://console.x.ai",
    logoPath: "/provider-logos/xai.svg",
    models: [
      {
        id: "grok-4-1-fast-reasoning-high",
        modelId: "grok-4-1-fast-reasoning",
        xaiReasoningEffort: "high",
        displayName: "Grok 4.1 Fast Reasoning (High)",
        description:
          "Vision and reasoning model with high reasoning effort for complex tasks.",
      },
      {
        id: "grok-4-1-fast-reasoning-low",
        modelId: "grok-4-1-fast-reasoning",
        xaiReasoningEffort: "low",
        displayName: "Grok 4.1 Fast Reasoning (Low)",
        description:
          "Vision and reasoning model with low reasoning effort for faster responses.",
      },
    ],
  },
];

export const DEFAULT_ENABLED_MODELS: Record<string, string[]> = {
  openai: ["gpt-5-mini-medium"],
  anthropic: ["claude-sonnet-4-6-non-thinking"],
  google: ["gemini-3-flash-preview-medium"],
  moonshotai: ["kimi-k2.5"],
  xai: ["grok-4-1-fast-reasoning-high"],
};

export function resolveProviderModel(
  providerId: string,
  selectedModelId: string,
): {
  modelId: string;
  reasoningEffort?: ProviderModelInfo["reasoningEffort"];
  googleThinkingLevel?: ProviderModelInfo["googleThinkingLevel"];
  anthropicThinkingBudgetTokens?: ProviderModelInfo["anthropicThinkingBudgetTokens"];
  xaiReasoningEffort?: ProviderModelInfo["xaiReasoningEffort"];
  moonshotaiThinkingBudgetTokens?: ProviderModelInfo["moonshotaiThinkingBudgetTokens"];
} {
  const provider = PROVIDERS.find((item) => item.id === providerId);
  const selectedModel = provider?.models.find((item) => item.id === selectedModelId);

  if (!selectedModel) {
    throw new Error(`Model ${selectedModelId} not found for provider ${providerId}`);
  }

  return {
    modelId: selectedModel.modelId ?? selectedModel.id,
    reasoningEffort: selectedModel.reasoningEffort,
    googleThinkingLevel: selectedModel.googleThinkingLevel,
    anthropicThinkingBudgetTokens: selectedModel.anthropicThinkingBudgetTokens,
    xaiReasoningEffort: selectedModel.xaiReasoningEffort,
    moonshotaiThinkingBudgetTokens: selectedModel.moonshotaiThinkingBudgetTokens,
  };
}
