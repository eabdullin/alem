import { create } from "zustand";
import type { UIMessage } from "ai";

interface ChatActionsState {
  setMessages: ((messages: UIMessage[]) => void) | null;
  setInputValue: ((value: string) => void) | null;
  /** When true the prompt input should play a highlight animation. */
  inputHighlighted: boolean;
  register: (fns: {
    setMessages: (messages: UIMessage[]) => void;
    setInputValue: (value: string) => void;
  }) => void;
  unregister: () => void;
  /** Flash the prompt border to draw attention to restored text. */
  flashInput: () => void;
  clearInputHighlight: () => void;
}

export const useChatActionsStore = create<ChatActionsState>()((set) => ({
  setMessages: null,
  setInputValue: null,
  inputHighlighted: false,
  register: ({ setMessages, setInputValue }) => set({ setMessages, setInputValue }),
  unregister: () => set({ setMessages: null, setInputValue: null }),
  flashInput: () => {
    set({ inputHighlighted: true });
  },
  clearInputHighlight: () => set({ inputHighlighted: false }),
}));
