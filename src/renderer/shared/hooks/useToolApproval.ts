import { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { AlemContext } from "@/App";
import { toolApprovalStore } from "@/stores/tool-approval-store";
import {
  shouldAutoApprove,
  addToolToChatRules,
  extractBrowserHosts,
} from "@/services/tool-approval-service";
import { getToolPartName } from "@/features/chat";
import type { ChatSession } from "@/services/chat-service";
import type { UIMessage } from "ai";

export type ToolApprovalScope =
  | "reject"
  | "once"
  | "tool-chat"
  | "all-chat"
  | "website-global";

export type ToolApprovalResponseParams = {
  approvalId: string;
  scope: ToolApprovalScope;
  toolName: string;
  input: unknown;
};

function isToolApprovalRequested(part: UIMessage["parts"][number]): boolean {
  if (!(part.type === "dynamic-tool" || part.type.startsWith("tool-"))) {
    return false;
  }
  return "state" in part && part.state === "approval-requested";
}

type UseToolApprovalOptions = {
  chatId: string;
  messages: UIMessage[];
  activeChat: ChatSession | null;
  isLoadingChat: boolean;
  addToolApprovalResponse: (response: { id: string; approved: boolean }) => void;
  setChat: (chat: ChatSession | null) => void;
};

export function useToolApproval({
  chatId,
  messages,
  activeChat,
  isLoadingChat,
  addToolApprovalResponse,
  setChat,
}: UseToolApprovalOptions) {
  const { settings, updateSettings } = useContext(AlemContext);
  const autoApprovedIdsRef = useRef<Set<string>>(new Set());

  const browserAllowedHosts = useMemo(
    () =>
      Array.isArray(settings?.browserAllowedHosts)
        ? settings.browserAllowedHosts
        : [],
    [settings?.browserAllowedHosts],
  );

  const handleToolApprovalResponse = useCallback(
    (params: ToolApprovalResponseParams) => {
      const { approvalId, scope, toolName, input } = params;

      if (scope === "reject") {
        addToolApprovalResponse({ id: approvalId, approved: false });
        return;
      }

      if (scope === "once") {
        addToolApprovalResponse({ id: approvalId, approved: true });
        return;
      }

      if (scope === "tool-chat" && chatId && activeChat) {
        addToolApprovalResponse({ id: approvalId, approved: true });
        const next = addToolToChatRules(
          activeChat.toolApprovalRules,
          toolName,
        );
        void toolApprovalStore.setChatRules(chatId, next).then((updated) => {
          if (updated) setChat(updated);
        });
        return;
      }

      if (scope === "all-chat" && chatId && activeChat) {
        addToolApprovalResponse({ id: approvalId, approved: true });
        void toolApprovalStore
          .setChatRules(chatId, { scope: "all" })
          .then((updated) => {
            if (updated) setChat(updated);
          });
        return;
      }

      if (scope === "website-global") {
        addToolApprovalResponse({ id: approvalId, approved: true });
        const hosts = extractBrowserHosts(input);
        const host = hosts[0];
        if (host) {
          void toolApprovalStore.addBrowserAllowedHost(host).then((next) => {
            if (next) updateSettings({ ...settings, browserAllowedHosts: next });
          });
        }
        return;
      }

      addToolApprovalResponse({ id: approvalId, approved: true });
    },
    [
      addToolApprovalResponse,
      activeChat,
      browserAllowedHosts,
      chatId,
      setChat,
      settings,
      updateSettings,
    ],
  );

  useEffect(() => {
    if (!chatId || !activeChat || isLoadingChat) return;

    const chatRules = activeChat.toolApprovalRules;

    for (const msg of messages) {
      if (msg.role !== "assistant") continue;
      for (const part of msg.parts) {
        if (!isToolApprovalRequested(part)) continue;
        const approval = "approval" in part ? part.approval : undefined;
        if (!approval?.id) continue;
        if (autoApprovedIdsRef.current.has(approval.id)) continue;

        const toolName = getToolPartName(part);
        const input = "input" in part ? part.input : {};

        if (
          shouldAutoApprove({
            toolName,
            input,
            chatId,
            chatRules,
            browserAllowedHosts,
          })
        ) {
          autoApprovedIdsRef.current.add(approval.id);
          const id = approval.id;
          setTimeout(() => addToolApprovalResponse({ id, approved: true }), 0);
          return;
        }
      }
    }
  }, [
    messages,
    chatId,
    activeChat,
    isLoadingChat,
    browserAllowedHosts,
    addToolApprovalResponse,
  ]);

  return handleToolApprovalResponse;
}
