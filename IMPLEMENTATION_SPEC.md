# Patrons Game Implementation Specification & Progress

**Version**: v0.5 (Vite/React Architecture)
**Last Updated**: November 15, 2025

## Overview
This document is the authoritative specification for Patrons game mechanics and rules. Implementation is in `src/` directory.

**Implementation Files**:
- Actions: `src/data/allGameLayers.js` and `src/App.jsx`
- Shops: `src/data/shopData.js` and `src/App.jsx`
- State: `src/state/gameReducer.js`

For code navigation, see `CODE_NAVIGATION.md`. For development guide, see `DEVELOPER_GUIDE.md`.

## Complete Layer Specifications

### Red - Worker Manipulation

**Actions:**
- Round 1:
  - `gain3red`: Gain 3 red
  - `gain2red`: Gain 2 red  
  - `redHybrid1`: +1 red + swap workers (both players get actions)
  - `redRepeatAction`: Repeat an action that one of your workers is on
- Round 2:
  - `forceRedPlacement`: +1 red, then OTHER players (not the placer) must place on red until red layer is full
  - `redHybrid2`: +1 red + swap workers (only you get action)
- Round 3:
  - `redRepeatAll`: Repeat the action of each of your workers (in any order you choose)

**Shops:**
- R1: 1 red + 2 any = Repeat a worker's action
- R2: 2 red + 2 any = Place the next player's worker
- R3: 4 red + 4 any = Repeat all actions taken this round by any player
- Victory Points: 5 red = 3 VP

**Automatic VP:** Gain 1 VP each time you use or repeat a red layer action (including if you swap a worker into red)

### Yellow - Resource Manipulation

**Actions:**
- Round 1:
  - `gain3yellow`: Gain 3 resources (any colors)
  - `gain2yellow`: Gain 2 resources (any colors)
  - `steal2Gems`: Trade all your resources for an equal number of resources of your choice
  - `yellowHybrid1`: Gain 2 yellow
