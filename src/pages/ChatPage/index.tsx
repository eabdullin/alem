import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import Chat from "@/components/Chat";
import PromptInput from "@/components/PromptInput";
import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  Attachments,
  type AttachmentData,
} from "@/components/ai-elements/attachments";
import {
  Confirmation,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRequest,
} from "@/components/ai-elements/confirmation";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import {
  Message,
  MessageContent,
  MessageResponse,
  streamdownPlugins,
} from "@/components/ai-elements/message";
import { ToolOutput } from "@/components/ai-elements/tool";
import type { AiChainStep } from "@/services/ai-service";
import { getToolDefinition, getToolDisplay } from "@/tools";
import { Streamdown } from "streamdown";
import type { ConversationMessage } from "@/components/ai-elements/conversation";
import { type ChatMessage, useAlemChat } from "@/hooks/useAlemChat";
import type { ChatAttachment } from "@/types/chat-attachment";
import type { PromptMode } from "@/types/prompt-mode";
import {
  chatService,
  type ChatSession,
} from "@/services/chat-service";
import { resolveProviderModel } from "@/constants/providers";

type ChatPageLocationState = {
  initialPrompt?: string;
  initialAttachments?: ChatAttachment[];
  initialMode?: PromptMode;
};

const ChatPage = () => {
  const { chatId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [chat, setChat] = useState<ChatSession | null>(null);
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const [hideRightSidebar, setHideRightSidebar] = useState(false);
  const sentInitialPromptRef = useRef(false);

  const initialPrompt = useMemo(() => {
    const state = location.state as ChatPageLocationState | null;
    return state?.initialPrompt?.trim() || "";
  }, [location.state]);
  const initialAttachments = useMemo(() => {
    const state = location.state as ChatPageLocationState | null;
    return state?.initialAttachments ?? [];
  }, [location.state]);
  const initialMode = useMemo<PromptMode>(() => {
    const state = location.state as ChatPageLocationState | null;
    return state?.initialMode === "agent" ? "agent" : "ask";
  }, [location.state]);
  const activeListId = useMemo(
    () => new URLSearchParams(location.search).get("list")?.trim() || "",
    [location.search],
  );

  const initialMessages = chat?.messages ?? [];

  const handleMessagesChange = useCallback(
    async (messages: ChatMessage[]) => {
      if (!chatId || isLoadingChat) {
        return;
      }

      const updated = await chatService.saveMessages(chatId, messages);
      if (updated) {
        setChat(updated);
      }
    },
    [chatId, isLoadingChat],
  );

  const {
    messages,
    input,
    pendingAttachments,
    handleInputChange,
    handleSubmit,
    submitPrompt,
    addAttachments,
    removePendingAttachment,
    promptMode,
    setPromptMode,
    isLoading,
    error,
    provider,
    model,
    pendingApproval,
    submitToolApproval,
  } = useAlemChat({
    chatId,
    initialMessages,
    onMessagesChange: handleMessagesChange,
    terminalWorkspaceOverride: chat?.terminalWorkspacePath,
  });

  const isReasoningModel = useMemo(() => {
    const resolvedModel = resolveProviderModel(provider, model);
    return !!(
      resolvedModel.reasoningEffort ||
      resolvedModel.googleThinkingLevel ||
      resolvedModel.anthropicThinkingBudgetTokens
    );
  }, [model, provider]);

  const downloadableMessages = useMemo<ConversationMessage[]>(
    () =>
      messages.map((message) => {
        if (message.role !== "assistant") {
          return { content: message.content, role: message.role };
        }
        const hasChain = (message.chainSteps?.length ?? 0) > 0;
        const reasoningBlock =
          hasChain && message.chainSteps
            ? message.chainSteps
                .map((s) =>
                  s.type === "reasoning"
                    ? `Reasoning:\n${s.text}`
                    : `Tool ${s.toolName}:\n${JSON.stringify(s.input, null, 2)}${s.output != null ? `\nResult: ${JSON.stringify(s.output)}` : ""}`,
                )
                .join("\n\n")
            : (typeof message.reasoning === "string" && message.reasoning.trim())
              ? `Reasoning:\n${message.reasoning}`
              : "";
        return {
          content: reasoningBlock
            ? `${message.content}\n\n${reasoningBlock}`
            : message.content,
          role: message.role,
        };
      }),
    [messages],
  );

  const openAttachment = useCallback((attachmentId: string) => {
    if (!window.alem) {
      return;
    }

    void window.alem.openAttachment(attachmentId);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadChat = async () => {
      if (!chatId) {
        navigate(
          activeListId ? `/?list=${encodeURIComponent(activeListId)}` : "/",
          { replace: true },
        );
        return;
      }

      setIsLoadingChat(true);
      const existingChat = await chatService.getChat(chatId);

      if (!isMounted) {
        return;
      }

      if (!existingChat) {
        navigate(
          activeListId ? `/?list=${encodeURIComponent(activeListId)}` : "/",
          { replace: true },
        );
        return;
      }

      setChat(existingChat);
      setIsLoadingChat(false);
    };

    void loadChat();

    return () => {
      isMounted = false;
    };
  }, [activeListId, chatId, navigate]);

  useEffect(() => {
    if (
      !chat ||
      sentInitialPromptRef.current ||
      (!initialPrompt && initialAttachments.length === 0)
    ) {
      return;
    }

    if (chat.messages.length > 0) {
      sentInitialPromptRef.current = true;
      return;
    }

    sentInitialPromptRef.current = true;
    void submitPrompt(initialPrompt, initialAttachments, initialMode);
  }, [chat, initialAttachments, initialMode, initialPrompt, submitPrompt]);

  if (isLoadingChat) {
    return (
      <Layout>
        <div className="flex grow items-center justify-center px-10 md:px-4">
          <div className="base2 text-n-4/75">Loading chat...</div>
        </div>
      </Layout>
    );
  }

  if (!chat) {
    return null;
  }

  return (
    <Layout
      hideRightSidebar={hideRightSidebar}
      onToggleRightSidebar={() => setHideRightSidebar((prev) => !prev)}
    >
      <Chat
        chatId={chat.id}
        chatListIds={chat.chatListIds}
        downloadMessages={downloadableMessages}
        title={chat.title}
      >
        {messages.map((message) => {
          const attachmentItems: AttachmentData[] = (message.attachments ?? []).map(
            (attachment) => ({
              id: attachment.id,
              filename: attachment.name,
              mediaType: attachment.mediaType,
              type: "file",
              url: "",
            }),
          );

          if (message.role === "user") {
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
                          onClick={() => openAttachment(attachment.id)}
                        >
                          <AttachmentPreview />
                          <AttachmentInfo />
                        </Attachment>
                      ))}
                    </Attachments>
                  )}
                  {!!message.content && (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </MessageContent>
              </Message>
            );
          }

          return (
            <Message from="assistant" key={message.id}>
              <MessageContent className="max-w-[50rem] rounded-[1.25rem] bg-n-2 px-5 py-4 dark:bg-n-7">
                {(() => {
                  const steps = message.chainSteps?.length
                    ? message.chainSteps
                    : (typeof message.reasoning === "string" && message.reasoning.trim())
                      ? ([
                          {
                            type: "reasoning" as const,
                            text: message.reasoning,
                          },
                        ] as AiChainStep[])
                      : undefined;
                  const pendingList =
                    pendingApproval?.messageId === message.id
                      ? pendingApproval.pendingApprovals
                      : [];
                  let pendingToolIndex = 0;
                  return (
                    !!steps?.length && (
                      <ChainOfThought className="mb-2" defaultOpen={true}>
                        <ChainOfThoughtHeader className="text-n-4 hover:text-n-7 dark:text-n-4 dark:hover:text-n-1">
                          Thinking
                        </ChainOfThoughtHeader>
                        <ChainOfThoughtContent>
                          {steps.map((step, index) =>
                            step.type === "reasoning" ? (
                              <ChainOfThoughtStep
                                key={`reasoning-${index}`}
                                label="Reasoning"
                                status="complete"
                              >
                                <div className="text-muted-foreground text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                                  <Streamdown plugins={streamdownPlugins}>
                                    {step.text}
                                  </Streamdown>
                                </div>
                              </ChainOfThoughtStep>
                            ) : (() => {
                              const def = getToolDefinition(step.toolName);
                              const isPending =
                                pendingList.length > 0 &&
                                (step.output === undefined || step.output === null);
                              const approval =
                                isPending && pendingToolIndex < pendingList.length
                                  ? pendingList[pendingToolIndex++]
                                  : null;
                              return (
                                <ChainOfThoughtStep
                                  key={`tool-${index}-${step.toolName}`}
                                  icon={def?.stepIcon}
                                  label={
                                    def?.getStepLabel?.(step.input) ??
                                    step.toolName.replace(/_/g, " ")
                                  }
                                  status="complete"
                                >
                                  {isPending && approval ? (
                                    <Confirmation
                                      key={approval.approvalId}
                                      approval={{ id: approval.approvalId }}
                                      state="approval-requested"
                                      className="mb-3"
                                    >
                                      <ConfirmationRequest>
                                        <span className="text-sm">
                                          Allow{" "}
                                          <strong>
                                            {approval.toolName.replace(/_/g, " ")}
                                          </strong>
                                          ?
                                          {typeof approval.input === "object" &&
                                            approval.input !== null &&
                                            "command" in approval.input &&
                                            Array.isArray(
                                              (approval.input as { command?: string[] })
                                                .command
                                            ) && (
                                              <code className="ml-1 rounded bg-muted px-1 font-mono text-xs">
                                                {(
                                                  approval.input as {
                                                    command: string[];
                                                  }
                                                ).command.join(" ")}
                                              </code>
                                            )}
                                        </span>
                                      </ConfirmationRequest>
                                      <ConfirmationActions>
                                        <ConfirmationAction
                                          variant="outline"
                                          onClick={() =>
                                            submitToolApproval(
                                              approval.approvalId,
                                              false
                                            )
                                          }
                                        >
                                          Reject
                                        </ConfirmationAction>
                                        <ConfirmationAction
                                          variant="default"
                                          onClick={() =>
                                            submitToolApproval(
                                              approval.approvalId,
                                              true
                                            )
                                          }
                                        >
                                          Approve
                                        </ConfirmationAction>
                                      </ConfirmationActions>
                                    </Confirmation>
                                  ) : !isPending ? (
                                    (() => {
                                      const ToolDisplay = getToolDisplay(
                                        step.toolName,
                                      );
                                      if (ToolDisplay) {
                                        return (
                                          <ToolDisplay
                                            toolName={step.toolName}
                                            input={step.input}
                                            output={step.output}
                                            errorText={step.errorText}
                                          />
                                        );
                                      }
                                      return (
                                        <ToolOutput
                                          output={step.output}
                                          errorText={step.errorText}
                                        />
                                      );
                                    })()
                                  ) : null}
                                </ChainOfThoughtStep>
                              );
                            })()
                          )}
                        </ChainOfThoughtContent>
                      </ChainOfThought>
                    )
                  );
                })()}
                <MessageResponse>{message.content}</MessageResponse>
              </MessageContent>
            </Message>
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
      </Chat>
      <PromptInput
        value={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        attachments={pendingAttachments}
        onAddFiles={addAttachments}
        onRemoveAttachment={removePendingAttachment}
        mode={promptMode}
        onModeChange={setPromptMode}
        terminalWorkspacePath={chat?.terminalWorkspacePath}
        onSelectWorkspaceFolder={
          chatId && window.alem?.openFolderDialog
            ? async () => {
                const path = await window.alem.openFolderDialog();
                if (path && chatId) {
                  const updated = await chatService.updateChat(chatId, {
                    terminalWorkspacePath: path,
                  });
                  if (updated) setChat(updated);
                }
              }
            : undefined
        }
        placeholder="Ask anything"
      />
    </Layout>
  );
};

export default ChatPage;
