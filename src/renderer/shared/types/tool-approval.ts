/**
 * Types for scoped tool approval policies.
 * - Chat-scoped: stored per chat session (e.g. allow this tool / all tools for this chat).
 * - Global: stored in app settings (e.g. allow this browser host across all chats).
 */

/** Chat-scoped approval rule: allow specific tool(s) or all tools for this chat. */
export type ChatToolApprovalRule =
  | { scope: "all" }
  | { scope: "tools"; toolIds: string[] };

/** Global browser host allowlist: exact hostnames allowed across all chats. */
export type GlobalBrowserAllowedHosts = string[];
