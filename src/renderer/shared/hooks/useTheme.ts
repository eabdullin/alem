import { useContext, useCallback } from "react";
import { QurtContext } from "@/App";

export type Theme = "light" | "dark";

/**
 * Theme hook compatible with shadcn/Tailwind dark mode.
 * Syncs with app settings (persisted via electron-store).
 */
export function useTheme() {
  const { settings, updateSettings } = useContext(QurtContext);
  const theme = (settings?.theme as Theme) ?? "dark";

  const setTheme = useCallback(
    (mode: Theme) => {
      const root = document.documentElement;
      if (mode === "dark") {
        root.classList.add("dark");
        root.setAttribute("data-theme", "dark");
      } else {
        root.classList.remove("dark");
        root.setAttribute("data-theme", "light");
      }
      updateSettings({ ...settings, theme: mode });
    },
    [settings, updateSettings]
  );

  return { colorMode: theme, setColorMode: setTheme };
}
