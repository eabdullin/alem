/**
 * Workspace checkpointing via rdiff-backup.
 * Creates incremental snapshots on each user message and restores workspace
 * to any prior checkpoint.
 *
 * Storage: {userData}/checkpoints/{workspaceId}/mirror/
 * workspaceId = sha256(workspaceRoot) for filesystem-safe paths.
 *
 * Safe restore: restores to temp dir first, moves current workspace to
 * .qurt/checkpoint-trash/<ts>/, then moves restored contents into place.
 */

import { app } from "electron";
import { createHash } from "node:crypto";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const CHECKPOINTS_DIR = "checkpoints";
const RDIFF_BINARY_DIR = "rdiff-backup";
const RDIFF_API_VERSION = "201";
const QURT_DIR = ".qurt";
const CHECKPOINT_TRASH_SUBDIR = "checkpoint-trash";

/**
 * Convert a timestamp to W3 datetime for rdiff-backup.
 * Accepts ISO strings, epoch seconds (from --parsable-output), or Date-parseable strings.
 * Output: "YYYY-MM-DDTHH:MM:SS+00:00" (no "Z", no milliseconds).
 * @see https://rdiff-backup.net/examples.html TIME FORMATS
 */
function toRdiffTimeSpec(input: string): string {
  let date: Date;
  if (/^\d+$/.test(input.trim())) {
    date = new Date(Number(input.trim()) * 1000);
  } else {
    date = new Date(input);
  }
  if (isNaN(date.getTime())) {
    return input;
  }
  return date.toISOString().replace(/\.\d{3}Z$/, "+00:00");
}

function getCheckpointsBaseDir(): string {
  return path.join(app.getPath("userData"), CHECKPOINTS_DIR);
}

function getRdiffBackupPath(): string | null {
  const platform = process.platform;
  const arch = process.arch === "x64" ? "x64" : process.arch === "arm64" ? "arm64" : null;
  if (!arch) return null;

  let subdir: string;
  if (platform === "win32") subdir = "win32-x64";
  else if (platform === "darwin") subdir = arch === "arm64" ? "darwin-arm64" : "darwin-x64";
  else if (platform === "linux") subdir = `linux-${arch}`;
  else return null;

  const base = app.isPackaged
    ? process.resourcesPath
    : path.join(process.cwd(), "resources");
  const exe = platform === "win32" ? "rdiff-backup.exe" : "rdiff-backup";
  const fullPath = path.join(base, RDIFF_BINARY_DIR, subdir, exe);
  return fullPath;
}

function workspaceId(workspaceRoot: string): string {
  const normalized = path.resolve(workspaceRoot).replace(/\\/g, "/");
  return createHash("sha256").update(normalized).digest("hex");
}

function getMirrorDir(wsId: string): string {
  return path.join(getCheckpointsBaseDir(), wsId);
}

async function ensureMirrorDir(wsId: string): Promise<void> {
  await fs.mkdir(path.join(getCheckpointsBaseDir(), wsId), { recursive: true });
}

