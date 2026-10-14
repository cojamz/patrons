# Patrons v4 engineering review

Branch `claude/gifted-newton-3lcy3i` at `e28806a` (working tree as of 2026-10-14 ~18:00 UTC). Scope: `src/engine/v4`, `src/v4`, the v4 tests and e2e, `scripts/v4-*`, and repo hygiene. I read only `design/architecture.md` from `design/`. Everything marked *measured* was run on this box. The box was heavily loaded the whole time (load average 15–24 on 4 cores), so absolute times are pessimistic, but the ratios hold.

## Executive summary

The core bet is right and well executed. The engine is pure and seeded, a move is just an option id, and the same engine serves the UI, bots, sims and the network. The fuzzing, with invariants checked after every move, a JSON round trip at every step and replay determinism, is better than most shipped games have. Keep all of that.

The headaches ahead come from the edges of that core:
1. **The gate (`check:v4`) is not trustworthy on this box.** It also runs the tests of a frozen worktree (39 stale files next to the 32 current ones). It skips the unit tests of 7 spheres that players can already pick. Its session tests fail under load.
2. **Nothing is versioned.** Saves, online rooms and states carry no build or content stamp, there is no React error boundary, and a reload auto-resumes. The first card that gets killed or renamed will white-screen every saved game in a crash loop.
3. **Game facts live in English log text.** The UI regex-parses ~36 patterns out of the engine's sentences, and the trace-every-number check works by substring matching on card names. Rewording a log line silently breaks the UI.
4. **Sphere code bypasses the shared verbs.** Doppelganger copy handling is reimplemented in 9+ places, rule knobs live in module globals outside `state`, and Echo monkey-patches every action at import time.
5. **Online play is authoritative by convention only.** The DB rules let any signed-in client write anything, mixed builds are never detected, and a dropped player stalls the room forever.

Top 5 "do now" items: make the gate honest, version-stamp and protect saves and rooms, record the move list (one-click repro), move rule knobs into `state.rules`, and isolate parallel agents in their own worktrees. All five are S/M effort.

---

## Actively dangerous today

