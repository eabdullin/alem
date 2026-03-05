import { ipcMain, BrowserWindow, app, autoUpdater } from "electron";
import log from "../logger";
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
    log.info("Update: checking for updates");
    manualCheckPending = true;
    autoUpdater.checkForUpdates();
    return Promise.resolve({ ok: true });
  });

  ipcMain.handle(IPC_CHANNELS.APPLY_UPDATE, () => {
    log.info("Update: applying update, quitting and installing");
    autoUpdater.quitAndInstall();
    return Promise.resolve();
  });

  autoUpdater.on("update-not-available", () => {
    if (manualCheckPending) {
      log.info("Update: app is up to date");
      manualCheckPending = false;
      sendToRenderer(IPC_CHANNELS.UP_TO_DATE);
    }
  });
}

export function notifyUpdateReady(): void {
  log.info("Update: update ready, notifying renderer");
  manualCheckPending = false;
  sendToRenderer(IPC_CHANNELS.UPDATE_READY);
}
