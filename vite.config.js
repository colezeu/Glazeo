import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  server: {
    proxy: {
      "/admin": "http://localhost:3001",
      "/ai-consultant": "http://localhost:3001",
      "/quote": "http://localhost:3001",
    },
  },
})
