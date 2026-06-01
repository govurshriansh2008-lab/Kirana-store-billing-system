import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/Kirana-store-billing-system/',
  logLevel: 'info',
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  plugins: [
    react(),
  ]
});
