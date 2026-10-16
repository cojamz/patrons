# Implementation Plan: Shop Timing Rule Change

**Created**: 2025-11-15
**Status**: Awaiting Approval

## Feature Description

Change shop usage rules to only allow shopping AFTER all workers are placed (not before). Improve UI clarity about game phase and make it clear that shopping is optional. Fix End Turn button visibility bug.

## Scope

**IN SCOPE:**
- Remove "shop before workers" functionality
- Keep "shop after workers" functionality (already works)
- Fix End Turn button visibility bug (button disappears after using shop)
- Add clear phase indicators to UI ("Placing Workers", "Shopping Phase", etc.)
- **Add Active Effects Display System** - show pending effects with duration/timing
- Make it visually obvious that shopping is optional
- Update Yellow R1 shop to work with new timing (effect carries to next turn)
- Test all other shops that might have timing issues

**OUT OF SCOPE:**
- Changing shop effects or benefits
- Redesigning shop UI layout
- Changing shop costs
- Purple layer redesign (separate task)

## Files to Modify

- `src/App.jsx` - Shop purchase validation, End Turn button logic, phase UI
- `src/state/gameReducer.js` - Remove `shopUsedBeforeWorkers` state, update reducers

## Current Issues Found

### Issue 1: Shops Can Be Used Before AND After Workers
**Current behavior:** Players can use one shop before placing any workers, and one shop after placing all workers.

**State variables:**
```javascript
shopUsedBeforeWorkers: false,  // Track if shop was used before placing workers
shopUsedAfterWorkers: false,   // Track if shop was used after placing all workers
```

**Fix needed:** Remove "before workers" path entirely.

---

### Issue 2: End Turn Button Disappears After Using Shop ⚠️ BUG
**Current behavior (App.jsx lines 5985-5987):**
```javascript
isCurrentPlayer && state.workersToPlace === 0 && !state.shopUsedAfterWorkers &&
React.createElement(EndTurnButton, { key: 'end-turn', onEndTurn })
```

**Bug:** Button shows when `!state.shopUsedAfterWorkers` (shop NOT used), hides when shop IS used.

**Expected:** Button should always show after all workers placed, regardless of shop usage.

**Fix needed:** Remove `!state.shopUsedAfterWorkers` condition.

---

### Issue 3: No Clear Phase Indicator
**Current behavior:** No visual indicator of what phase player is in.

**Fix needed:** Add phase indicator showing current game phase.

---

### Issue 4: No Active Effects Display ⚠️ UX ISSUE
**Current implementation:** Effects are stored in `player.effects` array but NOT displayed to player.

**Examples of effects:**
- "Next gain will be doubled" (Yellow R1 shop)
- "Skip next turn" (Purple layer effects)
- "Extra turn after this" (Purple R1 shop)
- Other duration-based effects

**Problem with new shop timing:** Yellow R1 "double next gain" will ALWAYS carry to next turn (shop used after workers), but player has NO visual feedback that effect is active.

**Fix needed:** Add visible "Active Effects" display showing:
- What effects are active
- When they will trigger ("Next turn", "End of turn", etc.)
- Clear visual indicator (badge/icon)

---

## Implementation Steps

### Step 1: Remove "Shop Before Workers" State and Logic
**Files**: `src/state/gameReducer.js`, `src/App.jsx`

**Changes in gameReducer.js:**
1. Remove `shopUsedBeforeWorkers` from initial state (line 23)
2. Remove `shopUsedBeforeWorkers: false` from all reducers:
   - END_TURN (lines 770-771, 745-746)
   - ADVANCE_ROUND (lines 924-925)

**Changes in App.jsx:**
1. Simplify shop availability check (lines ~6676-6693):
   ```javascript
   // New logic:
   if (state.workersToPlace > 0) {
       alert('You must finish placing all your workers before using a shop!');
       return;
   }
   if (state.shopUsedAfterWorkers) {
       alert('You have already used a shop this turn!');
       return;
   }
   ```

**Tests:**
- Shops blocked while placing workers
- Shops available after all workers placed
- Can only use one shop per turn

**Estimated complexity**: Low

---

### Step 2: Fix End Turn Button Visibility
**Files**: `src/App.jsx`

**Changes:**
Remove `!state.shopUsedAfterWorkers` from visibility condition (line ~5985-5987):
```javascript
// Old:
isCurrentPlayer && state.workersToPlace === 0 && !state.shopUsedAfterWorkers &&

// New:
isCurrentPlayer && state.workersToPlace === 0 &&
```

**Tests:**
- End Turn button appears after workers placed
- Button stays visible after using shop
- Button works correctly

**Estimated complexity**: Low

---

### Step 3: Add Phase Indicator UI
**Files**: `src/App.jsx`

**Changes:**
Add phase indicator to Player Card showing:
- "Place Worker (X remaining)" - blue badge
- "Shopping Phase (Optional)" - purple badge
- "Ready to End Turn" - green badge

**Tests:**
- Correct phase shows for each game state
- Only shows for current player
- Updates when state changes

**Estimated complexity**: Low-Medium

---

### Step 4: Add Active Effects Display System
**Files**: `src/App.jsx`

**Changes:**
Create new "Active Effects" component to display in Player Card showing all pending effects:

