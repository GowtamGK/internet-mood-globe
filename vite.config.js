import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Base path for GitHub Pages - must match repository name
const isProduction = process.env.NODE_ENV === 'production'
const base = isProduction ? '/internet-mood-globe/' : '/'

export default defineConfig({
  plugins: [react()],
  base: base,
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
