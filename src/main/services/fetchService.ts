/**
 * Fetch URL content via hidden BrowserWindow.
 * Uses Electron's Chromium to load the page and extract content.
 * Handles JS-rendered pages like DuckDuckGo search.
 */

import { BrowserWindow } from "electron";
import TurndownService from "turndown";
import log from "../logger";

const MAX_CONTENT_BYTES = 100 * 1024; // 100KB
const LOAD_TIMEOUT_MS = 15_000;

const turndown = new TurndownService();
turndown.remove([
  "script",
  "style",
  "noscript",
  "iframe",
  "svg" as keyof HTMLElementTagNameMap,
  "template",
]);

export interface FetchUrlResult {
  content: string;
  url: string;
  truncated?: boolean;
}

/** Script injected into the page to extract HTML after load. */
const EXTRACT_HTML_SCRIPT = `
(function() {
  return document.documentElement.outerHTML;
})();
`;

function createHiddenWindow(): BrowserWindow {
  return new BrowserWindow({
    show: false,
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
}

export async function fetchUrl(url: string): Promise<FetchUrlResult> {
  const parsed = new URL(url);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https URLs are allowed.");
  }

  const win = createHiddenWindow();
  const wc = win.webContents;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (!win.isDestroyed()) {
        win.close();
      }
      log.warn("Fetch: page load timed out", url);
      reject(new Error("Page load timed out. Try again."));
    }, LOAD_TIMEOUT_MS);

    win.on("closed", () => {
      clearTimeout(timeout);
    });

    wc.on("did-finish-load", async () => {
      try {
        clearTimeout(timeout);
        await new Promise((r) => setTimeout(r, 600));
        const raw = await wc.executeJavaScript(EXTRACT_HTML_SCRIPT);
        const html = typeof raw === "string" ? raw : String(raw ?? "");
        win.close();

        const encoder = new TextEncoder();
        const rawBytes = encoder.encode(html);
        let truncated = false;
        let toProcess = html;
        if (rawBytes.length > MAX_CONTENT_BYTES) {
          const decoder = new TextDecoder("utf-8", { fatal: false });
          toProcess = decoder.decode(rawBytes.slice(0, MAX_CONTENT_BYTES));
          truncated = true;
        }

        const content = turndown.turndown(toProcess);
        resolve({ content, url, truncated });
      } catch (e) {
        log.error("Fetch: content extraction failed", url, e);
        clearTimeout(timeout);
        win.close();
        reject(e);
      }
    });

    wc.loadURL(url).catch((err) => {
      log.error("Fetch: failed to load URL", url, err);
      clearTimeout(timeout);
      win.close();
      reject(err);
    });
  });
}
