import fs from "node:fs";
import path from "node:path";
import { ipcMain } from "electron";
import {
  runFilePatch,
  type FilePatchRequest,
  type FilePatchResult,
} from "../services/filePatchRunner";
import { createCheckpoint } from "../services/rdiffBackupCheckpoints";

const WORKSPACE_NOT_SET_MESSAGE =
  "Workspace is not set for this chat. Please select a workspace folder using the button above the input before running terminal or file-patch commands.";

export function registerFilePatchIpc(): void {
  ipcMain.handle(
    "apply-file-patch",
    async (_event, request: FilePatchRequest): Promise<FilePatchResult> => {
      const root = request.workspaceRoot?.trim();
      if (!root) {
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
        const checkpointId = await createCheckpoint(resolved, "apply_file_patch");
        const result = await runFilePatch({ request, workspaceRoot: resolved });
        return checkpointId ? { ...result, checkpoint_id: checkpointId } : result;
      } catch {
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
