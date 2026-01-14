# GitHub Pages Deployment Guide

This app is fully configured for GitHub Pages deployment. Follow these steps:

## Prerequisites

1. Create a GitHub repository (if you haven't already)
2. Push your code to GitHub

## Deployment Steps

### Option 1: Manual Deployment (Recommended for first time)

1. **Update the base path in `vite.config.js`**:
   - If your repo is named `internet-mood-globe`, keep it as: `base: '/internet-mood-globe/'`
   - If your repo has a different name, change it to: `base: '/your-repo-name/'`
   - If deploying to root domain (username.github.io), use: `base: '/'`

2. **Build and deploy**:
   ```bash
   npm run deploy
   ```

3. **Enable GitHub Pages**:
   - Go to your GitHub repository
   - Click **Settings** → **Pages**
   - Under **Source**, select **gh-pages** branch
   - Click **Save**

4. **Access your site**:
   - Your app will be available at: `https://your-username.github.io/internet-mood-globe/`
   - (Replace `your-username` and `internet-mood-globe` with your actual values)

### Option 2: Automatic Deployment with GitHub Actions

A GitHub Actions workflow will automatically deploy on every push to `main` branch.

1. **Update `vite.config.js` base path** (same as Option 1)

2. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

3. **Enable GitHub Pages** (same as Option 1)

4. The workflow will automatically build and deploy on every push!

## Important Notes

- **Base Path**: Make sure `vite.config.js` has the correct `base` path matching your repo name
- **CORS**: Google Sheets CSV export should work fine (it's public)
- **Google Apps Script**: Make sure your Apps Script web app is deployed with "Anyone" access
- **GeoJSON**: The app will automatically load from CDN if local file is missing

## Troubleshooting

- **404 errors**: Check that `base` path in `vite.config.js` matches your repo name
- **Assets not loading**: Ensure `base` path has trailing slash: `/repo-name/`
- **Build fails**: Run `npm run build` locally first to check for errors
