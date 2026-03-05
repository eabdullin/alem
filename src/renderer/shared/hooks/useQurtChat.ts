import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useChat } from "@ai-sdk/react";
import {
  lastAssistantMessageIsCompleteWithApprovalResponses,
  type UIMessage,
  ToolUIPart,
} from "ai";
import { useAppStore } from "@/stores/useAppStore";
import { useToolApprovalStore } from "@/stores/useToolApprovalStore";
import { useChatActionsStore } from "@/stores/useChatActionsStore";
import { getTextFromParts } from "@/lib/chat/messageParts";
import { createAgent } from "@/services/ai-service";
import { providerFactory } from "@/ai-providers/provider-factory";
import {
  QurtChatTransport,
  QURT_ATTACHMENT_PREFIX,
} from "@/services/qurt-chat-transport";
import type { ChatAttachment } from "@/types/chat-attachment";
import type { QurtUIMessage } from "@/types/ui-message";
import log from "@/logger";

interface UseQurtChatOptions {
  chatId?: string;
  initialMessages?: QurtUIMessage[];
  onMessagesChange?: (messages: QurtUIMessage[], sourceChatId?: string) => void;
  /** Per-chat workspace root for terminal and file-patch tools; required in agent mode. */
  workspaceRoot?: string;
}

function isToolApprovalRequested(part: UIMessage["parts"][number]): boolean {
  if (!(part.type === "dynamic-tool" || part.type.startsWith("tool-"))) {
    return false;
  }
  return "state" in part && part.state === "approval-requested";
}

function getPendingToolApproval(messages: UIMessage[]): ToolUIPart | null {
  const lastAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  if (!lastAssistantMessage) {
    return null;
  }
  return lastAssistantMessage.parts.find(isToolApprovalRequested) as ToolUIPart;
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
    url: `${QURT_ATTACHMENT_PREFIX}${a.id}`,
  }));
}

async function appendNewTurnsToMemory(
  messages: UIMessage[],
  lastLoggedRef: { current: number },
): Promise<void> {
  if (typeof window === "undefined" || !window.qurt?.appendConversation) {
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
      await window.qurt.appendConversation({
        role: msg.role,
        content,
        timestamp,
      });
    } catch (err) {
      log.warn("Memory: append failed", err);
    }
  }
  lastLoggedRef.current = to;
}

export function useQurtChat({
  chatId,
  initialMessages = [],
  onMessagesChange,
  workspaceRoot,
}: UseQurtChatOptions = {}) {
  const { settings } = useAppStore();
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

  const ready = typeof window !== "undefined" && !!window.qurt;
  const model = settings?.activeModel ?? "";
  const provider = useMemo(
    () => providerFactory.getProviderIdForModel(model) ?? "openai",
    [model],
  );

  const transport = useMemo(
    () =>
      new QurtChatTransport({
        getAgent: async () => {
          const modelProvider = providerFactory.getProviderIdForModel(model);
          if (!modelProvider) {
            throw new Error(
              `Model "${model}" is unavailable. Please choose a model in Settings.`,
            );
          }

          const apiKey = await window.qurt!.getApiKey(modelProvider);
          return createAgent({
            model,
            apiKey,
            toolConfig: {
              workspaceRoot: workspaceRootRef.current,
              browserChatId: chatIdRef.current ?? undefined,
              searchProviderId: settings?.activeSearchProvider ?? "duckduckgo-browser",
            },
          });
        },
        sendReasoning: true,
        resolveAttachment: (id) => window.qurt!.readAttachment(id),
      }),
    [model, settings?.activeSearchProvider],
  );

  const {
    messages: rawMessages,
    sendMessage,
    status,
    stop,
    error,
    setMessages: rawSetMessages,
    addToolApprovalResponse,
    clearError,
  } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
    sendAutomaticallyWhen: (options) => lastAssistantMessageIsCompleteWithApprovalResponses(options),
    onFinish: ({ messages: finishedMessages }) => {
      onMessagesChange?.(finishedMessages as QurtUIMessage[], inFlightChatIdRef.current);
      void appendNewTurnsToMemory(
        finishedMessages,
        lastLoggedMessageCountRef,
      );
    },
  });

  const messages = rawMessages as QurtUIMessage[];
  const setMessages = rawSetMessages as (messages: QurtUIMessage[]) => void;

  const isLoading = status === "streaming" || status === "submitted";
  const displayError = error ?? attachmentError;

  // Register addToolApprovalResponse so the approval store can call it directly
  useEffect(() => {
    const { registerAddApprovalResponse } = useToolApprovalStore.getState();
    registerAddApprovalResponse(addToolApprovalResponse);
    return () => registerAddApprovalResponse(null);
  }, [addToolApprovalResponse]);

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
          const attachment = await window.qurt.saveAttachment({
            name: file.name || "attachment",
            mediaType: file.type || "application/octet-stream",
            dataBase64,
          });
          nextAttachments.push(attachment);
        }
      } catch (err) {
        log.error("Attachments: upload failed", err);
        for (const attachment of nextAttachments) {
          try {
            await window.qurt.deleteAttachment(attachment.id);
          } catch (cleanupErr) {
            log.warn("Attachments: cleanup failed", cleanupErr);
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
      await window.qurt.deleteAttachment(attachmentId);
    } catch (err) {
      log.warn("Attachments: delete failed", attachmentId, err);
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
        const pendingToolApproval = getPendingToolApproval(messages);
        if (pendingToolApproval) {
          log.info("Pending tool approval found, rejecting it");
          await addToolApprovalResponse({
            id: pendingToolApproval.toolCallId,
            approved: false,
            reason: "Ignored by user: user submitted a new prompt while tool approvals were pending.",
          });
        }

        // Create a baseline checkpoint after the user message is posted.
        // Fire-and-forget — don't block the UI on backup I/O.
        const ws = workspaceRootRef.current?.trim();
        if (ws) {
          window.qurt?.createCheckpoint?.({ workspaceRoot: ws })
            .catch(() => { /* checkpoint is best-effort */ });
        }
        
        log.info("Chat: sending message", chatId);
        await sendMessage({
          text: prompt,
          files: fileParts,
          metadata: { createdAt: new Date().toISOString() },
        });

        return true;
      } catch (err) {
        log.error("Chat: send failed", err);
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

  // Register setMessages/setInputValue so other hooks can mutate chat state without prop drilling
  useEffect(() => {
    const { register, unregister } = useChatActionsStore.getState();
    // The store uses the untyped UIMessage[] interface; cast at the boundary.
    register({ setMessages: (msgs) => rawSetMessages(msgs as QurtUIMessage[]), setInputValue });
    return () => unregister();
  }, [rawSetMessages, setInputValue]);

  return {
    messages,
    input,
    isLoading,
    error: displayError,
    handleInputChange,
    handleSubmit,
    submitPrompt,
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
