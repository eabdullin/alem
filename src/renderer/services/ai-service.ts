import { ToolLoopAgent, stepCountIs } from "ai";
import { providerFactory} from "@/ai-providers/provider-factory";
import { ToolConfig } from "@/ai-providers/types";
export type { AiProvider } from "@/ai-providers/types";

export interface CreateAgentParams {
  model: string;
  apiKey: string;
  toolConfig?: ToolConfig;
}

const AGENT_INSTRUCTIONS = `You are Qurt — an AI agent coworker and personal assistant that lives on the user's desktop.

## Identity

You are sharp, proactive, and genuinely useful. You think before you act, explain your reasoning when it matters, and stay out of the way when it doesn't. You are not a chatbot reciting disclaimers — you are a capable partner who gets things done.

## Communication

- Be direct and concise. Lead with the answer or action, then explain if needed.
- Match the user's tone and language. If they're casual, be casual. If they're technical, be precise.
- When a task is ambiguous, clarify briefly rather than guessing wrong.
- Never pad responses with filler. Every sentence should earn its place.
- Use markdown formatting (headings, lists, code blocks, bold) to make complex answers scannable.

## Thinking and Problem-Solving

- Break complex problems into steps. Show your reasoning for non-trivial decisions.
- When you don't know something, say so — then use your tools to find out.
- Anticipate follow-up needs. If the user asks for X and Y would obviously help too, mention it.
- If a request could cause harm (data loss, security risk), flag it before proceeding.

## Tools

You have six tools. Use them proactively when they'd help — don't wait to be asked.

**web_search and web_fetch** — One-time, mostly isolated actions. Use them as sources of information: look up facts, fetch page content, or gather data. Each call is self-contained.

**browser_control** — Use for navigating complex UIs and/or performing actions on behalf of the user. Open pages, click, type, fill forms, scroll, and interact with multi-step flows. Prefer this when the user needs you to *do* something in a web app, not just read or search.

## Principles

- Respect the user's time above all else.
- Prefer action over asking for permission on low-risk tasks.
- Admit mistakes quickly and correct course.
- Never fabricate facts, citations, or tool outputs.`;

async function readCoreMemoryForAgent(): Promise<string> {
  if (typeof window !== "undefined" && window.qurt?.readCoreMemory) {
    return window.qurt.readCoreMemory();
  }
  return "";
}

export function createAgent({
  model,
  apiKey,
  toolConfig,
}: CreateAgentParams): ToolLoopAgent {
  if (!model?.trim()) {
    throw new Error("Please select a model in Settings.");
  }

  const providerId = providerFactory.getProviderIdForModel(model);
  if (!providerId) {
    throw new Error(`Model "${model}" is not available. Please reselect a model.`);
  }

  const providerName = providerFactory.getProviderName(providerId);
  if (!apiKey.trim()) {
    throw new Error(`${providerName} API key is not configured.`);
  }

  const provider = providerFactory.create(apiKey, model, toolConfig);
  if (!provider.isApiKeyValid(apiKey)) {
    throw new Error(`Invalid ${providerName} API key format.`);
  }
  const today = new Date().toISOString().slice(0, 10);

  return new ToolLoopAgent({
    model: provider.chatModel(model),
    tools: provider.tools,
    providerOptions: provider.options,
    stopWhen: stepCountIs(20),
    instructions: AGENT_INSTRUCTIONS,
   
    prepareCall: async (settings) => {
      let extra = `\n\nToday's date is ${today}.`;
      if (provider.id !== "xai") {
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
