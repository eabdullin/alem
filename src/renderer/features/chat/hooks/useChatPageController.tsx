import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAlemChat } from "@/hooks/useAlemChat";
import { useToolApproval } from "@/hooks/useToolApproval";
import type { ChatAttachment } from "@/types/chat-attachment";
import type { PromptMode } from "@/types/prompt-mode";
import {
  chatService,
  type ChatSession,
} from "@/services/chat-service";
import {
  getCheckpointIdsFromMessage,
  getRestoreContextForUserMessage,
} from "@/services/checkpoint-service";
import { restoreFromCheckpoint } from "@/stores/checkpoint-store";
import { providerService } from "@/services/provider-service";
import Notify from "@/components/Notify";
import type { UIMessage } from "ai";
import { toDownloadableMessages } from "../utils/downloadableMessages";

export type { ToolApprovalScope, ToolApprovalResponseParams } from "@/hooks/useToolApproval";

export type ChatPageLocationState = {
  initialPrompt?: string;
  initialAttachments?: ChatAttachment[];
  initialMode?: PromptMode;
};

export function useChatPageController() {
  const { chatId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [chat, setChat] = useState<ChatSession | null>(null);
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const [hideRightSidebar, setHideRightSidebar] = useState(false);
  const sentInitialPromptRef = useRef(false);

  const initialPrompt = useMemo(() => {
    const state = location.state as ChatPageLocationState | null;
    return state?.initialPrompt?.trim() || "";
  }, [location.state]);
  const initialAttachments = useMemo(() => {
    const state = location.state as ChatPageLocationState | null;
    return state?.initialAttachments ?? [];
  }, [location.state]);
  const initialMode = useMemo<PromptMode>(() => {
    const state = location.state as ChatPageLocationState | null;
    return state?.initialMode === "agent" ? "agent" : "ask";
  }, [location.state]);
  const activeListId = useMemo(
    () => new URLSearchParams(location.search).get("list")?.trim() || "",
    [location.search],
  );

  const activeChat = chat?.id === chatId ? chat : null;
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
    promptMode,
    setPromptMode,
    isLoading,
    error,
    provider,
    model,
    addToolApprovalResponse,
    setMessages,
    setInputValue,
    stop,
    wasStoppedByUser,
  } = useAlemChat({
    chatId,
    initialMessages,
    onMessagesChange: handleMessagesChange,
    terminalWorkspaceOverride: activeChat?.terminalWorkspacePath,
  });

  const handleToolApprovalResponse = useToolApproval({
    chatId,
    messages,
    activeChat,
    isLoadingChat,
    addToolApprovalResponse,
    setChat,
  });

  const isReasoningModel = useMemo(() => {
    return providerService.isReasoningModel(provider, model);
  }, [model, provider]);

  const tokenUsage = useMemo(() => {
    return providerService.calculateTokenUsage(messages);
  }, [messages]);

  const maxTokens = useMemo(() => {
    return providerService.getMaxTokens(provider, model);
  }, [provider, model]);

  const resolvedModelId = useMemo(() => {
    const resolved = providerService.resolveModel(provider, model);
    return resolved.modelId;
  }, [provider, model]);

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

      const result = await restoreFromCheckpoint(ctx, {
        messages,
        chatId,
        setMessages,
        setInputValue,
        onChatUpdate: setChat,
      });

      if (!result.ok) {
        toast.error(result.error ?? "Failed to restore checkpoint.");
      }
    },
    [chatId, messages, setMessages, setInputValue],
  );

  const showRestoreConfirmation = useCallback(
    (userMessageIndex: number) => {
      toast((t) => (
        <Notify
          className="md:flex-col md:items-center md:px-10"
          iconDelete
        >
          <div className="ml-3 mr-6 h6 md:mx-0 md:my-2">
            Restore checkpoint?
          </div>
          <div className="flex justify-center">
            <button
              className="btn-stroke-light btn-medium md:min-w-[6rem]"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
            <button
              className="btn-blue btn-medium ml-3 md:min-w-[6rem]"
              onClick={() => {
                void handleRestoreFromUserMessage(userMessageIndex);
                toast.dismiss(t.id);
              }}
            >
              Restore
            </button>
          </div>
        </Notify>
      ));
    },
    [handleRestoreFromUserMessage],
  );

  const handleRestoreFilePatch = useCallback(() => {
    const ctx = lastUserMessageRestoreContext;
    if (!ctx) return;
    showRestoreConfirmation(ctx.userMessageIndex);
  }, [showRestoreConfirmation, lastUserMessageRestoreContext]);

  const downloadableMessages = useMemo(
    () => toDownloadableMessages(messages),
    [messages],
  );

  const openAttachment = useCallback((attachmentId: string) => {
    if (!window.alem) {
      return;
    }
    void window.alem.openAttachment(attachmentId);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadChat = async () => {
      if (!chatId) {
        navigate(
          activeListId ? `/?list=${encodeURIComponent(activeListId)}` : "/",
          { replace: true },
        );
        return;
      }

      setChat(null);
      sentInitialPromptRef.current = false;
      setIsLoadingChat(true);
      const existingChat = await chatService.getChat(chatId);

      if (!isMounted) {
        return;
      }

      if (!existingChat) {
        navigate(
          activeListId ? `/?list=${encodeURIComponent(activeListId)}` : "/",
          { replace: true },
        );
        return;
      }

      setChat(existingChat);
      setIsLoadingChat(false);
    };

    void loadChat();

    return () => {
      isMounted = false;
    };
  }, [activeListId, chatId, navigate]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [chatId, stop]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !window.alem?.browserSetActiveChat
    ) {
      return;
    }
    const activeId = chatId?.trim() || null;
    void window.alem.browserSetActiveChat(activeId);
    return () => {
      void window.alem?.browserSetActiveChat?.(null);
    };
  }, [chatId]);

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
    setPromptMode(initialMode);
    void submitPrompt(initialPrompt, initialAttachments, initialMode);
  }, [activeChat, initialAttachments, initialMode, initialPrompt, submitPrompt, setPromptMode]);

  const hasOpenFolderDialog =
    !!chatId &&
    typeof window !== "undefined" &&
    window.alem &&
    typeof window.alem.openFolderDialog === "function";

  const handleSelectWorkspaceFolder = hasOpenFolderDialog
    ? useCallback(async () => {
        const path = await window.alem!.openFolderDialog();
        if (path && chatId) {
          const updated = await chatService.updateChat(chatId, {
            terminalWorkspacePath: path,
          });
          if (updated) setChat(updated);
        }
      }, [chatId])
    : undefined;

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
    promptMode,
    setPromptMode,
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
