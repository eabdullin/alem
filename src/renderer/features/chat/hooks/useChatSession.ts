import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { chatService, type ChatSession } from "@/services/chat-service";

type UseChatSessionOptions = {
  chatId: string;
  activeListId: string;
};

export function useChatSession({ chatId, activeListId }: UseChatSessionOptions) {
  const navigate = useNavigate();
  const [chat, setChat] = useState<ChatSession | null>(null);
  const [isLoadingChat, setIsLoadingChat] = useState(true);

  const activeChat = chat?.id === chatId ? chat : null;

  const redirectHome = useCallback(() => {
    navigate(
      activeListId ? `/?list=${encodeURIComponent(activeListId)}` : "/",
      { replace: true },
    );
  }, [activeListId, navigate]);

  useEffect(() => {
    let isMounted = true;

    const loadChat = async () => {
      if (!chatId) {
        redirectHome();
        return;
      }

      setChat(null);
      setIsLoadingChat(true);
      const existingChat = await chatService.getChat(chatId);

      if (!isMounted) {
        return;
      }

      if (!existingChat) {
        redirectHome();
        return;
      }

      setChat(existingChat);
      setIsLoadingChat(false);
    };

    void loadChat();

    return () => {
      isMounted = false;
    };
  }, [activeListId, chatId, redirectHome]);

  const hasOpenFolderDialog =
    !!chatId &&
    typeof window !== "undefined" &&
    window.qurt &&
    typeof window.qurt.openFolderDialog === "function";

  const handleSelectWorkspaceFolder = hasOpenFolderDialog
    ? useCallback(async () => {
        const path = await window.qurt!.openFolderDialog();
        if (path && chatId) {
          const updated = await chatService.updateChat(chatId, {
            terminalWorkspacePath: path,
          });
          if (updated) setChat(updated);
        }
      }, [chatId])
    : undefined;

  return {
    chat,
    setChat,
    activeChat,
    isLoadingChat,
    handleSelectWorkspaceFolder,
  };
}
