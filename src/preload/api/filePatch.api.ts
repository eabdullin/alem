import { ipcRenderer } from "electron";

export const filePatchApi = {
  applyFilePatch: (request: unknown) =>
    ipcRenderer.invoke("apply-file-patch", request),
  restoreCheckpoint: (checkpointId: string) =>
    ipcRenderer.invoke("restore-file-patch-checkpoint", checkpointId),
  restoreCheckpoints: (checkpointIds: string[]) =>
    ipcRenderer.invoke("restore-file-patch-checkpoints", checkpointIds),
};
