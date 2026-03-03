/**
 * Checkpoint service – thin IPC wrappers around rdiff-backup.
 *
 * Timestamps are sourced directly from rdiff-backup's own increment records;
 * no separate metadata file is maintained.
 */

import type { UIMessage } from "ai";

// ── Helpers ──────────────────────────────────────────────────────────

export function getTextFromParts(parts: UIMessage["parts"]): string {
  return parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

/**
 * True when at least one message exists after `userMessageIndex`.
 */
export function canRestoreAtIndex(
  messages: UIMessage[],
  userMessageIndex: number,
): boolean {
  const msg = messages[userMessageIndex];
  if (!msg || msg.role !== "user") return false;
  return userMessageIndex < messages.length - 1;
}

// ── IPC wrappers ─────────────────────────────────────────────────────

/**
 * List all rdiff-backup checkpoint timestamps for a workspace.
 * Returns timestamps sorted ascending.
 */
export async function listCheckpoints(
  workspaceRoot: string,
): Promise<string[]> {
  if (!window.qurt?.listCheckpoints) return [];
  return window.qurt.listCheckpoints({ workspaceRoot });
}

/**
 * Create a new checkpoint for the workspace via IPC.
 * Used after user messages are sent (to establish a baseline).
 */
export async function createCheckpoint(
  workspaceRoot: string,
): Promise<{ created: boolean; timestamp?: string }> {
  if (!window.qurt?.createCheckpoint) {
    return { created: false };
  }
  return window.qurt.createCheckpoint({ workspaceRoot });
}

/**
 * Restore workspace to a specific checkpoint timestamp via IPC.
 */
export async function restoreCheckpoint(
  workspaceRoot: string,
  timestamp: string,
): Promise<{ restored: boolean; error?: string }> {
  if (!window.qurt?.restoreCheckpoints) {
    return { restored: false, error: "Restore is not available." };
  }
  return window.qurt.restoreCheckpoints({ workspaceRoot, timestamp });
}
