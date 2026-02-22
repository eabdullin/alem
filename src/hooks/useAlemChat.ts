import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AlemContext } from "../App";
import {
  continueChatReply,
  generateChatReply,
  streamChatReply,
  type AiChatMessage,
  type AiProvider,
  type PendingApproval,
} from "../services/ai-service";
import type { ChatAttachment } from "../types/chat-attachment";
import type { PromptMode } from "../types/prompt-mode";

export interface ChatMessage extends AiChatMessage {
  id: string;
}

interface UseAlemChatOptions {
  chatId?: string;
  initialMessages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
  /** Per-chat workspace root for terminal tool; overrides global default when set. */
  terminalWorkspaceOverride?: string;
}

function createMessageId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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

export function useAlemChat({
  chatId,
  initialMessages = [],
  onMessagesChange,
  terminalWorkspaceOverride,
}: UseAlemChatOptions = {}) {
  const { settings } = useContext(AlemContext);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>(
    [],
  );
  const [promptMode, setPromptMode] = useState<PromptMode>("ask");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [pendingApproval, setPendingApproval] = useState<{
    messageId: string;
    pendingApprovals: PendingApproval[];
    continueMessages: unknown[];
  } | null>(null);

  const activeProvider = settings?.activeProvider;
  const provider: AiProvider =
    activeProvider === "openai" ||
    activeProvider === "anthropic" ||
    activeProvider === "google"
      ? activeProvider
      : "openai";

  const ready = typeof window !== "undefined" && !!window.alem;
  const model = settings?.activeModel || "gpt-5-mini-medium";
  const idPrefix = chatId || "chat";
  const messageSeed = useMemo(
    () =>
      initialMessages
        .map((message) => {
          const attachmentSeed = (message.attachments ?? [])
            .map((attachment) => `${attachment.id}:${attachment.name}:${attachment.size}`)
            .join(",");
          return `${message.id}:${message.role}:${message.content}:${message.reasoning ?? ""}:${attachmentSeed}`;
        })
        .join("|"),
    [initialMessages],
  );

  useEffect(() => {
    setMessages(initialMessages);
  }, [messageSeed]);

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

        setError(
          err instanceof Error ? err : new Error("Failed to attach one or more files."),
        );
        return;
      }

      setPendingAttachments((current) => [...current, ...nextAttachments]);
      setError(undefined);
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
      mode: PromptMode = "ask",
    ): Promise<boolean> => {
      const prompt = rawPrompt.trim();
      if ((!prompt && attachments.length === 0) || isLoading || !ready) {
        return false;
      }

      const userMessage: ChatMessage = {
        id: createMessageId(idPrefix),
        role: "user",
        content: prompt,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      onMessagesChange?.(nextMessages);
      setError(undefined);
      setIsLoading(true);

      const assistantId = createMessageId(idPrefix);
      const messagesForApi = nextMessages.map((message) => ({
        role: message.role,
        content: message.content,
        attachments: message.attachments,
      }));

      try {
        const apiKey = await window.alem.getApiKey(provider);

        if (mode === "agent") {
          const placeholder: ChatMessage = {
            id: assistantId,
            role: "assistant",
            content: "",
            chainSteps: [],
          };
          setMessages((prev) => [...prev, placeholder]);
          onMessagesChange?.([...nextMessages, placeholder]);

          const reply = await streamChatReply({
            provider,
            model,
            apiKey,
            mode,
            messages: messagesForApi,
            resolveAttachmentData: (attachment) =>
              window.alem.readAttachment(attachment.id),
            terminalWorkspaceOverride,
            onStepsUpdate(chainSteps) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, chainSteps: [...chainSteps] }
                    : m,
                ),
              );
            },
            onTextUpdate(text) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: text } : m,
                ),
              );
            },
          });

          const assistantMessage: ChatMessage = {
            id: assistantId,
            role: "assistant",
            content: reply.text,
            reasoning: reply.reasoning,
            chainSteps: reply.chainSteps ?? [],
          };
          setMessages((prev) => {
            const updated = prev.map((m) =>
              m.id === assistantId ? assistantMessage : m,
            );
            onMessagesChange?.(updated);
            return updated;
          });
          if (reply.pendingApprovals?.length && reply.continueMessages) {
            setPendingApproval({
              messageId: assistantId,
              pendingApprovals: reply.pendingApprovals,
              continueMessages: reply.continueMessages,
            });
          }
        } else {
          const reply = await generateChatReply({
            provider,
            model,
            apiKey,
            mode,
            messages: messagesForApi,
            resolveAttachmentData: (attachment) =>
              window.alem.readAttachment(attachment.id),
            terminalWorkspaceOverride,
          });

          const assistantMessage: ChatMessage = {
            id: assistantId,
            role: "assistant",
            content: reply.text,
            reasoning: reply.reasoning,
            chainSteps: reply.chainSteps,
          };
          const updatedMessages = [...nextMessages, assistantMessage];
          setMessages(updatedMessages);
          onMessagesChange?.(updatedMessages);
        }

        return true;
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to get a response from the model."),
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [idPrefix, isLoading, messages, model, onMessagesChange, provider, ready, terminalWorkspaceOverride],
  );

  const submitToolApproval = useCallback(
    async (approvalId: string, approved: boolean, reason?: string) => {
      if (!pendingApproval || !ready) return;
      setIsLoading(true);
      setError(undefined);
      try {
        if (!approved) {
          const approvalIndex = pendingApproval.pendingApprovals.findIndex(
            (p) => p.approvalId === approvalId,
          );
          if (approvalIndex >= 0) {
            setMessages((prev) => {
              const currentMessage = prev.find(
                (m) => m.id === pendingApproval.messageId,
              );
              const steps = currentMessage?.chainSteps ?? [];
              let toolStepIndex = -1;
              let count = 0;
              for (let i = 0; i < steps.length; i++) {
                const s = steps[i];
                if (s.type !== "tool") continue;
                if (s.output === undefined || s.output === null) {
                  if (count === approvalIndex) {
                    toolStepIndex = i;
                    break;
                  }
                  count++;
                }
              }
              if (toolStepIndex < 0) return prev;
              const deniedOutput = {
                stdout: "",
                stderr: reason?.trim() || "User rejected.",
                outcome: { type: "denied" as const, reason: "User rejected." },
                duration_ms: 0,
                truncated: false,
              };
              const nextSteps = steps.map((s, i) =>
                i === toolStepIndex && s.type === "tool"
                  ? { ...s, output: deniedOutput }
                  : s,
              );
              const assistantMessage: ChatMessage = {
                ...currentMessage!,
                id: pendingApproval.messageId,
                role: "assistant",
                content: currentMessage?.content ?? "",
                reasoning: currentMessage?.reasoning,
                chainSteps: nextSteps,
              };
              const updated = prev.map((m) =>
                m.id === pendingApproval.messageId ? assistantMessage : m,
              );
              onMessagesChange?.(updated);
              return updated;
            });
          }
        }

        const apiKey = await window.alem.getApiKey(provider);
        const reply = await continueChatReply({
          provider,
          model,
          apiKey,
          mode: "agent",
          messages: [],
          terminalWorkspaceOverride,
          continueMessages: pendingApproval.continueMessages as import("ai").ModelMessage[],
          approvalResponses: [{ approvalId, approved, reason }],
        });
        setMessages((prev) => {
          const currentMessage = prev.find((m) => m.id === pendingApproval.messageId);
          const existingSteps = currentMessage?.chainSteps ?? [];
          const newSteps = reply.chainSteps ?? [];
          const mergedSteps = [...existingSteps, ...newSteps];
          const assistantMessage: ChatMessage = {
            id: pendingApproval.messageId,
            role: "assistant",
            content: reply.text,
            reasoning: reply.reasoning,
            chainSteps: mergedSteps,
          };
          const updated = prev.map((m) =>
            m.id === pendingApproval.messageId ? assistantMessage : m,
          );
          onMessagesChange?.(updated);
          return updated;
        });
        if (reply.pendingApprovals?.length && reply.continueMessages) {
          setPendingApproval({
            messageId: pendingApproval.messageId,
            pendingApprovals: reply.pendingApprovals,
            continueMessages: reply.continueMessages,
          });
        } else {
          setPendingApproval(null);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to continue the run."),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [model, onMessagesChange, pendingApproval, provider, ready, terminalWorkspaceOverride],
  );

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    const hasSubmitted = await submitPrompt(input, pendingAttachments, promptMode);
    if (hasSubmitted) {
      setInput("");
      setPendingAttachments([]);
      setPromptMode("ask");
    }
  };

  return {
    messages,
    input,
    pendingAttachments,
    isLoading,
    error,
    handleInputChange,
    handleSubmit,
    submitPrompt,
    submitToolApproval,
    pendingApproval,
    addAttachments,
    removePendingAttachment,
    promptMode,
    setPromptMode,
    ready,
    provider,
    model,
  };
}
