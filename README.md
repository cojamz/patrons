# Cults

A digital worker-placement game for 2–4 friends playing online. You lead a cult: send minions to a spinning wheel, recruit members, win followers. Three rounds; most followers wins.

Play it: https://cojamz.github.io/patrons/play/

(The repo is still called patrons. The game was Patrons until 2026-10-14; code ids keep the old name on purpose.)

## Run it locally
```bash
npm install
npm run dev               # opens v4 (Cults); ?v=3 opens the old game
npm run check:v4:quick    # ~2 min check while iterating
npm run check:v4          # the full gate
npm run sim:v4 -- 300 4   # bot balance read
```

## Ship it
Work lives on `claude/gifted-newton-3lcy3i` (PR #1). Push there once the quick check passes, then:
```bash
bash scripts/v4-play.sh
```
It builds HEAD, commits `play/` to `main` and waits for GitHub Pages. A push to a branch alone never changes the play link.

## Where things live
- `design/` — the design record. Start with `HANDOFF.md`, then `in-flight.md`, `todo.md`, `decisions.md` (every call Cory has made; it wins over code and docs), `taste.md`, `rulebook.md`.
- `design/notes/` — notes and sounds from the project chat.
- `design/eval/` — tester reports, answer key, perf and balance measurements.
- `src/engine/v4/` — the rules, pure JS. `src/v4/` — the React UI.
- `play/` on `main` — the built game GitHub Pages serves.
- `main` is otherwise the frozen old game (v3). `src/engine/v3`, `src/v3`, v0 files and `archive/` are raw material only.
