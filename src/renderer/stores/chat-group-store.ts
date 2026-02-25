import {
  CHAT_GROUPS_UPDATED_EVENT,
  FAVORITES_CHAT_GROUP_ID,
  ARCHIVED_CHAT_GROUP_ID,
  readGroups,
  createGroup,
} from "../db/repos/chat-groups.repo";
import type { ChatGroupRecord } from "../db/appDb";

export { CHAT_GROUPS_UPDATED_EVENT, FAVORITES_CHAT_GROUP_ID, ARCHIVED_CHAT_GROUP_ID };
export type ChatGroup = ChatGroupRecord;

export interface ChatGroupStore {
  readGroups(): Promise<ChatGroup[]>;
  createGroup(input: {
    title: string;
    description?: string;
    color?: string;
  }): Promise<ChatGroup>;
}

class DexieChatGroupStore implements ChatGroupStore {
  readGroups = readGroups;
  createGroup = createGroup;
}

export const chatGroupStore = new DexieChatGroupStore();
