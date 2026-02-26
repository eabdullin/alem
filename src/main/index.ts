import { app, BrowserWindow } from "electron";
import { createMainWindow } from "./windows/mainWindow";
import { registerAllIpc } from "./ipc";
import { ensureMemoryFilesystem } from "./services/memoryStore";

app.whenReady().then(async () => {
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
