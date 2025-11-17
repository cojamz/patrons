# Changelog

All notable changes to Patrons v0.5 are documented here.

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
