import type { ToolSet } from "ai";
import { tool, zodSchema } from "ai";
import { z } from "zod";
import type { AiProvider } from "../types";
import type { TerminalRunResult } from "@/shared/tools/terminal/types";
import { DENYLIST_COMMANDS } from "@/shared/tools/terminal/denylist";

const terminalInputSchema = z.object({
  description: z
    .string()
    .optional()
    .describe(
      "Short label for this run (e.g. 'Check git status'). Shown in the chain of thought.",
    ),
  command: z
    .array(z.string())
    .describe("Command as tokens, e.g. ['git','status','--porcelain']"),
  env: z
    .record(z.string())
    .optional()
    .describe("Only these env vars are passed (allowlist)"),
  timeout_ms: z
    .number()
    .optional()
    .describe("Hint for max run time; system enforces a cap"),
  max_output_bytes: z
    .number()
    .optional()
    .describe("Cap on combined stdout+stderr size"),
  network: z
    .union([
      z.object({ enabled: z.literal(false) }),
      z.object({
        enabled: z.literal(true),
        allowed_domains: z.array(z.string()),
      }),
    ])
    .optional()
    .describe("Default deny. If enabled, only allowed_domains (future)"),
});

export type TerminalToolInput = z.infer<typeof terminalInputSchema>;

function getPlatformLabel(): string {
  if (typeof window === "undefined" || !window.alem?.platform) return "unknown";
  switch (window.alem.platform) {
    case "win32":
      return "Windows";
    case "darwin":
      return "macOS";
    case "linux":
      return "Linux";
    default:
      return window.alem.platform;
  }
}

/**
 * Returns the terminal ToolSet for the given provider.
 * Execution is done via IPC to the Electron main process (same for all providers).
 */
const description = `
Run a single command in the workspace terminal. Commands always run in the chat's workspace folder.
Current platform: ${getPlatformLabel()}. 
Use platform-appropriate commands (e.g. on Windows prefer Get-Content; on macOS/Linux use cat). 
Use ripgrep to search for files (e.g. 'rg -l "search term"').
Provide a short 'description' for the step label (e.g. 'Check git status'). 
Use tokenized 'command' (e.g. ['git','status']). 
Network is disabled by default. Dangerous commands (rm -rf, sudo, etc.) are blocked.
Following commands are blocked: 
${[...DENYLIST_COMMANDS].sort().join("\n")}
`;
export function getTerminalToolSet(
  _provider: AiProvider,
  _apiKey: string,
  options?: import("../types").ToolSetOptions
): ToolSet {
  const workspaceOverride = options?.terminalWorkspaceOverride;
  return {
    run_terminal: tool({
      description,
      inputSchema: zodSchema(terminalInputSchema),
      needsApproval: true,
      execute: async (input) => {
        if (typeof window === "undefined" || !window.alem?.runTerminal) {
          return {
            stdout: "",
            stderr: "Terminal is not available in this environment.",
            outcome: { type: "denied", reason: "no terminal api" },
            duration_ms: 0,
            truncated: false,
          };
        }
        const trimmedOverride =
          typeof workspaceOverride === "string" && workspaceOverride.trim()
            ? workspaceOverride.trim()
            : undefined;

        const request = trimmedOverride
          ? { ...input, workspaceOverride: trimmedOverride }
          : input;
        return window.alem.runTerminal(
          request
        ) as Promise<TerminalRunResult>;
      },
    }),
  };
}
