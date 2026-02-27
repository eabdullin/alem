import { ipcMain, BrowserWindow, app, autoUpdater } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc/channels";

let manualCheckPending = false;
let mainWindowGetter: () => BrowserWindow | null = () => null;

export function setMainWindowGetter(getter: () => BrowserWindow | null): void {
  mainWindowGetter = getter;
}

function sendToRenderer(channel: string, ...args: unknown[]): void {
  const win = mainWindowGetter();
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, ...args);
  }
}

export function registerUpdateIpc(): void {
  ipcMain.handle(IPC_CHANNELS.CHECK_FOR_UPDATES, () => {
    if (!app.isPackaged) {
      return Promise.resolve({ ok: false, reason: "dev" });
    }
    manualCheckPending = true;
    autoUpdater.checkForUpdates();
    return Promise.resolve({ ok: true });
  });

  ipcMain.handle(IPC_CHANNELS.APPLY_UPDATE, () => {
    autoUpdater.quitAndInstall();
    return Promise.resolve();
  });

  autoUpdater.on("update-not-available", () => {
    if (manualCheckPending) {
      manualCheckPending = false;
      sendToRenderer(IPC_CHANNELS.UP_TO_DATE);
    }
  });
}

export function notifyUpdateReady(): void {
  manualCheckPending = false;
  sendToRenderer(IPC_CHANNELS.UPDATE_READY);
}
