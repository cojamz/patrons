# React Game Bug Fixes - Test Plan

## Issues Fixed:

### 1. Purple R1 Shop Cost Issue
**Problem**: Purple R1 shop (1 purple + 2 any = extra turn) was taking 2 purple instead of 1 purple + 2 any
**Fix**: Updated the gem selection logic to properly exclude already-spent gems from "any" selection
**Test**: 
- Have 1 purple and 2 other gems
- Buy purple R1 shop
- Should only deduct 1 purple and let you choose 2 other gems

### 2. Purple R1 Shop Extra Turn
**Problem**: Purple R1 shop not giving the extra turn
**Fix**: Added UPDATE_PLAYER action to increment extraTurns property, and updated END_TURN to check both effects and extraTurns property
**Test**:
- Buy purple R1 shop
- End turn
- Should immediately get another turn

### 3. Shop Cost Increase Stacking
**Problem**: blueIncreaseCosts not stacking when repeated
**Fix**: Using ADD_SHOP_COST_MODIFIER which adds to existing modifier instead of replacing it
**Test**:
- Use blueIncreaseCosts action (shop costs +2)
- Use it again (should be +4 total)
- Shop costs should reflect cumulative increase

### 4. Force Red Placement
**Problem**: forceRedPlacement breaking the game - players can't place on red
**Fix**: Changed state.gameLayers.find to Object.values(state.gameLayers).find since gameLayers is an object, not array
**Test**:
- Use forceRedPlacement action
- Other players should be forced to place on red layer
- Once red is full, they can place elsewhere

### 5. Basic vs Advanced Mode
**Finding**: No functional differences between modes, only which layers are available
**Test**:
- All fixes should work in both basic and advanced modes

## Code Changes Summary:

1. **Purple R1 shop extra turn** (line 6481-6493): Added UPDATE_PLAYER to grant extraTurns
2. **Extra turn check** (line 401-406): Check both effects and extraTurns property
3. **Extra turn consumption** (lines 434, 487): Decrement extraTurns when consuming
4. **Purple shop cost** (line 6388-6392): Fixed to exclude any color's specific cost from "any" selection
5. **Force red placement** (line 1693): Fixed gameLayers access from array to object