import {
  ToolLoopAgent,
  generateText,
  stepCountIs,
  type ModelMessage,
  type ToolSet,
} from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { resolveProviderModel } from "@/constants/providers";
import { getToolSetForProvider } from "@/tools";
import type { ChatAttachment } from "../types/chat-attachment";
import type { PromptMode } from "../types/prompt-mode";

export type AiProvider = "openai" | "anthropic" | "google";

/** One step in the assistant's chain of thought (reasoning or tool use). */
export type AiChainStep =
  | { type: "reasoning"; text: string }
  | {
      type: "tool";
      toolName: string;
      input: unknown;
      output?: unknown;
      errorText?: string;
    };

export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  /** Ordered steps (reasoning + tool calls) for assistant messages. When present, overrides standalone reasoning. */
  chainSteps?: AiChainStep[];
  attachments?: ChatAttachment[];
}

export interface AiChatReply {
  text: string;
  reasoning?: string;
  /** When in agent mode, ordered reasoning and tool steps from the run. */
  chainSteps?: AiChainStep[];
  /** When a tool needs approval, one or more pending requests. Reply is partial until user approves/rejects. */
  pendingApprovals?: PendingApproval[];
  /** Pass to continueChatReply after user responds to pending approvals. Only set when pendingApprovals is set. */
  continueMessages?: ModelMessage[];
}

export interface PendingApproval {
  approvalId: string;
  toolCallId: string;
  toolName: string;
  input: unknown;
}

interface GenerateChatReplyParams {
  provider: AiProvider;
  model: string;
  apiKey: string;
  mode?: PromptMode;
  messages: AiChatMessage[];
  resolveAttachmentData?: (attachment: ChatAttachment) => Promise<string>;
  /** Per-chat workspace root for terminal tool; overrides global default when set. */
  terminalWorkspaceOverride?: string;
}

/** Callbacks for real-time updates during streaming (agent mode). */
export interface StreamChatReplyCallbacks {
  /** Called after each step (reasoning + tool call) so the UI can show progress. */
  onStepsUpdate?: (chainSteps: AiChainStep[]) => void;
  /** Called when the final text is known (may be called multiple times as more text is available). */
  onTextUpdate?: (text: string) => void;
}

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue | undefined };

const PROVIDER_NAMES: Record<AiProvider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
};

