# Playtest Bug Status After Sync Fixes

## ✅ LIKELY FIXED by sync improvements:
1. **Yellow gain actions not updating** - Fixed with stale closure fix
2. **Gold conversion setting instead of adding** - Should be fixed
3. **Gain * not updating resources** - Should be fixed
4. **Actions not clearing between rounds** - occupiedSpaces undefined fix should help
5. **Resources from red shop repeat** - Should be fixed

## 🔴 STILL BROKEN - Need fixes:

### Critical Issues:
1. **Gold VP shop still showing** - Code shows null return but still appearing
2. **Auto VP from non-existent quads** - Despite checks for gameLayers
3. **Purple skip turn not working in snake draft** - Already "fixed" but still broken
4. **Purple R1 shop taking 2 purple instead of 1+2any** - Cost calculation issue
5. **Force red placement breaking** - Players can't even pick red actions

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

## Priority Order:
1. Fix Gold VP shop (users explicitly said it should be removed)
2. Fix Purple R1 shop cost calculation
3. Fix force red placement
4. Fix automatic VP systems (Blue/Red)
5. Fix shop persistence and UI sync

## Root Causes:
- **Sync issues** - Many fixed with our improvements
- **UI not updating** - Components not re-rendering with state changes
- **Validation missing** - Need checks before actions
- **Text/display bugs** - Simple fixes needed
- **Game logic errors** - Cost calculations, VP triggers