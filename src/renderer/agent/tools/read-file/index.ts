import { FileTextIcon } from "lucide-react";
import type { ToolDefinition } from "../types";
import { getReadFileToolSet } from "./action";
import { ReadFileToolDisplay } from "./display";

function getStepLabel(input: unknown): string {
  if (input != null && typeof input === "object" && "path" in input) {
    const p = (input as { path?: string }).path;
    if (typeof p === "string" && p.trim()) {
      const display = p.length > 50 ? `...${p.slice(-47)}` : p;
      return `Reading ${display}`;
    }
  }
  return "Reading file";
}

export const readFileTool: ToolDefinition = {
  id: "read-file",
  description:
    "Read a file from the workspace. Supports text, PDF, DOCX, and RTF. Workspace-bounded; large files truncated.",
  displayToolIds: ["read_file"],
  getToolSet: getReadFileToolSet,
  stepIcon: FileTextIcon,
  getStepLabel: (input) => getStepLabel(input),
  Display: ReadFileToolDisplay,
};
