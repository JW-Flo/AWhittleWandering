import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "esnext",
    modulePreload: {
      polyfill: true,
    },
    reportCompressedSize: true,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        dead_code: true,
        passes: 2,
        toplevel: true,
      },
      mangle: {
        toplevel: true,
      },
    },
    rollupOptions: {
      output: {
        // Dynamically name CSS chunks
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith(".css")) {
            // Extract module name from the path
            const name = assetInfo.name.split("/").pop().split(".")[0];
            return `assets/${name}-[hash][extname]`;
          }
          return "assets/[name]-[hash][extname]";
        },
        manualChunks(id) {
          if (id.includes("node_modules/mapbox-gl/dist/mapbox-gl.css")) {
            return "mapbox-css";
          }
          if (id.includes("node_modules/mapbox-gl")) {
            return "mapbox-core";
          }
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react-router-dom")
          ) {
            return "vendor-react";
          }
          if (
            id.includes("node_modules/gsap") ||
            id.includes("node_modules/three") ||
            id.includes("node_modules/react-icons")
          ) {
            return "vendor-ui";
          }
          // Testing libraries only in development mode
          if (
            id.includes("node_modules/@testing-library") ||
            id.includes("node_modules/jest-dom")
          ) {
            return "vendor-test";
          }
        },
        // Adjust chunk naming format
        chunkFileNames: (chunkInfo) => {
          const id = chunkInfo.facadeModuleId || chunkInfo.moduleIds[0];
          if (id.includes("node_modules")) {
            return "vendor/[name].[hash].js";
          }
          return "chunks/[name].[hash].js";
        },
      },
    },
    // Performance optimizations
    chunkSizeWarningLimit: 1600,
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    cssMinify: true,
    // Enable source maps for production (optional, removes if performance is priority)
    sourcemap: true,
  },
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
        target: process.env.VITE_API_BASE_URL || "http://localhost:8787",
        changeOrigin: true,
        // Set secure to false for local development to allow self-signed certificates or HTTP targets
        secure: process.env.NODE_ENV === "production",
        rewrite: (path) => path,
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            console.log("proxy error", err);
          });
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            console.log("Sending Request:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req, _res) => {
            console.log("Received Response:", proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.js"],
    globals: true,
  },
});
