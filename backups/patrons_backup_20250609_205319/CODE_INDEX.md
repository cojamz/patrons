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

### Multiplayer
- **syncGameState**: Line 1402-1422
- **Firebase listener**: Line 1235-1250
- **Room creation**: Line 1300-1350

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
- Force red: Line 1684-1706

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
1. Check syncGameState (line 1402)
2. Check SYNC_GAME_STATE (line 1149)
3. Check Firebase echo (line 1170)