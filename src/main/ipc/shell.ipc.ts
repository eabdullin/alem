import { BrowserWindow, dialog, ipcMain } from "electron";
import { getMainWindow } from "../windows/mainWindow";

export function registerShellIpc(): void {
  ipcMain.handle("open-folder-dialog", async () => {
    const win = BrowserWindow.getFocusedWindow() ?? getMainWindow();
    if (!win) return null;
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
      title: "Select workspace folder for terminal",
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });
}
