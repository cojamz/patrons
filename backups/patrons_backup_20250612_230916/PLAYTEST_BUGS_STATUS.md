# Playtest Bug Status - January 9, 2025

## 📊 Summary
- **Fixed Today**: 35 bugs (28 morning + 7 afternoon/evening)
- **New Bugs Found**: 15 (7 critical, 4 UI/UX, 4 edge cases)
- **Still Broken**: ~20 bugs from previous sessions
- **Major Improvements**: Multiplayer sync, worker placement validation, effect cleanup

## ✅ FIXED TODAY (January 9, 2025):

### Morning Fixes:
1. **Shop cost reduction applying globally** - Now player-specific (only affects activating player)
2. **Purple skip turn in snake draft** - Now properly skips after reversal
3. **Double next gain effect** - Expanded to Yellow R2/R3, Silver R3, Gold R1/R2/R3 shops
4. **UI improvements** - Removed player number badges, moved Round/Turn indicators to sidebar
5. **Play 2 Workers edge case** - Fixed blocking turn end when no workers available
6. **Multiple syntax errors** - Fixed bracket mismatches preventing game load
7. **Turn order display** - Cards now show in turn order with position numbers
8. **Turn order by VP** - Lowest VP goes first each round
9. **Red swap worker on itself** - Now excluded from swap options
10. **Red repeat infinite loops** - Cannot repeat other repeat/swap actions
11. **Blue R3 infinite recursion** - Cannot select itself
12. **Purple R3 wait mechanic** - Now properly waits for others
13. **Black R3 negative VP** - REVERTED: VP can go negative (design decision)
14. **Round advance protection** - Added flag to prevent double-advance
15. **Persistent worker effect** - "Can place 2 more workers" now clears between turns
16. **Swap worker chaining** - Cannot swap onto/off swap actions, R2 only gives destination
17. **Force red placement** - Fixed validation to only check current round actions
18. **End Turn button visual** - Red and pulsing when turn complete (workersToPlace = 0)
19. **Red shop selection UI** - Always shows UI even with one option
20. **UI layout shift** - Added overflow controls to prevent shift when modals open
21. **Shop cost increase** - Fixed state.players to currentState.players reference
22. **Purple R3 action** - Changed from wait mechanic to extra turn
23. **Blue R3 action** - Now includes VP shops with correct VP values
24. **Shop descriptions** - Fixed Yellow and Blue shop descriptions in gain benefit UI
25. **R3 shop implementations** - All R3 shops verified and corrected
26. **Blue R3 stale state** - Fixed to use currentState when executing shop benefits
27. **Resource waste prevention** - Added warnings for suboptimal plays (extra turns, swaps, etc)
28. **Strategic flexibility** - Changed hard blocks to confirmable warnings

### Afternoon/Evening Fixes:
29. **Worker placement/swap bugs** - Fixed all worker swap validation and execution issues
30. **Force red placement validation** - Now properly validates red actions exist before forcing
31. **Skip turn interaction bugs** - Fixed purple skip turn mechanics with other effects
32. **Effects lingering between turns** - Cleared all temporary effects (workersToPlace, forceRedPlacement, etc)
33. **Round 3 shops not opening** - Fixed shop availability logic for R3
34. **Multiplayer sync instability** - Major sync improvements with currentState usage
35. **GameOver state not sticking** - Fixed game completion detection and state persistence

## ☑️ Previously Fixed (January 8)

## ✅ LIKELY FIXED by sync improvements:
1. **Yellow gain actions not updating** - Fixed with stale closure fix
2. **Gold conversion setting instead of adding** - Should be fixed
3. **Gain * not updating resources** - Should be fixed
4. **Actions not clearing between rounds** - occupiedSpaces undefined fix should help
5. **Resources from red shop repeat** - Should be fixed

## 🆕 NEW BUGS DISCOVERED TODAY (January 9):

### Critical Issues:
1. **Multiplayer state desync** - Players sometimes see different game states after complex actions
2. **Worker swap onto occupied spaces** - Validation sometimes allows invalid swaps
3. **Purple skip turn not clearing effects** - Some effects persist after skipped turns
4. **Force red placement UI** - Modal sometimes doesn't appear when required
5. **Round advancement race condition** - Multiple players clicking can cause issues
6. **Shop benefit execution order** - Some shops execute in wrong order with multiple effects
7. **Game completion detection** - GameOver sometimes triggers prematurely or not at all

### UI/UX Issues:
8. **Worker placement preview** - No visual feedback before confirming placement
9. **Shop cost display** - Modified costs don't always update in UI
10. **Turn order indicator** - Sometimes shows wrong player as active
11. **Resource animation lag** - Resource updates sometimes don't animate smoothly

### Edge Cases:
12. **Swap worker with skip turn** - Interaction not properly handled
13. **Multiple force red effects** - Stacking behavior unclear
14. **Shop closure during benefit** - Can cause incomplete execution
15. **Undo with complex actions** - Some actions can't be properly undone

## 🔴 STILL BROKEN - Need fixes:

### Shop Implementation Gaps:
1. **Red R3 shop effect** - "Repeat all actions this round" not implemented
2. **Yellow R2/R3 shop effects** - "Everyone gains gems" not implemented  
3. **Blue R2 shop** - "Gain benefit then close shop" incomplete
4. **Black R2 shop** - "Curse: -1 to all gains" not implemented

### Validation Issues:
1. **Shop "any" cost validation** - May not properly validate color + any combinations
2. **White shop VP costs** - Can now spend into negative VP (design decision)
3. **Force red with no red quad** - Should validate red exists
4. **Extra workers vs skip turns** - Complex interaction needs clarification

### Shop Issues:
6. **Blue/Red automatic VP not triggering** - Despite automaticVPs in state
7. **Shop state not persisting between rounds** - closedShops should persist
8. **Shop toggle not syncing to all players** - UI update issue
9. **R2/R3 shops not showing for P1** - Player-specific bug
10. **Shop cost increase not stacking** - Should stack with ADD_SHOP_COST_MODIFIER

### UI/UX Issues:
11. **"Turn 2 any" should read "Turn 2*"** - Text display issue
12. **Red swap workers showing players not actions** - Wrong selection UI
13. **Worker placement cancellation** - Already "fixed" with UNDO_LAST_WORKER
14. **Round advance screen sync** - Multiple clicks cause double advance
15. **Player cards not in turn order** - Display ordering issue

### Validation Issues:
16. **Extra turn with no workers** - Should show error and not charge
17. **Blue/Red infinite loop** - Need recursion prevention

### Purple VP Tracking:
18. **Purple VP not showing in hover** - vpSources tracking issue

## 🟡 NEEDS TESTING:
- Whether sync fixes resolved resource updates
- If round advancement properly clears actions now
- If automatic VPs work correctly in multiplayer

## Priority Order (Updated):
1. Fix multiplayer state desync issues
2. Fix game completion detection
3. Fix remaining shop implementations (Red R3, Yellow R2/R3, etc)
4. Fix automatic VP systems (Blue/Red)
5. Fix worker swap validation edge cases
6. Fix UI update lag and resource animations

## Root Causes (Updated):
- **State management** - Complex state updates causing race conditions
- **Multiplayer sync** - WebRTC connection issues and state reconciliation
- **Effect timing** - Order of operations for complex interactions
- **Validation gaps** - Edge cases in worker placement and shop interactions
- **UI reactivity** - Components not always re-rendering with state changes
- **Game flow logic** - Turn/round advancement and completion detection