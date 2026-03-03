import type { UIMessage } from "ai";

/**
 * Token usage summary attached to assistant messages by DirectChatTransport's
 * messageMetadata callback (see qurt-chat-transport.ts).
 */
export interface QurtMessageUsage {
  totalTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  cachedInputTokens?: number;
  outputTokenDetails?: { reasoningTokens?: number };
  inputTokenDetails?: { cacheReadTokens?: number };
}

/**
 * Application-level metadata attached to every UIMessage.
 * - `createdAt`: ISO-8601 timestamp of when the message was created.
 * - `totalUsage`: token usage summary, populated on assistant messages only.
 */
export interface QurtMessageMetadata {
  createdAt: string;
  totalUsage?: QurtMessageUsage;
}

/** Typed UIMessage used throughout the Qurt renderer. */
export type QurtUIMessage = UIMessage<QurtMessageMetadata>;
