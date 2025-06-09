# Purple Skip Turn Fix for Snake Draft

## Bug Analysis

### The Problem
When Player 4 uses `gain4purpleSkip` in their first turn:
1. They correctly get 4 purple and skipTurns[4] = 1
2. In snake draft, after P4's turn, direction reverses (1→2→3→4→**4**→3→2→1)
3. The bug: When reversing at the end, the code sets `nextPlayer = state.turnOrder[currentIndex]` (same player)
4. This causes P4 to play again immediately, consuming their skip
5. So P4 plays twice in a row instead of skipping their second turn

### The Code Issue (Lines 574-587)
```javascript
if (state.turnDirection === 1) {
    if (currentIndex === state.turnOrder.length - 1) {
        nextDirection = -1;
        nextPlayer = state.turnOrder[currentIndex]; // BUG: Same player!
    } else {
        nextPlayer = state.turnOrder[currentIndex + 1];
    }
} else {
    if (currentIndex === 0) {
        nextDirection = 1;
        nextPlayer = state.turnOrder[currentIndex]; // BUG: Same player!
    } else {
        nextPlayer = state.turnOrder[currentIndex - 1];
    }
}
```

## The Fix

Replace the snake draft logic in END_TURN (around lines 574-587):

```javascript
if (state.turnDirection === 1) {
    if (currentIndex === state.turnOrder.length - 1) {
        // At the end, reverse direction and go to previous player
        nextDirection = -1;
        nextPlayer = state.turnOrder[currentIndex - 1];
    } else {
        nextPlayer = state.turnOrder[currentIndex + 1];
    }
} else {
    if (currentIndex === 0) {
        // At the beginning, reverse direction and go to next player
        nextDirection = 1;
        nextPlayer = state.turnOrder[currentIndex + 1];
    } else {
        nextPlayer = state.turnOrder[currentIndex - 1];
    }
}
```

## Testing the Fix

1. Start a 4-player game with snake draft
2. Have P4 use `gain4purpleSkip` in their first turn
3. Turn order should be: 1→2→3→4→3→2→1→2→3→**3**→4 (P4 skipped)
4. P4's second turn should be skipped properly

## Additional Considerations

The skip logic itself (lines 594-596) looks correct:
```javascript
if (tempSkippedTurns[nextPlayer] > 0) {
    skippedPlayers.push(nextPlayer);
    tempSkippedTurns[nextPlayer]--;
}
```

The issue is purely in the snake draft direction reversal logic.