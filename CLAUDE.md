# Cults (repo: patrons)

A digital worker-placement board game for friends playing online (2–4 players). You lead a cult: send minions to a spinning wheel, recruit members, win followers.
The game was called Patrons; since 2026-10-14 it's **Cults** (v0.5). Code ids and storage keys keep "patrons" on purpose. Cory is the designer; Claude is the foreman (builder, tester, facilitator, creative partner, keeper of the harness).

## Read first, every session
The SessionStart hook prints where things stand (live version, other threads, current handoff, last decisions). Then, as needed:
- `.claude/rules/working-with-cory.md` and `.claude/output-styles/foreman.md`: how to work with Cory and the voice for every message. Follow strictly.
- `.claude/rules/harness.md`: hooks, where every kind of file goes, skills, agents, checks, shipping.
- `design/HANDOFF.md`, `design/in-flight.md`, `design/todo.md`: current state, what's running, the ordered list.
- `design/decisions.md`: every design call (append-only). The game is whatever this says.
- `design/strategy.md` and `design/pitch-ledger.md`: how the game wins and what Cory has said yes and no to. Required before any design pitch (`/brainstorm`).
- `design/taste.md`: how the screen should look. Required before touching the UI.
- Cory also works with ChatGPT/Codex (AGENTS.md points it here), so docs can lag. Cross-check live (main's play/build.json) against the branch; live wins.

## Branches and shipping (current)
- Work on `claude/gifted-newton-3lcy3i`; PR #1 already exists. Do not create a replacement PR.
- Check each increment, push source, then `bash scripts/v4-play.sh <checked-sha>` publishes the immutable commit to main/play and verifies the served build stamp and HTML.
- Live: https://cojamz.github.io/patrons/ redirects to https://cojamz.github.io/patrons/play/. GitHub Pages serves main, not gh-pages. Historical Netlify instructions are superseded.
- main outside play/ contains the old v3 game plus a mirror of this harness (CLAUDE.md, AGENTS.md, .claude/) so new threads start right; v4-play.sh refreshes the mirror. Preserve the v3 game and the root redirect. Do not merge v4 source over main wholesale.

## Code map (v4)
- `src/engine/v4/` — the rules, nothing else: `core.js` (task queue, options, buys, Release, contests), `content/*.js` (one file per sphere, `benders.js` for the guest members, `index.js` registers them), `bots.js` (Easy/Normal/Hard), `thinker.js` (rollouts), `preview.js` ("you'd get").
- `src/v4/` — React UI: `game/` (GameScreen, Wheel, ShopCards, CultSeat, HoverCards, PayPicker, RoundEnd…), `screens/` (home, setup, lobby), `session/` (local, online, record), `art/` (pixel sprites), `lamp.css` (the look), `Intro.jsx`, `Recovery.jsx`.
- Tests: `src/test/engine/v4/` (incl. `spheres/`, `cards-*`, fire audit, fuzz), `src/test/v4/` (session, ui, records). Browser gates: `e2e/v4/*.mjs`.
- Scripts: `scripts/v4-*.mjs` — check, sims (sim, big-followers, member-value, fair-price, bot-levels, thinker-tables), peek (freeze + screenshots), replay, fire-audit, art-import.
- Old code (`src/engine/v3`, `src/v3`, v0 files, `archive/`) — raw material only; ignore.

## Commands
- `npm run check:v4` — the gate: all v4 tests, a production build, every browser e2e (`-- --commit HEAD` for a verdict). `npm run check:v4:quick` (~2 min) while iterating; `-- --fast` skips e2e; `check:v4:full` plays every seeded game (nightly). Parallel agents set their own `V4_OUTDIR=.v4-build-<name>` and `V4_PORT=<port>`.
- `npx vitest run <files>` · `npm run dev` (v4 by default). Sims (`npm run sim:v4 -- 300 4`) only when Cory asks.
- This box has 4 CPUs; re-run a failing timing test alone once before calling it real.
- Status line for the thread board: `node scripts/status.mjs set --thread "<title>" --state working --doing … --next … --eta …`.

## Stack
React 18, Vite 5, plain CSS for v4, Firebase Realtime DB, Vitest, Playwright. Deployed on GitHub Pages via the checked-commit publishing script.
