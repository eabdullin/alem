import fs from "node:fs";
import path from "node:path";
import { ipcMain } from "electron";
import log from "../logger";
import { getStore } from "../services/appStore";
import {
  runTerminal,
  type TerminalRunRequest,
  type TerminalRunResult,
} from "../services/terminalRunner";

const WORKSPACE_NOT_SET_MESSAGE =
  "Workspace is not set for this chat. Please select a workspace folder using the button above the input before running terminal or file-patch commands.";

export function registerTerminalIpc(): void {
  ipcMain.handle(
    "run-terminal",
    async (_event, request: TerminalRunRequest): Promise<TerminalRunResult> => {
      const root = request.workspaceRoot?.trim();
      if (!root) {
        log.warn("Terminal: workspace not set");
        return {
          stdout: "",
          stderr: WORKSPACE_NOT_SET_MESSAGE,
          outcome: { type: "denied", reason: "workspace not set" },
          duration_ms: 0,
          truncated: false,
        };
      }
      try {
        const resolved = path.resolve(root);
        if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
          log.warn("Terminal: invalid workspace path", root);
          return {
            stdout: "",
            stderr: "Workspace path is invalid or not a directory.",
            outcome: { type: "denied", reason: "invalid workspace" },
            duration_ms: 0,
            truncated: false,
          };
        }
        const settings = getStore().get("settings", {}) as { terminalShell?: string };
        const shell = settings.terminalShell?.trim() || undefined;
        log.info("Terminal: running", request.command.join(" "));
        const result = await runTerminal({ request, workspaceRoot: resolved, shell });
        log.info("Terminal: completed", result.outcome.type, `${result.duration_ms}ms`);
        return result;
      } catch (err) {
        log.error("Terminal: workspace resolution failed", err);
        return {
          stdout: "",
          stderr: "Workspace path is invalid.",
          outcome: { type: "denied", reason: "invalid workspace" },
          duration_ms: 0,
          truncated: false,
        };
      }
    }
  );
}
