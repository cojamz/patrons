# v0 Monolith Archive

This directory contains the original v0 monolithic HTML file implementation of Patrons.

## Files

- **react-game.html** (9,459 lines) - The complete game in a single HTML file
- **dev-tools.html** - v0 debugging and testing tools
- **multiplayer-test.html** - v0 multiplayer testing interface
- **patrons-enhanced.html** - Variant or test version
- **test-fixes.html** - Old test file

## Historical Context

The original Patrons v0 was built as a single HTML file containing:
- Complete React application (using React.createElement, no JSX)
- All game logic (8 resource types, worker placement, shops)
- Firebase multiplayer integration
- Complete UI with Tailwind CSS via CDN
- ~9,459 lines of JavaScript in one file

This was a technical achievement demonstrating what's possible with modern web APIs, but became difficult to maintain as the project grew.

## Migration to v0.5

The project was successfully migrated to a modern Vite/React structure in November 2025:
- Converted to JSX syntax
- Split into modular files in `src/` directory
- Added proper build tooling with Vite
- Implemented testing with Vitest
- Improved developer experience with hot reload

The current implementation is in the root `src/` directory.

## Why Keep This?

These files are preserved for:
- Historical reference
- Understanding the evolution of the project
- Potential reference for complex interactions that work in v0
- Demonstrating the original "single file" concept

**Note**: These files are not maintained and may not run correctly with current Firebase configuration.
