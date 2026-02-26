import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useChat } from "@ai-sdk/react";
import {
  lastAssistantMessageIsCompleteWithApprovalResponses,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";
import { AlemContext } from "@/App";
import { getTextFromParts } from "@/lib/chat/messageParts";
import { createAgent } from "@/services/ai-service";
import { type AiProvider, providerService } from "@/services/provider-service";
import {
  AlemChatTransport,
  ALEM_ATTACHMENT_PREFIX,
} from "@/services/alem-chat-transport";
import type { ChatAttachment } from "@/types/chat-attachment";

interface UseAlemChatOptions {
  chatId?: string;
  initialMessages?: UIMessage[];
  onMessagesChange?: (messages: UIMessage[], sourceChatId?: string) => void;
  /** Per-chat workspace root for terminal and file-patch tools; required in agent mode. */
  workspaceRoot?: string;
}

function isToolApprovalRequested(part: UIMessage["parts"][number]): boolean {
  if (!(part.type === "dynamic-tool" || part.type.startsWith("tool-"))) {
    return false;
  }
  return "state" in part && part.state === "approval-requested";
}

function hasPendingToolApprovals(messages: UIMessage[]): boolean {
  const lastAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  if (!lastAssistantMessage) {
    return false;
  }
  return lastAssistantMessage.parts.some(isToolApprovalRequested);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
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
}

function attachmentsToFileParts(attachments: ChatAttachment[]) {
  return attachments.map((a) => ({
    type: "file" as const,
    mediaType: a.mediaType,
    filename: a.name,
    url: `${ALEM_ATTACHMENT_PREFIX}${a.id}`,
  }));
}

async function appendNewTurnsToMemory(
  messages: UIMessage[],
  lastLoggedRef: { current: number },
): Promise<void> {
  if (typeof window === "undefined" || !window.alem?.appendConversation) {
    return;
  }
  const from = lastLoggedRef.current;
  const to = messages.length;
  if (from >= to) return;

  const timestamp = new Date().toISOString();
  for (let i = from; i < to; i++) {
    const msg = messages[i];
    if (!msg || (msg.role !== "user" && msg.role !== "assistant")) continue;
    const content = getTextFromParts(msg.parts).trim();
    if (!content) continue;
    try {
      await window.alem.appendConversation({
        role: msg.role,
        content,
        timestamp,
      });
    } catch {
      // Ignore append failures; do not block chat flow
    }
  }
  lastLoggedRef.current = to;
}

export function useAlemChat({
  chatId,
  initialMessages = [],
  onMessagesChange,
  workspaceRoot,
}: UseAlemChatOptions = {}) {
  const { settings } = useContext(AlemContext);
  const [input, setInput] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>(
    [],
  );
  const [attachmentError, setAttachmentError] = useState<Error | undefined>(
    undefined,
  );
  const [wasStoppedByUser, setWasStoppedByUser] = useState(false);
  const inFlightChatIdRef = useRef<string | undefined>(chatId);
  const workspaceRootRef = useRef(workspaceRoot);
  const chatIdRef = useRef(chatId);
  const lastLoggedMessageCountRef = useRef(0);
  workspaceRootRef.current = workspaceRoot;
  chatIdRef.current = chatId;

  const activeProvider = settings?.activeProvider;
  const provider: AiProvider = providerService.validateProvider(activeProvider, "openai");

  const ready = typeof window !== "undefined" && !!window.alem;
  const model = settings?.activeModel ?? "";

  const transport = useMemo(
    () =>
      new AlemChatTransport({
        getAgent: async () => {
          const apiKey = await window.alem!.getApiKey(provider);
          return createAgent({
            provider,
            model,
            apiKey,
            toolConfig: {
              workspaceRoot: workspaceRootRef.current,
              browserChatId: chatIdRef.current ?? undefined,
            },
          });
        },
        sendReasoning: true,
        resolveAttachment: (id) => window.alem!.readAttachment(id),
      }),
    [model, provider],
  );

  const {
    messages,
    sendMessage,
    status,
    stop,
    error,
    setMessages,
    addToolApprovalResponse,
    clearError,
  } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
    sendAutomaticallyWhen: (options) => lastAssistantMessageIsCompleteWithApprovalResponses(options) || lastAssistantMessageIsCompleteWithToolCalls(options),
    onFinish: ({ messages: finishedMessages }) => {
      onMessagesChange?.(finishedMessages, inFlightChatIdRef.current);
      void appendNewTurnsToMemory(
        finishedMessages,
        lastLoggedMessageCountRef,
      );
    },
  });

  const isLoading = status === "streaming" || status === "submitted";
  const displayError = error ?? attachmentError;

  useEffect(() => {
    setWasStoppedByUser(false);
    lastLoggedMessageCountRef.current = 0;
  }, [chatId]);

  useEffect(() => {
    lastLoggedMessageCountRef.current = initialMessages.length;
  }, [chatId, initialMessages.length]);

  const stopWithTracking = useCallback(() => {
    setWasStoppedByUser(true);
    stop();
  }, [stop]);

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const addAttachments = useCallback(
    async (files: File[]) => {
      if (!ready || files.length === 0) {
        return;
      }

      const nextAttachments: ChatAttachment[] = [];

      try {
        for (const file of files) {
          const dataBase64 = await fileToBase64(file);
          const attachment = await window.alem.saveAttachment({
            name: file.name || "attachment",
            mediaType: file.type || "application/octet-stream",
            dataBase64,
          });
          nextAttachments.push(attachment);
        }
      } catch (err) {
        for (const attachment of nextAttachments) {
          try {
            await window.alem.deleteAttachment(attachment.id);
          } catch {
            // Ignore cleanup failures after a partial upload error.
          }
        }

        setAttachmentError(
          err instanceof Error
            ? err
            : new Error("Failed to attach one or more files."),
        );
        return;
      }

      setPendingAttachments((current) => [...current, ...nextAttachments]);
      setAttachmentError(undefined);
    },
    [ready],
  );

  const removePendingAttachment = useCallback(async (attachmentId: string) => {
    setPendingAttachments((current) =>
      current.filter((attachment) => attachment.id !== attachmentId),
    );

    try {
      await window.alem.deleteAttachment(attachmentId);
    } catch {
      // Ignore delete failures in the draft state.
    }
  }, []);

  const submitPrompt = useCallback(
    async (
      rawPrompt: string,
      attachments: ChatAttachment[] = [],
    ): Promise<boolean> => {
      const prompt = rawPrompt.trim();
      if ((!prompt && attachments.length === 0) || !ready) {
        return false;
      }

      const fileParts = attachmentsToFileParts(attachments);
      const hasContent = prompt || fileParts.length > 0;
      if (!hasContent) {
        return false;
      }

      inFlightChatIdRef.current = chatId;

      setWasStoppedByUser(false);
      try {
        await sendMessage({
          text: prompt,
          files: fileParts,
        });
        return true;
      } catch {
        return false;
      }
    },
    [chatId, ready, sendMessage],
  );

  const handleSubmit = useCallback(
    async (event?: FormEvent<HTMLFormElement>): Promise<void> => {
      event?.preventDefault?.();

      const prompt = input.trim();
      const attachments = pendingAttachments;
      if ((!prompt && attachments.length === 0) || !ready) {
        return;
      }

      // Clear immediately so the input is empty as soon as the message is posted
      setInput("");
      setPendingAttachments([]);

      const hasSubmitted = await submitPrompt(prompt, attachments);
      if (!hasSubmitted) {
        // Restore input on failure so the user can retry
        setInput(prompt);
        setPendingAttachments(attachments);
      }
    },
    [input, pendingAttachments, ready, submitPrompt],
  );

  const setInputValue = useCallback((value: string) => {
    setInput(value);
  }, []);

  return {
    messages,
    input,
    isLoading,
    error: displayError,
    handleInputChange,
    handleSubmit,
    submitPrompt,
    addToolApprovalResponse,
    addAttachments,
    removePendingAttachment,
    pendingAttachments,
    ready,
    provider,
    model,
    sendMessage,
    stop: stopWithTracking,
    wasStoppedByUser: wasStoppedByUser && !isLoading,
    setMessages,
    setInputValue,
    clearError,
  };
}
