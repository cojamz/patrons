# Pending Changes and Fixes for Patrons Game

## Status Key:
- 🔴 Not Started
- 🟡 In Progress  
- 🟢 Completed
- ❌ Blocked/Issue

## Changes Queue:

### 1. 🟢 Update Shop Toggling to Exclude Unrevealed Shops
- Only show shops that are available in the current round
- Don't show R2 shops in R1, R3 shops in R1/R2
- **Status**: Completed

### 2. 🟢 Update Victory Shop Costs and VP Values
- Blue VP: 5 blue = 3 VP → 4 blue = 5 VP
- Yellow VP: 5 any = 3 VP → 4 any = 3 VP (cost only)
- Purple VP: 6 purple = 3 VP → 4 purple = 5 VP  
- Red VP: 5 red = 3 VP → 4 red = 5 VP
- **Status**: Completed

### 3. 🟢 Add Player Emojis
- Give each player a random emoji identifier
- Show emoji in player box after name (P1: 🦁 or PlayerName 🦁)
- Show emoji on action spaces where workers are placed
- Display worker count as emoji icons instead of "Workers Left: X"
- **Status**: Completed
- **Implementation**: Added emoji pool of 40 options, emojis persist through resets

### 4. 🟢 Update Worker Emoji Display & Wildcard Symbol
- Remove colored circle background from worker emojis on actions
- Make worker emojis larger on action spaces
- Replace "Any Gem" with a wildcard star symbol (like colorless energy)
- **Status**: Completed
- **Implementation**: Removed background styling, increased emoji size to text-2xl, replaced "any" with ⭐

### 5. 🟢 Shop and Action Visibility Changes
- Always show all shops and actions (regardless of round)
- Grey out unavailable actions/shops for current round
- Add lock symbol 🔒 to shops that have been toggled off
- Blue toggle action should be able to toggle ANY shop (including future rounds)
- **Status**: Completed
- **Implementation**: All shops/actions visible, unavailable ones at 40% opacity, lock icons added

### 6. 🟢 Player Skip Status & Round Display
- Show "Skipping next turn" on player cards when they will skip
- Show "Waiting for others" on player cards when waiting for others to run out
- Center R3 action in the middle of each quad
- Add clear round indicator in top corner of screen
- **Status**: Completed
- **Implementation**: Added status indicators, centered R3 actions, added round indicator in top-right

### 7. 🟢 Update Stealing UI to Match Gem UI
- Update the stealing interface to be similar to the gem selection UI
- Show clickable gem icons from the target player's resources
- **Status**: Completed
- **Implementation**: StealGemsModal already existed, updated steal actions to use it

### 8. 🟢 Update "Gain Star" UI
- Update the "gain any color" gem selection to match the gem selection UI style
- Use same clickable interface as yellow gem selection
- **Status**: Completed
- **Implementation**: Updated yellowHybrid1 and yellow shops to use GemSelectionModal

### 9. 🟢 Fix Shop Toggle for Future Round Shops
- When toggling a shop from a future round, it should become available immediately
- Remove round-based availability checks when a shop is explicitly opened
- **Status**: Completed
- **Implementation**: Future shops now start closed, toggling open makes them available immediately

### 10. 🟡 Add Basic/Advanced Game Mode Selection
- Add game mode selection: "Basic" or "Advanced"
- Basic: Uses standard 4 quads (Red, Yellow, Blue, Purple)
- Advanced: Randomly selects 4 quads from a pool of 8
- Prepare infrastructure for 4 additional quads
- **Status**: In Progress

### 11. 🟢 Implement GOLD Quad - Gold Accumulation
- Round 1: Gain 2 Gold | Turn 2 Any to 2 Gold | Gain 1 Gold | Turn 1 Any to 1 Gold
- Round 2: Gain 3 Gold, Skip Next Turn | Turn 3 Any to 3 Gold
- Round 3: Gain VP for Each Gold You Have
- Shops: R1: 1G+1⭐=2G | R2: 2G+2⭐=4G | R3: 3G+3⭐=Double Gold
- VP Exchange: 10 Gold = 15 VP
- Auto VP: 1 VP at End of Each Round for Each Gold You Have
- **Status**: Completed
- **Implementation**: All actions and shops match specification exactly

### 12. 🟢 Implement WHITE Quad - VP Trading
- Round 1: Gain 3 VP | Gain 2 VP | Spend 1 Any for 2 VP | Spend 2 Any for 3 VP
- Round 2: Lose 1 VP, Gain 2 Any | Lose 2 VP, Gain 4 Any
- Round 3: Gain 5 VP and 5 Any
- Shops: R1: 1W+1⭐=Lose 1VP, Gain 1⭐ | R2: 2W+2⭐=Lose 3VP, Skip Next | R3: 3W+3⭐=Lose 5VP, Move Worker
- VP Exchange: None (uses VP directly)
- Auto VP: Start Game with 5 VP
- **Status**: Completed
- **Implementation**: All actions and shops match specification exactly

### 13. 🟢 Implement BLACK Quad - Stealing/Aggression
- Round 1: Gain 3 Black | Gain 2 Black | +1B, Steal 1 VP | Steal 2 Any
- Round 2: +1B, Steal Worker | All Others Lose 2 VP
- Round 3: +1B, All Others Lose 4 VP
- Shops: R1: 1B+1⭐=Steal 1VP | R2: 2B+2⭐=Steal 3VP | R3: 3B+3⭐=Steal 5VP
- VP Exchange: 6 Black = Steal 1 VP from Each Other Player
- Auto VP: Whenever You Steal from Another Player, Gain 1 VP
- **Status**: Completed
- **Implementation**: All actions and shops match specification exactly

### 14. 🟢 Implement SILVER Quad - Mutual Benefit
- Round 1: +4S Others +1S | +3S Others +1S | +2S+1⭐ Others Get Same | +2VP Pick Other +2VP
- Round 2: +2S Take Back 2 Workers Others Take 1 | +3S+2⭐ Others Get 1
- Round 3: +8VP Others Get +3S
- Shops: R1: 1S+1⭐=2VP | R2: 2S+2⭐=4VP Pick Other 4VP | R3: 3S+3⭐=7S Others 2S
- VP Exchange: 6 Silver = 8 VP
- Auto VP: End of Round: Most VP Get 3S, Others Get 2VP
- **Status**: Completed
- **Implementation**: All actions and shops match specification exactly

### 15. 🔴 [Awaiting next change...]

## Notes:
- Created: 2025-01-06
- Last Updated: 2025-01-06