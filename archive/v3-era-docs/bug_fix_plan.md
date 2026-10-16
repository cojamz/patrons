# Bug Fix Implementation Plan

**Created**: 2025-11-16
**Status**: Awaiting Approval

## Overview

Six bugs/issues identified during production testing. Prioritized by severity and user impact.

---

## Bug Summary

### 🔴 CRITICAL (Must Fix)
1. **Red R2 Shop Dual Implementation Bug** - Two conflicting code paths

### 🟡 HIGH PRIORITY (UX Issues)
2. **Phase Indicator Wording** - "(X remaining)" is misleading
3. **Blue R1 Shop Selector** - Shows full descriptions instead of simple names
4. **Round Scorecard Missing VP Breakdown** - Infrastructure exists but unused
5. **Red R3 Shop Modal Confusion** - Shows all players but says "your actions"

### 🟢 LOW PRIORITY (Verification)
6. **Purple Skip Turn Action** - Needs user verification (appears working)

---

## Files to Modify

- `/Users/cory/Cursor Projects/Patrons/src/App.jsx` - All fixes

---

## Implementation Steps

### Step 1: Fix Phase Indicator Wording (QUICK WIN)
**Priority**: HIGH
**Complexity**: Low
**Lines**: 6063-6082

**Current text**: `"Place Worker (${state.workersToPlace} remaining)"`

**Problem**: "remaining" is vague - could mean actions, turns, slots, etc.

**Proposed rewording options**:
- Option A: `"Workers to Place: ${state.workersToPlace}"`
- Option B: `"Place Workers (${state.workersToPlace} left)"`
- Option C: `"Worker Placement (${state.workersToPlace} to go)"`
- **Recommended**: Option A (clearest and most direct)

**Changes**:
```javascript
if (state.workersToPlace > 0) {
    phaseText = `Workers to Place: ${state.workersToPlace}`;
    phaseColor = 'bg-blue-100 text-blue-800';
}
```

**Tests**:
- Start game, verify badge shows "Workers to Place: 3"
- Place worker, verify count decrements
- No regression in other phases

**Estimated time**: 2 minutes

---

### Step 2: Simplify Blue R1 Shop Selector (UX FIX)
**Priority**: HIGH
**Complexity**: Low
**Lines**: 4677-4721

**Current**: Shows full shop descriptions like "Repeat a worker's action - Cost: 1🔴+2⭐"

**Problem**: User is toggling shop status, not using the benefit - doesn't need full description

**Proposed fix**:
```javascript
// Simplified options - just color, round, and status
const shopOptions = [];

for (const color of allColors) {
    // R1 shops
    const isClosedR1 = closedShops?.[color]?.[1] || false;
    shopOptions.push({
        label: `${colorEmojis[color]} R1 ${isClosedR1 ? '🔒 Closed' : '✓ Open'}`,
        value: `${color}-1`
    });

    // R2 shops (if round >= 2)
    if (state.round >= 2) {
        const isClosedR2 = closedShops?.[color]?.[2] || false;
        shopOptions.push({
            label: `${colorEmojis[color]} R2 ${isClosedR2 ? '🔒 Closed' : '✓ Open'}`,
            value: `${color}-2`
        });
    }

    // R3 shops (if round >= 3)
    if (state.round >= 3) {
        const isClosedR3 = closedShops?.[color]?.[3] || false;
        shopOptions.push({
            label: `${colorEmojis[color]} R3 ${isClosedR3 ? '🔒 Closed' : '✓ Open'}`,
            value: `${color}-3`
        });
    }
}
```

**Benefits**:
- Clearer purpose (toggling status, not using benefit)
- Faster scanning (emoji + status only)
- Less visual clutter

**Tests**:
- Purchase Blue R1 shop
- Verify selector shows simple "🔴 R1 ✓ Open" format
- Toggle a shop, verify status changes
- Verify all rounds show correctly

**Estimated time**: 10 minutes

---

### Step 3: Add VP Breakdown to Round Scorecard (UX ENHANCEMENT)
**Priority**: HIGH
**Complexity**: Medium
**Lines**: 3915-3918 (current VP display), 6678-6691 (unused breakdown function)

**Current**: Shows only total VP (e.g., "42 VP")