- Round 2:
  - `steal3Gems`: Steal 3 cubes
  - `yellowHybrid2`: +1 yellow + double next gain (doesn't stack with shop)
- Round 3:
  - `yellowSwapResources`: Choose any player - swap all resources with them

**Shops:**
- R1: 1 yellow + 1 any = Double your next gain action
- R2: 2 yellow + 2 any = Gain 5 gems of any color
- R3: 3 yellow + 3 any = Gain 7 gems of any color
- Victory Points: 5 any = 3 VP

**Automatic VP:** At end of each round: +1 VP for each different color gem you have

### Blue - Shop Control

**Actions:**
- Round 1:
  - `gain3blue`: Gain 3 blue
  - `gain2blue`: Gain 2 blue
  - `blueShopBenefit1`: Gain a shop benefit (even if it's closed)
  - `blueShopBenefit2`: Gain a shop benefit (even if it's closed)
- Round 2:
  - `blueReduceCosts`: +1 blue + reduce all shop costs by 1 any
  - `blueIncreaseCosts`: +2 blue + increase all shop costs by 1 any
- Round 3:
  - `blueFlipShops`: +1 blue + flip the status of all shops, including victory shops

**Shops:**
- R1: 1 blue + 1 any = Toggle any shop (open/closed)
- R2: 2 blue + 2 any = Gain a shop benefit then close that shop
- R3: 3 blue + 3 any = Flip the status of all shops, including victory shops
- Victory Points: 5 blue = 5 VP

**Automatic VP:** Gain 1 VP each time you use any shop (*Using the "Gain a shop benefit" action counts as using a shop for VP purposes)

### Purple - Timing/Order

**Actions:**
- Round 1:
  - `gain4purpleSkip`: Gain 4 purple, skip your next turn
  - `gain3purple`: Gain 3 purple
  - `gain2purpleTakeBack`: Gain 2 purple, take back a worker on a different quad
  - `playTwoWorkers`: Play 2 more workers this turn
- Round 2:
  - `gain5purpleSkip`: Gain 5 purple, skip your turn (immediately)
  - `playThreeWorkers`: Play 3 more workers this turn
- Round 3:
  - `gain4purpleWaitAll`: Gain 4 purple. Skip turns until everyone else has run out of workers, then play all

**Shops:**
- R1: 1 purple + 2 any = Take an extra turn after this one
- R2: 2 purple + 2 any = Play 2 more workers this turn
- R3: 3 purple + 3 any = Play the rest of your workers
- Victory Points: 6 purple = 3 VP

**Automatic VP:** The first and last player to run out of workers each round each get 3 VP

## Implementation Progress

### ✅ Completed
1. **Layer action definitions updated** - All action arrays in allGameLayers updated
2. **Shop data updated** - All R1, R2, R3 shops defined with costs and effects
3. **Victory shop costs updated** - Yellow changed from 7 any to 5 any
4. **Shop UI updated** - R3 shops now display when round >= 3
5. **Red automatic VP completed** - ALL red actions now award 1 VP
6. **Red R3 action implemented** - redRepeatAll now repeats all player's worker actions
7. **Yellow R3 action implemented** - yellowSwapResources swaps all gems with chosen player
8. **Yellow automatic VP implemented** - Awards VP per different color gem at round end
9. **steal3Gems implemented** - Added to existing steal gem logic
10. **Blue shop benefit actions implemented** - Can gain any shop benefit even if closed
11. **Blue cost modification actions implemented** - Reduce/increase shop costs by 1 any
12. **Blue flip shops action implemented** - Flips all shop statuses (as effect)
13. **Blue automatic VP implemented** - Shop user gets 1 VP when using a shop (solo benefit)
14. **SET_RESOURCES reducer added** - For resource swapping functionality
15. **VP source tracking implemented** - All VP updates now include source parameter
16. **VP hover tooltip added** - Shows breakdown of VP by category on hover
17. **Shop UI made compact** - Efficient 4-column layout with hover tooltips
18. **Round-based shop filtering** - Only shows shops available in current round

### ❌ TODO - Missing Functionality

#### Red Layer
- [x] `redRepeatAll` action implementation (R3) ✅
- [ ] Red shop R3 effect: Repeat all actions taken this round by any player
- [x] Complete red automatic VP for ALL red actions ✅

#### Yellow Layer  
- [ ] `yellowHybrid1` - Trade any number of gems implementation
- [x] `steal2Gems` - Steal 2 gems from any player ✅
- [x] `steal3Gems` - Steal 3 gems from any player ✅
- [x] `yellowSwapResources` - Swap all resources with chosen player ✅
- [x] Yellow shop R2 effect: Gain 5 gems ✅
- [x] Yellow shop R3 effect: Gain 7 gems ✅
- [x] Yellow automatic VP system (end of round) ✅

#### Blue Layer
- [x] `blueShopBenefit1` & `blueShopBenefit2` - Gain shop benefit even if closed ✅
- [x] `blueReduceCosts` - Reduce all shop costs by 1 any ✅
- [x] `blueIncreaseCosts` - Increase all shop costs by 1 any ✅
- [x] `blueFlipShops` - Flip status of all shops ✅
- [x] Blue shop benefit actions now properly execute shop effects ✅
- [x] Blue shop R2 effect: Toggle all shop statuses ✅
- [x] Blue shop R3 effect: Gain any shop benefit ✅
- [x] Blue automatic VP system (when any player uses shop) ✅
- [x] Shop closed/open status tracking ✅

#### General Systems
- [x] Shop open/closed state management ✅
- [x] Cost modification system for shops ✅
- [x] Proper VP tracking with source breakdown ✅

#### Purple Layer
- [ ] Remove old purple actions that don't exist in new spec
- [ ] Verify all purple actions match the original spec

## Key Implementation Notes

1. **Automatic VP Systems:**
   - Red: Trigger on ANY red action execution
   - Yellow: Calculate at ADVANCE_ROUND based on gem diversity
   - Blue: Trigger on ANY shop purchase by ANY player

2. **Shop Status:**
   - Need to add `closedShops` and `flippedShops` to game state
   - Shops can be closed by blue actions
   - Victory shops can be flipped too

3. **Cost Modifications:**
   - Need to track cost modifiers in game state
   - Apply modifiers when checking shop affordability

## How to Use This Document

When context is compacted, reference this file by:
```
Read the file at /Users/cory/Patrons/IMPLEMENTATION_SPEC.md
```

This will give you the complete specification and current progress status.

## Summary of Remaining Work

### High Priority
1. **Shop Effects Implementation**: Several shop effects need implementation
   - Yellow R2/R3: Gain gems + everyone gains
   - Red R3: Repeat all actions taken this round
   - Blue R2: Gain benefit then close shop
   - Blue R3: Flip all shop statuses (shop effect)

2. **Yellow trade any number**: The yellowHybrid1 action needs proper implementation

3. **Purple layer cleanup**: Remove outdated actions and verify against original spec

### Medium Priority
- Comprehensive testing of all systems
- Edge case handling for complex interactions

### Low Priority
- Performance optimizations
- Additional UI polish

## Complex Interaction Considerations

### Action Chaining
1. **Red Repeat Actions + Other Layers**
   - Red repeat can trigger blue shop benefits
   - Red repeat can trigger yellow steals
   - ✅ Infinite loop prevention added (max recursion depth of 5)
   - Red repeat awards VP for each repeated red action

2. **Blue Shop Control + Cost Modifications**
   - Cost mods affect all players globally
   - Closed shops can still be accessed via blue actions
   - Shop flipping affects victory shops too
   - Blue shop benefit actions properly execute shop effects

3. **Yellow Resource Manipulation**
   - Stealing allows targeted gem theft from specific players
   - Swapping exchanges ALL resources between players
   - Double gain effect consumed after first use
   - Trade any number allows flexible gem conversion

4. **Purple Timing**
   - Extra workers apply in the following round (2 additional)
   - Turn order changes take effect next round
   - Multiple worker placement happens within same turn
   - Shop benefit hybrid gives access to any R1 shop effect

## Completed Improvements
1. **Infinite Loop Protection**: Added recursion depth tracking to executeAction
2. **Purple Actions**: Restored original simpler purple actions per spec
3. **Shop Effect Execution**: Blue shop benefit actions now properly execute effects
4. **VP Source Tracking**: All VP awards include source category
5. **Edge Case Handling**: Proper validation for worker swaps, resource trades

## Latest Updates (Post-Context)

### Major Improvements Since Last Context:
1. **4 New Quads Implemented**: Gold, White, Black, Silver - all working with unique mechanics
2. **Advanced Game Mode**: Players can choose Basic (4 standard quads) or Advanced (4 random from 8)
3. **Player Emoji System**: Each player gets unique emoji, shows on actions and in UI
4. **Shop UI Overhaul**: 
   - Removed explicit phase system - shops intuitively available based on state
   - Shops organized by quad in 4-column layout
   - All shops/actions visible but greyed when unavailable
5. **Fixed Shop Costs**:
   - Red R1: 1 Red + 2 ⭐ (was 1+1)
   - Purple R1: 1 Purple + 2 ⭐ (was 1+1)
   - White shops: Only cost VP, no resources
   - Gold shops: Accept ANY resource including gold for ⭐ costs
6. **Turn Skip Logic**: Extra turns consume skip counters properly
7. **UI Polish**: Round indicator, skip status indicators, better shop descriptions

### All Shop Effects Implemented:
- ✅ All Red, Yellow, Blue, Purple shops
- ✅ All Gold shops (convert resources to gold)
- ✅ All White shops (VP manipulation)
- ✅ All Black shops (stealing/aggression)
- ✅ All Silver shops (mutual benefit)

### Key Features Working:
1. Complete 8-quad system with all unique mechanics
2. Multiplayer with room codes
3. VP source tracking with hover tooltips
4. Shop cost modifiers and availability tracking
5. Complex action chains with recursion protection
6. Automatic VP systems for all quads
7. Victory shops with special effects (Black steals from all)
8. Worker stealing (Black R2 action)

### Recent Bug Fixes:
- Gold shops now properly allow any resource as ⭐ payment
- White shops correctly cost only VP
- Turn skipping works with extra turns
- Worker take back excludes same quad
- Shop toggle can open/close any shop including future rounds
- Multiplayer emoji sync fixed - emojis now display correctly in multiplayer
- Red shop repeat action fixed to use correct player state after cost deduction
- Black VP shop now steals 2 VP from each player (was 1)
- Round transition popup added with player standings
- Yellow "steal 2" changed to "Trade All ⭐ for ⭐"
- Yellow "trade" action simplified to "Gain 1 ⭐"
- Player emoji pool expanded from 40 to 160+ options

## Key Implementation Clarifications & Deviations

### Action Mechanics Clarifications:
1. **Force Red Placement (Red R2)**: 
   - Gives the placer +1 red resource
   - Forces OTHER players (not the placer) to place on red until full
   - This is an important distinction - the effect targets opponents, not yourself

2. **Yellow Actions Simplified**:
   - `steal2Gems` renamed to "Trade All ⭐ for ⭐" - trade ALL your resources for equal number of any colors
   - `yellowHybrid1` simplified from complex trade mechanic to "Gain 2 Yellow"
   - These changes improve game flow and reduce complexity

3. **Shop Cost Adjustments**:
   - Red R1: Changed from 1+1 to 1 red + 2 any (balancing)
   - Red R3: Changed from 3+3 to 4 red + 4 any (powerful effect justifies higher cost)
   - Purple R1: Changed from 1+1 to 1 purple + 2 any (extra turns are powerful)

4. **Blue Shop Effects Refined**:
   - R1: "Toggle" instead of just "Close" - can reopen closed shops
   - R2: "Gain benefit THEN close" - order matters for strategy
   - R3: "Flip all" includes victory shops - very powerful late game

### Automatic VP Clarifications:
1. **Red VP**: Triggers on ANY red action use, including when swapped into red
2. **Yellow VP**: Calculated at round end based on gem color diversity
3. **Blue VP**: Shop user gets VP when using a shop (solo benefit, NOT cooperative)
4. **Purple VP**: First AND last to run out of workers (not just one)

### Latest Session Changes (2025-01-06):
1. **Multiplayer Sync Fix**: Fixed SYNC_GAME_STATE to preserve player emojis
2. **Round Transition Popup**: Shows standings, VP, resources when advancing rounds
3. **Automatic Round Advancement**: Detects when all players out of workers
4. **Yellow Action Changes**:
   - "yellowHybrid1" changed from trade to simple "Gain 1 ⭐"
   - "steal2Gems" changed to "Trade All ⭐ for ⭐" (trade all resources for equal number)
5. **Black VP Shop**: Now steals 2 VP from each player instead of 1
6. **Red Shop Fix**: Repeat action now properly uses updated player state
7. **Emoji Pool**: Expanded to 160+ emojis including animals, objects, nature, fantasy, food

### Shop Timing Rule Changes (2025-11-16):
1. **Shop Usage Timing**: Shops can ONLY be used AFTER all workers are placed (removed "before workers" option)
2. **Phase Indicators**: Added clear UI indicators showing current phase:
   - "Place Worker (X remaining)" - blue badge
   - "Shopping Phase (Optional)" - purple badge
   - "Ready to End Turn" - green badge
3. **Active Effects Display System**: New UI component displays pending duration effects:
   - Shows effects like "2× Next Gain", "Skip Next Turn", "Extra Turn"
   - Clear trigger timing ("Next Turn", "After This Turn", etc.)
   - Color-coded badges with icons for easy scanning
   - Implemented in parseEffects() and ActiveEffects component in App.jsx
4. **End Turn Button Fix**: Button now always visible after workers placed (was disappearing after shop use)
5. **Skip Shopping Clarity**: Button text changes to "✓ Skip Shopping & End Turn" during shopping phase

## Remaining High Priority Work

### ✅ All Shops Now Implemented:
1. **Red R3**: Repeat all actions taken this round by any player ✅
2. **Yellow R2**: Gain 5 gems, everyone gains 1 of your choice ✅
3. **Yellow R3**: Gain 7 gems (not 9 - matches spec) ✅
4. **Blue R2**: Gain shop benefit then close that shop ✅
5. **Note**: Black R2 actually steals 3 VP (spec was incorrect)

### See `/Users/cory/Patrons/BACKLOG_2025_01_09.md` for complete list

Last Updated: 2025-01-10 (Implementation spec updated with clarifications)