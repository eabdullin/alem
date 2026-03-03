import { create } from "zustand";
import {
  performRestore,
  type PerformRestoreOptions,
  type RestoreContext,
} from "@/services/checkpoint-service";

interface CheckpointState {
  isRestoring: boolean;
  restoreFromCheckpoint: (
    ctx: RestoreContext,
    options: PerformRestoreOptions,
  ) => Promise<{ ok: boolean; error?: string }>;
}

export const useCheckpointStore = create<CheckpointState>()((set, get) => ({
  isRestoring: false,

  restoreFromCheckpoint: async (ctx, options) => {
    if (get().isRestoring) {
      return { ok: false, error: "Restore already in progress." };
    }
    set({ isRestoring: true });
    try {
      return await performRestore(ctx, options);
    } finally {
      set({ isRestoring: false });
    }
  },
}));
