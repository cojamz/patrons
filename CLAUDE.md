# Cults (repo: patrons)

A digital worker-placement board game for friends playing online (2–4 players). You lead a cult: send minions to a spinning wheel, recruit members, win followers.
The game was called Patrons; since 2026-10-14 it's **Cults** (v0.5). Code ids and storage keys keep "patrons" on purpose. Cory is the designer; Claude is the foreman (builder, tester, simulator, critic).

## Read first, every session
- `design/HANDOFF.md` — full state of the project, how to work with Cory, the harness. Start here after any break.
- `design/in-flight.md` — what's running, each workstream's brief and port; resume dead work from it.
- `design/todo.md` — the ordered to-do list (human playability first).
- `.claude/rules/working-with-cory.md` — how to talk to Cory and how much to do on your own. **Follow it strictly.**
- `.claude/output-styles/foreman.md` — the voice for every message to Cory.
- `design/taste.md` — how the screen should look and feel, and Cory's own calls. Read it before touching the UI.
- `.claude/rules/harness.md` — how we work: tools, agents, ports, freezes, where things live.
- `design/strategy.md` — what wins, where the tension is, what each color brings. Read before pitching any design; update it when a rework changes what wins.
- `design/decisions.md` — every design call Cory has made (append-only). The game is whatever this says, not whatever old code or docs say.
- `design/prototypes/vision/build-plan.md` — the UI being built (the Lamplit Table).

## Branches and shipping (current)
- Work on `claude/gifted-newton-3lcy3i`; PR #1 already exists. Do not create a replacement PR.
- Check each increment, push source, then `bash scripts/v4-play.sh <checked-sha>` publishes the immutable commit to main/play and verifies the served build stamp and HTML.
- Live: https://cojamz.github.io/patrons/ redirects to https://cojamz.github.io/patrons/play/. GitHub Pages serves main, not gh-pages. Historical Netlify instructions are superseded.
- main outside play/ contains the old v3 game; preserve it and the root redirect. Do not merge v4 source over main wholesale.
- Current original-note status: `design/feedback-audit-2026-10-16.md`; retain unfinished items instead of treating a shipped subset as the whole batch.

## Code map (v4)
- `src/engine/v4/` — the rules, nothing else: `core.js` (task queue, options, buys, Release, contests), `content/*.js` (one file per sphere, `benders.js` for the guest members, `index.js` registers them), `bots.js` (Easy/Normal/Hard), `thinker.js` (rollouts), `preview.js` ("you'd get").
- `src/v4/` — React UI: `game/` (GameScreen, Wheel, ShopCards, CultSeat, HoverCards, PayPicker, RoundEnd…), `screens/` (home, setup, lobby), `session/` (local, online, record), `art/` (pixel sprites), `lamp.css` (the look), `Intro.jsx`, `Recovery.jsx`.
- Tests: `src/test/engine/v4/` (incl. `spheres/`, `cards-*`, fire audit, fuzz), `src/test/v4/` (session, ui, records). Browser gates: `e2e/v4/*.mjs`.
- Scripts: `scripts/v4-*.mjs` — check, sims (sim, big-followers, member-value, fair-price, bot-levels, thinker-tables), peek (freeze + screenshots), replay, fire-audit, art-import.
- Old code (`src/engine/v3`, `src/v3`, v0 files, `archive/`) — raw material only; ignore.

## Commands
- `npm run check:v4` — the gate: all v4 tests, a production build, every browser e2e (`-- --commit HEAD` for a verdict). `npm run check:v4:quick` (~2 min) while iterating; `-- --fast` skips e2e; `check:v4:full` plays every seeded game (nightly). Parallel agents set their own `V4_OUTDIR=.v4-build-<name>` and `V4_PORT=<port>`.
- `npx vitest run src/test/engine/v4` · `npm run sim:v4 -- 300 4` · `npm run dev` (v4 by default).
- This box has 4 CPUs: throttle heavy sims.

## Stack
React 18, Vite 5, plain CSS for v4, Firebase Realtime DB, Vitest, Playwright. Deployed on GitHub Pages via the checked-commit publishing script.
