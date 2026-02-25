import { ipcRenderer } from "electron";

export const browserApi = {
  setActiveChat: (chatId: string | null) =>
    ipcRenderer.invoke("browser-set-active-chat", chatId),
  closeWindow: () => ipcRenderer.invoke("browser-close-window"),
  execute: (request: unknown) => ipcRenderer.invoke("browser-execute", request),
  getStatus: () => ipcRenderer.invoke("browser-get-status"),
};
