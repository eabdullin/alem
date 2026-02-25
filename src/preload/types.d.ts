export interface AlemApi {
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
  runTerminal: (request: unknown) => Promise<unknown>;
  getTerminalWorkspaceRoot: () => Promise<string>;
  openFolderDialog: () => Promise<string | null>;
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
  platform: string;
}

declare global {
  interface Window {
    alem?: AlemApi;
  }
}
