import type { ToolSet } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { AiProvider } from "../types";

/**
 * Web search action: proxy to the provider's native search tool.
 * Each provider exposes a different tool name and API; this returns the correct ToolSet.
 */
export function getWebSearchToolSet(
  provider: AiProvider,
  apiKey: string,
  _options?: import("../types").ToolSetOptions
): ToolSet {
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
