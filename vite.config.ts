import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron/simple";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: "electron/main.ts",
        vite: {
          build: {
            rollupOptions: {
              external: ["electron", "electron-store"],
            },
          },
        },
      },
      preload: {
        input: "electron/preload.ts",
      },
    }),
  ],
  resolve: {
    alias: [
      { find: /^@\/App$/, replacement: path.resolve(__dirname, "src/App.tsx") },
      { find: "@/components", replacement: path.resolve(__dirname, "src/components") },
      { find: "@/pages", replacement: path.resolve(__dirname, "src/pages") },
      { find: "@/hooks", replacement: path.resolve(__dirname, "src/hooks") },
      { find: "@/services", replacement: path.resolve(__dirname, "src/services") },
      { find: "@/types", replacement: path.resolve(__dirname, "src/types") },
      { find: "@/stores", replacement: path.resolve(__dirname, "src/stores") },
      { find: "@/templates", replacement: path.resolve(__dirname, "templates") },
      { find: "@/constants", replacement: path.resolve(__dirname, "src/constants") },
      { find: "@/tools", replacement: path.resolve(__dirname, "src/tools") },
      { find: "@/mocks", replacement: path.resolve(__dirname, "src/mocks") },
      { find: "@/utils", replacement: path.resolve(__dirname, "utils") },
      { find: "@/lib", replacement: path.resolve(__dirname, "src/lib") },
      { find: "@/electron", replacement: path.resolve(__dirname, "electron") },
    ],
  },
});
