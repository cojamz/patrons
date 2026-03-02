# Changelog

All notable changes to Patrons are documented here.

---

## [2026-03-02] - UX Polish Sprint — Visual Feedback & Player Clarity

### Added
- **`useGameEvents` hook** (`src/v3/hooks/useGameEvents.js`): State diff engine that detects resource changes, turn changes, worker placements, favor deltas, power card triggers, and new log entries. Powers all visual feedback components. Events auto-expire after 2.5s.
- **Floating resource deltas** (`FloatingDeltas.jsx`): God-colored "+2" / "-1" labels float upward from the resource counter when values change. Positioned above the Blessings section in PlayerPanel.
- **Turn change announcement** (`TurnAnnouncement.jsx`): Cinematic center-screen banner showing "Your Turn" or "Player's Turn" on turn boundaries. Portaled to body, auto-dismisses (1.6s human, 0.9s AI). Worker icon with breathing glow.
- **Action result toast** (`ActionToast.jsx`): Brief banners below the top HUD showing latest game log entries. Stacks up to 3, god-colored accent pips, auto-dismisses with slide animation.
- **Last-placed worker glow**: Most recently placed worker token gets a breathing god-colored glow (2.5s cycle). Tracked via `game.roundActions` last entry. Passes `isLastPlaced` through GodArea → ActionSpace → WorkerToken.
- **Power card trigger flash**: When a power card activates (detected via log entry matching), the PowerCardSlot plays a scale pulse (1→1.08→1) with expanding god-colored box-shadow.
- **Resource pulse on change**: ResourceDisplay gems now flash with a colored background when values change — gold for gains, red for losses. Builds on existing `useAnimatedValue` direction detection.

### Changed
- **TurnIndicator → Phase Breadcrumb**: Restructured from flat labels to flowing breadcrumb: `Round 1 › Action Phase › Player's Turn (3) › Choose Target`. Active segment highlighted, decision crumb pulses amber. Chevron separators replace pipe dividers. Contextual hint preserved below breadcrumb.

### Technical Details
- 416 tests still passing (no engine changes)
- New files: `useGameEvents.js`, `FloatingDeltas.jsx`, `TurnAnnouncement.jsx`, `ActionToast.jsx`
- Modified: `TurnIndicator.jsx`, `WorkerToken.jsx`, `ActionSpace.jsx`, `GodArea.jsx`, `PowerCardSlot.jsx`, `ResourceDisplay.jsx`, `PlayerPanel.jsx`, `App.jsx`
- Z-index tiers: deltas=z-30, toast=z-45, announcement=z-55 (below modals at z-50+)
- `useGameEvents` uses shallow ref comparison — no GameProvider changes needed
- Card trigger detection: scans new log entries for known power card names

---

## [2026-03-02] - Ship Single-Player Sprint

### Fixed
- **Handler frequency reset**: `resetHandlerFrequencies` called before `dispatchEvent` in GameProvider (was after, making `once_per_round` handlers fire every time)
- **AI turns fully functional**: handles all decision types (gem selection, target player, steal gems, action choice, nullifier placement, resource redistribution), never cancels (always submits best-effort answer)
- **Cancel during chained decisions**: `preDecisionSnapshot` preserved from original state instead of being overwritten at each chained decision step
- **Abort mechanism**: action handlers return `{ abort: true }` when no valid targets; engine saves pre-placement state and reverts worker placement
- **Relive tier filter**: only allows repeating Tier 1 actions (was allowing all tiers)
- **Double next gain shop**: all 4 action handler files (gold, black, green, yellow) now check for `doubleNextGain` effect, apply doubling, and consume it
- **Tome of Deeds**: changed from "cannot be stolen" to "cannot be reduced" — blocks ALL glory loss via `glory_reduction_immunity` modifier in every `removeGlory` function
- **Golden Scepter**: partially investigated (fires twice during echo — two RESOURCE_GAINED events), not yet resolved

### Added
- **AI shop + power card purchasing**: evaluates both shops and power cards after placing worker, picks best by priority (cards=7, strong/vp shops=5, weak shops=3)
- **Purchase limit enforcement**: one shop OR power card per turn, from accessed god only (`purchaseMadeThisTurn` flag)
- **Champion draft order**: last place drafts first (reversed from `[1,2,3]` to `[3,2,1]`)
- **Rules interstitial**: 4-slide tutorial overlay before game setup (place workers, build engine, earn favor, 3 rounds)
- **Favor accounting tooltip**: click-to-expand breakdown in RoundTransition, hover tooltip in PlayerPanel with source labels
- **Dynamic echo text**: echo/copy actions show actual last action + player name instead of static description
- **VP condition banner**: prominent gold gradient pill with glow on both focused and collapsed god views
- **Section hint tooltips**: `?` icon on Shops/Powers sections with portal tooltip explaining purchase rules
- **Turn order display**: shows upcoming 4 turns computed via snake draft algorithm
- 6 new tests (doubleNextGain integration, purchase limit, draft order) — 416 total

