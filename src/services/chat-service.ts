import {
  CHAT_HISTORY_UPDATED_EVENT,
  DEFAULT_CHAT_TITLE,
  chatStore,
  type ChatHistoryMessage,
  type ChatSession,
  type ChatStore,
} from "../stores/chat-store";
import type { AiChainStep } from "./ai-service";
import type { ChatAttachment } from "../types/chat-attachment";
import { ARCHIVED_CHAT_LIST_ID } from "./chat-list-service";

const DEFAULT_USER_AVATAR = "/images/avatar.jpg";

export { CHAT_HISTORY_UPDATED_EVENT };
export type { ChatHistoryMessage, ChatSession };

export interface ChatHistoryListItem {
  id: string;
  title: string;
  content: string;
  url: string;
  time: string;
  users: string[];
  image?: string;
  isArchived: boolean;
}

interface ListChatsOptions {
  listId?: string;
}

function areMessagesEqual(
  left: ChatHistoryMessage[],
  right: ChatHistoryMessage[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((message, index) => {
    const other = right[index];
    return (
      message.id === other?.id &&
      message.role === other?.role &&
      message.content === other?.content &&
      message.reasoning === other?.reasoning &&
      areChainStepsEqual(message.chainSteps, other?.chainSteps) &&
      areAttachmentsEqual(message.attachments, other?.attachments)
    );
  });
}

function areAttachmentsEqual(
  left: ChatAttachment[] | undefined,
  right: ChatAttachment[] | undefined,
): boolean {
  const leftAttachments = left ?? [];
  const rightAttachments = right ?? [];

  if (leftAttachments.length !== rightAttachments.length) {
    return false;
  }

  return leftAttachments.every((attachment, index) => {
    const other = rightAttachments[index];
    return (
      attachment.id === other?.id &&
      attachment.name === other?.name &&
      attachment.mediaType === other?.mediaType &&
      attachment.size === other?.size
    );
  });
}

function areChainStepsEqual(
  left: AiChainStep[] | undefined,
  right: AiChainStep[] | undefined,
): boolean {
  const a = left ?? [];
  const b = right ?? [];
  if (a.length !== b.length) return false;
  return a.every((step, i) => {
    const other = b[i];
    if (!other || step.type !== other.type) return false;
    if (step.type === "reasoning" && other.type === "reasoning") {
      return step.text === other.text;
    }
    if (step.type === "tool" && other.type === "tool") {
      return (
        step.toolName === other.toolName &&
        JSON.stringify(step.input) === JSON.stringify(other.input) &&
        JSON.stringify(step.output) === JSON.stringify(other.output) &&
        step.errorText === other.errorText
      );
    }
    return false;
  });
}

function previewFromMessage(message: ChatHistoryMessage | undefined): string {
  if (!message) {
    return "No messages yet";
  }

  const text = message.content.trim();
  if (text) {
    return text;
  }

  const attachments = message.attachments ?? [];
  if (attachments.length === 0) {
    return "No messages yet";
  }

  if (attachments.length === 1) {
    return `Attachment: ${attachments[0].name}`;
  }

  return `${attachments.length} attachments`;
}

function previewFromMessages(messages: ChatHistoryMessage[]): string {
  const message =
    [...messages].reverse().find((item) => item.role === "user") ?? messages.at(-1);
  return previewFromMessage(message);
}

function getLatestImageAttachment(messages: ChatHistoryMessage[]): ChatAttachment | undefined {
  for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex -= 1) {
    const attachments = messages[messageIndex].attachments ?? [];
    for (
      let attachmentIndex = attachments.length - 1;
      attachmentIndex >= 0;
      attachmentIndex -= 1
    ) {
      const attachment = attachments[attachmentIndex];
      if (attachment.mediaType.startsWith("image/")) {
        return attachment;
      }
    }
  }

  return undefined;
}

