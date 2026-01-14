import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// For GitHub Pages: Update base to '/your-repo-name/' before deploying
// For local development: Use base: '/'
export default defineConfig({
  plugins: [react()],
  // Change this to your GitHub Pages repo name, or '/' for local dev
  base: '/internet-mood-globe/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
