import type { AiChainStep, AiChatMessage } from "../services/ai-service";
import type { ChatAttachment } from "../types/chat-attachment";
import { ARCHIVED_CHAT_LIST_ID } from "./chat-list-store";

const STORAGE_KEY = "alem.chat-history.v1";
export const CHAT_HISTORY_UPDATED_EVENT = "alem:chat-history-updated";
export const DEFAULT_CHAT_TITLE = "New chat";

export interface ChatHistoryMessage extends AiChatMessage {
  id: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatHistoryMessage[];
  chatListIds: string[];
  isArchived: boolean;
  /** Optional workspace root for terminal tool; one per chat. */
  terminalWorkspacePath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatHistoryStorage {
  readSessions(): Promise<ChatSession[]>;
  writeSessions(sessions: ChatSession[]): Promise<void>;
}

export interface ChatStore {
  readSessions(): Promise<ChatSession[]>;
  getChat(chatId: string): Promise<ChatSession | null>;
  createChat(
    title: string,
    options?: {
      chatListIds?: string[];
      isArchived?: boolean;
      terminalWorkspacePath?: string;
    },
  ): Promise<ChatSession>;
  updateChat(
    chatId: string,
    update: {
      title?: string;
      messages?: ChatHistoryMessage[];
      chatListIds?: string[];
      isArchived?: boolean;
      terminalWorkspacePath?: string;
    },
  ): Promise<ChatSession | null>;
  archiveChats(chatIds: string[]): Promise<void>;
  deleteChats(chatIds: string[]): Promise<void>;
  clearChats(): Promise<void>;
}

class LocalStorageChatHistoryStorage implements ChatHistoryStorage {
  async readSessions(): Promise<ChatSession[]> {
    if (typeof window === "undefined") {
      return [];
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      return normalizeSessions(parsed);
    } catch {
      return [];
    }
  }

  async writeSessions(sessions: ChatSession[]): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }
}

function createChatId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeChatListIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const listIds = value
    .filter((listId): listId is string => typeof listId === "string")
    .map((listId) => listId.trim())
    .filter((listId) => listId.length > 0);

  return [...new Set(listIds)];
}

function syncArchiveList(
  chatListIds: string[],
  isArchived: boolean,
): string[] {
  const next = new Set(chatListIds);

  if (isArchived) {
    next.add(ARCHIVED_CHAT_LIST_ID);
    return [...next];
  }

  next.delete(ARCHIVED_CHAT_LIST_ID);

  return [...next];
}

function normalizeSessions(value: unknown): ChatSession[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item !== "object" || item === null) {
        return null;
      }

      const candidate = item as Partial<ChatSession>;
      if (
        typeof candidate.id !== "string" ||
        typeof candidate.title !== "string" ||
        typeof candidate.createdAt !== "string" ||
        typeof candidate.updatedAt !== "string" ||
        !Array.isArray(candidate.messages)
      ) {
        return null;
      }

      const messages: ChatHistoryMessage[] = [];
      for (const message of candidate.messages) {
        if (typeof message !== "object" || message === null) {
          continue;
        }

        const m = message as Partial<ChatHistoryMessage>;
        if (
          typeof m.id !== "string" ||
          (m.role !== "user" && m.role !== "assistant") ||
          typeof m.content !== "string"
        ) {
          continue;
        }

        const normalizedMessage: ChatHistoryMessage = {
          id: m.id,
          role: m.role,
          content: m.content,
        };

        if (typeof m.reasoning === "string" && m.reasoning.trim()) {
          normalizedMessage.reasoning = m.reasoning;
        }

        const chainSteps = normalizeChainSteps(m.chainSteps);
        if (chainSteps.length > 0) {
          normalizedMessage.chainSteps = chainSteps;
        }

        const attachments = normalizeAttachments(m.attachments);
        if (attachments) {
          normalizedMessage.attachments = attachments;
        }

        messages.push(normalizedMessage);
      }

      const normalizedChatListIds = normalizeChatListIds(candidate.chatListIds);
      const isArchived =
        candidate.isArchived === true ||
        normalizedChatListIds.includes(ARCHIVED_CHAT_LIST_ID);

      const terminalWorkspacePath =
        typeof candidate.terminalWorkspacePath === "string" &&
        candidate.terminalWorkspacePath.trim()
          ? candidate.terminalWorkspacePath.trim()
          : undefined;

      const session: ChatSession = {
        id: candidate.id,
        title: candidate.title || DEFAULT_CHAT_TITLE,
        messages,
        chatListIds: syncArchiveList(normalizedChatListIds, isArchived),
        isArchived,
        createdAt: candidate.createdAt,
        updatedAt: candidate.updatedAt,
      };
      if (terminalWorkspacePath !== undefined) {
        session.terminalWorkspacePath = terminalWorkspacePath;
      }
      return session;
    })
    .filter((session): session is ChatSession => session !== null);
}

function normalizeAttachments(value: unknown): ChatAttachment[] | undefined {
  if (!Array.isArray(value) || value.length === 0) {
    return undefined;
  }

  const attachments: ChatAttachment[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) {
      continue;
    }

    const attachment = item as Partial<ChatAttachment>;
    if (
      typeof attachment.id !== "string" ||
      typeof attachment.name !== "string" ||
      typeof attachment.mediaType !== "string" ||
      typeof attachment.size !== "number"
    ) {
      continue;
    }

    const normalizedAttachment: ChatAttachment = {
      id: attachment.id,
      name: attachment.name,
      mediaType: attachment.mediaType,
      size: attachment.size,
    };

    if (typeof attachment.createdAt === "string") {
      normalizedAttachment.createdAt = attachment.createdAt;
    }

    attachments.push(normalizedAttachment);
  }

  return attachments.length > 0 ? attachments : undefined;
}

