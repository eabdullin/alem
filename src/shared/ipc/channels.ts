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
  // File patch
  APPLY_FILE_PATCH: "apply-file-patch",
  RESTORE_FILE_PATCH_CHECKPOINT: "restore-file-patch-checkpoint",
  RESTORE_FILE_PATCH_CHECKPOINTS: "restore-file-patch-checkpoints",
  // Browser
  BROWSER_SET_ACTIVE_CHAT: "browser-set-active-chat",
  BROWSER_CLOSE_WINDOW: "browser-close-window",
  BROWSER_EXECUTE: "browser-execute",
  BROWSER_GET_STATUS: "browser-get-status",
  // Memory
  MEMORY_READ_CORE: "memory-read-core",
  MEMORY_APPEND_CONVERSATION: "memory-append-conversation",
  MEMORY_RUN_COMMAND: "memory-run-command",
  // Updates
  CHECK_FOR_UPDATES: "check-for-updates",
  APPLY_UPDATE: "apply-update",
  UPDATE_READY: "update-ready",
  UP_TO_DATE: "up-to-date",
} as const;
