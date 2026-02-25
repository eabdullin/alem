import { FilePenIcon } from "lucide-react";
import type { ToolDefinition } from "../types";
import { getFilePatchToolSet } from "./action";
import { FilePatchToolDisplay, getConfirmationPreview } from "./display";

function getStepLabel(input: unknown): string {
  if (input != null && typeof input === "object") {
    const o = input as { patch?: string };
    const patch = typeof o.patch === "string" ? o.patch : "";
    if (patch) {
      const firstLine = patch.split("\n")[0];
      return firstLine.length > 40 ? `${firstLine.slice(0, 40)}...` : firstLine;
    }
  }
  return "Apply file patch";
}

export const filePatchTool: ToolDefinition = {
  id: "file-patch",
  description:
    "Apply a unified diff or strict patch DSL to workspace files. Workspace-bounded; binary files blocked; checkpoint-based revert available.",
  displayToolIds: ["apply_file_patch"],
  getToolSet: getFilePatchToolSet,
  stepIcon: FilePenIcon,
  getStepLabel: (input) => getStepLabel(input),
  getConfirmationPreview,
  Display: FilePatchToolDisplay,
};
