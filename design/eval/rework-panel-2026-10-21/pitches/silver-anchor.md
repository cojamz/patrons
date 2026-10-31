# Silver, anchor seat (round III first, work backward)

**All card texts and numbers are Claude's fill-ins, not approved.**

Panel designer, 2026-10-21 overnight. Scope: Silver actions and members. Read: brief, strategy-read, member-shape, pricing, deck-visibility, cory-judge (rubric v3), strategy.md, pitch-ledger.md, silver.js, spheres/silver.md, decisions.md, todo.md (Cory's Oct 16–17 Silver notes). No sims, no games, no code.

## What Cory has said about Silver (the ground this stands on)

- Rising Tide ("Everyone else +2 silver. Then gain half the silver of the rival with the most"): "I like this one a lot". He raised its gift to 2.
- "Silver puts the game on steroids, needs some counterweight." "Silver is pretty close." "Silver round 2 actions need work."
- Sweet Talk: "awkward: something completely different." Hold Court: "he doesn't like it; reads like a member ability", "a little out of whack." Goody Bags: "a better Toast and a better Good Deed: needs something more clever."
- Kickback (a gift to one rival) is "too close to Silver's theme": giving is Silver's.
- His own Silver notes (todo.md, Oct 16): **"Silver members play on everyone having lots of silver… Silver's round III action is bad; tie it to that theme."** **"Silver rounds II–III reward getting RID of silver members (discard one for lots of resources or followers)."** **"Patron Saint is perfect for silver… 1 follower per silver member in play."** Retinue: "needs to be more members. More followers."
- Toast's gift "grows 1, 2, 3 by round… in proportion with its own gain."

Read together, Cory's own Silver is: **everyone at the table ends up with silver, the Silver player gets paid for that, and Silver lets you hand things away for value.** The steroids came from flat gains (Toast 3/6/9, +4s) on top of the spills. Under the +1 economy most of that goes away by itself; the rest of the counterweight should be built into the gift.

Live rule that matters for giving members (core.js `memberAcquired`): "A gift or a replacement sent into a rival's cult is an arrival, not a Recruit." A member you give a rival does **not** fire its On Recruit for them. That keeps giving simple.

---

## Concept A: The Tide (recommended)

**Identity in one mechanic:** Silver gives first, then gains by reading what the richest rival holds. It never takes: every rival keeps everything, and Silver's gain is new silver sized off a rival's pile. Red moves members, Green copies, Magenta takes (rivals lose), Blue works the shop and the number of buys. Silver makes rivals richer and gets paid for it.

**The counterweight is the contest.** Every Silver space puts silver in rivals' hands, and silver held at round end scores Silver's contest. So rivals who hold silver to fight you for the contest are exactly what your Tide harvests, and rivals who spend it to starve you hand you the contest. Holding vs spending, for the rivals too.

### Round III (built first): High Tide
"Everyone else +3 silver. Then gain as much silver as the rival with the most. +1 silver."

- The ladder from Rising Tide is the one Cory used for Red (Open Door "the cheapest" to Recruit a Member "any"): half the richest rival's pile becomes all of it, and the gift grows 2 to 3 (his 1/2/3 rule for Toast).
- Walk-away: the richest rival in round III holds about 3–7 (more if they're fighting for the contest). +3 makes 6–10, so the taker gains **7–11 silver**, and almost always now leads silver for the round III prize of 6. In band (8–12) with the contest on top.
- Each rival gets 3, so against each rival the taker nets about +4 to +8.
- **Everyone wants it, not just the specialist.** A trailer picking first in round III reads the Silver player's own pile: the bigger your hoard, the better High Tide is for a rival. A copier copying it reads their own richest rival, usually the Silver player. Round III anchors must be wanted by more than the specialist; this one is.

### Round II (×2): the bridge
1. **Rising Tide** (kept): "Everyone else +2 silver. Then gain half the silver of the rival with the most (rounded up). +1 silver."
   - Walk-away: richest rival holds 2–5, +2 makes 4–7, half is 2–4, so **3–5 silver**. Crime Wave's level (half a stack, +1). It's a resource swing, not an ownership change, and it stays because Cory loves it.
2. **Regift** (new, built on his "reward getting RID of silver members"): "Give a rival one of your members. Gain silver equal to its cost, up to 6. +1 silver."
   - Changes what you own (and what a rival owns): passes the round II bar next to Promote and Shake Down.
   - Walk-away: a typical member you hold in round II costs 4–6 and is worth 1. You gain its cost plus 1 and lose 1 follower: **net +4 to +6**. A plain body worth its cost nets only the +1, so you give away members whose job is done: a round-start earner late in the game, a used On Recruit.
   - The rival gets a body and the card's ongoing effect (no On Recruit, by the live rule). Who you give it to is the choice: the trailer, a rival whose "fewer members" scorer it breaks, someone it doesn't help.
   - The cap of 6 is there because Cory called a cash-in "way too strong… like +10 blue in round 2". With the cap, round II tops out near Shake Down.
   - Not Release: the member stays in play, goes to a rival, and the pile is never touched. Flagged in the critique anyway.

### Round I (×3): equal gain, different spill
All three give the taker **2 / 3 / 4** by round (Gather's curve), so each is still worth taking in round III.
1. **Toast**: "+1 silver × round. Everyone else +1 silver. +1 silver." Spill: a little silver to every rival (it seeds the Tides and the silver contest).
2. **Good Deed**: "+1 silver × round, and a rival you choose gets 2 of a color you choose. +1 silver." Spill: aimed. Hand second place 2 of a color to break a leader's contest, or fatten the pile your Tide will read. In round III that's a swing on a 6-follower prize.
3. **Warm Welcome**: "Gain 1 follower × round. A rival you choose gains 1 follower. +1 silver." Spill: followers, which feed no contest. You skip the buy, which matters most in round III when the buy binds.

Goody Bags, Sweet Talk and Hold Court go, as Cory asked. Toast's old 3/6/9 is the steroids, and it goes too.

### Arithmetic (4 players; R = richest rival's silver before the action)

| Space | Round I | Round II | Round III | To rivals |
|---|---|---|---|---|
| Toast | 2 | 3 | 4 | +1 each |
| Good Deed | 2 | 3 | 4 | +2 of a color, one rival |
| Warm Welcome | 1 follower + 1 | 2 followers + 1 | 3 followers + 1 | +1 follower, one rival |
| Rising Tide | n/a | 3–5 | 4–6 | +2 each |
| Regift | n/a | net +4 to +6 | net +4 to +6 | one rival gets the card |
| High Tide | n/a | n/a | 7–11, plus likely the silver contest | +3 each |

**Contest:** most silver held (unchanged).

**At 2 and 4 players:** a gift to "everyone else" costs the same against each rival at any table size (you +X, each rival +1), so the relative edge doesn't shrink at 2. What shrinks is "the rival with the most", which is a max over 1 rival instead of 3: both Tides run about 1–2 lower at 2 players. Silver isn't on the Classic tables.

**How it touches other colors through the board:** gifts hand rivals resources (followers at par for them) and a stake in Silver's contest. Good Deed's color gift can flip any color's contest. A big silver pile is a target three ways: High Tide, a copied Tide, and half-a-stack theft. "Can't be stolen" protection doesn't stop a Tide, since nothing is taken. Regift puts members into rivals' cults, which moves member counts and member-count scorers. Members that can't be swapped are unaffected, since a gift is not a swap.

### Deck (10 dealt)
Shape from member-shape.md: a cheap body, multi-bodies, two income cards (one growing), the action on arrival, one that plays off rivals, a scorer, a splash card, a capstone. Cost is silver + any.

| # | Name | Text | Cost | Worth | Why this price |
|---|---|---|---|---|---|
| 1 | Gossips | Worth 2 followers. | 1+1 | 2 | Plain body at f = C, Twins' rate. The round I filler, a good cheapest-member pick. (Cory's own "Gossips" idea.) |
| 2 | Retinue (kept, more) | Worth 4 followers. When recruited, everyone else +1 silver. | 2+1 | 4 | Cory: "more members, more followers." f = C+1 is the most a ≤5 card can carry before ransom becomes the best follower source. The gift pays for the extra one. |
| 3 | Benefactor (kept) | Now and at round start, +3 silver, and a rival you pick gets 1 silver. | 4+2 | 1 | Flat income ≈3 a round: the 2X rule says 6. Live price, already right. |
| 4 | Hostess | Now and at round start, +1 silver per silver member in play, anyone's. | 3+2 | 1 | The growing earner. 1–2 silver members in play early, 3–4 late: about 7 over a game bought in round I, ratio 1.4. Priced for 3–5 in play, per deck-visibility. |
| 5 | Regifter | Worth 2. When recruited: give a rival another of your members; gain silver equal to its cost (up to 6). | 4+2 | 2 | Regift on arrival, Panel's shape. A round II job (about 5) plus 2 bodies, against 6: ratio about 1.25. |
| 6 | Chaperone | Worth 2. Your gifts to everyone else skip the player with the most followers. | 2+2 | 2 | Plays off rivals. A standing rule on your own verb, keyed to visible state (catch-up, never win-more). Saves about a third of your spill at 4 players. |
| 7 | Guest (kept, cheaper, clarified) | Whenever a rival gives you resources, +1 more of that color. | 1+4 | 1 | The counter for rivals of a Silver player. Splash: a silver part of 1 so anyone can take it in round I. About 5–7 over a game at a table with a Silver player. Live 4+4 is too dear. |
| 8 | Patron Saint (Cory's version) | Game end: +1 follower per silver member in play, anyone's. | 2+3 | 1 | His own wording. About 4–6 in play at 4 players, so par at 5, and mostly "any" so other builds splash it. Watch it at 2 players, where silver is 37% of the deck. |
| 9 | Caterer | Whenever you give a rival something, +1 follower (once per space). | 3+2 | 1 | Impressionist's shape (own turn, on the verb, which he called "great"). A host gives about 4–6 times a game, ratio about 1.3. |
| 10 | Debutante (reworded capstone) | Worth 2. Once per game: everyone else +3 silver, then gain as much silver as the richest rival. | 6+4 | 2 | The color's burst on a card, like Tribute Band. About 9 silver plus the contest in round III, plus 2 bodies, against 10: about 1.2. |

Cut from the live ten: Majordomo and Toastmaster (three "when you take a Silver space" cards were slight variations), Grand Host (8+4 is over the ceiling, and doubling Regift makes a refund loop), Heir ("too expensive", dead late), Upstart (a one-shot sized off a rival's pile, Lottery Winner's feel; its rule lives on in the spaces), Revelers (Retinue now carries the bodies), and Debutante's old "double your silver" (doubling is Gold's).

### Self-critique (A)
- **Specialist:** round I Toast/Good Deed to seed rivals; round II Rising Tide or Regift a spent Benefactor; round III High Tide, then a 10-pack. Readable plan, two decisions a turn: who to feed, and what to give away.
- **Rival:** gets small gifts all game, and decides whether to hold silver for the contest (feeding the Tide) or spend it. Any rival can take High Tide off the Silver player's pile, which is the counterplay.
- **Newcomer:** "everyone else gets some, then I get the richest one's amount" reads in one pass. Regift needs one sentence ("you give the card away and get its cost").
- **2 vs 4 players:** relative edge unchanged; the Tides run a little lower at 2.
- **Cory, honestly (rubric v3):** keeps his favorite and builds the burst from it (✓ items 1, 2, 5). He may say High Tide is "just Rising Tide bigger" (item 6, sibling). Regift is the swing item: it's his own idea, but it may read as Release ("anything about Release" disliked). Expect "changed": the shape kept, numbers retuned (item 14). Prediction: yes or changed, about 60%.
- **Total resources:** still more than a +1 color: about 3 per rival per Silver-heavy round. Warm Welcome's follower spill and Chaperone are the dials if it still feels pumped.
- **Weakest card:** Chaperone. It's quiet, and some games it saves only 2–3 silver. Kept because it's the one card that aims the spill (catch-up he likes), and it's cheap.

---

## Concept B: The Pot (Silver's version)

Gold-outsider pitches a pot for Gold tonight ("The Jackpot"). I reached the same shape on my own, and I think it's Silver's: a pot is generosity to the table, Cory's Silver theme, not a hoard. If the panel likes a pot, it should live in one color, and here's the Silver version, which is different in one way. **Silver's spill goes into the middle instead of into rivals' piles.** That's the counterweight in its plainest form: the gift stops feeding everyone's buys every turn, and lands once, on whoever times it.

**Identity in one mechanic:** Silver spaces feed a shared pot on the wheel's hub (bank silver; nobody pays to use a space). Other Silver spaces skim it, spend it on a member, or take it all. The pot carries between rounds, and whatever's left at game end is lost. On a real table it's coins in the middle; on screen it's a number on the hub.

### Round III: Last Call
"Put 5 silver in the pot, then take it all. +1 silver."
- The trailer picks first in round III, so it usually goes early, with 2–5 carried over: **8–11**. Taken late, after round III's feeders, it reaches about 15. Taking it now or letting it grow is the turn's decision. The +5 is the floor that keeps it a burst when it goes first.

### Round II
1. **Rising Tide** (kept; it reads rivals, not the pot).
2. **Sponsor**: "Recruit a shop member; the pot pays its cost, as far as it goes. +1 silver." An extra recruit, not your buy. Changes what you own. Walk-away: the pot at 3–8 pays for a member, so **4–8**. Leaving the pot empty is a sting for the next taker.

### Round I
1. **Toast**: "+1 silver × round, and 2 × round into the pot. +1 silver." Taker 2/3/4, pot +2/4/6.
2. **Bake Sale**: "Gain 1 follower × round, and put 2 silver × round in the pot. +1 silver." Taker 2/3/4 (followers), pot +2/4/6.
3. **Skim**: "Take half the pot, rounded up. +1 silver." Round I 1–3, round III 4–7: it grows as the pot does, like Catch Up.

**Contest:** most silver held. The pot is held by nobody, so it never counts.

**Arithmetic, briefly:** the round I pot is about 4, minus a skim. In round II the feeders add about 8, so Skim and Sponsor fight over 5–10. Round III adds about 12 more if Last Call waits. Taker bands: round I 2–3, round II 3–8, round III 8–11 early, up to about 15 late.

**How it touches other colors:** the pot is a shared prize everyone watches. Copying Skim, Sponsor or Last Call drains it for the copier. Theft can't touch it. Taking Last Call first (the trailer) is built-in catch-up.

### Deck (10)
| # | Name | Text | Cost | Worth | Why |
|---|---|---|---|---|---|
| 1 | Gossips | Worth 2 followers. | 1+1 | 2 | Plain body. |
| 2 | Retinue | Worth 4 followers. When recruited, put 3 silver in the pot. | 2+1 | 4 | Cory's "more followers"; the gift goes to the middle. |
| 3 | Caterer | Now and at round start, +2 silver and 1 silver into the pot. | 2+2 | 1 | Flat 2 a round, so 4. |
| 4 | Hostess | Now and at round start, +1 silver per silver member in play, anyone's. | 3+2 | 1 | As in A. |
| 5 | Skimmer | Worth 2. When recruited, take half the pot. | 3+2 | 2 | Skim on arrival plus 2 bodies: about 5. |
| 6 | Steward | Whenever a rival takes from the pot, first take 1 of it. | 2+2 | 1 | A counter tied to the verb (Muse's shape). |
| 7 | Patron Saint | Game end: +1 follower per silver member in play, anyone's. | 2+3 | 1 | As in A. |
| 8 | Free Lunch | You may pay for members with silver from the pot. | 3+5 | 1 | A payment bender any build wants, priced high. It races everyone for the pot. |
| 9 | Toastmaster | Whenever you put silver in the pot, +1 follower. | 3+2 | 1 | Own turn, on the verb. |
| 10 | Grand Host | Worth 2. Once per game: take the pot. | 6+2 | 2 | The capstone you time. About 8–12 late, plus bodies. |

### Self-critique (B)
- **Specialist:** feeds the pot, then has to beat the table to it. The Silver player's edge is thin (Toastmaster, Steward, Free Lunch). Whoever times the pot best wins it, and that's often not the one feeding it.
- **Rival / newcomer:** very clear ("coins in the middle"), and a nice shared watch-point.
- **2 vs 4:** at 2 players the pot is a duel and close to zero-sum. At 4 it's a real race.
- **Cory, honestly:** a new board object comes near "core redesign" (his new base rules usually come from him). A pot is a jackpot, and he disliked Lottery Winner's windfall feel. It drops Rising Tide's harvest as the spine, and the overlap with gold-outsider means one of them must go. Prediction: no or "not now", about 35% yes.
- **Weakest card:** Steward. It's a rival-turn trigger, which he only keeps as a counter he writes himself. Kept as the only defense the feeder has.

---

## Rubric v3 run (survivors)
- Hard nos (10): no space charges, nothing out of turn, no rescue clauses, nothing to remember. Regift asks you to give a member, which is a trade like Even Swap, not a toll. Flag: a "spends to use" reading is possible.
- Walk-away and band (1, 2): A's round I is 2–4, round II 3–6, round III 7–11 plus the contest. B's round III depends on order (8–15).
- Siblings (6): A's High Tide/Rising Tide is a ladder, not a twin (half → all, 2 → 3). A's round I three differ in kind (broad silver, aimed color, followers).
- Scaling (5): every round I space is × round, and both Tides read live piles. Echo's bar is met by reading, not copying.
- Different cults (16): A supports a generous host (Caterer, Chaperone), a member-shedder (Regift, Regifter, with lean scorers from other decks), and a body build (Retinue 4, Gossips 2). Patron Saint and Hostess pay for silver members in everyone's cult, which is Cory's "everyone having lots of silver".
- Taste (20): every precedent above is his quote, not a Claude audit.

## Recommendation
A, the Tide. It builds the burst from the one Silver card Cory loves, uses three of his own Silver notes (everyone holds silver, get rid of members, Patron Saint), and puts the counterweight in the contest instead of in a rule.
B is the same counterweight done with a pot. Better to settle it against gold-outsider's Jackpot than to send both to Cory.
If Cory balks at Regift, the fallback is to keep Rising Tide as round II's only gain and add a member-based second space later. Don't revive Sweet Talk.

---

## Appendix: seeds (went wide first; one line each, and why cut)
1. **Tide**: give, then gain off the richest rival's pile (interaction). Developed as A.
2. **Pot**: Silver's spill goes to a shared pot (holding vs spending, space). Developed as B; overlaps gold-outsider.
3. **Regift members** (shop and members; Cory's "get rid of silver members"): too narrow for a whole color (round I players own 0–1 members). Folded into A's round II and Regifter.
4. **Silver members everywhere** (spaces count silver members in play): cut as spaces, because counting reads "like a member ability" (his Hold Court note). Folded into the deck (Hostess, Patron Saint).
5. **Sponsor an empty space** (put silver on a space as a lure; space): cut. The Patronage sphere that carried it was rejected ("bad ideas"), and round I fills exactly, so lures only reorder the draft.
6. **The host picks turn order** (tempo): Purple's ground, and Front-runner already bends first pick.
7. **Contest judge** (Silver counts toward another color's contest, or wins ties): hard to show which pile counts where, and Cory dropped tiebreakers ("ties all score"). Two other seats work contests tonight.
8. **Silver as wild payment** (pay colored parts with silver): Freelancer already does it with any colors, so it's redundant.
9. **Followers to everyone, more to you per rival**: zero edge at 2 players, and it counts rivals. Strategist's "don't".
10. **Partners** (every space is a deal with one chosen rival; Kickback is "Silver's theme"): it's Kickback, a live card in another color, as a whole identity. Its round III collapsed into A's High Tide. Raise it with the Gold seat: if Gold drops Kickback, Good Deed takes the aimed slot.
11. **Most given wins** (contest on generosity): needs counting gifts over a round, which is hidden tracking.
12. **What if Silver didn't exist?** The table would lose the only color that makes rivals better off: a reason to feed the trailer and a soft check on the leader. That became Good Deed's aimed gift and Chaperone.
13. **Spend-reward** ("gain silver equal to the cost of the member you buy"): a refund, which is a cost reduction in all but name (dropped Oct 18).
