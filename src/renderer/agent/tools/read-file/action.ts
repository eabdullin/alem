import type { ToolSet } from "ai";
import { tool, zodSchema } from "ai";
import { z } from "zod";
import type { ReadFileRequest, ReadFileResult } from "@/shared/tools/read-file/types";

const readFileInputSchema = z.object({
  path: z.string().describe(
    "Relative path from workspace root to the file to read. Supports text files (.txt, .md, .json, .html, .xml, code files, etc.), PDF, DOCX, and RTF.",
  ),
});

export type ReadFileToolInput = z.infer<typeof readFileInputSchema>;

const description = `Read a file from the workspace. Returns the text content of the file.
Supports text files (code, markdown, JSON, HTML, XML, CSV, etc.), PDF, DOCX, and RTF.
Path is relative to the workspace root. Symlinks are resolved; paths must stay inside the workspace.
Large files are truncated. Binary files (images, archives, executables) are not supported.`;

const WORKSPACE_NOT_SET_MESSAGE =
  "Workspace is not set for this chat. Please select a workspace folder using the button above the input before reading files.";

export function getReadFileToolSet(
  options?: import("../types").ToolSetOptions,
): ToolSet {
  const workspaceRoot = options?.workspaceRoot?.trim();
  return {
    read_file: tool({
      description,
      inputSchema: zodSchema(readFileInputSchema),
      execute: async (input) => {
        if (typeof window === "undefined" || !window.qurt?.readFile) {
          return {
            content: "",
            path: input.path,
            format: "unknown",
            error: "File reading is not available in this environment.",
          };
        }
        if (!workspaceRoot) {
          return {
            content: "",
            path: input.path,
            format: "unknown",
            error: WORKSPACE_NOT_SET_MESSAGE,
          };
        }
        const request: ReadFileRequest = {
          path: input.path,
          workspaceRoot,
        };
        return window.qurt.readFile(request) as Promise<ReadFileResult>;
      },
    }),
  };
}
