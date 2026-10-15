# In flight

Updated 2026-10-14 ~21:40 UTC. Agents never commit; the foreman verifies and checkpoints. Each agent runs check:v4 on its own `V4_OUTDIR`/`V4_PORT` (build dirs seen on disk are noted). If a session dies, relaunch each workstream from its brief below and tell it to read `git log` first. Done items are ticked in design/todo.md.

## Current roster
1. **UI-A: wheel, shell, pay, the Reckoning, phone.** Brief: design/prototypes/vision/build-plan.md (Split: UI-A; Making it clear; Layout revision). Owns `lamp.css`, the GameScreen shell, `Wheel.jsx`, `PayPicker.jsx`, `RoundEnd.jsx` and the phone layout. Now: the layout revision (the wheel centred and bigger, a cult at each corner, minions on a space's rim so its text stays readable, "minion" in the prompt), then the animated Reckoning. Build dir `.v4-build-ui` (port 5282).
2. **UI-B: shop strip, corner cults, hover layer, art import, animations, e2e selectors.** Brief: build-plan.md (Split: UI-B; Layout revision; hover; sports cards; minions float). Owns `ShopCards.jsx`, `CultSeat.jsx`, `HoverCards.jsx`/`Info.jsx`, `game/lamp-b.css` and the art wiring. Next (Cory, 21:40): a visible face-down member deck with its count at the head of the shop strip. Earlier: a slim strip of 10 sports-card members (figure, name, cost, worth; effect on hover; only what you can afford lit when buying), the four corner cults (leader, floating minions, member crowd, follower mark, resources), instant hover (<100ms, one sticky layer, the info.mjs gate), the turn story, then idle loops and reactions (stretch). Keeps every e2e gate green as selectors change, never weakening an assertion. Build dir `.v4-build-uib`.
3. **Hardening.** Brief: design/eval/engineering-review.md ("Do now", then "Do soon") and the hardening line in todo.md. Landed: honest gate, CI, version stamps and content hash, game records and replay, the Recovery screen, bot-failure fallback. Build dir `.v4-build-hard`.
4. **Multiplayer.** Done for v0.2 (rejoin, late disconnects, bot stand-in, host move and heartbeat, guest-wake fix, newcomer takes a left seat, Back confirm, effect-aware hash, Try again, online Recovery, fewer re-renders, per-person browser contexts; design/eval/multiplayer-readiness.md). Open: a sleeping guest reads as connected until Firebase notices; DB rules open to any signed-in client. Was: Brief: todo.md's friends-build milestone (the online lines) and design/eval/multiplayer-readiness.md. Real Firebase and the Netlify link are blocked from this container, so it tests on the RTDB emulator (`V4_RTDB=host:port`, `?rtdb=`). Build dir `.v4-build-mp`.
5. **White rework.** Brief: design/eval/cory-notes-2026-10-14.md §2, design/spheres/trading.md, `content/trading.js`. Landed: Pawn, Barter (replaces Cash In), Broker and Dealer at 2+0.
6. **Green rework.** Brief: cory-notes §3, design/spheres/echo.md, `content/echo.js`. Landed: Echo (a space a rival took since your last turn), Refrain, Understudy, Ensemble.
7. **Dead-window fixes.** Brief: cory-notes §4 (the ranked list and the systemic rules). Landed (logged in decisions.md): "Now and at round start" on 19 members, Extra Hand, Heir, Revelers (was Feast Hall), Social Climber, Prism, Bloom, Tip-off, Silversmith, Grifter, and no Release in the round you recruited. Remaining: the rest of the ranked list; the other systemic rules are proposals until logged.
8. **Icon batch Blue/White/Green/Purple.** Brief: design/prototypes/pixel-art/style.md; drawings in `icons-blue-white-green-purple.js`, imported by `scripts/v4-art-import.mjs`. All batches are drawn (681046c). Cory: good enough for now, polish later.
9. **Emoji minions + cult leaders.** Brief: build-plan.md "Minions and cult leaders"; drawings in design/prototypes/pixel-art/emojis.js and leaders.js, the identity sheet beside them. Landed: 20 emojis, robed leaders, emojis kept per seat online (f8aa8c0, friends.test.js). Remaining: the emoji pick when joining (one per table; bots take a free one), "minion" everywhere a player reads "worker", unplaced minions floating around the leader.
10. **Intro.** Done (7 beats, ~20s, once per browser; Skip/Esc/tap; storyboard under reduced motion; `?intro=0|1`; unit + hotseat gates). Menu replay → UI-A. Brief was: build-plan.md "Intro and follower symbol"; `src/v4/Intro.jsx`. Built: per player and local, skippable, a still storyboard under reduced motion, `?intro=0` / `?intro=1`, replay from the menu. Build dir `.v4-build-intro` (port 5298).
11. **Purple: Night Owl + reprice.** Done (Night Owl, five reprices, Night Owl and Revelers art, a gate that every real member has a drawing). Brief: design/eval/purple-members.md (from the remote Purple session). Night Owl (8+2, "When you place your last minion of a round, take an extra turn right after this one.") takes Relay's slot; Double Time 6, Overseer 4, Taskmaster 6, Second Wind 8, Late Riser 6. Build dir `.v4-build-purple` (port 5310).
13. **Game and fun critic, round 2 (blind).** boardgame-enthusiast on the frozen build 4fa162a (`.v4-panel/d9`, port 5202), two full games, with a Vision section. Report → design/eval/boardgame-enthusiast-round2.md.
15. **Engineering review, round 2.** Done → design/eval/engineering-review-round2.md. Routed: online blockers (Back leaves the game, effect-blind hash, host heartbeat, Try again, Recovery rejoin, per-player contexts) → Multiplayer; preview warmup, end-screen tie, memo → UI-A; ShopCards preview subscription, worker fallback → UI-B; harness → roster 16.
16. **Harness hardening.** v4-check/peek spawn vite directly and kill the process group, port checked before spawn; dead-component tests ported to live ones; kept records re-recorded (`records:refresh`); dist/ untracked; architecture.md CI line. Build dir `.v4-build-harness` (port 5316).
17. **Names + Even Swap.** Action names batch 1 (Cory approved) and batch 2 (pending his grade), member renames (Cory trusts), Even Swap replaces Scout. Build dir `.v4-build-names` (port 5314).
18. **Rules: unlimited 10→10, Barter → Dividend.** Done (buyer 15.3% → 8.5%, Normal bots, 200 games); finishing the market Spree gate. Build dir `.v4-build-follow` (port 5312).
14. **Action spaces: three directions.** Static mocks in design/prototypes/actions/ (Cory: "I still don't like the actions"), for Cory to pick by number; then UI-A builds the pick in Wheel.jsx.
12. **Design critic, round 2 (blind).** On the frozen build 4da59a3 (`.v4-panel/d8`, port 5201), with a Vision section (visual actions, elegant round scoring, cults at a glance) and a mocked frame. Report → design/eval/ui-critic-round2.md.

19. **Two-device online check.** QA agent over the RTDB emulator (real SDK) on a frozen HEAD: laptop host + iPhone 13 guest, reload mid-turn, 30s offline, Back swipe, host offline, to results. Port 5320, emulator 9124. Production Firebase/Netlify blocked (proxy 403) until Cory allows the hosts.
20. **Emoji pick + online bot level.** Done (EmojiPicker.jsx, emojiPick.js, lobby.setEmoji, bot level in the lobby; tests on the in-memory transport and the emulator).
21. **Friends docs.** Done: rulebook to tonight's rules (glossary text fixes: Release, tiebreak example, steal), design/friends-guide.md, design/release-notes-v0.2.md.
22. **Intro v2 + plain robes.** Parallel since 23:40 (Cory: faster): the lead owns shared.jsx, the storyboard, Beat1, the shell and integration; builders on Beat2, Beat3, Initiation and Beat4; shared dev server :5330, GIFs via scripts/v4-gif.mjs. Was: Cory's 4-beat script, animated (scheming laugh, minions appear, actions → resources/members/power, three rounds → most followers wins); every leader in the same brown or gray robe. Port 5324.
- Release-candidate panel briefs are ready: design/eval/panel-rc-briefs.md.

## Held
- **Fair-price screen, bot levels + 4-thinker tables:** offloaded to the remote sessions below. The Purple session is done (roster 11).
- **Board game enthusiast:** the missing third reviewer of fresh-eyes round 1. Held until the layout revision lands and a build is frozen from a commit; then run the full trio (ui-critic, enthusiast, engineer) as round 2, plus the meta synthesis.

## Done from the 17:00 catalogue
- Cost change and top tier: costs ×2, follower buys take any resources, the last 10→10 is the clock, design/eval/top-tier.md, the rulebook.
- The UI agent's list: table picker, the reload-erase bug, the stuck Undo pill, panel 7 fixes (each now an e2e gate).
- Cross-sphere fuzz and interaction tests (`fuzz-tables.test.js`, `interactions.test.js`).
- Bot levels Easy/Normal/Hard in the engine (the setup screen doesn't offer them yet).
- Rule-benders: Straggler, Late Riser (Purple's old Straggler), Release on by default, interaction tests, `e2e/v4/benders.mjs`.
- Still owed from that list: the blind panel on mixed tables, then fixes.

## Resume after a usage-limit pause
Limits hit four times on 2026-10-14 (06:30, 11:40, 16:40, 18:55 UTC). The foreman's `send_later` check-in pings each paused agent with SendMessage (ids in that message), UI-A and UI-B first. If the session is gone, relaunch from the briefs above.

## Remote sessions (own machines, started 20:48 UTC): heavy simulation offloaded from this 4-CPU box
- Fair-price screen for every card → branch claude/cults-fair-price (session_01SAnMH5dXApptnHJqsFTvdV)
- Bot levels + 4-thinker balance tables → branch claude/cults-bots (session_012LrFkfKC8GG3gLHPuLK2jF)
- Balance bench (triangulated: cards, spaces, archetypes, fairness, health, anchors, human records) → branch claude/cults-bench (session_011mMXsYcXHM7NPhc8g63Ki6), started 22:35.
- Purple member replacements + per-turn repricing → branch claude/cults-purple-members (session_01KzNtqok74Xvo1pxX1pqWkS). Done 21:09; report brought in by roster 11.
The foreman merges each branch after reviewing it (proposals only: no content price changes land without review; design changes go to Cory).
