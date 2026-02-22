import {
  type ChangeEventHandler,
  type ClipboardEvent,
  type FormEventHandler,
  type KeyboardEvent,
  useMemo,
} from "react";
import TextareaAutosize from "react-textarea-autosize";
import Icon from "@/components/Icon";
import ModelSelector from "@/components/ModelSelector";
import Select from "@/components/Select";
import AddFile from "./AddFile";
import type { ChatAttachment } from "@/types/chat-attachment";
import type { PromptMode } from "@/types/prompt-mode";
import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
  type AttachmentData,
} from "@/components/ai-elements/attachments";

type PromptInputProps = {
  value: any;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  placeholder?: string;
  attachments?: ChatAttachment[];
  onAddFiles?: (files: File[]) => void;
  onRemoveAttachment?: (attachmentId: string) => void;
  mode?: PromptMode;
  onModeChange?: (mode: PromptMode) => void;
  /** When in agent mode, optional workspace path for terminal; show folder selector when onSelectWorkspaceFolder is provided. */
  terminalWorkspacePath?: string;
  onSelectWorkspaceFolder?: () => void;
  centered?: boolean;
};

const PromptInput = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  attachments,
  onAddFiles,
  onRemoveAttachment,
  mode = "agent",
  onModeChange,
  terminalWorkspacePath,
  onSelectWorkspaceFolder,
  centered,
}: PromptInputProps) => {
  const modeItems: { id: PromptMode; title: string }[] = useMemo(
    () => [
      { id: "agent", title: "Agent" },
      { id: "ask", title: "Ask" },
    ],
    [],
  );
  const selectedMode =
    modeItems.find((m) => m.id === mode) ?? modeItems[0];
  const hasAttachments = (attachments?.length ?? 0) > 0;
  const attachmentItems = useMemo<AttachmentData[]>(
    () =>
      (attachments ?? []).map((attachment) => ({
        id: attachment.id,
        filename: attachment.name,
        mediaType: attachment.mediaType,
        type: "file",
        url: "",
      })),
    [attachments],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((value.trim() || hasAttachments) && onSubmit) {
        const form = (e.target as HTMLTextAreaElement).closest("form");
        if (form) form.requestSubmit();
      }
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData.files ?? []);
    if (files.length > 0) {
      onAddFiles?.(files);
    }
  };

  return (
    <div
      className={`relative z-5 w-full ${
        centered
          ? "px-0"
          : "px-10 pb-6 before:absolute before:-top-6 before:left-0 before:right-6 before:bottom-1/2 before:bg-gradient-to-b before:to-n-1 before:from-n-1/0 before:pointer-events-none 2xl:px-6 2xl:pb-5 md:px-4 md:pb-4 dark:before:to-n-6 dark:before:from-n-6/0"
      }`}
    >
      <form onSubmit={onSubmit}>
        <div className="relative z-2 border-2 border-n-3 rounded-2xl dark:border-n-5">
          {hasAttachments && (
            <div className="overflow-hidden rounded-t-2xl border-b-2 border-n-3 px-4 py-3 dark:border-n-5">
              <Attachments className="w-full" variant="list">
                {attachmentItems.map((attachment) => (
                  <Attachment
                    data={attachment}
                    key={attachment.id}
                    onRemove={
                      onRemoveAttachment
                        ? () => onRemoveAttachment(attachment.id)
                        : undefined
                    }
                  >
                    <AttachmentPreview />
                    <AttachmentInfo showMediaType />
                    <AttachmentRemove />
                  </Attachment>
                ))}
              </Attachments>
            </div>
          )}
          <div className="relative flex items-center min-h-[3.5rem] px-5 pr-14 text-0">
            <TextareaAutosize
              className="w-full py-3 bg-transparent body2 text-n-7 outline-none resize-none placeholder:text-n-4/75 dark:text-n-1 dark:placeholder:text-n-4"
              maxRows={5}
              autoFocus
              value={value}
              onChange={onChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={placeholder || "Ask Alem anything"}
            />
            {(value !== "" || hasAttachments) && (
              <button
                className="group absolute right-3 bottom-2 w-10 h-10 bg-primary-1 rounded-xl transition-colors hover:bg-primary-1/90"
                type="submit"
              >
                <Icon className="fill-n-1" name="arrow-up" />
              </button>
            )}
          </div>
          <div className="relative flex flex-wrap items-center gap-2 px-3 pb-2.5">
            <AddFile onSelectFiles={onAddFiles} />
            <Select
              items={modeItems}
              value={selectedMode}
              onChange={(item: { id: PromptMode }) => onModeChange?.(item.id)}
              small
              up
              noShadow
              classButton="caption2 border-0"
              classOptions="border-0"
              classOption="caption2"
            />
            <ModelSelector direction="up" compact />
            {mode === "agent" && onSelectWorkspaceFolder && (
              <button
                type="button"
                onClick={onSelectWorkspaceFolder}
                className="caption2 text-n-5 hover:text-n-7 dark:text-n-4 dark:hover:text-n-1 truncate max-w-[12rem] rounded-md px-2 py-1 border border-n-3 dark:border-n-5 hover:border-n-4 dark:hover:border-n-4 transition-colors"
                title={terminalWorkspacePath || "Select workspace folder for terminal"}
              >
                {terminalWorkspacePath ? (
                  <span className="truncate block" title={terminalWorkspacePath}>
                    📁 {terminalWorkspacePath.split(/[/\\]/).pop() || terminalWorkspacePath}
                  </span>
                ) : (
                  "📁 Select workspace"
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default PromptInput;
