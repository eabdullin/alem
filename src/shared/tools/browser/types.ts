/**
 * Browser control tool request/response types.
 * Shared between renderer (tool) and Electron main (browser-controller).
 * Uses screenshots, mouse clicks, scrolls, and typing for visual page interaction.
 * One atomic request = list of actions + always one screenshot in response.
 */

export type BrowserAction =
  | { action: "open" }
  | { action: "navigate"; url: string }
  | { action: "click"; x: number; y: number }
  | { action: "move_mouse"; x: number; y: number }
  | { action: "type"; text: string }
  | { action: "press"; key: string }
  | { action: "scroll"; direction: "up" | "down"; amount?: number }
  | { action: "get_content"; selector: string }
  | { action: "wait"; seconds: number }
  | { action: "close" };

export interface BrowserActionRequest {
  chatId: string;
  actions: BrowserAction[];
}

export type BrowserActionResult =
  | { ok: true; url?: string; text?: string; screenshot?: string }
  | { ok: false; error: string };

/** Tool input shape (actions + optional description for step label). */
export interface BrowserToolInput {
  description?: string;
  actions: BrowserAction[];
}
