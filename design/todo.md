## This week, in order (2026-10-20, Cory back; full picture in /mnt/project-files/week-oct20/where-we-are.md)
Mine, no design call:
- [x] 1. Docs: one current state in HANDOFF/in-flight (archive the stacked v0.8.x sections), stale items folded here. (32ab2094)
- [x] 2. Tests green against today's rules: migrate the old Magenta tests; fix or update the six UI failures. Never weaken an assertion.
- [ ] 3. Cory's made calls: remove "its color isn't on the table"; guest members stay colorless (in flight); cut Social Climber (fill-in later); long shop member names fit. Done: the bots' swap-back fix (v0.8.13, d62ead53).
- [x] 4. Done-check the Oct 17 triage list and the old sections against the code (2026-10-21; old file: design/archive/todo-before-2026-10-20.md, evidence: /mnt/project-files/week-oct20/done-check.md).
- [ ] 5. Clarity: "I: / II: / III:" lines with other rounds dimmed; "P2 took X from you" shorter, near your card; shop refresh animates at round start; Red picker toast clear of the choice sheet.
- [ ] 6. Lag and 12-coins-as-12 (needs perf runs: waits for Cory's go).
Shipped this week: busy rival chair shows its members and "safe this round" (v0.8.15); layout gate works again (3bbe5b11).
Cory's calls (numbered picks when asked):
- [x] Magenta members: his light rework and tested prices shipped in v0.8.28 (Oct 21).
- [ ] Backlog (Cory, Oct 21): cut one Magenta member so Magenta has 12 like every color (it has 13 for now).
- [ ] Member prices at 1.5× for Magenta, Blue (12, all approved), Red, Green, guests; then the follower-only check (Member balance thread, claude/members-blue-v2).
- [ ] Gold, Silver, Yellow, Purple, White members: wait for each color's action redesign (Cory, Oct 21).
- [ ] Neutral members (Cory, Oct 21): Front-runner 5, Tiebreaker in, Launderer 6, prices spread 3–9 (decisions.md). Build on his go; nothing ships from the rework panel before it.
- [ ] Names: Recruit Bonus, Movement Penalty, Chronicler.
- [ ] Greatest Hits repeating a copied Echo's gain [no]; tiebreaker most members [yes]; new abilities for the dropped cost reductions.
Closed as superseded: Help Yourself 2/4/6, Crime Wave vs Redistribute, the Oct 18 Green picks.

## Waiting on Cory
Answer by number. Claude's default in [brackets].
1. Magenta members: his light rework. Also Magenta's color, which he dislikes.
2. Blue: actions, held-blue contest and shop 5/6/7 live in v0.8.19–20. Blue members wait for Cory's broader member exercise (rejected: blue from cards going to the bottom, recruit the pile top, blue per multi-buy turn). For Red later: "borrow a recruit" (use a shop member's On Recruit; it stays in the shop).
3. Names for the temporary Recruit Bonus, Movement Penalty and Chronicler. [keep the plain names until he names them]
4. Greatest Hits repeating a copied Echo's gain. [no: it repeats the space's own gain, as the card says]
5. Better pitches (his Oct 18 call): Sweet Talk ("+4 silver, then swap half or all"), Hold Court ("1 follower per 2 silver you hold"), Goody Bags ("+2 silver and +2 of another color"), Cheap Seats ("+1 follower per 3 white"), Catch Up ("+1 purple, +1 per rival who's placed more"), Silver's counterweight (Silver members and its round III), and a card in Overseer's place. [the pitch thread brings 2 options each]
6. The dropped cost reductions need new abilities: Intro Offer ("your next member costs 4 less") and the other discount cards. [Claude fill-ins until he designs them; Intro Offer → "+2 gold, plus 1 per gold member you have"]
7. Equal member counts: Red and Green deal 12, the other colors 10; Recluse ("+2 followers per rival with more members") sits in Blue. Which number? [12, each color filled as it's reworked; Recluse → White]
8. Bookkeeper ("+1 purple per 2 minions you have on the board") needs a rework. [with Purple's rework]
9. Stolen loot and gold members: an action's steal counts as a gain from an action, so Midas turns the loot to gold and Underdog doubles it (interactions.test.js DESIGN QUESTION). [keep; Midas is culled from the live deck anyway]
10. Stealing a member fires its "when recruited" effect for the thief (a stolen Lender pays +5; cards-trading.test.js). [yes: his Oct 18 call says taking a member counts as a recruit; Lender is culled from the live deck]
11. Tiebreaker on followers is most members (built, format.js:377). [keep] [x] (Cory 10-21: yes, keep)
12. Online on the real link: allow *.firebaseio.com, identitytoolkit.googleapis.com, securetoken.googleapis.com in the environment, or he plays one 2-laptop game. [he plays one] [x] (Cory 10-21: online works)
13. Faint marks for colorblind players (morning note #6). [no, unless a friend needs them] [x] (Cory 10-21: no)
14. Old notes nobody can place: "Hover over in the glossary", "Round 3 actions", "This should straight up steal", "follower claims visibility". [drop them] [x] (Cory 10-21: yes, dropped)
15. Your seat's member card: with two rows of members, a member's hover card covers the second row wherever it opens. Open it below the whole member block? [yes] [x] (Cory 10-21: drop it; the overlap check is gone)
16. Wording pass sheet: /mnt/project-files/overnight/lane8/wording-sheet.md, yes/no per row (⚑ rows are rules questions). [nothing ships until you answer] (Cory 10-21: "ok.." → applying the rows that only reword; ⚑ rules rows held)

## Ours, open
Correctness and Cory's made calls
- [x] Cut Social Climber ("whenever you release another member": dead, Release is off, core.js:25) and deal a Claude fill-in. (v0.8.16–0.8.21)
- [x] Guests colorless: in flight, uncommitted (content/index.js, benders.js). (v0.8.16)
- [x] Remove "Its color isn't on this table" (Info.jsx:231); glossary "colorless" to match. (v0.8.21)
- [x] Grifter keeps only its first sentence (thieves.js:313). (v0.8.21)
- [x] Top Up scales by round (yellow.js:40). Feastmaker becomes Chefs: a little cheaper, counts as at least 2 members (yellow.js:191). (v0.8.16)
- [x] Cut Overseer (purple.js:260); its replacement is Cory #5. (v0.8.21)
- [x] A player named "Pants" gets Max's tall leader (Glyphs.jsx:103). (v0.8.21)
- [x] A third shop toggle that fades unaffordable members (ShopCards.jsx:123). (v0.8.21, "affordable")
- [ ] Long shop member names fit their box (hotseat e2e: Lottery Winner, Sponsor, Patriarch, Speculator, Stunt Double); recheck first.

Laptop UI clarity
- [ ] "Buy" → "Recruit" for members everywhere (buttons, prompts, toasts, log, rulebook, card text); "buy followers" stays (Cory, 2026-10-21, design thread). After the panel A build lands.
- [x] Scaling text as "I: … / II: … / III: …" lines, the current round lit (hovers, member cards, seat list; wheel faces unchanged; the shop's details view now too, compact: "I +1 · II +2 · III +3").
- [x] "P2 took X from you": shorter, near your player card.
- [x] Red shop-swap turn toast names both the outgoing and incoming member. (v0.8.21)
- [ ] Round-end and end-game screens: appear quickly (A4 result-card lag), readable layout, hover for detail, no totals counting up for nothing.
- [ ] End-game scoring shows where every point comes from: each member pops "+x" for its people, then its granted followers (Cory, 10-15).
- [ ] Even Swap trading two shop members' places tells nothing in "since your last turn" (no member moved, so no effects); say "swapped the shop's X and Y". Bots pick it as a harmless swap since 2026-10-21.
- [ ] Seat pass: minions, follower number, currencies, and rivals' points and engine readable at a glance. Show Cory 2 mockups first.
- [x] Laptop fits: at 900×600 a rival's stacks crowd its total; at 1270×700 the strip squeezes "since your last turn" and holds one line under a turn card. (Lane 8, 10-21: chairs run full height beside the narrow shop strip; 1270×700 story holds two turns. turnstory t2/t9 fail before and after, pre-existing.)
- [x] Large screens (≥1600px): side columns scale with the wheel (zoom proposal, design-pod queue.md). (Lane 8, 10-21: zoom steps 1.25/1.4/1.6/2; hover cards stay 1×.)
- [x] Contest arc: follower mark distinct (a sheen). (Centering on the text line done 10-21.) (v0.8.25: sheen)
- [x] Silver, white and colorless members look alike at card size. (Lane 8, 10-21: own card grounds.)
- [x] Trade Seeds: its "Swap nothing" button reads as part of the caption; set it apart (yellow.js:221).
- [ ] Wording pass: member texts much tighter, steal text, wheel text (rule-style.md). Before/after sheet for Cory. (Sheet ready for his yes/no: /mnt/project-files/overnight/lane8/wording-sheet.md; nothing shipped.)
- [x] First play: tutorial wording for lit/dim/dark spaces and the inner II/III rings. (Lane 8, 10-21: your first placement each round names the open rings.)
- [x] "Safe this round" as a small shield mark (CultSeat.jsx:224).
- [x] Stacks of 20+ resources: size tiers that keep exact counts (H14). The pay sheet's coin stacks pack past six.
- [x] A clear purchase signal: the bought tier or card pulses before its reward flies (H13).
- [x] Recheck: a minion running past its panel's edge on space 0-1 (spaces.mjs s9). Passes (fixed earlier). Left: a joinable (lit) taken inner-ring space runs its minions past the panel top; needs a call on where they stand.

Motion and lag
- [x] Animate the member shop refreshing at round start.
- [x] Clarity motion (Cory, 10-18): a recruit flies to the middle, shows its effect, goes to the buyer; a steal shows what's taken at once; action effects play beside the action; bulletin cards gather in one spot before the log. Members acting pop from the seat (his idea). (v0.8.23; bulletin cards gathering before the log not done)
- [x] Round start as separate beats: home flights, net income, member hooks, market refill (A5 remainder). (v0.8.23)
- [x] End-of-round animations: smoothing. (v0.8.25)
- [x] Undo plays the motion backwards without repeating effects (H24). (v0.8.23)
- [x] Sounds land with their animation (audit #44). (v0.8.23: only skips were off)
- [x] Animation audit: the Green/Red animations Cory found missing (feedback-audit-2026-10-19.md). (v0.8.25: swaps cross as portraits; no other Red/Green effect without motion)
- [x] 12 coins animate as 12, any count. Trim pace elsewhere first; never raise the pacing cap. (v0.8.25; pace unchanged)
- [ ] Lag (needs Cory's go for perf runs): React commits 80–130ms at 4×; seat re-renders as cards land; hover "a tiny bit wonky" (film it frame by frame); linger motion starts late; re-measure the old 4× regression and hover p95.
- [ ] Re-port minion-on-press and the compositor wheel spin (6543c7f; /mnt/project-files/handoff/speed/) onto the 2/3/4-sector wheel.
- [ ] Round I resource draft animated, once the perf items are in (H04).

Tooling
- [x] Browser gates all green (10-21: 16 stale gates repaired; 5 real overlaps being fixed: Straggler details text, discounted price into worth, turn card over the story at 4 players and on a rival's turn, Lottery Winner hover over your second row), and a check:v4 that doesn't fail from the load it puts on the box. (v0.8.24: four overlaps fixed; members m3 known red, needs a seat call)
- [ ] Later (engineering review): structured events instead of log parsing; shared verbs for copies; online auth rules; type checking.

## Parked
- Phone (out of scope, decisions 2026-10-20): wheel labels crowd in some rotations (Ransom overlaps); phone turn toast over the choice sheet; online phone guest stuck on "Place here"; the pod's phone notes (rail pills, hub text, own turn card over the wheel, game-over seats, 14px targets).
- Smarter Hard bot (041dc63, e527a80 on claude/project-thread-gw4tce), better rollouts, a bot that learns: humans first.
- Live feedback tab and auto-fix pipeline (tabled by Cory; needs firebaseio.com allowed).
- Art: pixel animations "good enough for now"; living cults (idle loops, reactions); a higher-fidelity Extra Hand sample (H20).
- Cory's ideas, read when that color's rework starts: members worth 2 followers (Snob); deeper sphere themes, members themed with their sphere; Silver II–III reward getting rid of silver members; White rework, fewer followers as catch-up; Patron Saint 1 follower per silver member in play; every sphere has a member end-game and a resource end-game card; a reverse sphere (actions gain followers, members cost followers); a defensive blocking sphere.
- Cory's layout and motion ideas: log in the middle of the player boxes; remote mouse pointers (H05); flights from a resource bank (H12).
