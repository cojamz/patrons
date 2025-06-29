# CLAUDE.md - AI Assistant Context for Patrons Game

## 🎯 IMPORTANT: How to Work on This Codebase

### Before You Start:
1. **DO NOT search through the 8000-line HTML file!** Use `/Users/cory/Patrons/CODE_INDEX.md` instead
2. **ALWAYS backup before changes**: Run `./backup-game.sh`
3. **The game currently works** - preserve this at all costs
4. **Test with debug mode**: `react-game.html?debug=true`

### Key Files to Reference:
- `CODE_INDEX.md` - Line numbers for everything (USE THIS FIRST!)
- `IMPLEMENTATION_SPEC.md` - Complete game specification
- `PLAYTEST_BUGS_STATUS.md` - Current bugs and status
- `COMPLEX_INTERACTIONS.md` - Edge cases and interactions
- `DEVELOPER_README.md` - Development best practices

### Code Navigation Tips:
```
# Instead of searching for "shop costs":
1. Read CODE_INDEX.md
2. Find "Shop Data: Line 6890-6950"
3. Go directly to line 6890

# Common locations:
- Reducer: Lines 250-1300
- Actions: Lines 1700-3500
- Shops: Lines 6500-6950
- Components: Lines 6240-7400
```

### Critical Patterns:
```javascript
// Resource updates (safe pattern)
dispatch({ type: 'UPDATE_RESOURCES', playerId, resources: {...} });

// Action execution
const result = executeAction(state, actionName, playerId);
// Returns: { newState, updates: [{type, playerId, ...}] }

// Shop benefit execution
executeShopBenefit(benefit, state, playerId, dispatch);
```

## Current Session Status (January 9, 2025)

### ✅ Major Fixes Completed Today:
1. **Shop cost reduction now player-specific** - Fixed global modifier applying to all players
2. **Skip turns working in snake draft** - Fixed double skip at reversal points
3. **Persistent worker effect clearing** - "Can place 2 more workers" now clears properly
4. **Swap worker exclusions** - Cannot swap onto/off swap actions, R2 only gives destination benefit
5. **Force red placement validation** - Only checks current round actions
6. **End Turn button visual** - Red and pulsing when turn complete
7. **Red shop selection UI** - Always shows options even with one choice
8. **UI layout shift prevention** - Added overflow controls for modals
9. **Shop cost modifiers** - Fixed state vs currentState reference
10. **Purple R3 action** - Changed from wait to extra turn
11. **Blue R3 shop benefit** - Now includes VP shops with correct values
12. **Shop descriptions corrected** - Fixed Yellow/Blue shop descriptions in UI
13. **R3 shop implementations** - Yellow R2/R3 corrected, Blue R3 = gain any benefit
14. **Stale state in Blue R3** - Fixed currentState usage
15. **Implementation spec updated** - Corrected to match actual game behavior
16. **Resource waste prevention** - Added warnings for suboptimal plays
17. **Strategic flexibility** - Changed hard blocks to confirmable warnings

### ✅ Additional Fixes (This Session):
- Fixed actualCost undefined error in CompactVictoryShop
- Removed incorrect multiplayer swap note
- Fixed executeRepeatAction to always show selection UI
- Fixed VP shop costs in spec (Blue = 5, Purple = 6)
- All R3 shops verified and corrected

### 🔴 High Priority Bugs Still To Fix:

#### 1. Purple R1 Shop Cost Issue
- **Bug**: Taking 2 purple instead of 1 purple + 2 any
- **Location**: Lines 6510-6590 (shop purchase handler)
- **Root cause**: Either validation or automatic fallback selection
- **Fix needed**: Debug the automatic gem selection when modal cancelled
- **Config correct**: Line 6892 shows { purple: 1, any: 2 }

#### 2. Blue Automatic VP Not Working
- **Bug**: Shops not giving VP despite automaticVPs.blue = true
- **Location**: Line 6756 (regular shops), 7256 (victory shops), 5109 (shop benefits)
- **Setup**: Line 1104 sets automaticVPs.blue = true when blue layer active
- **Issue**: Either automaticVPs not syncing or condition not met
- **Fix needed**: Add debug logging to verify automaticVPs state

