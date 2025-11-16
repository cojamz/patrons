# Code Navigation Guide

**Last Updated**: November 15, 2025
**Version**: v0.5 (Vite/React Architecture)

This guide helps you quickly find specific code sections in the Patrons codebase.

---

## 📁 Directory Structure

```
src/
├── App.jsx              # Main game component (~7,778 lines)
├── main.jsx             # Application entry point (~20 lines)
├── index.css            # Global styles
├── state/
│   └── gameReducer.js   # Game state management (~400 lines)
├── data/
│   ├── allGameLayers.js # Action definitions (~800 lines)
│   ├── shopData.js      # Shop definitions (~400 lines)
│   └── constants.js     # Game constants (~50 lines)
├── firebase-compat.js   # Firebase configuration (~40 lines)
└── test/
    ├── setup.js         # Test configuration
    └── game.test.js     # Game tests
```

---

## 🎯 Key Files Overview

### `src/App.jsx` (~7,778 lines)
The main game component containing all UI and game logic.

**Major Sections**:
- Game context and provider
- Main App component
- Helper functions (action execution, shop handling, etc.)
- UI components (PlayerCard, GameLayer, ActionSpace, Shops)
- Modal components
- Firebase sync logic

### `src/state/gameReducer.js` (~400 lines)
Game state management and reducer logic.

**Key Exports**:
- `initialGameState` - Initial game state object
- `gameReducer` - Main reducer function
- Reducer handles actions: PLACE_WORKER, UPDATE_RESOURCES, PURCHASE_SHOP, END_TURN, etc.

### `src/data/allGameLayers.js` (~800 lines)
Definitions for all 8 resource types and their actions.

**Structure**:
```javascript
export const allGameLayers = {
  red: { name: 'Red', actions: [...] },
  yellow: { name: 'Yellow', actions: [...] },
  // ... 6 more colors
};
```

### `src/data/shopData.js` (~400 lines)
Shop definitions for all colors and rounds.

**Structure**:
```javascript
export const allShops = [
  { color: 'red', round: 1, cost: {...}, benefit: '...', ... },
  // ... more shops
];
```

### `src/firebase-compat.js` (~40 lines)
Firebase configuration and initialization.

---

## 🔍 Finding Specific Features

### Game State & Reducer

**File**: `src/state/gameReducer.js`

```
Line ~10-100:  initialGameState definition
Line ~100-400: gameReducer function
  - INIT_GAME action
  - PLACE_WORKER action
  - UPDATE_RESOURCES action
  - PURCHASE_SHOP action
  - END_TURN action
  - ADVANCE_ROUND action
  - SYNC_GAME_STATE action
```

### Action Definitions

**File**: `src/data/allGameLayers.js`

Each color's actions are defined in their respective section:
```
Red actions:     Lines ~50-150
Yellow actions:  Lines ~150-250
Blue actions:    Lines ~250-350
Purple actions:  Lines ~350-450
Gold actions:    Lines ~450-550
White actions:   Lines ~550-650
Black actions:   Lines ~650-750
Silver actions:  Lines ~750-850
```

### Shop Definitions

**File**: `src/data/shopData.js`

Shops organized by color and round:
```
Lines ~10-400: All shop definitions
  - Red shops
  - Yellow shops
  - Blue shops
  - Purple shops
  - Gold shops
  - White shops
  - Black shops
  - Silver shops
  - Victory shops
```

### Main Game Logic

**File**: `src/App.jsx`

**Context & Provider** (Lines ~1-150):
- GameProvider component
- useGame hook
- Context creation

**Main App Component** (Lines ~150-7778):

**Key Functions**:
- `executeAction()` - Executes action effects (search for "const executeAction")
- `handleActionClick()` - Handles action space clicks
- `handleShopClick()` - Handles shop purchases
- `executeShopBenefit()` - Applies shop effects
- `endTurn()` - End turn logic
- `advanceRound()` - Round transition logic

**UI Components**:
- `PlayerCard` - Player resource display
- `GameLayer` - Color layer with actions
- `ActionSpace` - Individual action button
- `CompactShop` - Shop display
- `CompactVictoryShop` - Victory shop
- Modal components (GemSelection, PlayerChoice, etc.)

**Firebase Sync**:
- `syncGameState()` - Sync to Firebase
- `useEffect` for Firebase listeners
- Multiplayer state management

---

## 🎮 Common Tasks & Where to Look

### Add a New Action

1. **Define action** in `src/data/allGameLayers.js`
   - Find the color's section
   - Add to `actions` array
   - Specify: title, round, effect, params

