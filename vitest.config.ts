import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    setupFiles: ["src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    globals: true,
    pool: "threads",
  },
  resolve: {
    alias: [
      { find: /^@\/App$/, replacement: path.resolve(__dirname, "src/renderer/App.tsx") },
      { find: "@/components", replacement: path.resolve(__dirname, "src/renderer/shared/components") },
      { find: "@/hooks", replacement: path.resolve(__dirname, "src/renderer/shared/hooks") },
      { find: "@/services", replacement: path.resolve(__dirname, "src/renderer/services") },
      { find: "@/types", replacement: path.resolve(__dirname, "src/renderer/shared/types") },
      { find: "@/stores", replacement: path.resolve(__dirname, "src/renderer/stores") },
      { find: "@/templates", replacement: path.resolve(__dirname, "templates") },
      { find: "@/constants", replacement: path.resolve(__dirname, "src/renderer/shared/constants") },
      { find: "@/tools", replacement: path.resolve(__dirname, "src/renderer/agent/tools") },
      { find: "@/mocks", replacement: path.resolve(__dirname, "src/renderer/mocks") },
      { find: "@/utils", replacement: path.resolve(__dirname, "src/renderer/shared/utils") },
      { find: "@/lib", replacement: path.resolve(__dirname, "src/renderer/shared/lib") },
      { find: "@/electron", replacement: path.resolve(__dirname, "src/main") },
      { find: "@/db", replacement: path.resolve(__dirname, "src/renderer/db") },
      { find: "@/shared", replacement: path.resolve(__dirname, "src/shared") },
      { find: "@/features", replacement: path.resolve(__dirname, "src/renderer/features") },
    ],
  },
});
