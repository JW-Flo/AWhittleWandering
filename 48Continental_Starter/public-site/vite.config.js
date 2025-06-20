import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Helper function to determine manual chunk names for Rollup.
 * @param {string} id - The module id (path).
 * @returns {string|undefined} - The chunk name or undefined.
 */
function getManualChunkName(id) {
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
  // Add more chunking logic here as needed for maintainability.
}

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    define: {
      // KEY FIX: Ensure the Mapbox token is properly injected at build time
      // This ensures import.meta.env.VITE_MAPBOX_TOKEN is replaced with the actual token string
      "import.meta.env.VITE_MAPBOX_TOKEN": JSON.stringify(
        env.VITE_MAPBOX_TOKEN ||
          // Fallback chain for legacy env variable names (help transition)
          env.MAPBOX_TOKEN ||
          env.MAP_API_TOKEN ||
          // Default token as last resort - this should be a valid production token
          "          process.env.VITE_MAPBOX_TOKEN || "your_mapbox_token_here""
      ),

      // OTHER ENVIRONMENT VARIABLES - using consistent pattern
      "import.meta.env.VITE_EDGE_WORKER_URL": JSON.stringify(
        env.VITE_EDGE_WORKER_URL ||
          "https://awhittlewandering-edge.kd8jc7v8cd.workers.dev"
      ),
      "import.meta.env.VITE_USE_SIMULATED_DATA": JSON.stringify(
        env.VITE_USE_SIMULATED_DATA || "false"
      ),

      // Ensure DEV flag for conditional development-only code
      "import.meta.env.DEV": JSON.stringify(mode === "development"),
    },
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
          manualChunks: getManualChunkName,
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
        // Use local shared directory instead of external project
        "@shared": path.resolve(
          path.dirname(fileURLToPath(import.meta.url)),
          "./src/shared"
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
            proxy.on("error", (err) => {
              // In production, use a logging framework like 'winston' or 'pino' instead of console.log
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
  };
});
