/// <reference types="vite/client" />

import type { ChatAttachment } from "./types/chat-attachment";

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
  runTerminal: (request: import("@/tools/terminal/types").TerminalRunRequest) => Promise<import("@/tools/terminal/types").TerminalRunResult>;
  getTerminalWorkspaceRoot: () => Promise<string>;
  openFolderDialog: () => Promise<string | null>;
  platform: string;
}

declare global {
  interface Window {
    alem: AlemApi;
  }
}

export {};
