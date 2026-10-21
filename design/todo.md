## This week, in order (2026-10-20, Cory back; full picture in /mnt/project-files/week-oct20/where-we-are.md)
Mine, no design call:
- [x] 1. Docs: one current state in HANDOFF/in-flight (archive the stacked v0.8.x sections), stale items folded here. (32ab2094)
- [x] 2. Tests green against today's rules: migrate the old Magenta tests; fix or update the six UI failures. Never weaken an assertion.
- [ ] 3. Cory's made calls: remove "its color isn't on the table"; guest members stay colorless (in flight); cut Social Climber (fill-in later); long shop member names fit. Done: the bots' swap-back fix (v0.8.13, d62ead53).
- [x] 4. Done-check the Oct 17 triage list and the old sections against the code (2026-10-21; old file: design/archive/todo-before-2026-10-20.md, evidence: /mnt/project-files/week-oct20/done-check.md).
- [ ] 5. Clarity: "I: / II: / III:" lines with other rounds dimmed; "P2 took X from you" shorter, near your card; shop refresh animates at round start; Red picker toast clear of the choice sheet.
- [ ] 6. Lag and 12-coins-as-12 (needs perf runs: waits for Cory's go).
Shipped this week: busy rival chair shows its members and "safe this round" (v0.8.15); layout gate works again (3bbe5b11).

## Waiting on Cory
Answer by number. Claude's default in [brackets].
1. Magenta members: his light rework. Also Magenta's color, which he dislikes.
2. Blue: worked in its own thread (second round II slot; round I spaces that "kinda don't scale").
3. Names for the temporary Recruit Bonus, Movement Penalty and Chronicler. [keep the plain names until he names them]
4. Greatest Hits repeating a copied Echo's gain. [no: it repeats the space's own gain, as the card says]
5. Better pitches (his Oct 18 call): Sweet Talk ("+4 silver, then swap half or all"), Hold Court ("1 follower per 2 silver you hold"), Goody Bags ("+2 silver and +2 of another color"), Cheap Seats ("+1 follower per 3 white"), Catch Up ("+1 purple, +1 per rival who's placed more"), Silver's counterweight (Silver members and its round III), and a card in Overseer's place. [the pitch thread brings 2 options each]
6. The dropped cost reductions need new abilities: Intro Offer ("your next member costs 4 less") and the other discount cards. [Claude fill-ins until he designs them; Intro Offer → "+2 gold, plus 1 per gold member you have"]
7. Equal member counts: Red and Green deal 12, the other colors 10; Recluse ("+2 followers per rival with more members") sits in Blue. Which number? [12, each color filled as it's reworked; Recluse → White]
8. Bookkeeper ("+1 purple per 2 minions you have on the board") needs a rework. [with Purple's rework]
9. Stolen loot and gold members: an action's steal counts as a gain from an action, so Midas turns the loot to gold and Underdog doubles it (interactions.test.js DESIGN QUESTION). [keep; Midas is culled from the live deck anyway]
10. Stealing a member fires its "when recruited" effect for the thief (a stolen Lender pays +5; cards-trading.test.js). [yes: his Oct 18 call says taking a member counts as a recruit; Lender is culled from the live deck]
11. Tiebreaker on followers is most members (built, format.js:377). [keep]
12. Online on the real link: allow *.firebaseio.com, identitytoolkit.googleapis.com, securetoken.googleapis.com in the environment, or he plays one 2-laptop game. [he plays one]
13. Faint marks for colorblind players (morning note #6). [no, unless a friend needs them]
14. Old notes nobody can place: "Hover over in the glossary", "Round 3 actions", "This should straight up steal", "follower claims visibility". [drop them]

## Ours, open
Correctness and Cory's made calls
- [ ] Cut Social Climber ("whenever you release another member": dead, Release is off, core.js:25) and deal a Claude fill-in.
- [ ] Guests colorless: in flight, uncommitted (content/index.js, benders.js).
- [ ] Remove "Its color isn't on this table" (Info.jsx:231); glossary "colorless" to match.
- [ ] Grifter keeps only its first sentence (thieves.js:313).
- [ ] Top Up scales by round (yellow.js:40). Feastmaker becomes Chefs: a little cheaper, counts as at least 2 members (yellow.js:191).
- [ ] Cut Overseer (purple.js:260); its replacement is Cory #5.
- [ ] A player named "Pants" gets Max's tall leader (Glyphs.jsx:103).
- [ ] A third shop toggle that fades unaffordable members (ShopCards.jsx:123).
- [ ] Long shop member names fit their box (hotseat e2e: Lottery Winner, Sponsor, Patriarch, Speculator, Stunt Double); recheck first.

Laptop UI clarity
- [x] Scaling text as "I: … / II: … / III: …" lines, the current round lit (hovers, member cards, seat list; wheel faces unchanged; the shop's details view now too, compact: "I +1 · II +2 · III +3").
- [x] "P2 took X from you": shorter, near your player card.
- [ ] Red shop-swap turn toast names both the outgoing and incoming member.
- [ ] Round-end and end-game screens: appear quickly (A4 result-card lag), readable layout, hover for detail, no totals counting up for nothing.
- [ ] End-game scoring shows where every point comes from: each member pops "+x" for its people, then its granted followers (Cory, 10-15).
- [ ] Seat pass: minions, follower number, currencies, and rivals' points and engine readable at a glance. Show Cory 2 mockups first.
- [ ] Laptop fits: at 900×600 a rival's stacks crowd its total; at 1270×700 the strip squeezes "since your last turn" and holds one line under a turn card.
- [ ] Large screens (≥1600px): side columns scale with the wheel (zoom proposal, design-pod queue.md).
- [ ] Contest arc: follower mark distinct (a sheen). (Centering on the text line done 10-21.)
- [ ] Silver, white and colorless members look alike at card size.
- [x] Trade Seeds: its "Swap nothing" button reads as part of the caption; set it apart (yellow.js:221).
- [ ] Wording pass: member texts much tighter, steal text, wheel text (rule-style.md). Before/after sheet for Cory.
- [ ] First play: tutorial wording for lit/dim/dark spaces and the inner II/III rings.
- [x] "Safe this round" as a small shield mark (CultSeat.jsx:224).
- [x] Stacks of 20+ resources: size tiers that keep exact counts (H14). The pay sheet's coin stacks pack past six.
- [x] A clear purchase signal: the bought tier or card pulses before its reward flies (H13).
- [x] Recheck: a minion running past its panel's edge on space 0-1 (spaces.mjs s9). Passes (fixed earlier). Left: a joinable (lit) taken inner-ring space runs its minions past the panel top; needs a call on where they stand.

Motion and lag
- [x] Animate the member shop refreshing at round start.
- [ ] Clarity motion (Cory, 10-18): a recruit flies to the middle, shows its effect, goes to the buyer; a steal shows what's taken at once; action effects play beside the action; bulletin cards gather in one spot before the log. Members acting pop from the seat (his idea).
- [ ] Round start as separate beats: home flights, net income, member hooks, market refill (A5 remainder).
- [ ] End-of-round animations: smoothing.
- [ ] Undo plays the motion backwards without repeating effects (H24).
- [ ] Sounds land with their animation (audit #44).
- [ ] Animation audit: the Green/Red animations Cory found missing (feedback-audit-2026-10-19.md).
- [ ] 12 coins animate as 12, any count. Trim pace elsewhere first; never raise the pacing cap.
- [ ] Lag (needs Cory's go for perf runs): React commits 80–130ms at 4×; seat re-renders as cards land; hover "a tiny bit wonky" (film it frame by frame); linger motion starts late; re-measure the old 4× regression and hover p95.
- [ ] Re-port minion-on-press and the compositor wheel spin (6543c7f; /mnt/project-files/handoff/speed/) onto the 2/3/4-sector wheel.
- [ ] Round I resource draft animated, once the perf items are in (H04).

Tooling
- [ ] Browser gates all green, and a check:v4 that doesn't fail from the load it puts on the box.
- [ ] Later (engineering review): structured events instead of log parsing; shared verbs for copies; online auth rules; type checking.

## Parked
- Phone (out of scope, decisions 2026-10-20): wheel labels crowd in some rotations (Ransom overlaps); phone turn toast over the choice sheet; online phone guest stuck on "Place here"; the pod's phone notes (rail pills, hub text, own turn card over the wheel, game-over seats, 14px targets).
- Smarter Hard bot (041dc63, e527a80 on claude/project-thread-gw4tce), better rollouts, a bot that learns: humans first.
- Live feedback tab and auto-fix pipeline (tabled by Cory; needs firebaseio.com allowed).
- Art: pixel animations "good enough for now"; living cults (idle loops, reactions); a higher-fidelity Extra Hand sample (H20).
- Cory's ideas, read when that color's rework starts: members worth 2 followers (Snob); deeper sphere themes, members themed with their sphere; Silver II–III reward getting rid of silver members; White rework, fewer followers as catch-up; Patron Saint 1 follower per silver member in play; every sphere has a member end-game and a resource end-game card; a reverse sphere (actions gain followers, members cost followers); a defensive blocking sphere.
- Cory's layout and motion ideas: log in the middle of the player boxes; remote mouse pointers (H05); flights from a resource bank (H12).
