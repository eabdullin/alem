/**
 * Browser session controller for agent mode.
 * - One browser window per active chat; switching chats closes the previous window.
 * - Secure defaults: contextIsolation, nodeIntegration false, http/https only.
 * - Actions: open, navigate, click, type, press, scroll, wait, screenshot, close.
 * - Uses screenshots for page state; mouse clicks, scrolls, and typing for interaction.
 */

import type { WebContents } from "electron";
import { app, BrowserWindow } from "electron";
import path from "node:path";
import { injectGridOverlay, removeGridOverlay } from "../utils/draw-grid";
import type {
  BrowserAction,
  BrowserActionRequest,
  BrowserActionResult,
} from "../../shared/tools/browser/types";

const ALLOWED_SCHEMES = ["http:", "https:"];

function isUrlAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_SCHEMES.includes(parsed.protocol);
  } catch {
    return false;
  }
}

function getDistPath(): string {
  if (app.isPackaged) {
    return path.join(app.getAppPath(), "dist");
  }
  return path.join(__dirname, "../dist");
}

function getPublicPath(): string {
  if (app.isPackaged) {
    return getDistPath();
  }
  // In dev, use project root so public/icon.png resolves correctly
  return path.join(app.getAppPath(), "public");
}

/** Default page shown when opening the browser (minimal HTML). */
const DEFAULT_INDEX_HTML =
  "data:text/html;charset=utf-8," +
  encodeURIComponent(
    "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Qurt Browser</title></head>" +
      "<body style='font-family:system-ui;padding:2rem;background:#1a1a1a;color:#eee;'>" +
      "<h1>Qurt Browser</h1><p>Ready. Use navigate to go to a URL.</p></body></html>"
  );

function createBrowserWindow(): BrowserWindow {
  return new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    icon: path.join(getPublicPath(), "icon.png"),
    title: "Qurt Agent Browser",
    show: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
}

export class BrowserController {
  private activeChatId: string | null = null;
  private window: BrowserWindow | null = null;

  private ensureInputFocus(wc: WebContents): void {
    const win = BrowserWindow.fromWebContents(wc);
    if (!win || win.isDestroyed()) return;
    if (win.isMinimized()) win.restore();
    if (!win.isVisible()) win.show();
    win.focus();
    wc.focus();
  }

  private getViewportSize(wc: WebContents): { width: number; height: number } {
    const win = BrowserWindow.fromWebContents(wc);
    const bounds = win?.getContentBounds();
    return {
      width: Math.max(1, Math.floor(bounds?.width ?? 1200)),
      height: Math.max(1, Math.floor(bounds?.height ?? 800)),
    };
  }

  private clampPointToViewport(
    wc: WebContents,
    x: number,
    y: number
  ): { x: number; y: number } {
    const { width, height } = this.getViewportSize(wc);
    return {
      x: Math.min(width - 1, Math.max(0, Math.round(x))),
      y: Math.min(height - 1, Math.max(0, Math.round(y))),
    };
  }

  private async pause(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  setActiveChat(chatId: string | null): void {
    if (this.activeChatId !== chatId) {
      this.closeWindow();
      this.activeChatId = chatId;
    }
  }

  closeWindow(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.close();
      this.window = null;
    }
  }

  private ensureWindowForChat(chatId: string): BrowserWindow | null {
    if (this.activeChatId !== chatId) {
      return null;
    }
    if (this.window && !this.window.isDestroyed()) {
      return this.window;
    }
    this.window = createBrowserWindow();
    this.window.on("closed", () => {
      this.window = null;
    });
    this.window.loadURL(DEFAULT_INDEX_HTML);
    return this.window;
  }

  async execute(request: BrowserActionRequest): Promise<BrowserActionResult> {
    const { chatId, actions } = request;

    const hasClose = actions.some((a) => a.action === "close");
    if (hasClose) {
      if (this.activeChatId === chatId && this.window && !this.window.isDestroyed()) {
        this.closeWindow();
      }
      return { ok: true };
    }

    await this.pause(1000);

    const win = this.ensureWindowForChat(chatId);
    if (!win) {
      return {
        ok: false,
        error: "Browser window not available. Ensure you are on the correct chat.",
      };
    }

    const wc = win.webContents;
    let capturedText: string | undefined;

    try {
      for (const action of actions) {
        const result = await this.runAction(wc, action, (text) => {
          capturedText = text;
        });
        if (result) return result;
      }

      await injectGridOverlay(wc);
      const image = await wc.capturePage();
      await removeGridOverlay(wc);

      const viewport = this.getViewportSize(wc);
      const normalizedImage = image.resize({
        width: viewport.width,
        height: viewport.height,
        quality: "best",
      });

      return {
        ok: true,
        url: wc.getURL(),
        screenshot: normalizedImage.toDataURL(),
        ...(capturedText !== undefined && { text: capturedText }),
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: msg };
    }
  }

