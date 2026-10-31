# Engineering review, round 2: Cults at 4fa162a (worktree `.v4-wt/4fa162a`)

**What I ran** (all *measured*, box load around 28):
- `friends.test.js` and `online.test.js`: 18/18 pass, including full online games with host migration, rejoin and bot stand-ins.
- `record.test.js`, `records.test.js`, `versions.test.js`: 17 pass, 1 skipped.
- Engine timing over 3 four-bot games: `applyMove` p50 0.5 ms, p95 27 ms, max 100 ms. `previewSpace` p95 40 ms.
- Final state JSON is 16–18 KB, with a late-round peak of 35 KB.
- The test file list from the repo root: 63 files, none from the freeze folders.
- `CONTENT_HASH` at 40 recent commits.

I did not run e2e or the full gate.

### Verdict
The code is close and the online core is well built. Moves go only through the host, which checks each one. Commits are safe against two hosts writing at once. Duplicate moves are dropped by id, rejoining works from the device's memory, a bot can stand in for a missing player, and the host role moves over cleanly. The tests show all of this.

It is not ready for four friends tonight as it stands, because of how it gets released, not the game logic:
- There is no verified, frozen build on a stable link.
- Nothing has ever run against production Firebase or the Netlify link.
- On a phone, a back swipe silently drops you out of the game.

Fix those three (a few hours, most of it waiting on gates) and the host plays from a laptop: then four friends will very likely finish a game.

### Ship blockers

**1. No verified build on a stable link, and the version guard can't see rule changes.**
- Evidence:
  - 144 commits in the last 6 h, 37 of them touching engine content or `core.js`. The PR preview redeploys on every push.
  - `todo.md:7` ("check:v4 green on a committed snapshot") and `todo.md:12` ("stable release link") are both unticked.
  - The content hash records every function as just "a function" (`record.js:25`), so changing a card's effect doesn't change it.
  - *Measured:* between 56db70e and 0359dc9 Bookkeeper was halved (`ctx.gain(owner, P, onBoard)` became `Math.floor(onBoard/2)`), and `CONTENT_HASH` stayed `o4muq42c7c`.
- What a player sees: after a mid-game deploy, anyone who reloads is refused ("different version") and a bot plays their seat. Worse, if only an effect changed, nothing is refused. A host migration then runs the new rules on the old state, and nobody is told.
- Smallest fix:
  - Pick a commit and run the full `check:v4`, plus `online.mjs` against the RTDB emulator.
  - Deploy that build to its own alias (`netlify deploy --dir <frozen dist> --alias friends`) and touch nothing while people play.

**2. The production backend has never been exercised.**
- Evidence:
  - `multiplayer-readiness.md` says firebaseio.com and netlify.app are blocked from this container.
  - The gate's online e2e runs BroadcastChannel tabs in one shared browser context (`e2e/v4/online.mjs:33-35`), so the three "people" share localStorage, which is where the rejoin ids live.
  - Untested: anonymous auth, the deployed rules for `v3rooms`, phone networks and the screen-lock path.
- What a player sees: anything from "Can't reach the server" to a lobby that never fills.
- Fix: Cory does a 10-minute run on two real devices with the frozen link:
  1. Host on a laptop.
  2. Join on a phone by the invite link.
  3. Reload the phone during its own turn.
  4. Lock the phone for 30 s.
  5. Play to the results.

**3. Back leaves the game with no confirm.**
- Evidence: `App.jsx:52`. On `popstate`, the app calls `leaveRef.current(cur.lobby)`, then `dropLobby` (`App.jsx:159-160`), which clears the saved online seat and calls `lobby.leave()`. That hands the seat to a bot.
- What a player sees: on iOS a swipe from the left edge means Back, and the wheel invites sideways swipes. The player lands on Home mid-game while a bot plays their cult. They get the seat back only by reopening the invite link.
- Fix (about 5 lines): in an online game, re-push the history state and open the existing Leave confirm.

