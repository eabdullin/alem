import { GlobeIcon } from "lucide-react";
import type { ToolDefinition } from "../types";
import { getBrowserToolSet } from "./action";
import { BrowserToolDisplay, getConfirmationPreview } from "./display";

function getStepLabel(input: unknown): string {
  if (input != null && typeof input === "object") {
    const o = input as { description?: string; actions?: Array<{ action: string }> };
    const desc =
      typeof o.description === "string" ? o.description.trim() : "";
    if (desc) return desc;
    const actions = o.actions;
    if (Array.isArray(actions) && actions.length > 0) {
      const first = actions[0];
      const a = first as {
        action: string;
        url?: string;
        text?: string;
        x?: number;
        y?: number;
        direction?: string;
        seconds?: number;
      };
      switch (a.action) {
        case "open":
          return a.url ? `Open ${a.url}` : "Open browser";
        case "navigate":
          return a.url ? `Navigate to ${a.url}` : "Navigate";
        case "click_at":
          return `Click at (${a.x ?? 0}, ${a.y ?? 0})`;
        case "type":
          return a.text ? `Type "${a.text}"` : "Type";
        case "press":
          return "Press key";
        case "scroll":
          return `Scroll ${a.direction ?? "down"}`;
        case "wait":
          return `Wait ${a.seconds ?? 0}s`;
        case "close":
          return "Close browser";
        default:
          return "Browser action";
      }
    }
  }
  return "Browser control";
}

export const browserTool: ToolDefinition = {
  id: "browser",
  description:
    "Control a built-in browser window to navigate and interact with web pages. One window per chat.",
  displayToolIds: ["browser_control"],
  getToolSet: getBrowserToolSet,
  stepIcon: GlobeIcon,
  getStepLabel: (input) => getStepLabel(input),
  getConfirmationPreview,
  Display: BrowserToolDisplay,
};
