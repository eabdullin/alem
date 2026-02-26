import {
  CHAT_HISTORY_UPDATED_EVENT,
  DEFAULT_CHAT_TITLE,
  chatStore,
  type ChatSession,
  type ChatStore,
} from "../stores/chat-store";
import { ALEM_ATTACHMENT_PREFIX } from "./alem-chat-transport";
import { filterMessagesByKnownTools } from "@/features/chat/utils/messageParts";
import type { UIMessage } from "ai";
import { ARCHIVED_CHAT_GROUP_ID } from "./chat-group-service";

const DEFAULT_USER_AVATAR = "/images/avatar.jpg";

export { CHAT_HISTORY_UPDATED_EVENT };
export type { ChatSession };

export interface ChatHistoryListItem {
  id: string;
  title: string;
  content: string;
  url: string;
  time: string;
  users: string[];
  image?: string;
  isArchived: boolean;
  /** Workspace path for agent mode; shown as badge when set. */
  terminalWorkspacePath?: string;
}

/** Format workspace path for badge display, e.g. /some_repo or /documents. */
export function formatWorkspaceBadge(path: string | undefined): string | null {
  if (!path?.trim()) return null;
  const parts = path.replace(/\\/g, "/").split("/").filter(Boolean);
  const last = parts.at(-1);
  return last ? `/${last}` : null;
}

interface ListChatsOptions {
  groupId?: string;
}

function getTextFromParts(parts: UIMessage["parts"]): string {
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
    .trim();
}

function areMessagesEqual(left: UIMessage[], right: UIMessage[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((message, index) => {
    const other = right[index];
    if (!other || message.id !== other.id || message.role !== other.role) {
      return false;
    }
    return JSON.stringify(message.parts) === JSON.stringify(other.parts);
  });
}

function previewFromMessage(message: UIMessage | undefined): string {
  if (!message) {
    return "No messages yet";
  }

  const text = getTextFromParts(message.parts);
  if (text) {
    return text;
  }

  const fileCount = message.parts.filter((p) => p.type === "file").length;
  if (fileCount === 0) {
    return "No messages yet";
  }

  if (fileCount === 1) {
    const filePart = message.parts.find((p) => p.type === "file");
    const filename = filePart && "filename" in filePart ? filePart.filename : "file";
    return `Attachment: ${filename}`;
  }

  return `${fileCount} attachments`;
}

function previewFromMessages(messages: UIMessage[]): string {
  const message =
    [...messages].reverse().find((item) => item.role === "user") ?? messages.at(-1);
  return previewFromMessage(message);
}

function getLatestImageFilePart(messages: UIMessage[]): {
  url: string;
  mediaType: string;
  attachmentId?: string;
} | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    for (const part of messages[i].parts) {
      if (part.type === "file" && part.mediaType.startsWith("image/")) {
        const url = part.url;
        const attachmentId = url.startsWith(ALEM_ATTACHMENT_PREFIX)
          ? url.slice(ALEM_ATTACHMENT_PREFIX.length)
          : undefined;
        return { url, mediaType: part.mediaType, attachmentId };
      }
    }
  }
  return undefined;
}

