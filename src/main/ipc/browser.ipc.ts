import { ipcMain } from "electron";
import { browserController } from "../services/browserController";
import type { BrowserActionRequest } from "../../shared/tools/browser/types";

export function registerBrowserIpc(): void {
  ipcMain.handle("browser-set-active-chat", (_event, chatId: string | null) => {
    browserController.setActiveChat(chatId ?? null);
    return undefined;
  });

  ipcMain.handle("browser-close-window", () => {
    browserController.closeWindow();
    return undefined;
  });

  ipcMain.handle("browser-execute", async (_event, request: BrowserActionRequest) => {
    return browserController.execute(request);
  });

  ipcMain.handle("browser-get-status", () => {
    return browserController.getStatus();
  });
}
