import fs from "node:fs";
import path from "node:path";
import { ipcMain } from "electron";
import { app } from "electron";
import { getStore } from "../services/appStore";
import {
  runFilePatch,
  type FilePatchRequest,
  type FilePatchResult,
} from "../services/filePatchRunner";
import {
  restoreCheckpoint,
  restoreCheckpoints,
} from "../services/filePatchCheckpoints";
import { getTerminalWorkspaceRoot } from "../services/terminalRunner";

export function registerFilePatchIpc(): void {
  const store = getStore();

  ipcMain.handle(
    "apply-file-patch",
    async (_event, request: FilePatchRequest): Promise<FilePatchResult> => {
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
      return runFilePatch({ request, workspaceRoot: root });
    }
  );

  ipcMain.handle(
    "restore-file-patch-checkpoint",
    async (_event, checkpointId: string) => {
      return restoreCheckpoint(checkpointId);
    }
  );

  ipcMain.handle(
    "restore-file-patch-checkpoints",
    async (_event, checkpointIds: unknown) => {
      const ids = Array.isArray(checkpointIds)
        ? checkpointIds.filter((id): id is string => typeof id === "string")
        : [];
      return restoreCheckpoints(ids);
    }
  );
}
