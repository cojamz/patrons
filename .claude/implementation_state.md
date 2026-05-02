# Implementation State

**Last Updated**: 2026-03-06

## Current State
Single-player **playable and deployed** at https://cornycolonies.netlify.app. 660 tests passing. **ActionResultBanner** replaces PlacementBanner — state snapshot diffing (immune to event expiry), shows placement + shop + artifact purchases with per-player impact grid. **TurnAnnouncement** inline view stripped (no deltas/effectText), dropdown retains full detail. **Golden Scepter** investigated — cannot reproduce double-fire, likely fixed by ship sprint architectural changes. **Multiplayer** — 3 fixes: guest draft null-pendingDecision fallback, WaitingOverlay stays during opponent decisions, double-advanceRound race guard. **Mechanic audit** — 2 bugs fixed: `doubleNextTheft` now consumed by all steal actions (was orphaned), Chrono Compass now updates `currentPlayer` after reordering (was stale). All deployed.

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
- Rainbow Scepter pendingDecision gets lost during eternity chains
- Purple/Red layer has 12 documented bugs (on hold, swapped out of basic mode)

## Current Sprint: Balance Tuning + Multiplayer MVP
See `memory/roadmap-briefing.md` for full strategic roadmap. See `memory/balance-findings.md` for simulation data.
1. **Cash In T3 redesign** — Current Cash In is boring (no decision) and enables gold hoarding dominance. Need powerful, interesting replacement. Royalties change already shipped.
2. ~~**Multiplayer champion draft fix**~~ — **DONE.** HostSync null guard fix.
3. **Guest game view** — Guest should see full board during opponent's turn, not blank screen.
4. ~~**UX polish — animation overhaul**~~ — **DONE.** 8 animation features + louder opponent feedback.
5. **Golden Scepter bug** — Known double-fire during echo chains, uninvestigated.
6. **Multiplayer E2E testing** — Draft works, need to test full game flow.

---

## State Log

**[2026-03-06]** - Multiplayer draft fix + animation overhaul + opponent action feedback
- Status: Completed, Deployed
- Files Modified: HostSync.jsx (draft null guard), index.css (8 keyframes), TurnIndicator.jsx (action name display), PlayerPanel.jsx (turn pulse, victim flash, effects banner), GameBoard.jsx (turn flash, board dim), GodArea.jsx (action flash, placement banner, resource drips), ActionSpace.jsx (isJustPlaced), App.jsx (rejoin interstitial)
- Notes: Fixed multiplayer draft stuck state (HostSync null guard). Shipped 8 animation features + louder opponent feedback (placement banner + resource drip pills from action spaces). Rejoin interstitial replaces auto-rejoin. All visual feedback works for both AI and remote human opponents.
- Next: Multiplayer E2E testing, Cash In T3 redesign, Golden Scepter bug

**[2026-03-05]** - Balance simulation analysis + Austerity→Royalties flip
- Status: In Progress (Cash In redesign ongoing)
- Files Modified: goldActions.js (Royalties), gods.js (Royalties desc), actions.test.js, mechanicValidation.test.js, scripts/game-analysis.mjs (new), scripts/agency-test.mjs (new), scripts/deep-sim.mjs (new), scripts/combo-analysis.mjs (new), memory/balance-findings.md (new)
- Notes: 200+ sim games confirmed gold hoarding dominates (73% of glory). MCTS audited and trustworthy. Flipped Austerity→Royalties (+1g per card owned, was per empty slot). Tested 1:3 gold ratio (reverted — Cash In is the real problem). Cash In T3 redesign in active design discussion.
- Next: Finalize Cash In replacement design, implement and simulate

