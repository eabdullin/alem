import { create } from "zustand";
import { useActiveChatStore } from "./useActiveChatStore";
import { useAppStore } from "./useAppStore";
import { toolApprovalStore } from "./tool-approval-store";
import {
  addToolToChatRules,
  extractBrowserHosts,
} from "@/services/tool-approval-service";

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

type AddApprovalResponseFn = (response: { id: string; approved: boolean }) => void;

interface ToolApprovalState {
  _addApprovalResponse: AddApprovalResponseFn | null;
  registerAddApprovalResponse: (fn: AddApprovalResponseFn | null) => void;
  respondToApproval: (params: ToolApprovalResponseParams) => void;
  sendAutoApproval: (approvalId: string) => void;
}

export const useToolApprovalStore = create<ToolApprovalState>()((set, get) => ({
  _addApprovalResponse: null,

  registerAddApprovalResponse: (fn) => set({ _addApprovalResponse: fn }),

  respondToApproval: (params) => {
    const { approvalId, scope, toolName, input } = params;
    const addFn = get()._addApprovalResponse;
    if (!addFn) return;

    if (scope === "reject") {
      addFn({ id: approvalId, approved: false });
      return;
    }

    if (scope === "once") {
      addFn({ id: approvalId, approved: true });
      return;
    }

    const { activeChat, setActiveChat } = useActiveChatStore.getState();
    const chatId = activeChat?.id;

    if (scope === "tool-chat" && chatId && activeChat) {
      addFn({ id: approvalId, approved: true });
      const next = addToolToChatRules(activeChat.toolApprovalRules, toolName);
      void toolApprovalStore.setChatRules(chatId, next).then((updated) => {
        if (updated) setActiveChat(updated);
      });
      return;
    }

    if (scope === "all-chat" && chatId && activeChat) {
      addFn({ id: approvalId, approved: true });
      void toolApprovalStore
        .setChatRules(chatId, { scope: "all" })
        .then((updated) => {
          if (updated) setActiveChat(updated);
        });
      return;
    }

    if (scope === "website-global") {
      addFn({ id: approvalId, approved: true });
      const hosts = extractBrowserHosts(input);
      const host = hosts[0];
      if (host) {
        const { settings, updateSettings } = useAppStore.getState();
        void toolApprovalStore.addBrowserAllowedHost(host).then((next) => {
          if (next) updateSettings({ ...settings, browserAllowedHosts: next });
        });
      }
      return;
    }

    addFn({ id: approvalId, approved: true });
  },

  sendAutoApproval: (approvalId) => {
    const addFn = get()._addApprovalResponse;
    if (!addFn) return;
    setTimeout(() => addFn({ id: approvalId, approved: true }), 0);
  },
}));
