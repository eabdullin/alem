import { create } from "zustand";

export interface AppSettings {
  theme?: "light" | "dark";
  hasSeenOnboarding?: boolean;
  activeModel?: string;
  activeSearchProvider?: string;
  browserAllowedHosts?: string[];
  enabledModels?: Record<string, string[]>;
  terminalShell?: string;
  instructions?: string;
  hideDuckDuckGoBrowserSearchHint?: boolean;
}

interface AppState {
  settings: AppSettings;
  isReady: boolean;
  initialize: () => Promise<void>;
  updateSettings: (settings: AppSettings) => Promise<void>;
}

export const useAppStore = create<AppState>()((set) => ({
  settings: {},
  isReady: false,

  initialize: async () => {
    const { bootstrapDb } = await import("../db/bootstrap");
    await bootstrapDb();
    const s = window.qurt ? await window.qurt.getSettings() : {};
    set({ settings: (s as AppSettings) ?? {}, isReady: true });
  },

  updateSettings: async (newSettings) => {
    set({ settings: newSettings });
    if (window.qurt) await window.qurt.saveSettings(newSettings);
  },
}));