  private async runAction(
    wc: WebContents,
    action: BrowserAction,
    onGetContent?: (text: string) => void
  ): Promise<BrowserActionResult | null> {
    switch (action.action) {
      case "open": {
        await wc.loadURL(DEFAULT_INDEX_HTML);
        await this.pause(200);
        return null;
      }

      case "navigate": {
        if (!isUrlAllowed(action.url)) {
          return { ok: false, error: `URL scheme not allowed: ${action.url}` };
        }
        await wc.loadURL(action.url);
        await this.pause(1000);
        return null;
      }

      case "move_mouse": {
        this.ensureInputFocus(wc);
        const movePoint = this.clampPointToViewport(wc, action.x, action.y);
        wc.sendInputEvent({
          type: "mouseMove",
          x: movePoint.x,
          y: movePoint.y,
        });
        await this.pause(100);
        return null;
      }

      case "click": {
        this.ensureInputFocus(wc);
        const clickPoint = this.clampPointToViewport(wc, action.x, action.y);
        wc.sendInputEvent({
          type: "mouseDown",
          x: clickPoint.x,
          y: clickPoint.y,
          button: "left",
          clickCount: 1,
        });
        wc.sendInputEvent({
          type: "mouseUp",
          x: clickPoint.x,
          y: clickPoint.y,
          button: "left",
          clickCount: 1,
        });
        await this.pause(100);
        return null;
      }

      case "type": {
        this.ensureInputFocus(wc);
        const text = JSON.stringify(action.text);
        const result = await wc.executeJavaScript(`
          (function() {
            const el = document.activeElement;
            if (!el) {
              return { ok: false, error: "No focused input to type into. Use click first." };
            }
            if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
              el.focus();
              el.value = ${text};
              el.dispatchEvent(new Event("input", { bubbles: true }));
              el.dispatchEvent(new Event("change", { bubbles: true }));
              return { ok: true };
            }
            if (el.isContentEditable) {
              el.focus();
              el.textContent = ${text};
              el.dispatchEvent(new Event("input", { bubbles: true }));
              return { ok: true };
            }
            return { ok: false, error: "No focused input to type into. Use click first." };
          })()
        `);
        if (result?.ok === false) return result;
        await this.pause(100);
        return null;
      }

      case "press": {
        this.ensureInputFocus(wc);
        const keyCode = action.key;
        wc.sendInputEvent({ type: "keyDown", keyCode });
        if (keyCode.length === 1) {
          wc.sendInputEvent({ type: "char", keyCode });
        }
        wc.sendInputEvent({ type: "keyUp", keyCode });
        await this.pause(100);
        return null;
      }

      case "scroll": {
        this.ensureInputFocus(wc);
        const amount = action.amount ?? 500;
        const deltaY = action.direction === "down" ? amount : -amount;
        await wc.executeJavaScript(`
          window.scrollBy({ top: ${deltaY}, behavior: 'smooth' });
        `);
        await this.pause(500); // Wait for smooth scrolling to complete
        return null;
      }

      case "get_content": {
        const result = await wc.executeJavaScript(`
          (function() {
            try {
              const el = document.querySelector(${JSON.stringify(action.selector)});
              if (!el) return { ok: false, error: "No element found for selector: " + ${JSON.stringify(action.selector)} };
              const text = el.innerText || el.textContent || "";
              return { ok: true, text: text.trim() };
            } catch (e) {
              return { ok: false, error: String(e) };
            }
          })()
        `);
        if (result?.ok === false) return result;
        if (result?.text != null && onGetContent) onGetContent(result.text);
        return null;
      }

      case "wait": {
        const seconds = Math.min(Math.max(0, action.seconds), 60);
        await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
        return null;
      }

      default:
        return { ok: false, error: "Unknown action" };
    }
  }

  getStatus(): { activeChatId: string | null; hasWindow: boolean } {
    return {
      activeChatId: this.activeChatId,
      hasWindow: !!(this.window && !this.window.isDestroyed()),
    };
  }
}

export const browserController = new BrowserController();