**Problem**: Players can't see WHERE their points came from

**Solution**: Use existing `getVPBreakdownDisplay()` function (currently unused)

**Changes**:
```javascript
// In RoundTransitionModal, replace simple VP display with breakdown
React.createElement('div', {
    key: 'vp-section',
    className: 'space-y-1'
}, [
    // Total VP (bold)
    React.createElement('div', {
        key: 'total',
        className: 'text-xl font-bold text-green-600'
    }, `${player.victoryPoints} VP`),

    // VP Breakdown (using existing function)
    getVPBreakdownDisplay(player)
])
```

**VP Breakdown Display Format** (from existing function):
```
🔴 Red Actions: 3 VP
🟡 Resource Diversity: 2 VP
🔵 Shop Usage: 5 VP
⭐ Gold Auto VP: 1 VP
Total: 11 VP
```

**Tests**:
- Play a round, earn VP from multiple sources
- Advance to next round
- Verify scorecard shows breakdown
- Verify all VP sources display correctly
- Check with 0 VP sources (new player)

**Estimated time**: 15 minutes

---

### Step 4: Fix Red R2 Shop Dual Implementation (CRITICAL BUG)
**Priority**: CRITICAL
**Complexity**: Medium
**Lines**: 5403-5405 (active), 6457-6463 (passive)

**Problem**: Two conflicting implementations:
1. **Active path** (line 5403): Immediately calls `executeRed2Shop()` ✓ WORKS
2. **Passive path** (line 6461): Adds effect "Can place next player's worker" ✗ NEVER USED

**Root Cause Analysis**:
- Line 5403 is in `executeShopBenefit()` switch (regular shop purchase)
- Line 6461 is in `handlePurchase()` switch (likely old code path)
- Passive effect is set but never checked/triggered anywhere
- Effect is just cleaned up at turn end (dead code)

**Decision Required**: Which implementation to keep?

**Recommended**: Keep ACTIVE implementation (executeRed2Shop)
- Already working correctly
- Places worker immediately
- Executes action for next player
- Sends multiplayer notification
- Clean, predictable behavior

**Fix**: Remove passive implementation entirely

**Changes**:
```javascript
// In handlePurchase(), REMOVE lines 6457-6463:
case 'red2':
    dispatch({
        type: 'ADD_EFFECT',
        playerId: currentPlayer.id,
        effect: 'Can place the next player\'s worker'
    });
    break;

// Keep the active implementation at line 5403-5405 (no change)
case 'red2':
    await executeRed2Shop(player, dispatch, state);
    break;
```

**Also remove effect cleanup** (no longer needed):
- gameReducer.js line 300
- gameReducer.js line 372

**Tests**:
- Purchase Red R2 shop
- Verify modal shows next player's available actions
- Choose action, verify it places and executes for next player
- Check multiplayer: other player sees notification
- Verify no "Can place next player's worker" effect lingers

**Estimated time**: 20 minutes

---

### Step 5: Clarify Red R3 Shop Modal (UX CONFUSION)
**Priority**: HIGH
**Complexity**: Low
**Lines**: 5669+ (executeRed3Shop)

**Problem**: Modal shows OTHER players but description suggests YOUR actions

**Current Behavior**:
- Shop description: "Repeat all actions you took this round"
- Code filters out current player (line 5683)
- Modal shows only OTHER players
- User confused: "You only get to repeat your own actions"

**Analysis**: The shop description is WRONG, not the code

**Actual Shop Benefit** (from shopData.js line 7):
- "Repeat all actions taken this round by any player"
- Cost: 4🔴+4⭐
- Allows repeating ANOTHER player's entire turn

**Fix**: Modal is correct, but needs clearer messaging

**Changes**:
```javascript
// Line 5698 - Update modal title for clarity
const targetPlayerId = await showChoice(
    dispatch,
    'Choose which player\'s actions to repeat',  // Clearer wording
    playerOptions
);
```

**Optional Enhancement**: Add helper text
```javascript
'Choose which player\'s actions to repeat (you can repeat another player\'s entire turn)'
```

**Alternative**: If user wants to repeat OWN actions, change code at line 5683
```javascript
// Change from filtering out current player to including everyone
const otherPlayersWithWorkers = playersWithWorkers;  // Don't filter
```

