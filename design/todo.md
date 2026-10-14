# v4 to-do

Checked against the code and tests on 2026-10-14 ~21:00 UTC (a box is ticked only when a test or gate proves it, not on an agent's report).

## Milestone: friends build (Cory, 2026-10-14)
Finish every running process and to-do, then a multiplayer version Cory can play with friends.
- [ ] Land all running agents' work; check:v4 green on a committed snapshot
- [ ] Online play verified on the real link: 2–4 real browsers, create/join by link, full game to results (blocked: this container can't reach firebaseio.com or netlify.app; see design/eval/multiplayer-readiness.md)
- [x] Friends-proof online: rejoin after reload or dropped wifi, a bot takes over a player who leaves, host can leave without killing the room, mismatched versions refused (src/test/v4/session/friends.test.js, versions.test.js, e2e/v4/online.mjs; tested in memory, over BroadcastChannel and on the RTDB emulator, not yet on the real link)
- [ ] Fresh eyes at every milestone: picky designer (ui-critic), board game enthusiast, engineer — new blind instances each time, then the meta synthesis; round 1 done for designer (C-) and engineer, the enthusiast hasn't run yet
- [ ] Blind panel on mixed tables (laptop, phone, saboteur) + "felt unfair or unfun"; fix worst-first; game-skeptic SHIP gate
- [ ] A stable release link that only changes when Claude has verified a build (separate from the working preview)
- [x] One-page "how to start a game with friends": "Playing with friends" in the rulebook (How to play)

Cory's rule (2026-10-14): anything that makes the game playable by humans comes first. Bots and agent tooling only as far as they serve that; no rabbit holes.

## 1. Playable by humans (always first)
- [x] Show the members for sale during setup (now all 10; touch.mjs gate k)
- [x] Reload near game end erases a hot-seat game (resume.test.js resumes at every step)
- [x] Undo pill stuck on "Placement undone" (hotseat.mjs gate)
- [x] Panel 7 fixes: choice panel over the buy row, shop text while placing, bot pacing, phone motion (touch.mjs g, layout.mjs l1, motion.mjs m1–m4)
- [x] Phone setup: hover card pops on tap, resource tray below the fold, page scrolls sideways (touch.mjs i, j, h)
- [x] Table picker: any 4 spheres, `?table=` (tables.mjs)
- [x] Buttons for Release, Straggler, Squatter, Insider's pile buys (benders.mjs)
- [x] Every card does what its text says, and every number traces to a log line (card ledgers A and B, cards-*.test.js, the fire-audit gate)
- [x] New follower costs in the rulebook; colors named for any table (layout.mjs l4, l5)
- [ ] Blind panel on mixed tables with "felt unfair or unfun" notes, then fixes
- [x] A link where Cory picks any 4 spheres and plays (the PR preview; Cory played it 2026-10-14)

- [x] Design pod: research best design skills/references, write a ui-critic agent; blind expert UI critic round 1 on the frozen build (design/eval/ui-research.md, ui-critic-round1.md)
- [x] Engineering expert review (blind): what saves headaches long-term (design/eval/engineering-review.md)

- [ ] (tabled by Cory) Live feedback tab + auto-fix pipeline: needs firebaseio.com / netlify.app allowed in the environment. Notes for later: deployed rules deny a shallow read of v3rooms, so clients also write an index at v3rooms/fbinbox/<id>; mount the tab outside <Recovered> in its own error boundary; reuse trackedState()/currentRecord() and Recovery's copyText. A copy-only tab (no Firebase) is a small safe first step.
- [x] Hardening: saves never crash-loop across deploys, error screen, "copy game record" + replay, bot errors never stall, a gate that runs every sphere test fast, CI (Recovery.jsx, saved.js, record.js, scripts/v4-replay.mjs, bot-failure.test.js, V4_GAMES=fast, .github/workflows/v4.yml)
- [ ] Later (engineering review): structured events instead of log parsing; shared verbs for copies; online auth rules; type checking

- [x] Every UI element has a hover with more info (long-press on phone); e2e gate that game-meaningful elements expose one (info.mjs)

## 1b. The Lamplit Table (design/prototypes/vision/build-plan.md)
- [x] Pay by dropping coins into cost slots (touch.mjs gate l)
- [x] Pixel art for every action and member, sphere-tinted, imported (src/v4/art/icons)
- [x] Followers have their own mark, never ★ (info.mjs gate c)
- [x] Per-player, skippable pixel intro (Intro.jsx)
- [ ] Layout revision: the wheel centred and bigger, every cult at a corner, a slim shop strip (UI-A, UI-B)
- [ ] Shop cards as elegant sports cards; when buying, only what you can afford is lit (UI-B)
- [ ] Hover that feels instant: under 100ms, one sticky layer, no flicker; info.mjs gate (UI-B)
- [ ] Minions: each player picks a pixel emoji; robed cult leaders; unplaced minions float around the leader
- [ ] The Reckoning: round end animated quadrant by quadrant (UI-A)
- [ ] Every turn told in one place, your own moves animated like the bots' (UI-A, UI-B)
- [ ] Stretch: living cults (idle loops, reactions when an ability fires, the leader's gestures)
- [ ] Later: pixel-art polish pass (Cory: "a little weak, good enough for now"); start with the weakest named in the batch reports

## 2. Balance (serves play)
- [ ] Big followers at ~25% with the final bots; members ~6–7 a player (remote bots session)
- [ ] Fair-price test: screen every card, then a careful check on outliers (remote fair-price session)
- [ ] 4-thinking-bot tables as the standard balance reading (scripts/v4-thinker-tables.mjs; remote bots session)
- [ ] Dead-window fixes: the rest of the ranked list in design/eval/cory-notes-2026-10-14.md §4
- [ ] Watch: White's 1-for-1 follower trades (Buy Low, Boom) vs the new costs

## 3. Bots (only as far as they serve 1 and 2)
- [ ] Easy / Normal / Hard, chosen in setup (levels built in bots.js; the setup screen doesn't offer them yet)
- [x] No hoarding, no recruiting everything (the Normal level: bot-levels.test.js guards the last buy; it recruits ~3.4 members a game against Easy's ~7.9, design/eval/top-tier.md)
- [ ] Improve the thinking bot: better rollouts and card valuation, fast enough for 4 at a table
- [ ] Later, only if bot prices keep disagreeing with Cory's feel in play: a bot that learns from its own games

## Waiting on Cory
- [ ] What the ~25% big-followers target is measured against [an in-between bot level, then a check with people]
- [ ] Action names batch 2 (Blue, Green, Purple, Silver, Yellow, White): grade by number or "all good" once drafted
- [ ] The action spaces' look: pick one of three directions (design/prototypes/actions/shots/compare.png)
- [ ] Rework candidates (design/eval/rework-candidates.md, being compiled): judge by playing

Settled 2026-10-14 (Cory's calls or Claude's logged gut calls, see decisions.md): Lamplit Table look; spinning wheel kept; pay by coins; Watchdog blocks Trade; loot stays magenta; Release on, refunds the colored part only, not in the round recruited; Late Riser; doubled discounts; the game always ends after round III and 10→10 is unlimited; Barter cut (Dividend); Even Swap replaces Scout; action names batch 1 and member renames applied; Investor/Sower set-asides return undoubled; only loose followers sell (White rework fixes Pawn); shop of 10; pixel art good enough for now.
