import { ipcRenderer } from "electron";

export const filePatchApi = {
  applyFilePatch: (request: unknown) =>
    ipcRenderer.invoke("apply-file-patch", request),
};
