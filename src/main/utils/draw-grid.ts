/**
 * Draws a coordinate grid overlay on an image for agent mode.
 * Helps the AI reference pixel coordinates when issuing click_at actions.
 */

import {
  createCanvas,
  loadImage,
  type CanvasRenderingContext2D as NodeCanvasContext2D,
} from "canvas";

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

function drawLabel(
  ctx: NodeCanvasContext2D,
  text: string,
  x: number,
  y: number,
  g: Required<GridOptions>
): void {
  const m = ctx.measureText(text);
  const textW = Math.ceil(m.width);
  const ascent = m.actualBoundingBoxAscent ?? 10;
  const descent = m.actualBoundingBoxDescent ?? 4;
  const textH = Math.ceil(ascent + descent);

  ctx.save();
  ctx.fillStyle = g.labelBg;
  ctx.fillRect(x - 2, y - 2, textW + 6, textH + 6);

  ctx.fillStyle = g.labelColor;
  ctx.fillText(text, x + 1, y + 1);
  ctx.restore();
}

function drawGrid(
  ctx: NodeCanvasContext2D,
  w: number,
  h: number,
  g: Required<GridOptions>
): void {
  const step = Math.max(1, g.step | 0);
  const pad = 1;

  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = g.gridColor;
  ctx.font = g.font;
  ctx.textBaseline = "top";

  // Vertical lines + x labels
  for (let x = 0; x <= w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, h);
    ctx.stroke();

    drawLabel(ctx, `${x}`, x + pad, pad, g);
  }

  // Horizontal lines + y labels
  for (let y = 0; y <= h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
    ctx.stroke();

    drawLabel(ctx, `${y}`, pad, y + pad, g);
  }

  // Origin label
  drawLabel(ctx, "0,0", pad, pad, g);

  ctx.restore();
}

/**
 * Draws the source image onto a canvas and overlays a coordinate grid with labels.
 * @param dataUrl - Image as data URL (e.g. from Electron NativeImage.toDataURL()).
 * @param opts - Grid styling options.
 * @returns Data URL of the image with grid overlay.
 */
export async function drawImageWithGrid(
  dataUrl: string,
  opts: GridOptions = {}
): Promise<string> {
  const g = { ...DEFAULT_OPTS, ...opts };

  const img = await loadImage(dataUrl);
  const w = img.width;
  const h = img.height;

  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext("2d");

  // Draw original image
  ctx.drawImage(img, 0, 0, w, h);

  // Draw grid + labels
  drawGrid(ctx, w, h, g);

  return canvas.toDataURL("image/png");
}
