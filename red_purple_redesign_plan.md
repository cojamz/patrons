# Red & Purple Layer Redesign - Implementation Plan

**Created**: 2025-11-16
**Status**: Awaiting Approval

---

## Overview

Complete redesign of Red and Purple layers to fix game balance and clarity issues.

**Red Changes:**
- Replace problematic R2 action (forceRedPlacement)
- Replace redundant R3 shop
- Clarify swap action names
- Fix VP reward consistency for repeats

**Purple Changes:**
- Complete overhaul from "Timing/Order" to "Worker Efficiency"
- Replace all 7 actions
- Remove complex state management (skip turns, extra turns, play more workers)
- Shops need design (separate task)

---

## Scope

### IN SCOPE (Red):
- ✅ Replace Red R2 action with "+1🔴 + VP Per Red Worker"
- ✅ Replace Red R3 shop with "Copy All Another Player's Actions"
- ✅ Clarify swap action names (redHybrid1, redHybrid2)
- ✅ Fix VP rewards for repeated red actions
- ✅ Remove forceRedPlacement enforcement logic

### IN SCOPE (Purple):
- ✅ Replace all 7 purple actions with approved Worker Efficiency actions
- ✅ Remove skip turn state management
- ✅ Remove extra turn logic
- ✅ Remove play more workers logic
- ✅ Remove take back worker logic
- ✅ Update purple automatic VP (first/last to run out)

### OUT OF SCOPE:
- ❌ Purple shop redesign (separate task after testing actions)
- ❌ Purple VP shop changes (keep current for now)
- ❌ Other layer changes

---

## Files to Modify

### Red Changes:
- `src/data/allGameLayers.js` - Action definitions
- `src/data/shopData.js` - Shop definition (R3)
- `src/App.jsx` - Action implementations, shop implementations
- `src/state/gameReducer.js` - Remove forceRedPlacement enforcement

### Purple Changes:
- `src/data/allGameLayers.js` - All 7 action definitions
- `src/App.jsx` - All 7 action implementations
- `src/state/gameReducer.js` - Remove skip/extra/play-more state
- `src/App.jsx` - Remove skip turn enforcement, extra turn logic

---

## RED LAYER CHANGES

### Change 1: Replace Red R2 Action

**OLD (forceRedPlacement):**
```javascript
{
    id: 'forceRedPlacement',
    title: 'Other Players Must Place on Red',
    description: '(Until red layer is full)',
    round: 2
}
```

**NEW (redVPFocus):**
```javascript
{
    id: 'redVPFocus',
    title: '+1 🔴 + VP Per Red Worker',
    description: '(+1 VP for each red action where you have a worker)',
    round: 2
}
```

**Implementation:**
- Give +1 red
- Count red actions where player has workers (including this one)
- Give +1 VP per red worker
- +1 VP for using red action (standard red auto VP)
- Total VP: 1 + (number of red workers)

**Example:** 3 red workers = +1 red, +4 VP total

---

### Change 2: Replace Red R3 Shop

**OLD:**
```
'Repeat all actions you took this round'
Cost: 4 red + 4 star
```

**NEW:**
```
'Repeat all actions from another player'
Cost: 4 red + 4 star
```

**Implementation:**
- Show modal: Choose another player (with workers placed)
- Execute ALL their worker actions in sequence (choose order)
- Exclude swap/repeat actions (same exclusion list as R3 action)
- Give +1 VP for each RED action repeated
- Give +0 VP for non-red actions repeated

**This creates elegant symmetry:**
- R3 Action: Repeat all YOUR actions
- R3 Shop: Repeat all THEIR actions

---

### Change 3: Clarify Swap Action Names

**OLD:**
- redHybrid1: "+1 🔴 + Swap Workers (Both players get actions)"
- redHybrid2: "+1 🔴 + Swap Workers (Only you get action)"

**NEW:**
- redHybrid1: "+1 🔴 + Swap: Both Benefit"
- redHybrid2: "+1 🔴 + Swap: You Benefit"