| # | What | Evidence | Effect |
|---|---|---|---|
| D1 | Gate runs stale code from frozen worktrees | `.v4-wt/49c94c3/` lives inside the repo. `scripts/v4-check.mjs:18` passes path *filters* (`src/test/engine/v4`, `src/test/v4`), and Vitest matches them as substrings, so `.v4-wt/<sha>/src/test/...` matches too. *Measured:* 32 current files + 39 worktree copies run. The worktree's `spheres/**` tests also run, because the `--exclude` glob is root-relative. | False red from old snapshots. Runtime grows with every freeze (the loop freezes per panel). The gate stops meaning "this tree is green". |
| D2 | Live content isn't gated | `v4-check.mjs:18` `--exclude 'src/test/engine/v4/spheres/**'` (added in 6fce2fa as "spheres-in-design"). Meanwhile `src/v4/tables.js:48` (`randomTable`) and Custom tables let players pick all 11 spheres. | Unit tests for Purple/Silver/Yellow/Market/Thieves/Trading/Echo can rot while players play those spheres. The card-checks (`cards-*.test.js`) and table fuzz cover some of it, but not the per-card exact-number tests. |
| D3 | A stale save crash-loops the tab | `core.js:43` stamps only `v: 4`. `saved.js:181-187` accepts any object that has `state.players`. `App.jsx:55-57` auto-resumes on reload. `src/v4` has no error boundary anywhere. *Measured* (`stale.mjs`): with one card id renamed in a save, both `followers()` and play throw `Unknown member`. Since 12:21 today, **45 member costs changed**. `design/eval/graveyard.md` shows cards do get killed. | The first killed or renamed card blanks the app for anyone with a save. A blank render leaves `patrons.v4.inGame=1` set, so every reload of that tab auto-resumes into the same crash. Before then, saves resume silently under new costs and rules. |
| D4 | Mixed builds in one online room are never detected | The room has no build field (`online.js:84-90, 298-302`). Any client can become host (`online.js:224-236`). Guests also run rules code for display (`format.js:221-252, 265-279, 400-421`). | A Netlify deploy mid-game, followed by one reload, mixes engine versions. The new host applies different rules to an old state, or crashes on an unknown id, and nobody is told. |
| D5 | A thrown bot move stalls the game silently | `session/local.js:120` (`catch → console.error`, no retry, no UI). `online.js:449` (the host chain swallows errors) and `online.js:521-528` (a throw inside `chooseBotMove`/`applyMove` never reschedules). | One content bug that a bot hits leaves the game waiting forever on "Bot is deciding…". Online, that happens to every client at once. |

---

## Do now (≤5, ranked by headache saved per effort)

### 1. Make `check:v4` an honest gate — **S**
**Problem.**
- D1 and D2 above.
- `vitest.config.js` runs every test in `jsdom`. Engine files opt out one by one with `// @vitest-environment node`; the rest pay the jsdom cost.
- The default 5 s `testTimeout` meets real-timer session tests. *Measured:* `local.test.js` "is offered exactly while a human placement or buy is the last move…" failed at 5110 ms under load. It plays 3 full games with real `setTimeout`s (`local.test.js:162-196`; `src/test/v4/session/helpers.js:6` polls the wall clock).
- `npm run type-check` is wired (`package.json:12`), but `typescript` isn't installed.
- There is no CI (`.github/` doesn't exist).

**Why it bites later.** Every agent's "check:v4 green" claim is the trust anchor of the loop (`.claude/skills/v4-loop/SKILL.md`). A gate that is both noisy and incomplete trains agents to ignore reds and to trust greens they shouldn't.

**Change.**
- In `vitest.config.js`, set `test.dir: 'src'` (or `include: ['src/**/*.test.{js,jsx}']`) and add `exclude: ['**/.v4-wt/**', '**/.v4-panel/**', '**/.v4-build*/**', 'archive/**']`. Better still, move freezes outside the repo (`../patrons-freeze/<sha>`).
- Gate the sphere tests. Run them with fewer seeded games if speed is the reason they were excluded (most of their time is the "200 seeded bot games" blocks).
- Set `environment: 'node'` by default and `environmentMatchGlobs`/per-file `jsdom` for `src/test/v4/ui/**`.
- Give session tests fake timers (`vi.useFakeTimers()` plus `vi.runAllTimersAsync()`), or inject a scheduler into `createLocalSession`/`startHost`, so they stop depending on the wall clock. Until then, set `testTimeout: 30000` for `src/test/v4/session/**`.
- Add a GitHub Actions job running `check:v4 --fast` and the e2e on push, so a red can't depend on whose box it ran on. Use the Playwright-managed browser there, not `/opt/pw-browsers/chromium`, which is hardcoded in 8 places.

**Risk of not doing it.** High. The gate is the only thing standing between parallel agents and main-line regressions.

### 2. Version-stamp states, saves and rooms, and fail gracefully — **S/M**
**Problem.** D3 and D4. In addition, state addresses board spaces by array position (`slots['q-i']`, `core.js:111, 359-364`, and option ids `slot:q-i`), so inserting or reordering an action in a sphere silently re-targets workers in every saved game.

**Why it bites later.** Content changes daily (cost passes, kills, new spheres), and the state outlives the code that made it in three places: localStorage saves, the round-start snapshot (`GameScreen.jsx:59-70`), and online rooms.

**Change.**
- `createGame` stamps `state.build = { schema: 1, content: CONTENT_HASH }`. `CONTENT_HASH` is a short hash, computed at module load in `content/index.js`, over a canonical dump of every def: id, s, w, f, n, copies, flags present, hook names present, plus action keys and their order and handler names. That is ~20 lines.
- `loadLocal`/`createLocalSession({state})`: if `content` differs, check that every `cards[*].def`, `copy`, queued `h` and quadrant resolves. If all resolve, offer "Continue (rules changed since this save)" or "Start over". If any doesn't, offer only "This game is from an older version". Never auto-resume across a mismatch.
- Online: put `build` on the room at create and start. `joinRoom` refuses a mismatch with "Refresh to update". `elect()` never hands the host role to a mismatched client, and guests show a banner when the room's build differs from theirs.
- Wrap `<GameScreen>` (and the app root) in an error boundary whose fallback offers "Copy game record" (item 3), "Back to home" and "Discard this game", and which clears `patrons.v4.inGame`. React unmounts the whole tree on an uncaught render error; boundaries exist to contain exactly this ([React docs: error boundaries](https://legacy.reactjs.org/docs/error-boundaries.html), [React 16 error handling](https://Reactjs.org/blog/2017/07/26/error-handling-in-react-16.html)).
- In the same pass, fix D5. On a bot-move exception, surface an error banner with "Copy game record", and online, retry once and then mark the seat as stuck instead of going silent.

**Risk of not doing it.** High, and rising with every content change. This is the classic "it worked in every test, then real players' saves exploded" failure.

### 3. Record the move list; one-click game record and replay script — **S**
**Problem.** The engine is deterministic: seed plus option ids gives the identical state, and the fuzz suite proves it. Yet nothing records the moves. Saves store snapshots only (`saved.js:188`), online stores only the latest snapshot plus `recent` mids (`online.js:7, 466`), and the UI has no export. Bug reports from blind testers and agents ("Undo was stale", "Banker paid twice") arrive as prose. The loop file notes agent claims that didn't reproduce.

**Why it bites later.** Every unreproducible report costs a human or agent hour. A deterministic engine is worth most when every bug becomes a failing test in minutes ([input logs reproduce whole sessions in deterministic games](https://bugnet.io/blog/determinism-in-games-why-it-matters), [Gaffer on Games: deterministic lockstep](https://gafferongames.com/categories/game-networking/)).

**Change.**
- Add `state.history` (an array of `[player, optionId]`; ~200 short strings per game, cheap) in `applyMove`, or keep it in the session save if you'd rather keep engine state lean.
- Add a "Copy game record" item in the menu and in the error-boundary fallback: `{ build, seed, seats, quadrants, rules, moves }`.
- Add `scripts/v4-replay.mjs <record.json>`, which replays, prints the log, stops at move N, and asserts that the stamped `build.content` matches.
- Add one Vitest helper, `replayRecord(json)`, so a pasted record becomes a regression test.
- This also gives saves a migration path: a save from an old build can be replayed under a frozen worktree of that build (or simply flagged as unreplayable).

**Risk of not doing it.** Medium-high. Debugging stays prose-driven, and the tester loop stays slower than it needs to be.

### 4. Move rule knobs out of module globals into `state.rules` — **S**
**Problem.** These are rules, but they live in mutable module state that is not in `state`:
- `market.js:12-14` (`export let BADGE`, `setBadge`)
- `market.js:32-38` (`MODE`, `LEAN`, and `setScoring` also mutates `market.scoring.label`)
- `echo.js:128` (`VARIANT.plus`)
- `trading.js:25-32` (exported mutable `SELL_HIGH`, `PAWN`, `BUY_LOW`, `LIQUIDATE`, `BOOM`, `BOTS`)

Tests and sims flip them per process (`market.test.js:25-26, 55, 74`; `scripts/spheres/market-*.mjs`, `echo-sim.mjs:7`). The same seed and moves can give different games in two processes, and a label in the UI can change without the state knowing. `pinCosts` (`src/test/engine/v4/helpers.js:108-112`) does the same to the card defs themselves.

**Why it bites later.**
- Determinism is the foundation of replay (item 3), host migration and save/resume, and this is a hole in it that no test catches.
- Once Cory picks a scoring variant, the "default" is wherever the last `setScoring` call left it.
- A sim result can't be reproduced from its output.

**Change.**
- Read knobs from `ctx.state.rules.<sphere>` with defaults (`DEFAULT_RULES` already exists at `core.js:24`, so extend it), and let `createGame({ rules })` set them.
- For sims that reprice cards, allow `rules.costs = { 'gold.midas': [4,4] }`, applied by `paymentPlan`/`cardDef` (or a `def` overlay), so `pinCosts` becomes test-only sugar over state instead of mutating globals.
- Add a fitness test that fails if any `content/*.js` exports a `let` or a `set*` function.

**Risk of not doing it.** Medium. Low-frequency, but each occurrence is a "the sim said X, the game does Y" mystery.

### 5. Parallel-agent isolation: one worktree and branch per agent, lead merges green — **S/M**
**Problem.**
- Agents edit one shared working tree, and the lead commits it as "WIP checkpoint". *Measured:* 33 of the last 60 commits are WIP checkpoints. Such commits mix half-done work from several agents, so `git bisect` and revert are useless.
- `check:v4` builds and tests whatever is on disk mid-edit. The loop file records a build that "caught gold.js 7s into an agent's edit and showed a fake crash".
- `.claude/hooks/protect.sh:44,48` tells agents to "Use git stash", which in a shared tree stashes everyone's work.
- Hotspots invite conflicts: `GameScreen.jsx` (626 lines, 38 of the last 200 commits), `v4.css` (1241 lines, 37), `core.js` (30).
- The instructions injected into this review agent were the old v3 `CLAUDE.md` and a `.claude/rules/game-rules.md` that doesn't exist on this branch. Meanwhile, the branch's `CLAUDE.md` code map still lists only v3 paths and `npm run test:mp`.

**Why it bites later.** The more agents run, the more of each one's time goes to chasing breakage someone else caused. A WIP checkpoint can't be bisected, so the lead becomes the bottleneck.

**Change.**
- Give each agent its own `git worktree add ../patrons-<agent> -b agent/<agent>` (outside the repo, see item 1), with node_modules symlinked as the freeze recipe already does.
- An agent runs `check:v4 --fast` in its own worktree and hands back a branch. The lead merges green branches, rebasing the rest (a merge queue of one).
- Keep a small ownership map (who may edit `core.js`, `format.js`, each `content/<sphere>.js`) in `.claude/rules/harness.md`.
- In `protect.sh`, block `git stash`, `git checkout -- <path>`, `git restore` and `git reset` when other agents may be active, and stop recommending stash.
- Add the v4 code map and `npm run check:v4` to `CLAUDE.md`. Check what context spawned agents actually receive: this one got v3 rules.

**Risk of not doing it.** Medium-high, and it compounds with agent count.

---

## Do soon

### 6. Structured events next to the log; the UI stops parsing English — **M**
**Problem.** Facts the UI needs exist only as sentences, and the UI parses them back with ~36 regexes:
- **Round results:** `format.js:114-166` parses "Round II ends. Most gold: P1 & P2 +4 · …", splitting on `' & '` and `': '`, so a player named "Sam & Max" breaks it. It also matches quadrants by their *label text*.
- **Snake-turn detection:** `format.js:70-74`.
- **Bought followers:** `format.js:97-101, 286-288`.
- **Rival moves:** `format.js:356-394` (by action *name* and quadrant *name*).
- **Gift floaters:** `format.js:306-338`.
- **Recruits, the clock and "couldn't buy":** `GameScreen.jsx:287, 301, 320`.
- **The round-end snapshot** (`format.js:265-279`) replays every option of the previous state and compares log tails.
- **Tie-breaks** are encoded as `score ≥ 1000` and decoded from label text (`format.js:244, 343-353`).

On the engine side, "every number traces to a line" is enforced by snapshot-diffing around each hook and then `fresh.some(l => l.includes(name))` (`core.js:669-696`). *Measured:* 4 card-name pairs are substrings of each other (Host ⊂ Grand Host, Heir ⊂ Heiress, Crew ⊂ Shift Crew, Choir ⊂ Choirmaster), and a player named like a card also defeats the check. The log is capped at 300 lines (`core.js:20, 895`), and the trace fallback after trimming searches for the last line by equality (`core.js:693`). Today's games generate ~190 lines on average and 230 at most (*measured*, 60 random-table 4-player games), so the cap is latent but close.

**Why it bites later.** Every wording polish, every new sphere and every Cory rename is a potential silent UI regression. Tests mostly assert on the same strings, so they won't catch it.

**Change.**
- Add `state.events` (capped per round, or not at all, since they are small) with typed entries: `{t:'placed', p, q, a}`, `{t:'gain', p, color, n, src:{uid, def}|{action}}`, `{t:'recruit', p, uid, paid}`, `{t:'followers', p, n, src}`, `{t:'roundEnd', round, rows:[{qid, winners, v}]}`, `{t:'clock'}`, `{t:'steal', …}`.
- Emit them from the shared verbs (item 7). Render the English log from events in one function, so the log can never disagree with the data.
- Migrate the UI helpers one at a time (round results first: they feed the round card and the results screen).
- The fuzz suite's "follower ledger kept from the log" becomes an exact check against `followers` events.

**Risk of not doing it.** Medium. Each break is small, but they keep happening and are found only by blind testers.

### 7. Shared verbs, a validated hook registry, and one owner for Doppelganger copies — **M**
**Problem.** `core.js` has the right idea (`effectiveDefs`, `eachMemberOf`, `ctx.steal` as "one shared verb"), but spheres reimplement around it:
- **Copy handling** is duplicated in `echo.js:118, 158`, `purple.js:33` (by id *suffix* `.endsWith('.doubletime')`, not by flag), `purple.js:58`, `thieves.js:23`, `trading.js:44, 265`, `silver.js:17`, `bots.js:121, 253, 325` and `format.js:24, 409-410`.
- **Sphere-private hooks** (`onExtraTurn`, `onRivalExtraTurn`, `onGive`, `onGiven`, `onSell`, `hostDouble`, `halfTurns`) are each dispatched by their sphere. Silver's gift is re-fired by gold.js (`silver.js:8`).
- **Bypassed verbs:** ~17 direct `p.res[...]` writes and ~10 `bonus` writes skip any verb. *Measured* counts: yellow 6, trading 4+5, silver 2+2.
- **No schema:** 24 hook names and 29 flag/data keys are used on member defs (*measured*), with no validation. A typo like `onRoundstart` is silently a no-op.
- **Echo** monkey-patches every action's `resolve` and every handler at import time, then index.js re-wraps them (`echo.js:69-101`, `content/index.js:79-88`). Its own header asks for the real fix (`echo.js:9-13`).
- **Bots** re-implement the `act` task order (`bots.js:325-326` mirrors `core.js:456-457`) and swallow every exception (`catch { v = -50 + … }`).

**Why it bites later.** About 200 cards across 11 modules. Each new card that interacts with copies, gifts or steals has to know which local convention applies. Doppelganger-copies-X bugs will keep appearing as N×M cases.

**Change.**
- Add to `ctx`: `defsOf(card)`, `has(p, defId)` (counts copies), `flag(p, name)`, `give(from, to, color, n)`, `spend(p, vec)`, `addFollowers(p, n, src)` and `fire(hookName, …)`. `fire` iterates `effectiveDefs`, wraps each call in trace or event attribution, and handles the copy's `onRecruited` exclusion.
- Have `registerQuadrant`/`registerGuests` validate every def key against a declared list and throw on unknown keys. Spheres declare their extra hook names (`q.hooks = ['onSell']`).
- Give core an act-scoped ledger of "what this space gave" (the echo prototype's request) and delete the wrapping.
- Expose `previewAction(state, p, q, i)` for bots.
- Add a fitness test that greps `content/` and `bots.js` for `\.copy\b`, `def\.id ===` and `\.res\[[^\]]+\]\s*[-+]?=` and fails on new occurrences (an allowlist for existing ones until they're migrated).

**Risk of not doing it.** Medium-high as the card count grows. These are the bugs that blind testers find one at a time.

### 8. Online hardening: DB rules, auth-bound seats, dropped players — **M**
**Problem.**
- `database.rules.json:3-8` grants `.read`/`.write` to any `auth != null` on `v3rooms/$roomCode`. Anonymous auth is automatic (`src/v3/firebase/config.js`), so anyone who knows a 5-character code can write `state/stateJson` at version+1, rewrite `hostId` or `seats`, or delete the room. Host authority is only a convention. The CAS in `commit` (`online.js:466-472`) protects against two honest hosts, not against a client that writes directly.
- `playerId` is a random string unrelated to `auth.uid` (`online.js:24`), so the rules can't bind a seat to a person.
- No `firebase.json` deploys the rules file, so the repo can't show what's live.
- The v4 transport imports the frozen v3 config (`session/transport/firebase.js:12`).
- A human who drops mid-game is never replaced. Nothing in `src/v4` offers "let a bot play", so the room waits forever.
- Hidden information isn't hidden. The whole state, including `rng`, the pile order and the room `seed`, is readable by every client (`online.js:86, 301`).

**Why it bites later.** Cheating among friends is unlikely. The real costs are accidental corruption (a buggy or old client writing `state`), vandalism of guessable rooms, and the "Dan's phone died, game over" stall, which will happen in the first week of real online play.

**Change.**
- Store `uid: auth.uid` on each seat and player.
- Rules:
  - `state` may be written only by the uid of `hostId`'s seat.
  - `moves/$m` may be written only with `by` equal to the writer's seat id, and its uid must match.
  - `players/$pid` may be written only by its own uid.
  - Add `.validate` on shapes and sizes.
  - Rules cascade top-down and a shallow grant can't be revoked deeper ([RTDB rules core syntax](https://firebase.google.com/docs/database/security/core-syntax)), so drop the room-level `.write` and grant per child ([user-based conditions](https://firebase.google.com/docs/database/security/user-security)).
- Add `firebase.json` with the rules plus a rules test on the emulator using `@firebase/rules-unit-testing` `assertFails` ([rules unit tests](https://firebase.google.com/docs/rules/unit-tests)).
- Move the Firebase config into `src/v4/session/transport/`.
- Let the host turn a seat that has been disconnected for more than N seconds into a bot (flip `seats/sN.kind`; the host loop already plays bot seats, `online.js:519`), with a "Take my seat back" on rejoin.
- Write down hidden-info leakage as accepted for friends play. A real fix needs a server ([boardgame.io-style secret state](https://github.com/philihp/boardgame.io)) and isn't worth it now.

**Risk of not doing it.** Medium. The stall is near-certain, corruption is plausible, and malice is unlikely.

### 9. JSDoc types plus `tsc --checkJs` on the engine and sessions — **S→M**
**Problem.** `jsconfig.json` already sets `checkJs`, but nothing runs it (`typescript` isn't installed, so `npm run type-check` fails). *Measured* with TypeScript 5.6 in a scratch dir:
- **Engine:** only **18 errors**, mostly boolean arithmetic in sort comparators (`core.js:236, 248`), the echo wrapper's ad-hoc properties (`content/index.js:84-86`) and one missing param (`market.js:79`).
- **Sessions:** caught JSDoc drift on the first run (`local.js:98-99`, where `UndoCheckpoint` has no `kind`).

**Why it bites later.** Untyped hook bags plus parallel agents equals silent misspellings and shape drift. Types are also the cheapest documentation for agents.

**Change.**
- Add `typescript` as a devDependency and `@typedef`s for `State`, `Player`, `Card`, `Pending`, `Option`, `Task`, `MemberDef` (every hook signature) and `QuadrantDef` in `src/engine/v4/types.js`.
- Add `defineMember()`/`defineQuadrant()` identity helpers typed with them.
- Add a `tsc -p jsconfig.engine.json` step to `check:v4`, engine and sessions first and UI later.
- Stay on JS with JSDoc. A TS migration buys little more here and costs churn across agents ([TS: type-checking JS files](https://github.com/microsoft/TypeScript/wiki/Type-Checking-JavaScript-Files/c316faae044273494ca339a1b0664cdd219332ad)).

**Risk of not doing it.** Medium.

### 10. Session tests that don't depend on the wall clock, and a Firebase smoke test — **S/M**
**Problem.** Session tests poll with real timers (`helpers.js:6-12`, `local.test.js:162`) and fail under load. The memory and BroadcastChannel trees imitate RTDB (`transport/tree.js:1-3`), but the real Firebase transport (transactions with `applyLocally:false`, `onDisconnect` re-arming) has no automated test.

**Change.**
- Use an injectable `scheduler` (setTimeout/clearTimeout) in `createLocalSession` and `startHost`, with fake timers in tests.
- Add one e2e against the RTDB emulator: host plus guest, a host kill, migration, and finish.
- Add a version-skew test: a guest with a different `CONTENT_HASH` is refused (item 2).

**Risk of not doing it.** Medium. Flaky reds and the untested production transport are where "works in tests, fails at the table" lives.

---

## Consider

11. **e2e on `@playwright/test`.** **M.** The 7 e2e files are raw scripts with 54 fixed `waitForTimeout`/sleep calls and a hardcoded `executablePath` (`e2e/v4/online.mjs:22` and others). Moving to `@playwright/test` brings auto-waiting, web-first assertions, retries and traces on failure. Fixed sleeps are the textbook source of flake ([Biome: noPlaywrightWaitForTimeout](https://biomejs.dev/linter/rules/no-playwright-wait-for-timeout), [Checkly on auto-waiting](https://www.checklyhq.com/guides/auto-waiting-methods)).
12. **An engine-owned view layer.** **M.** The UI calls rules code in render: `projectedEndGame` structured-clones the state and runs `onGameEnd` hooks on every Players render (`Players.jsx:118`, `format.js:400-421`), and `standings` runs scoring per render (`Wheel.jsx:367`, `QuadrantPanel.jsx:29`). A `view.js` (standings, projections, buy affordances, round results from events) memoized once per state would keep the UI free of hook calls, make guests tolerant of content drift, and give the UI agent a stable API.
13. **Bots in a Web Worker.** **M.** Hard bots hold the main thread for up to 250 ms per decision (`bots.js:21`, `thinker.js:35`), and the online host runs bots on the same thread as its UI. The engine is pure JSON, so a worker is a small step.
14. **Key board spaces by action id, not array index.** **S/M**, folded into item 2. Affects `slots`, `squats`, option ids `slot:q-i` and the echo ledger keys.
15. **Hygiene.** **S.**
    - `dist/` (41 files, last touched 2026-05-02) is tracked. Remove it.
    - `netlify-cli` (350 MB of the 732 MB in `node_modules`) is a devDependency. Use `npx netlify` on demand.
    - `sessionApi.js:5-13` discovers session exports by `import.meta.glob` name lookup, so a rename silently hides online play. Use static imports.
    - 21 per-sphere scripts in `scripts/spheres/` follow the sim/thinker/value pattern. Make one parametrized script and smoke-run it in the gate with N=1.
    - Silence the `act()` warnings in UI tests; they hide real errors in the gate output.
16. **Split `GameScreen.jsx`.** **M.** It is 626 lines, the top churn file, and holds pacing, flights, notes, toasts and input queueing. Split it into `useTable`, `useFlights`, `useNotes` and `useInputQueue` hooks so the UI agents stop colliding.

---

## Testing strategy, in one view

- **Balance today.** Strong engine unit tests (card-by-card, exact numbers), strong fuzz (default tables plus cross-sphere tables, every-option sweeps, JSON round trips, determinism), decent session tests, and broad but sleep-driven e2e.
- **Gaps.**
  - Version skew and stale saves (none).
  - Real Firebase (none).
  - DB rules (none).
  - Structured-fact correctness: the UI is tested against log strings that both sides share.
  - Per-sphere unit tests are outside the gate.
- **Runtime.**
  - The cost is dominated by `fire-audit.test.js` (~227 s under load) and the fuzz blocks, all of them wall-clock-agnostic and deterministic. That's fine for a nightly or `--heavy` run.
  - The fast gate should stay under ~2 min on an idle box. Move the fire-audit and heavy fuzz to a `check:v4 --full` and CI nightly, and keep a 10-game smoke version of each in `--fast`.
- **Determinism.** The engine is deterministic: no `Math.random`/`Date` in rules, seeded mulberry32 in state, stable sorts, JSON-only state. The exceptions are the module-level knobs (item 4) and hard bots' wall-clock cap (UI only, documented in `thinker.js:19-21`).

## Measurements (this box, loaded)

| What | Result |
|---|---|
| `applyMove` cost (normal bots, 4 players) | 1.4 ms (classic) · 1.7 ms (trading/purple/silver/yellow) · 2.0 ms (gold/thieves/market/echo) per move |
| State size (JSON) | avg 7–17 KB, max 21–37 KB. Every online client downloads the full string per move: ~200 moves × ~17 KB ≈ 3.5 MB per client per game. Fine for friends; a diff or event stream can wait. |
| Log lines per game | avg ~190, max 230 (cap 300) |
| Test files the gate picks up | 32 current + 39 from `.v4-wt/49c94c3`; 7 current sphere files excluded |
| tsc `--checkJs` on the engine | 18 errors (loose mode) |
| `check:v4 --fast` | GATE_RESULT |
