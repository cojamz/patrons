# Cults (v4) — Architecture

How the v4 build is put together, and why. Claude owns this file.

## Layers
1. **Engine** (`src/engine/v4/`): the rules, and nothing else. Pure, deterministic JavaScript with no React, no network and no timers.
   - State is plain JSON. It saves, sends over the network and replays exactly.
   - All randomness comes from a seeded RNG stored in the state. The same seed plus the same moves always gives the same game.
   - Everything happens through a **task queue**. Each step of the game (pick a start resource, place a worker, an action's follow-up choice, the buy, round end…) is a task. When a task needs a decision, the engine stops and publishes `state.pending`: who decides, what kind of decision, and the list of legal options.
   - A move is just `{ player, option }`, where the option is one of the ids in `pending.options`. Nothing else is accepted. The UI, bots and the network all speak this one language, so they can't drift apart.
   - Content is data plus small hook functions. Each quadrant lives in one file (`content/gold.js`, `content/red.js`…), holding its actions, scoring rule and members. Quadrants can be swapped in and out by id.
   - Members react through named hooks (on recruit, on round start, on gain, on buying followers, on game end…). The engine never names a specific member.
   - Hooks a member can carry: `onRecruited`, `onRoundStart` / `onRoundStartLate` (counts after every other round-start payout: Steward, Clockmaker), `onAnyRecruit`, `onBuyFollowers`, `onSteal` / `guardSteal`, `onActivate` (once per round or game), `onRoundEnd`, `onGameEnd`, `onAllPlaced` (Straggler), `onTurnEnd`, plus `onRelease` (the owner released another member: Social Climber) and `onLeave` (the card leaves its owner by steal, swap, release or trade-in, and settles what it held: Investor's and Sower's set-aside comes back undoubled). Spheres add their own (Purple's `onExtraTurn`, Silver's `onGive`, White's `onSell`…).
   - **The `now` flag** ("Now and at round start", Cory 2026-10-14): a member with `now: true` also runs its round-start hooks once, the moment it's recruited (`recruit()` in core.js).
   - **Every number traces to a log line.** core.js snapshots before each member hook and logs whatever changed under the member's name (`traceSnapshot` / `traceChanges`). Content code that runs a member's effect itself wraps it in **`ctx.asMember(owner, name, fn)`** so it gets the same named trace (Green's copy reactions, Silver's gifts, Purple's extra-turn members). The fire-audit gate checks every member with an effect leaves such a line.
   - **Release** is a base rule (`state.rules.release`, on by default): once per round in your buy step, never for a member you recruited this round (`canRelease`), refunding only the colored part in its own color (`releaseRefund`; any colors when that color isn't on the table). The buy step comes back after it.
   - **One function decides each contest, and every screen shows it:** `contestTable(state)` scores each quadrant as if the round ended now (rows, counts, tiebreak, winners). `endRound` uses it and keeps the result in `state.contests`, which the round-end card and the results read back instead of re-deriving. `turnRail(state)` gives this round's turns (done, current, next, extra turns included) straight from `state.turns` and the queue.
   - **"You'd get" is a dry run** (`preview.js`, `previewSpace(state, pid, q, i)`): it places the minion on a copy of the state and runs the real action with every member hook, exploring choices as branches (36-state budget) and summarising ranges for you and the rivals' totals. Display only; it can't drift from the rules and never leaks the refilled shop.
2. **Bots** (`src/engine/v4/bots.js`): pure functions that pick one of the legal options. They're used for empty seats, for simulation and for fuzz tests. Three levels per seat (`player.bot`): Easy (the old greedy bot), Normal (the default: spends down, stops recruiting when it no longer pays, counts extra turns a move queues) and Hard (Normal plus `thinker.js` rollouts, capped at 250ms a move in play).
3. **Sessions** (`src/v4/session/`): connect the engine to a screen. They all share one interface: `subscribe(fn)`, `submit(move)`, `getState()`.
   - `LocalSession`: hot-seat play on one device, with bots.
   - Online play is **host-authoritative**. Every client sends moves. The host checks each move against the engine and publishes the new state with a version number. Guests never run the rules. If the host drops, any client can take over, because the full state lives in the database.
   - People come and go:
     - A seat belongs to a player id. A reload keeps the id (sessionStorage).
     - A closed tab or a reopened invite link finds it again through the ids this device remembers per room (localStorage `patrons.v4.rooms`, passed to `joinRoom` as `knownIds`).
     - After the start, someone without their id can take a left seat by its name.
     - A connected client always re-marks itself here, which heals a late onDisconnect.
     - When a person has been gone N seconds, the host can set `sub: 'bot'` on their seat ("let a bot play for them"), and the host loop plays it.
     - Leaving mid-game does the same at once. Coming back clears it.
   - Transport is pluggable: Firebase Realtime Database in production; in memory, BroadcastChannel (tabs of one browser) and the RTDB emulator (`?rtdb=127.0.0.1:<port>`, localhost only) for tests.
   - Firebase details:
     - State is stored as a JSON string, because RTDB silently drops empty arrays and nulls.
     - Rooms live under the already-deployed `v3rooms/` path with a `v4` marker, so no database rule change is needed.
   - **Records, versions and recovery** (`session/record.js`, `saved.js`, `Recovery.jsx`):
     - `CONTENT_HASH` fingerprints the rules content (ids, costs, follower values, flags, hook names, tiers, rule flags; wording left out). Every game is stamped `state.build = { schema, content, id }` and keeps `state.history`, the full move list.
     - Seed + seats + table + rules + moves replay a game exactly: `gameRecord(state)` / `replayRecord(record)`, `node scripts/v4-replay.mjs <record.json>` (first illegal move or exception, with the state there). Records kept as regression tests live in `src/test/v4/records/`.
     - A save whose content doesn't match this build is never auto-resumed (`stateProblem`, `saved.js`); the player is told once and can copy its record. Online rooms carry `build` and refuse a client on different content (`VERSION_MISMATCH`).
     - `<Recovered>` wraps the app: a crash shows a recovery screen (Copy game record / Start a new game) and clears the "was in a game" flag, so a reload never loops into the same crash. A bot move that throws plays a fallback and shows a small notice; it never stalls the table.
     - The version the player sees (`version.js`: Cults v0.2) is on the home screen, in How to play and in every record. Code ids and storage keys keep the old "patrons" name on purpose, so saves aren't orphaned.
4. **UI** (`src/v4/`): React. It renders `state` and turns clicks into option ids. It has no game logic of its own: what's clickable is exactly `pending.options`.
   - **The look is the Lamplit Table** (design/prototypes/vision/). `src/v4/lamp.css` holds the tokens (walnut table, cream paper, muted quadrant inks `--gold`, `--red`…, Alegreya / Alegreya Sans) and the fixed regions: `.lt > .lt-prompt | .lt-rail | .lt-wheel | .lt-shop | .lt-table`, each with `data-region`. `.lt[data-phase]` moves the lamp (which region is lit), never the furniture. `game/lamp-b.css` styles the shop cards, cults and hover cards. The layout revision in build-plan.md (wheel centred, a cult at each corner, slim shop strip) is being built on top of this contract.
   - **Pixel art** (`src/v4/art/`): 24×24 icons as palette-key grids, drawn under `design/prototypes/pixel-art/` (style.md) and imported by `scripts/v4-art-import.mjs` into `art/icons/`. `<Sprite id sphere size>` draws one as crisp SVG, recoloured for its sphere; undrawn ids fall back to a template. `Leader.jsx` (32px robed leader with the player's emoji) and the 16px minion, `emojis.js` (the 20 emojis), `Follower.jsx` (the follower mark; never a star). Size order: leader > member > minion > follower.
   - **Rules text as symbols** (`game/Rich.jsx`): "+3 gold" renders as a coloured pip, "2 any" as the wild pip, "N followers" as the follower mark; each symbol explains itself on hover.
   - **Every element explains itself**: hover (long-press on phone) cards in `game/HoverCards.jsx` / `Info.jsx`; space cards use `previewSpace`, standings use `contestTable`. Keywords come from one glossary (`glossary.js`). How to play renders `design/rulebook.md` (imported as text by `rulebook.js`). The intro is `Intro.jsx` (per player, local, skippable; `?intro=0` off, `?intro=1` always).

## Testing (the loop runs all of these)
`npm run check:v4` runs the unit, sphere, session and UI tests, a production build, then every `e2e/v4/*.mjs` against `vite preview`. `--fast` skips the browser and plays a slice of each seeded-game block (`V4_GAMES=fast`). CI (`.github/workflows/v4.yml`) runs `--fast` on every push to the branch. No test carries a wall-clock budget: game and move counts bound engine work, fake timers bound session waits.
- Unit tests for each action and member, and a scenario test per card that plays it through real moves and checks its log line (`src/test/engine/v4/cards-*.test.js`; design/eval/card-ledger-a.md and -b.md).
- Fire audit: seeded mixed-table bot games; every recruited member with an effect must be named acting at least once (`fire-audit.test.js`, `scripts/v4-fire-audit.mjs`).
- Invariant fuzzing over thousands of seeded bot games and random 4-sphere tables (`fuzz-*.test.js`): each must finish, cards are conserved, no resource goes negative, every pending decision has options, illegal moves are rejected, and a JSON round-trip at every step changes nothing. Replay determinism, and kept game records replayed.
- Session tests: host plus guests in memory and over BroadcastChannel, reloads at every step, friends leaving and coming back, bot takeover, host migration, version stamps (`src/test/v4/session/`).
- Browser gates (Playwright, build-failing): `hotseat` (full game by clicking), `online` (three people, reloads, a closed tab, host moves), `tables` (picker, every sphere), `touch` (phone: 44px targets, no clipped text via `lib/textclip.mjs`, Undo only for the right seat, bot pacing, no sideways scroll, pay by coins…), `motion` (count-ups, flights, bot pacing), `layout` (nothing cut off at 900–1270px), `info` (every game element has hover info; no ★), `benders` (Release, Squatter, Insider, Straggler through the UI).
- Fresh-eyes reviewers and blind panels play frozen builds (see .claude/rules/harness.md).

## Entry
`index.html` boots v4 by default on this branch; `?v=3` opens the old game.
