# Debugging Strategy for Patrons Game

## Issues Found During Playtesting

### 1. ❌ Shop Cost Reduction Applied Globally
- **Issue**: When one player uses "Reduce Shop Costs", ALL players get the discount
- **Root Cause**: `shopCostModifier` is stored globally in state, not per-player
- **Fix**: Move to player-specific modifier

### 2. ✅ Yellow Gain 3* Not Updating (Actually Working)
- **Investigation**: The action correctly uses `showGemSelection` and `UPDATE_RESOURCES`
- **Likely Issue**: Multiplayer sync delay or UI not refreshing
- **Solution**: Test with multiplayer-test.html to verify sync

### 3. ❌ Skip Turns Not Working in Snake Draft
- **Issue**: Players with skip turns aren't being skipped properly
- **Investigation**: Skip turn increments correctly, but turn processing may have issues
- **Focus**: Lines 610-640 in END_TURN handler

### 4. ✅ Play 2 Workers Edge Case (Fixed)
- **Issue**: Players couldn't end turn when out of workers
- **Fix**: Changed validation to allow ending turn when workers to place but none available

## Automated Testing Strategy

### 1. Multiplayer Test Suite (`multiplayer-test.html`)
- Opens two game instances side-by-side
- Automatically creates/joins rooms
- Tests state synchronization
- Verifies actions propagate correctly
- Checks for race conditions

### 2. Debug Mode (`?debug=true`)
- Exposes `debugGetState()` - Get current game state
- Exposes `debugDispatch(action)` - Send actions directly
- Enables console logging
- Stores state/dispatch references

### 3. Key Test Scenarios
1. **Resource Sync**: Player gains resources → verify both players see update
2. **Worker Placement**: Place worker → verify occupiedSpaces syncs
3. **Shop Purchase**: Buy shop → verify purchase state syncs
4. **Turn Order**: End turn → verify currentPlayer updates correctly
5. **Skip Turns**: Activate skip → verify skip count and turn skipping
6. **Round Advancement**: Advance round → verify all state resets properly

## Remaining High-Priority Bugs

### 1. Shop Cost Reduction (Global vs Per-Player)
**Current Implementation**:
```javascript
// Line 245: Global state
shopCostModifier: 0

// Line 1148: Global update
case 'ADD_SHOP_COST_MODIFIER':
    return { ...state, shopCostModifier: state.shopCostModifier + action.modifier };

// Lines 6754, 7358: Global usage
anyRequired = Math.max(0, anyRequired + state.shopCostModifier)
```

**Fix Required**:
- Add `shopCostModifier` to each player object
- Update cost calculations to use current player's modifier
- Reset per-player modifiers on round advancement

### 2. Skip Turn Processing
**Investigation Needed**:
- Verify skip count increments (✓ Working)
- Check turn order processing (Lines 610-640)
- Test snake draft reversals with skips
- Verify multiplayer sync of skippedTurns

### 3. Force Red Placement
**Not Yet Investigated**:
- Players report can't select red when forced
- Check `canPlaceWorker` validation
- Verify force effect is active

## Testing Workflow

1. **Local Testing**:
   ```bash
   # Open test suite
   open multiplayer-test.html
   
   # Create room and run automated tests
   # Check console for state differences
   ```

2. **Manual Debug Testing**:
   ```bash
   # Open game with debug mode
   open "react-game.html?debug=true"
   
   # In console:
   debugGetState() // View current state
   debugDispatch({ type: 'ADD_LOG', message: 'Test' }) // Send actions
   ```

3. **Production Testing**:
   - Deploy to Netlify
   - Test with real multiplayer connections
   - Monitor browser console for errors

## Next Steps

1. **Fix Shop Cost Reduction** - Make it player-specific
2. **Debug Skip Turns** - Add logging to turn processing
3. **Test Force Red** - Verify placement validation
4. **Enhance Test Suite** - Add more edge case tests
5. **Add State Validation** - Detect inconsistent states early

## State Sync Architecture Issues

The current architecture syncs entire game state on every change, which can cause:
- Race conditions when multiple players act simultaneously  
- Stale state overwrites
- Large Firebase writes

Consider moving to action-based sync:
- Only sync the action taken
- Each client applies the action locally
- Reduces data transfer and conflicts