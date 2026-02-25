/**
 * File patch tool request/response types.
 * Shared between renderer (tool) and Electron main (file-patch-runner).
 */

export interface FilePatchRequest {
  /** Unified diff or strict patch DSL text. */
  patch: string;
  /** Optional: path -> sha256 hex. If provided, validated before patching; mismatch rejects that file. */
  base_hashes?: Record<string, string>;
  /** Per-chat workspace root override; when set, used instead of global default. */
  workspaceOverride?: string;
}

export interface RejectedOp {
  path: string;
  reason: string;
}

export interface FileChangeStats {
  path: string;
  additions: number;
  deletions: number;
}

export interface FilePatchResult {
  status: "ok" | "partial" | "error";
  files_changed: string[];
  rejected_ops: RejectedOp[];
  post_hashes: Record<string, string>;
  checkpoint_id?: string;
  /** Per-file diff preview and line stats for display. */
  diff_preview?: FileChangeStats[];
}