async function resolveImagePreview(
  filePart: { url: string; mediaType: string; attachmentId?: string } | undefined,
): Promise<string | undefined> {
  if (!filePart || typeof window === "undefined" || !window.alem) {
    return undefined;
  }

  if (filePart.url.startsWith("data:")) {
    return filePart.url;
  }

  if (filePart.attachmentId) {
    try {
      const data = await window.alem.readAttachment(filePart.attachmentId);
      return `data:${filePart.mediaType};base64,${data}`;
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function formatRelativeTime(isoDate: string): string {
  const updatedMs = new Date(isoDate).getTime();
  if (!Number.isFinite(updatedMs)) {
    return "Just now";
  }

  const seconds = Math.max(0, Math.floor((Date.now() - updatedMs) / 1000));
  if (seconds < 30) {
    return "Just now";
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function buildChatUrl(chatId: string, groupId?: string): string {
  if (!groupId) {
    return `/chat/${chatId}`;
  }

  return `/chat/${chatId}?list=${encodeURIComponent(groupId)}`;
}

export function buildChatTitle(prompt: string, maxLength = 52): string {
  const cleaned = prompt.trim().replace(/\s+/g, " ");
  if (!cleaned) {
    return DEFAULT_CHAT_TITLE;
  }

  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength).trim()}...` : cleaned;
}

export class ChatService {
  constructor(private readonly store: ChatStore = chatStore) {}

  async listChats(options: ListChatsOptions = {}): Promise<ChatHistoryListItem[]> {
    const selectedGroupId = options.groupId?.trim() || "";
    const sessions = await this.store.readSessions();
    const sortedSessions = [...sessions]
      .filter((session) => {
        if (!selectedGroupId) {
          return !session.isArchived;
        }

        if (selectedGroupId === ARCHIVED_CHAT_GROUP_ID) {
          return session.isArchived;
        }

        return !session.isArchived && session.chatGroupIds.includes(selectedGroupId);
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return Promise.all(
      sortedSessions.map(async (session) => ({
        id: session.id,
        title: session.title,
        content: previewFromMessages(session.messages),
        url: buildChatUrl(session.id, selectedGroupId || undefined),
        time: formatRelativeTime(session.updatedAt),
        users: [DEFAULT_USER_AVATAR],
        image: await resolveImagePreview(getLatestImageFilePart(session.messages)),
        isArchived: session.isArchived,
        terminalWorkspacePath: session.terminalWorkspacePath,
      })),
    );
  }

  async getLatestChatInGroup(groupId: string): Promise<ChatSession | null> {
    const trimmedGroupId = groupId.trim();
    if (!trimmedGroupId) {
      return null;
    }

    const sessions = await this.store.readSessions();
    const matchingSessions = sessions
      .filter((session) => {
        if (trimmedGroupId === ARCHIVED_CHAT_GROUP_ID) {
          return session.isArchived;
        }

        return !session.isArchived && session.chatGroupIds.includes(trimmedGroupId);
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return matchingSessions[0] ?? null;
  }

  async listChatCountsByGroup(): Promise<Record<string, number>> {
    const sessions = await this.store.readSessions();
    const counts: Record<string, number> = {};

    for (const session of sessions) {
      if (session.isArchived) {
        counts[ARCHIVED_CHAT_GROUP_ID] = (counts[ARCHIVED_CHAT_GROUP_ID] ?? 0) + 1;
        continue;
      }

      const groupIds = new Set(session.chatGroupIds.filter((id) => id !== ARCHIVED_CHAT_GROUP_ID));
      for (const groupId of groupIds) {
        counts[groupId] = (counts[groupId] ?? 0) + 1;
      }
    }

    return counts;
  }

  async getChat(chatId: string): Promise<ChatSession | null> {
    return this.store.getChat(chatId);
  }

  async createChat(
    title?: string,
    options?: {
      chatGroupId?: string;
      terminalWorkspacePath?: string;
    },
  ): Promise<ChatSession> {
    const groupId = options?.chatGroupId?.trim();
    return this.store.createChat(title?.trim() || DEFAULT_CHAT_TITLE, {
      chatGroupIds: groupId ? [groupId] : [],
      isArchived: groupId === ARCHIVED_CHAT_GROUP_ID,
      terminalWorkspacePath: options?.terminalWorkspacePath?.trim() || undefined,
    });
  }

  async duplicateChat(chatId: string): Promise<ChatSession | null> {
    const current = await this.store.getChat(chatId);
    if (!current) {
      return null;
    }

    const duplicatedChat = await this.store.createChat(`${current.title} (copy)`, {
      chatGroupIds: current.chatGroupIds,
      isArchived: current.isArchived,
      terminalWorkspacePath: current.terminalWorkspacePath,
    });
    if (current.messages.length === 0) {
      return duplicatedChat;
    }

    return (
      (await this.store.updateChat(duplicatedChat.id, {
        messages: current.messages,
      })) ?? duplicatedChat
    );
  }

  async addChatToGroup(chatId: string, groupId: string): Promise<ChatSession | null> {
    const trimmedGroupId = groupId.trim();
    if (!trimmedGroupId || trimmedGroupId === ARCHIVED_CHAT_GROUP_ID) {
      return null;
    }

    const current = await this.store.getChat(chatId);
    if (!current) {
      return null;
    }

    if (current.chatGroupIds.includes(trimmedGroupId)) {
      return current;
    }

    return this.store.updateChat(chatId, {
      chatGroupIds: [...current.chatGroupIds, trimmedGroupId],
    });
  }

  async updateChat(
    chatId: string,
    update: {
      title?: string;
      messages?: UIMessage[];
      chatGroupIds?: string[];
      isArchived?: boolean;
      terminalWorkspacePath?: string;
      toolApprovalRules?: import("@/types/tool-approval").ChatToolApprovalRule;
    },
  ): Promise<ChatSession | null> {
    return this.store.updateChat(chatId, update);
  }

  async saveMessages(chatId: string, messages: UIMessage[]): Promise<ChatSession | null> {
    const current = await this.store.getChat(chatId);
    if (!current) {
      return null;
    }

    const messagesToSave = filterMessagesByKnownTools(messages);

    const firstUserMessage = messagesToSave.find((m) => m.role === "user");
    const firstUserText = firstUserMessage
      ? getTextFromParts(firstUserMessage.parts)
      : "";
    const firstFilePart = firstUserMessage?.parts.find((p) => p.type === "file");
    const firstFileName =
      firstFilePart && "filename" in firstFilePart ? firstFilePart.filename : "";
    const titleSource =
      firstUserText || (firstFileName ? `Attachment: ${firstFileName}` : "");
    const nextTitle =
      current.title === DEFAULT_CHAT_TITLE && titleSource
        ? buildChatTitle(titleSource)
        : current.title;

    if (nextTitle === current.title && areMessagesEqual(current.messages, messagesToSave)) {
      return current;
    }

    return this.store.updateChat(chatId, {
      title: nextTitle,
      messages: messagesToSave,
    });
  }

  async clearChats(): Promise<void> {
    await this.store.clearChats();
  }

  async archiveChats(chatIds: string[]): Promise<void> {
    await this.store.archiveChats(chatIds);
  }

  async deleteChats(chatIds: string[]): Promise<void> {
    await this.store.deleteChats(chatIds);
  }
}

export const chatService = new ChatService();
