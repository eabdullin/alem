import { useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  getCheckpointIdsFromMessage,
  getRestoreContextForUserMessage,
} from "@/services/checkpoint-service";
import { restoreFromCheckpoint } from "@/stores/checkpoint-store";
import type { UIMessage } from "ai";
import type { ChatSession } from "@/services/chat-service";
import { showRestoreCheckpointToast } from "../components/RestoreCheckpointToast";

type UseCheckpointRestoreFlowOptions = {
  messages: UIMessage[];
  chatId: string;
  workspaceRoot?: string;
  setMessages: (messages: UIMessage[]) => void;
  setInputValue: (value: string) => void;
  setChat: (chat: ChatSession | null) => void;
};

export function useCheckpointRestoreFlow({
  messages,
  chatId,
  workspaceRoot,
  setMessages,
  setInputValue,
  setChat,
}: UseCheckpointRestoreFlowOptions) {
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
      const ctx = getRestoreContextForUserMessage(messages, userMessageIndex);
      if (!ctx || ctx.checkpointIds.length === 0) {
        toast.error("No checkpoint to restore.");
        return;
      }

      if (!workspaceRoot?.trim()) {
        toast.error("Workspace not set. Cannot restore checkpoint.");
        return;
      }

      const result = await restoreFromCheckpoint(ctx, {
        messages,
        chatId,
        workspaceRoot: workspaceRoot.trim(),
        setMessages,
        setInputValue,
        onChatUpdate: setChat,
      });

      if (!result.ok) {
        toast.error(result.error ?? "Failed to restore checkpoint.");
      }
    },
    [chatId, messages, workspaceRoot, setMessages, setInputValue, setChat],
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
