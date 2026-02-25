import type { UIMessage } from "ai";
import type { ChatToolApprovalRule } from "@/types/tool-approval";
import {
  CHAT_HISTORY_UPDATED_EVENT,
  DEFAULT_CHAT_TITLE,
  readSessions,
  getChat,
  createChat,
  updateChat,
  archiveChats,
  deleteChats,
  clearChats,
} from "../db/repos/chats.repo";
import type { ChatSessionRecord } from "../db/appDb";

export { CHAT_HISTORY_UPDATED_EVENT, DEFAULT_CHAT_TITLE };
export type ChatSession = ChatSessionRecord;
export type { ChatToolApprovalRule };

export interface ChatStore {
  readSessions(): Promise<ChatSession[]>;
  getChat(chatId: string): Promise<ChatSession | null>;
  createChat(
    title: string,
    options?: {
      chatGroupIds?: string[];
      isArchived?: boolean;
      terminalWorkspacePath?: string;
      toolApprovalRules?: ChatToolApprovalRule;
    },
  ): Promise<ChatSession>;
  updateChat(
    chatId: string,
    update: {
      title?: string;
      messages?: UIMessage[];
      chatGroupIds?: string[];
      isArchived?: boolean;
      terminalWorkspacePath?: string;
      toolApprovalRules?: ChatToolApprovalRule;
    },
  ): Promise<ChatSession | null>;
  archiveChats(chatIds: string[]): Promise<void>;
  deleteChats(chatIds: string[]): Promise<void>;
  clearChats(): Promise<void>;
}

class DexieChatStore implements ChatStore {
  readSessions = readSessions;
  getChat = getChat;
  createChat = createChat;
  updateChat = updateChat;
  archiveChats = archiveChats;
  deleteChats = deleteChats;
  clearChats = clearChats;
}

export const chatStore = new DexieChatStore();
