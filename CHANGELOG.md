# Changelog

All notable changes to Patrons v0.5 are documented here.

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
