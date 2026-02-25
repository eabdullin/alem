import { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import type { ChatAttachment } from "@/types/chat-attachment";

export type ChatPageLocationState = {
  initialPrompt?: string;
  initialAttachments?: ChatAttachment[];
};

export function useChatRouteState() {
  const { chatId = "" } = useParams();
  const location = useLocation();

  const initialPrompt = useMemo(() => {
    const state = location.state as ChatPageLocationState | null;
    return state?.initialPrompt?.trim() || "";
  }, [location.state]);

  const initialAttachments = useMemo(() => {
    const state = location.state as ChatPageLocationState | null;
    return state?.initialAttachments ?? [];
  }, [location.state]);

  const activeListId = useMemo(
    () => new URLSearchParams(location.search).get("list")?.trim() || "",
    [location.search],
  );

  return {
    chatId,
    activeListId,
    initialPrompt,
    initialAttachments,
  };
}
