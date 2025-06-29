import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mapbox: ['mapbox-gl'],
          router: ['react-router-dom']
        }
      }
    },
    // Increase chunk size warning limit to 2000kb to eliminate warnings (Mapbox is ~1.5MB)
    chunkSizeWarningLimit: 2000
  },
  server: {
    port: 3000,
    host: true
  }
})
