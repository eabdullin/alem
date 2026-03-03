import { Message, MessageContent } from "@/components/ai-elements/message";
import { ThinkingShimmer } from "./ThinkingShimmer";
import { UserMessageItem } from "./UserMessageItem";
import { AssistantMessageItem } from "./AssistantMessageItem";
import type { UIMessage } from "ai";

type ChatMessagesProps = {
  messages: UIMessage[];
  isLoading: boolean;
  error: Error | undefined;
  onOpenAttachment: (attachmentId: string) => void;
  onRestoreCheckpoint: (userMessageIndex: number) => void;
  /** Simple predicate: should we show the restore button for index i? */
  canRestore: (index: number) => boolean;
  wasStoppedByUser?: boolean;
};

export function ChatMessages({
  messages,
  isLoading,
  error,
  onOpenAttachment,
  onRestoreCheckpoint,
  canRestore,
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
          const showRestoreCheckpoint = canRestore(index);
          return (
            <UserMessageItem
              key={message.id}
              message={message}
              onOpenAttachment={onOpenAttachment}
              onRestoreCheckpoint={
                showRestoreCheckpoint
                  ? () => onRestoreCheckpoint(index)
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
          <MessageContent className="w-full rounded-[1.25rem] bg-n-2 px-5 py-4 dark:bg-n-7">
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