function getModel(provider: AiProvider, model: string, apiKey: string) {
  switch (provider) {
    case "openai":
      return createOpenAI({ apiKey })(model);
    case "anthropic":
      return createAnthropic({ apiKey })(model);
    case "google":
      return createGoogleGenerativeAI({ apiKey })(model);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

function extractReasoning(resultRecord: Record<string, unknown>): string {
  let reasoning = "";

  const reasoningText = resultRecord.reasoningText;
  if (typeof reasoningText === "string") {
    reasoning = reasoningText.trim();
  }

  if (!reasoning) {
    const reasoningValue = resultRecord.reasoning;
    if (typeof reasoningValue === "string") {
      reasoning = reasoningValue.trim();
    } else if (Array.isArray(reasoningValue)) {
      reasoning = reasoningValue
        .map((item) => (typeof item === "string" ? item : ""))
        .filter(Boolean)
        .join("\n\n")
        .trim();
    }
  }

  if (!reasoning) {
    const content = resultRecord.content;
    if (Array.isArray(content)) {
      const reasoningParts = content
        .map((part) => {
          if (!part || typeof part !== "object") {
            return "";
          }
          const typedPart = part as Record<string, unknown>;
          return typedPart.type === "reasoning" && typeof typedPart.text === "string"
            ? typedPart.text
            : "";
        })
        .filter(Boolean);
      reasoning = reasoningParts.join("\n\n").trim();
    }
  }

  return reasoning;
}

async function toModelMessages(
  messages: AiChatMessage[],
  resolveAttachmentData?: (attachment: ChatAttachment) => Promise<string>,
): Promise<ModelMessage[]> {
  const modelMessages: ModelMessage[] = [];

  for (const message of messages) {
    const attachments = message.attachments ?? [];
    const hasAttachments = message.role === "user" && attachments.length > 0;

    if (!hasAttachments) {
      modelMessages.push({
        role: message.role,
        content: message.content,
      });
      continue;
    }

    if (!resolveAttachmentData) {
      throw new Error("Attachment resolver is not configured.");
    }

    const contentParts: Array<
      | {
          type: "text";
          text: string;
        }
      | {
          type: "file";
          mediaType: string;
          data: string;
          filename: string;
        }
    > = [];

    if (message.content.trim()) {
      contentParts.push({
        type: "text",
        text: message.content,
      });
    }

    for (const attachment of attachments) {
      const data = await resolveAttachmentData(attachment);
      contentParts.push({
        type: "file",
        mediaType: attachment.mediaType,
        data,
        filename: attachment.name,
      });
    }

    modelMessages.push({
      role: message.role,
      content: contentParts,
    } as ModelMessage);
  }

  return modelMessages;
}

export async function generateChatReply({
  provider,
  model,
  apiKey,
  mode = "ask",
  messages,
  resolveAttachmentData,
  terminalWorkspaceOverride,
}: GenerateChatReplyParams): Promise<AiChatReply> {
  if (!apiKey.trim()) {
    throw new Error(`${PROVIDER_NAMES[provider]} API key is not configured.`);
  }

  const modelMessages = await toModelMessages(messages, resolveAttachmentData);
  const resolvedModel = resolveProviderModel(provider, model);
  const providerOptionsMap: Record<string, { [key: string]: JsonValue | undefined }> = {};

  if (provider === "openai" && resolvedModel.reasoningEffort) {
    providerOptionsMap.openai = {
      reasoningEffort: resolvedModel.reasoningEffort,
      reasoningSummary: "auto",
    };
  }

  if (provider === "google" && resolvedModel.googleThinkingLevel) {
    providerOptionsMap.google = {
      thinkingConfig: {
        includeThoughts: true,
        thinkingLevel: resolvedModel.googleThinkingLevel,
      },
    };
  }

  if (provider === "anthropic" && resolvedModel.anthropicThinkingBudgetTokens) {
    providerOptionsMap.anthropic = {
      thinking: {
        type: "enabled",
        budgetTokens: resolvedModel.anthropicThinkingBudgetTokens,
      },
    };
  }

  const providerOptions =
    Object.keys(providerOptionsMap).length > 0 ? providerOptionsMap : undefined;

  const result =
    mode === "agent"
      ? await new ToolLoopAgent({
          model: getModel(provider, resolvedModel.modelId, apiKey),
          tools: getToolSetForProvider(provider, apiKey, {
            terminalWorkspaceOverride,
          }),
          stopWhen: stepCountIs(5),
          instructions:
            "You are a helpful assistant. Use web search when live or recent information is required. Use run_terminal only for running single commands in the user's workspace (e.g. git status, npm run build); pass command as tokens; commands run in the chat's workspace folder, network is disabled by default.",
          providerOptions,
        }).generate({
          messages: modelMessages,
        })
      : await generateText({
          model: getModel(provider, resolvedModel.modelId, apiKey),
          messages: modelMessages,
          providerOptions,
        });

  const resultRecord = result as unknown as Record<string, unknown>;
  const reasoning = extractReasoning(resultRecord);
  const chainSteps =
    mode === "agent" ? extractChainSteps(resultRecord) : undefined;

  const pendingApprovals =
    mode === "agent" ? extractPendingApprovals(resultRecord) : [];

  let text = result.text?.trim();
  if (!text) {
    if (mode === "agent" && (chainSteps?.length ?? 0) > 0) {
      text = "I've completed the requested actions.";
    } else if (pendingApprovals.length === 0) {
      throw new Error("The model returned an empty response.");
    } else {
      text = "A tool is waiting for your approval.";
    }
  }

  const reply: AiChatReply = {
    text,
    reasoning: reasoning || undefined,
    chainSteps,
  };

  if (pendingApprovals.length > 0) {
    const responseMessages =
      (result as { response?: { messages?: ModelMessage[] } }).response
        ?.messages ?? [];
    reply.pendingApprovals = pendingApprovals;
    reply.continueMessages = [...modelMessages, ...responseMessages];
  }

  return reply;
}

/**
 * Same as generateChatReply, but in agent mode streams steps and optional text updates
 * via callbacks so the UI can show reasoning and tool calls in real time.
 */
export async function streamChatReply(
  params: GenerateChatReplyParams & StreamChatReplyCallbacks,
): Promise<AiChatReply> {
  const {
    onStepsUpdate,
    onTextUpdate,
    provider,
    model,
    apiKey,
    mode = "ask",
    messages,
    resolveAttachmentData,
  } = params;

  if (mode !== "agent" || (!onStepsUpdate && !onTextUpdate)) {
    return generateChatReply(params);
  }

  if (!apiKey.trim()) {
    throw new Error(`${PROVIDER_NAMES[provider]} API key is not configured.`);
  }

  const modelMessages = await toModelMessages(messages, resolveAttachmentData);
  const resolvedModel = resolveProviderModel(provider, model);
  const providerOptionsMap: Record<string, { [key: string]: JsonValue | undefined }> = {};
  if (provider === "openai" && resolvedModel.reasoningEffort) {
    providerOptionsMap.openai = {
      reasoningEffort: resolvedModel.reasoningEffort,
      reasoningSummary: "auto",
    };
  }
  if (provider === "google" && resolvedModel.googleThinkingLevel) {
    providerOptionsMap.google = {
      thinkingConfig: {
        includeThoughts: true,
        thinkingLevel: resolvedModel.googleThinkingLevel,
      },
    };
  }
  if (provider === "anthropic" && resolvedModel.anthropicThinkingBudgetTokens) {
    providerOptionsMap.anthropic = {
      thinking: {
        type: "enabled",
        budgetTokens: resolvedModel.anthropicThinkingBudgetTokens,
      },
    };
  }
  const providerOptions =
    Object.keys(providerOptionsMap).length > 0 ? providerOptionsMap : undefined;

  const accumulatedSteps: StreamStepLike[] = [];
  const agent = new ToolLoopAgent({
    model: getModel(provider, resolvedModel.modelId, apiKey),
    tools: getToolSetForProvider(provider, apiKey, {
      terminalWorkspaceOverride: params.terminalWorkspaceOverride,
    }),
    stopWhen: stepCountIs(5),
    instructions:
      "You are a helpful assistant. Use web search when live or recent information is required. Use run_terminal only for running single commands in the user's workspace (e.g. git status, npm run build); pass command as tokens; commands run in the chat's workspace folder, network is disabled by default.",
    providerOptions,
  });

  const streamResult = await agent.stream({
    messages: modelMessages,
    onStepFinish(step) {
      const s = step as unknown as StreamStepLike;
      accumulatedSteps.push(s);
      onStepsUpdate?.(stepsFromStreamSteps(accumulatedSteps));
    },
  });

  // Consume the stream so it runs to completion and onStepFinish fires
  for await (const _ of streamResult.fullStream) {
    // Steps are delivered via onStepFinish; we just drive the stream
  }

  const text = (await streamResult.text)?.trim();
  const reasoningRaw = (streamResult as unknown as Record<string, unknown>).reasoningText;
  const reasoning = normalizeReasoning(reasoningRaw);
  const chainSteps = stepsFromStreamSteps(accumulatedSteps);

  const streamSteps = await (streamResult as unknown as { steps: Promise<unknown[]> }).steps;
  const pendingApprovals = extractPendingApprovals({ steps: streamSteps });

  let finalText = text;
  if (!finalText && chainSteps.length > 0) {
    finalText = "I've completed the requested actions.";
  } else if (!finalText && pendingApprovals.length === 0) {
    throw new Error("The model returned an empty response.");
  } else if (!finalText && pendingApprovals.length > 0) {
    finalText = "A tool is waiting for your approval.";
  }

  onTextUpdate?.(finalText);

  const reply: AiChatReply = {
    text: finalText,
    reasoning: reasoning || undefined,
    chainSteps,
  };

  if (pendingApprovals.length > 0) {
    const response = await (streamResult as unknown as { response: Promise<{ messages?: ModelMessage[] }> }).response;
    reply.pendingApprovals = pendingApprovals;
    reply.continueMessages = [...modelMessages, ...(response.messages ?? [])];
  }

  return reply;
}

/**
 * Continue an agent run after the user has approved or rejected a tool.
 * Pass the continueMessages from the reply that had pendingApprovals and the user's response(s).
 */
export async function continueChatReply(
  params: GenerateChatReplyParams & {
    continueMessages: ModelMessage[];
    approvalResponses: Array<{ approvalId: string; approved: boolean; reason?: string }>;
  },
): Promise<AiChatReply> {
  const {
    provider,
    model,
    apiKey,
    mode = "ask",
    continueMessages,
    approvalResponses,
  } = params;

  if (!apiKey.trim()) {
    throw new Error(`${PROVIDER_NAMES[provider]} API key is not configured.`);
  }

  const resolvedModel = resolveProviderModel(provider, model);
  const providerOptionsMap: Record<string, { [key: string]: JsonValue | undefined }> = {};
  if (provider === "openai" && resolvedModel.reasoningEffort) {
    providerOptionsMap.openai = {
      reasoningEffort: resolvedModel.reasoningEffort,
      reasoningSummary: "auto",
    };
  }
  if (provider === "google" && resolvedModel.googleThinkingLevel) {
    providerOptionsMap.google = {
      thinkingConfig: {
        includeThoughts: true,
        thinkingLevel: resolvedModel.googleThinkingLevel,
      },
    };
  }
  if (provider === "anthropic" && resolvedModel.anthropicThinkingBudgetTokens) {
    providerOptionsMap.anthropic = {
      thinking: {
        type: "enabled",
        budgetTokens: resolvedModel.anthropicThinkingBudgetTokens,
      },
    };
  }
  const providerOptions =
    Object.keys(providerOptionsMap).length > 0 ? providerOptionsMap : undefined;

  const toolMessage: ModelMessage = {
    role: "tool",
    content: approvalResponses.map((r) => ({
      type: "tool-approval-response" as const,
      approvalId: r.approvalId,
      approved: r.approved,
      reason: r.reason,
    })),
  };

  const messagesWithApproval = [...continueMessages, toolMessage];

  const agent = new ToolLoopAgent({
    model: getModel(provider, resolvedModel.modelId, apiKey),
    tools: getToolSetForProvider(provider, apiKey, {
      terminalWorkspaceOverride: params.terminalWorkspaceOverride,
    }),
    stopWhen: stepCountIs(5),
    instructions:
      "You are a helpful assistant. Use web search when live or recent information is required. Use run_terminal only for running single commands in the user's workspace (e.g. git status, npm run build); pass command as tokens; commands run in the chat's workspace folder, network is disabled by default.",
    providerOptions,
  });

  const result = await agent.generate({
    messages: messagesWithApproval,
  });

  const resultRecord = result as unknown as Record<string, unknown>;
  const reasoning = extractReasoning(resultRecord);
  const chainSteps = extractChainSteps(resultRecord);
  const pendingApprovals = extractPendingApprovals(resultRecord);

  let text = result.text?.trim();
  if (!text) {
    if ((chainSteps?.length ?? 0) > 0) {
      text = "I've completed the requested actions.";
    } else if (pendingApprovals.length > 0) {
      text = "A tool is waiting for your approval.";
    } else {
      throw new Error("The model returned an empty response.");
    }
  }

  const reply: AiChatReply = {
    text,
    reasoning: reasoning || undefined,
    chainSteps,
  };
  if (pendingApprovals.length > 0) {
    const responseMessages =
      (result as { response?: { messages?: ModelMessage[] } }).response
        ?.messages ?? [];
    reply.pendingApprovals = pendingApprovals;
    reply.continueMessages = [...messagesWithApproval, ...responseMessages];
  }
  return reply;
}

function normalizeReasoning(value: unknown): string | undefined {
  if (typeof value === "string") {
    const t = value.trim();
    return t || undefined;
  }
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => (typeof item === "string" ? item : (item as { text?: string })?.text))
      .filter((s): s is string => typeof s === "string");
    const t = parts.join("\n\n").trim();
    return t || undefined;
  }
  return undefined;
}

