export interface QurtApi {
  getSettings: () => Promise<unknown>;
  saveSettings: (settings: unknown) => Promise<boolean>;
  getApiKey: (provider: string) => Promise<string>;
  saveApiKey: (provider: string, key: string) => Promise<boolean>;
  getAllApiKeys: () => Promise<Record<string, string>>;
  saveAttachment: (input: {
    name: string;
    mediaType?: string;
    dataBase64: string;
  }) => Promise<{
    id: string;
    name: string;
    mediaType: string;
    size: number;
    createdAt?: string;
  }>;
  readAttachment: (attachmentId: string) => Promise<string>;
  openAttachment: (attachmentId: string) => Promise<boolean>;
  deleteAttachment: (attachmentId: string) => Promise<boolean>;
  readCoreMemory: () => Promise<string>;
  appendConversation: (entry: {
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }) => Promise<void>;
  runMemoryCommand: (input: {
    command: "view" | "create" | "update" | "search";
    path?: string;
    content?: string;
    mode?: "append" | "overwrite";
    query?: string;
  }) => Promise<string>;
  runTerminal: (request: unknown) => Promise<unknown>;
  openFolderDialog: () => Promise<string | null>;
  openExternal: (url: string) => Promise<void>;
  applyFilePatch: (request: unknown) => Promise<unknown>;
  restoreFilePatchCheckpoint: (checkpointId: string) => Promise<{
    restored: boolean;
    error?: string;
  }>;
  restoreFilePatchCheckpoints: (checkpointIds: string[]) => Promise<{
    restored: boolean;
    error?: string;
  }>;
  browserSetActiveChat: (chatId: string | null) => Promise<void>;
  browserCloseWindow: () => Promise<void>;
  browserExecute: (request: unknown) => Promise<unknown>;
  browserGetStatus: () => Promise<{
    activeChatId: string | null;
    hasWindow: boolean;
  }>;
  checkForUpdates: () => Promise<{ ok: true } | { ok: false; reason: string }>;
  applyUpdate: () => Promise<void>;
  onUpdateReady: (callback: () => void) => () => void;
  onUpToDate: (callback: () => void) => () => void;
  platform: string;
}

declare global {
  interface Window {
    qurt?: QurtApi;
  }
}
