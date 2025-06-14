# Patrons Game Developer Guide

## 🚀 Quick Start for Development

### Safe Development Workflow
1. **Always backup first**: `./backup-game.sh`
2. **Use debug mode**: Open `react-game.html?debug=true`
3. **Test changes**: Use `dev-tools.html` for isolated testing
4. **Check logs**: Open browser console for detailed logging

### Key Files
- `react-game.html` - The entire game (7964 lines) ⚠️ Handle with care!
- `CODE_INDEX.md` - Line number references for quick navigation
- `IMPLEMENTATION_SPEC.md` - Complete game specification
- `PLAYTEST_BUGS_STATUS.md` - Current known issues

## 🛠️ Development Best Practices

### 1. Making Changes Safely
```bash
# Before any changes
./backup-game.sh

# Test in debug mode
open "react-game.html?debug=true"

# Use dev tools for isolated testing
open dev-tools.html
```

### 2. Finding Code Quickly
Instead of searching through 8000 lines, use the index:
- **Reducer logic**: Lines 250-1300
- **Action execution**: Lines 1700-3500
- **Shop system**: Lines 6500-6950
- **Components**: Lines 6240-7400
- **Game data**: Lines 7425-7530

### 3. Common Patterns

#### Resource Updates
```javascript
dispatch({ 
  type: 'UPDATE_RESOURCES', 
  playerId: 0, 
  resources: { red: 5, yellow: 3 } 
});
```

#### Shop Purchase Flow
1. Check if player can afford (line ~6510)
2. Show gem selection modal if needed (line ~6550)
3. Execute shop benefit (line ~5600)
4. Update resources and state

#### Action Execution
```javascript
executeAction(gameState, 'actionName', playerId);
// Returns { newState, updates: [] }
```

#### Player Selection Pattern (selectTargetPlayer)
```javascript
// Key pattern for actions that target other players
selectTargetPlayer(gameState, currentPlayerId, (selectedPlayerId) => {
  // Callback executes when player is selected
  dispatch({ 
    type: 'EXECUTE_ACTION',
    playerId: currentPlayerId,
    targetPlayerId: selectedPlayerId,
    // ... other params
  });
});
```
This pattern is used for:
- Steal actions (e.g., steal2yellow)
- Give actions (e.g., give1redtake2yellow)
- Any effect requiring player selection

## 🐛 Debugging Tips

### Browser Console Commands
When running with `?debug=true`:
```javascript
// View current game state
debug.getState()

// Test an action
debug.testAction('gain3red', 0)

// Show VP breakdown
debug.showVPBreakdown()

// Log full state
debug.logState()
```

### Common Issues & Solutions

1. **Resources not updating**
   - Check stale closure in Firebase sync (line ~1402)
   - Verify UPDATE_RESOURCES has all fields

2. **Shop costs wrong**
   - Check shop data definition (line ~6890)
   - Verify cost validation logic (line ~6510)
   - Test gem selection modal

3. **Actions not working**
   - Find action in executeAction (lines 1700-3500)
   - Check canPlaceWorker validation
   - Verify occupiedSpaces tracking

4. **Multiplayer sync issues**
   - Check SYNC_GAME_STATE (line ~1149)
   - Verify lastUpdatedBy prevents echo
   - Ensure all state fields are synced

## 🔧 Troubleshooting Multiplayer Sync Issues

### Common Sync Problems

1. **Stale State in Callbacks**
   - **Problem**: Closures capture old state values
   - **Solution**: Use functional setState pattern or refs
   - **Example**: Firebase listeners updating based on old state

2. **Race Conditions**
   - **Problem**: Multiple players updating simultaneously
   - **Solution**: Use `lastUpdatedBy` field to prevent echoes
   - **Check**: Lines ~1149-1160 for sync logic

3. **Missing State Fields**
   - **Problem**: New state fields not included in sync
   - **Solution**: Update SYNC_GAME_STATE to include all fields
   - **Critical fields**: resources, occupiedSpaces, selectedGems, effects

4. **Effect State Persistence**
   - **Problem**: Effects (like force red) persisting incorrectly
   - **Solution**: Clear effects at appropriate times (turn end, action complete)
   - **Check**: Effect clearing logic in reducer

### Debugging Sync Issues

```javascript
// Add logging to track sync
console.log('Pre-sync state:', gameState);
console.log('Incoming update:', update);
console.log('Post-sync state:', newState);

// Check for state divergence
if (localState.turnOrder !== syncedState.turnOrder) {
  console.error('Turn order mismatch!');
}
```

### Best Practices for Multiplayer
- Always update through dispatch, never direct state mutation
- Include playerId in all actions
- Use lastUpdatedBy to prevent update loops
- Test with multiple browser tabs/incognito mode
- Monitor Firebase console for sync patterns

## 📁 File Structure

```
Patrons/
├── react-game.html      # Main game file (DO NOT EDIT WITHOUT BACKUP)
├── index.html          # Entry point
├── dev-tools.html      # Development tools
├── game-logger.js      # Debug logging utility
├── backup-game.sh      # Backup script
├── generate-docs.js    # Documentation generator
│
├── Documentation/
│   ├── CODE_INDEX.md           # Line number quick reference
│   ├── IMPLEMENTATION_SPEC.md  # Full game specification
│   ├── COMPLEX_INTERACTIONS.md # Edge cases and interactions
│   ├── PLAYTEST_BUGS_STATUS.md # Bug tracking
│   └── CLAUDE.md              # AI assistant context
│
└── backups/            # Timestamped backups (auto-created)
```

