# Purple, anchor seat (round III first, work backward)

All card texts and numbers are Claude's fill-ins, not approved. Exceptions, marked "(live)": cards kept word for word from src/engine/v4/content/purple.js.

Scope: Purple actions and members. The purple-leaning guests (Extra Hand, Front-runner, Straggler) are out of scope. No sims, no games; arithmetic from the live rules and pricing.md.

---

## 0. What Crunch Time actually is worth (the anchor, checked before building on it)

Crunch Time (live): "Take your next 2 turns right away." These are your own turns, so you place no extra minions, the spare-space rule never applies, and it works in any round.

The thing to see: **a turn-order space costs you a placement, so its value is only the gain in what your next picks reach.** That's why Overtime "lost a minion for slight position gain". It's also why Crunch Time is good: it moves two picks, and it sits in round III, where the gap between picks is widest.

Round III at 4 players: 5 minions each, 20 turns, 24 spaces, 4 anchors (one per color), trailer picks first, snake order.
- **Taken first, with two other anchors open:** your next two picks move from slots 8 and 9 to slots 2 and 3. Each one becomes an anchor (about 8–10) in place of a filler (about 3). So (9 − 3) × 2 + 1 = **about 13**. You also make three buys in a row before the row changes, and two rivals lose the anchors they would have taken.
- Against the cost of the slot (you could have just taken the best anchor), it's still about +4 to +5 for you, plus about 6 lost by each of two rivals. That relative swing is what makes it the burst.
- **One anchor left:** about 7. **None left:** about 2 to 3 (two better-than-normal picks).
- **At 2 players:** only 2 anchors. Crunch Time takes the other anchor plus a good ring II space, about 6 to 7, and the one rival gets no anchor.

So Crunch Time is relative: it's worth what the board's best spaces are worth, which is Cory's Echo bar ("scales because it copies better actions later"). It is the anchor you take first or not at all. It gives the trailer (who picks first) the biggest swing in round III, so it is the color's catch-up without a "fewest followers" clause. **Kept as the round III space in both concepts.** I tried six other round III ideas (appendix) and none was clearly better.

Only change: add "+1 purple" at the end, per the Oct 20 economy (every action gives 1 of its color). He can leave it off.

The #99 note ("non-intuitive turns in snake draft") is a turn-rail display fix, not a rule fix. Any concept that adds more "take your next turn right away" makes that display matter more.

### What purple should build toward, read from Crunch Time
1. **Position matters, and its value grows by round.** Single turn moves in rounds I–II are worth little unless the space also pays like a normal space of its ring. So rounds I–II carry real gains, with the turn move as a bonus, never as the whole effect.
2. **Members can move turns for free.** A member arrives on your buy step, not your placement, so "When recruited: take your next turn right away" moves a pick without spending one. That's the one place a single turn move is pure profit, so it belongs on cards.
3. **Three buys in a row is a cash-in.** A purple player who arrives at round III with a pile turns Crunch Time into three back-to-back buys. Contest on held purple (recommended below) makes holding through round II pay twice.

**Contest (both concepts): most purple held at round end, 2/4/6.** The live contest is "most purple members", which the other reworks have left. Held purple gives the color hold versus spend.

---

## Concept A: "Skip ahead" (recommended)

**Identity in one mechanic:** Purple brings your future forward: your next turns now (Head Start, Crunch Time) and your next round-start income now (Wake Up, Fast Forward). It moves no members (Red), copies no action (Green), takes nothing (Magenta) and adds no buys (Blue). It changes *when* you get things.

### Actions (every action +1 purple)
| Ring | Name | Text | Taker walks away with |
|---|---|---|---|
| III | **Crunch Time** (live, +1 added) | Take your next 2 turns right away. +1 purple. | About 13 first; 7 with one anchor left; 2–3 late |
| II | **Head Start** | +1 purple per minion you have left to place, then take your next turn right away. +1 purple. | Round II: 5 + a turn moved up when taken first (3 left), 2 when taken last. Round III: up to 6 + a turn moved up |
| II | **Fast Forward** | Your members' round-start effects happen now. +1 purple. | Round II: 1 for an empty cult, 3–5 typical, 5–8 for a purple engine. Round III: the same again, as fuel for the cash-in |
| I | **Clock In** (reworked) | +1 purple × round. +1 purple. | 2 / 3 / 4 |
| I | **Catch Up** (Cory's Oct 15 version, today's Roll Call rule) | +1 purple per minion you have on the board, this one included. +1 purple. | Round I 2 / 3 / 4 by your 1st/2nd/3rd minion; round III up to 6 |
| I | **Wake Up** | One of your members' round-start effects happens now. +1 purple. | Round I: 1 on a first pick, 2–4 after a cheap income member; round III: up to 6 |

