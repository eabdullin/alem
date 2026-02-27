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
});

export type FilePatchToolInput = z.infer<typeof filePatchInputSchema>;

const description = `
Apply a file patch to the workspace. Accepts unified diff or strict patch DSL.
All paths are relative to the workspace root. Binary files are blocked by default.
Provide base_hashes when you know file contents to avoid applying to stale files.
Symlinks are resolved; paths must stay inside the workspace.
`;

const WORKSPACE_NOT_SET_MESSAGE =
  "Workspace is not set for this chat. Please select a workspace folder using the button above the input before running terminal or file-patch commands.";

export function getFilePatchToolSet(
  _provider: AiProvider,
  _apiKey: string,
  options?: import("../types").ToolSetOptions
): ToolSet {
  const workspaceRoot = options?.workspaceRoot?.trim();
  return {
    apply_file_patch: tool({
      description,
      inputSchema: zodSchema(filePatchInputSchema),
      needsApproval: true,
      execute: async (input) => {
        if (typeof window === "undefined" || !window.qurt?.applyFilePatch) {
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
        if (!workspaceRoot) {
          return {
            status: "error" as const,
            files_changed: [],
            rejected_ops: [{ path: "", reason: WORKSPACE_NOT_SET_MESSAGE }],
            post_hashes: {},
          };
        }
        const request: FilePatchRequest = {
          patch: input.patch,
          base_hashes: input.base_hashes,
          workspaceRoot,
        };
        return window.qurt.applyFilePatch(
          request
        ) as Promise<FilePatchResult>;
      },
    }),
  };
}
