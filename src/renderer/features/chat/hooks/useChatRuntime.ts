import { useQurtChat } from "@/hooks/useQurtChat";
import type { UIMessage } from "ai";

type UseChatRuntimeOptions = {
  chatId: string;
  initialMessages: UIMessage[];
  workspaceRoot?: string;
  onMessagesChange: (messages: UIMessage[], sourceChatId?: string) => Promise<void>;
};

export function useChatRuntime({
  chatId,
  initialMessages,
  workspaceRoot,
  onMessagesChange,
}: UseChatRuntimeOptions) {
  return useQurtChat({
    chatId,
    initialMessages,
    onMessagesChange,
    workspaceRoot,
  });
}
