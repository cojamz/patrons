# Next Steps — Patrons v3 (March 2026)

## Context for Fresh Agents

- **Read first**: `CLAUDE.md` (project structure, role, rules), `.claude/rules/game-rules.md` (mechanics)
- **Current state**: `.claude/implementation_state.md`, `TODO.md`
- **Active codebase**: `src/engine/v3/` (pure engine) + `src/v3/` (React UI). Legacy v0 code exists at `src/App.jsx` etc. — don't touch it.
- **Tests**: 391 passing (`npm run test`), including 8 UX contract tests
- **Dev server**: `npm run dev` — serves the v3 UI

---

## Step 1: Activate Playwright MCP + Visual Playtesting

**Why**: We installed `@playwright/mcp` but it needs a session restart to activate. The goal is to have Claude visually play through the game to catch UI bugs that headless testing misses.

**What to do**:
1. Verify Playwright MCP is active (should appear in tool list after restart)
2. Run `npm run dev` to start the dev server
3. Use Playwright to navigate to the game, start a 2P game (1 human, 1 AI)
4. Walk through these verification scenarios:
   - AI places ONE worker, ends turn, human gets their turn (Bug B fix)
   - Place worker on a black steal action → TargetPlayer modal shows opponent(s) → click one → steal executes (Bug A fix)
   - Complete round 1 → buy some cards → advance to round 2 → market refills to 3 cards per god (Bug C fix)
   - Round transition screen shows "+X favor this round" per player (Feature D)
   - Hover over card icons in player tabs → tooltip shows card name + description (Feature E)
   - Hover over items in the FOCUSED god panel → tooltip appears above player tabs (portal fix)
5. Take notes on any new bugs or UX issues discovered

---

## Step 2: P3 Polish — Game State Banner (Feature F)

**Why**: Players need at-a-glance understanding of whose turn it is and what they should do.

**What to do**:
- Add a compact banner/bar showing: "Round 1 — Action Phase — Player 1's Turn"
- Add contextual hint for the active player: "Click an action space to place your patron" / "Choose a target player"
- Integrate into `TurnIndicator.jsx` or create a new `GameStateBar` component
- Should be visible but not intrusive — sits above the god board area

---

## Step 3: Power Card Pixel Icons Improvement

**Why**: User flagged the current pixel icons as "really bad". They're the most visible art element on card hover and in player tabs.

**What to do**:
- Review current `CardPixelIcon.jsx` — each card has a hand-drawn pixel art definition
- Redesign the icons to be cleaner, more readable at small sizes (12px in tabs, 18-24px in market)
- Consider a more consistent style — all icons should feel like they belong to the same art set
- Test at both small (collapsed tab) and large (focused market) sizes

---

## Step 4: Visual Polish — Shops vs. Actions (Feature G)

**Why**: Shops and actions still look too similar in the focused god panel. The distinction was started (warm parchment vs stone) but could be stronger.

**What to do**:
- Review current `GodArea.jsx` focused render — market section has parchment tint, actions have stone
- Increase the contrast between shop and action sections
- Consider different border treatments, background textures, or section headers
- Shops should feel "warm/trade" while actions should feel "utilitarian/stone"

---

## Step 5: Champion Power Delay (Feature H)

**Why**: When a champion power triggers at round start and requires a decision, the player sees a modal before they've had a chance to look at the board state. This is disorienting.

**What to do**:
- Queue champion decisions that fire during round_start
- Don't surface the modal until the player has seen the board (either a "Ready" button or brief delay)
- Implementation in `GameProvider.jsx` — add a decision queue that holds `pendingDecision` until the player acknowledges the round transition

---

## Ongoing: UX Contract Test Expansion

As new features or god colors are added, expand `uxContract.test.js`:
- Add test coverage for green and yellow action decision flows
- Add shop decision contract validation
- Add champion power decision contract tests
- Keep the stress simulation count up (currently 10 random 2P + 5 random 4P games)

---

## Backlog (not prioritized)

- Purple layer bugs (12 documented in TODO.md, on hold)
- Archive stale v0 documentation (IMPLEMENTATION_SPEC.md, CODE_NAVIGATION.md, DEVELOPER_GUIDE.md)
- Firebase multiplayer integration for v3 (currently local only)
