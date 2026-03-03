import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { chatService } from "@/services/chat-service";
import { useActiveChatStore } from "@/stores/useActiveChatStore";

type UseChatSessionOptions = {
  chatId: string;
  activeListId: string;
};

export function useChatSession({ chatId, activeListId }: UseChatSessionOptions) {
  const navigate = useNavigate();

  const redirectHome = useCallback(() => {
    navigate(
      activeListId ? `/?list=${encodeURIComponent(activeListId)}` : "/",
      { replace: true },
    );
  }, [activeListId, navigate]);

  useEffect(() => {
    if (!chatId) {
      redirectHome();
      return;
    }

    const { setActiveChat, setLoadingChat } = useActiveChatStore.getState();
    setActiveChat(null);
    setLoadingChat(true);

    let isMounted = true;
    chatService.getChat(chatId).then((existingChat) => {
      if (!isMounted) return;
      if (!existingChat) {
        redirectHome();
        return;
      }
      setActiveChat(existingChat);
      setLoadingChat(false);
    });

    return () => {
      isMounted = false;
    };
  }, [activeListId, chatId, redirectHome]);
}
