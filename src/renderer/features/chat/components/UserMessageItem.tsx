import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  Attachments,
  type AttachmentData,
} from "@/components/ai-elements/attachments";
import {
  Checkpoint,
  CheckpointIcon,
  CheckpointTrigger,
} from "@/components/ai-elements/checkpoint";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getRestoreContextForUserMessage } from "@/services/checkpoint-service";
import { getAttachmentIdFromUrl } from "../utils/messageParts";
import type { UIMessage } from "ai";

type UserMessageItemProps = {
  message: UIMessage;
  messageIndex: number;
  messages: UIMessage[];
  onOpenAttachment: (attachmentId: string) => void;
  onRestoreCheckpoint: (userMessageIndex: number) => void;
};

export function UserMessageItem({
  message,
  messageIndex,
  messages,
  onOpenAttachment,
  onRestoreCheckpoint,
}: UserMessageItemProps) {
  const textParts = message.parts.filter(
    (p): p is { type: "text"; text: string } => p.type === "text",
  );
  const fileParts = message.parts.filter(
    (p): p is { type: "file"; url: string; mediaType: string; filename?: string } =>
      p.type === "file",
  );
  const text = textParts.map((p) => p.text).join("");
  const attachmentItems: AttachmentData[] = fileParts.map((fp) => ({
    id: getAttachmentIdFromUrl(fp.url) ?? fp.url,
    filename: fp.filename ?? "file",
    mediaType: fp.mediaType,
    type: "file",
    url: fp.url.startsWith("data:") ? fp.url : "",
  }));

  const restoreCtx = getRestoreContextForUserMessage(messages, messageIndex);
  const showRestoreCheckpoint =
    restoreCtx !== null && restoreCtx.checkpointIds.length > 0;

  return (
    <Message from="user" key={message.id}>
      <MessageContent className="max-w-[50rem] space-y-3 rounded-[1.25rem] border-3 border-n-2 px-5 py-4 dark:border-transparent dark:bg-n-5/50">
        {attachmentItems.length > 0 && (
          <Attachments variant="inline">
            {attachmentItems.map((attachment) => (
              <Attachment
                className="cursor-pointer"
                data={attachment}
                key={attachment.id}
                onClick={() => onOpenAttachment(attachment.id)}
              >
                <AttachmentPreview />
                <AttachmentInfo />
              </Attachment>
            ))}
          </Attachments>
        )}
        {!!text && <div className="whitespace-pre-wrap">{text}</div>}
        {showRestoreCheckpoint && restoreCtx && (
          <TooltipProvider>
            <Checkpoint className="mt-3">
              <CheckpointIcon />
              <CheckpointTrigger
                onClick={() => onRestoreCheckpoint(restoreCtx.userMessageIndex)}
                tooltip="Restore files to state before this message"
              >
                Restore checkpoint
              </CheckpointTrigger>
            </Checkpoint>
          </TooltipProvider>
        )}
      </MessageContent>
    </Message>
  );
}
