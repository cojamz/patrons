# Quick Deploy Guide

## Production Site
**Live URL**: https://cornycolonies.netlify.app/
**Legacy URL**: https://cornycolonies.netlify.app/react-game.html (redirects to root)

## Option 1: Manual Netlify Deploy (Recommended)
1. Make changes to the code
2. Test locally: `npm run dev` (opens at http://localhost:5173)
3. Build: `npm run build`
4. Go to https://app.netlify.com/sites/cornycolonies/deploys
5. Drag the entire `dist/` folder to deploy
6. Share the URL with friends

## Option 2: GitHub Auto-Deploy
```bash
# Setup once
git init
git add .
git commit -m "Initial game"
git remote add origin https://github.com/yourusername/worker-placement-game.git
git push -u origin main

# For each update
git add react-game.html
git commit -m "Update: describe your changes"
git push
# Automatically deploys to GitHub Pages
```

## Option 3: Quick Netlify Drop
- Go to https://app.netlify.com/drop
- Drag both files
- Get new URL
- Share with friends

## Current Version Notes
- Added full multiplayer support
- Real-time game synchronization
- Room-based gameplay with codes
- Turn validation for fair play

## Firebase Setup (for persistent multiplayer)
1. Go to https://console.firebase.google.com
2. Create new project
3. Enable Realtime Database
4. Replace config in react-game.html
5. Set database rules to public read/write