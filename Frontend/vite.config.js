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

      // ── Citizen Mobile App (Expo web on port 8081) ────────────────────
      // Access at: http://localhost:3000/citizen/
      // NO rewrite — Expo Router reads window.location.pathname (the browser URL),
      // not the proxied HTTP path.  They must match, so forward /citizen/... as-is.
      '/citizen': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
        secure: false,
        ws: true,                        // forward WebSocket (Expo HMR)
      },
      // Expo static assets (fonts, images)
      '/assets': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
        secure: false,
      },
      // Expo's JS bundle (served at an absolute path from Expo's HTML)
      '/node_modules/expo-router/entry.bundle': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
        secure: false,
      },
      // Expo's internal asset/bundle paths
      '/_expo': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/__metro': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      // Expo HMR WebSocket
      '/hot': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      // App message/notification WebSocket
      '/message': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})
