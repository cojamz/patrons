# Playtest Bug Status - January 9, 2025

## ✅ FIXED TODAY:
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

## ☑️ Previously Fixed (January 8)

## ✅ LIKELY FIXED by sync improvements:
1. **Yellow gain actions not updating** - Fixed with stale closure fix
2. **Gold conversion setting instead of adding** - Should be fixed
3. **Gain * not updating resources** - Should be fixed
4. **Actions not clearing between rounds** - occupiedSpaces undefined fix should help
5. **Resources from red shop repeat** - Should be fixed

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