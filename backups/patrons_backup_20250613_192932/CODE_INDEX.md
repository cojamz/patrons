# Code Index for react-game.html

## Quick Navigation Map

### Core Game State & Logic
- **Initial State**: Line 210-248
- **Game Reducer**: Line 250-1200
  - UPDATE_RESOURCES: Line 278
  - PLACE_WORKER: Line 252
  - END_TURN: Line 370-510
  - ADVANCE_ROUND: Line 635-780
  - SYNC_GAME_STATE: Line 1149-1200

### Action Execution
- **executeAction**: Line 1700-3500
  - Yellow gain3yellow: Line 1860
  - Purple actions: Line 1830-1860
  - Red actions: Line 2100-2300
  - Blue actions: Line 2500-2700

### Shop System
- **Shop Data**: Line 6890-6950
  - Purple R1: cost: { purple: 1, any: 2 }
  - Blue costs: Line 6893
  - Red costs: Line 6891
  
- **Shop Purchase Handler**: Line 6500-6600
  - Cost validation: Line 6510-6530
  - Gem selection: Line 6550-6570
  
- **executeShopBenefit**: Line 5600-5900
  - Purple extra turn: Line 5644
  - Blue shop benefits: Line 5700
  
### Components
- **CompactShop**: Line 6450-6650
- **VictoryShop**: Line 7070-7170
- **GemSelectionModal**: Line 4280-4420
- **ActionSpace**: Line 1665-1700

### Player Targeting & Effects
- **selectTargetPlayer function**: Line 5500
  - Called for red steal gems: Line 4323, 4383
  - Called for red steal worker: Line 4460
  - Called for yellow share VP: Line 4657
  - Called for purple give VP: Line 6447
  - Called for victory point rewards: Line 6260, 6309, 6374
  
- **Force Red Placement**:
  - Action execution: Line 3162-3190
  - Effect application: Line 3163
  - Effect removal: Line 2190
  - Action definition: Line 8366
  
- **Effect Clearing**:
  - END_TURN clear effects: Line 484, 541
  - ADVANCE_ROUND clear effects: Line 915, 1091
  - Double gain effect removal: Lines 2407, 2494, 2576, 2633, 2668, 2746
  - Red placement effect removal: Line 2190

### Multiplayer
- **syncGameState**: Line 1716-1760
  - Firebase sync logic: Line 1720-1740
  - Player resource sync: Line 1737
- **Firebase listener**: Line 1235-1250
- **Room creation**: Line 1300-1350
- **updateGameInFirebase call**: Line 8551

### Key Patterns
```javascript
// Resource update:
dispatch({ type: 'UPDATE_RESOURCES', playerId: X, resources: {...} });

// Shop purchase:
if (canAfford(player, cost)) { executeShopBenefit(...) }

// Modal pattern:
showGemSelection(dispatch, title, count) -> Promise<gems>
```

## Common Bug Locations

### Cost Calculations
- Shop "any" cost: Line 6550-6570
- Resource validation: Line 6510-6530

### VP Systems  
- Blue auto VP: Line 5109, 6651, 7256
- Red auto VP: Line 1715, 2105
- VP source tracking: Line 422-507

### Turn/Round Logic
- Skip turns: Line 430-450
- Snake draft: Line 460-480
- Force red validation: Line 1684-1706
- Turn end effect clearing: Line 484, 541
- Round advance effect clearing: Line 915, 1091

## Quick Fixes Cheatsheet

### To fix shop costs:
1. Check shop data (line 6890)
2. Check cost validation (line 6510)
3. Check gem selection modal (line 6550)

### To fix VP issues:
1. Check automaticVPs init (line 1085)
2. Check shop benefit execution (line 5109)
3. Check VP source tracking (line 422)

### To fix sync issues:
1. Check syncGameState (line 1716)
2. Check SYNC_GAME_STATE (line 1149)
3. Check Firebase echo (line 1170)

### To fix targeting issues:
1. Check selectTargetPlayer (line 5500)
2. Check modal state management
3. Check async/await usage in action execution

### To fix effect issues:
1. Check effect application in executeAction
2. Check END_TURN clearing (line 484, 541)
3. Check ADVANCE_ROUND clearing (line 915, 1091)
4. Check specific effect removal (e.g., line 2190 for red placement)

## Recent Updates (January 2025)

### Player Targeting System
- Added **selectTargetPlayer** function for interactive player selection
- Implemented for red actions (steal gems/workers) and various VP sharing mechanics
- Modal-based UI with proper async/await handling

### Effect Management
- Consolidated effect clearing in END_TURN and ADVANCE_ROUND
- Added specific handling for "Must place on red layer" effects
- Improved double gain effect tracking and removal

### Multiplayer Improvements
- Updated syncGameState function with better error handling
- Fixed Firebase sync timing issues
- Added proper resource synchronization logging