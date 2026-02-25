/// <reference types="vite/client" />

import type { ChatAttachment } from "./renderer/shared/types/chat-attachment";

interface AlemApi {
  getSettings: () => Promise<any>;
  saveSettings: (settings: any) => Promise<boolean>;
  getApiKey: (provider: string) => Promise<string>;
  saveApiKey: (provider: string, key: string) => Promise<boolean>;
  getAllApiKeys: () => Promise<Record<string, string>>;
  saveAttachment: (input: {
    name: string;
    mediaType?: string;
    dataBase64: string;
  }) => Promise<ChatAttachment>;
  readAttachment: (attachmentId: string) => Promise<string>;
  openAttachment: (attachmentId: string) => Promise<boolean>;
  deleteAttachment: (attachmentId: string) => Promise<boolean>;
  runTerminal: (request: import("@/shared/tools/terminal/types").TerminalRunRequest) => Promise<import("@/shared/tools/terminal/types").TerminalRunResult>;
  getTerminalWorkspaceRoot: () => Promise<string>;
  openFolderDialog: () => Promise<string | null>;
  applyFilePatch: (request: import("@/shared/tools/file-patch/types").FilePatchRequest) => Promise<import("@/shared/tools/file-patch/types").FilePatchResult>;
  restoreFilePatchCheckpoint: (checkpointId: string) => Promise<{ restored: boolean; error?: string }>;
  restoreFilePatchCheckpoints: (checkpointIds: string[]) => Promise<{ restored: boolean; error?: string }>;
  browserSetActiveChat: (chatId: string | null) => Promise<void>;
  browserCloseWindow: () => Promise<void>;
  browserExecute: (request: import("@/shared/tools/browser/types").BrowserActionRequest) => Promise<import("@/shared/tools/browser/types").BrowserActionResult>;
  browserGetStatus: () => Promise<{ activeChatId: string | null; hasWindow: boolean }>;
  platform: string;
}

declare global {
  interface Window {
    alem: AlemApi;
  }
}

export {};
