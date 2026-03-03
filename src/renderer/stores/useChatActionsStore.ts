import { create } from "zustand";
import type { UIMessage } from "ai";

interface ChatActionsState {
  setMessages: ((messages: UIMessage[]) => void) | null;
  setInputValue: ((value: string) => void) | null;
  register: (fns: {
    setMessages: (messages: UIMessage[]) => void;
    setInputValue: (value: string) => void;
  }) => void;
  unregister: () => void;
}

export const useChatActionsStore = create<ChatActionsState>()((set) => ({
  setMessages: null,
  setInputValue: null,
  register: ({ setMessages, setInputValue }) => set({ setMessages, setInputValue }),
  unregister: () => set({ setMessages: null, setInputValue: null }),
}));
