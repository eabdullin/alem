/**
 * Checkpoint storage for file patch revert.
 * Persists pre-patch file state so users can one-click restore.
 */

import { app } from "electron";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const CHECKPOINTS_DIR_NAME = "file-patch-checkpoints";
const MAX_CHECKPOINTS = 50;

export interface FileSnapshot {
  /** Relative path from workspace root. */
  path: string;
  /** If false, file did not exist before patch. */
  existed: boolean;
  /** Original content (base64) when existed. */
  contentBase64?: string;
}

export interface CheckpointRecord {
  id: string;
  workspaceRoot: string;
  files: FileSnapshot[];
  createdAt: string;
}

function getCheckpointsDir(): string {
  return path.join(app.getPath("userData"), CHECKPOINTS_DIR_NAME);
}

async function ensureCheckpointsDir(): Promise<string> {
  const dir = getCheckpointsDir();
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

function getCheckpointPath(id: string): string {
  return path.join(getCheckpointsDir(), `${id}.json`);
}

/**
 * Save a checkpoint before applying patches.
 */
export async function saveCheckpoint(
  workspaceRoot: string,
  files: FileSnapshot[]
): Promise<string> {
  const dir = await ensureCheckpointsDir();
  const id = randomUUID();
  const record: CheckpointRecord = {
    id,
    workspaceRoot,
    files,
    createdAt: new Date().toISOString(),
  };
  await fs.writeFile(
    path.join(dir, `${id}.json`),
    JSON.stringify(record, null, 0),
    "utf8"
  );
  await pruneOldCheckpoints(dir);
  return id;
}

function restoreSingleCheckpoint(record: CheckpointRecord): Promise<void> {
  return (async () => {
    for (const snap of record.files) {
      const absPath = path.join(record.workspaceRoot, snap.path);
      if (snap.existed && snap.contentBase64) {
        await fs.writeFile(absPath, Buffer.from(snap.contentBase64, "base64"));
      } else {
        try {
          await fs.unlink(absPath);
        } catch {
          // File may already be gone
        }
      }
    }
  })();
}

/**
 * Restore files from a checkpoint.
 */
export async function restoreCheckpoint(
  checkpointId: string
): Promise<{ restored: boolean; error?: string }> {
  try {
    const filePath = getCheckpointPath(checkpointId);
    const raw = await fs.readFile(filePath, "utf8");
    const record = JSON.parse(raw) as CheckpointRecord;

    await restoreSingleCheckpoint(record);
    await fs.unlink(filePath);
    return { restored: true };
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? err.code : "";
    const message =
      code === "ENOENT"
        ? "Checkpoint has expired or was already used."
        : err instanceof Error
          ? err.message
          : String(err);
    return {
      restored: false,
      error: message,
    };
  }
}

/**
 * Restore files from multiple checkpoints atomically.
 * Reverts in reverse order (most recent first) so all file changes after
 * the earliest checkpoint are restored.
 */
export async function restoreCheckpoints(
  checkpointIds: string[]
): Promise<{ restored: boolean; error?: string }> {
  if (checkpointIds.length === 0) {
    return { restored: true };
  }

  const ids = [...checkpointIds].reverse();
  const records: { path: string; record: CheckpointRecord }[] = [];

  try {
    for (const id of ids) {
      const filePath = getCheckpointPath(id);
      const raw = await fs.readFile(filePath, "utf8");
      const record = JSON.parse(raw) as CheckpointRecord;
      records.push({ path: filePath, record });
    }

    for (const { record } of records) {
      await restoreSingleCheckpoint(record);
    }

    for (const { path: filePath } of records) {
      await fs.unlink(filePath);
    }

    return { restored: true };
  } catch (err) {
    const code = err && typeof err === "object" && "code" in err ? err.code : "";
    const message =
      code === "ENOENT"
        ? "Checkpoint has expired or was already used."
        : err instanceof Error
          ? err.message
          : String(err);
    return {
      restored: false,
      error: message,
    };
  }
}

async function pruneOldCheckpoints(dir: string): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => ({
      name: e.name,
      path: path.join(dir, e.name),
    }));

  if (files.length <= MAX_CHECKPOINTS) return;

  const stats = await Promise.all(
    files.map(async (f) => ({
      ...f,
      mtime: (await fs.stat(f.path)).mtime.getTime(),
    }))
  );
  stats.sort((a, b) => a.mtime - b.mtime);

  const toRemove = stats.slice(0, stats.length - MAX_CHECKPOINTS);
  for (const f of toRemove) {
    try {
      await fs.unlink(f.path);
    } catch {
      // Ignore
    }
  }
}
