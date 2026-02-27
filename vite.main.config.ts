import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      external: ["electron", "electron-store", "canvas", "update-electron-app"],
      output: {
        entryFileNames: "main.js",
      },
    },
  },
});
