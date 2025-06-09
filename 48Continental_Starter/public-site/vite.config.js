import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "../../shared"
      ),
    },
  },
  server: {
    proxy: {
      "/api": {
        // Forward all /api requests to the edge-worker backend
        target: "http://localhost:8787",
        changeOrigin: true,
        // Keep the /api prefix as the edge-worker expects it
        rewrite: (path) => path,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.js"],
    globals: true,
  },
});