Or:
- redHybrid1: "+1 🔴 + Trade Places (Mutual)"
- redHybrid2: "+1 🔴 + Trade Places (Solo)"

---

### Change 4: Fix Red VP Rewards for Repeats

**Current bug:**
- Red R3 action gives +1 VP total (just for using action)
- Red R3 shop gives +1 VP per action repeated (regardless of color)

**Correct rule:**
- Using ANY red action → +1 VP (standard)
- Repeating a RED action → +1 VP (bonus)
- Repeating a NON-red action → +0 VP (no bonus)

**Implementation locations:**
- Red R3 action (redRepeatAll): Check if repeated action is red, award VP
- Red R3 shop: Check if repeated action is red, award VP
- Red R1 repeat (redRepeatAction): Check if repeated action is red, award VP

---

## PURPLE LAYER CHANGES

### New Purple Identity: "Worker Efficiency"

**Core Theme:** Your workers work smarter through strategic positioning and sequencing.

**Strategic Paths:**
1. **Diversity** - Spread workers across many layers
2. **Concentration** - Stack workers on few layers
3. **Total Presence** - Have lots of workers placed

---

### Purple Actions (Complete Replacement)

#### Round 1 (4 actions)

**1. AMPLIFY**
```javascript
{
    id: 'purpleAmplify',
    title: '+1 🟣 Per Worker Placed',
    description: '(This round only)',
    round: 1
}
```
- Count workers you've placed this round (before this action)
- Gain +1 purple per worker
- Sequencing reward: Place this last for maximum benefit
- Range: 0-3 purple typically

---

**2. RAINBOW**
```javascript
{
    id: 'purpleRainbow',
    title: 'Gain 1 of Each Color',
    description: '(Where you have workers, max 5)',
    round: 1
}
```
- Find all layers/colors where you have workers
- Gain +1 of each color (max 5 different)
- Diversity reward
- Unique: Doesn't give purple!

---

**3. SYNERGY**
```javascript
{
    id: 'purpleSynergy',
    title: 'Choose Layer: +1🟣 +2 Color Per Worker',
    description: '(Per worker you have there)',
    round: 1
}
```
- Show modal: Choose a color/layer
- Count your workers on that layer
- Gain +1 purple + 2 of that color per worker
- Example: 3 workers on Red = +3 purple + 6 red
- Concentration reward

---

**4. PRESENCE**
```javascript
{
    id: 'purplePresence',
    title: '+1 🟣 Per Worker on Board',
    description: '(Minimum 2 purple)',
    round: 1
}
```
- Count ALL your placed workers
- Gain +1 purple per worker (min 2)
- Reliable baseline option
- Range: 2-8 purple

---

#### Round 2 (2 actions)

**5. MAXIMIZE**
```javascript
{
    id: 'purpleMaximize',
    title: '+3 🟣 Per Worker on Best Layer',
    description: '(Your most-populated layer)',
    round: 2
}
```
- Find your most-populated layer (most workers)
- Count workers there
- Gain +3 purple per worker
- Concentration reward (scaled up)
- Range: 3-9 purple typically

---

**6. NETWORK**
```javascript
{
    id: 'purpleNetwork',
    title: '+1 Resource Per Worker on Board',
    description: '(Any colors, choose each)',
    round: 2
}
```
- Count all your placed workers
- Gain that many resources (choose each color)
- Pure flexibility
- Range: 3-10 resources

---

#### Round 3 (1 action)

**7. MASTER PLACEMENT**
```javascript
{
    id: 'purpleMaster',
    title: '+2 VP Per Different Layer',
    description: '(Where you have workers)',
    round: 3
}
```
- Count different layers/colors where you have workers
- Gain +2 VP per layer
- Diversity payoff
- Range: 4-16 VP (2-8 layers typically)

---

## Implementation Steps

### Step 1: Update Red Action Definitions (LOW)
**Files:** `src/data/allGameLayers.js`

**Changes:**
1. Replace `forceRedPlacement` with `redVPFocus` in red actions array
2. Update titles for `redHybrid1` and `redHybrid2`

