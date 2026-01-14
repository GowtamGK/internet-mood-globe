# Fix GitHub Pages 404 Error

## Problem
Getting `404 (Not Found)` for `main.jsx` and other assets on GitHub Pages.

## Solution

The issue is that the build needs to be done with the correct base path. Follow these steps:

### Step 1: Verify Base Path
Check `vite.config.js` - the `base` should match your repository name:
```javascript
base: '/internet-mood-globe/',  // Must match your repo name exactly
```

### Step 2: Clean and Rebuild
```bash
# Remove old build
rm -rf dist

# Rebuild with correct base path
npm run build

# Verify the build - check dist/index.html
# The script tags should have paths like: /internet-mood-globe/assets/...
```

### Step 3: Redeploy
```bash
npm run deploy
```

### Step 4: Verify GitHub Pages Settings
1. Go to your repo: `https://github.com/GowtamGK/internet-mood-globe`
2. Settings → Pages
3. Source: Select `gh-pages` branch
4. Folder: `/ (root)`
5. Save

### Step 5: Clear Browser Cache
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or open in incognito/private window

## Expected Result

After deployment, your app should be accessible at:
```
https://gowtamgk.github.io/internet-mood-globe/
```

The assets should load from:
```
https://gowtamgk.github.io/internet-mood-globe/assets/main-[hash].js
```

NOT from:
```
https://gowtamgk.github.io/src/main.jsx  ❌ (This is wrong)
```

## If Still Not Working

1. **Check the built `dist/index.html`**:
   - After `npm run build`, open `dist/index.html`
   - Look for script tags - they should have paths starting with `/internet-mood-globe/`
   - If they show `/src/main.jsx` or just `/assets/...`, the base path is wrong

2. **Verify repository name**:
   - Your repo is: `GowtamGK/internet-mood-globe`
   - So base should be: `/internet-mood-globe/` ✅

3. **Check gh-pages branch**:
   - Go to: `https://github.com/GowtamGK/internet-mood-globe/tree/gh-pages`
   - Verify `index.html` exists and has correct paths
