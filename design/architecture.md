# Patrons v4 — Architecture

How the v4 build is put together, and why. Claude owns this file.

## Layers
1. **Engine** (`src/engine/v4/`): the rules, and nothing else. Pure, deterministic JavaScript with no React, no network and no timers.
   - State is plain JSON. It saves, sends over the network and replays exactly.
   - All randomness comes from a seeded RNG stored in the state. The same seed plus the same moves always gives the same game.
   - Everything happens through a **task queue**. Each step of the game (pick a start resource, place a worker, an action's follow-up choice, the buy, round end…) is a task. When a task needs a decision, the engine stops and publishes `state.pending`: who decides, what kind of decision, and the list of legal options.
   - A move is just `{ player, option }`, where the option is one of the ids in `pending.options`. Nothing else is accepted. The UI, bots and the network all speak this one language, so they can't drift apart.
   - Content is data plus small hook functions. Each quadrant lives in one file (`content/gold.js`, `content/red.js`…), holding its actions, scoring rule and members. Quadrants can be swapped in and out by id.
   - Members react through named hooks (on recruit, on round start, on gain, on buying followers, on game end…). The engine never names a specific member.
2. **Bots** (`src/engine/v4/bots.js`): pure functions that pick one of the legal options. They're used for empty seats, for simulation and for fuzz tests.
3. **Sessions** (`src/v4/session/`): connect the engine to a screen. They all share one interface: `subscribe(fn)`, `submit(move)`, `getState()`.
   - `LocalSession`: hot-seat play on one device, with bots.
   - Online play is **host-authoritative**. Every client sends moves. The host checks each move against the engine and publishes the new state with a version number. Guests never run the rules. If the host drops, any client can take over, because the full state lives in the database.
   - Transport is pluggable: Firebase Realtime Database in production; in memory and BroadcastChannel (two browser tabs) for tests.
   - Firebase details:
     - State is stored as a JSON string, because RTDB silently drops empty arrays and nulls.
     - Rooms live under the already-deployed `v3rooms/` path with a `v4` marker, so no database rule change is needed.
4. **UI** (`src/v4/`): React. It renders `state` and turns clicks into option ids. It has no game logic of its own: what's clickable is exactly `pending.options`.

## Testing (the loop runs all of these)
- Unit tests for each action and member (Vitest).
- Invariant fuzzing: thousands of seeded bot games. Each one must finish, cards are conserved, no resource goes negative, every pending decision has options, illegal moves are rejected, and a JSON round-trip at every step changes nothing.
- Replay determinism: replaying the same seed and moves gives the same final state.
- Session tests: host plus guests over the in-memory transport, including duplicate or out-of-order moves and reconnects.
- End-to-end runs in a real browser (Playwright): a full hot-seat game by clicking, and two tabs playing online over BroadcastChannel.
- Review agents (playtester, UX) look at real screenshots each loop.

## Entry
`index.html` boots v4 by default on this branch; `?v=3` opens the old game.
