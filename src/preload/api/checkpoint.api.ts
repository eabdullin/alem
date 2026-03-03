import { ipcRenderer } from "electron";

export const checkpointApi = {
  createCheckpoint: (payload: {
    workspaceRoot: string;
  }) =>
    ipcRenderer.invoke("create-checkpoint", payload) as Promise<{
      created: boolean;
      timestamp?: string;
    }>,
  listCheckpoints: (payload: { workspaceRoot: string }) =>
    ipcRenderer.invoke("list-checkpoints", payload) as Promise<string[]>,
  restoreCheckpoints: (payload: {
    workspaceRoot: string;
    timestamp: string;
  }) => ipcRenderer.invoke("restore-checkpoints", payload),
};
