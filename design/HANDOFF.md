# Cults — handoff (current state; update in place, don't stack sections)

Last updated 2026-10-21 3:50am Eastern. Older handoffs: design/archive/handoff-before-2026-10-20.md (v0.6–v0.8.9 detail and evidence).

## Live
- https://cojamz.github.io/patrons/play/ is **v0.8.38** (Oct 21 10:24pm Eastern: results open with final totals; lag thread's seat-hover, turn-start redraw, rival pace and Escape fixes on top of v0.8.35's prices and Blue deck) (see main:play/build.json for the exact source; CHANGELOG.md marks each section "shipped (source X)"). Branch claude/gifted-newton-3lcy3i (PR #1) holds the game plus docs.
- Oct 22 7:45pm Eastern: **v0.8.45** live (source dc4564e): the Purple redesign (Sleep In, Hold Up, Right Away, Last Call, Crunch Time, Crowd In; members Early Bird, Bouncer, Gossip, Extra Shift, Closer, Hot Streak plus repriced Go-Getter, Late Riser, Night Owl, Courier, Clockmaker, Shift Crew; II+ tag), plus the log rewrite and 5-6 players. Prices: design/eval/purple-oct22/README.md.
- Oct 22 12:35pm Eastern: **v0.8.43** live = v0.8.42 + 5 and 6 player games (Purple at 5, Yellow at 6; shorter chairs at 5-6; source b7e4550 on branch claude/ship-five-six-players). The branch's unshipped Purple changes (Sleep In, Hold Up, Crowd In/Crunch Time swap) are NOT live; the next ship from this branch must bump to v0.8.44.
- Overnight Oct 20–21 (Cory's job 1, "fix all the open items"): v0.8.13–v0.8.25 except v0.8.14/0.8.19/0.8.20 (other threads). Colorless guests, Cory's made calls (Social Climber and Overseer cut, Grifter, Top Up, Chefs, Pants, affordable toggle), laptop fits and large-screen zoom, card grounds, first-play ring line, motion pass (members pop from seats, recruit via the hub, round-start beats, undo backwards, quiet skips), screen overlaps, swap portraits, every coin flies, round-end smoothing, rim sheen, bot swap scoring.
- Unit suite all green; browser gates honest (lane 6 sweep, /mnt/project-files/overnight/lane6/gates.md). Known red: members.mjs m3 (e2e/v4/known-red.json) needs a seat-layout call.
- Job 2 (color reworks) belongs to the "Better design process" thread; nothing from it ships before Cory approves.
- v0.7.0–v0.8.9 were built with ChatGPT/Codex; it commits as "Codex".

## The game now
- Economy direction (decisions.md, 2026-10-20): each action gives 1 of its color, sometimes more; members cheaper and worth followers; held resources score contests; hold vs spend.
- Reworked and live: Green (v0.7.0, spheres/green-redesign-2026-10-18.md), Red (v0.8.0 actions, v0.8.2 members, spheres/red-redesign-2026-10-18.md and red-members-2026-10-18.md), Magenta actions (v0.8.8, spheres/magenta-redesign-2026-10-19.md).
- 2026-10-21 members: Cory's new process (design/member-process.md, /rework-members): concepts strong to weak with counters, his cut, then sim sweeps set prices. Magenta concepts are with him; live-Magenta price sweeps at 2/3/4 seats run in design/eval/member-sims/. Owner: the "Better design process" thread.
- 2026-10-21 rework panel: retired by Cory ("didn't come up with good enough examples"); the "Better design process" thread owns job 2. Index: design/eval/rework-panel-2026-10-21/README.md. Picks for every open color are with Cory, unshipped (https://claude.ai/artifact/Cd8JTiPKtibYcmVPGLRUjo; depth in design/eval/rework-panel-2026-10-21/final/, neutral and Magenta in /mnt/project-files/color-reworks/). Build nothing until he answers by number.
- Not reworked: Magenta members (old 10), Gold, Blue, Silver, Yellow, White. Blue/Purple/White contests still count members; Yellow counts full sets.
- Deck sizes: Red and Green 12, others 10 (target equal). Member cost ceiling 10. Release numbering stays v0.8.x.

## Known not-green
- Nothing on the known-red list (scoring.mjs fixed in v0.8.38 by Cory's call: no second count-up).
- Box load: parallel agents' checks starve each other (hotseat's 4-minute bound). Re-run alone once; run at most two worktree lanes at a time.

## Working this week
- Token-conscious (Cory, 2026-10-20): no sims or game batches unless he asks; open the game only for UI checks; run tests by file.
- Ordered backlog: top of design/todo.md. Plan: /mnt/project-files/week-oct20/how-we-work.md.
- Ship: quick check on the exact commit → push to the v4 branch (rebase, never force) → bash scripts/v4-play.sh <sha> → confirm stamp → go-live note with a screenshot.
