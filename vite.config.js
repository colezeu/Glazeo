import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/ofertare/',
  server: {
    proxy: {
      "/admin": "http://localhost:3001",
      "/ai-consultant": "http://localhost:3001",
      "/quote": "http://localhost:3001",
    },
  },
})
