/**
 * Centralized service for scoped tool approval policies.
 * - Evaluates whether a pending approval should auto-approve.
 * - Builds rule updates from user selection (once, chat-tool, chat-all, global-host).
 */

import type { ChatToolApprovalRule } from "@/types/tool-approval";

const BROWSER_TOOL_ID = "browser_control";

/**
 * Extract hostnames from browser tool input (open/navigate actions only).
 * Returns empty array if no URL actions or invalid input.
 * Uses exact hostname (no subdomain wildcard).
 */
export function extractBrowserHosts(input: unknown): string[] {
  if (input == null || typeof input !== "object" || !("actions" in input)) {
    return [];
  }
  const actions = (input as { actions: Array<{ action: string; url?: string }> })
    .actions;
  if (!Array.isArray(actions)) return [];

  const hosts: string[] = [];
  for (const a of actions) {
    const url = "url" in a && typeof a.url === "string" ? a.url : undefined;
    if (!url) continue;
    if (a.action !== "open" && a.action !== "navigate") continue;
    try {
      const u = new URL(url.startsWith("http") ? url : `https://${url}`);
      if (u.hostname) hosts.push(u.hostname);
    } catch {
      // skip invalid URLs
    }
  }
  return [...new Set(hosts)];
}

/**
 * Check if a pending tool approval should auto-approve based on policy.
 */
export function shouldAutoApprove(params: {
  toolName: string;
  input: unknown;
  chatId: string;
  chatRules: ChatToolApprovalRule | undefined;
  browserAllowedHosts: string[];
}): boolean {
  const {
    toolName,
    input,
    chatRules,
    browserAllowedHosts,
  } = params;

  // Chat-scoped: allow all tools
  if (chatRules?.scope === "all") {
    return true;
  }

  // Chat-scoped: allow specific tools
  if (chatRules?.scope === "tools" && chatRules.toolIds.includes(toolName)) {
    return true;
  }

  // Global browser host allowlist (only for browser_control with URL actions)
  if (toolName === BROWSER_TOOL_ID && browserAllowedHosts.length > 0) {
    const hosts = extractBrowserHosts(input);
    if (hosts.length === 0) return false; // no URL actions, domain rule doesn't apply
    return hosts.every((h) => browserAllowedHosts.includes(h));
  }

  return false;
}

/**
 * Merge a new tool into chat rules. Used when user selects "Allow this tool for this chat".
 */
export function addToolToChatRules(
  current: ChatToolApprovalRule | undefined,
  toolName: string,
): ChatToolApprovalRule {
  if (current?.scope === "all") return current;
  const existing = current?.scope === "tools" ? current.toolIds : [];
  const next = [...new Set([...existing, toolName])];
  return { scope: "tools", toolIds: next };
}

/**
 * Add a host to the global browser allowlist. Used when user selects "Allow this website globally".
 */
export function addHostToBrowserAllowlist(
  current: string[],
  host: string,
): string[] {
  const trimmed = host.trim().toLowerCase();
  if (!trimmed) return current;
  if (current.includes(trimmed)) return current;
  return [...current, trimmed];
}
