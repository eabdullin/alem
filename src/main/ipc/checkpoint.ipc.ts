import { ipcMain } from "electron";
import { restoreToCheckpoint } from "../services/rdiffBackupCheckpoints";

export function registerCheckpointIpc(): void {
  ipcMain.handle("restore-checkpoints", async (_event, payload: unknown) => {
    const { workspaceRoot, checkpointIds } =
      typeof payload === "object" && payload !== null && "workspaceRoot" in payload
        ? (payload as { workspaceRoot?: string; checkpointIds?: string[] })
        : { workspaceRoot: undefined, checkpointIds: payload as unknown };
    const ids = Array.isArray(checkpointIds)
      ? checkpointIds.filter((id): id is string => typeof id === "string")
      : [];
    if (!workspaceRoot || typeof workspaceRoot !== "string" || ids.length === 0) {
      return {
        restored: ids.length === 0,
        error: ids.length === 0 ? undefined : "Workspace root required for restore.",
      };
    }
    return restoreToCheckpoint(workspaceRoot.trim(), ids);
  });
}
