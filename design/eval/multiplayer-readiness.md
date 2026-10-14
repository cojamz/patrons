# Multiplayer readiness (friends build)

Owner: multiplayer agent. Interim note, 2026-10-14; the final results are added at the bottom.

## What this container can reach
- **Real Firebase RTDB (`cornycolonies-default-rtdb.firebaseio.com`): blocked.** The egress proxy answers 403 to CONNECT for `*.firebaseio.com`. Anonymous auth (`identitytoolkit.googleapis.com`) is reachable, but the database isn't.
- **The Netlify preview (`deploy-preview-1--cornycolonies.netlify.app`): blocked** (also a 403 on CONNECT for `*.netlify.app`).
- So **nothing here can be tested on the production backend or the real link.** To allow it, add `firebaseio.com` and `netlify.app` under Allowed domains in the cloud environment's network settings.
- **What we can test instead: the Firebase RTDB emulator** (v4.11.2 jar from storage.googleapis.com, which is reachable) with the repo's `database.rules.json` loaded. It runs the real Firebase JS SDK code path (runTransaction with `applyLocally:false`, onDisconnect, serverTimestamp, the auth-required rules through a mock signed-in user). `createFirebaseTransport({ emulator })` / `?rtdb=127.0.0.1:<port>` point the app at it (localhost only).
  - First result: host + guest + bot played a full game over the emulator from Node (131 versions, identical end states).
  - Not covered by the emulator: production rules as deployed, real latency and mobile network drops, the Netlify build itself.

## The gate today
- Session tests: 9 of 38 failed on a loaded box (load average ~41 on 4 cores). **All 9 were 5 s timeouts, with no assertion failures.** The hardening agent is moving the session tests to fake timers.

## Friend scenarios, before any fix (from reading the code and running tests)
| Scenario | Before | Why |
|---|---|---|
| Join by link on a phone | partly works | `?join=CODE` fills in the code, but you still type a name and tap Join. "Tap to copy invite link" fails silently where the clipboard is unavailable, and there's no share sheet. On `?transport=broadcast` the link drops the transport. |
| Guest reloads mid-turn | works | sessionStorage keeps {code, playerId} → `rejoinRoom`. Covered by the e2e. Risk on real Firebase: the old socket's onDisconnect can land *after* the new tab's "connected", which leaves the player shown offline (and, if they're the host, demoted). |
| Guest closes the tab for 2 min, comes back | **fails** | sessionStorage dies with the tab. Reopening the link means a new player id, so "That game has already started." The seat is lost for good, and the game stalls on that seat's turn forever. |
| Host reloads | works | The host goes offline, the lowest connected human is elected host, and the old host rejoins as a guest. Covered by the session test. |
| Host leaves for good | half | The room survives (host migration). But the host's seat stalls the game on its first turn, because nothing lets a bot play for a gone player. |
| A player gone on their turn | **fails** | No bot takeover. The room waits forever. |
| Two people click at once | works | Moves are checked against the version (stale → refused), and the same move twice is deduplicated. The state commit is CAS on `state.version`. |
| Someone joins after start | refused | A clear message, but no way to take an empty (left) seat. |
| Old build joins | refused | The hardening agent's `build.content` check (VERSION_MISMATCH on join, rejoin and host election). Not touched here. |

## Plan (worst first)
1. Rejoin always works: remember the room's player id on this device (localStorage) so a reopened link takes the seat back. A newcomer can take a seat whose player is offline (by name, or the only one). Self-heal the "connected" flag after a reload race.
2. Bot takeover: the host gets one tap, "P3 left — let a bot play for them", once a seat has been offline for N seconds. A bot plays the seat until its player returns; rejoining takes it back automatically.
3. The host leaving never kills the room: already true. Add a test that the new host runs the bots and the takeover.
4. Lobby: a room code, an invite link you can copy or share (with a fallback), who's connected, the host's Start button, and a reason when Start is disabled.
5. e2e: 3 browsers (host + 2 guests, one by link) to results, including a reload, a closed tab that comes back by link, and a bot takeover. It runs over BroadcastChannel in the gate, and over the RTDB emulator when `V4_RTDB` is set.

## Results (2026-10-14)
**Where things were tested.** Nothing ran on the production Firebase project or the Netlify link, because both are blocked from this container. The real Firebase SDK did run against the local RTDB emulator, with the repo's rules: 8 session scenarios, plus a 3-browser game in separate contexts with Pia on an iPhone 13. The gate runs the same scenarios over the in-memory transport, and the same 3-person e2e over BroadcastChannel.

| Scenario | Before | After | Proof |
|---|---|---|---|
| Join by invite link (phone) | code filled in, silent copy failure | the link shows in the lobby, Copy has a fallback, Share on phones, the transport params are kept | e2e `online.mjs` (Pia joins by the link, on an iPhone 13 over the emulator) |
| Guest reloads mid-turn | works | works; a late onDisconnect from the old socket is healed | `friends.test.js` "a reload whose old connection drops late…" (fails on the old code); e2e (Gus reloads) |
| Guest closes the tab, comes back | **seat lost** | the reopened link goes straight back to the seat (device memory). Home also fills in the last room's code | `friends.test.js` "a guest who closed the tab mid-game gets the same seat back…"; e2e (Pia reopens the link) |
| Player gone on their turn | **room stalls** | the host gets "Pia left. Let a bot play for them?" after 15 s, one tap. The bot plays until they're back, and rejoining takes the seat back | `friends.test.js` "a player gone on their turn…"; e2e (asserts the bot played Pia's turns, then that the table waits for her again) |
| Host reloads | works | works (host moves to Gus, Hana returns as a guest) | e2e (Hana reloads); `online.test.js` "host disconnects mid-game…" |
| Host leaves for good | half (seat stalls) | Leave hands your seat to a bot at once. A host whose tab dies is replaced, and the new host can bot their seat | `friends.test.js` "Leave mid-game hands your seat to a bot…" |
| Two people click at once | works | unchanged | `online.test.js` "duplicate submission…", "illegal / out-of-turn…" |
| Someone joins after start | refused | can take a left seat by its name, or the one seat a bot is playing; otherwise a message naming the open seats | `friends.test.js` "a newcomer takes a left seat by name…" |
| Old build joins | refused (hardening agent) | unchanged | `versions.test.js` |
| Emoji (seat → player) | — | kept into the game, through a reload and through a takeover | `friends.test.js` "each seat keeps its emoji…" |

**Still open (not done here).**
- The DB rules still let any signed-in client write anywhere in a room (engineering review item 8).
- Nobody has tested the production backend or real mobile networks.
- The Netlify preview URL redeploys on every push. A deploy mid-game refuses rejoins (VERSION_MISMATCH), so friends need the stable release link.
- How to run the emulator checks:
  1. `java -jar firebase-database-emulator-v4.11.2.jar --host 127.0.0.1 --port 9123`
  2. PUT `database.rules.json` to `/.settings/rules.json?ns=cornycolonies-default-rtdb` with `Authorization: Bearer owner`.
  3. `V4_RTDB_EMULATOR=127.0.0.1:9123 npx vitest run src/test/v4/session/friends.test.js`
  4. `V4_RTDB=127.0.0.1:9123 V4_URL=<preview> node e2e/v4/online.mjs`