function normalizeChainSteps(value: unknown): AiChainStep[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [];
  }

  const steps: AiChainStep[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) {
      continue;
    }
    const part = item as Record<string, unknown>;
    if (part.type === "reasoning" && typeof part.text === "string" && part.text.trim()) {
      steps.push({ type: "reasoning", text: part.text.trim() });
    } else if (
      part.type === "tool" &&
      typeof part.toolName === "string"
    ) {
      steps.push({
        type: "tool",
        toolName: part.toolName,
        input: part.input ?? {},
        output: part.output,
        errorText: typeof part.errorText === "string" ? part.errorText : undefined,
      });
    }
  }
  return steps;
}

function emitChatHistoryUpdated(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(CHAT_HISTORY_UPDATED_EVENT));
}

export class BrowserChatStore implements ChatStore {
  constructor(
    private readonly storage: ChatHistoryStorage = new LocalStorageChatHistoryStorage(),
  ) {}

  async readSessions(): Promise<ChatSession[]> {
    return this.storage.readSessions();
  }

  async getChat(chatId: string): Promise<ChatSession | null> {
    const sessions = await this.storage.readSessions();
    return sessions.find((session) => session.id === chatId) ?? null;
  }

  async createChat(
    title: string,
    options?: {
      chatListIds?: string[];
      isArchived?: boolean;
      terminalWorkspacePath?: string;
    },
  ): Promise<ChatSession> {
    const now = new Date().toISOString();
    const requestedListIds = normalizeChatListIds(options?.chatListIds);
    const isArchived = options?.isArchived ?? requestedListIds.includes(ARCHIVED_CHAT_LIST_ID);
    const terminalWorkspacePath =
      typeof options?.terminalWorkspacePath === "string" &&
      options.terminalWorkspacePath.trim()
        ? options.terminalWorkspacePath.trim()
        : undefined;
    const session: ChatSession = {
      id: createChatId(),
      title: title.trim() || DEFAULT_CHAT_TITLE,
      messages: [],
      chatListIds: syncArchiveList(requestedListIds, isArchived),
      isArchived,
      terminalWorkspacePath,
      createdAt: now,
      updatedAt: now,
    };

    const sessions = await this.storage.readSessions();
    await this.storage.writeSessions([session, ...sessions]);
    emitChatHistoryUpdated();
    return session;
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
    const sessions = await this.storage.readSessions();
    const index = sessions.findIndex((session) => session.id === chatId);

    if (index === -1) {
      return null;
    }

    const current = sessions[index];
    const nextIsArchived = update.isArchived ?? current.isArchived;
    const requestedListIds = normalizeChatListIds(update.chatListIds ?? current.chatListIds);
    const nextWorkspacePath =
      update.terminalWorkspacePath !== undefined
        ? (typeof update.terminalWorkspacePath === "string" &&
          update.terminalWorkspacePath.trim()
            ? update.terminalWorkspacePath.trim()
            : undefined)
        : current.terminalWorkspacePath;
    const updatedSession: ChatSession = {
      ...current,
      title: update.title ?? current.title,
      messages: update.messages ?? current.messages,
      chatListIds: syncArchiveList(requestedListIds, nextIsArchived),
      isArchived: nextIsArchived,
      terminalWorkspacePath: nextWorkspacePath,
      updatedAt: new Date().toISOString(),
    };

    const nextSessions = [...sessions];
    nextSessions[index] = updatedSession;
    await this.storage.writeSessions(nextSessions);
    emitChatHistoryUpdated();
    return updatedSession;
  }

  async archiveChats(chatIds: string[]): Promise<void> {
    if (chatIds.length === 0) {
      return;
    }

    const chatIdsSet = new Set(chatIds);
    const sessions = await this.storage.readSessions();
    let didChange = false;
    const now = new Date().toISOString();
    const nextSessions = sessions.map((session) => {
      if (!chatIdsSet.has(session.id) || session.isArchived) {
        return session;
      }

      didChange = true;
      return {
        ...session,
        chatListIds: syncArchiveList(
          normalizeChatListIds(session.chatListIds),
          true,
        ),
        isArchived: true,
        updatedAt: now,
      };
    });

    if (!didChange) {
      return;
    }

    await this.storage.writeSessions(nextSessions);
    emitChatHistoryUpdated();
  }

  async deleteChats(chatIds: string[]): Promise<void> {
    if (chatIds.length === 0) {
      return;
    }

    const chatIdsSet = new Set(chatIds);
    const sessions = await this.storage.readSessions();
    const nextSessions = sessions.filter((session) => !chatIdsSet.has(session.id));

    if (nextSessions.length === sessions.length) {
      return;
    }

    await this.storage.writeSessions(nextSessions);
    emitChatHistoryUpdated();
  }

  async clearChats(): Promise<void> {
    await this.storage.writeSessions([]);
    emitChatHistoryUpdated();
  }
}

export const chatStore = new BrowserChatStore();
