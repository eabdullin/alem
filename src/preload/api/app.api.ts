import { ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc/channels";

export type UpdateCheckResult = { ok: true } | { ok: false; reason: string };

export interface MemoryCommandInput {
  command: "view" | "create" | "update" | "search";
  path?: string;
  content?: string;
  mode?: "append" | "overwrite";
  query?: string;
}

export interface ConversationEntry {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export const appApi = {
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings: unknown) => ipcRenderer.invoke("save-settings", settings),
  getApiKey: (provider: string) => ipcRenderer.invoke("get-api-key", provider),
  saveApiKey: (provider: string, key: string) =>
    ipcRenderer.invoke("save-api-key", provider, key),
  getAllApiKeys: () => ipcRenderer.invoke("get-all-api-keys"),
  saveAttachment: (input: {
    name: string;
    mediaType?: string;
    dataBase64: string;
  }) => ipcRenderer.invoke("save-attachment", input),
  readAttachment: (attachmentId: string) =>
    ipcRenderer.invoke("read-attachment", attachmentId),
  openAttachment: (attachmentId: string) =>
    ipcRenderer.invoke("open-attachment", attachmentId),
  deleteAttachment: (attachmentId: string) =>
    ipcRenderer.invoke("delete-attachment", attachmentId),
  readCoreMemory: () =>
    ipcRenderer.invoke(IPC_CHANNELS.MEMORY_READ_CORE) as Promise<string>,
  appendConversation: (entry: ConversationEntry) =>
    ipcRenderer.invoke(IPC_CHANNELS.MEMORY_APPEND_CONVERSATION, entry) as Promise<void>,
  runMemoryCommand: (input: MemoryCommandInput) =>
    ipcRenderer.invoke(IPC_CHANNELS.MEMORY_RUN_COMMAND, input) as Promise<string>,
  checkForUpdates: () =>
    ipcRenderer.invoke(IPC_CHANNELS.CHECK_FOR_UPDATES) as Promise<UpdateCheckResult>,
  applyUpdate: () =>
    ipcRenderer.invoke(IPC_CHANNELS.APPLY_UPDATE) as Promise<void>,
  onUpdateReady: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on(IPC_CHANNELS.UPDATE_READY, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.UPDATE_READY, handler);
  },
  onUpToDate: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on(IPC_CHANNELS.UP_TO_DATE, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.UP_TO_DATE, handler);
  },
};
