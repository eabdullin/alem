import { create } from "zustand";
import { chatService, type ChatSession } from "@/services/chat-service";
import type { UIMessage } from "ai";

interface ActiveChatState {
  activeChat: ChatSession | null;
  isLoadingChat: boolean;
  setActiveChat: (chat: ChatSession | null) => void;
  setLoadingChat: (loading: boolean) => void;
  saveMessages: (messages: UIMessage[], sourceChatId?: string) => Promise<void>;
  selectWorkspaceFolder: () => Promise<void>;
}

export const useActiveChatStore = create<ActiveChatState>()((set, get) => ({
  activeChat: null,
  isLoadingChat: true,

  setActiveChat: (chat) => set({ activeChat: chat }),
  setLoadingChat: (loading) => set({ isLoadingChat: loading }),

  saveMessages: async (messages, sourceChatId) => {
    const { activeChat, isLoadingChat } = get();
    const targetId = sourceChatId?.trim() || activeChat?.id;
    if (!targetId || targetId !== activeChat?.id || isLoadingChat) return;
    const updated = await chatService.saveMessages(targetId, messages);
    if (updated?.id === targetId) set({ activeChat: updated });
  },

  selectWorkspaceFolder: async () => {
    if (typeof window === "undefined" || !window.qurt?.openFolderDialog) return;
    const chatId = get().activeChat?.id;
    if (!chatId) return;
    const path = await window.qurt.openFolderDialog();
    if (!path) return;
    const updated = await chatService.updateChat(chatId, { terminalWorkspacePath: path });
    if (updated) set({ activeChat: updated });
  },
}));
