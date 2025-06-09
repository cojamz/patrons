# Playtest Issues Tracker

## Status Key:
- 🔴 Not Started
- 🟡 In Progress  
- 🟢 Completed
- ❌ Needs Investigation

## Critical Issues (Breaking Game)

### 1. ❌ Yellow Actions Not Working in Multiplayer
- Gain 3* doesn't update resources after selection
- "Yellow is just straight up not working in multiplayer"
- **Partial Fix Applied**: Modal now only shows to current player
- **Still Need**: Verify UPDATE_RESOURCES is working

### 2. 🟢 Multiplayer Sync Missing Fields
- Missing gold, white, black, silver resources in sync
- Missing automaticVPs in sync
- Missing vpSources in sync
- **Fix Applied**: Added all missing fields to SYNC_GAME_STATE

### 3. ❌ Actions Not Clearing Between Rounds
- "none of the actions clear after rounds" in multiplayer
- occupiedSpaces should be reset to {}
- **Need to verify**: ADVANCE_ROUND is clearing occupiedSpaces

### 4. ❌ Force Red Placement Breaking
- "Forcing other people to play on red actions seems to break the game"
- Players can't even pick red actions when forced
- **Partial Fix Applied**: Fixed gameLayers check
- **Still Need**: Test thoroughly

## Resource Issues

### 5. ❌ Gold Conversion Setting Instead of Adding
- "Turn 2* to 2 gold also set my gold state to 2 instead of adding"
- **Investigation**: Gold conversion actions use UPDATE_RESOURCES which should add

### 6. ❌ Gain * (Star) Actions Not Updating
- "Still having issues with Gain *. Players aren't having it add to their resources"
- Works in local but not multiplayer

### 7. ❌ Red Shop Repeat Not Giving Resources
- "Turn of Gain 3 red, then buying the red shop, and repeating that action didn't give the appropriate VP and also did not give the player 3 Red"

## VP Issues

### 8. ❌ Auto VP from Non-Existent Quads
- "Auto VP is being added from quads that aren't in the game"
- **Investigation**: Code checks gameLayers before adding auto VP

### 9. 🟢 Purple VP Sources Not Showing
- "Showing VP sources on hover-over doesn't show VP from Purple quad"
- **Fix Applied**: Added vpSources tracking for Purple

### 10. ❌ Blue Automatic VP Not Working
- "R1 blue shop didn't give VP"
- "Sometimes shops aren't giving VP per the blue condition"
- **Partial Fix Applied**: Added automaticVPs to initial state

### 11. ❌ Red Automatic VP Not Working
- "R1 red shop didnt give VP"

## Shop Issues

### 12. ❌ Gold VP Shop Still Exists
- "The gold VP shop is still there, I thought we got rid of it"
- **Investigation**: Code shows null return for gold VP shop

### 13. ❌ Purple R1 Shop Issues
- Taking 2 purple instead of 1 purple + 2 any
- Not granting extra turn
- **Partial Fix Applied**: Fixed cost calculation

### 14. ❌ Shop State Not Persisting
- "Does the shop state carry over between rounds? It should"
- closedShops should persist except R2/R3 shops opening naturally

### 15. ❌ Shop Toggle UI Sync
- "If a shop is toggled on and off it should show in the UI for all players"

### 16. ❌ Shop Cost Increase Not Stacking
- "Repeating the action of increasing shop costs did not further increase shop costs"
- **Investigation**: Uses ADD_SHOP_COST_MODIFIER which should stack

### 17. ❌ R2/R3 Shops Not Showing for P1
- "R2 and R3 shops are shown as available to P2 P3 and P4 but not P1"

## UI/UX Issues

### 18. ❌ Purple Skip Turn Not Working
- "Gain 4 purple skip turn was used by P4 in their first turn, but it didn't skip their second turn"
- **Fix Applied**: Fixed double-decrement in snake draft

### 19. ❌ Extra Turn Validation
- "If have no workers and try to pay for an extra turn, you should receive an error"
- Should prevent purchase and not charge resources

### 20. 🟢 Worker Placement Cancellation
- "Canceling actions in the UI should cancel the worker placement"
- **Fix Applied**: Added UNDO_LAST_WORKER action

### 21. ❌ Round Advance Screen Issues
- "Two people clicking advance in the end of round screen ended up going right to round 3"
- Should dismiss for all players when one advances

### 22. ❌ Red Swap Workers UI
- "the UI should be selecting actions instead of selecting players"
- Currently shows player selection instead of action selection

### 23. ❌ Player Cards Order
- "Player cards should be put in turn order"

## Game Logic Issues

### 24. ❌ Blue/Red Shop Infinite Loop
- "infinite loop of selecting R1 shop benefit on Blue Quad then choosing Red 1 shop"
- Need recursion limit or prevention

### 25. 🟢 Local Game Not Loading
- "The local game straight up isn't loading now"
- **Fix Applied**: Fixed duplicate variable declarations

## Summary Stats:
- Total Issues: 25
- Completed: 4 (16%)
- Partial Fixes: 8 (32%)
- Not Started: 13 (52%)

## Priority Order:
1. Yellow actions in multiplayer (core gameplay)
2. Resource updates (gold, star actions)
3. Shop functionality (costs, VP, persistence)
4. Round transitions and action clearing
5. UI/UX improvements