## 🧪 Testing Approach

### Manual Testing Checklist
- [ ] Each quad's R1/R2/R3 actions work
- [ ] Shop costs are correct
- [ ] Automatic VP triggers properly
- [ ] Resource updates in multiplayer
- [ ] Turn order in snake draft
- [ ] Shop phase restrictions
- [ ] **Force red placement** - Critical to test:
  - [ ] Force red effect applies correctly
  - [ ] Effect clears after placement
  - [ ] Can't place non-red when effect active
  - [ ] Effect persists through UI updates
  - [ ] Multiplayer sync of force red state

### Testing Force Red Placement
```javascript
// Test sequence for force red:
1. Trigger action that sets forceRedPlacement
2. Verify UI shows "Must place red worker" message
3. Try placing non-red worker (should fail)
4. Place red worker (should succeed)
5. Verify effect clears after placement
6. Verify normal placement resumes
```

### Automated Testing (Future)
Currently no automated tests. When adding:
1. Test reducer logic in isolation
2. Test action outcomes
3. Test shop calculations
4. Test multiplayer sync
5. Test effect state management

## 🚨 Critical Areas - Handle with Extra Care

1. **Lines 250-1300**: Game reducer - core state management
2. **Lines 1700-3500**: Action execution - all game logic
3. **Lines 1402-1422**: Firebase sync - multiplayer critical
4. **Lines 6500-6600**: Shop purchases - complex flow

## 🎯 Effect Management

### Understanding Game Effects
Effects are temporary states that modify game behavior. Key effects include:
- `forceRedPlacement`: Player must place a red worker next
- `mustPayResources`: Player must pay specific resources
- `pendingSteal`: Player must select target for steal action

### When Effects Should Clear
1. **After completion**: Effect clears when its requirement is met
2. **Turn end**: Some effects clear at end of turn
3. **Action cancel**: Effects clear if action is cancelled
4. **Never persist**: Effects should never persist to next game

### Effect Management Best Practices
```javascript
// Setting an effect
dispatch({
  type: 'SET_EFFECT',
  playerId: 0,
  effect: { forceRedPlacement: true }
});

// Clearing effects
dispatch({
  type: 'CLEAR_EFFECTS',
  playerId: 0
});

// Check before action
if (gameState.players[playerId].effects?.forceRedPlacement) {
  // Must place red worker
}
```

### Common Effect Bugs
- Effects persisting after completion
- Effects not syncing in multiplayer
- Effects blocking unrelated actions
- Effects not clearing on game reset

## 💡 Performance Considerations

- Game runs entirely client-side
- No build process = instant reload
- React without JSX = larger bundle
- Firebase sync on every state change
- 8000 lines in one file = slow IDE

## 🔮 Future Improvements (Without Breaking)

1. **Add PropTypes** for runtime type checking
2. **Create action constants** to prevent typos
3. **Add state validation** in reducer
4. **Implement action queue** for better multiplayer
5. **Add replay system** for debugging
6. **Create visual state inspector**

Remember: **This game works!** Any changes should preserve that functionality.

## 📚 Lessons Learned from Debugging Sessions

### 1. Stale Closures in React + Firebase
**Problem**: Firebase listeners capture state at creation time, leading to updates based on old data.
**Solution**: Use refs or functional setState to ensure fresh state access.
**Example**: Resource updates were using stale state in Firebase sync callback.

### 2. Effect State Management
**Problem**: Effects like `forceRedPlacement` were persisting incorrectly or not syncing.
**Solution**: Explicitly clear effects after use and include in multiplayer sync.
**Key Learning**: Always test effect lifecycle in both single and multiplayer.

### 3. Player Selection Patterns
**Problem**: Actions requiring player selection had inconsistent implementations.
**Solution**: Standardized on `selectTargetPlayer` pattern for all player-targeting actions.
**Benefits**: Consistent UX, easier debugging, cleaner code.

### 4. State Shape Consistency
**Problem**: Adding new fields (like effects) broke existing code expecting certain shape.
**Solution**: Always initialize new state fields properly, use optional chaining.
**Example**: `player.effects?.forceRedPlacement` instead of `player.effects.forceRedPlacement`

### 5. Multiplayer Testing is Critical
**Problem**: Features working in single-player broke in multiplayer.
**Solution**: Always test with multiple browser tabs during development.
**Tools**: Use incognito mode to simulate different players easily.

### 6. Debug Mode is Essential
**Problem**: Hard to diagnose issues without visibility into state changes.
**Solution**: `?debug=true` mode with comprehensive logging and state inspection.
**Tip**: Add targeted logging for specific issues rather than console.log everywhere.

### 7. Backup Before Major Changes
**Problem**: Complex refactors can break working functionality.
**Solution**: Always run `./backup-game.sh` before significant changes.
**Recovery**: Can quickly revert to working state if needed.

### Key Debugging Techniques That Worked
1. **State Diffing**: Compare state before/after actions to spot issues
2. **Selective Logging**: Log specific state paths rather than entire state
3. **Binary Search**: Comment out half the code to isolate problems
4. **Fresh Eyes**: Sometimes starting fresh with the spec helps more than debugging
5. **User Simulation**: Click through actual game flows rather than just unit testing

### What to Watch Out For
- Resource calculations with gems (complex cost logic)
- Turn order in snake draft (easy to break)
- Shop phase restrictions (many edge cases)
- Effect clearing timing (crucial for game flow)
- Multiplayer state sync (always test with multiple clients)