**Tests:**
- Verify action shows in R2
- Verify title displays correctly

**Est. time:** 5 min

---

### Step 2: Update Red R3 Shop Definition (LOW)
**Files:** `src/data/shopData.js`

**Changes:**
1. Change red[3] from `'Repeat all actions you took this round'` to `'Repeat all actions from another player'`

**Tests:**
- Verify shop description shows correctly

**Est. time:** 2 min

---

### Step 3: Implement Red R2 Action (LOW)
**Files:** `src/App.jsx` (executeAction function)

**Changes:**
1. Remove `forceRedPlacement` implementation (lines ~1915-1944)
2. Add `redVPFocus` implementation:
```javascript
if (actionId === 'redVPFocus') {
    // Give +1 red
    dispatch({
        type: 'UPDATE_RESOURCES',
        playerId: player.id,
        resources: { red: 1 }
    });

    // Count red workers
    const redLayer = state.gameLayers?.red;
    const redActionIds = redLayer ? redLayer.actions.map(a => a.id) : [];
    const redWorkerCount = Object.entries(state.occupiedSpaces)
        .filter(([actionId, playerId]) =>
            playerId === player.id && redActionIds.includes(actionId)
        ).length;

    // Give VP: +1 for action + red workers
    const totalVP = 1 + redWorkerCount;
    dispatch({
        type: 'UPDATE_VP',
        playerId: player.id,
        vp: totalVP,
        source: 'redAction'
    });

    dispatch({
        type: 'ADD_LOG',
        message: `Player ${player.id}: redVPFocus → +1🔴, +${totalVP} VP (${redWorkerCount} red workers)`
    });
    return;
}
```

**Tests:**
- Place on redVPFocus with 0-3 other red workers
- Verify correct red and VP given

**Est. time:** 15 min

---

### Step 4: Remove Force Red Placement Logic (MEDIUM)
**Files:** `src/App.jsx` (worker placement), `src/state/gameReducer.js`

**Changes:**
1. Remove forceRedPlacement enforcement in `handlePlaceWorker` (lines ~848-892)
2. Remove effect cleanup in reducers
3. Remove "Must place on red layer" effect strings

**Tests:**
- Verify workers can be placed anywhere without red restriction
- No errors when placing workers

**Est. time:** 20 min

---

### Step 5: Implement Red R3 Shop (MEDIUM)
**Files:** `src/App.jsx` (executeRed3Shop function)

**Changes:**
1. Modify `executeRed3Shop` (lines ~5676-5777):
   - Change from filtering to ONLY current player
   - Add player selection modal
   - Execute selected player's actions
   - Fix undefined `targetPlayerId` bug
2. Keep Red automatic VP logic (+1 VP per RED action repeated)

