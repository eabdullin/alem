import { useCallback } from "react";
import { toast } from "react-hot-toast";
import { canRestoreAtIndex } from "@/services/checkpoint-service";
import { useCheckpointStore } from "@/stores/useCheckpointStore";
import type { QurtUIMessage } from "@/types/ui-message";
import { showRestoreCheckpointToast } from "../components/RestoreCheckpointToast";

type UseCheckpointRestoreFlowOptions = {
  messages: QurtUIMessage[];
};

export function useCheckpointRestoreFlow({ messages }: UseCheckpointRestoreFlowOptions) {
  const restoreToMessage = useCheckpointStore((s) => s.restoreToMessage);

  const handleRestore = useCallback(
    async (userMessageIndex: number) => {
      const result = await restoreToMessage(userMessageIndex, messages);
      if (!result.ok) {
        toast.error(result.error ?? "Failed to restore checkpoint.");
      } else {
        toast.success("Checkpoint restored.");
      }
    },
    [messages, restoreToMessage],
  );

  /**
   * Show a confirmation toast before restoring.
   */
  const showRestoreConfirmation = useCallback(
    (userMessageIndex: number) => {
      showRestoreCheckpointToast(userMessageIndex, handleRestore);
    },
    [handleRestore],
  );

  /**
   * Simple check used by the message list to show/hide the restore button.
   */
  const canRestore = useCallback(
    (index: number) => canRestoreAtIndex(messages, index),
    [messages],
  );

  return {
    showRestoreConfirmation,
    canRestore,
  };
}
