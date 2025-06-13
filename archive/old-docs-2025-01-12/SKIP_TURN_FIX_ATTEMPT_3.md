# Skip Turn Fix - Third Attempt

## The Problem:
Players at the ends of snake draft (Player 1 and Player 4) have issues with skip turns not working correctly.

## Current Logic Issues:

### 1. Skip Turn at Reversal Points
- The code correctly identifies reversals with `isSnakeDraftReversal`
- It correctly avoids consuming skips at reversal with `!atReversal`
- BUT: `atReversal` is only set once at the beginning

### Example Scenario:
- Player 4 has 1 skip pending
- Player 4 takes their first turn (going forward)
- At reversal: Player 4 selected again, `atReversal = true`, skip NOT consumed ✓
- But if Player 4 also has no workers, the loop continues
- Next iteration: `atReversal` is still false from initialization
- This could cause issues

### 2. Red R2 Shop Issues
The shop doesn't handle snake draft when finding next player:
```javascript
// Current broken logic:
searchIndex = searchIndex + state.turnDirection;
if (searchIndex >= state.turnOrder.length) {
    break; // Just gives up!
}
```

Should implement snake draft reversal like the main turn logic.

### 3. Red R3 Shop Stopping After One Action
The code looks correct - it has a while loop that should continue. Possible issues:
- State might be getting corrupted after first action
- Modal might be getting hidden
- executeAction might be changing something unexpected

## Proposed Fixes:

### 1. Skip Turn Fix
Reset `atReversal` after we've moved past the reversal player:

```javascript
// After finding next player in the skip logic
if (atReversal && nextPlayer !== state.turnOrder[currentIndex]) {
    atReversal = false; // We've moved past the reversal
}
```

### 2. Red R2 Shop Fix
Implement proper snake draft logic:

```javascript
let searchDirection = state.turnDirection;
while (!nextPlayer && attemptCount < state.players.length) {
    searchIndex = searchIndex + searchDirection;
    
    // Handle snake draft reversal
    if (searchDirection === 1 && searchIndex >= state.turnOrder.length) {
        searchDirection = -1;
        searchIndex = state.turnOrder.length - 1;
    } else if (searchDirection === -1 && searchIndex < 0) {
        searchDirection = 1;
        searchIndex = 0;
    }
    
    // Continue search...
}
```

### 3. Red R3 Shop Investigation
Add logging to see why it stops:
- Log the availableActions array length
- Log the choice made
- Log if state changes between iterations