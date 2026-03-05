import { ipcMain } from "electron";
import log from "../logger";
import { createCheckpoint, listCheckpoints, restoreToCheckpoint } from "../services/rdiffBackupCheckpoints";

export function registerCheckpointIpc(): void {
  ipcMain.handle("create-checkpoint", async (_event, payload: unknown) => {
    const { workspaceRoot } =
      typeof payload === "object" && payload !== null
        ? (payload as { workspaceRoot?: string })
        : ({} as Record<string, undefined>);
    if (!workspaceRoot || typeof workspaceRoot !== "string") {
      return { created: false };
    }
    log.debug("Checkpoint: creating");
    const ts = await createCheckpoint(workspaceRoot.trim());
    if (ts) {
      log.info("Checkpoint: created at", ts);
    } else {
      log.warn("Checkpoint: creation failed");
    }
    return ts ? { created: true, timestamp: ts } : { created: false };
  });

  ipcMain.handle("list-checkpoints", async (_event, payload: unknown) => {
    const { workspaceRoot } =
      typeof payload === "object" && payload !== null && "workspaceRoot" in payload
        ? (payload as { workspaceRoot?: string })
        : { workspaceRoot: undefined };
    if (!workspaceRoot || typeof workspaceRoot !== "string") {
      return [];
    }
    return listCheckpoints(workspaceRoot.trim());
  });

  ipcMain.handle("restore-checkpoints", async (_event, payload: unknown) => {
    const { workspaceRoot, timestamp } =
      typeof payload === "object" && payload !== null && "workspaceRoot" in payload
        ? (payload as { workspaceRoot?: string; timestamp?: string })
        : { workspaceRoot: undefined, timestamp: undefined };
    if (!workspaceRoot || typeof workspaceRoot !== "string") {
      return { restored: false, error: "Workspace root required for restore." };
    }
    if (!timestamp || typeof timestamp !== "string") {
      return { restored: false, error: "Timestamp required for restore." };
    }
    log.info("Checkpoint: restoring to", timestamp);
    const result = await restoreToCheckpoint(workspaceRoot.trim(), timestamp);
    if (result.restored) {
      log.info("Checkpoint: restored successfully");
    } else {
      log.error("Checkpoint: restore failed", result.error);
    }
    return result;
  });
}
