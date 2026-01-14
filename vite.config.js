import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// IMPORTANT: For GitHub Pages, base MUST match your repository name
// This is used during build to generate correct asset paths
export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages - must be '/internet-mood-globe/' for production
  // For local dev, Vite will handle this automatically
  base: '/internet-mood-globe/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
