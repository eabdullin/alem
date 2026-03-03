import { useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  getCheckpointIdsFromMessage,
  getRestoreContextForUserMessage,
} from "@/services/checkpoint-service";
import { useCheckpointStore } from "@/stores/useCheckpointStore";
import { useActiveChatStore } from "@/stores/useActiveChatStore";
import { useChatActionsStore } from "@/stores/useChatActionsStore";
import type { UIMessage } from "ai";
import { showRestoreCheckpointToast } from "../components/RestoreCheckpointToast";

type UseCheckpointRestoreFlowOptions = {
  messages: UIMessage[];
};

export function useCheckpointRestoreFlow({ messages }: UseCheckpointRestoreFlowOptions) {
  const restoreFromCheckpoint = useCheckpointStore((s) => s.restoreFromCheckpoint);
  const { activeChat, setActiveChat } = useActiveChatStore();
  const setMessages = useChatActionsStore((s) => s.setMessages);
  const setInputValue = useChatActionsStore((s) => s.setInputValue);

  const filePatchCheckpointIds = useMemo(() => {
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    if (!lastAssistant) return [];
    return getCheckpointIdsFromMessage(lastAssistant);
  }, [messages]);

  const lastUserMessageRestoreContext = useMemo(() => {
    const revIdx = [...messages]
      .reverse()
      .findIndex((m) => m.role === "user");
    const lastUserIndex =
      revIdx >= 0 ? messages.length - 1 - revIdx : -1;
    if (lastUserIndex < 0) return null;
    return getRestoreContextForUserMessage(messages, lastUserIndex);
  }, [messages]);

  const handleRestoreFromUserMessage = useCallback(
    async (userMessageIndex: number) => {
      const chatId = activeChat?.id;
      if (!chatId || !setMessages || !setInputValue) return;

      const ctx = getRestoreContextForUserMessage(messages, userMessageIndex);
      if (!ctx || ctx.checkpointIds.length === 0) {
        toast.error("No checkpoint to restore.");
        return;
      }

      const result = await restoreFromCheckpoint(ctx, {
        messages,
        chatId,
        setMessages,
        setInputValue,
        onChatUpdate: (chat) => setActiveChat(chat),
      });

      if (!result.ok) {
        toast.error(result.error ?? "Failed to restore checkpoint.");
      }
    },
    [activeChat?.id, messages, restoreFromCheckpoint, setActiveChat, setInputValue, setMessages],
  );

  const showRestoreConfirmation = useCallback(
    (userMessageIndex: number) => {
      showRestoreCheckpointToast(userMessageIndex, handleRestoreFromUserMessage);
    },
    [handleRestoreFromUserMessage],
  );

  const handleRestoreFilePatch = useCallback(() => {
    const ctx = lastUserMessageRestoreContext;
    if (!ctx) return;
    showRestoreConfirmation(ctx.userMessageIndex);
  }, [showRestoreConfirmation, lastUserMessageRestoreContext]);

  return {
    filePatchCheckpointIds,
    showRestoreConfirmation,
    handleRestoreFilePatch,
  };
}
