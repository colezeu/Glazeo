import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_BASE_PATH: setează '/ofertare/' pentru deploy pe subdirector (glass.associates/ofertare/)
// Lasă gol pentru deploy la rădăcină (glazeo.vercel.app)
const BASE = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  base: BASE,
  plugins: [react()],
  server: {
    proxy: {
      "/admin": "http://localhost:3001",
      "/ai-consultant": "http://localhost:3001",
      "/quote": "http://localhost:3001",
    },
  },
})
