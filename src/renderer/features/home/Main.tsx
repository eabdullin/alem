import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PromptInput from "@/components/PromptInput";
import {
  buildChatTitle,
  chatService,
} from "@/services/chat-service";
import type { ChatAttachment } from "@/types/chat-attachment";
import type { PromptMode } from "@/types/prompt-mode";

const Main = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [input, setInput] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>(
    [],
  );
  const [promptMode, setPromptMode] = useState<PromptMode>("agent");
  const [workspacePath, setWorkspacePath] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const activeListId =
    new URLSearchParams(location.search).get("list")?.trim() || undefined;

  const addAttachments = async (files: File[]) => {
    if (!window.alem || files.length === 0) {
      return;
    }

    const nextAttachments: ChatAttachment[] = [];

    try {
      for (const file of files) {
        const dataBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => {
            const result = typeof reader.result === "string" ? reader.result : "";
            const commaIndex = result.indexOf(",");
            resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
          };

          reader.onerror = () => {
            reject(new Error(`Failed to read "${file.name}".`));
          };

          reader.readAsDataURL(file);
        });

        const attachment = await window.alem.saveAttachment({
          name: file.name || "attachment",
          mediaType: file.type || "application/octet-stream",
          dataBase64,
        });

        nextAttachments.push(attachment);
      }
    } catch (unknownError) {
      for (const attachment of nextAttachments) {
        try {
          await window.alem.deleteAttachment(attachment.id);
        } catch {
          // Ignore cleanup errors when a draft upload fails.
        }
      }

      setError(
        unknownError instanceof Error
          ? unknownError
          : new Error("Failed to attach one or more files."),
      );
      return;
    }

    setPendingAttachments((current) => [...current, ...nextAttachments]);
    setError(null);
  };

  const removePendingAttachment = async (attachmentId: string) => {
    setPendingAttachments((current) =>
      current.filter((attachment) => attachment.id !== attachmentId),
    );

    try {
      await window.alem.deleteAttachment(attachmentId);
    } catch {
      // Ignore delete failures in draft state.
    }
  };

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    const prompt = input.trim();
    if ((!prompt && pendingAttachments.length === 0) || isCreating) {
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const titleSource = prompt || `Attachment: ${pendingAttachments[0]?.name || ""}`;
      const chat = await chatService.createChat(buildChatTitle(titleSource), {
        chatGroupId: activeListId,
        terminalWorkspacePath: workspacePath.trim() || undefined,
      });
      setInput("");
      setPendingAttachments([]);
      setWorkspacePath("");
      setPromptMode("ask");
      navigate(
        activeListId
          ? `/chat/${chat.id}?list=${encodeURIComponent(activeListId)}`
          : `/chat/${chat.id}`,
        {
          state: {
            initialPrompt: prompt,
            initialAttachments: pendingAttachments,
            initialMode: promptMode,
          },
        },
      );
    } catch (unknownError) {
      setError(
        unknownError instanceof Error
          ? unknownError
          : new Error("Failed to create chat."),
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center grow px-10 md:px-4">
      <div className="mb-8 text-center">
        <div className="h3 leading-[4rem] 2xl:mb-2 2xl:h4">
          What can I help with?
        </div>
      </div>
      <div className="w-full max-w-[42rem]">
        <PromptInput
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onSubmit={handleSubmit}
          attachments={pendingAttachments}
          onAddFiles={addAttachments}
          onRemoveAttachment={removePendingAttachment}
          mode={promptMode}
          onModeChange={setPromptMode}
          terminalWorkspacePath={workspacePath || undefined}
          onSelectWorkspaceFolder={
            window.alem?.openFolderDialog
              ? async () => {
                  const path = await window.alem.openFolderDialog();
                  if (path) setWorkspacePath(path);
                }
              : undefined
          }
          placeholder={isCreating ? "Creating chat..." : "Ask anything"}
          centered
        />
        {error && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-accent-1/10 text-accent-1 base2">
            {error.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Main;