### Fix soon (next week)
- **Effect-blind hash.** Add a build-time hash of the `src/engine/v4` source (a Vite `define`, like `__V4_BUILD__`) to `BUILD.content`. Saves, records and rooms then catch effect changes.
- **A host phone that sleeps stalls everyone.**
  - A new host is chosen only after Firebase marks the old one disconnected (`online.js:339`). `lastSeen` is written only on connect or heal (`online.js:183, 294`), so there is no heartbeat.
  - Guests see "No answer yet" for a minute or more.
  - Fix: the host writes a heartbeat every 5 s, and a new host is chosen when it is more than 15 s old. Tonight: host from a laptop.
- **A crash during online play strands the table.**
  - "Start a new game" (`Recovery.jsx:92-94`) clears the saved seat, but the socket stays open. The player still reads as connected, so the host's "let a bot play" never appears (`online.js:82`).
  - Fix: for online games, offer "Rejoin" (a reload) instead.
- **"Try again" does nothing.**
  - After 8 s the screen says "No answer yet. Try again." (`GameScreen.jsx:512`). But `online.js:540-541` treats the same option at the same version as the original, still-pending move, so nothing is sent again.
  - Fix: clear that in-flight entry when the timeout fires, and re-push with the same `mid` (the host already drops duplicates through `recent`).
- **Too many re-renders online.**
  - Every room change (a move pushed, the state, the move removed, presence) re-renders the whole GameScreen (`GameScreen.jsx:260`; `online.js:570-574`), and only `LogLine` is memoized.
  - That is about 3 full renders per move on every phone.
  - Fix: emit only when `info` actually changes, and memoize Wheel, CultSeat and ShopCards on state identity.
- **The shop's "✓ after X" ticks almost never appear.**
  - `ShopCards.jsx:47` only reads the preview cache. Nothing fills the cache during a game: `usePreviewWarmup` is called only in `lab/LabB.jsx:46`. ShopCards also doesn't re-render when a preview arrives.
  - Fix: call `usePreviewWarmup(state, me)` in GameScreen.
- **End-screen tie.** `GameScreen.jsx:653` lights up every seat tied on followers, while `Results.jsx:11-15` breaks the tie by members.
- **Leaked servers in the harness.**
  - `check:v4` spawns and kills `npx`, not vite (`v4-check.mjs:26, 37`).
  - *Measured* orphans (parent PID 1): `vite preview` for `.v4-build-ui` on 5282 (4 h 28 m) and on 5285 (3 h 57 m), and a `vite` dev server on 5283 (4 h 34 m).
  - The 300 ms busy-port guard loses to a slow `npx` under load, so a run can test against another build folder's server.
  - Fix: spawn `node_modules/.bin/vite` directly with `detached`, kill the process group, and check the port before spawning.
- **Gates that guard nothing.**
  - `src/test/v4/ui/info.test.jsx:7-8` tests `Shop.jsx` and `Players.jsx`, which the app no longer imports. QuadrantPanel, SeatRail and YourTable are dead too.
  - The only kept record is skipped (*measured*: its content `o4muq42c7c` no longer matches `206qg898bow`), so the records test checks nothing.
  - CI runs only on tags or by hand, and never runs e2e (`v4.yml:8-10`). `architecture.md:47` still says it runs on every push.
- **Smaller ones.**
  - If the preview worker fails (`Info.jsx:267`; for example, its file 404s after a deploy), that state shows "You'd get: …" forever.
  - Anonymous sign-in is tried once per page load (`src/v3/firebase/config.js`).