**[2026-03-05]** - RichEffect symbol language + artifact card rework + image aliases
- Status: Deployed
- Files Modified: RichEffect.jsx (resource/tier patterns), ArtifactImage.jsx (12 image aliases), GodArea.jsx (artifact card layout iterations), gods.js (tier numerals Ⅰ/Ⅱ, favor condition text), powerCards.js (Thieves' Gloves, Voodoo Doll descriptions)
- Notes: RichEffect now replaces "resource(s)" with wildcard icon and Ⅰ/Ⅱ/Ⅲ with styled tier badges. Artifact cards reworked: 80px image centered + text right + cost bottom-right. All 24 power cards now have images via alias mapping of old filenames. Cleaned up several card descriptions for icon compatibility.
- Next: Generate proper images for aliased artifacts, multiplayer champion draft fix, UX polish

**[2026-03-04 LATE]** - UX polish sprint + multiplayer first connection
- Status: Deployed (UX), In Progress (multiplayer)
- Files Modified: ActionSpace.jsx (stacked text), GodArea.jsx (opacity/overflow), RichEffect.jsx (Favor white pulse), ResourceDisplay.jsx (styled tooltips), PlayerPanel.jsx (Aegis display, turn order tabs), TurnIndicator.jsx (turn phase), WaitingOverlay.jsx (leave button), powerCards.js (Alchemist description), database.rules.json (new)
- Notes: Stacked action name/effect vertically (fixes 4-player text wrapping). Inactive items more readable (opacity 0.55-0.7). Favor text white+pulse. Aegis shows as gold shield artifact. Styled resource tooltips with playstyle descriptions. Firebase Anonymous Auth enabled, database rules added for v3rooms. First multiplayer connection succeeded but champion draft routing broken (both players see waiting screen). Added "Leave Game" button to WaitingOverlay.
- Next: Fix multiplayer champion draft flow, guest name editing in lobby, continue UX polish

**[2026-03-04 01:00]** - Layout rework + modal speed + rules reference + AI simplification
- Status: Deployed
- Files Modified: GodArea.jsx (major layout rework), ActionSpace.jsx (bigger), Modal.jsx (popLayout), RulesReference.jsx (new), RulesOverlay.jsx (updated), useAITurns.js (60% random AI), GameEngine.js (resolveDecision handlers), RichEffect.jsx (Favor spacing), gods.js (Chronis text), GemSelection.jsx (hint text)
- Notes: Compact god headers (single-row with favor condition inline). Shops→3-column. Artifacts→2×grid flex:1. Actions→flex-shrink-0. Modal mode="wait"→"popLayout" for instant swaps. Full tabbed Rules Reference with 6 tabs. AI purchasing simplified to 60% random from MCTS. Added skeleton_key + rainbow_scepter resolvers. Chrono Compass turn order bug investigated but not fixed.
- Next: Further space efficiency (actions area still has wasted space), Chrono Compass bug, possible artifact passive Favor mechanic

**[2026-03-03 LATE]** - UX overhaul: tabs, ticker tape, icons, tribute
- Status: Deployed
- Files Modified: TurnAnnouncement.jsx (rewrite), PlayerPanel.jsx (tab rework), ActionSpace.jsx (rich effects), GodArea.jsx (ResourceIcon headers), blackActions.js (tribute isStealing), useGameEvents.js (expiry 2500ms), App.jsx (Chrono Compass modal)
- Notes: Unified pill language (player name + source + right-side deltas + favor as ★). Player tabs show favor prominently, worker count, active turn halo, phase label. No auto-switch. God column headers use ResourceIcon instead of GodIcon. Action effects use inline gem icons. Tribute counts as steal. Drips last longer (2500ms). Deployed to Netlify.
- Next: Continue UX polish iteration based on playtesting feedback

**[2026-03-03 EVE]** - Playtesting bug-fix sprint (10 fixes)
- Status: Completed
- Files Modified: GameEngine.js, GameProvider.jsx, GodArea.jsx, App.jsx, useAITurns.js, greenActions.js, greenHandlers.js, powerCards.js, rules.js
- Notes: Fixed repeatHappensTwice (orphaned effect), Temporal Patent (missing originalPlayerId), shop glow persistence, Blessed/Haggle discount display, Golden Ring (event type mismatch + missing first-turn TURN_START), Eternity chain preservation (_actionChainQueue), repeat self-exclusion, Chrono Compass UI (unhandled turnOrderChoice), collapsed shop discount display. Flagged doubleNextTheft as orphaned.
- Next: Ticker tape UX rework (collapsed default), then more UI polish

**[2026-03-03 PM]** - Roadmap & checkpoint before Arbiter build
- Status: Planning complete
- Files Modified: memory/roadmap-briefing.md (new), memory/MEMORY.md
- Notes: Full codebase research across 5 parallel agents. Created comprehensive roadmap covering bug-finding simulation, multiplayer readiness, UI intuitiveness, and snappy feel. Balance rework fully shipped (all 4 gods). 647 tests passing. Game-bot upgraded. Performance pass done (CSS animations replace Framer Motion glow pulses).
- Next: Build The Arbiter (invariant checker + fuzzer), then Golden Scepter investigation

**[2026-03-03]** - Balance Rework Design Sprint
- HUD event ribbon shipped (TurnAnnouncement rewrite, RoundTracker compact, TurnIndicator rework)
- Poisoned Blade rename (was Cursed Blade), negative Favor enabled
- Yellow god fully redesigned: new identity (Exchange/Conversion), new Favor condition (0→N triggers), new shops, 2 new power cards (Extraction Vial, Slag Catcher), renamed Philosopher's Stone
- Gold god fully redesigned: new actions (Patronage, Levy, Hoard, Haggle, Austerity, Tariff), new shops, new power cards (Rainbow Scepter, Golden Scope, Golden Idol)
- Design doc created at `.claude/balance-rework-notes.md`
- No engine code changes yet — design only

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
