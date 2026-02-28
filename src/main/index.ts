/// <reference types="@electron-forge/plugin-vite/forge-vite-env" />
import { app, BrowserWindow } from "electron";
import squirrelStartup from "electron-squirrel-startup";
import { UpdateSourceType, updateElectronApp } from "update-electron-app";

if (squirrelStartup) app.quit();
import { createMainWindow, getMainWindow } from "./windows/mainWindow";
import { registerAllIpc } from "./ipc";
import { ensureMemoryFilesystem } from "./services/memoryStore";
import { notifyUpdateReady, setMainWindowGetter } from "./ipc/update.ipc";

const GITHUB_REPOSITORY = "qurtai/qurt";

function setupAutoUpdates(): void {
  if (!app.isPackaged) {
    return;
  }

  setMainWindowGetter(() => getMainWindow());

  updateElectronApp({
    updateSource: {
      type: UpdateSourceType.ElectronPublicUpdateService,
      repo: GITHUB_REPOSITORY,
    },
    updateInterval: "24 hours",
    notifyUser: true,
    onNotifyUser: () => {
      notifyUpdateReady();
    },
  });
}

app.whenReady().then(async () => {
  await ensureMemoryFilesystem();
  registerAllIpc();
  setupAutoUpdates();
  await createMainWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
