# Bug Fix Guide - Using CODE_INDEX.md

## How to Fix Each Issue Efficiently

### 1. Force Red Placement Breaking
**Location**: Line 1684-1706 (canPlaceWorker validation)
**Fix**: Check if red layer exists before forcing placement
```javascript
// Around line 1690, add:
if (forceRedPlacement && !gameLayers.includes('red')) {
  return false; // Can't force red if no red quad
}
```

### 2. Yellow Gain with Extra Workers
**Location**: Line 1860 (gain3yellow action)
**Issue**: Using wrong playerId after modal selection
**Fix**: Use state.currentPlayer not activePlayer
```javascript
// In showGemSelection callback:
playerId: state.currentPlayer // not gameState.currentPlayer
```

### 3. Purple R1 Shop Cost
**Location**: Line 6510-6590 (shop purchase validation)
**Issue**: Cost checking logic for "any" gems
**Fix**: Verify cost structure matches shop data (line 6892)

### 4. Actions Not Clearing Between Rounds
**Location**: Line 635-780 (ADVANCE_ROUND)
**Fix**: Ensure occupiedSpaces is reset
```javascript
occupiedSpaces: {} // Must be empty object, not undefined
```

### 5. Gain * (Star) Not Working
**Search**: grep for "gain.*any" or "⭐" in executeAction
**Location**: Likely in yellow/gold gain actions
**Fix**: Ensure modal selections properly update resources

### 6. Skip Turn in Snake Draft
**Location**: Line 430-480 (END_TURN skip logic)
**Fix**: Check snake draft direction when skipping

### 7. Red Shop Repeat Not Giving Resources
**Location**: Line 5644 (Red R1 shop benefit)
**Issue**: Using stale player state after cost deduction
**Fix**: Re-fetch player state before executeAction

### 8. Blue/Red Automatic VP
**Locations**: 
- Line 5109 (shop benefit execution)
- Line 6756 (regular shop purchase)  
- Line 7256 (victory shop purchase)
**Fix**: Check automaticVPs.blue/red properly

### 9. R2/R3 Shops for Player 1
**Location**: Line 6450-6650 (CompactShop component)
**Fix**: Check shop visibility logic for player index

### 10. Round Advance Double-Click
**Location**: Line 1149-1200 (SYNC_GAME_STATE)
**Fix**: Add debouncing or state check

## Quick Debug Commands

```javascript
// In console with ?debug=true

// Check force red state
debug.getState().forceRedPlacement

// Check shop costs
debug.getState().shopCostModifier

// Check automatic VPs
debug.getState().automaticVPs

// Test resource update
debug.testAction('gain3yellow', 0)

// Check occupied spaces
debug.getState().occupiedSpaces
```

## Common Fix Patterns

### Pattern 1: Resource Updates with Extra Workers
```javascript
// Wrong:
dispatch({ type: 'UPDATE_RESOURCES', playerId: currentPlayer, resources });

// Right:
const actualPlayer = state.workersToPlace > 1 ? state.currentPlayer : currentPlayer;
dispatch({ type: 'UPDATE_RESOURCES', playerId: actualPlayer, resources });
```

### Pattern 2: Shop Cost Validation
```javascript
// Check for "any" costs properly
const anyNeeded = cost.any || 0;
const specificCosts = Object.entries(cost).filter(([key]) => key !== 'any');
// Validate specific costs first, then check for any
```

### Pattern 3: Firebase Sync
```javascript
// Ensure all state fields are included
syncGameState({
  ...gameState,
  occupiedSpaces: gameState.occupiedSpaces || {},
  automaticVPs: gameState.automaticVPs || {},
  // Don't forget new fields!
});
```

## Testing Each Fix

1. **Backup first**: `./backup-game.sh`
2. **Open debug mode**: `react-game.html?debug=true`
3. **Test specific scenario** in dev-tools.html
4. **Check multiplayer sync**
5. **Verify no regressions**