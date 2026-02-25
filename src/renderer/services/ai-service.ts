import { ToolLoopAgent, stepCountIs } from "ai";
import { getToolSetForProvider } from "@/tools";
import { providerService, type AgentConfig } from "./provider-service";

export type { AiProvider } from "./provider-service";

export type CreateAgentParams = AgentConfig;

const AGENT_INSTRUCTIONS =
  "You are a helpful assistant. Use web search when live or recent information is required. Use run_terminal only for running single commands in the user's workspace (e.g. git status, npm run build); pass command as tokens; commands run in the chat's workspace folder, network is disabled by default. Use apply_file_patch to edit workspace files via unified diff or strict patch DSL; paths are relative to workspace root, binary files are blocked. Use browser_control to navigate and interact with web pages via screenshots, mouse clicks, scrolls, and typing (open, navigate, click_at x/y from the latest screenshot, type, press, scroll, wait seconds, screenshot); one browser window per chat, http/https only.";

export function createAgent({
  provider,
  model,
  apiKey,
  toolConfig,
}: CreateAgentParams): ToolLoopAgent {
  if (!apiKey.trim()) {
    throw new Error(providerService.getApiKeyErrorMessage(provider));
  }

  const resolvedModel = providerService.resolveModel(provider, model);
  const providerOptions = providerService.createProviderOptions(resolvedModel);
  const tools = getToolSetForProvider(provider, apiKey, toolConfig);

  return new ToolLoopAgent({
    model: providerService.createChatModel(provider, resolvedModel.modelId, apiKey),
    tools,
    stopWhen: stepCountIs(5),
    instructions: AGENT_INSTRUCTIONS,
    providerOptions,
  });
}
