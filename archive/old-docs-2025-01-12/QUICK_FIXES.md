# Quick Fix Patterns

## 1. Purple R1 Shop Cost Fix
**Problem**: Taking 2 purple instead of 1 purple + 2 any
**Quick Fix**: 
```javascript
// Line 6555 - Check if this is excluding too many purple
availableForAny[color] = Math.max(0, availableForAny[color] - colorRequired);
```

## 2. Blue Auto VP Fix
**Problem**: Not triggering on shop use
**Quick Fix**: Add after ANY shop purchase
```javascript
// Add at line 6600, 5200, 7100
if (state.automaticVPs?.blue) {
    dispatch({ type: 'UPDATE_VP', playerId: state.currentPlayer, vp: 1, source: 'blueAutomatic' });
}
```

## 3. Force Red Fix
**Problem**: Can't select red actions
**Line 1695**: 
```javascript
// Change from:
const redLayer = state.gameLayers.find(layer => layer.color === 'red');
// To:
const redLayer = state.gameLayers.red;
```

## 4. Shop Toggle Sync
**Add to syncGameState** (line 1570):
```javascript
closedShops: currentState.closedShops,
```

## 5. Skip Turn Snake Draft
**Line 430-450**: Check if skippedTurns is being decremented twice

## Meta Approach for Faster Fixes:

### 1. Use the Index
- Don't search, go directly to line numbers
- Use CODE_INDEX.md for navigation

### 2. Pattern Recognition
- Most shop bugs: Check lines 6500-6600
- Most VP bugs: Check automaticVPs usage
- Most sync bugs: Check SYNC_GAME_STATE

### 3. Quick Validation
```javascript
// Add debug line to verify issue:
console.log('PURPLE_SHOP_DEBUG:', { colorRequired, availableForAny, playerResources });
```

### 4. Batch Fixes
- Fix multiple related issues at once
- Test once after batch

### 5. Common Gotchas
- state.gameLayers is object, not array
- Player IDs start at 1, array index at 0
- Firebase echoes need prevention
- Modals need multiplayer check