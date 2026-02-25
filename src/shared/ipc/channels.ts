/**
 * Canonical IPC channel names shared between main and preload.
 * Use these constants to avoid typos and keep contracts in sync.
 */

export const IPC_CHANNELS = {
  // App / settings / attachments
  GET_SETTINGS: "get-settings",
  SAVE_SETTINGS: "save-settings",
  GET_API_KEY: "get-api-key",
  SAVE_API_KEY: "save-api-key",
  GET_ALL_API_KEYS: "get-all-api-keys",
  SAVE_ATTACHMENT: "save-attachment",
  READ_ATTACHMENT: "read-attachment",
  OPEN_ATTACHMENT: "open-attachment",
  DELETE_ATTACHMENT: "delete-attachment",
  // Shell
  OPEN_FOLDER_DIALOG: "open-folder-dialog",
  // Terminal
  RUN_TERMINAL: "run-terminal",
  GET_TERMINAL_WORKSPACE_ROOT: "get-terminal-workspace-root",
  // File patch
  APPLY_FILE_PATCH: "apply-file-patch",
  RESTORE_FILE_PATCH_CHECKPOINT: "restore-file-patch-checkpoint",
  RESTORE_FILE_PATCH_CHECKPOINTS: "restore-file-patch-checkpoints",
  // Browser
  BROWSER_SET_ACTIVE_CHAT: "browser-set-active-chat",
  BROWSER_CLOSE_WINDOW: "browser-close-window",
  BROWSER_EXECUTE: "browser-execute",
  BROWSER_GET_STATUS: "browser-get-status",
} as const;
