import type { UIMessage } from "ai";
import type { ChatToolApprovalRule } from "@/types/tool-approval";
import { appDb, type ChatSessionRecord } from "../appDb";
import { ARCHIVED_CHAT_GROUP_ID } from "./chat-groups.repo";

export const CHAT_HISTORY_UPDATED_EVENT = "alem:chat-history-updated";
export const DEFAULT_CHAT_TITLE = "New chat";

function createChatId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emitChatHistoryUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CHAT_HISTORY_UPDATED_EVENT));
}

export async function readSessions(): Promise<ChatSessionRecord[]> {
  return appDb.chats.orderBy("updatedAt").reverse().toArray();
}

export async function getChat(chatId: string): Promise<ChatSessionRecord | null> {
  return (await appDb.chats.get(chatId)) ?? null;
}

export async function createChat(
  title: string,
  options?: {
    chatGroupIds?: string[];
    isArchived?: boolean;
    terminalWorkspacePath?: string;
    toolApprovalRules?: ChatToolApprovalRule;
  }
): Promise<ChatSessionRecord> {
  const now = new Date().toISOString();
  const chatGroupIds = options?.chatGroupIds ?? [];
  const isArchived = options?.isArchived ?? chatGroupIds.includes(ARCHIVED_CHAT_GROUP_ID);
  const groupIds = isArchived
    ? [...new Set([...chatGroupIds, ARCHIVED_CHAT_GROUP_ID])]
    : chatGroupIds.filter((id) => id !== ARCHIVED_CHAT_GROUP_ID);

  const session: ChatSessionRecord = {
    id: createChatId(),
    title: title.trim() || DEFAULT_CHAT_TITLE,
    messages: [],
    chatGroupIds: groupIds,
    isArchived,
    terminalWorkspacePath: options?.terminalWorkspacePath?.trim() || undefined,
    toolApprovalRules: options?.toolApprovalRules,
    createdAt: now,
    updatedAt: now,
  };

  await appDb.chats.add(session);
  emitChatHistoryUpdated();
  return session;
}

export async function updateChat(
  chatId: string,
  update: {
    title?: string;
    messages?: UIMessage[];
    chatGroupIds?: string[];
    isArchived?: boolean;
    terminalWorkspacePath?: string;
    toolApprovalRules?: ChatToolApprovalRule;
  }
): Promise<ChatSessionRecord | null> {
  const current = await appDb.chats.get(chatId);
  if (!current) return null;

  const nextIsArchived = update.isArchived ?? current.isArchived;
  const requestedGroupIds = update.chatGroupIds ?? current.chatGroupIds;
  const groupIds = nextIsArchived
    ? [...new Set([...requestedGroupIds, ARCHIVED_CHAT_GROUP_ID])]
    : requestedGroupIds.filter((id) => id !== ARCHIVED_CHAT_GROUP_ID);

  const updated: ChatSessionRecord = {
    ...current,
    title: update.title ?? current.title,
    messages: update.messages ?? current.messages,
    chatGroupIds: groupIds,
    isArchived: nextIsArchived,
    terminalWorkspacePath:
      update.terminalWorkspacePath !== undefined
        ? (update.terminalWorkspacePath?.trim() || undefined)
        : current.terminalWorkspacePath,
    toolApprovalRules: update.toolApprovalRules ?? current.toolApprovalRules,
    updatedAt: new Date().toISOString(),
  };

  await appDb.chats.put(updated);
  emitChatHistoryUpdated();
  return updated;
}

export async function archiveChats(chatIds: string[]): Promise<void> {
  if (chatIds.length === 0) return;
  const now = new Date().toISOString();
  for (const id of chatIds) {
    const chat = await appDb.chats.get(id);
    if (chat && !chat.isArchived) {
      await appDb.chats.put({
        ...chat,
        chatGroupIds: [...new Set([...chat.chatGroupIds, ARCHIVED_CHAT_GROUP_ID])],
        isArchived: true,
        updatedAt: now,
      });
    }
  }
  emitChatHistoryUpdated();
}

export async function deleteChats(chatIds: string[]): Promise<void> {
  if (chatIds.length === 0) return;
  await appDb.chats.bulkDelete(chatIds);
  emitChatHistoryUpdated();
}

export async function clearChats(): Promise<void> {
  await appDb.chats.clear();
  emitChatHistoryUpdated();
}
