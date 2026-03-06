import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    // Force turndown to use its CJS entry so Rollup's commonjs plugin
    // can resolve the nested require('@mixmark-io/domino') call.
    alias: {
      turndown: "turndown/lib/turndown.cjs.js",
    },
  },
  build: {
    rollupOptions: {
      external: ["electron"],
      output: {
        entryFileNames: "main.js",
      },
    },
  },
});
