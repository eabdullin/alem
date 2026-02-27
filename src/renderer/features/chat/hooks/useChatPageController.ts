import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToolApproval } from "@/hooks/useToolApproval";
import { chatService } from "@/services/chat-service";
import type { UIMessage } from "ai";
import { toDownloadableMessages } from "../utils/downloadableMessages";
import { useChatRouteState } from "./useChatRouteState";
import { useChatSession } from "./useChatSession";
import { useChatRuntime } from "./useChatRuntime";
import { useChatMetrics } from "./useChatMetrics";
import { useCheckpointRestoreFlow } from "./useCheckpointRestoreFlow";
import { useBrowserChatBinding } from "./useBrowserChatBinding";

export type { ToolApprovalScope, ToolApprovalResponseParams } from "@/hooks/useToolApproval";
export type { ChatPageLocationState } from "./useChatRouteState";

export function useChatPageController() {
  const [hideRightSidebar, setHideRightSidebar] = useState(false);
  const sentInitialPromptRef = useRef(false);

  const { chatId, activeListId, initialPrompt, initialAttachments } =
    useChatRouteState();

  const {
    setChat,
    activeChat,
    isLoadingChat,
    handleSelectWorkspaceFolder,
  } = useChatSession({ chatId, activeListId });

  useEffect(() => {
    sentInitialPromptRef.current = false;
  }, [chatId]);

  const initialMessages = useMemo(
    () => activeChat?.messages ?? [],
    [activeChat?.messages],
  );

  const handleMessagesChange = useCallback(
    async (messages: UIMessage[], sourceChatId?: string) => {
      const targetChatId = sourceChatId?.trim() || chatId;
      if (!targetChatId || targetChatId !== chatId || isLoadingChat) {
        return;
      }

      const updated = await chatService.saveMessages(targetChatId, messages);
      if (updated && updated.id === targetChatId) {
        setChat(updated);
      }
    },
    [chatId, isLoadingChat],
  );

  const {
    messages,
    input,
    pendingAttachments,
    handleInputChange,
    handleSubmit,
    submitPrompt,
    addAttachments,
    removePendingAttachment,
    isLoading,
    error,
    provider,
    model,
    addToolApprovalResponse,
    setMessages,
    setInputValue,
    stop,
    wasStoppedByUser,
  } = useChatRuntime({
    chatId,
    initialMessages,
    onMessagesChange: handleMessagesChange,
    workspaceRoot: activeChat?.terminalWorkspacePath,
  });

  const handleToolApprovalResponse = useToolApproval({
    chatId,
    messages,
    activeChat,
    isLoadingChat,
    addToolApprovalResponse,
    setChat,
  });

  const { isReasoningModel, tokenUsage, maxTokens, resolvedModelId } =
    useChatMetrics({ provider, model, messages });

  const {
    filePatchCheckpointIds,
    showRestoreConfirmation,
    handleRestoreFilePatch,
  } = useCheckpointRestoreFlow({
    messages,
    chatId,
    setMessages,
    setInputValue,
    setChat,
  });

  const downloadableMessages = useMemo(
    () => toDownloadableMessages(messages),
    [messages],
  );

  const openAttachment = useCallback((attachmentId: string) => {
    if (!window.qurt) {
      return;
    }
    void window.qurt.openAttachment(attachmentId);
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [chatId, stop]);

  useBrowserChatBinding(chatId);

  useEffect(() => {
    if (isLoadingChat || !activeChat) {
      return;
    }
    setMessages(initialMessages);
  }, [activeChat, initialMessages, isLoadingChat, setMessages]);

  useEffect(() => {
    if (
      !activeChat ||
      sentInitialPromptRef.current ||
      (!initialPrompt && initialAttachments.length === 0)
    ) {
      return;
    }

    if (activeChat.messages.length > 0) {
      sentInitialPromptRef.current = true;
      return;
    }

    sentInitialPromptRef.current = true;
    void submitPrompt(initialPrompt, initialAttachments);
  }, [activeChat, initialAttachments, initialPrompt, submitPrompt]);

  return {
    chatId,
    activeChat,
    isLoadingChat,
    hideRightSidebar,
    setHideRightSidebar,
    messages,
    input,
    pendingAttachments,
    handleInputChange,
    handleSubmit,
    addAttachments,
    removePendingAttachment,
    isLoading,
    error,
    isReasoningModel,
    filePatchCheckpointIds,
    downloadableMessages,
    addToolApprovalResponse: handleToolApprovalResponse,
    openAttachment,
    showRestoreConfirmation,
    handleRestoreFilePatch,
    handleSelectWorkspaceFolder,
    stop,
    wasStoppedByUser,
    tokenUsage,
    maxTokens,
    model,
    resolvedModelId,
  };
}
