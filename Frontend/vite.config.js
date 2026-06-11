import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://10.62.179.92:8000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://10.62.179.92:8000/api/docs',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
