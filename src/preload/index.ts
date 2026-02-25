import { contextBridge } from "electron";
import { appApi } from "./api/app.api";
import { shellApi } from "./api/shell.api";
import { terminalApi } from "./api/terminal.api";
import { browserApi } from "./api/browser.api";
import { filePatchApi } from "./api/filePatch.api";

const api = {
  ...appApi,
  openFolderDialog: shellApi.openFolderDialog,
  runTerminal: terminalApi.runTerminal,
  getTerminalWorkspaceRoot: terminalApi.getTerminalWorkspaceRoot,
  applyFilePatch: filePatchApi.applyFilePatch,
  restoreFilePatchCheckpoint: filePatchApi.restoreCheckpoint,
  restoreFilePatchCheckpoints: filePatchApi.restoreCheckpoints,
  browserSetActiveChat: browserApi.setActiveChat,
  browserCloseWindow: browserApi.closeWindow,
  browserExecute: browserApi.execute,
  browserGetStatus: browserApi.getStatus,
  platform: process.platform,
};

contextBridge.exposeInMainWorld("alem", api);