**Code:**
```javascript
async function executeRed3Shop(player, dispatch, state, recursionDepth = 0) {
    // Get all players who have placed workers
    const playersWithWorkers = [];
    const playerWorkerCounts = {};

    Object.entries(state.occupiedSpaces).forEach(([actionId, playerId]) => {
        if (!playerWorkerCounts[playerId]) {
            playerWorkerCounts[playerId] = [];
            playersWithWorkers.push(playerId);
        }
        playerWorkerCounts[playerId].push(actionId);
    });

    // Filter to OTHER players (not yourself)
    const otherPlayers = playersWithWorkers.filter(pid => pid !== player.id);

    if (otherPlayers.length === 0) {
        dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Red R3 shop → No other players have workers!` });
        return;
    }

    // Choose which player to copy
    const playerOptions = otherPlayers.map(pid => ({
        label: `Player ${pid} (${playerWorkerCounts[pid].length} worker${playerWorkerCounts[pid].length > 1 ? 's' : ''})`,
        value: pid
    }));

    const targetPlayerId = await showChoice(
        dispatch,
        'Choose which player\'s actions to repeat',
        playerOptions
    );

    if (!targetPlayerId) {
        dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: Red R3 shop → Cancelled` });
        return;
    }

    // Get target player's actions
    const targetActions = playerWorkerCounts[targetPlayerId];

    // ... rest of implementation (similar to current, but targeting other player)
}
```

**Tests:**
- Purchase Red R3 shop
- Verify modal shows other players
- Verify copying their actions works
- Verify RED actions give +1 VP, non-red don't

**Est. time:** 30 min

---

### Step 6: Fix Red VP Rewards (MEDIUM)
**Files:** `src/App.jsx` (multiple locations)

**Changes:**
1. **Red R3 action (redRepeatAll):** Add VP check per repeated action
2. **Red R1 action (redRepeatAction):** Add VP check for repeated action
3. **Helper function:** Create `isRedAction(actionId, gameLayers)` helper

**Implementation:**
```javascript
// Helper function
function isRedAction(actionId, gameLayers) {
    const redLayer = gameLayers?.red;
    if (!redLayer) return false;
    return redLayer.actions.some(a => a.id === actionId);
}

// In repeat loops, after executing action:
if (isRedAction(chosenActionId, state.gameLayers)) {
    dispatch({
        type: 'UPDATE_VP',
        playerId: player.id,
        vp: 1,
        source: 'redAction'
    });
    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: +1 VP for repeating red action` });
}
```

**Tests:**
- Repeat red actions → get bonus VP
- Repeat non-red actions → no bonus VP
- Works for R1 repeat, R3 repeat, and shops

**Est. time:** 25 min

---

### Step 7: Update Purple Action Definitions (LOW)
**Files:** `src/data/allGameLayers.js`

**Changes:**
1. Replace ALL purple actions with 7 new actions:
   - purpleAmplify
   - purpleRainbow
   - purpleSynergy
   - purplePresence
   - purpleMaximize
   - purpleNetwork
   - purpleMaster

**Tests:**
- Verify all 7 actions show at correct rounds
- Verify titles/descriptions display

**Est. time:** 10 min

---

### Step 8: Implement Purple Round 1 Actions (MEDIUM)
**Files:** `src/App.jsx` (executeAction function)

**Changes:**
Implement 4 actions:

**purpleAmplify:**
```javascript
if (actionId === 'purpleAmplify') {
    // Count workers placed this round (excluding this one)
    const workersThisRound = Object.values(state.occupiedSpaces)
        .filter(pid => pid === player.id).length - 1;

    const purpleGain = Math.max(0, workersThisRound);

    dispatch({
        type: 'UPDATE_RESOURCES',
        playerId: player.id,
        resources: { purple: purpleGain }
    });

    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: purpleAmplify → +${purpleGain}🟣 (${workersThisRound} workers placed)` });
    return;
}
```

**purpleRainbow:**
```javascript
if (actionId === 'purpleRainbow') {
    // Find all colors where player has workers
    const layerColors = ['red', 'yellow', 'blue', 'purple', 'gold', 'white', 'black', 'silver'];
    const resources = {};

    layerColors.forEach(color => {
        const layer = state.gameLayers?.[color];
        if (layer) {
            const hasWorkerOnColor = layer.actions.some(action =>
                state.occupiedSpaces[action.id] === player.id
            );
            if (hasWorkerOnColor) {
                resources[color] = 1;
            }
        }
    });

    const count = Object.keys(resources).length;

    dispatch({
        type: 'UPDATE_RESOURCES',
        playerId: player.id,
        resources: resources
    });

    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: purpleRainbow → Gained 1 of ${count} colors` });
    return;
}
```

**purpleSynergy:**
```javascript
if (actionId === 'purpleSynergy') {
    // Choose a layer
    const colorOptions = [
        { label: '🔴 Red', value: 'red' },
        { label: '🟡 Yellow', value: 'yellow' },
        { label: '🔵 Blue', value: 'blue' },
        { label: '🟣 Purple', value: 'purple' },
        { label: '🏆 Gold', value: 'gold' },
        { label: '⚪ White', value: 'white' },
        { label: '⚫ Black', value: 'black' },
        { label: '⚙️ Silver', value: 'silver' }
    ];

    const chosenColor = await showChoice(dispatch, 'Choose a layer for synergy bonus', colorOptions);

    if (!chosenColor) {
        dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: purpleSynergy → Cancelled` });
        return;
    }

    // Count workers on that layer
    const layer = state.gameLayers?.[chosenColor];
    const workerCount = layer ? layer.actions.filter(action =>
        state.occupiedSpaces[action.id] === player.id
    ).length : 0;

    const purpleGain = workerCount;
    const colorGain = workerCount * 2;

    dispatch({
        type: 'UPDATE_RESOURCES',
        playerId: player.id,
        resources: {
            purple: purpleGain,
            [chosenColor]: colorGain
        }
    });

    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: purpleSynergy → +${purpleGain}🟣 +${colorGain} ${chosenColor} (${workerCount} workers)` });
    return;
}
```

**purplePresence:**
```javascript
if (actionId === 'purplePresence') {
    // Count all placed workers
    const totalWorkers = Object.values(state.occupiedSpaces)
        .filter(pid => pid === player.id).length;

    const purpleGain = Math.max(2, totalWorkers);

    dispatch({
        type: 'UPDATE_RESOURCES',
        playerId: player.id,
        resources: { purple: purpleGain }
    });

    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: purplePresence → +${purpleGain}🟣 (${totalWorkers} workers, min 2)` });
    return;
}
```

**Tests:**
- Test each action with various worker placements
- Verify correct resource gains
- Test edge cases (0 workers, max workers)

**Est. time:** 45 min

---

### Step 9: Implement Purple Round 2 Actions (MEDIUM)
**Files:** `src/App.jsx`

**purpleMaximize:**
```javascript
if (actionId === 'purpleMaximize') {
    // Find most-populated layer
    const layerColors = ['red', 'yellow', 'blue', 'purple', 'gold', 'white', 'black', 'silver'];
    let maxWorkers = 0;
    let bestLayer = null;

    layerColors.forEach(color => {
        const layer = state.gameLayers?.[color];
        if (layer) {
            const count = layer.actions.filter(action =>
                state.occupiedSpaces[action.id] === player.id
            ).length;
            if (count > maxWorkers) {
                maxWorkers = count;
                bestLayer = color;
            }
        }
    });

    const purpleGain = maxWorkers * 3;

    dispatch({
        type: 'UPDATE_RESOURCES',
        playerId: player.id,
        resources: { purple: purpleGain }
    });

    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: purpleMaximize → +${purpleGain}🟣 (${maxWorkers} workers on ${bestLayer})` });
    return;
}
```

**purpleNetwork:**
```javascript
if (actionId === 'purpleNetwork') {
    // Count total workers
    const totalWorkers = Object.values(state.occupiedSpaces)
        .filter(pid => pid === player.id).length;

    // Let player choose resources
    const resources = {};
    for (let i = 0; i < totalWorkers; i++) {
        const colorOptions = [
            { label: '🔴 Red', value: 'red' },
            { label: '🟡 Yellow', value: 'yellow' },
            { label: '🔵 Blue', value: 'blue' },
            { label: '🟣 Purple', value: 'purple' },
            { label: '🏆 Gold', value: 'gold' },
            { label: '⚪ White', value: 'white' },
            { label: '⚫ Black', value: 'black' },
            { label: '⚙️ Silver', value: 'silver' }
        ];

        const choice = await showChoice(dispatch, `Choose resource ${i + 1} of ${totalWorkers}`, colorOptions);
        if (choice) {
            resources[choice] = (resources[choice] || 0) + 1;
        }
    }

    dispatch({
        type: 'UPDATE_RESOURCES',
        playerId: player.id,
        resources: resources
    });

    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: purpleNetwork → Gained ${totalWorkers} resources` });
    return;
}
```

**Tests:**
- Test with various worker distributions
- Verify maximize finds correct best layer
- Test network resource selection

**Est. time:** 30 min

---

### Step 10: Implement Purple Round 3 Action (LOW)
**Files:** `src/App.jsx`

**purpleMaster:**
```javascript
if (actionId === 'purpleMaster') {
    // Count different layers with workers
    const layerColors = ['red', 'yellow', 'blue', 'purple', 'gold', 'white', 'black', 'silver'];
    let layersWithWorkers = 0;

    layerColors.forEach(color => {
        const layer = state.gameLayers?.[color];
        if (layer) {
            const hasWorker = layer.actions.some(action =>
                state.occupiedSpaces[action.id] === player.id
            );
            if (hasWorker) layersWithWorkers++;
        }
    });

    const vpGain = layersWithWorkers * 2;

    dispatch({
        type: 'UPDATE_VP',
        playerId: player.id,
        vp: vpGain,
        source: 'purpleAction'
    });

    dispatch({ type: 'ADD_LOG', message: `Player ${player.id}: purpleMaster → +${vpGain} VP (${layersWithWorkers} different layers)` });
    return;
}
```

**Tests:**
- Test with workers on 2-8 layers
- Verify correct VP awarded

**Est. time:** 15 min

---

### Step 11: Remove Old Purple Logic (HIGH COMPLEXITY)
**Files:** `src/App.jsx`, `src/state/gameReducer.js`

**Changes:**
1. Remove old purple action implementations:
   - gain4purpleSkip
   - gain3purple
   - gain2purpleTakeBack
   - playTwoWorkers
   - gain5purpleSkip
   - playThreeWorkers
   - gain4purpleWaitAll

2. Remove state management:
   - skippedTurns object
   - extraTurns tracking
   - playersOutOfWorkers array
   - "play more workers" effect handling

3. Remove enforcement:
   - Skip turn checking in END_TURN
   - Extra turn logic
   - "Must place" effects for extra workers

4. Clean up reducers:
   - Remove skippedTurns from initial state
   - Remove from END_TURN reducer
   - Remove from ADVANCE_ROUND reducer
   - Remove effect cleanup for skip/extra/play-more

**Tests:**
- Verify old actions don't exist
- Verify no skip turn logic triggers
- Verify no extra turns granted
- No errors when ending turns

**Est. time:** 60 min (complex, lots of removal)

---

### Step 12: Test Complete Redesign (HIGH)
**Manual testing in browser**

**Test Red:**
- ✅ Red R2 (redVPFocus): Workers on 0-4 red actions, verify VP
- ✅ Red R3 Shop: Copy another player's actions, verify VP for red actions only
- ✅ Red R3 Action: Repeat your own actions, verify VP for red actions only
- ✅ Red swaps: Verify clear naming
- ✅ No force red placement enforcement

**Test Purple:**
- ✅ purpleAmplify: Place at different points in turn
- ✅ purpleRainbow: Workers on 1-5 colors
- ✅ purpleSynergy: Choose different layers, various worker counts
- ✅ purplePresence: Minimum 2 purple enforced
- ✅ purpleMaximize: Find best layer correctly
- ✅ purpleNetwork: Choose resources properly
- ✅ purpleMaster: Count layers correctly
- ✅ No skip turns, extra turns, play more workers

**Test Interactions:**
- ✅ Red repeat + Purple actions
- ✅ Purple sequencing rewards
- ✅ Multiplayer sync

**Est. time:** 90 min

---

### Step 13: Update Documentation (LOW)
**Files:** `CLAUDE.md`, `IMPLEMENTATION_SPEC.md`

**Changes:**
1. Update Critical Rule #4 (remove "play more workers")
2. Add new Red R2 and R3 shop descriptions
3. Add new Purple identity and actions
4. Remove references to old purple mechanics

**Est. time:** 20 min

---

## Edge Cases & Considerations

### Red Layer:
- **redVPFocus with 0 red workers:** Should give +1 red, +1 VP (just for using action)
- **Red R3 shop with no other players:** Show error message, don't crash
- **Repeating red actions multiple times:** Each repeat of a red action gives +1 VP
- **Multiplayer sync:** Ensure VP updates sync correctly

### Purple Layer:
- **purpleAmplify placed first:** Should give 0 purple (no workers placed before)
- **purpleRainbow with all workers on one color:** Should give 1 resource only
- **purpleSynergy with 0 workers on chosen layer:** Should give 0
- **purplePresence minimum:** Must enforce min 2 purple
- **purpleMaximize with tie:** Pick first layer found with max workers
- **purpleNetwork cancellation:** Handle modal cancel gracefully
- **purpleMaster counting:** Each layer counted once even if multiple workers

---

## Test Strategy

**Unit Tests (Optional):**
- Helper function `isRedAction()`
- Worker counting logic
- Layer detection logic

**Integration Tests (Manual):**
- Complete game playthrough with Red focus
- Complete game playthrough with Purple focus
- Multiplayer 2-player game
- Edge cases listed above

**Regression Tests:**
- All other layers still work
- Shops still function
- Round advancement works
- VP tracking accurate

---

## Potential Pitfalls

1. **Incomplete removal of old Purple logic**
   - Mitigation: Grep for 'skip', 'extra turn', 'play more workers'
   - Check all reducers thoroughly

2. **VP reward inconsistency**
   - Mitigation: Create isRedAction() helper, use everywhere
   - Test all repeat mechanics

3. **Modal cancellation crashes**
   - Mitigation: Always check if choice is null/undefined
   - Return early with log message

4. **Worker counting edge cases**
   - Mitigation: Test with 0 workers, 1 worker, max workers
   - Log counts for debugging

5. **Multiplayer desync**
   - Mitigation: Test with 2 clients
   - Verify all state updates dispatch correctly

---

## Success Criteria

### Red Layer:
- ✅ redVPFocus works correctly, gives right VP count
- ✅ Red R3 shop copies other player's actions
- ✅ Red VP rewards correct (only red actions give bonus)
- ✅ No force red placement logic exists
- ✅ Swap actions have clear names
- ✅ All Red interactions tested

### Purple Layer:
- ✅ All 7 new actions work correctly
- ✅ No skip turn logic exists
- ✅ No extra turn logic exists
- ✅ No play more workers logic exists
- ✅ Worker counting accurate
- ✅ Sequencing rewards work (amplify)
- ✅ Diversity rewards work (rainbow, master)
- ✅ Concentration rewards work (synergy, maximize)

### General:
- ✅ No regressions in other layers
- ✅ Multiplayer sync works
- ✅ Documentation updated
- ✅ No console errors
- ✅ Game playable start to finish

---

## Estimated Total Time

| Step | Time | Complexity |
|------|------|------------|
| 1. Red action definitions | 5 min | Low |
| 2. Red shop definition | 2 min | Low |
| 3. Red R2 implementation | 15 min | Low |
| 4. Remove force red logic | 20 min | Medium |
| 5. Red R3 shop | 30 min | Medium |
| 6. Fix Red VP rewards | 25 min | Medium |
| 7. Purple action definitions | 10 min | Low |
| 8. Purple R1 actions | 45 min | Medium |
| 9. Purple R2 actions | 30 min | Medium |
| 10. Purple R3 action | 15 min | Low |
| 11. Remove old Purple logic | 60 min | High |
| 12. Testing | 90 min | High |
| 13. Documentation | 20 min | Low |

**Total: ~6 hours** (concentrated work)

---

## Rollout Strategy

**Recommended order:**
1. Steps 1-6 (Red changes) - Deploy and test
2. Steps 7-11 (Purple changes) - Deploy and test
3. Step 12 (Full testing)
4. Step 13 (Documentation)

**Alternative:** All at once (riskier but faster)

---

## Questions Before Starting

1. ✅ Red R2 action approved (+1 red + VP per red worker)
2. ✅ Red R3 shop approved (copy other player's actions)
3. ✅ Purple actions approved (all 7 from PURPLE_REDESIGN.md)
4. ❓ Should Purple automatic VP (first/last to run out) stay the same?
5. ❓ Should Purple VP shop stay the same (6 purple = 5 VP)?
6. ❓ What about Purple shops R1, R2, R3? (Currently not designed)

---

**Status:** Ready to implement Red + Purple actions

**Next:** Design Purple shops (separate task, doesn't block implementation)
