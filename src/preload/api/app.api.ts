import { ipcRenderer } from "electron";

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
};
