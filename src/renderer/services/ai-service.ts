import { ToolLoopAgent, stepCountIs } from "ai";
import { getToolSetForProvider } from "@/tools";
import { providerService, type AgentConfig } from "./provider-service";

export type { AiProvider } from "./provider-service";

export type CreateAgentParams = AgentConfig;

const AGENT_INSTRUCTIONS =
  "You are a helpful assistant. Use web search when live or recent information is required. Use run_terminal only for running single commands in the user's workspace (e.g. git status, npm run build); pass command as tokens; commands run in the chat's workspace folder, network is disabled by default. Use apply_file_patch to edit workspace files via unified diff or strict patch DSL; paths are relative to workspace root, binary files are blocked. Use browser_control to navigate and interact with web pages via screenshots, mouse clicks, scrolls, and typing (open, navigate, click_at x/y from the latest screenshot, type, press, scroll, wait seconds, screenshot); one browser window per chat, http/https only. Use the memory tool to save and recall important information: store durable user facts in /memories/core.md, detailed notes in /memories/notes.md; search /memories/conversations.jsonl for prior context. When the user explicitly asks to remember something, or when you learn a clear durable fact (preferences, constraints, goals), use the memory tool. Keep memory operations invisible in user-facing replies.";

async function readCoreMemoryForAgent(): Promise<string> {
  if (typeof window !== "undefined" && window.alem?.readCoreMemory) {
    return window.alem.readCoreMemory();
  }
  return "";
}

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
  const today = new Date().toISOString().slice(0, 10);

  return new ToolLoopAgent({
    model: providerService.createChatModel(provider, resolvedModel.modelId, apiKey),
    tools,
    stopWhen: stepCountIs(5),
    instructions: AGENT_INSTRUCTIONS,
    providerOptions,
    prepareCall: async (settings) => {
      let extra = `\n\nToday's date is ${today}.`;
      if (provider !== "xai") {
        const coreMemory = await readCoreMemoryForAgent();
        extra += coreMemory.trim()
          ? `\n\nCore memory:\n${coreMemory}\n\nYou can save and recall important information using the memory tool.`
          : "\n\nYou can save and recall important information using the memory tool.";
      }
      return {
        ...settings,
        instructions: `${settings.instructions ?? AGENT_INSTRUCTIONS}${extra}`,
      };
    },
  });
}