/** Minimal step shape we read from the AI SDK result (steps array). */
interface StepLike {
  reasoningText?: string;
  content?: Array<{
    type: string;
    text?: string;
    toolName?: string;
    toolCallId?: string;
    args?: unknown;
    input?: unknown;
    output?: unknown;
    result?: unknown;
  }>;
}

/** Extract pending tool approval requests from SDK result (steps). */
function extractPendingApprovals(resultRecord: Record<string, unknown>): PendingApproval[] {
  const steps = resultRecord.steps as Array<{ content?: Array<{ type: string; approvalId?: string; toolCall?: { toolCallId?: string; toolName?: string; input?: unknown } }> }> | undefined;
  if (!Array.isArray(steps)) return [];
  const out: PendingApproval[] = [];
  for (const step of steps) {
    const content = step.content ?? [];
    for (const part of content) {
      if (part.type === "tool-approval-request" && part.approvalId && part.toolCall) {
        out.push({
          approvalId: part.approvalId,
          toolCallId: part.toolCall.toolCallId ?? "",
          toolName: part.toolCall.toolName ?? "",
          input: part.toolCall.input ?? {},
        });
      }
    }
  }
  return out;
}

function extractChainSteps(resultRecord: Record<string, unknown>): AiChainStep[] {
  const steps = resultRecord.steps as StepLike[] | undefined;
  if (!Array.isArray(steps) || steps.length === 0) {
    return [];
  }

  const out: AiChainStep[] = [];
  const resultsByCallId = new Map<string, { output?: unknown; errorText?: string }>();

  const topLevelResults = resultRecord.toolResults as Array<{
    toolCallId?: string;
    output?: unknown;
    result?: unknown;
  }> | undefined;
  if (Array.isArray(topLevelResults)) {
    for (const part of topLevelResults) {
      if (part.toolCallId != null) {
        resultsByCallId.set(part.toolCallId, {
          output: part.output ?? part.result,
          errorText: undefined,
        });
      }
    }
  }

  for (const step of steps) {
    const content = step.content ?? [];
    for (const part of content) {
      if (part.type === "tool-result" && part.toolCallId != null) {
        resultsByCallId.set(part.toolCallId, {
          output: part.output ?? (part as { result?: unknown }).result,
          errorText: undefined,
        });
      }
    }
  }

  for (const step of steps) {
    if (typeof step.reasoningText === "string" && step.reasoningText.trim()) {
      out.push({ type: "reasoning", text: step.reasoningText.trim() });
    }
    const content = step.content ?? [];
    for (const part of content) {
      if (part.type === "tool-call" && part.toolName) {
        const input = part.args ?? part.input;
        const result = part.toolCallId
          ? resultsByCallId.get(part.toolCallId)
          : undefined;
        out.push({
          type: "tool",
          toolName: part.toolName,
          input: input ?? {},
          output: result?.output,
          errorText: result?.errorText,
        });
      }
    }
  }

  return out;
}

