/**
 * DuckDuckGo search via hidden BrowserWindow.
 * Uses Electron's Chromium to load DuckDuckGo and scrape DOM.
 * No cookie consent, simpler than Google. Based on html.duckduckgo.com structure.
 */

import { BrowserWindow } from "electron";
import { BaseSearchProvider } from "./base-search-provider";
import type { SearchResult } from "../../shared/search-providers/types";

const SEARCH_URL = "https://html.duckduckgo.com/html/";
const LOAD_TIMEOUT_MS = 15_000;

/** Scrape organic results. html.duckduckgo.com uses .result, .result__url; /l/?uddg= for redirects. */
const SCRAPE_SCRIPT = `
(function() {
  const results = [];
  const seen = new Set();
  const blocks = document.querySelectorAll('.result');
  for (const block of blocks) {
    const link = block.querySelector('a.result__url');
    if (!link || !link.href) continue;
    let url = link.href;
    try {
      const u = new URL(url);
      if (u.hostname.includes('duckduckgo') && u.pathname === '/l/' && u.searchParams.has('uddg')) {
        url = decodeURIComponent(u.searchParams.get('uddg') || url);
      }
    } catch (e) {}
    if (!url.startsWith('http') || url.includes('duckduckgo.com')) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    const titleEl = block.querySelector('.result__title, .result__a, h2 a');
    const title = titleEl ? titleEl.innerText.trim() : '';
    const snippetEl = block.querySelector('.result__snippet');
    const snippet = snippetEl ? snippetEl.innerText.trim() : '';
    if (url && title) {
      results.push({ url, title, snippet: snippet || undefined });
    }
    if (results.length >= 10) break;
  }
  return results;
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

export class DuckDuckGoBrowserSearchProvider extends BaseSearchProvider {
  readonly id = "duckduckgo-browser" as const;

  async executeSearch(query: string): Promise<SearchResult[]> {
    const win = createHiddenWindow();
    const wc = win.webContents;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!win.isDestroyed()) {
          win.close();
        }
        reject(new Error("DuckDuckGo search timed out. Try again or use another provider."));
      }, LOAD_TIMEOUT_MS);

      win.on("closed", () => {
        clearTimeout(timeout);
      });

      wc.on("did-finish-load", async () => {
        try {
          clearTimeout(timeout);
          await new Promise((r) => setTimeout(r, 600));
          const raw = await wc.executeJavaScript(SCRAPE_SCRIPT);
          const results: SearchResult[] = Array.isArray(raw)
            ? raw.map((r: { url: string; title?: string; snippet?: string }) => ({
                url: String(r?.url ?? ""),
                title: r?.title ? String(r.title) : undefined,
                snippet: r?.snippet ? String(r.snippet) : undefined,
              }))
            : [];
          win.close();
          resolve(results);
        } catch (e) {
          clearTimeout(timeout);
          win.close();
          reject(e);
        }
      });

      const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}`;
      wc.loadURL(url).catch((err) => {
        clearTimeout(timeout);
        win.close();
        reject(err);
      });
    });
  }
}
