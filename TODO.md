# TODO

**Last Updated**: 2026-03-01 13:55

---

## Active Tasks

### P3 Polish (from playtesting plan)
- [ ] **F: Game state banner** — "Waiting for Player 2 to place a patron" / "Round 1 — Action Phase"
- [ ] **G: Shop & action visual polish** — warm parchment for shops, stone for actions (continue)
- [ ] **H: Champion power delay** — queue decisions until player has seen the board

### Purple/Red Layer Bugs (12 total, documented 2025-11-16, ON HOLD)

**Game-Breaking**:
- [ ] Bug #8: Inconsistent exclusion lists (infinite workers exploit)
- [ ] Bug #13: Can repeat extra turn action → infinite turns
- [ ] Bug #3: TAKE_BACK_WORKER caps workersToPlace at 1

**Critical**:
- [ ] Bug #1: Purple auto VP gives 3 VP instead of 4 VP
- [ ] Bug #2: "Last to run out" VP awarded before player runs out
- [ ] Bug #4: Extra turn stacking inconsistent
- [ ] Bug #7: Extra turn effect + property both decremented

**Moderate**:
- [ ] Bug #5: Partial workers inconsistent
- [ ] Bug #6: Extra turn with 0 workers can cause stuck state
- [ ] Bug #9: Red force placement + purple effects give bonus placements
- [ ] Bug #11: Repeat "take back" can exceed placed workers

**Unclear**:
- [ ] Bug #12: Skip turn stacking — strategy or exploit?

### Low Priority
- [ ] Power card pixel icons need improvement (user flagged "really bad")

---

## Backlog
- [ ] Playwright visual playtesting (MCP installed, needs session restart)
- [ ] Remove turn validation debug logging (cleanup from Firebase debugging)

---

## Completed

### 2026-03-01 - Playtesting Bug Fixes + UX Improvements
- [x] **Bug A: TargetPlayer modal empty** — Added `options` field to all targetPlayer decisions in blackActions.js
- [x] **Bug B: AI places all workers** — Rewrote useAITurns.js with atomic place→endTurn and processingRef guard
- [x] **Bug C: Card market never refills** — Added powerCardDecks tracking + round-start refill in phases.js
- [x] **stealGems decision type** — Full UI flow: DecisionModal routing, GemSelection steal mode, GameProvider handling, AI handling
- [x] **D: Round transition favor breakdown** — Shows "+X this round" deltas per player
- [x] **E: Tooltip coverage** — Power cards, resources, workers, favor counter, end turn button
- [x] **Tab overlap fix** — Gradient background on tabs strip, increased board padding
- [x] **Collapsed empty space fix** — Removed flex-1 from collapsed actions div in GodArea
- [x] **Tooltip stacking context fix** — FloatingTooltip renders via React portal to document.body
- [x] **UX contract tests** — 8 new tests validating engine↔UI field contracts + stress simulations
- [x] **Playwright MCP installed** — `claude mcp add playwright` for visual playtesting

### 2025-11-21 - Red R1 Shop Balance & Multiplayer Modal Targeting
- [x] **Nerf Red R1 shop** - Now only repeats Round 1 actions (not R2/R3)
- [x] **Fix infinite loop exploit** - Excluded shop benefit actions from Red R1 repeat
- [x] **Implement multiplayer modal targeting** - Added targetPlayerId parameter to executeAction, updated ~30 modal calls for correct player routing during patron swaps (uncommitted, builds successfully)

### 2025-11-17 - VP Shop Fixes & UI Improvements
- [x] **Fix Yellow VP shop gem selection** - Now prompts for gem choice instead of auto-deducting
- [x] **Add VP shop usage tracking** - Limited to 1 VP shop per turn
- [x] **VP shop ends turn** - Regular shops blocked after VP shop purchase
- [x] **Fix copy last gain bug** - yellowHybrid2 now correctly copies other players' gains
- [x] **Improve action log** - Player names, filtered zero values, better formatting
- [x] **Simplify repeat action exclusions** - Now only excludes redRepeatAction
- [x] **Fix Red R2 shop multiplayer** - Properly finds next player with optional chaining
- [x] **Update shop text** - "a player" → "another player" for clarity

### 2025-11-16 - Playtesting Bug Fix Session
- [x] **Fix VP shops starting closed** - VP shops now start OPEN (not closed)
- [x] **Fix red auto VP double-counting** - Changed from 4 VP to 2 VP (action + repeat)
- [x] **Fix patron swap multiplayer** - Both players now benefit from swapped actions
- [x] **Fix blue auto VP when not in game** - Added automaticVPs?.blue check
- [x] **Fix double next gain persistence** - Effect now carries over across rounds
- [x] **Fix yellow shop cancellation** - Costs properly refunded when cancelled
- [x] **Fix purple auto VP when not in game** - Added automaticVPs?.purple check

### 2025-11-16 - Purple/Red Analysis & Layer Swap
- [x] **Deep ultrathink analysis of purple layer** - Found 7 critical bugs
- [x] **Deep ultrathink analysis of Red+Purple interactions** - Found 5 more bugs (12 total)
- [x] **Swap Black into basic mode** - Replaced Purple in basic mode (Purple still in advanced)

### 2025-11-16 - Yellow Layer Implementation Session
- [x] **[5] Implement lastGain tracking** - Added lastGain: {} to player state, tracks OTHER players' gains (not own)
- [x] **Fix Yellow auto VP description** - Changed from "per different color" to "per complete set of all colors"

### 2025-11-16 - Multiplayer & UI Bug Fixes Session
- [x] **[URGENT] Fix multiplayer desync** - Fixed game state synchronization issues
- [x] **[1] Shop phase text clarity** - Updated shop phase indicator text
- [x] **[2] Shop phase text visibility** - Added phase info to turn card for all players
- [x] **[3] Round summary card on auto-advance** - Modal now shows on automatic round advance
- [x] **[3a] VP breakdown in round summaries** - Added detailed VP source breakdown to round summaries
- [x] **[3b] End-of-game summary** - Added VP breakdown to final game over screen
- [x] **Fix yellow shops showing old definitions** - Synced inlineShopData with shopData.js
- [x] **[7] Verify shop cost modifiers are per-round** - Confirmed they reset properly in ADVANCE_ROUND
- [x] **Fix actions stuck in limbo** - Fixed pendingPlacements not clearing when validations fail
