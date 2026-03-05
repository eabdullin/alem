import { contextBridge } from "electron";
import { appApi } from "./api/app.api";
import { shellApi } from "./api/shell.api";
import { terminalApi } from "./api/terminal.api";
import { browserApi } from "./api/browser.api";
import { filePatchApi } from "./api/filePatch.api";
import { checkpointApi } from "./api/checkpoint.api";
import { searchApi } from "./api/search.api";
import { fetchApi } from "./api/fetch.api";
import { readFileApi } from "./api/readFile.api";

const api = {
  ...appApi,
  openFolderDialog: shellApi.openFolderDialog,
  openExternal: shellApi.openExternal,
  runTerminal: terminalApi.runTerminal,
  applyFilePatch: filePatchApi.applyFilePatch,
  createCheckpoint: checkpointApi.createCheckpoint,
  listCheckpoints: checkpointApi.listCheckpoints,
  restoreCheckpoints: checkpointApi.restoreCheckpoints,
  browserSetActiveChat: browserApi.setActiveChat,
  browserCloseWindow: browserApi.closeWindow,
  browserExecute: browserApi.execute,
  browserGetStatus: browserApi.getStatus,
  searchWeb: searchApi.searchWeb,
  fetchUrl: fetchApi.fetchUrl,
  readFile: readFileApi.readFile,
  platform: process.platform,
};

contextBridge.exposeInMainWorld("qurt", api);
