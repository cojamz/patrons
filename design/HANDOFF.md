# Cults — handoff (current state; update in place, don't stack sections)

Last updated 2026-10-20 8:50pm Eastern. Older handoffs: design/archive/handoff-before-2026-10-20.md (v0.6–v0.8.9 detail and evidence).

## Live
- https://cojamz.github.io/patrons/play/ is **v0.8.9**, source eab7757, Pages main d657180 (main:play/build.json). Branch claude/gifted-newton-3lcy3i (PR #1) holds the same game plus docs.
- v0.7.0–v0.8.9 (Oct 18–19) were built with ChatGPT/Codex; it commits as "Codex". Read its commits as material like any other.

## The game now
- Economy direction (decisions.md, 2026-10-20): each action gives 1 of its color, sometimes more; members cheaper and worth followers; held resources score contests; hold vs spend.
- Reworked and live: Green (v0.7.0, spheres/green-redesign-2026-10-18.md), Red (v0.8.0 actions, v0.8.2 members, spheres/red-redesign-2026-10-18.md and red-members-2026-10-18.md), Magenta actions (v0.8.8, spheres/magenta-redesign-2026-10-19.md).
- 2026-10-21 members: Cory's new process (design/member-process.md, /rework-members): concepts strong to weak with counters, his cut, then sim sweeps set prices. Magenta concepts are with him; live-Magenta price sweeps at 2/3/4 seats run in design/eval/member-sims/. Owner: the "Better design process" thread.
- 2026-10-21 rework panel: retired by Cory ("didn't come up with good enough examples"); the "Better design process" thread owns job 2. Index: design/eval/rework-panel-2026-10-21/README.md. Picks for every open color are with Cory, unshipped (https://claude.ai/artifact/Cd8JTiPKtibYcmVPGLRUjo; depth in design/eval/rework-panel-2026-10-21/final/, neutral and Magenta in /mnt/project-files/color-reworks/). Build nothing until he answers by number.
- Not reworked: Magenta members (old 10), Gold, Blue, Purple, Silver, Yellow, White. Blue/Purple/White contests still count members; Yellow counts full sets.
- Deck sizes: Red and Green 12, others 10 (target equal). Member cost ceiling 10. Release numbering stays v0.8.x.

## Known not-green
- No full unit run has passed since Oct 17. Stale old-Magenta tests (spheres/thieves.test.js, cross-color expectations) and six UI failures that predate v0.8.8 (design/eval/magenta-v088/previous-release-ui.log). Fix against today's rules; never weaken an assertion.

## Working this week
- Token-conscious (Cory, 2026-10-20): no sims or game batches unless he asks; open the game only for UI checks; run tests by file.
- Ordered backlog: top of design/todo.md. Plan: /mnt/project-files/week-oct20/how-we-work.md.
- Ship: quick check on the exact commit → push to the v4 branch (rebase, never force) → bash scripts/v4-play.sh <sha> → confirm stamp → go-live note with a screenshot.
