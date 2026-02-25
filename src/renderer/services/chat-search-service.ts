import { chatStore, type ChatSession, type ChatStore } from "../stores/chat-store";
import type { UIMessage } from "ai";

export type SearchDateFilter = "all" | "today" | "lastWeek" | "last30Days";

export interface SearchMessagesParams {
  query: string;
  dateFilter?: SearchDateFilter;
  limit?: number;
}

export interface ChatMessageSearchResult {
  id: string;
  title: string;
  content: string;
  time: string;
  url: string;
}

export interface ChatSearchService {
  searchMessages(params: SearchMessagesParams): Promise<ChatMessageSearchResult[]>;
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

function getStartOfToday(now: Date): number {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}

function getDateThresholdMs(dateFilter: SearchDateFilter, now = new Date()): number | null {
  if (dateFilter === "all") {
    return null;
  }

  if (dateFilter === "today") {
    return getStartOfToday(now);
  }

  const days = dateFilter === "lastWeek" ? 7 : 30;
  return now.getTime() - days * 24 * 60 * 60 * 1000;
}

function isInDateRange(session: ChatSession, dateFilter: SearchDateFilter): boolean {
  const thresholdMs = getDateThresholdMs(dateFilter);
  if (thresholdMs === null) {
    return true;
  }

  const updatedMs = new Date(session.updatedAt).getTime();
  if (!Number.isFinite(updatedMs)) {
    return false;
  }

  return updatedMs >= thresholdMs;
}

function getTextFromParts(parts: UIMessage["parts"]): string {
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
    .trim();
}

function getMatchingMessages(messages: UIMessage[], query: string): UIMessage[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  return messages.filter((message) =>
    getTextFromParts(message.parts).toLowerCase().includes(normalizedQuery),
  );
}

export class LocalChatSearchService implements ChatSearchService {
  constructor(private readonly store: ChatStore = chatStore) {}

  async searchMessages({
    query,
    dateFilter = "all",
    limit = 100,
  }: SearchMessagesParams): Promise<ChatMessageSearchResult[]> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return [];
    }

    const sessions = await this.store.readSessions();
    const results: ChatMessageSearchResult[] = [];

    const sortedSessions = [...sessions].sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    );

    for (const session of sortedSessions) {
      if (!isInDateRange(session, dateFilter)) {
        continue;
      }

      const matchingMessages = getMatchingMessages(session.messages, normalizedQuery);
      for (const message of matchingMessages.reverse()) {
        results.push({
          id: `${session.id}:${message.id}`,
          title: session.title,
          content: getTextFromParts(message.parts),
          time: formatRelativeTime(session.updatedAt),
          url: `/chat/${session.id}`,
        });

        if (results.length >= limit) {
          return results;
        }
      }
    }

    return results;
  }
}

export const chatSearchService: ChatSearchService = new LocalChatSearchService();
