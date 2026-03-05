/**
 * Read-file tool request/response types.
 * Shared between renderer (tool) and Electron main (file-reader).
 */

export interface ReadFileRequest {
  /** Relative path from workspace root to the file to read. */
  path: string;
  /** Per-chat workspace root; required for read-file tool. */
  workspaceRoot: string;
}

export interface ReadFileResult {
  /** Extracted text content of the file. */
  content: string;
  /** The resolved relative path that was read. */
  path: string;
  /** Whether the content was truncated due to size limits. */
  truncated?: boolean;
  /** Detected format: "text", "pdf", "docx", "rtf". */
  format: string;
  /** Error message if read failed. */
  error?: string;
}
