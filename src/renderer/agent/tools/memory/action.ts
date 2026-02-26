import type { ToolSet } from "ai";
import { tool, zodSchema } from "ai";
import { z } from "zod";
import type { AiProvider } from "../types";

const memoryInputSchema = z.object({
  command: z
    .enum(["view", "create", "update", "search"])
    .describe(
      "Memory action: view to read, create to write new content, update to change existing content, search to find relevant lines.",
    ),
  path: z
    .string()
    .optional()
    .describe(
      "Memory path under /memories, such as /memories/core.md or /memories/notes.md. Required for view, create, and update.",
    ),
  content: z
    .string()
    .optional()
    .describe("Text to write for create or update commands."),
  mode: z
    .enum(["append", "overwrite"])
    .optional()
    .describe(
      "Write mode for update: append adds to existing content, overwrite replaces it. Defaults to overwrite.",
    ),
  query: z
    .string()
    .optional()
    .describe(
      "Search keywords for the search command. Prefer short focused terms.",
    ),
});

const description = `Use this tool to read and maintain long-term memory under /memories.

Rules:
- If the user prompt might depend on preferences, history, constraints, or goals, search first, then reply.
- If the prompt is fully self-contained or general knowledge, reply directly.
- Keep searches short and focused (1-4 words).
- Store durable user facts in /memories/core.md and detailed notes in /memories/notes.md.
- Keep memory operations invisible in user-facing replies.`;

export function getMemoryToolSet(
  _provider: AiProvider,
  _apiKey: string,
  _options?: import("../types").ToolSetOptions
): ToolSet {
  return {
    memory: tool({
      description,
      inputSchema: zodSchema(memoryInputSchema),
      execute: async (input) => {
        if (typeof window === "undefined" || !window.alem?.runMemoryCommand) {
          return { output: "Memory is not available in this environment." };
        }
        try {
          const output = await window.alem.runMemoryCommand({
            command: input.command,
            path: input.path,
            content: input.content,
            mode: input.mode,
            query: input.query,
          });
          return { output };
        } catch (error) {
          return {
            output: `Memory action failed: ${(error as Error).message}`,
          };
        }
      },
    }),
  };
}
