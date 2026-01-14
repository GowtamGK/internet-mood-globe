import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// For GitHub Pages: base must match your repository name
// For local development: Use base: './' or '/'
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: This must match your GitHub repository name
  // If your repo is 'internet-mood-globe', keep this as '/internet-mood-globe/'
  // If your repo has a different name, change it to '/your-repo-name/'
  base: '/internet-mood-globe/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  // Ensure proper path resolution
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
