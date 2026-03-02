import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  Attachments,
  type AttachmentData,
} from "@/components/ai-elements/attachments";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageToolbar,
} from "@/components/ai-elements/message";
import { HistoryIcon } from "lucide-react";
import { getAttachmentIdFromUrl } from "../utils/messageParts";
import type { UIMessage } from "ai";

type UserMessageItemProps = {
  message: UIMessage;
  showRestoreCheckpoint: boolean;
  onOpenAttachment: (attachmentId: string) => void;
  onRestoreCheckpoint?: () => void;
};

export function UserMessageItem({
  message,
  showRestoreCheckpoint,
  onOpenAttachment,
  onRestoreCheckpoint,
}: UserMessageItemProps) {
  const textParts = message.parts.filter(
    (p): p is { type: "text"; text: string } => p.type === "text",
  );
  const fileParts = message.parts.filter(
    (
      p,
    ): p is {
      type: "file";
      url: string;
      mediaType: string;
      filename?: string;
    } => p.type === "file",
  );
  const text = textParts.map((p) => p.text).join("");
  const attachmentItems: AttachmentData[] = fileParts.map((fp) => ({
    id: getAttachmentIdFromUrl(fp.url) ?? fp.url,
    filename: fp.filename ?? "file",
    mediaType: fp.mediaType,
    type: "file",
    url: fp.url.startsWith("data:") ? fp.url : "",
  }));

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
      </MessageContent>
      {showRestoreCheckpoint && onRestoreCheckpoint && (
        <MessageActions className="ml-auto -mt-6">
          <MessageAction
            onClick={onRestoreCheckpoint}
            label="Restore checkpoint"
            tooltip="Restore chat to state before this message"
          >
            <HistoryIcon className="size-2" />
          </MessageAction>
        </MessageActions>
      )}
    </Message>
  );
}
