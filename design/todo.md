# To do (one ordered list; rewritten 2026-10-24 in the tidy-up)

Done items and the old lists: design/archive/todo-2026-10-20-to-23.md and design/archive/todo-before-2026-10-20.md.

## Cory's calls
All open design and feel questions are numbered in design/notes/waiting-on-cory-2026-10-24.md, defaults in brackets. When he answers, log each call in design/decisions.md, tick it there, and build in this order: two shops (#1 to #4), card changes (#5 to #11), board (#12 to #14), members (#15 to #17).

Redesign, brainstorm with Cory: Shake Down (feels too bad for the player who gets shaken down) and Late Bloomers (works against itself and counts itself). From his Oct 24 game.
Broader rework, his to lead (Oct 28): Crowd In ("+2 purple. This round you can place on taken spaces.") too strong with Greatest Hits, and Green has one copy too many (Encore the one to change). Two Encore lists missed; see design/pitch-ledger.md. Nothing built.
Member rework toward fewer, more strategic cults (Cory, Oct 27): target 8-10 member cards at game end. Next pitches, one example first: a trio set bonus (three linked members, across or within colors, scaling as you collect); how the Saboteur (-3 followers when it joins your cult) enters a cult. Open asks: Host, Grifter, Heiress stay like Patriarch? [yes]; Extortionist rework so it stops taxing follower buys (his yes, no shape yet). Tabled: a follower-spending color.
## Ours, open (no call needed)
0. Confirm two browsers in one online room see each other's table-talk bubbles on the live build (v0.9.2 shipped it).
0b. Known-red browser checks have no owner: shop-sizing.mjs (follower buys resize with details on), layout.mjs (setup waits, P1's count), hotseat.mjs (text cuts in "You" and the Even Swap picker), info.mjs (deck count 3 vs pile 36 in (h); lamp ring check in (s) misses a 3px outline). All red before v0.9.8xx details-text change. Fix, then empty e2e/v4/known-red.json.
1. Even Swap trading two shop members' places says nothing in "since your last turn"; say "swapped the shop's X and Y".
2. Long shop member names fit their box (Lottery Winner, Sponsor, Patriarch, Speculator, Stunt Double): recheck on the 6/7/8 shop first.
3. "Recruit" for members everywhere ("buy followers" stays): recheck buttons, prompts, toasts, log and rulebook since v0.8.31.
4. Round-end and end-game screens: appear quickly, readable layout, hover for detail, no totals counting up for nothing.
5. End-game scoring shows where every point comes from: each member pops "+x" for its people, then its granted followers (Cory, Oct 15).
6. Wording pass sheet (/mnt/project-files/overnight/lane8/wording-sheet.md): rows that only reword are applied; the rules-question rows wait for a text review run.
7. A joinable (lit) taken inner-ring space runs its minions past the panel top; decide where they stand.
8. Bulletin cards gather in one spot before the log (left over from the Oct 18 clarity motion).
9. Seat pass: minions, follower number, resources and rivals' engines readable at a glance. Show Cory 2 mockups first.

## Lag and motion (ours: engineering never waits on Cory; judge on the freeze probe in Chrome and Firefox)
- Smoothness panel leftovers (/mnt/project-files/smooth-panel/plan.md): the wheel's landing re-lay (lay out only panels whose upright side flips), scoringSnapshot cache, income line keyed by members, preview cap by time.
- Snappy pair next (Claude's): bots off the main thread (worker), one animation clock + piece pool, acknowledgment/frame bars in the snappy gate, cult-hop filter. design/eval/snappy-pair/README.md.
- React commits 80-130ms at 4x CPU; seat re-renders as cards land; hover "a tiny bit wonky"; linger motion starts late. Leftovers: design/eval/perf/lag-2026-10-21.md.
- Smooth play, next (ours, no call needed): tuning pass (structural sharing after applyMove, keep idle loops through shows instead of the data-chain rule, rect reads once per chain), then the staged show layer (design/eval/perf/smooth-proposal.md). Measure each with scripts/v4-rig.mjs.
- Re-port minion-on-press and the compositor wheel spin (/mnt/project-files/handoff/speed/) onto today's wheel.
- Round I resource draft animated, once the perf items are in.

## Later
- Engineering: structured events instead of log parsing; shared verbs for copies; online auth rules; type checking.
- Low priority (Cory, Oct 21): balance-test Crunch Time at 3 turns against 2.

## Parked
- Phone (out of scope, decisions 2026-10-20): wheel labels crowd in some rotations; phone turn toast over the choice sheet; online phone guest stuck on "Place here"; the pod's phone notes.
- Smarter Hard bot, better rollouts, a bot that learns: humans first.
- Live feedback tab and auto-fix pipeline (tabled by Cory; needs firebaseio.com allowed).
- Art: pixel animations "good enough for now"; living cults (idle loops, reactions).
- Cory's ideas, read when that color's rework starts: a color about swapping minions; members worth 2 followers (Snob); members themed with their color; Silver II-III reward getting rid of silver members; every color has a member end-game and a resource end-game card; a reverse color (actions gain followers, members cost followers); a defensive blocking color; a contests color ("gain the prize of a contest you lead now", design/future-colors.md). Peddler and Pilgrim are too similar (for Yellow).
- Cory's layout and motion ideas: log in the middle of the player boxes; remote mouse pointers; flights from a resource bank.

## Player feedback logged, no action yet (*)
- White's round II spaces need members people usually don't have yet; cheaper members will probably fix it (Cory).
- "Stealing spaces don't create money" (a player; Cory not sure he agrees); "more complex than anticipated"; the shop needs more people; Red and Purple have too many actions that are bad at the end; members are best bought early but seen late; "if you mess up your first couple turns you're just kind of toast".
