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
  z.object({ action: z.literal("open"), url: z.string().url().optional() }),
  z.object({ action: z.literal("navigate"), url: z.string().url() }),
  z.object({
    action: z.literal("click_at"),
    x: z.number().min(0),
    y: z.number().min(0),
  }),
  z.object({ action: z.literal("type"), text: z.string() }),
  z.object({ action: z.literal("press"), key: z.string() }),
  z.object({
    action: z.literal("scroll"),
    direction: z.enum(["up", "down"]),
    amount: z.number().min(1).max(2000).optional(),
  }),
  z.object({ action: z.literal("wait"), seconds: z.number().min(0).max(60) }),
  z.object({ action: z.literal("close") }),
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
      "List of browser actions to run atomically. Use click_at to focus an input, then type to enter text, then press for keys like Enter.",
    ),
});

export type BrowserToolInputSchema = z.infer<typeof browserToolInputSchema>;

const description = `
Control a built-in browser window. Send a list of actions to run atomically (e.g. click search box, type "milk", press Enter).
Each request returns one screenshot of the page after all actions complete.
Actions: 
- open (optional url)
- navigate (url)
- click_at (x,y coordinates on the latest screenshot)
- type (text at focused element)
- press (key name)
- scroll (up/down, optional amount)
- wait (seconds)
- close
Use click_at to focus an input, then type to enter text. Only http and https URLs.
Allow more time between actions when needed.
Use grid coordinates from the screenshot to click at the correct position.
One browser window per chat; switching chats closes the previous window.
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
        const currentUrl = `Current URL: ${output.url}`
        return {
          type: 'content',
          value: [
            { type: 'text', text: currentUrl },
            { type: 'image-data', data: match[2], mediaType: 'image/png' }
          ],
        };
      },
    }),
  };
}
