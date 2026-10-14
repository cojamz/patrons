---
name: v4-loop
description: The Patrons v4 build loop. Use whenever building or changing v4 (engine, session/multiplayer, UI) — check, review, fix, repeat until excellent.
---
# v4 build loop

Architecture: design/architecture.md. Engine is the only place rules live; UI and sessions only speak option ids.

Each iteration:
1. Change the smallest thing that moves the build forward (engine change → add or adjust its unit test in src/test/engine/v4).
2. `npm run check:v4` — unit + fuzz + session tests, production build, browser e2e (hot-seat and two-tab online). Must be all PASS. `--fast` skips e2e while iterating.
3. Look at the real screens: e2e saves screenshots to /tmp/patrons-shots/v4/. Read them at ~1270×700 and ~400px.
4. Every few iterations, run review agents in parallel and pass on only their conclusions:
   - `playtester` — plays the hot-seat game in a browser as a first-timer.
   - `ux-reviewer` — reviews the screenshots against design-principles and the play.html prototype look.
   Fix what they find (verify before trusting; no blind fixes).
5. Commit with a clear message and push; the PR's Netlify preview redeploys.

6. Final gate: the `game-skeptic` agent plays the real build adversarially and grades it. Loop until its verdict is SHIP with overall A- or better; fix its issues worst-first and re-run it fresh (no memory of the last run).

Done = check:v4 green, game-skeptic says SHIP (A- or better), and Cory has a link.
Never present agent output to Cory unvetted.
