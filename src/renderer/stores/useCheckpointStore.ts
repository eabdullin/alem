import { create } from "zustand";
import {
  getTextFromParts,
  listCheckpoints,
  restoreCheckpoint,
} from "@/services/checkpoint-service";
import { useActiveChatStore } from "./useActiveChatStore";
import { useChatActionsStore } from "./useChatActionsStore";
import type { QurtUIMessage } from "@/types/ui-message";

interface CheckpointState {
  isRestoring: boolean;

  /**
   * Restore workspace + chat state to just before `userMessageIndex`.
   *
   * 1. Queries rdiff-backup for workspace checkpoints
   * 2. Restores files to the earliest checkpoint
   * 3. Trims messages to before the user message
   * 4. Sets the user's text back into the prompt input
   * 5. Persists the trimmed messages
   */
  restoreToMessage: (
    userMessageIndex: number,
    messages: QurtUIMessage[],
  ) => Promise<{ ok: boolean; error?: string }>;
}

export const useCheckpointStore = create<CheckpointState>()((set, get) => ({
  isRestoring: false,

  restoreToMessage: async (userMessageIndex, messages) => {
    if (get().isRestoring) {
      return { ok: false, error: "Restore already in progress." };
    }

    const userMsg = messages[userMessageIndex];
    if (!userMsg || userMsg.role !== "user") {
      return { ok: false, error: "Invalid message index." };
    }

    const { activeChat, setActiveChat } = useActiveChatStore.getState();
    const chatId = activeChat?.id;
    const workspaceRoot = activeChat?.terminalWorkspacePath?.trim();
    if (!chatId) return { ok: false, error: "No active chat." };

    const { setMessages, setInputValue } = useChatActionsStore.getState();
    if (!setMessages || !setInputValue) {
      return { ok: false, error: "Chat not ready." };
    }

    set({ isRestoring: true });
    try {
      // ── 1. Query rdiff-backup for workspace checkpoints ───────
      if (workspaceRoot) {
        const checkpoints = await listCheckpoints(workspaceRoot);
        const timestamp = userMsg.metadata?.createdAt;

        // ── 2. Restore files ────────────────────────────────────────────
        if (timestamp) {
          const result = await restoreCheckpoint(workspaceRoot, timestamp);
          if (!result.restored) {
            return {
              ok: false,
              error: result.error ?? "Failed to restore files.",
            };
          }
        }
      }

      // ── 3. Trim messages ──────────────────────────────────────
      const newMessages = messages.slice(0, userMessageIndex);
      setMessages(newMessages);

      // ── 4. Put user text back in input & flash it ─────────────
      const userText = getTextFromParts(userMsg.parts);
      setInputValue(userText);
      useChatActionsStore.getState().flashInput();

      // ── 5. Persist trimmed messages ───────────────────────────
      const { chatService } = await import("@/services/chat-service");
      const updated = await chatService.saveMessages(chatId, newMessages);
      if (updated && updated.id === chatId) {
        setActiveChat(updated);
      }

      return { ok: true };
    } finally {
      set({ isRestoring: false });
    }
  },
}));
