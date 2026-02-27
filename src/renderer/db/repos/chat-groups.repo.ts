import { appDb, type ChatGroupRecord } from "../appDb";

export const CHAT_GROUPS_UPDATED_EVENT = "qurt:chat-groups-updated";
export const FAVORITES_CHAT_GROUP_ID = "favorites";
export const ARCHIVED_CHAT_GROUP_ID = "archived";

const DEFAULT_CHAT_GROUPS: ChatGroupRecord[] = [
  {
    id: FAVORITES_CHAT_GROUP_ID,
    title: "Favorites",
    description: "Your important chats in one place.",
    color: "#3E90F0",
    isDefault: true,
    createdAt: "1970-01-01T00:00:00.000Z",
    updatedAt: "1970-01-01T00:00:00.000Z",
  },
  {
    id: ARCHIVED_CHAT_GROUP_ID,
    title: "Archived",
    description: "Chats you moved out of the main view.",
    color: "#D84C10",
    isDefault: true,
    createdAt: "1970-01-01T00:00:00.000Z",
    updatedAt: "1970-01-01T00:00:00.000Z",
  },
];

function createChatGroupId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emitChatGroupsUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CHAT_GROUPS_UPDATED_EVENT));
}

export async function readGroups(): Promise<ChatGroupRecord[]> {
  const stored = await appDb.chatGroups.toArray();
  const byId = new Map(stored.map((g) => [g.id, g]));
  for (const d of DEFAULT_CHAT_GROUPS) {
    if (!byId.has(d.id)) {
      byId.set(d.id, d);
    }
  }
  const result = [...byId.values()].sort((a, b) => {
    if (a.id === FAVORITES_CHAT_GROUP_ID || b.id === FAVORITES_CHAT_GROUP_ID) {
      return a.id === FAVORITES_CHAT_GROUP_ID ? -1 : 1;
    }
    if (a.id === ARCHIVED_CHAT_GROUP_ID || b.id === ARCHIVED_CHAT_GROUP_ID) {
      return a.id === ARCHIVED_CHAT_GROUP_ID ? 1 : -1;
    }
    return a.title.localeCompare(b.title);
  });
  return result;
}

export async function createGroup(input: {
  title: string;
  description?: string;
  color?: string;
}): Promise<ChatGroupRecord> {
  const title = input.title.trim();
  if (!title) throw new Error("Group name is required.");

  const now = new Date().toISOString();
  const group: ChatGroupRecord = {
    id: createChatGroupId(),
    title,
    description: input.description?.trim() || "",
    color: input.color || "#8E55EA",
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };

  await appDb.chatGroups.add(group);
  emitChatGroupsUpdated();
  return group;
}
