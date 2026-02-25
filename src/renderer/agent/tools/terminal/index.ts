import { TerminalIcon } from "lucide-react";
import type { ToolDefinition } from "../types";
import { getTerminalToolSet } from "./action";
import { TerminalToolDisplay, getConfirmationPreview } from "./display";

function getStepLabel(input: unknown): string {
  if (input != null && typeof input === "object") {
    const o = input as { description?: string; command?: string[] };
    const desc =
      typeof o.description === "string" ? o.description.trim() : "";
    if (desc) return desc;
    const cmd = o.command;
    if (Array.isArray(cmd) && cmd.length > 0) {
      return cmd.join(" ");
    }
  }
  return "Run terminal command";
}

export const terminalTool: ToolDefinition = {
  id: "terminal",
  description:
    "Run a single shell command in the workspace. Restricted to workspace directory; dangerous commands are blocked; network is default-deny.",
  displayToolIds: ["run_terminal"],
  getToolSet: getTerminalToolSet,
  stepIcon: TerminalIcon,
  getStepLabel: (input) => getStepLabel(input),
  getConfirmationPreview,
  Display: TerminalToolDisplay,
};
