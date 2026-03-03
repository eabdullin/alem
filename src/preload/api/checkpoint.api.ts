import { ipcRenderer } from "electron";

export const checkpointApi = {
  restoreCheckpoints: (payload: {
    workspaceRoot: string;
    checkpointIds: string[];
  }) => ipcRenderer.invoke("restore-checkpoints", payload),
};
