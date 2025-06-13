# Multiplayer Decision System Fix Guide

## Critical Bug: Undefined showPlayerSelection Function

### Occurrences (9 total calls at these lines):
1. Line 4193 - `blackSteal1VP` - Steal 1 VP from player
2. Line 4254 - `blackSteal2Any` - Steal 2 gems from player  
3. Line 4331 - `blackStealWorker` - Steal a worker from player
4. Line 4528 - `silver2Plus1Others` - Give another player 2 VP
5. Line 6103 - `executeBlack1Shop` - Steal 1 VP (shop)
6. Line 6154 - `executeBlack2Shop` - Steal 3 VP (shop)
7. Line 6221 - `executeBlack3Shop` - Steal 5 VP (shop)
8. Line 6296 - `executeSilver2Shop` - Give another player 4 VP
9. Line 7467 - Silver automatic VP benefit - Give another player 4 VP

### Working Pattern (from yellowSwapResources and redRepeatAll):
```javascript
// Create options array with player info
const playerOptions = otherPlayers.map(p => ({
    label: `Player ${p.id} (${additionalInfo})`,
    value: p.id
}));

// Use showChoice to get player ID
const targetPlayerId = await showChoice(dispatch, 'Choose a player...', playerOptions);

// Find the actual player object
if (targetPlayerId) {
    const targetPlayer = otherPlayers.find(p => p.id === targetPlayerId);
    // ... continue with action
}
```

## Proposed Fix Implementation

### Option 1: Add showPlayerSelection Helper Function
Add this function after showChoice and showConfirm definitions (around line 5320):

```javascript
async function showPlayerSelection(dispatch, title, players, workerInfo = null) {
    if (!players || players.length === 0) {
        return null;
    }
    
    // If only one player, could auto-select (but better to show for clarity)
    const options = players.map(p => ({
        label: `Player ${p.id}${p.name ? ` (${p.name})` : ''}`,
        value: p
    }));
    
    const selected = await showChoice(dispatch, title, options, false, workerInfo);
    return selected;
}
```

### Option 2: Replace All Calls with Direct showChoice Pattern
Replace each `showPlayerSelection` call with the working pattern.

Example fix for line 4193 (blackSteal1VP):
```javascript
// BROKEN:
const targetPlayer = await showPlayerSelection(
    dispatch, 
    'Choose a player to steal 1 VP from', 
    otherPlayers.map(p => ({
        ...p,
        name: `${p.name} (${p.victoryPoints} VP)`
    }))
);

// FIXED:
const playerOptions = otherPlayers.map(p => ({
    label: `Player ${p.id} (${p.victoryPoints} VP)`,
    value: p.id
}));

const targetPlayerId = await showChoice(
    dispatch,
    'Choose a player to steal 1 VP from',
    playerOptions,
    false,
    workerInfo
);

const targetPlayer = targetPlayerId ? otherPlayers.find(p => p.id === targetPlayerId) : null;
```

## Specific Fixes for Each Instance

### 1. Black Steal 1 VP (line 4193)
```javascript
// Shows each player with their current VP
const playerOptions = otherPlayers.map(p => ({
    label: `Player ${p.id} (${p.victoryPoints} VP)`,
    value: p.id
}));
```

### 2. Black Steal 2 Gems (line 4254)
```javascript
// Shows each player with gem counts
const playerOptions = otherPlayers.map(p => {
    const gems = Object.entries(p.resources)
        .filter(([_, amt]) => amt > 0)
        .map(([color, amt]) => `${amt} ${color}`)
        .join(', ') || 'no gems';
    return {
        label: `Player ${p.id} (${gems})`,
        value: p.id
    };
});
```

### 3. Black Steal Worker (line 4331)
```javascript
// Shows each player with worker count
const playerOptions = otherPlayers.map(p => ({
    label: `Player ${p.id} (${p.workers.length} worker${p.workers.length !== 1 ? 's' : ''})`,
    value: p.id
}));
```

### 4. Silver Give 2 VP (line 4528)
```javascript
// Simple player selection
const playerOptions = otherPlayers.map(p => ({
    label: `Player ${p.id}`,
    value: p.id
}));
```

### 5-7. Black Shop Steal VP (lines 6103, 6154, 6221)
Same pattern as #1 but with different VP amounts

### 8. Silver R2 Shop Give 4 VP (line 6296)
Same pattern as #4

### 9. Silver Auto VP Benefit (line 7467)
Same pattern as #4

## Testing Plan

1. **Single Player Mode**
   - Verify no crashes when these actions are taken
   - Auto-selection should work when only 1 other player

2. **Multiplayer Mode**
   - Current player can select target
   - Target sees notification of what happened
   - State syncs properly

3. **Edge Cases**
   - No valid targets (should show message)
   - Player disconnection during selection
   - Cancellation handling

## Additional Considerations

### Modal Visibility Issue
The current modal system only shows to current player:
```javascript
state.modal && (!state.roomCode || state.myPlayerId === state.currentPlayer)
```

This is actually CORRECT for the current architecture where only the active player makes decisions. However, we should add:

1. **Notification System** - Show non-modal notifications to affected players
2. **Action Log Enhancement** - Make it clearer what's happening to you
3. **Visual Indicators** - Highlight when you're being targeted

### Future Enhancement: Reaction System
Consider adding a reaction phase where targeted players can:
- Use defensive abilities
- Make counter-offers  
- At minimum, acknowledge what happened

But this would be a major architectural change and should be planned carefully.