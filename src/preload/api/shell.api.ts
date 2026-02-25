import { ipcRenderer } from "electron";

export const shellApi = {
  openFolderDialog: () => ipcRenderer.invoke("open-folder-dialog"),
};
