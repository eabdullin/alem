import type { ContentPart, ToolSet } from "ai";
import { tool, zodSchema } from "ai";
import { z } from "zod";
import type { AiProvider } from "../types";
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
    action: z.literal("press").describe("Press key (e.g. Enter, Tab, Escape)."),
    key: z.string(),
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
Each request runs a list of actions atomically and returns one screenshot plus optional text.

## Usage tips
**Wait times**
- After navigate: wait 2–3s for heavy pages before interacting.
- After scroll: wait 0.5–1s for smooth scroll to finish.
- After click: wait 0.2–0.5s before type or next action.
- For SPAs/dynamic content: wait 1–3s after navigation.

**Common flows**
1. Search: open → navigate(url) → wait(2) → click(searchBox) → wait(0.5) → type(query) → press(Enter) → wait(2).
2. Hover-then-scroll: move_mouse(x,y) → wait(0.3) → scroll(down) — some dropdowns/menus need hover before scroll.
3. Form fill: click(input) → type(value) → press(Tab) → type(next) → … → click(submit).
4. Extract text: get_content(selector) — use after page loads; selector by visible text or aria-label.

**Coordinates**
- Screenshots include a 100px grid for better accuracy.
- Origin (0,0) is top-left. Click near element center for best results.
`;

export function getBrowserToolSet(
  _provider: AiProvider,
  _apiKey: string,
  options?: import("../types").ToolSetOptions
): ToolSet {
  const chatId = options?.browserChatId ?? "";
  return {
    browser_control: tool({
      description,
      inputSchema: zodSchema(browserToolInputSchema),
      needsApproval: true,
      execute: async (input): Promise<BrowserActionResult> => {
        if (typeof window === "undefined" || !window.alem?.browserExecute) {
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
        return window.alem.browserExecute(request) as Promise<BrowserActionResult>;
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
