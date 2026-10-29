# To do (one ordered list; rewritten 2026-10-24 in the tidy-up; backlog initiatives added 2026-10-29)

Done items and the old lists: design/archive/todo-2026-10-20-to-23.md and design/archive/todo-before-2026-10-20.md.

## Cory's calls
All open design and feel questions are numbered in design/notes/waiting-on-cory-2026-10-24.md, defaults in brackets. When he answers, log each call in design/decisions.md, tick it there, and build in this order: two shops (#1 to #4), card changes (#5 to #11), board (#12 to #14), members (#15 to #17).

Redesign, brainstorm with Cory: Late Bloomers (works against itself and counts itself). From his Oct 24 game. (Shake Down is done: the rival picks which member is at stake, v0.9.835.)
The wheel rim's words are a little hard to read (Cory, Oct 29: "not important for now"); look at size, weight and contrast later.
Rework the title section at the top (turn caption, "Round II of 3", Place/Recruit): Cory, Oct 29, "we need to rework that title section". Pitch a few looks with screenshots.
Broader rework, his to lead (Oct 28): design/notes/rework-list-2026-10-28.md, worked down by number. Decided and live: Crowd In, Encore, Once per game wording, Shake Down, Extortionist. Open steps are in Backlog initiatives below.

## Backlog initiatives (long-term goals, one line each; logged 2026-10-29 from closed threads)
1. Member decks to 15 per color, color by color with Cory: Green and the guests are done; Magenta, Blue, Purple, White, Red next. Each deck gets two cheap members (2-3), two big ones (8+), every timing, varied bodies (rework list steps 7, 13, 14).
2. Fewer, more strategic cults (Cory, Oct 27): about 8-10 member cards at game end; a trio set bonus per color (one example first); how the Saboteur reaches a cult if not from the shop (rework list step 11).
3. Rework list steps still open: what "pack/bonus merchants" means (8), White's cheap "cast me out" members (9), Sleep In growing +3/+5/+7 (10), Host, Grifter, Heiress stay [yes] (12), Double Agent's price (15).
4. "Once per round" members left: Squatter, Straggler, Big Spender (guests) and Taskmaster, Lookout, Pawnbroker (rework list step 3). Night Owl stays.
5. Round I passes still to do: White's 3/4/5 space; Gold, Silver and Yellow's round I; Purple's round I after a playtest (Cory, Oct 28).
6. Gold, Silver, Yellow redesigns (paused by Cory): all colors at 2.0 is v1.0.
7. Copying in round III: the expert AI games keep naming Last Call, Echo and Greatest Hits copying steals or Last Call; bots say whoever places last takes a third more of the round III contest followers. Spaces have no price, so these go to Cory as design calls once the balance thread reports.
8. Weakest artifacts: Money Changer and Impressionist are weakest with every bot, and artifacts are free, so a price can't fix them (Impressionist stays, Cory Oct 29).
9. Portraits as little scenes for every member, through critic rounds (running); two cards are both named Alchemist (gold.tinker, benders.freelancer).
10. Printed copy: the project's long-term aim. Nothing started; card faces from the members page are the likely starting point.
11. Rival members hover, more polish later (Cory, Oct 29: "in the backlog, i think we could improve this more in the future"). Shipped as mockup 13: cards in columns by the card's keyword, priciest first, heading with artifact, Round Start, Game End now, resources, members by color.

## Ours, open (no call needed)
- Portraits: wider skin-tone variation across the scene set (Cory, Oct 29: "maybe need wider variations in skin tones but these are good for now"). Kit has 6 tones; add in-between tones and spread them.
0. Confirm two browsers in one online room see each other's table-talk bubbles on the live build (v0.9.2 shipped it).
0b. Known-red browser checks have no owner: shop-sizing.mjs (follower buys resize with details on), layout.mjs (setup waits, P1's count), hotseat.mjs (text cuts in "You" and the Even Swap picker), info.mjs (deck count 3 vs pile 36 in (h); lamp ring check in (s) misses a 3px outline). All red before v0.9.8xx details-text change. Fix, then empty e2e/v4/known-red.json.
0c. travel.mjs t5 (ransom paid) is red on the build before v0.9.822 too: the ransom's pieces leave the payer's seat but the gate reads them as not from the seat. Fix the gate or the flight; t7 (Walk-In off the deck) is new and green.
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
- Wheel in Firefox: one ~180 ms hitch the first time the rim's words flip; 100-130 ms frames as a spin starts on slowed Firefox. Only if Cory says it still drags.
- Smoothness panel leftovers (/mnt/project-files/smooth-panel/plan.md): the wheel's landing re-lay (lay out only panels whose upright side flips), scoringSnapshot cache, income line keyed by members, preview cap by time.
- Snappy pair next (Claude's): bots off the main thread (worker), one animation clock + piece pool, acknowledgment/frame bars in the snappy gate, cult-hop filter. design/eval/snappy-pair/README.md.
- React commits 80-130ms at 4x CPU; seat re-renders as cards land; hover "a tiny bit wonky"; linger motion starts late. Leftovers: design/eval/perf/lag-2026-10-21.md.
- Smooth play, next (ours, no call needed): tuning pass (structural sharing after applyMove, keep idle loops through shows instead of the data-chain rule, rect reads once per chain), then the staged show layer (design/eval/perf/smooth-proposal.md). Measure each with scripts/v4-rig.mjs.
- Re-port minion-on-press and the compositor wheel spin (/mnt/project-files/handoff/speed/) onto today's wheel.
- Round I resource draft animated, once the perf items are in.

## Later
- Engineering: structured events instead of log parsing; shared verbs for copies; online auth rules; type checking.
- Fresh balance run: done Oct 29 afternoon (design/eval/balance-oct29b); Cory's five calls in the report are open. Go-Between Yellow batch still running.
- Backlog (Cory, Oct 29: "yes but not right now"): rework Greatest Hits ("Copy every action with your minion"), which wins two games in three for its taker in every bot run; bring 5 ideas when he picks it up.
- Backlog (Cory, Oct 29: "i think we finally need to rework the follower gains"): rework how players gain followers; at 4 players a seat that only buys followers wins 3% against Hard bots.
- Balance follow-ups (Cory, Oct 29 morning; report https://claude.ai/artifact/VAMVg3DAPWoFabU8AFSWs8): ideas for Recruiter and Money Changer (they read alike), Green's Cover (stays as is for now, Oct 29; re-read in the next balance run) and Agents (maybe something else), Bait's wording; buy-followers-only seat on Hard bots should win ~10-15% (now 7-9%), so a stronger follower shop. Bots can't value handing Agents/Saboteur to rivals or Loyalists' shield: bot-quality job asked of the coordinator; re-read those cards after it and after the member-count scoring fix.
- Fresh balance run (Cory, Oct 29: "when EVERYTHING has landed, we should do fresh balance testing"): after the wording, turn fixes, purple calls and the bot upgrade are live; upgraded Hard bots, 2.0 colors plus guests, scripts/v4-balance*.mjs, same method as design/eval/balance-oct29. Check in it: Double Agent at 7 (Cory: too cheap), Go-between (Cory: "should likely be cheaper", test before changing), Choir and Raiders member counts. Followers-only games count only for that seat (Cory, Oct 29). Re-read Green's Cover (bots rate empty actions by estimate since v0.9.879).
- Balance follow-ups (Cory, Oct 29 morning; report https://claude.ai/artifact/VAMVg3DAPWoFabU8AFSWs8): ideas for Recruiter and Money Changer (they read alike), Green's Cover (maybe "copy an action with a rival's minion on it") and Agents (maybe something else), Bait's wording; buy-followers-only seat on Hard bots should win ~10-15% (now 7-9%), so a stronger follower shop. Bots can't value handing Agents/Saboteur to rivals or Loyalists' shield: bot-quality job asked of the coordinator; re-read those cards after it and after the member-count scoring fix.
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
