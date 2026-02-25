import Layout from "@/components/Layout";
import Chat from "@/components/Chat";
import PromptInput from "@/components/PromptInput";
import { ChatMessages } from "./components/ChatMessages";
import { useChatPageController } from "./hooks/useChatPageController";

const ChatPage = () => {
  const {
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
    addToolApprovalResponse,
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
  } = useChatPageController();

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
        filePatchCheckpointIds={filePatchCheckpointIds}
        onRestoreFilePatch={handleRestoreFilePatch}
        tokenUsage={tokenUsage}
        maxTokens={maxTokens}
        modelId={resolvedModelId}
      >
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          isReasoningModel={isReasoningModel}
          error={error}
          addToolApprovalResponse={addToolApprovalResponse}
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
        mode={promptMode}
        onModeChange={setPromptMode}
        terminalWorkspacePath={activeChat.terminalWorkspacePath}
        onSelectWorkspaceFolder={handleSelectWorkspaceFolder}
        placeholder="Ask anything"
        isLoading={isLoading}
        onStop={stop}
      />
    </Layout>
  );
};

export default ChatPage;
