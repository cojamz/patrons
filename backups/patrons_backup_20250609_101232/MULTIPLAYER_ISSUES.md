# Multiplayer-Specific Issues to Check

## Fixed Issues:
1. ✅ **Modal shown to all players** - Fixed by adding check `(!state.roomCode || state.myPlayerId === state.currentPlayer)`
   - This was causing yellow gain actions to fail because modal was resolving on wrong client

## Potential Issues to Investigate:

### 1. **Round Transition Modal**
- Currently only shows to current player after our fix
- Might want all players to see round transition?
- Location: handleAdvanceRound function

### 2. **State Sync Race Conditions**
- useEffect syncs on every state change
- Multiple players might trigger conflicting updates
- No debouncing or batching of sync operations

### 3. **Shop Benefits with Modals**
- Any shop benefit that shows a modal (gem selection, player choice) might have same issue
- Examples: Yellow shops, steal actions, etc.

### 4. **Win Screen Timing**
- All players see win screen when gameOver = true
- But who sets gameOver? Could have race condition

### 5. **Effect Activation**
- Some effects show buttons only to current player
- But effect state is synced - could cause confusion

### 6. **Automatic VP Calculations**
- Correctly checks if quad is in game
- But runs for all players on every END_TURN

## Testing Checklist:
- [ ] Yellow gain actions work for all players in multiplayer
- [ ] Purple extra turn works correctly
- [ ] Shop purchases show modals only to purchasing player
- [ ] Round transitions work smoothly
- [ ] No duplicate VP calculations
- [ ] Effects activate correctly for right player