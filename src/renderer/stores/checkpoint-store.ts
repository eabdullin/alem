/**
 * Checkpoint store for file patch restore state.
 * Holds restore-in-progress state and provides restore orchestration.
 */

import {
  performRestore,
  type PerformRestoreOptions,
  type RestoreContext,
} from "@/services/checkpoint-service";

type Listener = () => void;

let isRestoring = false;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((cb) => cb());
}

export interface CheckpointStoreState {
  isRestoring: boolean;
}

/**
 * Subscribe to checkpoint store changes (e.g. isRestoring).
 */
export function subscribeCheckpointStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Get current store state.
 */
export function getCheckpointStoreState(): CheckpointStoreState {
  return { isRestoring };
}

/**
 * Restore files from checkpoint context. Updates store state during operation.
 */
export async function restoreFromCheckpoint(
  ctx: RestoreContext,
  options: PerformRestoreOptions
): Promise<{ ok: boolean; error?: string }> {
  if (isRestoring) {
    return { ok: false, error: "Restore already in progress." };
  }

  isRestoring = true;
  notify();

  try {
    const result = await performRestore(ctx, options);
    return result;
  } finally {
    isRestoring = false;
    notify();
  }
}
