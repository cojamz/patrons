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

// Target player selection (replaced showPlayerSelection)
selectTargetPlayer(state, currentPlayerId, excludeSelf, dispatch);
```

## Current Session Status (January 9, 2025 - Evening Session)

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

### ✅ Additional Fixes (January 9, 2025 - Latest Session):
- Fixed actualCost undefined error in CompactVictoryShop
- Removed incorrect multiplayer swap note
- Fixed executeRepeatAction to always show selection UI
- Fixed VP shop costs in spec (Blue = 5, Purple = 6)
- All R3 shops verified and corrected

### ✅ Critical Multiplayer & Game Logic Fixes (January 9, 2025 - Evening):
1. **Multiplayer Sync Stability Overhaul**:
   - Added timestamp-based deduplication to prevent duplicate updates
   - Implemented echo detection with `justSyncedFromFirebase` flag
   - Added `isSyncing` flag to prevent sync loops during updates
   - Fixed React stale closure issues in `syncGameState` function
   - Resolved Firebase echo loop that was overwriting local updates

2. **Worker Placement & Swap Fixes**:
   - Fixed "double take back" bug where both swap worker and target were returned
   - Fixed "play more workers" effect not working properly with swaps
   - Fixed skip turn interaction with worker swaps
   - Corrected swap logic to only give destination benefit in R2+

3. **Force Red Placement Overhaul**:
   - Fixed critical bug where force red was applied to placing player
   - Now correctly affects OTHER players as intended
   - Updated `canPlaceWorker` validation to properly check constraints
   - Force red placement now only affects subsequent players

4. **Effect Management Improvements**:
   - More aggressive clearing of temporary effects at turn end
   - Fixed persistent "can place 2 more workers" effect
   - Improved effect cleanup in multiplayer sync
   - Added proper effect state management

5. **Round 3 Shop Opening Fix**:
   - Fixed shops not opening properly in Round 3
   - Corrected shop state persistence between rounds
   - Ensured natural R2/R3 shop openings work correctly

6. **GameOver State Sync**:
   - Added extensive debugging for gameOver state synchronization
   - Fixed issues with game ending conditions in multiplayer
   - Improved end game state management

7. **showPlayerSelection Bug Fix**:
   - Replaced all instances of undefined `showPlayerSelection` with `selectTargetPlayer`
   - Fixed player selection UI for swap actions and other targeted effects
   - Ensured consistent player selection behavior across all actions

### ✅ All High Priority Bugs Fixed!

### 🟡 Medium Priority Items:
- Double next gain effect coverage (many actions still don't check)
- Red automatic VP not always triggering
- Shop toggle UI sync in multiplayer
- Purple VP tracking in hover tooltip
- Investigate remaining multiplayer sync edge cases
- Consider moving to action-based sync architecture

### 📋 Current Status:
- **Backlog**: See `/Users/cory/Patrons/BACKLOG_2025_01_09.md` for 40+ items
- **Bug History**: See `/Users/cory/Patrons/PLAYTEST_BUGS_STATUS.md`
- **Today's Fixes**: Shop costs, skip turns, doubling effect, UI layout, force red placement, showPlayerSelection replacement, multiplayer sync stability

### 🛠️ Technical Details:
- **Main file**: `/Users/cory/Patrons/react-game.html`
- **Key functions**:
  - `syncGameState` (line 1402) - Firebase sync with timestamp deduplication
  - `gameReducer` (line 250) - State management
  - `UPDATE_RESOURCES` (line 278) - Resource updates
  - `SYNC_GAME_STATE` (line 1149) - Sync handler with echo detection
  - `executeAction` (line 1700+) - Action execution
  - `executeShopBenefit` (line 5600+) - Shop logic
  - `canPlaceWorker` (line 2935) - Worker placement validation with force red fix
  - `selectTargetPlayer` (line 3750) - Player selection UI (replaced showPlayerSelection)
- **Key sync flags**:
  - `justSyncedFromFirebase` - Prevents echo loops
  - `isSyncing` - Prevents sync during state updates
  - `lastSyncTimestamp` - Deduplicates rapid updates

### 🎯 Next Actions:
1. Fix Purple R1 shop cost calculation (Line ~6510-6590)
2. Fix blue automatic VP triggering (Lines 5109, 6756, 7256)
3. Fix shop state persistence between rounds
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
- Timestamp deduplication solved many sync issues but adds complexity
- Current sync architecture is fragile - full state sync has inherent race conditions
- Force red placement bug was critical - affected wrong player
- showPlayerSelection was undefined throughout codebase - now using selectTargetPlayer

### ⚠️ Remaining Architectural Concerns:
1. **Multiplayer Sync Architecture**:
   - Current full-state sync approach is prone to race conditions
   - Timestamp-based deduplication is a band-aid solution
   - Should consider action-based sync (send actions, not state)
   - Need proper conflict resolution for simultaneous updates
   
2. **State Management Issues**:
   - React stale closures in Firebase listeners
   - Complex effect interactions hard to track in multiplayer
   - State updates can be lost during sync conflicts
   
3. **Performance Concerns**:
   - Full state sync on every change is inefficient
   - Large state objects being transmitted frequently
   - No delta/patch-based updates

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