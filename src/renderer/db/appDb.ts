/**
 * Dexie schema for Alem.
 * IndexedDB is stored in Electron's userData by default.
 */

import Dexie, { type EntityTable } from "dexie";
import type { UIMessage } from "ai";
import type { ChatToolApprovalRule } from "@/types/tool-approval";

export interface ChatSessionRecord {
  id: string;
  title: string;
  messages: UIMessage[];
  chatGroupIds: string[];
  isArchived: boolean;
  terminalWorkspacePath?: string;
  toolApprovalRules?: ChatToolApprovalRule;
  createdAt: string;
  updatedAt: string;
}

export interface ChatGroupRecord {
  id: string;
  title: string;
  description: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export class AppDb extends Dexie {
  chats!: EntityTable<ChatSessionRecord, "id">;
  chatGroups!: EntityTable<ChatGroupRecord, "id">;

  constructor() {
    super("alem-db");
    this.version(1).stores({
      chats: "id, updatedAt, createdAt",
      chatGroups: "id, createdAt",
    });
  }
}

export const appDb = new AppDb();