**1. Parse player.effects array to extract:**
```javascript
// Current effects format: array of strings like "Next gain will be doubled"
// Need to parse and categorize:
const parseEffects = (effects = []) => {
    return effects.map(effect => {
        if (effect.includes('Next gain will be doubled')) {
            return {
                type: 'double_gain',
                label: '2× Next Gain',
                trigger: 'Next Turn',
                icon: '⚡',
                color: 'bg-yellow-100 text-yellow-800'
            };
        }
        if (effect.includes('Skip next turn')) {
            return {
                type: 'skip_turn',
                label: 'Skip Next Turn',
                trigger: 'Next Turn',
                icon: '⏭️',
                color: 'bg-purple-100 text-purple-800'
            };
        }
        if (effect.includes('extra turn')) {
            return {
                type: 'extra_turn',
                label: 'Extra Turn',
                trigger: 'After This Turn',
                icon: '🔄',
                color: 'bg-green-100 text-green-800'
            };
        }
        // Generic fallback
        return {
            type: 'other',
            label: effect.substring(0, 20),
            trigger: 'Pending',
            icon: '📋',
            color: 'bg-gray-100 text-gray-800'
        };
    });
};
```

**2. Create ActiveEffects component:**
```javascript
const ActiveEffects = ({ effects }) => {
    const parsedEffects = parseEffects(effects);

    if (parsedEffects.length === 0) return null;

    return React.createElement('div', {
        className: 'mb-2'
    }, [
        React.createElement('div', {
            key: 'header',
            className: 'text-xs font-semibold text-gray-700 mb-1'
        }, '⚡ Active Effects'),

        React.createElement('div', {
            key: 'effects',
            className: 'space-y-1'
        }, parsedEffects.map((effect, idx) =>
            React.createElement('div', {
                key: idx,
                className: `text-xs px-2 py-1 rounded ${effect.color} flex justify-between items-center`
            }, [
                React.createElement('span', {
                    key: 'label',
                    className: 'font-semibold'
                }, `${effect.icon} ${effect.label}`),

                React.createElement('span', {
                    key: 'trigger',
                    className: 'text-xs opacity-75'
                }, effect.trigger)
            ])
        ))
    ]);
};
```

**3. Add to Player Card:**
Place Active Effects display:
- After resources display
- Before phase indicator
- Only show for current player (or optionally for all players)

**Visual Design:**
- Yellow badge: "⚡ 2× Next Gain" → "Next Turn"
- Purple badge: "⏭️ Skip Next Turn" → "Next Turn"
- Green badge: "🔄 Extra Turn" → "After This Turn"
- Compact, scannable format

**Tests:**
- Yellow R1 shop → "2× Next Gain" badge appears
- End turn → Badge persists to next turn
- Gain resources → Badge disappears after doubling
- Purple "skip turn" → Badge appears with "Next Turn"
- Multiple effects → All show correctly
- Other player can see their own effects

**Estimated complexity**: Medium

---

### Step 5: Add "Skip Shopping" Visual Clarity
**Files**: `src/App.jsx`

**Changes:**
Make End Turn button more prominent in shopping phase:
- Change text to "✓ Skip Shopping & End Turn" when shopping available
- Normal "End Turn" after shop used
- Optional: Add help text "Use a shop above, or skip shopping"

**Tests:**
- Button text changes correctly
- Button remains functional
- Visual clarity improved

**Estimated complexity**: Low

---

### Step 6: Test Yellow R1 Shop and Other Timing-Sensitive Shops
**Files**: Manual testing in browser

**Test cases:**
- Yellow R1: Effect carries to next turn
- Purple R1: Extra turn works
- Red R1: Repeat action works
- Blue R1: Toggle shop works
- White R1: VP trade works
- All shops work correctly with new timing

**Estimated complexity**: Medium

---

### Step 7: Update Documentation
**Files**: `CLAUDE.md`, `IMPLEMENTATION_SPEC.md`

**Changes:**
- Update shop timing rules
- Remove references to "shop before workers"
- Note Yellow R1 effect carryover

**Estimated complexity**: Low

---

## Edge Cases & Considerations

- **Multiplayer sync:** Verify `shopUsedAfterWorkers` syncs correctly
- **Purple "Play More Workers":** Shops available only after ALL workers (including bonus)
- **Effect carryover:** Yellow R1 "double next gain" now strategic (end of turn → boost next turn)
- **Auto-advance round:** Shop state must reset properly

---

## Test Strategy

**Manual Testing:**
1. Basic flow: workers → shop → end turn
2. Skip shopping: workers → end turn (no shop)
3. Yellow R1 carryover: use shop → end turn → next turn doubled
4. Multiplayer: 2 clients, verify sync

**Regression:**
- All shop effects still work
- Blue automatic VP still works
- Shop costs still deduct correctly

---

## Potential Pitfalls

1. **Incomplete cleanup:** Missing `shopUsedBeforeWorkers` references → Grep entire codebase
2. **Button edge cases:** Test all state combinations
3. **Phase confusion:** Use clear language, test with fresh eyes
4. **Multiplayer desync:** Test thoroughly with 2+ clients

---

## Questions Before Starting

1. Purple "Play More Workers": Should shops be available before or after bonus workers? **(Recommend: after all workers)**
2. Effect carryover: Is Yellow R1 carrying to next turn okay? **(Seems fine strategically)**
3. Phase indicator placement: Where should it go? **(Recommend: top of player card)**
4. Active effects display: Add visual indicator for effects? **(Recommend: yes, but could be follow-up)**

---

## Success Criteria

- ✅ Shops only usable after all workers placed
- ✅ End Turn button always visible after workers
- ✅ Clear phase indicators
- ✅ **Active Effects Display shows all pending effects with clear timing**
- ✅ **Yellow R1 "double next gain" clearly shown as active effect**
- ✅ Shopping clearly marked as optional
- ✅ All shops work with new timing
- ✅ Multiplayer sync works
- ✅ No regressions
- ✅ Documentation updated