2. **Implement effect** in `src/App.jsx`
   - Find `executeAction()` function
   - Add case for new action type
   - Implement the logic

3. **Test** in `src/test/game.test.js`

### Add a New Shop

1. **Define shop** in `src/data/shopData.js`
   - Add to `allShops` array
   - Specify: color, round, cost, benefit, params

2. **Implement benefit** in `src/App.jsx`
   - Find `executeShopBenefit()` function
   - Add case for new benefit type
   - Implement the logic

### Modify Game State

1. **Update state structure** in `src/state/gameReducer.js`
   - Modify `initialGameState` if needed
   - Add new reducer action if needed

2. **Update UI** in `src/App.jsx`
   - Modify components to display new state
   - Update Firebase sync if needed

### Debug Multiplayer Issue

1. **Check Firebase config** in `src/firebase-compat.js`
2. **Check sync logic** in `src/App.jsx`
   - Find `syncGameState()` function
   - Check `SYNC_GAME_STATE` reducer action
3. **Check timestamp handling** in reducer

### Fix a Game Rule Bug

1. **Verify rule** in `IMPLEMENTATION_SPEC.md`
2. **Find implementation**:
   - Actions: `src/data/allGameLayers.js` and `App.jsx executeAction()`
   - Shops: `src/data/shopData.js` and `App.jsx executeShopBenefit()`
   - Turn logic: `App.jsx endTurn()`
   - Round logic: `App.jsx advanceRound()`
3. **Fix and test**

---

## 🔧 Useful Search Patterns

### Find a Component
```bash
grep -n "function ComponentName\|const ComponentName" src/App.jsx
```

### Find a Function
```bash
grep -n "const functionName\|function functionName" src/App.jsx
```

### Find Action Handling
```bash
grep -n "case 'ACTION_TYPE'" src/state/gameReducer.js
```

### Find Shop Benefit
```bash
grep -n "benefit:" src/data/shopData.js
```

### Find Firebase Code
```bash
grep -n "firebase\|Firebase" src/App.jsx src/firebase-compat.js
```

---

## 📊 Component Hierarchy

```
App
├── GameProvider
│   └── (Provides game state and dispatch)
│
└── Main Game UI
    ├── Header
    │   ├── Room Code Display
    │   └── Round/Turn Indicators
    │
    ├── Player Cards Grid
    │   └── PlayerCard (×4)
    │       ├── Name & VP
    │       ├── Resources Grid
    │       ├── Workers Display
    │       └── End Turn Button
    │
    ├── Game Layers Grid
    │   └── GameLayer (×8 colors)
    │       ├── Color Header
    │       ├── Automatic VP Display
    │       ├── Actions Grid
    │       │   └── ActionSpace (×N per color)
    │       └── Shops Grid
    │           ├── CompactShop (R1, R2, R3)
    │           └── CompactVictoryShop (VP shop)
    │
    └── Modals
        ├── GemSelectionModal
        ├── PlayerChoiceModal
        ├── RoundTransitionModal
        └── GameEndModal
```

---

## 🎯 Quick Reference: Critical Game Rules

Reference these sections when implementing/debugging:

### Force Red Placement
- **Rule**: Affects OTHER players, not placer
- **Location**: `App.jsx` - search for "forceRedPlacement"

### Shop Cost Modifiers
- **Rule**: PER-PLAYER, not global
- **Location**: `src/state/gameReducer.js` - player.shopCostModifier

### Repeat Actions
- **Rule**: Cannot repeat other repeat/swap actions
- **Location**: `App.jsx executeAction()` - repeat action logic

### Play More Workers Effect
- **Rule**: Only clears when workersToPlace === 0
- **Location**: `src/state/gameReducer.js` - END_TURN action

### Gold Shops
- **Rule**: Accept ANY resource as payment
- **Location**: `App.jsx` - shop purchase logic

### Blue Auto VP
- **Rule**: ALL players get +1 VP when ANYONE uses shop
- **Location**: `App.jsx` - shop purchase handler

---

## 📝 Notes

- Most game logic is in `src/App.jsx` (~7,778 lines)
- State management is in `src/state/gameReducer.js`
- Game data (actions, shops) is in `src/data/`
- Use `grep` or your editor's search to find specific functions
- Reference `DEVELOPER_GUIDE.md` for detailed development workflow
- Reference `IMPLEMENTATION_SPEC.md` for complete game rules

---

*For detailed implementation details, see `DEVELOPER_GUIDE.md`. For game rules, see `IMPLEMENTATION_SPEC.md`.*
