import { Message, MessageContent } from "@/components/ai-elements/message";
import { getRestoreContextForUserMessage } from "@/services/checkpoint-service";
import { ThinkingShimmer } from "./ThinkingShimmer";
import { UserMessageItem } from "./UserMessageItem";
import { AssistantMessageItem } from "./AssistantMessageItem";
import type { ToolApprovalResponseParams } from "../hooks/useChatPageController";
import type { UIMessage } from "ai";

type ChatMessagesProps = {
  messages: UIMessage[];
  isLoading: boolean;
  error: Error | undefined;
  addToolApprovalResponse: (params: ToolApprovalResponseParams) => void;
  onOpenAttachment: (attachmentId: string) => void;
  onRestoreCheckpoint: (userMessageIndex: number) => void;
  wasStoppedByUser?: boolean;
};

export function ChatMessages({
  messages,
  isLoading,
  error,
  addToolApprovalResponse,
  onOpenAttachment,
  onRestoreCheckpoint,
  wasStoppedByUser,
}: ChatMessagesProps) {
  const lastAssistantIndex = [...messages]
    .map((m, i) => (m.role === "assistant" ? i : -1))
    .filter((i) => i >= 0)
    .pop();

  const messageHasContent = (message: UIMessage) => message.parts.some((part) => 
    part.type === "reasoning" && part.text.trim() !== ""
    || part.type === "text" && part.text.trim() !== ""
    || part.type === "dynamic-tool"
    || part.type === "file"
    || part.type.startsWith("tool-")
    || part.type.startsWith("source-")
    || part.type.startsWith("data-")
);
  return (
    <>
      {messages.map((message, index) => {
        if (message.role === "user") {
          const restoreCtx = getRestoreContextForUserMessage(messages, index);
          const showRestoreCheckpoint =
            restoreCtx !== null && restoreCtx.checkpointIds.length > 0;
          return (
            <UserMessageItem
              key={message.id}
              message={message}
              showRestoreCheckpoint={showRestoreCheckpoint}
              onOpenAttachment={onOpenAttachment}
              onRestoreCheckpoint={
                showRestoreCheckpoint && restoreCtx
                  ? () => onRestoreCheckpoint(restoreCtx.userMessageIndex)
                  : undefined
              }
            />
          );
        }
        if (!messageHasContent(message)) return null;
        return (
          <AssistantMessageItem
            key={message.id}
            message={message}
            addToolApprovalResponse={addToolApprovalResponse}
            isStopped={
              wasStoppedByUser &&
              !isLoading &&
              lastAssistantIndex !== undefined &&
              index === lastAssistantIndex
            }
          />
        );
      })}
      {isLoading && (messages[messages.length - 1]?.role === "user" || !messageHasContent(messages[messages.length - 1])) && ( 
        <Message from="assistant">
          <MessageContent className="max-w-[50rem] rounded-[1.25rem] bg-n-2 px-5 py-4 dark:bg-n-7">
            <ThinkingShimmer text="Thinking..." />
          </MessageContent>
        </Message>
      )}
      {error && (
        <div className="mt-4 px-4 py-3 rounded-xl bg-accent-1/10 text-accent-1 base2">
          {error.message}
        </div>
      )}
    </>
  );
}