### Changed
- **Shops visual redesign**: row/list layout with colored left border (was card-style, too similar to powers)
- **Powers visual redesign (collapsed)**: god-glow cards with circular icon badges, distinct from shops
- **Occupied action spaces**: use god colors instead of player colors to preserve god identity
- **Worker tokens**: smaller (20px) with subtle drop-shadow on occupied spaces
- **AI timing**: slowed across the board (2s place, 1.8s market, 1.5s decisions, 2.5s round advance)
- **Balance AI**: Tome of Deeds value increased (6→8 with black, 3→5 without)

### Technical Details
- 416 tests passing (was 410)
- `preDecisionSnapshot` logic: `state.preDecisionSnapshot || { game: state.game, log: state.log }`
- `abort` flow: `executeAction` saves `preplacementState` before worker placement, checks `actionResult.abort`, reverts if set
- `getDynamicEffect()` in GodArea.jsx computes real-time effect text for `copySource` actions
- `tryAIPurchase()` replaces `tryAIBuyCard()` — evaluates all affordable shops + cards, sorts by priority

---

## [2026-03-01] - Playtesting Bug Fixes, UX Improvements, Tooltip Portal Fix

### Fixed
- **Bug A**: TargetPlayer modal showed empty for black steal actions — added `options` field to all 3 targetPlayer decisions in `blackActions.js`
- **Bug B**: AI placed all workers without alternating turns — rewrote `useAITurns.js` with atomic place→endTurn using `processingRef` guard, removed `occupiedSpaces` from deps
- **Bug C**: Power card market never refilled between rounds — added `powerCardDecks` to game state in `createGame`, added refill logic to `executeRoundStart` in `phases.js`
- **stealGems decision type completely unhandled** — added DecisionModal routing (App.jsx), GemSelection steal mode, GameProvider submitDecision handling, AI handler in useAITurns
- Player tabs overlapping god panel content — gradient background on tabs strip, increased board padding (pb-28→pb-36), adjusted board height calc
- Excessive empty space in collapsed god panels — removed `flex-1` from collapsed actions container in GodArea
- Tooltip stacking context — FloatingTooltip rendered via React portal to `document.body` to escape z-10 grid, now visible above z-50 player panel

