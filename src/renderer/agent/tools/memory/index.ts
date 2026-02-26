import { SparkleIcon } from "lucide-react";
import type { ToolDefinition } from "../types";
import { getMemoryToolSet } from "./action";
import { MemoryToolDisplay } from "./display";

function getStepLabel(input: unknown): string {
  if (input != null && typeof input === "object" && "command" in input) {
    const cmd = (input as { command?: string }).command;
    if (typeof cmd === "string") {
      const labels: Record<string, string> = {
        view: "Reading memory",
        create: "Creating memory",
        update: "Updating memory",
        search: "Searching memory",
      };
      return labels[cmd] ?? `Memory: ${cmd}`;
    }
  }
  return "Memory";
}

export const memoryTool: ToolDefinition = {
  id: "memory",
  description:
    "Read and maintain long-term memory. Store user facts in core.md, notes in notes.md; search conversations for recall.",
  displayToolIds: ["memory"],
  getToolSet: getMemoryToolSet,
  stepIcon: SparkleIcon,
  getStepLabel: (input) => getStepLabel(input),
  Display: MemoryToolDisplay,
};
