# Patrons Game Implementation Specification & Progress

## Overview
This document tracks the complete specification for the Patrons game layers and the implementation progress. Use this to maintain continuity when context is compacted.

## Complete Layer Specifications

### Red - Worker Manipulation

**Actions:**
- Round 1:
  - `gain3red`: Gain 3 red
  - `gain2red`: Gain 2 red  
  - `redHybrid1`: +1 red + swap workers (both players get actions)
  - `redRepeatAction`: Repeat an action that one of your workers is on
- Round 2:
  - `forceRedPlacement`: Other players must place on red until red layer is full
  - `redHybrid2`: +1 red + swap workers (only you get action)
- Round 3:
  - `redRepeatAll`: Repeat the action of each of your workers (in any order you choose)

**Shops:**
- R1: 1 red + 1 any = Repeat a worker's action
- R2: 2 red + 2 any = Place the next player's worker
- R3: 3 red + 3 any = Repeat all actions taken this round by any player
- Victory Points: 5 red = 3 VP

**Automatic VP:** Gain 1 VP each time you use or repeat a red layer action (including if you swap a worker into red)

### Yellow - Resource Manipulation

**Actions:**
- Round 1:
  - `gain3yellow`: Gain 3 different colored cubes
  - `gain2yellow`: Gain 2 different colored cubes
  - `steal2Gems`: Steal 2 cubes
  - `yellowHybrid1`: +1 yellow + trade in any number of cubes
- Round 2:
  - `steal3Gems`: Steal 3 cubes
  - `yellowHybrid2`: +1 yellow + double next gain (doesn't stack with shop)
- Round 3:
  - `yellowSwapResources`: Choose any player - swap all resources with them

**Shops:**
- R1: 1 yellow + 1 any = Double your next gain action
- R2: 2 yellow + 2 any = Gain 5 cubes any color, everyone gains 1 cube of your choice
- R3: 3 yellow + 3 any = Gain 9 gems of any kind, each other player gains 1 color of your choice
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
- R1: 1 blue + 1 any = Close any shop this round
- R2: 2 blue + 2 any = Gain a shop benefit then close that shop
- R3: 3 blue + 3 any = Flip the status of all shops, including victory shops
- Victory Points: 5 blue = 3 VP

**Automatic VP:** Gain 1 VP each time any player uses any shop (*Using the "Gain a shop benefit" action counts as using a shop for VP purposes)

### Purple - Timing/Order (Original)
(Keep existing implementation)

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
13. **Blue automatic VP implemented** - All players get 1 VP when anyone uses any shop
14. **SET_RESOURCES reducer added** - For resource swapping functionality

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
- [ ] Yellow shop R2 effect: Gain 5 gems + everyone gains 1
- [ ] Yellow shop R3 effect: Gain 9 gems + everyone gains 1 each
- [x] Yellow automatic VP system (end of round) ✅

#### Blue Layer
- [x] `blueShopBenefit1` & `blueShopBenefit2` - Gain shop benefit even if closed ✅
- [x] `blueReduceCosts` - Reduce all shop costs by 1 any ✅
- [x] `blueIncreaseCosts` - Increase all shop costs by 1 any ✅
- [x] `blueFlipShops` - Flip status of all shops ✅
- [ ] Blue shop R2 effect: Gain shop benefit then close it
- [ ] Blue shop R3 effect: Flip all shop statuses
- [x] Blue automatic VP system (when any player uses shop) ✅
- [ ] Shop closed/open status tracking

#### General Systems
- [ ] Shop open/closed state management
- [ ] Cost modification system for shops
- [ ] Proper VP tracking with source breakdown

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
1. **Shop Effects Implementation**: Many shop effects are defined but not implemented
   - Yellow R2/R3: Gain gems + everyone gains
   - Red R3: Repeat all actions taken this round
   - Blue R2: Gain benefit then close shop
   - Blue R3: Flip all shop statuses

2. **Shop State Management**: 
   - Track which shops are open/closed
   - Apply cost modifications from blue actions
   - Actually implement shop flipping functionality

3. **Yellow trade any number**: The yellowHybrid1 action needs proper implementation

### Medium Priority
- Purple layer verification (ensure it still works correctly)
- Comprehensive testing of all systems
- VP source tracking improvements

Last Updated: Context Compaction Imminent