### Round 1 scorecard
- D1, freezes in the gate: **Fixed** (`vitest.config.js:12`; *measured* 0 freeze files).
- D2, sphere tests not gated: **Fixed** (`v4-check.mjs:21` has no exclude).
- D3, a stale save crash-loops: **Fixed** (`stateProblem`, `saved.js` `usable()`, the `Boundary`). Partly undercut by the effect-blind hash.
- D4, mixed builds go undetected: **Partly.** Rooms now carry `build`, joins get `VERSION_MISMATCH`, and a mismatched client won't host (`online.js:24, 160, 325`), but the hash misses effect changes.
- D5, a thrown bot move stalls the game: **Fixed** (`botStep` fallback, `online.js:681, 686-689`).
- 1, an honest gate: **Partly.** Exclusions and fake timers are done, and wall-clock timeouts are now only a 600 s backstop. Still: CI runs only on tags and `--fast`, the test environment defaults to jsdom, and preview servers leak.
- 2, version stamps and the error boundary: **Fixed**, apart from the hash gap. Board spaces are still keyed by array index (`slots['q-i']`).
- 3, records and replay: **Fixed** (`state.history`, `v4-replay.mjs`, "Copy game record"). The kept-record corpus is inert.
- 4, rule knobs moved into `state.rules`: **Open** (`market.js:12-40`, `echo.js:134`, `trading.js:28-35`, Purple's `VARIANT`).
- 5, one worktree per agent: **Partly.** `CLAUDE.md` now has the v4 code map and `protect.sh` stopped recommending stash, but 32 of the last 60 commits are WIP checkpoints in a shared tree.
- 6, structured events: **Open** (`GameScreen.jsx:344-411` still regex-parses English log lines).
- 7, shared verbs and a validated hook registry: **Open.** Member defs aren't validated, and Echo still wraps every action.
- 8, online hardening: **Partly.** Bot stand-ins and rejoin are done. The DB rules (`database.rules.json:3-8`), seats bound to a user id, `firebase.json` and moving the v3 config are open.
- 9, type checking: **Open** (no `typescript` in `package.json`).
- 10, session tests off the wall clock plus a Firebase smoke test: **Partly.** Fake timers are in; the emulator runs exist but aren't in any gate.
- 11, e2e on `@playwright/test`: **Open** (raw scripts; the browser path is hardcoded in 10 files).
- 12, a view layer: **Open** (the Wheel recomputes `standings` on every render; `projectedEndGame` now lives only in dead code).
- 13, bots in a Web Worker: **Partly.** Previews moved to a worker. Bots still run on the host's main thread, which doesn't matter online because online bots are Normal.
- 14, key spaces by action id: **Open.**
- 15, hygiene: **Open** (`dist/` still tracked with 41 files, `netlify-cli` still a devDependency, `sessionApi.js:5-13` still finds sessions by glob).
- 16, split GameScreen: **Open.** It grew to 707 lines.

### Vision for v0.3 and beyond (ranked by payoff)
1. **Pin each room and save to an exact build.**
   - Stamp the Netlify deploy permalink (`DEPLOY_URL` at build time) and a rules fingerprint (content manifest plus the engine source hash) on rooms, saves and records.
   - A client on another build is sent to the room's own build instead of being refused, and replays run on the build that made them.
   - This ends the mid-game-deploy problem and lets you keep shipping while people play. Tied to the 144 commits in 6 h and the Bookkeeper miss.
2. **Effects as data.**
   - Move card numbers out of `resolve` bodies into def fields (Joint Venture's "+3" sits inside a function today, invisible to the hash).
   - Move the knobs into `state.rules`, and validate def keys and hook names when a sphere registers.
   - That gives an honest hash, safe content edits, rules text generated from the data, and per-card tests driven by data.
3. **Engine-emitted events.**
   - The engine writes typed events; the log and the animations both render from them. The UI stops parsing English (round 1 #6 is still open).
   - The same events give a small format for sending online updates, instead of 16–35 KB of `stateJson` per move today.
4. **A realistic online harness.**
   - Playwright Test plus the RTDB emulator in CI, one browser context per player, and a seeded "four friends" script (phones, reloads, screen lock, Leave, host loss).
   - Delete the tests of dead components, and re-record the kept records from their seeds whenever content changes.
5. **Authority you can trust.**
   - Bind seats to `auth.uid`, write rules so only the host's uid may write `state` and only a player's own uid may write their moves, and add a host heartbeat.
   - Later, a small server (a Cloud Function or Durable Object) running the same pure engine. That also hides the pile order and RNG, which every client can read today.

Scratch scripts are in `/tmp/eng-review/`. I edited no repo files.

