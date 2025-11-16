# v0 Scripts Archive

This directory contains scripts and utilities from the v0 monolithic implementation.

## Files

### Backup & Deployment
- **backup-game.sh** - Backed up the single react-game.html file (no longer needed with git)
- **deploy.sh** - Old deployment script (replaced by `npm run build`)
- **quick-deploy.js** - Quick deployment utility (replaced by Vite build)
- **github-upload.js** - GitHub upload script (replaced by standard git workflow)

### Setup Scripts (One-time use)
- **setup-github.sh** - Initial GitHub repository setup
- **install-brew.sh** - Homebrew installation script

### Utilities
- **game-logger.js** - v0 game logging utility (replaced by browser console)
- **generate-docs.js** - v0 documentation generator
- **convert-to-jsx.js** - Migration script used to convert v0 to v0.5 (completed)

## Why Archived?

These scripts were designed for the v0 single-file workflow. The v0.5 implementation uses:
- **Vite** for building and development (`npm run dev`, `npm run build`)
- **Git** for version control (no need for manual backups)
- **Standard npm scripts** for deployment
- **Modern tooling** built into the development environment

## Historical Value

These scripts demonstrate:
- The v0 development workflow
- How we managed a single-file application
- The migration process from v0 to v0.5
- Creative solutions for working without a build system

**Note**: These scripts are not maintained and may not work with the current project structure.
