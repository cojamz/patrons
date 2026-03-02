# Implementation State

**Last Updated**: 2026-03-02

## Current State
Single-player is **playable and deployed** at https://cornycolonies.netlify.app. 416 tests passing. UX polish sprint complete — visual feedback systems now make it clear what happened, whose turn it is, and when cards activate.

## What's Working
- Full 3-round game loop: champion draft → action phase → shops/cards → round end scoring → next round
- AI opponent: places workers, evaluates and buys shops/power cards, handles all decision types
- Champion draft: last place picks first (catch-up mechanic)
- Purchase limit: one shop OR power card per turn, from accessed god only
- Abort mechanism: actions with no valid targets revert worker placement
- Cancel safety: chained decisions preserve original snapshot for clean revert
- Double next gain shop: works across all 4 god action handlers
- Tome of Deeds: blocks all favor reduction (not just steals)
- Dynamic action text: echo/copy actions show what they'll actually do
- Favor accounting: expandable breakdown in round transition + hover tooltip
- Rules interstitial: 4-slide tutorial before game setup
- VP condition: prominent gold banner on every god card
- **NEW: Floating resource deltas** — "+2 gold" floats up from resource counter on gain/loss
- **NEW: Turn change announcement** — cinematic banner "Your Turn" / "Player 2's Turn" on turn boundaries
- **NEW: Phase breadcrumb** — `Round 1 › Action Phase › Player's Turn › Choose Target` always visible
- **NEW: Power card trigger flash** — pulse/glow when a card activates
- **NEW: Action result toast** — brief banner showing latest game log entries
- **NEW: Last-placed worker glow** — breathing highlight on most recently placed worker
- **NEW: Resource pulse on change** — gem backgrounds flash gold/red when values change

## Known Issues
- Golden Scepter power card fires twice during echo copy chains
- Purple/Red layer has 12 documented bugs (on hold, swapped out of basic mode)

## Next Sprint Ideas
- "Since your last turn" recap — show what opponents did while you waited
- Hover preview — show what an action will produce before committing
- Scoring preview — show projected end-of-round scoring
- Sound effects / haptics

---

## State Log

**[2026-03-02]** - UX Polish Sprint
- Added 7 visual feedback features (see CHANGELOG.md for details)
- New files: useGameEvents.js, FloatingDeltas.jsx, TurnAnnouncement.jsx, ActionToast.jsx
- Modified: TurnIndicator (breadcrumb), WorkerToken (glow), ActionSpace (lastPlaced), PowerCardSlot (trigger flash), ResourceDisplay (pulse), PlayerPanel (wiring), App.jsx (overlays)
- 416 tests still passing, clean build

**[2026-03-02]** - Ship single-player sprint complete
- 20+ fixes and features shipped (see TODO.md for full list)
- Test count: 410 → 416
- Deployed to Netlify

**[2026-03-01]** - Playtesting bug fixes + UX improvements
- Fixed AI turns, card market refill, targetPlayer modals, stealGems flow
- Added round transition deltas, tooltips, UX contract tests
- Test count: 383 → 391 → 410
