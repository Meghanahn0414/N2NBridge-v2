import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 3000,
    strictPort: false,
    proxy: {
      // ── Backend API ────────────────────────────────────────────────────
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        followRedirects: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },

      // ── Citizen Mobile App (Expo web on port 19006) ────────────────────
      // Access at: http://localhost:3000/citizen/
      '/citizen': {
        target: 'http://127.0.0.1:19006',
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => path.replace(/^\/citizen/, ''),
      },
      '/assets': {
        target: 'http://127.0.0.1:19006',
        changeOrigin: true,
        secure: false,
      },
      '/node_modules/expo-router/entry.bundle': {
        target: 'http://127.0.0.1:19006',
        changeOrigin: true,
        secure: false,
      },
      '/_expo': {
        target: 'http://127.0.0.1:19006',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/__metro': {
        target: 'http://127.0.0.1:19006',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/hot': {
        target: 'http://127.0.0.1:19006',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/message': {
        target: 'http://127.0.0.1:19006',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})
