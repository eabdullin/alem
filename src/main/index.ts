import { app, BrowserWindow } from "electron";
import { UpdateSourceType, updateElectronApp } from "update-electron-app";
import { createMainWindow } from "./windows/mainWindow";
import { registerAllIpc } from "./ipc";
import { ensureMemoryFilesystem } from "./services/memoryStore";

const GITHUB_REPOSITORY = "eabdullin/qurt";

function setupAutoUpdates(): void {
  if (!app.isPackaged) {
    return;
  }

  updateElectronApp({
    updateSource: {
      type: UpdateSourceType.ElectronPublicUpdateService,
      repo: GITHUB_REPOSITORY,
    },
    updateInterval: "1 hour",
  });
}

app.whenReady().then(async () => {
  setupAutoUpdates();
  await ensureMemoryFilesystem();
  registerAllIpc();
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
