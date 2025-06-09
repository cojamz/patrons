# Playtest Issue Analysis - January 9, 2025

## Issue Categories

### 🔴 Critical Game-Breaking Issues (Fix First)
1. **Force red placement breaks the game** - Players can't even select red actions
2. **Yellow quadrant "straight up not working in multiplayer"** - Major functionality broken
3. **Actions not clearing between rounds** - Fundamental game flow issue
4. **Gain * (star) not adding resources** - Core mechanic broken
5. **Purple R1 shop taking wrong resources** (2 purple instead of 1 purple + 2 any)

### 🟡 High Priority - Game Logic Issues
6. **Extra workers + resource gain bug** - gain3yellow doesn't update after using extra workers
7. **Purple skip turn not working in snake draft**
8. **Red shop repeat action not giving resources**
9. **Blue/Red automatic VP not triggering** from shops
10. **R2/R3 shops not showing for Player 1**
11. **Round advance double-click** causing skip to Round 3
12. **Shop cost modifiers** - Reduce should be player-specific, increase affects all

### 🟢 Medium Priority - UI/UX Issues
13. **Shop state persistence** between rounds (except natural R2/R3 openings)
14. **Shop toggle UI sync** across players
15. **Red swap workers UI** - Should select actions not players
16. **Action cancellation** should undo worker placement
17. **Extra turn validation** - Error when no workers available
18. **VP source tracking** - Purple VP not showing in tooltip
19. **Player cards order** - Should match turn order

### 🔵 Design Issues
20. **Blue/Red infinite loop** - R1 blue shop → Red shop → Repeat

## Root Cause Analysis

### 1. State Synchronization Issues
- Many issues stem from Firebase sync problems (partially fixed)
- Local state vs synced state mismatches
- Stale closures in event handlers

### 2. Validation Logic Gaps
- Missing checks for worker availability
- Force red placement validation broken
- Shop cost calculations incorrect

### 3. UI State Management
- Modal selections not properly connected to state updates
- Cancellation logic incomplete
- Multi-player UI updates not propagating

### 4. Game Flow Logic
- Round transitions not clearing state properly
- Shop persistence logic missing
- Turn order complications with extra workers

## Recommended Fix Order

### Phase 1: Critical Fixes (Game Unplayable)
1. Fix force red placement validation
2. Fix Yellow quadrant in multiplayer
3. Fix actions clearing between rounds
4. Fix Gain * resource updates
5. Fix Purple R1 shop cost calculation

### Phase 2: Core Mechanics (Game Playable but Buggy)
6. Fix extra workers + resource selection
7. Fix shop repeat actions giving resources
8. Fix automatic VP from shops
9. Fix skip turn in snake draft
10. Fix round advance synchronization

### Phase 3: Polish (Game Fully Functional)
11. Shop state persistence
12. UI synchronization improvements
13. Validation messages
14. VP tracking completeness
15. Visual polish

## Technical Patterns to Address

### Resource Update Pattern Fix
```javascript
// Current (broken with extra workers)
dispatch({ type: 'UPDATE_RESOURCES', playerId: currentPlayer, resources });

// Should be
dispatch({ 
  type: 'UPDATE_RESOURCES', 
  playerId: state.actualCurrentPlayer || currentPlayer, 
  resources 
});
```

### Shop Cost Validation Fix
```javascript
// Purple R1 shop should check:
cost: { purple: 1, any: 2 }
// Not just purple: 2
```

### Force Red Validation
```javascript
// Add to canPlaceWorker:
if (state.forceRedPlacement && !state.gameLayers.includes('red')) {
  return false; // No red quad available
}
if (state.forceRedPlacement && quadrant !== 'red') {
  return { error: 'Must place on red quad!' };
}
```

## Testing Priorities
1. Multiplayer with 4 players
2. All quadrants enabled
3. Shop purchases in each round
4. Worker manipulation actions
5. Resource gains with extra workers