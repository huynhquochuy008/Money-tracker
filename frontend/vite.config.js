import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    // Allow all hosts (needed for localtunnel / ngrok)
    allowedHosts: true,
    proxy: {
      // Forward all /api/* calls to the Flask backend
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
