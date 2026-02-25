import type { ToolSet } from "ai";
import type { AiProvider } from "../types";
import { providerService } from "@/services/provider-service";

/**
 * Web search action: proxy to the provider's native search tool.
 * Each provider exposes a different tool name and API; this returns the correct ToolSet.
 */
export function getWebSearchToolSet(
  provider: AiProvider,
  apiKey: string,
  _options?: import("../types").ToolSetOptions
): ToolSet {
  return providerService.createWebSearchToolSet(provider, apiKey);
}
