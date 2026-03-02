# TODO

**Last Updated**: 2026-03-02

---

## Active Tasks

### Design & UX Polish
- [ ] **"Since your last turn" recap** — show what opponents did while you waited
- [ ] **Hover preview** — show what an action will do before committing
- [ ] **Scoring preview** — show projected end-of-round scoring

### Known Bugs
- [ ] **Golden Scepter double-firing** — fires twice during echo copy chain (two RESOURCE_GAINED events)
- [ ] **Game state banner** — "Waiting for Player 2..." / "Round 1 — Action Phase" context

### Low Priority
- [ ] Power card pixel icons need improvement (user flagged "really bad")
- [ ] Champion power delay — queue decisions until player has seen the board

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

---

## Completed

### 2026-03-02 - UX Polish Sprint
- [x] **Floating resource deltas** — "+2 gold" floats up from resource counter on gain/loss
- [x] **Turn change announcement** — cinematic banner "Your Turn" / "Player's Turn"
- [x] **Phase breadcrumb** — always-visible `Round › Phase › Player › Decision` indicator
- [x] **Power card trigger flash** — pulse/glow when a card activates
- [x] **Action result toast** — brief banner showing latest game events
- [x] **Last-placed worker glow** — breathing highlight on most recently placed worker
- [x] **Pulse on changed values** — gem backgrounds flash when resource counts change
- [x] **Game events infrastructure** — `useGameEvents` hook detects state diffs, powers all feedback

### 2026-03-02 - Ship Single-Player Sprint
- [x] **Handler frequency reset** — moved `resetHandlerFrequencies` before `dispatchEvent` in GameProvider (was after, broke once_per_round)
- [x] **AI turns fully working** — decisions (gem, target, steal, action choice, nullifier, redistribution), shops, power cards, round advance
- [x] **AI purchase logic** — evaluates shops AND power cards by priority, picks best affordable option
- [x] **AI timing** — slowed to 2s place, 1.8s market, 1.5s decisions for clear visual beats
- [x] **Purchase limit** — one shop OR power card per turn, same god only (`purchaseMadeThisTurn` flag)
- [x] **Cancel during chained decisions** — preserve original `preDecisionSnapshot` instead of overwriting
- [x] **Abort mechanism** — handlers return `{ abort: true }`, engine reverts worker placement
- [x] **Relive tier filter** — only allows Tier 1 actions (was allowing all tiers)
- [x] **Double next gain shop** — added `doubleNextGain` check to all 4 action handler `addResources`
- [x] **Tome of Deeds** — "Favor cannot be reduced" (was steal-only), `glory_reduction_immunity` modifier
- [x] **Champion draft order** — last place drafts first (reversed order)
- [x] **Rules interstitial** — 4-slide overlay before game setup
- [x] **Favor accounting** — click-to-expand breakdown in RoundTransition + hover tooltip in PlayerPanel
- [x] **Dynamic echo text** — shows actual last action + player name instead of static description
- [x] **VP condition banner** — gold gradient pill, prominent on both focused/collapsed views
- [x] **Shops vs powers visual distinction** — shops=row list with left border, powers=god-glow cards with icon badges
- [x] **Occupied action spaces** — use god colors (not player colors) to preserve god identity
- [x] **Turn order display** — shows upcoming 4 turns via snake draft computation
- [x] **Section hint tooltips** — `?` icon with portal tooltip on Shops/Powers sections
- [x] 416 tests passing (was 410)

### 2026-03-01 - Playtesting Bug Fixes + UX Improvements
- [x] **Bug A: TargetPlayer modal empty** — Added `options` field to all targetPlayer decisions
- [x] **Bug B: AI places all workers** — Rewrote useAITurns.js with atomic place→endTurn
- [x] **Bug C: Card market never refills** — Added powerCardDecks tracking + round-start refill
- [x] **stealGems decision type** — Full UI flow: DecisionModal routing, GemSelection steal mode, GameProvider handling, AI handling
- [x] **Round transition favor breakdown** — Shows "+X this round" deltas per player
- [x] **Tooltip coverage** — Power cards, resources, workers, favor counter, end turn button
- [x] **Tab overlap fix** — Gradient background on tabs strip, increased board padding
- [x] **Collapsed empty space fix** — Removed flex-1 from collapsed actions div
- [x] **Tooltip stacking context fix** — FloatingTooltip renders via React portal
- [x] **UX contract tests** — 8 new tests validating engine↔UI field contracts

### 2025-11-21 - Red R1 Shop Balance & Multiplayer Modal Targeting
- [x] Nerf Red R1 shop, fix infinite loop exploit, implement multiplayer modal targeting

### 2025-11-17 - VP Shop Fixes & UI Improvements
- [x] Yellow VP shop gem selection, VP shop usage tracking, VP shop ends turn, copy last gain bug, action log improvements

### 2025-11-16 - Playtesting Bug Fix Session + Purple/Red Analysis
- [x] VP shops starting closed, red auto VP double-counting, patron swap multiplayer, blue/purple auto VP checks, double next gain persistence, yellow shop cancellation, deep purple/red analysis, swap black into basic mode, lastGain tracking, multiplayer & UI bug fixes
