import { Message, MessageContent } from "@/components/ai-elements/message";
import { UserMessageItem } from "./UserMessageItem";
import { AssistantMessageItem } from "./AssistantMessageItem";
import type { ToolApprovalResponseParams } from "../hooks/useChatPageController";
import type { UIMessage } from "ai";

type ChatMessagesProps = {
  messages: UIMessage[];
  isLoading: boolean;
  isReasoningModel: boolean;
  error: Error | undefined;
  addToolApprovalResponse: (params: ToolApprovalResponseParams) => void;
  onOpenAttachment: (attachmentId: string) => void;
  onRestoreCheckpoint: (userMessageIndex: number) => void;
  wasStoppedByUser?: boolean;
};

export function ChatMessages({
  messages,
  isLoading,
  isReasoningModel,
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

  return (
    <>
      {messages.map((message, index) => {
        if (message.role === "user") {
          return (
            <UserMessageItem
              key={message.id}
              message={message}
              messageIndex={index}
              messages={messages}
              onOpenAttachment={onOpenAttachment}
              onRestoreCheckpoint={onRestoreCheckpoint}
            />
          );
        }
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
      {isLoading && messages[messages.length - 1]?.role === "user" && (
        <Message from="assistant">
          <MessageContent className="max-w-[50rem] rounded-[1.25rem] bg-n-2 px-5 py-4 dark:bg-n-7">
            <div className="space-y-2">
              <div className="flex space-x-1.5">
                <div className="h-2 w-2 animate-[loaderDots_0.6s_0s_infinite_alternate] rounded-full bg-n-7 dark:bg-n-1"></div>
                <div className="h-2 w-2 animate-[loaderDots_0.6s_0.3s_infinite_alternate] rounded-full bg-n-7 dark:bg-n-1"></div>
                <div className="h-2 w-2 animate-[loaderDots_0.6s_0.6s_infinite_alternate] rounded-full bg-n-7 dark:bg-n-1"></div>
              </div>
              {isReasoningModel && (
                <div className="caption1 text-n-4 dark:text-n-3/80">
                  Thinking...
                </div>
              )}
            </div>
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