async function resolveImagePreview(attachment: ChatAttachment | undefined): Promise<string | undefined> {
  if (!attachment || typeof window === "undefined" || !window.alem) {
    return undefined;
  }

  try {
    const data = await window.alem.readAttachment(attachment.id);
    return `data:${attachment.mediaType};base64,${data}`;
  } catch {
    return undefined;
  }
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

function buildChatUrl(chatId: string, listId?: string): string {
  if (!listId) {
    return `/chat/${chatId}`;
  }

  return `/chat/${chatId}?list=${encodeURIComponent(listId)}`;
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
    const selectedListId = options.listId?.trim() || "";
    const sessions = await this.store.readSessions();
    const sortedSessions = [...sessions]
      .filter((session) => {
        if (!selectedListId) {
          return !session.isArchived;
        }

        if (selectedListId === ARCHIVED_CHAT_LIST_ID) {
          return session.isArchived;
        }

        return !session.isArchived && session.chatListIds.includes(selectedListId);
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return Promise.all(
      sortedSessions.map(async (session) => ({
        id: session.id,
        title: session.title,
        content: previewFromMessages(session.messages),
        url: buildChatUrl(session.id, selectedListId || undefined),
        time: formatRelativeTime(session.updatedAt),
        users: [DEFAULT_USER_AVATAR],
        image: await resolveImagePreview(getLatestImageAttachment(session.messages)),
        isArchived: session.isArchived,
      })),
    );
  }

  async getLatestChatInList(listId: string): Promise<ChatSession | null> {
    const trimmedListId = listId.trim();
    if (!trimmedListId) {
      return null;
    }

    const sessions = await this.store.readSessions();
    const matchingSessions = sessions
      .filter((session) => {
        if (trimmedListId === ARCHIVED_CHAT_LIST_ID) {
          return session.isArchived;
        }

        return !session.isArchived && session.chatListIds.includes(trimmedListId);
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return matchingSessions[0] ?? null;
  }

  async listChatCountsByList(): Promise<Record<string, number>> {
    const sessions = await this.store.readSessions();
    const counts: Record<string, number> = {};

    for (const session of sessions) {
      if (session.isArchived) {
        counts[ARCHIVED_CHAT_LIST_ID] = (counts[ARCHIVED_CHAT_LIST_ID] ?? 0) + 1;
        continue;
      }

      const listIds = new Set(session.chatListIds.filter((listId) => listId !== ARCHIVED_CHAT_LIST_ID));
      for (const listId of listIds) {
        counts[listId] = (counts[listId] ?? 0) + 1;
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
      chatListId?: string;
      terminalWorkspacePath?: string;
    },
  ): Promise<ChatSession> {
    const listId = options?.chatListId?.trim();
    return this.store.createChat(title?.trim() || DEFAULT_CHAT_TITLE, {
      chatListIds: listId ? [listId] : [],
      isArchived: listId === ARCHIVED_CHAT_LIST_ID,
      terminalWorkspacePath: options?.terminalWorkspacePath?.trim() || undefined,
    });
  }

  async duplicateChat(chatId: string): Promise<ChatSession | null> {
    const current = await this.store.getChat(chatId);
    if (!current) {
      return null;
    }

    const duplicatedChat = await this.store.createChat(`${current.title} (copy)`, {
      chatListIds: current.chatListIds,
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

  async addChatToList(chatId: string, listId: string): Promise<ChatSession | null> {
    const trimmedListId = listId.trim();
    if (!trimmedListId || trimmedListId === ARCHIVED_CHAT_LIST_ID) {
      return null;
    }

    const current = await this.store.getChat(chatId);
    if (!current) {
      return null;
    }

    if (current.chatListIds.includes(trimmedListId)) {
      return current;
    }

    return this.store.updateChat(chatId, {
      chatListIds: [...current.chatListIds, trimmedListId],
    });
  }

  async updateChat(
    chatId: string,
    update: {
      title?: string;
      messages?: ChatHistoryMessage[];
      chatListIds?: string[];
      isArchived?: boolean;
      terminalWorkspacePath?: string;
    },
  ): Promise<ChatSession | null> {
    return this.store.updateChat(chatId, update);
  }

  async saveMessages(chatId: string, messages: ChatHistoryMessage[]): Promise<ChatSession | null> {
    const current = await this.store.getChat(chatId);
    if (!current) {
      return null;
    }

    const firstUserMessage = messages.find((message) => message.role === "user");
    const firstUserText = firstUserMessage?.content.trim() || "";
    const firstAttachmentName = firstUserMessage?.attachments?.[0]?.name || "";
    const titleSource = firstUserText || (firstAttachmentName ? `Attachment: ${firstAttachmentName}` : "");
    const nextTitle =
      current.title === DEFAULT_CHAT_TITLE && titleSource
        ? buildChatTitle(titleSource)
        : current.title;

    // Opening an existing chat rehydrates the same messages through the hook.
    // Skip writes so "updatedAt" only changes when there is real new content.
    if (nextTitle === current.title && areMessagesEqual(current.messages, messages)) {
      return current;
    }

    return this.store.updateChat(chatId, {
      title: nextTitle,
      messages,
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
