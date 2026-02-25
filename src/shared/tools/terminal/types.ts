/**
 * Terminal tool request/response types.
 * Shared between renderer (tool) and Electron main (terminal-runner).
 */

export interface TerminalRunRequest {
  /** Command as tokens, e.g. ["git", "status", "--porcelain"]. */
  command: string[];
  /** Allowlisted env vars only. */
  env?: Record<string, string>;
  /** Timeout hint; system enforces a cap. */
  timeout_ms?: number;
  /** Max output size (stdout + stderr). */
  max_output_bytes?: number;
  /** Network: default deny; if enabled, allowed_domains (future). */
  network?: { enabled: false } | { enabled: true; allowed_domains: string[] };
  /** Per-chat workspace root override; when set, used instead of global settings. */
  workspaceOverride?: string;
}

export type TerminalOutcome =
  | { type: "exit"; exit_code: number }
  | { type: "timeout" }
  | { type: "denied"; reason: string };

export interface TerminalRunResult {
  stdout: string;
  stderr: string;
  outcome: TerminalOutcome;
  duration_ms: number;
  truncated: boolean;
  artifacts?: Array<{ path: string; hash?: string }>;
}
