/**
 * Bootstrap Dexie DB: ensure persistence and run migrations.
 * In Electron, IndexedDB is stored in userData by default.
 */

import { appDb } from "./appDb";
import * as chatsRepo from "./repos/chats.repo";
import * as chatGroupsRepo from "./repos/chat-groups.repo";

const MIGRATION_KEY = "qurt:dexie-migrated-v1";

async function migrateFromLocalStorage(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(MIGRATION_KEY)) return;

  const chatHistoryRaw = window.localStorage.getItem("qurt.chat-history.v2");
  if (chatHistoryRaw) {
    try {
      const parsed = JSON.parse(chatHistoryRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const normalized = parsed.filter(
          (item: unknown) =>
            item &&
            typeof item === "object" &&
            typeof (item as { id?: unknown }).id === "string" &&
            Array.isArray((item as { messages?: unknown }).messages)
        );
        if (normalized.length > 0) {
          await appDb.chats.bulkPut(normalized);
        }
      }
    } catch {
      // Ignore migration errors
    }
  }

  const chatListsRaw = window.localStorage.getItem("qurt.chat-lists.v1");
  if (chatListsRaw) {
    try {
      const parsed = JSON.parse(chatListsRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const normalized = parsed.filter(
          (item: unknown) =>
            item &&
            typeof item === "object" &&
            typeof (item as { id?: unknown }).id === "string"
        );
        if (normalized.length > 0) {
          await appDb.chatGroups.bulkPut(normalized);
        }
      }
    } catch {
      // Ignore migration errors
    }
  }

  window.localStorage.setItem(MIGRATION_KEY, "1");
}

export async function bootstrapDb(): Promise<void> {
  await migrateFromLocalStorage();
}
