import type { ContentPart, ToolSet } from "ai";
import { tool, zodSchema } from "ai";
import { z } from "zod";
import type {
  BrowserAction,
  BrowserActionRequest,
  BrowserActionResult,
  BrowserToolInput,
} from "@/shared/tools/browser/types";

const browserActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("open").describe("Open browser (loads default page). No params."),
  }),
  z.object({
    action: z.literal("navigate"),
    url: z.string().url().describe("URL to navigate to (http/https only)."),
  }),
  z.object({
    action: z.literal("click").describe("Click at (x, y)."),
    x: z.number().min(0),
    y: z.number().min(0),
  }),
  z.object({
    action: z.literal("move_mouse").describe("Move mouse to (x, y)."),
    x: z.number().min(0),
    y: z.number().min(0),
  }),
  z.object({
    action: z.literal("type").describe("Type text into the focused element. Focus with click first."),
    text: z.string(),
  }),
  z.object({
    action: z.literal("press").describe("Press key with optional modifiers (e.g. Enter, Tab, Escape, Backspace)."),
    key: z.string(),
    modifiers: z
      .array(z.enum(["shift", "control", "alt", "meta"]))
      .optional()
      .describe("Modifier keys to hold (e.g. [\"control\"] for Ctrl+A)."),
  }),
  z.object({
    action: z.literal("scroll").describe("Scroll direction."),
    direction: z.enum(["up", "down"]),
    amount: z.number().min(1).max(2000).optional(),
  }),
  z.object({
    action: z.literal("get_content"),
    selector: z
      .string()
      .min(1)
      .describe("CSS selector for the element (e.g. '#main', '.article', 'h1')."),
  }),
  z.object({
    action: z.literal("wait"),
    seconds: z.number().min(0).max(60).describe("Seconds to pause (0–60)."),
  }),
  z.object({
    action: z.literal("refresh").describe("Reload the current page."),
  }),
  z.object({
    action: z.literal("close").describe("Close the browser window."),
  }),
]);

const browserToolInputSchema = z.object({
  description: z
    .string()
    .optional()
    .describe("Short label for this step (e.g. 'Search for milk')"),
  actions: z
    .array(browserActionSchema)
    .min(1)
    .max(20)
    .describe(
      "List of browser actions to run atomically. See tool description for flows.",
    ),
});

export type BrowserToolInputSchema = z.infer<typeof browserToolInputSchema>;

const description = `
Control a built-in browser window to navigate and interact with web pages. One window per chat.
Each call runs a list of actions atomically and returns one screenshot plus optional extracted text.

## Actions
- open — launch the browser (call once before anything else)
- navigate — load a URL (http/https only)
- click — click at (x, y)
- move_mouse — hover at (x, y) without clicking
- type — type text into the focused element (click to focus first)
- press — press a named key with optional modifiers: Enter, Tab, Escape, Backspace, ArrowUp/Down/Left/Right, etc. Use modifiers: ["control"] for Ctrl+A, ["control","shift"] for Ctrl+Shift+Z, etc.
- scroll — scroll up or down (default 300 px; use amount to override)
- get_content — extract inner text of a CSS selector (e.g. '#main', 'article', 'h1')
- wait — pause N seconds (0–60) for dynamic content to load
- refresh — reload the current page
- close — close the browser window

## Coordinates
- Screenshots include a 100 px grid overlay for accuracy.
- Origin (0, 0) is the top-left corner. Click near the visual center of an element.

## Tips
- Always wait after navigation or page transitions (≥ 2 s) before clicking or reading.
- Chain related actions in one call to reduce round-trips (e.g. navigate → wait → click).
- Use get_content to reliably read text without relying on screenshot OCR.
- For forms: click the input → type the text → press Enter (or click the submit button).
- If an element is off-screen, scroll toward it first, then click.
`;

export function getBrowserToolSet(
  options?: import("../types").ToolSetOptions
): ToolSet {
  const chatId = options?.browserChatId ?? "";
  return {
    browser_control: tool({
      description,
      inputSchema: zodSchema(browserToolInputSchema),
      needsApproval: true,
      execute: async (input): Promise<BrowserActionResult> => {
        if (typeof window === "undefined" || !window.qurt?.browserExecute) {
          return {
            ok: false,
            error: "Browser control is not available in this environment.",
          };
        }
        if (!chatId) {
          return {
            ok: false,
            error: "Chat context not available. Ensure you are in a chat.",
          };
        }
        const request: BrowserActionRequest = {
          chatId,
          actions: input.actions as BrowserAction[],
        };
        return window.qurt.browserExecute(request) as Promise<BrowserActionResult>;
      },
      toModelOutput({ output }){

        if (output === undefined) {
          return {
            type: 'error-text',
            value: 'No result from browser execute',
          };
        }
        
        if (output.ok === false){
          return {
            type: 'error-text',
            value: output.error,
          };
        }
        
        if (!output.screenshot) {
          return {
            type: 'error-text',
            value: 'No screenshot from browser execute',
          };
        }
        
        const match = output.screenshot.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) {
          return {
            type: 'error-text',
            value: 'Invalid screenshot format',
          };
        }
        const parts: Array<{ type: 'text'; text: string } | { type: 'image-data'; data: string; mediaType: string }> = [
          { type: 'text', text: `Current URL: ${output.url}` },
        ];
        if (output.text != null && output.text !== '') {
          parts.unshift({ type: 'text', text: `Extracted content:\n${output.text}` });
        }
        parts.push({ type: 'image-data', data: match[2], mediaType: 'image/png' });
        return { type: 'content', value: parts };
      },
    }),
  };
}
