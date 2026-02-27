/**
 * Store for tool approval policies.
 * - Chat-scoped rules: delegated to chat store.
 * - Global browser hosts: stored in app settings (electron-store).
 */

import { chatStore, type ChatSession } from "./chat-store";
import { addHostToBrowserAllowlist } from "@/services/tool-approval-service";
import type { ChatToolApprovalRule } from "@/types/tool-approval";

export interface ToolApprovalStore {
  getChatRules(chatId: string): Promise<ChatToolApprovalRule | undefined>;
  setChatRules(
    chatId: string,
    rules: ChatToolApprovalRule,
  ): Promise<ChatSession | null>;
  getBrowserAllowedHosts(): Promise<string[]>;
  addBrowserAllowedHost(host: string): Promise<string[]>;
}

async function getSettings(): Promise<Record<string, unknown>> {
  if (typeof window === "undefined" || !window.qurt?.getSettings) {
    return {};
  }
  return (await window.qurt.getSettings()) ?? {};
}

async function saveSettings(settings: Record<string, unknown>): Promise<void> {
  if (typeof window === "undefined" || !window.qurt?.saveSettings) {
    return;
  }
  await window.qurt.saveSettings(settings);
}

class ToolApprovalStoreImpl implements ToolApprovalStore {
  async getChatRules(chatId: string): Promise<ChatToolApprovalRule | undefined> {
    const chat = await chatStore.getChat(chatId);
    return chat?.toolApprovalRules;
  }

  async setChatRules(
    chatId: string,
    rules: ChatToolApprovalRule,
  ): Promise<ChatSession | null> {
    return chatStore.updateChat(chatId, { toolApprovalRules: rules });
  }

  async getBrowserAllowedHosts(): Promise<string[]> {
    const settings = await getSettings();
    const hosts = settings.browserAllowedHosts;
    return Array.isArray(hosts) ? (hosts as string[]) : [];
  }

  async addBrowserAllowedHost(host: string): Promise<string[]> {
    const settings = await getSettings();
    const current = Array.isArray(settings.browserAllowedHosts)
      ? (settings.browserAllowedHosts as string[])
      : [];
    const next = addHostToBrowserAllowlist(current, host);
    await saveSettings({ ...settings, browserAllowedHosts: next });
    return next;
  }
}

export const toolApprovalStore = new ToolApprovalStoreImpl();
