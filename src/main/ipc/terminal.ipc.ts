import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import { ipcMain } from "electron";
import { getStore } from "../services/appStore";
import {
  getTerminalWorkspaceRoot,
  runTerminal,
  type TerminalRunRequest,
  type TerminalRunResult,
} from "../services/terminalRunner";

export function registerTerminalIpc(): void {
  const store = getStore();

  ipcMain.handle("get-terminal-workspace-root", () => {
    const s = store.get("settings", {}) as Record<string, unknown> & {
      terminalWorkspaceRoot?: string;
    };
    return getTerminalWorkspaceRoot(s) || app.getPath("documents");
  });

  ipcMain.handle(
    "run-terminal",
    async (_event, request: TerminalRunRequest): Promise<TerminalRunResult> => {
      const s = store.get("settings", {}) as Record<string, unknown> & {
        terminalWorkspaceRoot?: string;
      };
      let root: string;
      const override = request.workspaceOverride?.trim();
      if (override) {
        try {
          const resolved = path.resolve(override);
          if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
            root = resolved;
          } else {
            root = getTerminalWorkspaceRoot(s) || app.getPath("documents");
          }
        } catch {
          root = getTerminalWorkspaceRoot(s) || app.getPath("documents");
        }
      } else {
        root = getTerminalWorkspaceRoot(s) || app.getPath("documents");
      }
      return runTerminal({ request, workspaceRoot: root });
    }
  );
}
