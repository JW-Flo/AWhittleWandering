import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
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
          'map-vendor': ['mapbox-gl'],
          // App chunks  
          'components': [
            './src/components/AdminPortal.tsx',
            './src/components/PublicApp.tsx',
            './src/components/TeslaMap.tsx',
            './src/components/TimelineDataDisplay.tsx'
          ],
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