Notes per slot:
- **Round III**: as section 0.
- **Round II, against Promote and Shake Down.**
  - Fast Forward changes what you own: it's a pile of resources from cards you built, and it grows as you buy members, so it's still a top space in round III.
  - Head Start is the small form of Crunch Time, as Buy twice is the small form of Spree (Cory approved that pair). Its early-pick bonus pays most exactly when a turn move is worth most, and its walk-away when taken first (about 5 plus a better next pick) sits next to Promote (about 3.5) and Shake Down (about 5).
  - Plan Ahead's rule ("+1 per minion left") folds into Head Start, so Plan Ahead and Rush Hour retire.
- **Round I** (totals 2–4, three different side effects):
  - Clock In: reliable.
  - Catch Up: Cory's own "1, 2 or 3 for your first, second or third minion… take it early for less, or hold out", which is today's Roll Call. One space now does what Catch Up and Roll Call did, and it answers "Catch up should be better": the live version averages about 2.5 and never grows, this one pays 2–4 in round I and up to 6 in round III.
  - Wake Up: the round I form of Fast Forward (Echo, then Greatest Hits, is the same ladder).
  - Clock In loses "+4/+5/+6", the biggest flat gain in round I on the board.
  - All three still pay 4–6 in round III.

**How it touches other colors (generically):**
- Crunch Time and Head Start take every color's best spaces before their owners answer.
- Fast Forward, Wake Up and Alarm Clock pay off any deck's round-start members, so a purple player buys income members of other colors, holds those colors, and turns up in those contests.
- A copier who copies Fast Forward fires their own members (a copy gives the printed effect), so it's a space two players want.
- Rivals feel purple as "it got there first", never as a loss of what they own.

### Deck (10)
| Card | Cost (colored+any) | Followers | Text | Why that price |
|---|---|---|---|---|
| Shift Crew (live) | 1+1 | 2 | Worth 2 followers. No effect. | Cheap body at f = C, Open Door's pick. Kept |
| Timekeeper (live text) | 2+1 | 1 | Game end: +1 follower per 3 purple. | Pays 2–3 for a holder with 6–9 purple at the end. Down from 4+2, which was a trap (about 0.8) |
| Sprinter | 3+1 | 1 | Whenever you take two turns in a row, +1 follower. | Snake ends give 3–4 a game at 4 players, plus every turn move. Ratio about 1.2 at 4. **Hot at 2 players** (everyone doubles up, 4–5 a game); 5 if it plays hot |
| Errand Runner | 2+2 | 2 | When recruited: take your next turn right away. | The color's action on arrival, a free turn move worth 1–3, up to 6 in round III. Two bodies. About 1.3 |
| Punch Clock | 2+2 | 1 | Now and at round start, +1 purple per rival with more followers than you. | Catch-up keyed to visible rival state. About 4–5 over a game for a middling player, 8–9 for the trailer. Weak at 2 players (0–1 a fire) |
| Clockmaker (live) | 3+2 | 1 | Now and at round start, +1 purple per 2 purple you have. | It compounds, feeds the contest, and Fast Forward and Wake Up fire it again: about 1.7 at 4, so up to 5 |
| Alarm Clock | 3+2 | 2 | When recruited: your members' round-start effects happen now. | Fast Forward on a card (Panel is Promote on a card). 2–4 typical, 5–7 in the engine, plus 2 bodies: about 1.3 |
| Late Riser (live) | 4+2 | 1 | At round start, if you have the fewest followers (ties count), take an extra turn before anyone else. | Rounds II–III only, and needs a spare space. It's worth 5–8 when it fires and fires maybe half the time for a purple holder who lies low. Kept |
| Double Shift | 6+2 | 2 | Your first turn each round: take your next turn right away. | Crunch Time-lite every round, no placement spent: about 1 / 2 / 5 by round plus 2 bodies, about 1.3. Heavy colored part: it's for the committed |
| Night Owl (live) | 8+2 | 2 | Rounds II–III: after placing your last minion, take 1 extra turn if there's room. Once per round. | Capstone. Two extra placements and buys, about 5 and 7, the last buy of the game rescuing a pile. About 1.4. Cory set its followers |

