import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Layout from "@/components/Layout";
import Chat from "@/components/Chat";
import PromptInput from "@/components/PromptInput";
import { ChatMessages } from "./components/ChatMessages";
import { useChatRouteState } from "./hooks/useChatRouteState";
import { useChatSession } from "./hooks/useChatSession";
import { useQurtChat } from "@/hooks/useQurtChat";
import { useChatMetrics } from "./hooks/useChatMetrics";
import { useCheckpointRestoreFlow } from "./hooks/useCheckpointRestoreFlow";
import { useBrowserChatBinding } from "./hooks/useBrowserChatBinding";
import { useAutoToolApproval } from "./hooks/useAutoToolApproval";
import { useActiveChatStore } from "@/stores/useActiveChatStore";
import { toDownloadableMessages } from "./utils/downloadableMessages";

const ChatPage = () => {
  const [hideRightSidebar, setHideRightSidebar] = useState(false);
  const sentInitialPromptRef = useRef(false);

  const { chatId, activeListId, initialPrompt, initialAttachments } = useChatRouteState();
  useChatSession({ chatId, activeListId });

  const { activeChat: storedChat, isLoadingChat, selectWorkspaceFolder, saveMessages } = useActiveChatStore();
  // Guard against stale activeChat while a new chatId is loading
  const activeChat = storedChat?.id === chatId ? storedChat : null;

  const initialMessages = useMemo(
    () => activeChat?.messages ?? [],
    [activeChat?.messages],
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
    model,
    setMessages,
    stop,
    wasStoppedByUser,
  } = useQurtChat({
    chatId,
    initialMessages,
    onMessagesChange: saveMessages,
    workspaceRoot: activeChat?.terminalWorkspacePath,
  });

  useAutoToolApproval({ messages });

  const { filePatchCheckpointIds, showRestoreConfirmation, handleRestoreFilePatch } =
    useCheckpointRestoreFlow({ messages });

  const { tokenUsage, maxTokens, resolvedModelId } = useChatMetrics({ model, messages });

  const downloadableMessages = useMemo(
    () => toDownloadableMessages(messages),
    [messages],
  );

  const openAttachment = useCallback((attachmentId: string) => {
    if (!window.qurt) return;
    void window.qurt.openAttachment(attachmentId);
  }, []);

  useEffect(() => {
    sentInitialPromptRef.current = false;
  }, [chatId]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [chatId, stop]);

  useEffect(() => {
    if (isLoadingChat || !activeChat) return;
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

  useBrowserChatBinding(chatId);

  if (isLoadingChat || !activeChat) {
    return (
      <Layout>
        <div className="flex grow items-center justify-center px-10 md:px-4">
          <div className="base2 text-n-4/75">Loading chat...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      hideRightSidebar={hideRightSidebar}
      onToggleRightSidebar={() => setHideRightSidebar((prev) => !prev)}
    >
      <Chat
        chatId={activeChat.id}
        chatGroupIds={activeChat.chatGroupIds}
        downloadMessages={downloadableMessages}
        title={activeChat.title}
        workspacePath={activeChat.terminalWorkspacePath}
        filePatchCheckpointIds={filePatchCheckpointIds}
        onRestoreFilePatch={handleRestoreFilePatch}
        tokenUsage={tokenUsage}
        maxTokens={maxTokens}
        modelId={resolvedModelId}
      >
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          error={error}
          onOpenAttachment={openAttachment}
          onRestoreCheckpoint={showRestoreConfirmation}
          wasStoppedByUser={wasStoppedByUser}
        />
      </Chat>
      <PromptInput
        value={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        attachments={pendingAttachments}
        onAddFiles={addAttachments}
        onRemoveAttachment={removePendingAttachment}
        terminalWorkspacePath={activeChat.terminalWorkspacePath}
        onSelectWorkspaceFolder={window.qurt ? selectWorkspaceFolder : undefined}
        placeholder="Ask anything"
        isLoading={isLoading}
        onStop={stop}
      />
    </Layout>
  );
};

export default ChatPage;
