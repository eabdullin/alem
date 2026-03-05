import fs from "node:fs";
import path from "node:path";
import { ipcMain } from "electron";
import log from "../logger";
import {
  runFilePatch,
  type FilePatchRequest,
  type FilePatchResult,
} from "../services/filePatchRunner";

const WORKSPACE_NOT_SET_MESSAGE =
  "Workspace is not set for this chat. Please select a workspace folder using the button above the input before running terminal or file-patch commands.";

export function registerFilePatchIpc(): void {
  ipcMain.handle(
    "apply-file-patch",
    async (_event, request: FilePatchRequest): Promise<FilePatchResult> => {
      const root = request.workspaceRoot?.trim();
      if (!root) {
        log.warn("FilePatch: workspace not set");
        return {
          status: "error",
          files_changed: [],
          rejected_ops: [{ path: "", reason: WORKSPACE_NOT_SET_MESSAGE }],
          post_hashes: {},
        };
      }
      try {
        const resolved = path.resolve(root);
        if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
          log.warn("FilePatch: invalid workspace path", root);
          return {
            status: "error",
            files_changed: [],
            rejected_ops: [
              {
                path: "",
                reason: "Workspace path is invalid or not a directory.",
              },
            ],
            post_hashes: {},
          };
        }
        log.info("FilePatch: applying patch");
        const result = await runFilePatch({ request, workspaceRoot: resolved });
        log.info("FilePatch:", result.status, `${result.files_changed.length} files changed`);
        return result;
      } catch (err) {
        log.error("FilePatch: workspace resolution failed", err);
        return {
          status: "error",
          files_changed: [],
          rejected_ops: [{ path: "", reason: "Workspace path is invalid." }],
          post_hashes: {},
        };
      }
    }
  );
}
