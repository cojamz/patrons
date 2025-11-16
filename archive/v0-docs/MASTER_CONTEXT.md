# Patrons Game - Master Context Document
*Last Updated: January 12, 2025*

## 🎯 Quick Start for AI Assistants

**IMPORTANT**: This is a single HTML file game (react-game.html, ~8000 lines). DO NOT search through the entire file! Use CODE_INDEX.md for navigation.

### Essential Commands
```bash
# Always backup before changes
./backup-game.sh

# Test in debug mode
open "react-game.html?debug=true"

# Deploy
./quick-deploy.js
```

## 📁 Project Overview

### What is Patrons?
- A complete worker placement board game in a SINGLE HTML file
- Built with React (no JSX), Firebase for multiplayer
- 8 resource types across 3 rounds of strategic gameplay
- No build process - just open and play!

### Key Files
- **react-game.html** - The entire game (⚠️ 8000+ lines - use CODE_INDEX.md to navigate!)
- **CODE_INDEX.md** - Line number reference (USE THIS FIRST!)
- **IMPLEMENTATION_SPEC.md** - Complete game rules and mechanics
- **PLAYTEST_BUGS_STATUS.md** - Current known issues

### Architecture
- **Technology**: React without JSX, Firebase Realtime Database
- **Pattern**: Single file, functional components, useReducer for state
- **Multiplayer**: Full state sync with timestamp deduplication
- **Size**: ~8000 lines in one HTML file

## 🎮 Game Mechanics Summary

### Resources (8 types)
- **Red** - Worker manipulation (swap, repeat actions)
- **Yellow** - Resource manipulation (gain any, steal, trade)
- **Blue** - Shop control (toggle, reduce costs, gain benefits)
- **Purple** - Timing/turn order (extra turns, skip turns, play multiple workers)
- **Gold** - Trade flexibility (accepts any color as gold)
- **White** - Victory point trading
- **Black** - Aggressive actions (steal workers/VP)
- **Silver** - End-round bonuses

### Game Flow
1. **3 Rounds** - Each with more workers (4→5→6)
2. **Snake draft** turn order based on VP (lowest first)
3. **Worker placement** + shop purchases
4. **Automatic VP** triggers for certain colors
5. **Game ends** after Round 3 when all workers placed

## 🐛 Common Bug Patterns & Fixes

### Shop Cost Issues
- **Location**: Lines 6550-6590 (auto gem selection)
- **Pattern**: Cost validation in shop purchase handlers
- **Fix approach**: Check `currentPlayer.shopCostModifier`

### Worker Placement
- **Validation**: `canPlaceWorker()` at line 2935
- **Effects**: Clear at END_TURN (line 484) and ADVANCE_ROUND (line 915)
- **Force red**: Only affects OTHER players, not the placer

### Multiplayer Sync
- **Key flags**: `justSyncedFromFirebase`, `isSyncing`, `lastSyncTimestamp`
- **Echo prevention**: Check `lastUpdatedBy === myPlayerId`
- **Stale state**: Always use `currentState` in async operations

### Modal Issues
- **Screen shift**: Fixed with dynamic scrollbar width calculation
- **Pattern**: `showChoice()`, `showGemSelection()`, `selectTargetPlayer()`

## 🔧 Code Patterns

### Resource Updates
```javascript
dispatch({ 
  type: 'UPDATE_RESOURCES', 
  playerId: 0, 
  resources: { red: 5, yellow: 3 } 
});
```

### Action Execution
```javascript
executeAction(gameState, 'actionName', playerId);
// Returns { newState, updates: [] }
```

### Shop Benefits
```javascript
executeShopBenefit(shopColor, shopRound, player, dispatch, state, recursionDepth);
```

### Player Selection
```javascript
selectTargetPlayer(state, currentPlayerId, excludeSelf, dispatch);
```

## 📍 Key Line Numbers (from CODE_INDEX.md)

