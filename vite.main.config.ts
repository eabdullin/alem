import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      external: ["electron", "electron-store", "canvas"],
      output: {
        entryFileNames: "main.js",
      },
    },
  },
});
