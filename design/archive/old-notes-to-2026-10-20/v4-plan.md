# v4 Game Plan

## Where things stand (Oct 2026)
- `main` = v3, frozen. That's the restore point. All v4 work happens on a branch.
- v3 engine: 4 gods (Gold, Black, Green, Yellow), Favor = VP, 6 champions, 24 power cards, 3 rounds.
- A new player has to learn **~26 separate concepts**. That's the problem in one number.
- The last sims found that gold hoarding produced ~73% of all Favor, mostly through Cash In.
- There's a seat bug: the last player both drafts first and plays first in round 1.
- Harness drift: CLAUDE.md and `game-rules.md` describe the *old v0* 8-color game, not v3. About 15 stale docs sit in the repo root. Tests can't run in cloud sessions because nothing installs dependencies.
- What's worth keeping:
  - The pure engine (no UI inside it).
  - The headless sim runner and the MCTS AI.
  - The Playwright game-bot.
  - Firebase host-authoritative sync.

## Phases
**0. Harness reset** (Claude, no design calls needed)
- Archive the stale docs. Rewrite CLAUDE.md so it's short and true. Generate a v3 rules summary from the code.
- Add a session-start hook so cloud sessions install deps and can run tests.
- Skills:
  - `/note`: dictation in → design log.
  - `/sim`: balance runs → short report.
  - `/playtest`: Playwright plays the game and screenshots it.
  - `/experiment` and `/ship`: rework them for the v4 branch model.
- Specialist agents: design critic, balance analyst, UX reviewer, playtester. Each one runs in parallel and reports back short.
- Self-improving loop: every session ends with a lessons-learned line in `.claude/lessons.md`. Repeated lessons get promoted into rules or skills.

**1. Teardown**
- One page: how v3 plays, the 26 concepts, and what each one costs vs. what it adds.
- Cory marks each concept keep / cut / rethink.

**2. Find the direction**
- Claude brings 2–3 sketched directions. Cory picks or mixes.
- Rules live as data, so a variant can be simmed in minutes before anyone writes UI.

**3. v4 engine**
- A lean new engine built next to v3, reusing the good parts.
- Sims run on every change. Tests guard the rules.

**4. UI rebuild**
- Tactile and obvious. The aim is to learn it by playing, not by reading.
- Screenshot review loop via Playwright.

**5. Multiplayer**
- Port the Firebase sync to v4.

## Open
- Fresh v4 engine next to v3 (recommended) vs. refactoring v3 in place.