**Tests**:
- Purchase Red R3 shop
- Verify modal shows clear title
- Verify current player CAN/CANNOT repeat own actions (based on decision)
- Verify repeating works correctly

**Estimated time**: 5 minutes

---

### Step 6: Verify Purple Skip Turn Action (VERIFICATION)
**Priority**: LOW
**Complexity**: None (testing only)
**Lines**: 1362-1394

**Status**: Code review shows this is WORKING CORRECTLY

**Implementation verified**:
✓ Gains 4 purple (8 if doubled)
✓ Sets skip counter for next turn
✓ Turn advancement checks and consumes skip
✓ Handles snake draft reversals
✓ Resets at round start

**User's incomplete note**: "When i do the purple action of gain 4, skip a turn, then"

**Question for user**: What issue did you encounter? The code appears correct.

**Tests** (if user wants verification):
- Use purple "Gain 4, skip turn" action
- End turn
- Verify your next turn is skipped
- Verify skip counter decrements
- Verify normal play resumes after skip

**Estimated time**: 5 minutes (manual testing)

---

## Edge Cases & Considerations

### Multiplayer Sync
- Red R2 shop: Ensure notification reaches affected player
- Round scorecard: All players see same VP breakdown
- Phase indicator: Only current player sees it (already implemented)

### State Management
- Red R2: No lingering effects after removing passive implementation
- VP breakdown: Handle players with 0 VP sources gracefully
- Blue R1: Closed shops stay closed across rounds until toggled

### Performance
- VP breakdown: Rendering 4 players × 10 VP sources = minimal impact
- All other changes: No performance concerns

---

## Test Strategy

### Unit Tests (Optional)
- Red R2: Test executeRed2Shop() with various edge cases
- VP Breakdown: Test getVPBreakdownDisplay() with different sources

### Manual Testing (Required)
1. **Phase Indicator**: Start game, place workers, verify text
2. **Blue R1 Shop**: Purchase, verify selector format
3. **Round Scorecard**: Complete round, verify VP breakdown shows
4. **Red R2 Shop**: Purchase, verify worker placement for next player
5. **Red R3 Shop**: Purchase, verify modal clarity
6. **Purple Skip**: Use action, verify skip works

### Regression Testing
- Verify all shops still work
- Verify phase transitions work
- Verify multiplayer sync works

---

## Questions Before Starting

1. **Phase Indicator**: Which wording do you prefer?
   - A: "Workers to Place: X"
   - B: "Place Workers (X left)"
   - C: "Worker Placement (X to go)"

2. **Red R3 Shop**: Should players be able to repeat their OWN actions, or only other players?
   - Current: Only other players
   - Alternative: Allow self-repeat

3. **Purple Skip Action**: What issue did you encounter? Code appears correct.

4. **Red R2 Shop**: Confirm we should remove the passive effect implementation?
   - Recommended: Remove passive, keep active

---

## Success Criteria

✅ Phase indicator uses clear, unambiguous wording
✅ Blue R1 shop selector shows simple status (not full descriptions)
✅ Round scorecard displays VP breakdown by source
✅ Red R2 shop has single, working implementation
✅ Red R3 shop modal has clear title/messaging
✅ Purple skip turn action verified working (or issue identified)
✅ All existing functionality works (no regressions)
✅ Multiplayer sync works correctly

---

## Estimated Total Time

- Step 1: 2 minutes
- Step 2: 10 minutes
- Step 3: 15 minutes
- Step 4: 20 minutes
- Step 5: 5 minutes
- Step 6: 5 minutes (testing)

**Total: ~60 minutes** (1 hour)

---

## Rollout Strategy

**Recommended order**:
1. Step 1 (quick win, low risk)
2. Step 4 (critical bug, must fix)
3. Step 2 (UX fix, high impact)
4. Step 3 (UX enhancement, high value)
5. Step 5 (clarification, low risk)
6. Step 6 (verification only)

**Alternative**: Fix all at once since they're independent changes.

---

## Notes

- All changes in single file (App.jsx) - easy to review
- No database/schema changes needed
- No new dependencies required
- Backward compatible (no breaking changes)
- Can deploy incrementally or all at once
