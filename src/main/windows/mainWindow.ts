import { app, BrowserWindow } from "electron";
import path from "node:path";

let mainWindow: BrowserWindow | null = null;

function getDistPath(): string {
  if (app.isPackaged) {
    return path.join(app.getAppPath(), "dist");
  }
  return path.join(__dirname, "../../dist");
}

function getPublicPath(): string {
  return app.isPackaged
    ? getDistPath()
    : path.join(getDistPath(), "../public");
}

export function getPreloadPath(): string {
  return path.join(__dirname, "preload.js");
}

export async function createMainWindow(): Promise<BrowserWindow> {
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
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(getDistPath(), "index.html"));
  }

  return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
