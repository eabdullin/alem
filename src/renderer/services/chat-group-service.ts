import {
  chatGroupStore,
  type ChatGroup,
  type ChatGroupStore,
} from "../stores/chat-group-store";

export {
  CHAT_GROUPS_UPDATED_EVENT,
  ARCHIVED_CHAT_GROUP_ID,
  FAVORITES_CHAT_GROUP_ID,
  type ChatGroup,
} from "../stores/chat-group-store";

export class ChatGroupService {
  constructor(private readonly store: ChatGroupStore = chatGroupStore) {}

  async listChatGroups(): Promise<ChatGroup[]> {
    return this.store.readGroups();
  }

  async createChatGroup(input: {
    title: string;
    description?: string;
    color?: string;
  }): Promise<ChatGroup> {
    return this.store.createGroup(input);
  }
}

export const chatGroupService = new ChatGroupService();
