# Complex Action + Shop Interaction Analysis

## Recent Fixes (January 2025)

### Red Action Improvements
1. **Swap Workers Cannot Target Itself**: Workers on redHybrid1/redHybrid2 are now excluded from swap options
2. **Repeat Actions Exclude Problematic Targets**: 
   - Cannot repeat: redRepeatAction, redRepeatAll, redHybrid1, redHybrid2
   - Prevents confusing chains and potential loops
3. **Recursion Depth Properly Tracked**: Blue shop → Red shop chains now respect recursion limits
4. **Clear UI Feedback**: Shows action chain depth and explains exclusions

## ✅ Fixed Issues (January 2025)

### 1. Red Swap Workers Self-Target
**Problem**: Could swap worker on the swap action itself, causing loops
**Solution**: Exclude current action from swappable workers list
**Implementation**: Filter `spaceId !== actionId` in worker selection

### 2. Repeat Action Chains
**Problem**: Could repeat other repeat actions, creating confusion
**Solution**: Exclude all repeat and swap actions from repeat targets
**Implementation**: `excludedActions = ['redRepeatAction', 'redRepeatAll', 'redHybrid1', 'redHybrid2']`

### 3. Blue Shop → Red Shop Recursion
**Problem**: executeShopBenefit wasn't tracking recursion depth
**Solution**: Pass recursionDepth through all shop benefit calls
**Implementation**: Added recursionDepth parameter to executeShopBenefit

## Critical Issues Found (Historical)

### 1. Purple Shop Worker Placement Override
**Problem**: Purple shops use `SET_WORKERS_TO_PLACE` instead of `ADD_WORKERS_TO_PLACE`
- If player uses `playTwoWorkers` (can place 2 more), then buys Purple R2 shop
- Shop SETS workers to 2, overwriting the existing count
- Player loses the benefit of their action

**Fix Needed**: Purple shops should ADD workers, not SET them

### 2. Red Repeat Chain Scenarios
**Scenario A**: Red Repeat + Blue Shop Benefit
1. Player places worker on `redRepeatAction`
2. Chooses to repeat `blueR1ShopBenefit` 
3. Blue shop benefit gives Red R1 (repeat another action)
4. Creates a chain of repeats (limited by recursion depth)

**Scenario B**: Red R3 Shop Madness
- Red R3 shop repeats ALL actions this round
- If someone used `redRepeatAll` earlier, does it repeat that too?
- Could repeat shop benefits that were gained through actions

### 3. Yellow Double Gain Stacking
**Complex Case**:
1. Player has "Next gain doubled" from Yellow R1 shop
2. Uses `yellowHybrid2` (gives +1 yellow + double next gain)
3. Do they now have 2 double effects? Does it quadruple?

**Current Code**: Only checks if effect exists, doesn't stack

### 4. Blue Shop Manipulation Edge Cases
**Scenario**: Cost Modification Stacking
1. Player A uses `blueReduceCosts` (-1 to all shop costs)
2. Player B uses `blueIncreaseCosts` (+1 to all shop costs)
3. Net effect should be 0, but timing matters

**Issue**: Multiple modifications in same round

### 5. Resource Manipulation Race Conditions
**Scenario**: Steal During Swap
1. Player A starts stealing from Player B
2. While choosing gems, Player C uses `yellowSwapResources` with Player B
3. Player B's resources change mid-steal

**Current Code**: No protection against this

### 6. Victory Shop Cost Edge Cases
**Issue**: Yellow victory shop uses "5 any" but code treats it differently
- Cost modifications apply differently to yellow vs other victory shops
- Closed/flipped victory shops interaction unclear

### 7. Turn Order Manipulation
**Scenario**: Multiple Purple Effects
1. Player gets extra turn from Purple R1 shop
2. On extra turn, uses `purpleHybrid2` to change turn order
3. Does new order apply immediately or next round?

### 8. Shop Closure Timing
**Complex Case**:
1. Player A uses Blue R1 to close Yellow R1 shop
2. Player B uses `blueR1ShopBenefit` to gain Yellow R1 benefit anyway
3. Player C tries to buy from the closed shop normally

**Current**: Blue actions bypass closure, but UI might be confusing

## Implemented Fixes

### ✅ Fixed Issues:
1. **Purple Shop Worker Override**: Changed to use ADD_WORKERS_TO_PLACE
2. **Shop Cost Modifier Stacking**: Changed from SET to ADD for cumulative effect
3. **Recursion Protection**: Added max depth of 5 to prevent infinite loops
4. **Shop Usage Limits**: Players can only use 1 shop before and 1 after placing workers
5. **UI Improvements**: Added visual indicator for shop cost modifiers
6. **Red R3 Shop Bug**: Fixed incorrect executeAction parameters
7. **playTwoWorkers**: Now properly adds 2 workers instead of setting to 2

### Shop Phase System (Now Enforced):
Turn structure with phases:
1. **Shop Phase 1**: Can buy 1 shop at start of turn
2. **Worker Phase**: Place workers (shops closed for direct purchase)
3. **Shop Phase 2**: Can buy 1 shop after all workers placed
4. **End Turn**

Key Rules:
- Shops are CLOSED during worker placement phase
- Blue shop benefit actions bypass phase restrictions
- Victory shops count as normal shop usage
- "Skip to Shop Phase" button appears when out of workers
- Phase indicator shows current phase for active player

### Cost Modifier Display:
- Shows "+X any cost" in red when costs increased
- Shows "-X any cost" in green when costs reduced
- Appears in shop header when modifier is non-zero

### Testing Scenarios:
1. **Recursion Test**: Red repeat → Blue shop → Red shop → Repeat
2. **Worker Test**: playTwoWorkers → Purple shop → Verify total workers
3. **Cost Test**: Reduce costs → Increase costs → Buy shop
4. **Timing Test**: Extra turn → Change turn order → Next round
5. **Closure Test**: Close shop → Blue benefit → Normal purchase attempt

### UI Improvements Needed:
1. Show current shop cost modifications clearly
2. Indicate when shops are closed but still accessible via blue
3. Show total workers that can be placed this turn
4. Clear VP source tracking for complex chains

## Current Interaction Rules (January 2025)

### Red Actions - Worker Manipulation
1. **Swap Workers (redHybrid1/2)**:
   - Cannot swap workers on swap actions
   - Shows clear options for both players' workers
   - redHybrid1: Both players execute swapped actions
   - redHybrid2: Only current player executes both actions

2. **Repeat Actions (redRepeatAction/All)**:
   - Cannot repeat: other repeat actions, swap actions
   - Shows all valid worker locations
   - Tracks recursion depth in logs
   - Maximum recursion depth: 5

### Blue Actions - Shop Control
1. **Shop Benefits (blueR1ShopBenefit)**:
   - Can access any R1 shop benefit regardless of closed status
   - Properly tracks recursion when chaining to red shops
   - Awards blue automatic VP

2. **Shop Interactions**:
   - Cost modifiers stack (increase/decrease)
   - Closed shops can be accessed via blue actions
   - Shop phase restrictions apply except for blue benefits

### Recursion Protection
- All action chains show depth in logs: "↳ Action chain depth: X"
- Maximum depth of 5 prevents infinite loops
- Warning message when max depth reached
- Recursion properly tracked through shop benefits