import { useCallback, useState } from "react";
import { useCheckpointStore } from "@/hooks/useCheckpointStore";
import { Icon } from "@/utils/icons";
import ModalShareChat from "@/components/ModalShareChat";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  messagesToMarkdown,
  type ConversationMessage,
} from "@/components/ai-elements/conversation";
import {
  Context,
  ContextContent,
  ContextContentBody,
  ContextContentHeader,
  ContextContentFooter,
  ContextTrigger,
} from "@/components/ai-elements/context";
import Actions from "./Actions";

type ChatProps = {
  chatId: string;
  chatGroupIds: string[];
  title: string;
  children: React.ReactNode;
  downloadMessages?: ConversationMessage[];
  /** Checkpoint IDs from apply_file_patch in the last assistant message; when set, show Restore button. */
  filePatchCheckpointIds?: string[];
  /** Called when user clicks Restore to revert file changes to state before last user message. */
  onRestoreFilePatch?: () => void | Promise<void>;
  /** Token usage data for the chat session */
  tokenUsage?: {
    totalTokens: number;
    inputTokens: number;
    outputTokens: number;
    reasoningTokens: number;
    cachedInputTokens: number;
  };
  /** Max tokens for the current model */
  maxTokens?: number;
  /** Model ID for cost calculation */
  modelId?: string;
};

const Chat = ({
  chatId,
  chatGroupIds,
  title,
  children,
  downloadMessages = [],
  filePatchCheckpointIds = [],
  onRestoreFilePatch,
  tokenUsage,
  maxTokens,
  modelId,
}: ChatProps) => {
  const [favorite, setFavorite] = useState<boolean>(false);
  const [visibleModal, setVisibleModal] = useState<boolean>(false);
  const [restoreState, setRestoreState] = useState<"idle" | "success" | "error">("idle");
  const { isRestoring } = useCheckpointStore();
  const hasDownloadableMessages = downloadMessages.length > 0;
  const hasFilePatchCheckpoints =
    filePatchCheckpointIds.length > 0 && typeof onRestoreFilePatch === "function";

  const handleRestoreFilePatch = useCallback(async () => {
    if (!hasFilePatchCheckpoints) return;
    try {
      await onRestoreFilePatch?.();
      setRestoreState("success");
    } catch {
      setRestoreState("error");
    }
  }, [hasFilePatchCheckpoints, onRestoreFilePatch]);

  const handleDownloadConversation = useCallback(() => {
    if (downloadMessages.length === 0) {
      return;
    }

    const markdown = messagesToMarkdown(downloadMessages);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "conversation.md";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [downloadMessages]);

  return (
    <>
      <div className="flex items-center min-h-[4.5rem] px-10 pr-20 py-3 border-b border-n-3 shadow-[0_0.75rem_2.5rem_-0.75rem_rgba(0,0,0,0.06)] 2xl:px-6 2xl:pr-20 lg:-mt-18 lg:pr-20 md:pl-5 md:pr-18 dark:border-n-5 dark:shadow-[0_0.75rem_2.5rem_-0.75rem_rgba(0,0,0,0.15)]">
        <div className="mr-auto h5 truncate md:h6">{title}</div>
        <div className="flex items-center ml-6 gap-3">
          {tokenUsage && maxTokens && (
            <Context
              usedTokens={tokenUsage.totalTokens}
              maxTokens={maxTokens}
              modelId={modelId}
              usage={{
                inputTokens: tokenUsage.inputTokens,
                outputTokens: tokenUsage.outputTokens,
                reasoningTokens: tokenUsage.reasoningTokens,
                cachedInputTokens: tokenUsage.cachedInputTokens,
                totalTokens: tokenUsage.totalTokens,
                inputTokenDetails: {
                  noCacheTokens: undefined,
                  cacheReadTokens: tokenUsage.cachedInputTokens || 0,
                  cacheWriteTokens: undefined,
                },
                outputTokenDetails: {
                  textTokens: undefined,
                  reasoningTokens: tokenUsage.reasoningTokens || 0,
                },
              } as any}
            >
              <ContextTrigger />
              <ContextContent>
                <ContextContentHeader />
                <ContextContentBody>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Total tokens</span>
                      <span className="font-mono">
                        {new Intl.NumberFormat("en-US", {
                          notation: "compact",
                        }).format(tokenUsage.totalTokens)}
                      </span>
                    </div>
                  </div>
                </ContextContentBody>
                <ContextContentFooter />
              </ContextContent>
            </Context>
          )}
          <button
            className="group w-8 h-8 md:hidden"
            onClick={() => setFavorite(!favorite)}
          >
            <Icon
              className={`${
                favorite
                  ? "stroke-accent-5"
                  : "stroke-n-4 transition-colors group-hover:stroke-accent-5"
              }`}
              name={favorite ? "star-fill" : "star"}
            />
          </button>
          {hasFilePatchCheckpoints && (
            <button
              className="group w-8 h-8"
              onClick={handleRestoreFilePatch}
              title="Restore files to state before last message"
              type="button"
              disabled={isRestoring}
            >
              <Icon
                className="stroke-n-4 transition-colors group-hover:stroke-primary-1"
                name={restoreState === "success" ? "check" : "refresh"}
              />
            </button>
          )}
          {hasDownloadableMessages && (
            <button
              className="group w-8 h-8"
              onClick={handleDownloadConversation}
              title="Download conversation"
              type="button"
            >
              <Icon
                className="stroke-n-4 transition-colors group-hover:stroke-primary-1"
                name="download"
              />
            </button>
          )}
          <Actions chatId={chatId} chatGroupIds={chatGroupIds} />
        </div>
      </div>
      <Conversation className="relative z-2 grow">
        <ConversationContent className="gap-10 p-10 2xl:p-6 md:p-5">
          {children}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <ModalShareChat
        visible={visibleModal}
        onClose={() => setVisibleModal(false)}
      />
    </>
  );
};

export default Chat;