- Prices run 2, 3, 4, 4, 4, 5, 5, 6, 8, 10, with 15 followers on 10 cards.
- Shape: cheap body (Shift Crew), the color's action on arrival (Errand Runner, Alarm Clock), two income cards, one of them growing (Clockmaker, Punch Clock), a card that reads rivals (Punch Clock), a scorer (Timekeeper), a bender (Late Riser), the trigger on the verb (Sprinter), and a capstone (Night Owl, with Double Shift under it).
- Every card stands alone. At 4 players a purple player sees about 8 of the 10 and owns 3 to 5, and nothing needs a partner. Pairs that sing: Sprinter with any turn move, Clockmaker with Fast Forward.
- **Out:** Bookkeeper (Cory: "bad"), Overseer (cut), Go-Getter (a third extra-turn card next to Night Owl and Late Riser), Courier, Foreman and Apprentice (triggers on extra turns; Apprentice is a cost cut), Taskmaster and Corner-Cutter (paying purple for turns), and Lamplighter. Lamplighter's flat +3/+4/+5 a round, fired again by Fast Forward, is the "+10 in round 2" Cory rejected.

### Self-critique (A)
- **Specialist:** Clock In and Catch Up, plus one cheap income member, in round I. Fast Forward in round II, holding purple. In round III, pick first if trailing and take Crunch Time, or else Head Start for a better pick, then three buys in a row.
- **Rival:** whoever picks first in round III must take Crunch Time or lose two anchors to whoever does. That's a clear, readable threat.
- **Newcomer:** Fast Forward and Clock In read at a glance. Turn moves need the turn rail to show "moved up" plainly (#99).
- **At 2 players:** the snake already doubles turns, so Sprinter runs hot and Punch Clock runs cold. Crunch Time is still the denial play.
- **At 4 players:** round I is full, and nothing in A adds a placement there. Errand Runner and Double Shift only move turns; Night Owl and Late Riser wait for round II.
- **Cory (rubric v3):** Crunch Time kept. Head Start likely yes (the Buy twice/Spree ladder). Fast Forward likely yes, but it collides with the strategist's lean for White ("your members work twice"). If White takes it, A's second round II slot falls back to Hold Up (concept B), and Wake Up and Alarm Clock go with it. Catch Up as his own 1/2/3 should land.
- **Risk:** three "take your next turn right away" sources on the board can let one player place all 5 round III minions in a row. That's not stronger than Crunch Time plus ordinary picks, but it's dead air for rivals.
- **Weakest card: Wake Up.** It pays 1 on a first pick in round I. I kept it because it's the round I form of the color's verb, it grows every round, and taking a space you can't use is on the player. Second weakest: Timekeeper (a template every hoard color has). It's kept because it's live and simple.

---

## Concept B: "Own the order"

**Identity in one mechanic:** Purple bends the turn order: pull your turns forward, push a rival's back, and get paid for where you sit in the round. It's interactive where A is an engine.

### Actions (every action +1 purple)
| Ring | Name | Text | Taker walks away with |
|---|---|---|---|
| III | **Crunch Time** (live, +1 added) | Take your next 2 turns right away. +1 purple. | As in A |
| II | **Head Start** | As in A. | As in A |
| II | **Hold Up** | +2 purple, and a rival you choose takes their next turn last this round. +1 purple. | Round II: 3 + a rival's next pick drops to the round's last (about 2–3 lost for them). Round III: 3 + that rival loses an anchor (about 6) |
| I | **Clock In** | +1 purple × round. +1 purple. | 2 / 3 / 4 |
| I | **Catch Up** | As in A (late pays). | 2–4, up to 6 |
| I | **Plan Ahead** (moved to round I) | +1 purple per minion you have left to place this round. +1 purple. | 3 / 2 / 1 in round I (early pays), up to 5 in round III |

- Round I is the clock: early pays (Plan Ahead), late pays (Catch Up), or a flat gain (Clock In). Plan Ahead and Catch Up mirror each other the way Promote and Demote do.
- Round II pulls (Head Start) or pushes (Hold Up). Hold Up's own gain is below Shake Down. Its weight is the rival's lost pick, which counts twice like theft, and in round III it's an anchor denied.

**How it touches other colors:** Hold Up decides who reaches any color's best space, and in round III it can push a rival off the anchor they were waiting for. Crunch Time and Head Start do the same from the other side. The harm is position only (they still place, just last): a mild sting before round III, a sharp one in it.

### Deck (10)
Seven cards as in A: Shift Crew, Timekeeper, Sprinter, Errand Runner, Punch Clock, Late Riser, Night Owl, plus Double Shift at 8. In place of Clockmaker and Alarm Clock:

| Card | Cost | Followers | Text | Why that price |
|---|---|---|---|---|
| Night Watch | 1+2 | 2 | Worth 2. Rivals can't move your turns. | The defense, Loyalists/Agents shape at their price (worth 2, mostly "any") |
| Time Thief | 3+2 | 2 | When recruited: a rival you choose takes their next turn last this round. | Hold Up on a card, the mirror of Errand Runner. 2–6 relative, plus 2 bodies: about 1.2 |

Prices run 2, 3, 3, 4, 4, 4, 5, 6, 8, 10, with 16 followers.

### Self-critique (B)
- **Specialist:** reads the turn rail all game, and denies more than it builds. Round III is Crunch Time or Hold Up on the rival who's about to take an anchor.
- **Rival:** gets pushed around. It's fun when it's mild, but two order-movers plus Crunch Time is a lot of "wait, why is it their turn?" (#99, three times over).
- **At 2 players:** Hold Up on the only rival works like a jump for you. Fine.
- **Cory (rubric v3):** it's interaction he says he wants, but it sits near the out-of-turn tag (4 no's) by association, even though nobody places out of turn. Hold Up's own gain fails the round II walk-away next to Shake Down, so he may say "weak" or "confusing". I'd put it near 50/50.
- **Weakest card: Night Watch.** It only matters at a table with Hold Up or Time Thief in play, which is half its own deck. I kept it because a color with a sting needs its Loyalists.

---

## Recommendation

**Concept A.** It keeps Crunch Time as the burst. Its round II spaces pass the round II bar: Fast Forward changes what you own, and Head Start is the Buy twice-to-Spree ladder he already approved. It fixes the three things he named: Catch Up becomes his own 1/2/3 version, nothing charges you, and nothing adds a placement in round I.
If White claims "members fire again", swap in Hold Up for Fast Forward and drop Wake Up and Alarm Clock. That hybrid is the fallback.

---

## Rubric v3 pass on the survivors (short)
- **Crunch Time:** passes all. A relative burst; the trailer takes it first.
- **Head Start:** hard nos clear. Its walk-away (5 + a turn moved up, early) sits next to Promote and Shake Down. Its sibling is in another ring. It scales with minions per round. Predict yes, with his number.
- **Fast Forward:** clear on walk-away and breadth. The risk is the trigger count with a heavy income cult (rule 9). Predict yes, with a White collision note.
- **Wake Up:** light in round I but grows (rule 5). Predict "fine" or "weak in round I".
- **Clock In 2/3/4:** his own round I template. Predict yes.
- **Catch Up as 1/2/3:** his own idea. Predict yes.
- **Hold Up:** predict 50/50 (rules 1 and 8).
- **Errand Runner, Alarm Clock:** the color's action on arrival, Stunt Double's shape ("one-time activate. Elegant."). Predict yes.
- **Sprinter:** simple, on the snake. Predict yes, with a 2-player price note.
- **Double Shift:** a standing rule. Predict yes or "price it up".
- **Punch Clock:** catch-up keyed to visible state (rule 17). Predict yes.
- **Night Watch:** fine but narrow.

---

## Appendix: seeds (written before developing any)
1. **Crunch Time kept** (tempo). Survived: it's the anchor (section 0).
2. **Fast Forward**, round-start effects now (holding vs spending, working your members). Survived: A.
3. **Head Start**, a turn moved up plus an early-pick gain (tempo). Survived: A and B. The bare form ("take your next turn right away, +1") was cut: a placement for a better next pick nets about 0 before round III, which is Overtime's flaw.
4. **Hold Up**, push a rival's next turn to the round's end (interaction with rivals). Survived: B.
5. **Recall**, move up to 2 of your placed minions to open spaces and do them (space). Cut: it's Straggler's shape (a variation of a guest he loves), and two actions with no placement cost in round III.
6. **Bank a minion**, carry one into next round (holding vs spending). Cut: a placement now for one later nets about 0; it becomes Extra Hand in round III, and it "remembers last round".
7. **Time's Up**, end the round now and unplaced minions are lost (tempo). Cut: crazy-bad harm.
8. **First pick next round**, a token (tempo). Cut: the leader takes it to undo the catch-up order (win-more), and it duplicates the Front-runner guest.
9. **Buy now, skip your next buy** (the shop). Cut: buy count is Blue's, and resources bind in round II, so it's worth about 0.
10. **Hold that member**, so only you can buy it on your next turn (the shop). Cut: it's Claim, already ❌ "promote and ransom are just straight up way better".
11. **Interest**, +1 purple per 3 resources held (holding vs spending). Cut: it's the strategist's Gold spine, and Clockmaker already holds it on a card.
12. **Catch Up per rival with more followers** (catch-up). Cut: the same card as White's live Sob Story. Its catch-up lives on Punch Clock instead, as round-start income.
13. **Free extra-turn space** (Overtime free). Cut: ❌ "overtime fucking SUCKS", a minion for a minion.
14. **"What if Purple didn't exist?"** The table would lose the only lever on *when* spaces get taken. Every other color is about what you get. That's the thesis of both concepts.
15. **Swap places in the turn order with a rival** (rivals). Cut: hard to show; Hold Up is the simpler form.
