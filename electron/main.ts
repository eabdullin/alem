import { app, BrowserWindow, dialog, ipcMain } from "electron";
import fs from "node:fs";
import path from "node:path";
import { getStore } from "./store";
import { ElectronFileStore, type SaveAttachmentInput } from "./file-store";
import {
  getTerminalWorkspaceRoot,
  runTerminal,
  type TerminalRunRequest,
} from "./terminal-runner";

let mainWindow: BrowserWindow | null = null;

function getDistPath() {
  return path.join(__dirname, "../dist");
}

function getPublicPath() {
  return app.isPackaged
    ? getDistPath()
    : path.join(getDistPath(), "../public");
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(getPublicPath(), "icon.png"),
    title: "Alem",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    ...(process.platform === "darwin"
      ? { trafficLightPosition: { x: 16, y: 16 } }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Remove the default application menu (File/Edit/etc.)
  // mainWindow.removeMenu();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(getDistPath(), "index.html"));
  }
}

function setupIpc() {
  const store = getStore();
  const fileStore = new ElectronFileStore(store);

  ipcMain.handle("get-settings", () => {
    return store.get("settings", {
      providers: {},
      activeProvider: "openai",
      activeModel: "gpt-5-mini",
      theme: "dark",
    });
  });

  ipcMain.handle("save-settings", (_event, settings) => {
    store.set("settings", settings);
    return true;
  });

  ipcMain.handle("get-api-key", (_event, provider: string) => {
    const keys = store.get("apiKeys", {}) as Record<string, string>;
    return keys[provider] || "";
  });

  ipcMain.handle("save-api-key", (_event, provider: string, key: string) => {
    const keys = store.get("apiKeys", {}) as Record<string, string>;
    keys[provider] = key;
    store.set("apiKeys", keys);
    return true;
  });

  ipcMain.handle("get-all-api-keys", () => {
    return store.get("apiKeys", {});
  });

  ipcMain.handle("save-attachment", (_event, input: SaveAttachmentInput) => {
    return fileStore.saveAttachment(input);
  });

  ipcMain.handle("read-attachment", (_event, attachmentId: string) => {
    return fileStore.readAttachment(attachmentId);
  });

  ipcMain.handle("open-attachment", (_event, attachmentId: string) => {
    return fileStore.openAttachment(attachmentId);
  });

  ipcMain.handle("delete-attachment", (_event, attachmentId: string) => {
    return fileStore.deleteAttachment(attachmentId);
  });

  ipcMain.handle("get-terminal-workspace-root", () => {
    const s = store.get("settings", {}) as Record<string, unknown> & {
      terminalWorkspaceRoot?: string;
    };
    return getTerminalWorkspaceRoot(s) || app.getPath("documents");
  });

  ipcMain.handle(
    "run-terminal",
    async (
      _event,
      request: TerminalRunRequest
    ): Promise<
      import("./terminal-runner").TerminalRunResult
    > => {
      const s = store.get("settings", {}) as Record<string, unknown> & {
        terminalWorkspaceRoot?: string;
      };
      let root: string;
      const override = request.workspaceOverride?.trim();
      if (override) {
        try {
          const resolved = path.resolve(override);
          if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
            root = resolved;
          } else {
            root = getTerminalWorkspaceRoot(s) || app.getPath("documents");
          }
        } catch {
          root = getTerminalWorkspaceRoot(s) || app.getPath("documents");
        }
      } else {
        root = getTerminalWorkspaceRoot(s) || app.getPath("documents");
      }
      return runTerminal({ request, workspaceRoot: root });
    }
  );

  ipcMain.handle("open-folder-dialog", async () => {
    const win = BrowserWindow.getFocusedWindow() ?? mainWindow;
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

app.whenReady().then(async () => {
  setupIpc();
  await createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