### Core Systems
- **Game Reducer**: 250-1200
- **Action Execution**: 1700-3500
- **Shop System**: 6500-6950
- **Components**: 6240-7400

### Specific Actions
- UPDATE_RESOURCES: 278
- PLACE_WORKER: 252
- END_TURN: 370-510
- ADVANCE_ROUND: 635-780
- SYNC_GAME_STATE: 1149-1200

### Shop Data
- Costs: 6890-6950
- Purchase handler: 6500-6600
- executeShopBenefit: 5600-5900

### Effects
- Force red placement: 3162-3190
- Double gain removal: 2407, 2494, 2576, 2633, 2668, 2746
- Effect clearing: 484, 541, 915, 1091

## ⚠️ Critical Rules to Remember

1. **NEVER** search through the entire HTML file - use CODE_INDEX.md
2. **ALWAYS** backup before changes: `./backup-game.sh`
3. **TEST** in debug mode: `?debug=true`
4. **DON'T** refactor - the game works, keep it working
5. **CHECK** multiplayer impact of all changes

## 🚨 Current High Priority Issues

### From PLAYTEST_BUGS_STATUS.md:
1. **Multiplayer state desync** - Complex actions cause divergence
2. **Shop benefit execution order** - Some shops execute incorrectly
3. **Game completion detection** - Sometimes triggers prematurely

### Medium Priority:
- Double next gain effect coverage gaps
- Red automatic VP not always triggering
- Shop toggle UI sync in multiplayer
- Purple VP tracking in hover tooltip

## 🛠️ Development Workflow

### Making Changes
1. Read bug description in PLAYTEST_BUGS_STATUS.md
2. Find location in CODE_INDEX.md
3. Read ONLY the relevant section (50-100 lines)
4. Make targeted fix
5. Test in debug mode
6. Check multiplayer impact

### Debugging
```javascript
// Console commands in debug mode
debug.getState()          // View current state
debug.testAction('gain3red', 0)  // Test action
debug.showVPBreakdown()   // VP details
debug.logState()          // Full state dump
```

### Deployment
```bash
# Quick deploy to Netlify
./quick-deploy.js

# Or drag react-game.html to Netlify
```

## 📚 Documentation Files

### Essential Documentation (Keep These):
- **MASTER_CONTEXT.md** (this file) - Primary reference document for AI assistants
- **CODE_INDEX.md** - Line-by-line navigation map for the 8000-line HTML file
- **IMPLEMENTATION_SPEC.md** - Complete game rules, mechanics, and specifications
- **PLAYTEST_BUGS_STATUS.md** - Active bug tracking and status updates
- **DEVELOPER_README.md** - Development patterns, best practices, and workflows
- **COMPLEX_INTERACTIONS.md** - Edge cases and complex game interaction documentation
- **README.md** - Public-facing project description and setup
- **deploy.md** - Deployment instructions and procedures

### File Purposes:
- **Navigation**: Use CODE_INDEX.md to find specific code sections
- **Game Rules**: Check IMPLEMENTATION_SPEC.md for game mechanics
- **Bug Status**: See PLAYTEST_BUGS_STATUS.md for current issues
- **Development**: Follow DEVELOPER_README.md for coding patterns
- **Edge Cases**: Reference COMPLEX_INTERACTIONS.md for tricky scenarios
- **Deployment**: Use deploy.md for publishing updates

### Archived Files:
Older documentation has been moved to `/archive/old-docs-2025-01-12/` including session notes, old bug fixes, and redundant documentation.

## 🎯 How to Use This Document

When starting a new conversation:
1. Have the AI read this file first: `/Users/cory/Patrons/MASTER_CONTEXT.md`
2. Then read `CODE_INDEX.md` for navigation
3. Check `PLAYTEST_BUGS_STATUS.md` for current issues
4. Use debug mode for testing

This document contains everything needed to understand and work on the Patrons game effectively.