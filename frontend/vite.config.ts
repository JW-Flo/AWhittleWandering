import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "localhost",
    port: 8081,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        secure: false
      }
    }
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react', '@radix-ui/react-slot', 'class-variance-authority', 'clsx', 'tailwind-merge'],
          // Removed monolithic 'map-vendor' to allow Rollup to tree-shake and split mapbox submodules further
          // App chunks
          'components': [
            './src/components/AdminPortal.tsx'
          ],
          'map-component': ['./src/components/TeslaMap.tsx'],
          'hooks-utils': [
            './src/hooks/useUnifiedApiData.ts',
            './src/utils/temperature.ts',
            './src/utils/dateHelpers.ts'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB
    sourcemap: false, // Disable sourcemaps in production to reduce size
    minify: 'terser', // Use terser for better minification
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true
      }
    }
  }
});