### Added
- Round transition favor breakdown — shows "+X this round" / "-X this round" deltas per player in `RoundTransition.jsx`
- Tooltip coverage: power card icons (name + description), resource gems (god name + title), worker icons (X of Y remaining), favor counter, disabled end turn button (who we're waiting for)
- UX contract test suite (`uxContract.test.js`) — 8 tests validating engine↔UI field contracts, turn alternation, market refill, and stress simulations (10 random 2P games, 5 random 4P games)
- Playwright MCP installed for future visual playtesting (`claude mcp add playwright`)

### Technical Details
- 391 tests passing (383 original + 8 new UX contract tests)
- GemSelection.jsx supports steal mode: increment limited by `targetResources[type]`, "They have: X" label
- GameProvider snapshots glory before `advanceRound()` to compute deltas, attaches `lastRoundGloryDeltas` and `lastRoundPreGlory` to game state
- `powerCards` imported as `powerCardsData` alias in PlayerPanel to avoid naming conflict with champion's cards array

---

## [2025-11-21] - Red R1 Shop Balance & Multiplayer Modal Targeting

### Fixed
- Red R1 shop infinite loop: Excluded blueR1ShopBenefit, blueAnyShopBenefit, and purpleShopHybrid from repeat to prevent recursion
- Red R1 shop balance: Now only repeats Round 1 actions (not R2/R3) - too powerful when repeating later rounds
- Multiplayer patron swap modals: Added targetPlayerId routing so each patron owner sees their own modals and makes their own decisions (uncommitted)

### Changed
- Shop text clarity: "R1" → "Round 1" for better readability
- Red R1 shop functionality: Limited to Round 1 actions only via allowedRounds parameter

### Technical Details
- Added `targetPlayerId` parameter to executeAction function (line 1119)
- Created `effectiveTargetPlayerId` variable defaulting to player.id
- Updated selectTargetPlayer to accept and pass through targetPlayerId
- Updated ~30 modal calls (showChoice, showGemSelection, showStealGems, selectTargetPlayer) to use effectiveTargetPlayerId
- Added round filtering to executeRepeatAction with allowedRounds parameter
- Multiplayer modal targeting builds successfully, ready for testing

**Commits**: c9d069b, c84b3d1, 6f19a69, 551c089
**Uncommitted**: Multiplayer modal targeting implementation (src/App.jsx)

---

## [2025-11-17] - VP Shop Fixes & UI Improvements

### Fixed
- Yellow VP shop now prompts for gem selection instead of auto-deducting gems
- VP shops limited to 1 per turn (separate tracking from regular shops)
- VP shop purchase now ends turn - regular shops blocked after VP shop
- Copy last gain bug: yellowHybrid2 now correctly copies other players' gains
- Red R2 shop multiplayer: Fixed next player detection with optional chaining

### Changed
- Action log now shows player names instead of "Player X"
- Action log filters out zero-value resources for cleaner display
- Action log visual improvements: gradient, icons, better spacing
- Repeat action exclusions simplified: only excludes redRepeatAction itself
- Shop text clarity: "a player" → "another player" (Red R3, Black R1/R2/R3)
- Phase indicators updated to show "Turn Complete" after VP shop
- Turn flow: Place workers → Regular shop (optional) → VP shop (optional) → End

### Technical Details
- Added `vpShopUsed` state tracking (resets on turn end and round advance)
- Added `USE_VP_SHOP` reducer action
- VP shop `handlePurchase` now async to support gem selection modal
- VP shop state synced to Firebase for multiplayer
- Added `formatLogMessage()` helper for better log readability
- Updated exclusion lists in 5 locations to allow more action repeats

**Commits**: 8815305, 96556a8, b90d751, ce1aaa5, df49c34, 5970f91

---

## [2025-11-16] - Playtesting Bug Fix Session (7 bugs)

### Fixed
- VP shops now start OPEN instead of closed
- Red auto VP double-counting: 4 VP → 2 VP (action once, repeat once)
- Patron swap (redHybrid1) now benefits both players in multiplayer
- Blue auto VP only applies when Blue layer is in the game
- Purple auto VP only applies when Purple layer is in the game
- Yellow R2/R3 shops now properly refund costs when cancelled
- Double next gain effect now persists across turns and rounds

### Changed
- Yellow shop functions now return true/false to indicate success/cancellation
- executeShopBenefit now checks return values and propagates failures
- Auto VP checks added: automaticVPs?.blue and automaticVPs?.purple

### Technical Details
All bugs discovered through user playtesting. Fixes tested and verified before committing.

**Commits**: a6cf1b7, 41e1bd2, 1f7b4f9, e282e6a, 185a2b5, a5ab8e9, 06ae507

---

## [2025-11-16] - Purple/Red Analysis & Layer Swap

### Added
- Black layer now default in basic mode (replacing Purple)
- Comprehensive documentation of 12 purple/red layer bugs

### Changed
- Basic mode now uses: Red, Yellow, Blue, **Black** (was Purple)
- Purple still available in advanced mode random selection
- Updated game mode description text

### Analysis Findings
**Purple Layer Bugs (12 total)**:
- 3 game-breaking: Exclusion list inconsistencies, infinite turns, TAKE_BACK_WORKER bug
- 4 critical: Auto VP amount wrong, last-to-run-out logic, extra turn stacking, double-decrement
- 4 moderate: Partial workers, extra turn with 0 workers, force placement bonus, repeat take back
- 1 unclear: Skip turn stacking (strategy or exploit?)

**Decision**: Purple too complex with multiple edge cases. Swapped Black (simpler stealing mechanics) into basic mode.

**Commit**: aedd4d0

---

## [2025-11-16] - Yellow Layer Implementation

### Added
- `lastGain: {}` property to player state initialization
- lastGain tracking in UPDATE_RESOURCES reducer (tracks OTHER players' gains, not own)

### Fixed
- Yellow auto VP description now correctly states "per complete set of all colors" instead of "per different color gem"
- lastGain tracking prevents players from copying their own gains (only tracks other players)

### Changed
- yellowHybrid2 action now works correctly with proper lastGain tracking

**Commit**: aeb0900

---

## [2025-11-16] - Multiplayer & UI Bug Fixes Session

### Fixed
- Round summary modal now shows on automatic round advance (not just manual)
- End Turn button only shows to current player in multiplayer
- Actions no longer get stuck in limbo when validations fail (pendingPlacements bug)
- Yellow shops now show correct updated definitions (synced inlineShopData with shopData.js)
- Verified shop cost modifiers properly reset each round

### Added
- VP breakdown to round summary modal (more prominent display)
- VP breakdown to end-game screen with detailed sources
- Round transition modal now shows to all players in multiplayer
- Any player can close the round modal, syncs to all clients

### Changed
- Round modal visibility in multiplayer - all players see it
- Pending placement marker set only after validations pass
- VP breakdown styling improved (text-sm, darker color)

**Commits**: c6664d6, 8c4b86f, d010714, e59cd87, 64e0645

---

## [2025-01-16] - Meta-Framework Enhancements

### Added
- TODO.md for persistent task tracking across sessions
- CHANGELOG.md with auto-generated history from git commits
- Enhanced `/checkpoint` command to update all 3 state files (implementation_state.md, TODO.md, CHANGELOG.md)
- Enhanced `/start` command to read TODO.md and CHANGELOG.md for better context restoration

### Changed
- Improved context preservation workflow: /checkpoint updates everything, /start reads everything
- Better session continuity with persistent task tracking

**Commit**: e787245

---

## [2025-11-16] - Multiplayer & Turn Flow Fixes

### Added
- Automatic room cleanup (24-hour expiration) to prevent database clutter
- `createdAt` timestamp to all Firebase rooms
- Debug logging for turn validation (multiplayer debugging)

### Fixed
- Firebase configuration blocking multiplayer sync
- Room creation timeouts causing game state divergence
- Turn validation issues preventing players from taking actions
- Firebase rules now allow room cleanup while maintaining security

### Changed
- Turn flow restructured: VP shops now independent from regular shops
- Players can buy BOTH regular shop (R1/R2/R3) AND VP shop in same turn
- Phase indicator shows available shop options more clearly

**Commits**: fd18e9c, 1f79980, 2df9e93, d97acf3

---

## [2025-11-16] - Yellow Layer Redesign

### Changed
- Complete redesign of Yellow layer actions, shops, and automatic VP
- Clarified Red swap action text for better player understanding
- Refined Red layer text for clarity

**Commits**: c27f0a4, b828bef, 18f4d9b

---

## [2025-11-16] - Worker → Patron Terminology Update

### Changed
- Updated all user-facing text from "Workers" to "Patrons"
- Updated all hardcoded shop text with new terminology
- Rebuilt app with terminology updates

**Commits**: 2d5f710, ee63be6, 3322e87, 8f8a3a7

---

## [2025-11-16] - Red Layer Redesign

### Changed
- Replaced problematic Red actions with improved versions
- Fixed VP rewards for Red layer actions

**Commits**: eb6f176

---

## [2025-11-16] - Shop Timing & Phase Indicators

### Added
- Phase indicators showing current game phase
- Active Effects Display system

### Changed
- Overhauled shop timing rules for clearer turn structure
- Updated documentation for shop timing rule changes

### Fixed
- Bug fixes from production testing

**Commits**: b0ee169, 5c500e0, d7704e7

---

## [2025-11-15] - Meta-Framework & Documentation

### Added
- `/checkpoint` system for tracking implementation state
- Comprehensive v0.5 documentation:
  - DEVELOPER_GUIDE.md
  - CODE_NAVIGATION.md
  - Updated README.md, CLAUDE.md, IMPLEMENTATION_SPEC.md

### Changed
- Archived all v0 files to `archive/` directories
- Cleaned up workspace for v0.5 development
- Replaced CLAUDE.md with v0.5 version

**Commits**: ae93f37, a8397ba, 716efab, e2104a8

---

## [2025-11-15] - UI Polish & Visual Improvements

### Fixed
- Shop cost display issues
- End Turn button display

### Changed
- Restructured player cards to two-row vertical layout
- Made player cards taller (more square proportions)
- Combined all top elements into single row
- Moved automatic VP text to center of layer header
- Made Round and Player Turn indicators same height as player cards

**Commits**: e03aa23, 5ae5266, 0fb99fc, 2612332, 3c032a3, a93fedc, 1c8d080, c3071a5, 5588360, 770daaf, dc869de

---

## Earlier History

See git log for complete history. Project migrated from single-file HTML (v0) to modular Vite/React architecture (v0.5) in November 2025.
