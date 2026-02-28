/**
 * Draws a coordinate grid overlay on a page for agent mode.
 * Injects a canvas element into the page via executeJavaScript,
 * so no native image libraries are needed.
 */

import type { WebContents } from "electron";

export interface GridOptions {
  /** Grid step in pixels. Default 100. */
  step?: number;
  /** Grid line color. Default "rgba(255,0,0,0.5)". */
  gridColor?: string;
  /** Font for coordinate labels. Default "12px sans-serif". */
  font?: string;
  /** Label background color. Default "rgba(255,255,255,0.9)". */
  labelBg?: string;
  /** Label text color. Default "#333". */
  labelColor?: string;
}

const DEFAULT_OPTS: Required<GridOptions> = {
  step: 100,
  gridColor: "rgba(255,0,0,0.5)",
  font: "12px sans-serif",
  labelBg: "rgba(255,255,255,0.9)",
  labelColor: "#333",
};

const OVERLAY_ID = "__qurt_grid_overlay";

/**
 * Injects a fixed-position canvas with a coordinate grid into the page.
 * The overlay is pointer-events:none and sits above all content.
 * Call {@link removeGridOverlay} after capturing the screenshot.
 */
export async function injectGridOverlay(
  wc: WebContents,
  opts: GridOptions = {}
): Promise<void> {
  const g = { ...DEFAULT_OPTS, ...opts };

  await wc.executeJavaScript(`
    (function() {
      var existing = document.getElementById('${OVERLAY_ID}');
      if (existing) existing.remove();

      var c = document.createElement('canvas');
      c.id = '${OVERLAY_ID}';
      c.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483647;pointer-events:none;';
      c.width = window.innerWidth;
      c.height = window.innerHeight;
      document.documentElement.appendChild(c);

      var ctx = c.getContext('2d');
      var w = c.width, h = c.height;
      var step = Math.max(1, ${g.step} | 0);

      ctx.lineWidth = 1;
      ctx.strokeStyle = '${g.gridColor}';
      ctx.font = '${g.font}';
      ctx.textBaseline = 'top';

      function label(text, x, y) {
        var m = ctx.measureText(text);
        var tw = Math.ceil(m.width);
        var asc = m.actualBoundingBoxAscent || 10;
        var desc = m.actualBoundingBoxDescent || 4;
        var th = Math.ceil(asc + desc);
        ctx.save();
        ctx.fillStyle = '${g.labelBg}';
        ctx.fillRect(x - 2, y - 2, tw + 6, th + 6);
        ctx.fillStyle = '${g.labelColor}';
        ctx.fillText(text, x + 1, y + 1);
        ctx.restore();
      }

      for (var x = 0; x <= w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, h);
        ctx.stroke();
        label(String(x), x + 1, 1);
      }

      for (var y = 0; y <= h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(w, y + 0.5);
        ctx.stroke();
        label(String(y), 1, y + 1);
      }

      label('0,0', 1, 1);
    })();
  `);
}

/** Removes the grid overlay injected by {@link injectGridOverlay}. */
export async function removeGridOverlay(wc: WebContents): Promise<void> {
  await wc.executeJavaScript(`
    (function() {
      var el = document.getElementById('${OVERLAY_ID}');
      if (el) el.remove();
    })();
  `);
}