/** Minimal StepResult-like shape from the SDK stream (one step). */
interface StreamStepLike {
  reasoningText?: string;
  content?: Array<{
    type: string;
    toolCallId?: string;
    toolName?: string;
    input?: unknown;
    args?: unknown;
    output?: unknown;
    result?: unknown;
    error?: unknown;
  }>;
  toolCalls?: Array<{
    toolCallId?: string;
    toolName?: string;
    input?: unknown;
  }>;
  toolResults?: Array<{
    toolCallId?: string;
    output?: unknown;
    error?: unknown;
  }>;
}

function stepsFromStreamSteps(steps: StreamStepLike[]): AiChainStep[] {
  const out: AiChainStep[] = [];
  for (const step of steps) {
    if (typeof step.reasoningText === "string" && step.reasoningText.trim()) {
      out.push({ type: "reasoning", text: step.reasoningText.trim() });
    }
    const content = step.content ?? [];
    const byId = new Map<string | undefined, { output?: unknown; errorText?: string }>();
    for (const part of content) {
      if (part.type === "tool-result" && part.toolCallId != null) {
        byId.set(part.toolCallId, {
          output: part.output ?? (part as { result?: unknown }).result,
          errorText: undefined,
        });
      }
      if (part.type === "tool-error" && part.toolCallId != null) {
        byId.set(part.toolCallId, {
          output: undefined,
          errorText: part.error != null ? String(part.error) : undefined,
        });
      }
    }
    const calls = step.toolCalls ?? content.filter((p) => p.type === "tool-call");
    for (const call of calls) {
      const name = "toolName" in call ? call.toolName : undefined;
      const input = "input" in call ? call.input : (call as { args?: unknown }).args;
      const id = "toolCallId" in call ? call.toolCallId : undefined;
      if (!name) continue;
      const res = id ? byId.get(id) : undefined;
      out.push({
        type: "tool",
        toolName: name,
        input: input ?? {},
        output: res?.output,
        errorText: res?.errorText,
      });
    }
  }
  return out;
}
