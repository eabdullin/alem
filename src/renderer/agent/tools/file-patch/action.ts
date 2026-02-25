import type { ToolSet } from "ai";
import { tool, zodSchema } from "ai";
import { z } from "zod";
import type { AiProvider } from "../types";
import type { FilePatchRequest, FilePatchResult } from "@/shared/tools/file-patch/types";

const filePatchInputSchema = z.object({
  patch: z.string().describe("Unified diff or strict patch DSL text to apply"),
  base_hashes: z
    .record(z.string())
    .optional()
    .describe(
      "Optional path -> sha256 hex. If provided, validated before patching; mismatch rejects that file.",
    ),
  workspaceOverride: z
    .string()
    .optional()
    .describe(
      "Per-chat workspace root override; when set, used instead of global default.",
    ),
});

export type FilePatchToolInput = z.infer<typeof filePatchInputSchema>;

const description = `
Apply a file patch to the workspace. Accepts unified diff or strict patch DSL.
All paths are relative to the workspace root. Binary files are blocked by default.
Provide base_hashes when you know file contents to avoid applying to stale files.
Symlinks are resolved; paths must stay inside the workspace.
`;

export function getFilePatchToolSet(
  _provider: AiProvider,
  _apiKey: string,
  options?: import("../types").ToolSetOptions
): ToolSet {
  const workspaceOverride = options?.terminalWorkspaceOverride;
  return {
    apply_file_patch: tool({
      description,
      inputSchema: zodSchema(filePatchInputSchema),
      needsApproval: true,
      execute: async (input) => {
        if (typeof window === "undefined" || !window.alem?.applyFilePatch) {
          return {
            status: "error" as const,
            files_changed: [],
            rejected_ops: [
              {
                path: "",
                reason: "File patch is not available in this environment.",
              },
            ],
            post_hashes: {},
          };
        }
        const trimmedOverride =
          typeof workspaceOverride === "string" && workspaceOverride.trim()
            ? workspaceOverride.trim()
            : undefined;

        const request: FilePatchRequest = {
          patch: input.patch,
          base_hashes: input.base_hashes,
          ...(trimmedOverride && { workspaceOverride: trimmedOverride }),
        };
        return window.alem.applyFilePatch(
          request
        ) as Promise<FilePatchResult>;
      },
    }),
  };
}
