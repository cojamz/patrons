---
name: v4-loop
description: The Patrons v4 build loop. Use whenever building or changing v4 (engine, session/multiplayer, UI) — check, review, fix, repeat until excellent.
---
# v4 build loop

Architecture: design/architecture.md. Engine is the only place rules live; UI and sessions only speak option ids.

Each iteration:
1. Change the smallest thing that moves the build forward (engine change → add or adjust its unit test in src/test/engine/v4).
2. `npm run check:v4:quick` while iterating (~2 min: unit tests on fast slices, build, the hot-seat e2e); `npm run check:v4:quick -- --related <file,file>` runs only the unit tests that import the files you touched (a UI file skips every engine block), and `npm run test:v4:related -- <files>` is the same without build or e2e. The verdict is `npm run check:v4 -- --commit HEAD` (or a sha): every test, the build and every e2e on an exported copy nobody can touch (<10 min on a quiet box). Must be all PASS. The live tree is never a verdict (others' edits land mid-run). `-- --help` lists the options. At most 3 runs share the box; the next waits with an ETA. A bare whole-suite `npx vitest run` (a directory, or no filter) waits for a check slot like a quick check, and every vitest run uses 2 workers at nice 10: name files, or use `--related`.
3. Look at the real screens: e2e saves screenshots to /tmp/patrons-shots/v4/. Read them at ~1270×700 and ~400px.
4. Every few iterations, run review agents in parallel and pass on only their conclusions:
   - `playtester` — plays the hot-seat game in a browser as a first-timer.
   - `ux-reviewer` — reviews the screenshots against design-principles and the play.html prototype look.
   Fix what they find (verify before trusting; no blind fixes).
5. Commit with a clear message and push; ship with /ship-batch (the play link changes only through scripts/v4-play.sh).

6. Blind panel (only when Cory asks for one, or suggest it when a significant stretch of work makes it due; our tests and gates are the regular bar). Each round runs FRESH agent instances that have never seen the game, 3 in parallel with different seats: a laptop newcomer, a phone tapper (touch emulation) and a saboteur (misclicks, spam, keyboard only). Never reuse a tester, because once it has learned the game it's no longer blind. A misread or issue reported by 2+ testers is confirmed; a single report gets verified by Claude before it's fixed. While iterating, one fresh tester is enough; run the full panel at milestones.
   Testers see only the screen: each drives the frozen build through `scripts/v4-eyes.mjs` (screenshots, coordinates, timings; no DOM, no Playwright of its own; one eyes browser per tester, `stop` after), keeps bot speed at default, plays a table with a stealing quadrant, walks design/eval/critic-calibration/checklist.md (with its ten audits) and lists everything (40+) before grading; only a brief that scored ≥80% recall on the latest answer key (critic-calibration/results.md) is used, and the design sweep is two fresh testers on brief.md with their lists merged (one alone reached 72%, two 82%).
   Final gate: start the build yourself and give the `game-skeptic` agent only the URL and the player rulebook text (design/rulebook.md); it must never see the repo. The agent plays the real build adversarially and grades it. Loop until its verdict is SHIP with overall A- or better; fix its issues worst-first and re-run it fresh (no memory of the last run).

Final output for Cory: besides the verdict, a short "how it feels" write-up synthesized from the testers' table talk (fun, tension, best moments, boredom, replay pull), clearly marked as AI players against bots, not real people.

Done = the gate is green, you've seen the change on a fresh frozen build at about 1270x700, and Cory has the link and a screenshot. A panel verdict applies only when a panel was run.
Never present agent output to Cory unvetted.

## Speed without cutting corners
- Run independent work side by side: audits, fixers split by file area, and testers.
- Triage each tester's report as soon as it lands; don't wait for the whole panel.
- `check:v4:quick` while fixing; the full gate on a commit (`check:v4 -- --commit <sha>`) before every panel. The verdict plays half of the biggest seeded blocks (strength in src/test/engine/v4/budget.js); `npm run check:v4:full` plays them all (nightly, or on a remote machine before a release). After a rules change, `npm run records:refresh` re-records the kept game records from their seeds (the records test says when).
- Reuse agents that already know the code (SendMessage) for fixes. Testers are never reused.
- One fresh tester between milestones; the full panel of 3 for the verdict.
- Testers get a FROZEN snapshot. Before each panel: build, copy to `.v4-panel/<n>/`, and serve that folder on port 5190 (`node scripts/v4-peek.mjs freeze <n> 5190`, never a bare `npx vite preview`, which leaks servers). Never point testers at .v4-build: check:v4 rebuilds it mid-panel, and panel 2's saboteur ended up grading half-finished UI work.

## Agent claims need gates (2026-10-14)
- The UI agent twice reported fixes that blind testers then found still broken on the frozen build (44px targets, stale Undo, bot pacing), and its screenshot paths didn't exist. A fix only counts once it's an automated e2e assertion that fails the build, or Claude has seen it in a screenshot of a fresh frozen build.
- Freeze from a commit, never the live tree (2026-10-14): a build caught gold.js 7s into an agent's edit and showed a fake crash. Commit, `git worktree add .v4-wt/<sha> <sha>`, symlink node_modules, build there into .v4-panel/<n>. `scripts/v4-peek.mjs shots <url> <dir> [query]` plays a full game at laptop + iPhone 13 for your own screenshots.

## Fresh eyes at every milestone (Cory, 2026-10-14)
At each frozen milestone, run three NEW blind reviewers in parallel, never reused: `ui-critic` (picky designer: information access, polish), `boardgame-enthusiast` (the game: decisions, tension, arc, balance feel, fun), and an engineering reviewer (repo access, no prior context; design/eval/engineering-review.md is round 1). Save each report to design/eval/<role>-round<N>.md, verify single-reviewer claims before fixing, and track grades round over round.
- Then a synthesis (Cory, 2026-10-14): one agent reads the three reports together (plus Cory's latest notes and the panel's "felt unfair or unfun") and writes design/eval/meta-round<N>.md: the cross-cutting themes, where reviewers agree (confirmed) and disagree, root causes behind clusters of symptoms, and one ranked action list. Act on each report individually AND on the meta list; the meta list sets priority.

## Close every milestone with the harness retro
Last step of a milestone, after the meta synthesis: `node scripts/v4-retro.mjs` appends one dated row to design/eval/harness-metrics.md from the gates run since the last row (verdict wall time, unit and e2e stages, quick pre-checks, slot waits, failures by stage, slowest unit files). Read it against the previous rows: a stage that grew, a script that keeps failing, or waits over a few minutes is the next harness fix, with its before/after in the same file.
