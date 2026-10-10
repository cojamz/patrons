# Patrons

A digital worker-placement board game for friends playing online (2–4 players).
We're in the middle of a big rework ("v4"). Cory is the designer; Claude is the builder.

## Read first, every session
- `.claude/rules/working-with-cory.md` — how to talk to Cory and how much to do on your own. **Follow it strictly.**
- `.claude/rules/harness.md` — how we work: tools, agents, where things live, how the system improves itself.
- `design/decisions.md` — every design call Cory has made. The game is whatever this says, not whatever the old code does.

## Branches
- `main` = the old game (v3), frozen. It's the restore point. Don't build v4 on it.
- v4 work happens on the current working branch. Each PR gets a Netlify preview link Cory can play.

## Code map (old game, raw material only)
- `src/engine/v3/` — pure game logic, no UI. Has a headless runner and an AI player.
- `src/v3/` — React UI. `src/v3/firebase/` — online multiplayer (host runs the game, guests send moves).
- `src/test/engine/v3/` — tests (Vitest).
- Old v0 code (`src/App.jsx`, `src/state/`, `src/data/`, `src/ai/`) and `archive/` — ignore.

## Commands
`npm run dev` · `npm run build` · `npx vitest run` · `npm run test:mp`

## Stack
React 18, Vite 5, Tailwind 4, Firebase Realtime DB, Vitest, Playwright. Deployed on Netlify.
