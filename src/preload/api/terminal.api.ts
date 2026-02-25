import { ipcRenderer } from "electron";

export const terminalApi = {
  runTerminal: (request: unknown) => ipcRenderer.invoke("run-terminal", request),
  getTerminalWorkspaceRoot: () =>
    ipcRenderer.invoke("get-terminal-workspace-root"),
};
