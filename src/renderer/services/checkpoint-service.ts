/**
 * Checkpoint service for file patch revert.
 * Provides helpers to extract checkpoint IDs from messages and orchestrate restore.
 */

import type { UIMessage } from "ai";
import type { ChatSession } from "@/stores/chat-store";

export interface RestoreContext {
  userMessageIndex: number;
  checkpointIds: string[];
  userMessageText: string;
}

export interface PerformRestoreOptions {
  messages: UIMessage[];
  chatId: string;
  workspaceRoot: string;
  setMessages: (messages: UIMessage[]) => void;
  setInputValue: (value: string) => void;
  onChatUpdate?: (chat: ChatSession) => void;
}

function getTextFromParts(parts: UIMessage["parts"]): string {
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

const CHECKPOINT_TOOL_NAMES = ["apply_file_patch", "run_terminal"] as const;

/**
 * Extract checkpoint IDs (timestamps) from tool parts in a message.
 * Supports apply_file_patch and run_terminal (both create rdiff-backup checkpoints).
 */
export function getCheckpointIdsFromMessage(message: UIMessage): string[] {
  const ids: string[] = [];
  for (const part of message.parts) {
    if (!(part.type === "dynamic-tool" || part.type.startsWith("tool-")))
      continue;
    const name =
      part.type === "dynamic-tool" ? part.toolName : part.type.slice(5);
    if (!CHECKPOINT_TOOL_NAMES.includes(name as (typeof CHECKPOINT_TOOL_NAMES)[number])) continue;
    let output: unknown =
      "output" in part ? part.output : "result" in part ? part.result : undefined;
    if (typeof output === "string") {
      try {
        output = JSON.parse(output) as Record<string, unknown>;
      } catch {
        continue;
      }
    }
    if (output && typeof output === "object" && "checkpoint_id" in output) {
      const id = (output as { checkpoint_id?: string }).checkpoint_id;
      if (typeof id === "string" && id) ids.push(id);
    }
  }
  return ids;
}

/**
 * Build restore context for a user message: checkpoint IDs from following assistant
 * messages and the user message text for re-editing.
 */
export function getRestoreContextForUserMessage(
  messages: UIMessage[],
  userMessageIndex: number
): RestoreContext | null {
  const userMsg = messages[userMessageIndex];
  if (!userMsg || userMsg.role !== "user") return null;

  const checkpointIds: string[] = [];
  for (let i = userMessageIndex + 1; i < messages.length; i++) {
    const m = messages[i];
    if (m?.role === "assistant") {
      checkpointIds.push(...getCheckpointIdsFromMessage(m));
    }
  }
  if (checkpointIds.length === 0) return null;

  const userMessageText = getTextFromParts(userMsg.parts);
  return { userMessageIndex, checkpointIds, userMessageText };
}

/**
 * Restore workspace to checkpoint(s) via IPC. Uses earliest timestamp.
 * Requires workspaceRoot for rdiff-backup restore.
 */
export async function restoreCheckpoints(
  workspaceRoot: string,
  checkpointIds: string[]
): Promise<{ restored: boolean; error?: string }> {
  if (!window.qurt?.restoreCheckpoints) {
    return { restored: false, error: "Restore is not available." };
  }
  return window.qurt.restoreCheckpoints({ workspaceRoot, checkpointIds });
}

/**
 * Perform full restore: revert files, trim messages, set input, and persist chat.
 */
export async function performRestore(
  ctx: RestoreContext,
  options: PerformRestoreOptions
): Promise<{ ok: boolean; error?: string }> {
  const { messages, chatId, workspaceRoot, setMessages, setInputValue, onChatUpdate } =
    options;

  const result = await restoreCheckpoints(workspaceRoot, ctx.checkpointIds);
  if (!result.restored) {
    return { ok: false, error: result.error ?? "Failed to restore files." };
  }

  const newMessages = messages.slice(0, ctx.userMessageIndex);
  setMessages(newMessages);
  setInputValue(ctx.userMessageText);

  const { chatService } = await import("./chat-service");
  const updated = await chatService.saveMessages(chatId, newMessages);
  if (updated && updated.id === chatId && onChatUpdate) {
    onChatUpdate(updated);
  }

  return { ok: true };
}