#### 3. Shop State Not Persisting
- **Bug**: Toggle state not carrying between rounds
- **Location**: closedShops state management
- **Fix needed**: Preserve closedShops except natural R2/R3 openings

### 🟡 Medium Priority Items:
- Double next gain effect coverage (many actions still don't check)
- Red automatic VP not always triggering
- Shop toggle UI sync in multiplayer
- Purple VP tracking in hover tooltip

### 📋 Current Status:
- **Backlog**: See `/Users/cory/Patrons/BACKLOG_2025_01_09.md` for 40+ items
- **Bug History**: See `/Users/cory/Patrons/PLAYTEST_BUGS_STATUS.md`
- **Today's Fixes**: Shop costs, skip turns, doubling effect, UI layout

### 🛠️ Technical Details:
- **Main file**: `/Users/cory/Patrons/react-game.html`
- **Key functions**:
  - `syncGameState` (line 1402) - Firebase sync
  - `gameReducer` (line 250) - State management
  - `UPDATE_RESOURCES` (line 278) - Resource updates
  - `SYNC_GAME_STATE` (line 1149) - Sync handler
  - `executeAction` (line 1700+) - Action execution
  - `executeShopBenefit` (line 5600+) - Shop logic

### 🎯 Next Actions:
1. Fix Purple R1 shop cost calculation (Line ~6510-6590)
2. Fix force red placement validation (Check canPlaceWorker)
3. Fix blue automatic VP triggering (Lines 5109, 6756, 7256)
4. Test all fixes in multiplayer
5. Deploy to production

### 🔧 How to Fix Bugs Efficiently:
1. **Read bug description** in PLAYTEST_BUGS_STATUS.md
2. **Check CODE_INDEX.md** for relevant line numbers
3. **Use Read tool** with specific line ranges (not whole file!)
4. **Test in debug mode** before committing changes
5. **Update bug status** when fixed

### 💡 Key Insights:
- Most multiplayer issues were caused by React stale closure in sync
- Firebase echo loop was overwriting local updates
- Need to consider moving to action-based sync for better multiplayer

### 📝 Files to Reference:
- `/Users/cory/Patrons/CONTEXT_SAVE_2025_01_08.md` - Today's session summary
- `/Users/cory/Patrons/PLAYTEST_BUGS_STATUS.md` - Current bug status
- `/Users/cory/Patrons/IMPLEMENTATION_SPEC.md` - Game specification
- `/Users/cory/Patrons/PENDING_CHANGES.md` - Change tracking

## How to Continue After Compaction:
1. **Read these files in order**:
   - `/Users/cory/Patrons/CLAUDE.md` (this file)
   - `/Users/cory/Patrons/CODE_INDEX.md` (for navigation)
   - `/Users/cory/Patrons/PLAYTEST_BUGS_STATUS.md` (current issues)
2. **Use debug tools**:
   - Open `dev-tools.html` for testing
   - Run game with `?debug=true`
   - Check console for `debug.*` commands
3. **Make targeted fixes**:
   - Use CODE_INDEX.md to find exact lines
   - Read only relevant sections (50-100 lines)
   - Test immediately in debug mode
4. **Deploy safely**:
   - Run `./backup-game.sh` first
   - Test multiplayer thoroughly
   - Use `quick-deploy.js` or drag to Netlify

## Game Architecture Summary:
- **Single HTML file**: Everything in react-game.html (7964 lines)
- **No build process**: Direct browser execution
- **React without JSX**: Uses React.createElement
- **Firebase multiplayer**: Real-time sync with rooms
- **8 game quads**: Red, Yellow, Blue, Purple, Gold, White, Black, Silver
- **3 rounds**: Progressive actions and shops per quad
- **Complex interactions**: Actions can trigger other actions (depth limit: 5)

## Common Pitfalls to Avoid:
1. **Don't read entire file** - Use CODE_INDEX.md instead
2. **Don't refactor** - Game works, keep it working
3. **Don't add dependencies** - Keep it simple
4. **Don't break multiplayer** - Test sync after changes
5. **Don't forget edge cases** - Check COMPLEX_INTERACTIONS.md