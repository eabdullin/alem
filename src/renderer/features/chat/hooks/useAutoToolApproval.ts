import { useEffect, useRef } from "react";
import { useActiveChatStore } from "@/stores/useActiveChatStore";
import { useToolApprovalStore } from "@/stores/useToolApprovalStore";
import { useAppStore } from "@/stores/useAppStore";
import { shouldAutoApprove } from "@/services/tool-approval-service";
import { getToolPartName } from "@/lib/chat/messageParts";
import type { UIMessage } from "ai";

function isToolApprovalRequested(part: UIMessage["parts"][number]): boolean {
  if (!(part.type === "dynamic-tool" || part.type.startsWith("tool-"))) {
    return false;
  }
  return "state" in part && part.state === "approval-requested";
}

export function useAutoToolApproval({ messages }: { messages: UIMessage[] }) {
  const { activeChat, isLoadingChat } = useActiveChatStore();
  const { settings } = useAppStore();
  const sendAutoApproval = useToolApprovalStore((s) => s.sendAutoApproval);
  const autoApprovedIdsRef = useRef<Set<string>>(new Set());
  const chatId = activeChat?.id ?? "";

  useEffect(() => {
    autoApprovedIdsRef.current = new Set();
  }, [chatId]);

  const browserAllowedHosts = Array.isArray(settings?.browserAllowedHosts)
    ? settings.browserAllowedHosts
    : [];

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

        if (shouldAutoApprove({ toolName, input, chatId, chatRules, browserAllowedHosts })) {
          autoApprovedIdsRef.current.add(approval.id);
          sendAutoApproval(approval.id);
          return;
        }
      }
    }
  }, [messages, chatId, activeChat, isLoadingChat, browserAllowedHosts, sendAutoApproval]);
}
