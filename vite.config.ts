import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  appType: 'spa',
  server: {
    port: 5173
  },
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    exclude: ['shiki']
  }
})
