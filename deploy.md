# Deployment Guide (v0.5)

## Production Site
**Live URL**: https://cornycolonies.netlify.app/

## Deployment Process

### 1. Local Testing
```bash
# Install dependencies (first time)
npm install

# Start development server
npm run dev

# Open http://localhost:5173 and test thoroughly
```

### 2. Build for Production
```bash
# Create production build
npm run build

# Preview production build locally (optional)
npm run preview
```

This creates an optimized build in the `dist/` directory.

### 3. Deploy to Netlify

#### Option A: Manual Drag & Drop (Recommended)
1. Build the project: `npm run build`
2. Go to https://app.netlify.com/sites/cornycolonies/deploys
3. Drag the entire `dist/` folder to deploy
4. Wait for deployment to complete
5. Test at https://cornycolonies.netlify.app/

#### Option B: Netlify CLI
```bash
# Install Netlify CLI (once)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
npm run build
netlify deploy --prod
```

#### Option C: GitHub Auto-Deploy
1. Connect GitHub repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Push to main branch:
```bash
git add .
git commit -m "Your changes"
git push
```
Netlify will automatically build and deploy.

## Environment Variables

For production deployment, configure environment variables in Netlify:

1. Go to Site Settings → Environment Variables
2. Add Firebase configuration:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_DATABASE_URL`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

**Note**: Do not commit `.env` file to git. Environment variables are configured in Netlify dashboard.

## Firebase Setup

### Configure Firebase Realtime Database
1. Go to https://console.firebase.google.com
2. Select project (or create new)
3. Enable Realtime Database
4. Set database rules for read/write access
5. Copy configuration to `.env` file (local) or Netlify environment variables (production)

### Database Rules Example
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

**Security Note**: For production, implement proper authentication and rules.

## Troubleshooting

### Build Fails
- Check Node version: `node --version` (requires Node 16+)
- Clear cache: `rm -rf node_modules package-lock.json && npm install`
- Check for syntax errors in code

### Deployment Succeeds but Site Broken
- Check browser console for errors
- Verify environment variables are set in Netlify
- Test production build locally: `npm run preview`

### Firebase Connection Issues
- Verify environment variables are correct
- Check Firebase console for database rules
- Ensure database URL uses correct format

## Version History

- **v0.5**: Modern Vite/React architecture (November 2025)
- **v0**: Single HTML file implementation (archived)

## Current Features

- Full multiplayer support via Firebase Realtime Database
- Real-time game synchronization
- Room-based gameplay with codes
- Turn validation for fair play
- 8 resource types with unique mechanics
- Shop system with VP conversion
- Snake draft turn order

---

For development details, see `DEVELOPER_GUIDE.md`.