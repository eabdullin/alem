import { contextBridge, ipcRenderer } from "electron";

export interface AlemApi {
  getSettings: () => Promise<any>;
  saveSettings: (settings: any) => Promise<boolean>;
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
  platform: string;
}

contextBridge.exposeInMainWorld("alem", {
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings: any) => ipcRenderer.invoke("save-settings", settings),
  getApiKey: (provider: string) => ipcRenderer.invoke("get-api-key", provider),
  saveApiKey: (provider: string, key: string) =>
    ipcRenderer.invoke("save-api-key", provider, key),
  getAllApiKeys: () => ipcRenderer.invoke("get-all-api-keys"),
  saveAttachment: (input) => ipcRenderer.invoke("save-attachment", input),
  readAttachment: (attachmentId: string) =>
    ipcRenderer.invoke("read-attachment", attachmentId),
  openAttachment: (attachmentId: string) =>
    ipcRenderer.invoke("open-attachment", attachmentId),
  deleteAttachment: (attachmentId: string) =>
    ipcRenderer.invoke("delete-attachment", attachmentId),
  runTerminal: (request: unknown) => ipcRenderer.invoke("run-terminal", request),
  getTerminalWorkspaceRoot: () =>
    ipcRenderer.invoke("get-terminal-workspace-root"),
  openFolderDialog: () => ipcRenderer.invoke("open-folder-dialog"),
  platform: process.platform,
} satisfies AlemApi);
