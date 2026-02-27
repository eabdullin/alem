import {
  type ChangeEventHandler,
  type ClipboardEvent,
  type FormEventHandler,
  type KeyboardEvent,
  useContext,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "react-hot-toast";
import { Icon } from "@/utils/icons";
import { Button } from "@/components/ui/button";
import ModelSelector from "@/components/ModelSelector";
import AddFile from "./AddFile";
import type { ChatAttachment } from "@/types/chat-attachment";
import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
  type AttachmentData,
} from "@/components/ai-elements/attachments";
import { QurtContext } from "@/App";
import { PROVIDERS } from "@/constants/providers";
import Notify from "@/components/Notify";

type PromptInputProps = {
  value: any;
  onChange: ChangeEventHandler<HTMLTextAreaElement>;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  placeholder?: string;
  attachments?: ChatAttachment[];
  onAddFiles?: (files: File[]) => void;
  onRemoveAttachment?: (attachmentId: string) => void;
  /** Optional workspace path for terminal; show folder selector when onSelectWorkspaceFolder is provided. */
  terminalWorkspacePath?: string;
  onSelectWorkspaceFolder?: () => void;
  centered?: boolean;
  /** When true, show stop button instead of submit; requires onStop. */
  isLoading?: boolean;
  onStop?: () => void;
};

const TOAST_DURATION_MS = 10000;

const PromptInput = ({
  value,
  onChange,
  onSubmit,
  placeholder,
  attachments,
  onAddFiles,
  onRemoveAttachment,
  terminalWorkspacePath,
  onSelectWorkspaceFolder,
  centered,
  isLoading,
  onStop,
}: PromptInputProps) => {
  const { settings } = useContext(QurtContext);
  const navigate = useNavigate();

  const enabledModels: Record<string, string[]> = useMemo(
    () => settings?.enabledModels ?? {},
    [settings?.enabledModels],
  );
  const enabledCount = useMemo(
    () =>
      PROVIDERS.reduce(
        (sum, p) => sum + (enabledModels[p.id]?.length ?? 0),
        0,
      ),
    [enabledModels],
  );
  const hasSelectedModel = Boolean(settings?.activeModel);

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

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    if (enabledCount === 0) {
      event.preventDefault();
      toast(
        (t) => (
          <Notify>
            <div className="ml-3 mr-6 base2 md:mx-0 md:my-2">
              Add API keys and enable models in Settings to start chatting.
            </div>
            <Button
              size="sm"
              className="ml-2 shrink-0"
              onClick={() => {
                navigate("/settings");
                toast.dismiss(t.id);
              }}
            >
              Setup
            </Button>
          </Notify>
        ),
        { duration: TOAST_DURATION_MS },
      );
      return;
    }
    if (!hasSelectedModel) {
      event.preventDefault();
      toast(
        (t) => (
          <Notify>
            <div className="ml-3 base2">Choose a model to continue.</div>
            <Button
              size="sm"
              variant="ghost"
              className="ml-2 shrink-0 text-n-1 hover:text-n-1/90"
              onClick={() => toast.dismiss(t.id)}
            >
              Dismiss
            </Button>
          </Notify>
        ),
        { duration: TOAST_DURATION_MS },
      );
      return;
    }
    onSubmit?.(event);
  };

  return (
    <div
      className={`relative z-5 w-full ${
        centered
          ? "px-0"
          : "px-10 pb-6 before:absolute before:-top-6 before:left-0 before:right-6 before:bottom-1/2 before:bg-gradient-to-b before:to-n-1 before:from-n-1/0 before:pointer-events-none 2xl:px-6 2xl:pb-5 md:px-4 md:pb-4 dark:before:to-n-6 dark:before:from-n-6/0"
      }`}
    >
      <form onSubmit={handleSubmit}>
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
              placeholder={placeholder || "Ask Qurt anything"}
            />
            {(value !== "" || hasAttachments || isLoading) && (
              isLoading && onStop ? (
                <button
                  className="group absolute right-3 bottom-2 w-10 h-10 bg-primary-1 rounded-xl transition-colors hover:bg-primary-1/90"
                  type="button"
                  onClick={onStop}
                  title="Stop"
                >
                  <Icon className="stroke-n-1" name="stop" />
                </button>
              ) : (
                <button
                  className="group absolute right-3 bottom-2 w-10 h-10 bg-primary-1 rounded-xl transition-colors hover:bg-primary-1/90"
                  type="submit"
                >
                  <Icon className="stroke-n-1" name="arrow-up" />
                </button>
              )
            )}
          </div>
          <div className="relative flex flex-wrap items-center gap-2 px-3 pb-2.5">
            <AddFile onSelectFiles={onAddFiles} />
            <ModelSelector direction="up" compact />
            {onSelectWorkspaceFolder && (
              <Button
                type="button"
                variant="ghost"
                onClick={onSelectWorkspaceFolder}
                className="h-9 py-1 px-2 hover:text-n-7 dark:text-n-4 dark:hover:text-n-1 truncate max-w-[12rem]"
                title={terminalWorkspacePath || "Select workspace folder for terminal"}
              >
                {terminalWorkspacePath ? (
                  <span className="truncate flex items-center gap-1.5" title={terminalWorkspacePath}>
                    <Icon className="size-4 shrink-0" name="folder" />
                    {terminalWorkspacePath.split(/[/\\]/).pop() || terminalWorkspacePath}
                  </span>
                ) : (
                  <>
                    <Icon className="size-4 shrink-0" name="folder" />
                    Select workspace
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default PromptInput;