function execRdiff(
  args: string[],
  cwd?: string
): Promise<{ stdout: string; stderr: string; code: number }> {
  const bin = getRdiffBackupPath();
  if (!bin) {
    return Promise.resolve({
      stdout: "",
      stderr: "rdiff-backup binary not found for this platform",
      code: -1,
    });
  }

  const apiArgs = ["--api-version", RDIFF_API_VERSION, ...args];
  return new Promise((resolve) => {
    const proc = spawn(bin, apiArgs, {
      cwd: cwd || process.cwd(),
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    proc.stdout?.on("data", (d) => (stdout += d.toString()));
    proc.stderr?.on("data", (d) => (stderr += d.toString()));
    proc.on("close", (code) => {
      resolve({ stdout, stderr, code: code ?? -1 });
    });
    proc.on("error", (err) => {
      resolve({ stdout, stderr: err.message, code: -1 });
    });
  });
}

/**
 * Create a checkpoint (rdiff-backup backup) for the current workspace state.
 * Returns ISO timestamp if successful, undefined otherwise.
 */
export async function createCheckpoint(
  workspaceRoot: string,
): Promise<string | undefined> {
  const bin = getRdiffBackupPath();
  if (!bin) return undefined;

  try {
    const resolved = path.resolve(workspaceRoot);
    const stat = await fs.stat(resolved);
    if (!stat.isDirectory()) return undefined;
  } catch {
    return undefined;
  }

  const wsId = workspaceId(workspaceRoot);
  await ensureMirrorDir(wsId);
  const mirrorDir = getMirrorDir(wsId);

  const excludeDir = "**/" + QURT_DIR;
  // try {
  //   // The { recursive: true } option prevents an error if the directory exists.
  //   await fs.mkdir(excludeDir, { recursive: true });
  //   console.log(`Directory created or already exists: ${excludeDir}`);
  // } catch (err ) {
  //   console.error(`Error creating directory`);
  // }
  const { code, stderr } = await execRdiff([
    "backup",
    "--exclude",
    excludeDir,
    path.resolve(workspaceRoot),
    mirrorDir,
  ]);

  if (code !== 0) {
    console.warn("[rdiff-backup] backup failed:", stderr);
    return undefined;
  }

  return new Date().toISOString();
}

/**
 * Move a file or directory. Uses rename when possible; falls back to copy+remove for cross-device.
 */
async function moveEntry(src: string, dest: string): Promise<void> {
  try {
    await fs.rename(src, dest);
  } catch {
    await fs.cp(src, dest, { recursive: true });
    await fs.rm(src, { recursive: true, force: true });
  }
}

/**
 * Restore workspace to the given timestamp.
 * Safe strategy:
 * 1. Restore into temp dir
 * 2. Move current workspace to .qurt/checkpoint-trash/<ts>/
 * 3. Move temp contents into workspace
 */
export async function restoreToCheckpoint(
  workspaceRoot: string,
  timestamp: string,
): Promise<{ restored: boolean; error?: string }> {
  const bin = getRdiffBackupPath();
  if (!bin) {
    return { restored: false, error: "rdiff-backup binary not found." };
  }

  const resolvedRoot = path.resolve(workspaceRoot);
  const wsId = workspaceId(workspaceRoot);
  const mirrorDir = getMirrorDir(wsId);

  try {
    await fs.stat(mirrorDir);
  } catch {
    return { restored: false, error: "No checkpoint mirror found for this workspace." };
  }

  const tempRestoreDir = path.join(
    os.tmpdir(),
    `qurt-restore-${Date.now()}-${randomUUID()}`
  );
  await fs.mkdir(tempRestoreDir, { recursive: true });

  try {
    const rdiffTime = toRdiffTimeSpec(timestamp);
    const { code: restoreCode, stderr: restoreStderr } = await execRdiff([
      "restore",
      "--at",
      rdiffTime,
      mirrorDir,
      tempRestoreDir,
    ]);

    if (restoreCode !== 0) {
      return {
        restored: false,
        error: restoreStderr || `rdiff-backup restore failed with code ${restoreCode}`,
      };
    }

    const trashTs = new Date().toISOString().replace(/[:.]/g, "-");
    const trashDir = path.join(resolvedRoot, QURT_DIR, CHECKPOINT_TRASH_SUBDIR, trashTs);
    await fs.mkdir(trashDir, { recursive: true });

    const entries = await fs.readdir(resolvedRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === QURT_DIR) continue;
      const src = path.join(resolvedRoot, entry.name);
      const dest = path.join(trashDir, entry.name);
      await moveEntry(src, dest);
    }

    const restoredEntries = await fs.readdir(tempRestoreDir, { withFileTypes: true });
    for (const entry of restoredEntries) {
      const src = path.join(tempRestoreDir, entry.name);
      const dest = path.join(resolvedRoot, entry.name);
      await moveEntry(src, dest);
    }

    return { restored: true };
  } finally {
    await fs.rm(tempRestoreDir, { recursive: true, force: true }).catch(() => { });
  }
}

/**
 * List all checkpoint timestamps for a workspace by querying rdiff-backup's
 * own increment records (sorted ascending).
 */
export async function listCheckpoints(
  workspaceRoot: string,
): Promise<string[]> {
  const bin = getRdiffBackupPath();
  if (!bin) return [];

  const wsId = workspaceId(workspaceRoot);
  const mirrorDir = getMirrorDir(wsId);

  try {
    await fs.stat(mirrorDir);
  } catch {
    return [];
  }

  const { code, stdout } = await execRdiff([
    "list",
    "increments",
    "--parsable-output",
    mirrorDir,
  ]);

  if (code !== 0) return [];

  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .sort();
}

/**
 * Remove increments older than the given time spec (e.g. "30D", "4W").
 * Optional cleanup to limit storage.
 */
export async function removeOldIncrements(
  workspaceRoot: string,
  olderThan: string
): Promise<{ ok: boolean; error?: string }> {
  const bin = getRdiffBackupPath();
  if (!bin) return { ok: false, error: "rdiff-backup binary not found." };

  const wsId = workspaceId(workspaceRoot);
  const mirrorDir = getMirrorDir(wsId);

  const { code, stderr } = await execRdiff(
    ["--force", "remove", "increments", "--older-than", olderThan, mirrorDir],
    undefined
  );

  if (code !== 0) {
    return { ok: false, error: stderr || `rdiff-backup remove failed with code ${code}` };
  }
  return { ok: true };
}
