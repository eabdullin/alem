import fs from "node:fs";
import path from "node:path";
import { ipcMain } from "electron";
import log from "../logger";
import { IPC_CHANNELS } from "../../shared/ipc/channels";
import { runReadFile } from "../services/fileReader";
import type { ReadFileRequest, ReadFileResult } from "../services/fileReader";

export function registerReadFileIpc(): void {
  ipcMain.handle(
    IPC_CHANNELS.READ_FILE,
    async (_event, request: ReadFileRequest): Promise<ReadFileResult> => {
      const root = request.workspaceRoot?.trim();
      if (!root) {
        log.warn("ReadFile: workspace not set");
        return {
          content: "",
          path: request.path ?? "",
          format: "unknown",
          error:
            "Workspace is not set for this chat. Please select a workspace folder using the button above the input before reading files.",
        };
      }
      try {
        const resolved = path.resolve(root);
        if (
          !fs.existsSync(resolved) ||
          !fs.statSync(resolved).isDirectory()
        ) {
          log.warn("ReadFile: invalid workspace path", root);
          return {
            content: "",
            path: request.path ?? "",
            format: "unknown",
            error: "Workspace path is invalid or not a directory.",
          };
        }
        log.debug("ReadFile:", request.path);
        return await runReadFile({ ...request, workspaceRoot: resolved });
      } catch (err) {
        log.error("ReadFile: failed", request.path, err);
        return {
          content: "",
          path: request.path ?? "",
          format: "unknown",
          error: "Workspace path is invalid.",
        };
      }
    },
  );
}
