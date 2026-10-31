# Cory's first play (2026-10-14): diagnoses and solves

Each note gets an agent that plays it, writes its own diagnosis, weighs options and ships a fix for Cory to judge by playing. One section per note; each agent appends to its own section only.
Format per section: what Cory saw · diagnosis (root cause, not symptom) · the agent's own feedback (agree/disagree, what else it found) · options considered · what shipped and how it was measured.

## 1. Purple: Linger is bad, Rally wastes a worker, "most workers" always ties, purple dead at end of round III (Purple agent)
*Purple agent. I played Purple myself, driving one seat from a script and reading the log, in four games: one on today's rules (gold/red/purple/magenta), one on my first proposal, and two on the shipped rework (gold/red/purple/magenta and gold/purple/green/yellow). On top of that I ran bot sims, and each number names its instrument.*

**What Cory saw.**
- Linger is "just bad".
- Rally "makes no sense, basically wasting a worker", and Overtime has the same problem.
- "Most workers on the board" almost always ties, so it's really "most purple".
- Clockmaker costs too much, and purple is worth nothing at the end of round III.

**Diagnosis (root causes).**
- **A turn-for-a-turn space is a wasted worker.** An extra turn here is one more placement plus one more buy. A space whose only effect is "take an extra turn" hands back exactly the placement it used, so the net gain is one buy, minus the purple paid. That's Rally, and it's Overtime. The old sims hid it because the players who could pay were the purple-rich ones, so taker win rates looked healthy (Overtime 30%, Easy bots, today's rules, 300 random tables). Rally's takers won 21%, the lowest on the board.
- **Linger is less than nothing.** Moving a worker to an open space and doing that action is the same as placing on that space. On top of that you've given up Linger itself and reopened your old space for a rival. It also does nothing when all your workers are on Purple, which happened to me in my first game ("Me has no worker to move").
- **"Most workers" can't break ties.** Every player gets the same 3/4/5 workers, and at 4 players every round-I space fills. The spare-space rule then makes extra turns impossible in round I. So the tiebreak (most purple) was the real rule. Easy bots, today's rules: round I never had a unique leader on workers. With "ties score nothing", Purple's ring paid nobody in 100% of round Is, 77% of round IIs and 60% of round IIIs.
- **Dead purple.** Round-end payouts land after the last buy. Clockmaker was already fixed; Bookkeeper had the same problem.
- **Bot blind spot (new).** The normal bot (the default opponent) scores a placement by trying it on a copy of the game whose turn queue is empty, so it can't see an extra turn. Probe, round III, a normal bot holding 10 purple: Rally scored −9.6 and Overtime −8.7, both below Hourly at −1.5. So bots never took a turn from a space; they used Rally and Overtime only for the fallback purple. That's what Cory played against. After my report, bots.js now counts the turns a move queues (committed 2026-10-14 as "bots value extra turns").

**My feedback.**
- I agree with all four notes, and the first two are one bug: a turn that costs a turn.
- I also disagree with my own earlier gut call. "Ties score nothing" doesn't fix the contest. It switches round I off at 4 players and pays only whoever bought turns, which snowballs.
- The design critic said the same, and I took its fix: name the rule for what it already measured, most purple. That's simple and visible. It turns Overtime and Rally into a spend-or-hold choice, and it gives purple left at the end of round III a use (+6).
- Also found:
  - Normal bots ignore Purple's tempo (above).
  - Overseer, Foreman, Courier and Apprentice fire once per extra turn, so multi-turn spaces fire them 2–3 times. Priced below.
  - Plan Ahead is a juicy chip for Echo. A copy gives the taker's printed gain, which is +6 or +8 when it's taken first in a round. One of my games saw it copied four times. If that feels off, look at Echo's copy rule.
  - A crash outside Purple: Straggler (benders.js:75) is handed a stale joined worker. It crashed the member-value sim, so I reported it.

**Options considered.**
1. Cheaper turns (Rally 3, Overtime 4). Rejected: it's still a worker for a worker, so the feel doesn't change.
2. A free extra turn plus a payout (e.g. "+3 purple and an extra turn"). Rejected: a free turn is worth a whole space plus a buy, it's too strong, and purple loses its sink.
3. Spaces that bend timing without adding workers: Sleep In ("+2 per worker left, your turns go last"; precedent: Lords of Waterdeep's Harbor) and Hurry ("+3, place your next worker now"). The foreman, reading as Cory, called Sleep In fiddly timing, and the critic cut Hurry. Plan Ahead keeps Sleep In's payout without the delay.
4. Shipped: two-for-one Overtime, all-in Rally, Plan Ahead, most purple, Bookkeeper on your last placement.
5. Bolder: purple as time itself. On a Purple table, anyone may pay 5 purple in a buy step for an extra turn, and every Purple space just gathers. It's cleanest for identity, but it needs a core hook for buy options, so it's parked for Cory. The critic's note for later: if turn chains still feel bad, the precedent is permanent workers (Agricola's family growth), but don't pair that with a most-workers ring.
6. Other scoring rules measured: ties go to fewer followers (a catch-up ring, not Purple's identity), and most workers on Purple's spaces.

**Shipped and measured** (code: content/purple.js; tests: spheres/purple.test.js, cards-purple.test.js and the Purple cases in interactions.test.js). Main instrument: easy bots, 300 games each at 4 players, on seeded random tables of Purple plus three other spheres. "Takers" means players who took that space at least once; 25% is par.
1. **Ring: "Most purple"** (ties all score).
   - Today it was most purple in all but name.
   - "Ties score nothing" on the new spaces paid nobody in 100% / 69% / 40% of rounds I / II / III.
   - "Most purple" paid nobody in 7% / 9% / 15% (no one held purple).
2. **Plan Ahead** replaces Linger: "+2 purple per worker you have left to place this round." Takers won 27% (Linger 30%, but Linger was taken every round as filler).
3. **Overtime:** "Pay 8 purple: take 2 extra turns right after this one. If you can't, +3 purple." Takers won 26% at 8 and 29% at 6. Kept at 8, which is 4 a turn, the same rate as Rally.
4. **Rally:** "Spend all your purple: 1 extra turn right after this one per 4 spent, plus 1 (up to 3). With less than 4, +4 purple."
   - Takers won 37%, against Strike 33%, Jubilee 37%, Boom 39% and Eternity 37%. Today's Rally was 21%.
   - The critic's version without the "plus 1" came out at 28%. But at 4–7 purple it buys one worker for one, which is Cory's complaint, so I kept the plus 1.
   - Double Time makes it 1 per 2.
5. **Bookkeeper:** "When you place your last worker of a round, +1 purple per 2 workers you have on the board."
   - It pays before that turn's buy, so round III's purple isn't dead.
   - The critic's "+1 per worker" version measured 8.4 followers and a 57% win rate. Purple landing just before round end decides the ring.
   - Halved, it measured 5.0 and 44%, and the cost stays 6. Instrument: the member-value sim, Easy bots, 160 games; Banker read 3.0 in the same run.
- Whole table: 3.2 extra turns a game (0.96 today). Wins by seat 28/25/26/21%. Followers 37.3 (37.1). The player who placed most on Purple won 31% (28%).
- Dead air: one player places 4+ times in a row in 57% of games (3% today). The longest run averages 3.6 (2.35). That's the burst; it's the thing to feel for when playing.
- Normal bots, after the extra-turn fix: 1.3 extra turns a game against 0.5 before, and Purple's share of placements 26% against 22% (30 games each, too few for win rates).
- Members (member-value sim, Easy bots, handed over at the start of round II, 160 games each, ±1.5; Banker, cost 4, reads 2.7):
  - The per-turn triggers now fire 2–3 times a turn: Apprentice (cost 4) 4.4, Taskmaster (8) 4.2, Overseer (6) 2.9, Foreman (6) 2.8, Courier (6) 2.2, Double Time (8) 2.1.
  - By Banker's yardstick, Apprentice looks cheap and Double Time looks dear. That's one noisy run, so I handed it to the fair-price screen (section 4) instead of repricing here.

## 2. White: Pawn can't sell in round I, Cash In vs Magnate redundant, Cash In too strong (White agent)
*White agent. I played three games driving one seat from a script and reading the log, all on gold/red/White/green: two on today's rules and one on the rework. Sims ran 4-player games against Normal bots, with the instrument named on each number.*

**What Cory saw.**
- Pawn ("+2 white, and sell up to 1 follower per round number for 2 white each") can't sell anything in round I.
- Cash In ("+1 follower, then trade any of your white for followers, 1 for 1") and Magnate ("Game end: +1 follower per 3 white") seem redundant.
- Cash In may be too strong.

**Diagnosis (root causes).**
- **The market moved under White.** White was tuned on the old ladder, where buys needed several colors and the best rate was 6 for 6. There, "1 for 1" was a premium and a sale at 2–3 white was fair. Today buys take any resources and 10→10 exists, so a follower costs 1.33 resources (4→3) or 1 (10→10). That made Cash In's uncapped 1 for 1 the back half of a loop: sell for 3, cash back in at par. It's as good as the top tier, with no stock limit and no buy step.
- **Pawn's dead half.** "Only loose followers sell" (Cory's ruling) meets round I, where nobody has loose followers yet. Pawn in round I is never better than Haggle: both give +2 white, and Haggle adds 1 per player ahead of you.
- **The redundancy.** Cash In and Magnate both turn white into followers. Cash In does it sooner, at three times Magnate's rate, with no cap. With Cash In on the board, Magnate never mattered.

**My own feedback.** I agree with all three notes. What else I found:
- **The loop is real for a person, though bots miss it.**
  - Game 1 (first hand-played game): I sold every loose follower (Pawn, Sell High, and a Liquidator I bought, used and released). I turned the white into two 10→10 buys.
  - Game 2 (replayed after the shop went to 10): my seat took 3 of the 4 10→10 buys in round II. The stock ran out and the game ended after round II. I won 35–25 with 0 members.
  - A scripted seller seat (sells every loose follower, never recruits, buys back big) wins only 6.8% [5–10] (n=400 games). The skill is in the timing.
- **Release makes once-per-game members free.** It refunds a member's full price after you've used it, so the Liquidator cost me nothing. That's Release's problem, not White's. Flagged in decisions.md.
- **White doesn't make "just buy followers" easier for bots.** The pure follower buyer against 3 Normal bots, 400 games per table: 7.5% [5–10] on the White table, against 11.6% [9–15] on the stand-in table. White's 1-for-1 conversions are about 9% of a bot's followers. Buy Low and Boom are capped by round, or by being a single space.
- **Selling does pay off for bots today.** Bots that sell win 27%, and bots that don't win 20% (200 games). So the rework must not kill the sell verbs.

**Options considered.**
1. **Cap Cash In** at 2 white per round number and keep Magnate. Fixes the strength, not the redundancy.
2. **One sale price of 2 white everywhere** (the design-critic's pick). It closes any loop at the price, but selling stops paying: sellers 30% vs non-sellers 33%. Cory asked for sells that pay off.
3. **Replace Cash In with Barter** (chosen). Followers pay for members, so selling pays off in members, an engine, not in more followers. Magnate becomes White's only white→followers card.
4. **Bolder, a pawn pile** (from the critic). Sold followers sit visibly on your board. You buy them back any time for 3 white each, and whatever's left at game end is lost. It closes the loop by itself and makes buying back a real choice. It needs a new pile and UI.
5. **Boldest, a moving price** (like Power Grid's market). Each sale this round drops White's sale price by 1, so the market itself stops a loop.
6. **Scoring "fewest followers (need 1 white)"**. Selling becomes a contest play that stacks with fewest-picks-first. Not shipped: it pays the trailing seat twice, and scoring is Cory's call.

**What shipped (Claude, under go-with-your-gut).**
1. **Pawn:** "Per round number: +1 follower or +2 white." You pick the mix. It always pays and has no sale, so Dealer and Reinvestor can't stack on it (the critic's wording).
2. **Barter replaces Cash In:** "Recruit a face-up member, paying 1 follower per 2 of its cost, rounded up (only followers you've won or bought)." It's on top of your buy.
3. **Broker:** pays once per action. It used to pay per resource traded on Buy Low. Cost 2+2 → 2+0.
4. **Dealer:** cost 2+2 → 2+0. Pawn no longer sells, so bots sell half as often.
5. **Kept, measured:** Sell High and Pawnbroker at 3 white per follower; Buy Low, Boom and Magnate unchanged.

**How it measured** (4 players, Normal bots, gold/red/White/green):
- **Pure follower buyer:** 9.4% [7–13] (n=400), against 11.6% on the stand-in table.
- **Scripted seller seat:**
  - with sales at 3: 7.4% [5–10] (n=400), against 6.8% before the rework;
  - with sales at 2: 5.0% [3–8].
- **Do sellers win more?** (the 3 Normal bots beside the scripted seller, n=400)
  - With sales at 3: sellers 35% vs non-sellers 29%.
  - With sales at 2: sellers 30% vs non-sellers 33%. That's why the price stays 3.
- **Normal bots (n=200), before → after:**
  - members per player: 5.3 → 5.6;
  - followers per player: 46.0 → 47.2;
  - followers sold per game: 9.2 → 4.5;
  - Barter: taken about once a game, about 3 followers paid.
- **10→10 sold out before round III** (scripted-seller runs, n=400): 18 games before, 15 after, 7 with sales at 2.
- **Member value** (member handed over at round II, 160 games, old → new):
  - Broker 3.5 → 0.6 (hence 2+0);
  - Dealer 6.2 → 2.1 (hence 2+0);
  - after the rework: Magnate 5.0, Liquidator 4.1, Reinvestor 2.6, Pawnbroker 2.4, against Shareholder (worth 3) at 2.6.

**Watch.**
- Magnate now fires rarely: Normal bots spend white down, because any follower buy beats 1 per 3. The White fire-audit gate exempts it, and its own card test covers it.
- Barter makes the plain high-follower members good targets: Patron, worth 5, costs 3 followers.
## 3. Green needs tweaking as a whole (Green agent)
*Green agent. I played two full 4-player games by hand, driving one seat against three Normal bots and reading the log and every space's copy chip each turn: gold/red/magenta/green (seed 11) and blue-market/yellow/white/green (seed 23). I also took the copy spaces on the real UI, both the frozen build (5192) and HEAD (5193), at 1270×800. Sims: Normal bots, 300 games per variant. Shipped: echo.js, its tests, design/spheres/echo.md.*

**What Cory saw.** "Green for sure needs some tweaking as a whole." He gave no specifics.

**What I saw.**
- **Round I is one space three times.** Hum gives 3. Chant gives 2. Echo, taken at pick 3 or 4 in both games, copied Hum for 3, because Hum was the best thing on the board. In the sim, Echo yields 2.6 in round I.
- **You can't see what a copy gives before you place.**
  - Hovering Recall or Eternity shows only the rule ("Copy any space taken last round"), and last round's spaces aren't on the board at all.
  - You place first, then get a menu: 11 chips for Recall in game A, and 13 on HEAD in round III.
  - Undo is the only way to peek.
- **Chips mislead.** "Hire Up (P2): +2 red, a member (≤2)" when no face-up member cost 2 or less, so the copy's member was nothing. "Hire (P2): do Hire yourself" sat next to another Hire that read "a member (≤4)".
- **Members pay the wrong people.** B3's Choirmaster earned green three times in game A from copies B3 never noticed. Fan pays when a rival takes the center, which has nothing to do with copying.
- **Most green never belonged to the Green player.**
  - Round I: nobody scored, because the green went into members.
  - Then bots won it with 3 green from Hum, while my copies brought gold and red.
  - In game B I ended with 24 green I couldn't spend (one buy per turn), and Chronicler turned it into +12 followers.
- **Eternity swings.** In game B a bot took it with its first worker of round III for +4 white, which killed my planned ~15. In game A it gave B3 +12 gold (Underdog doubled the copy) and a free member.
- **What worked was always a move I could see coming.**
  - Encore copied Hire Up for a free Double Agent, which I swapped for the leader's Twins.
  - Keepsake copied my Bargain for a second recruit.
  - Recall copied last round's Turnout for +5.

**Diagnosis (root causes).**
1. **Copy hides its value until you've committed.** Four of Green's six spaces mirror the rest of the board, and nothing tells you what the mirror is worth before you place: no preview, menus of 3–13 chips, and Recall needs memory of a board that's gone. That's "what will I get?", and it's most of why Green feels fiddly.
2. **Green has no move of its own early.** In round I the mirror only finds +3s, so Echo, Hum and Chant play as the same space.
3. **The parts point different ways.** Copying hands you gold or red, but the contest counts green. Copy members key on an act that happens once or twice a round, and two of them pay players who aren't playing Green.

**My own feedback.**
- I agree with Cory, and it's legibility and flatness, not balance. Seats are even (23/25/24/28 by round-I pick) and Green earns its share (11% of all followers on its tables).
- Copy is a good worker-placement verb. It's the vulture: wait for a rival's big hit, then take the same haul. But it only works when the target is in plain sight.
- I disagree with the earlier recommendation of a copy pile for scoring. It's a pile you can't spend, and Cory ruled those out for Magenta ("loot must be spendable").

**Options considered.**
1. **Polish only.** Chips on the board (UI) and shorter menus. Cheap, but round I stays flat and Recall still needs memory.
2. **Readable copy (picked).**
   - Every copy target is something you can see. Echo copies a rival's space taken since your last turn: exactly the "Since your turn" line, and the rings in UX mock A.
   - Recall becomes Refrain, which copies your own space from this round.
   - The two members that pay for the wrong reasons get replaced.
3. **Copy pile as the contest.** It ties scoring to copying, but it's an unspendable pile (Cory's Magenta call).
4. **+1 green on every copy,** to tie Most green to copying. Measured: it doesn't (copiers win it 67% vs 65%), and the same winner holds it next round more often (49% vs 42%).
5. **Bold: delayed echoes.** Every Green space pays now and again at the start of next round, shown as echo tokens on your board. It's a time shift, which Cory likes (Investor). But round III's echoes have nowhere to land, so it needs a last-round rule, and it's a new sphere rather than a tweak.
6. **Bold: "Most workers on Green spaces" as the contest.** It's visible, and it makes the quadrant itself contested (blocking). But Purple showed that worker counts tie constantly.

**Shipped** (echo.js and tests, design/spheres/echo.md; the instruments are `scripts/spheres/echo-share.mjs` and `scripts/spheres/echo-value.mjs`):
1. **Echo: "Copy a space a rival took since your last turn (not the center)."**
   - Was: any outer-ring space this round.
   - You see the targets before you place. The menu is 1–3 spaces (up to 6 on the snake's first pick, none on its second), and your own big pick becomes something the next seat can echo.
   - Yield by round: 2.6/4.0/5.3, against 2.6/4.3/6.1 before (Rush 2/4/6).
2. **Refrain replaces Recall: "+2 green, and copy one of your spaces from this round."**
   - Your own workers are on the board, so it needs no memory, and its menu is at most your spaces.
   - Yield 5.9/6.9, against Windfall 4.9/7.7 (Recall was 4.6/4.7).
3. **Understudy replaces Choirmaster: "When recruited: copy a space a rival took since your last turn."** Cost 4+2. Member value +3.1 followers.
4. **Ensemble replaces Fan: "Game end: +1 follower per green member."** Priced 2+2 from its measured +1.7.
5. **Honest chips.** A copied free member that nothing face up can match now reads "a member (≤2; none face up)".

Before → after, on the same seeds (Normal bots, 300 games, half on gold/red/blue/green and half on magenta/blue-market/yellow/green):
- Wins by round-I pick: 23/25/24/28 → 23/24/23/31 (each ±2.6).
- Placements on Green: 28% → 29%. Green's share of all followers: 11% → 11%.
- Most green: shared 30% → 29%; to last place 56% → 55%; same winner next round 42% → 42%.

**Critic pass.** The design-critic agent couldn't be started in this run (no agent tool), so this is my own pass against its brief. Treat it as a self-check, not a critic's verdict.
- **Verdict:** ship. The rework trades a little late-round power for a lot of readability, and it adds interaction through the board.
- **Tension:** every juicy pick now feeds the next seat. This is Puerto Rico's role choice: you pick what helps you more than the follower.
- **Cost to learn:** "since your last turn" is a time window, and it's empty on the snake's second pick. New players will misread it unless the UI lights Echo's eligible spaces (they are mock A's rings).
- **Analysis paralysis:** gone from Echo and Refrain. It stays on Encore, which can offer about 9 spaces late.
- **Release exploit:** Understudy joins Keepsake and Mirror as one-shot cards. Under Cory's later ruling (Release refunds the colored part only), buy, copy, release now costs the "any" part, so it's no longer free.
- **Simplest version that keeps the good part:** a single target ("the last space a rival took"). I kept up to 3 because a single target goes dead whenever the last rival took an echo or the center.

**Watch when Cory plays.**
- Does reading "Since your turn" before taking Echo feel natural?
- Does Most green still feel like it belongs to whoever sat on green? It's unchanged: to last place 55%.
- Does Chronicler need a cap? It's the only green sink.

## 4. Members miscosted: Feast Hall weak, Shift Crew and Clockmaker too expensive (fair-price screen + dead-window audit)

### Dead-window audit (every space and member)
*Dead-window agent. I read every card against core.js's timing: round-start hooks, "now" on recruit, onRoundEnd before contests, game end after round III, and the spare-space rule for extra turns. Then I measured with a scratch scan built on fire-audit-runner.js's pattern (it isn't in the repo). It wraps every member hook and records what each one gave its owner, by round. It also records what each recruit produced for the rest of the game, by the round it was recruited, and what landed after the owner's last buy. At every placement decision it checks each open space against the space's own estimate; "dead when offered" means an estimate below 0.5 for the player deciding. Two runs, both with mixed normal/easy bots, 4 seats (every 5th game 3 seats), random real tables plus the classic table every 8th game, and a shop of 10. The first was 360 games, before the reworks and the "now" flag. The second was 100 games on the current tree. Units below are resources + 1.5 per follower + 0.8 per point of discount.*

**What Cory saw.** Clockmaker paid purple when it was worthless, Pawn's sale couldn't happen in round I, and Feast Hall felt weak.

**Diagnosis.** Most dead windows aren't "income after the last buy". Member income landing after the owner's last buy, in a color nothing counts, came to only 0.1–0.4 units per game across all players. Clockmaker was the big case, and it's fixed. The real dead windows come from three other sources:
1. **Round-start cards recruited in round III are blanks.** Bots recruit Planner, Underbidder and Cutpurse more in round III than in any other round, and get 0 every time.
2. **Spaces whose verb finds nothing.** Prism is dead in 80% of the times it's offered.
3. **One-shots that scale from zero.** Feast Hall, Seed Money, Grifter and Silver Spoon.

Bots almost never *take* a dead space (they read its estimate), so the cost falls on people. A dead space looks like an open space.

**Ranked, worst first.** Each line: card (sphere, cost): text — the dead window — fix — confidence.
1. **Extra Hand** (guest, Purple lean, 6+4): "+1 worker in round III." — Workers are counted at round start, so recruiting it in round III gives nothing at all. Bots did that in 9 of 31 recruits (45 of 115 in the first run). It's 10 resources for a plain 1★. — Fix: "+1 worker in round III. If you recruit it in round III, take an extra turn right after this one." For the Purple rework agent or the benders owner. — high
2. **Prism** (Yellow space, ring II): "+1 of each other color per 3 yellow you have." — Dead in 76–84% of offers (you hold fewer than 3 yellow), in both rounds II and III. — Fix: "+1 of each other color, plus 1 more of each per 3 yellow you have (you keep the yellow)." — high
3. **Planner, Underbidder, Cutpurse, Mole, Late Bloomer** (Blue/Magenta/Yellow, 2+0 to 2+2): "At round start, …" — Recruited in round III they give 0, 100% of the time. In the current run, round III was their most common recruit round: Planner 11 of 25, Underbidder 12 of 22, Cutpurse 11 of 27. — Fix: give them the "now" flag ("Now and at round start, …"), like the 12 already flagged. The same applies to Safety Net (for the White rework agent), Afterimage (Green) and Late Riser (Purple). — high
4. **Heir** (Silver, 6+2): "At the start of round III, +1 silver per member you have." — Blank if recruited in round III. Recruited earlier, it pays exactly once (4.3–4.7 units). — Fix: "Now and at the start of round III, +1 silver per member you have." Keep the price. — high
5. **Feast Hall** (Silver, 4+2): "When recruited, +2 silver per round number." — Measured 2.0 / 4.0 / 5.8 units by recruit round, for a cost of 6. Pilgrim, the refund baseline, pays 4.0 for a cost of 4 in every round. Feast Hall is below that line in rounds I–II, and its best round is the one with the fewest buys left. Bots recruited it in round I 2 times out of 22. — Fix: "When recruited: +6 silver." Keep 4+2. That's Pilgrim's rate, plus a likely round-I silver lead, which answers "should be better". This assumes systemic rule 8 below; otherwise buy-then-release nets +6 silver for one buy. — high
6. **Social Climber** (Blue, 2+0): "Once per game, at a round start: send a member to the pile; your next member costs that much less." — It never fired in bot play (ledger B: held 36 times, fired 0). It only works at a round start, so it's dead if recruited in round III and has a single chance if recruited in round II. The base Release rule now does the same thing better: once per round, at any buy, for resources instead of a discount. — Fix: "When you release a member, +2 of any color." Keep 2+0. — high
7. **Bloom** (Yellow space, ring I): "+1 of each color you have none of." — Dead when you hold every color: 42% of later round-I offers, 36–48% in round II, 52–59% in round III. Gardener prints the same text (and gives nothing in 11–64% of its round starts). — Fix: "+1 of each color you hold the fewest of (ties all count)". It never gives 0, it still builds sets, and Gardener can take the same text. — high
8. **Turnout** (Red space, ring I): "+1 red per member recruited this round, by anyone." — Dead in 30–36% of first-pass offers every round (no one has recruited yet). Later in the round it's dead in 0–2%. — Fix: add "(at least 2)". — medium-high
9. **Tip-off** (Magenta space, ring I): "Take 1 resource from each player holding more than you." — Dead in 19–45% of offers. On the game's first pass everyone holds 2. — Fix: add "If that's fewer than 2, take the rest from any rivals." — medium-high
10. **Silversmith** (Silver, 4+2): "Whenever an action gains you silver, +1 more." — Not dead, but dominated. Majordomo (same price, "+2 silver per Silver space") measured 4.5 / 5.0 / 1.5 units by recruit round against Silversmith's 2.1 / 1.8 / 0.7, because almost all action silver comes from Silver spaces. — Fix: "Whenever a rival takes a Silver space, +1 silver." Price 2+2. It rewards *not* hosting. — medium
11. **Grifter** (Magenta, 4+2): "When recruited: take 1 resource per 2 members you have." — Its own count includes itself, so recruited as your first member it takes 0. Measured 0.7–1.0 / 1.3–1.8 / 2.8 units by round, for a cost of 6. — Fix: "…take 1 resource per member you have (up to 4)…". — medium
12. **Flourish** (Yellow space, ring III): "+1 of each other color per full set you hold." — Dead in 39–46% of offers (no full set). — Fix: "+1 of each other color, plus 1 more of each per full set you hold." — medium
13. **Accomplice** (Magenta, 4+4): "When recruited: take 1 resource from each rival." — 2.7–2.8 units at 4 players, for a cost of 8, and just 1 resource at 2 players. — Fix: price 2+2, or "take 1 from each rival and 1 more from the one holding the most" at 4+2. — medium
14. **Sower** (Yellow, 2+2): "Round start: plant yellow. Round end: gain that many of each other color." — It's near-dead in bot play: 0–1.0 / 0.4–1.6 / 0 units by recruit round, zero 65–100% of the time. It's blank if recruited in round III, and round III's harvest arrives after the last buy (useful only for sets). — Fix: "Now and at round start: plant any of your yellow. When you place your last worker of the round, gain that many of each other color." — medium
15. **Seed Money** (Gold, 4+0): "When recruited: gold equal to your member count." — Measured 1.5 / 4.4 / 7.5 units by round, for a cost of 4. — Fix: add "(at least 3)". — medium
16. **Silver Spoon** (Silver, 4+2): "When recruited: silver equal to the most silver any rival has." — Too weak early, too strong late: 1.5–2.7 / 5.8 / 10–16 units. In round III it instantly ties the leader of a 6-follower contest. — Fix: "+3 silver, plus half the most silver any rival has (rounded up)." — medium
17. **Big Score** (Magenta, 2+2): "Once per game: take half the magenta of the rival with the most magenta." — Loot gets spent, so it's usually too thin to take. It was left unused in 15 of 25 holdings (46 of about 64 in the first run), and gained about 2 units when used. — Fix: "Once per game: take 3 resources from the rival holding the most." — medium-low
18. **Doppelganger** (Red, 4+2): "When recruited: copies the effect of one of your members." — Early you have nothing worth copying. It produced 0 in 53–68% of recruits. — Fix: "…one member in play (anyone's)." — medium
19. **Dyer** (Yellow, 4+2): "At round end, +1 yellow per color you hold." — In round III the yellow lands after the last buy, so it only breaks set ties (it decided the ring in 5 of 31). — Fix: "When you place your last worker of a round, +1 yellow per color you hold." — medium
20. **Investor** (Gold, 4+2): "Round start: set aside gold. Round end: it comes back doubled." — Blank if recruited in round III (0–0.5 units). Round III's return is contest-only (it decided the ring in 3 of 16), and bots got 1.1–2.4 units from it. — Fix: "Now and at round start: set aside… When you place your last worker of the round, it comes back doubled." — medium
21. **Straggler** (guest, Purple lean, 6+2): "Once per round, after the last worker is placed: move a worker to an unused space and do it." — At 4 players round I has 12 spaces and 12 workers, so there's never an unused space and it's dead. In round III the action resolves after every buy, so only a free recruit, followers or contest colors count. — Fix: "Once per round, on your last turn, before you buy: move one of your other workers to an unused space and do that action." For the Purple rework agent or the benders owner. — medium
22. **Recruit-income twins**: Coin Purse (Gold, 2+2), Exporter (White, 4+4), Go-Between (Yellow, 4+4), Recruiter (Red, 4+4), Reseller (Blue, 8+4). Each is "whenever you recruit, +1". By recruit round they measured: Coin Purse 4.9 / 3.1 / 0.7; Exporter 1.7 / 2.1 / 1.5; Go-Between 2.5 / 2.7 / 1.8; Recruiter 6.8 / 4.8 / 2.0; Reseller 6.0 / 3.9 / 2.0. That's one template sold at 4, 8 and 12. — Fix: price them all 2+2; Reseller 4+2, since it pays in any color. Exporter is for the White rework agent. — medium
23. **Gain-on-recruit twins**: Stylist (Blue, 2+2), Merchant (Gold, 4+2), Groupie (Green, 4+4). Each is "whenever anyone recruits a member of my color, +1". By recruit round they measured 6.3 / 3.8 / 1.5, 4.5 / 3.7 / 1.4 and 4.8 / 2.4 / 1.1. — Fix: all 2+2. Groupie is for the Green rework agent. — medium-low
24. **Recruiting Drive** (Red, 2+2): "Recruit 2+ members in one turn: +2 red." — It needs Hire plus a buy, or a Bargain or Spree. Measured 0.9–1.9 units, zero 33–64% of the time. — Fix: "Whenever you recruit a member for free, +2 red." — medium-low
25. **Harmonist** (Yellow, 6+2): "Game end: +1 follower per full set." — Everyone spends down on the last turn, so it scored 0 in 50–80% of games (average 1.5–1.8). — Fix: price 2+2, or "+2 followers per full set". — medium-low
26. **Front-runner** (guest, Purple lean, 2+0): "You always pick first in a round." — Blank if recruited in round III. It also only helps a leader, since the fewest-followers player already goes first. — Accept at 2. — low
27. **Underbidder / Minimalist** (Blue, 2+0 each): the same trigger ("per rival with more members"), one paying a discount and one paying blue. — Accept once Underbidder is "now"; cut one if the sphere needs room. — low
28. **Crowd-Pleaser** (Red, 2+0) and **Kingpin** (Magenta, 2+0): about 40% of Crowd-Pleaser's round-III red lands after the last buy, and Kingpin scores 0 in 64–77% of games because loot gets spent. — Accept at 2; they're Interns with upside. — low

**For the rework agents** (their cards, same audit):
- **Purple:**
  - **Errand Runner** (4+4): "When recruited: take an extra turn." At 4 players round I never has a spare space, so all round-I recruits got nothing (4 of 4). Fix: "…if no space is spare, +1 worker next round instead." — medium-high
  - **Late Riser:** it never fires in round I and is blank if recruited in round III. Give it "now". — medium
  - **Taskmaster** and **Second Wind:** dead in round I at 4 players. The use is refunded, but Taskmaster's round-I use is lost. — low
  - **Catch Up:** averaged +1 when taken in round I (first picks have no one ahead). Floor it at +2. — low
  - **Patience:** scored 0 in 67–100% of games. Re-measure now that purple is the ring. — low
- **White:**
  - **Barter:** dead (no loose followers) in 18–23% of round-II offers and 51–58% of round-III offers. Fix: "If you can't, +2 white." — medium
  - **Sell High:** dead in 9–25% of offers. Same fix. — medium
  - **Pawnbroker:** used 11 times across 24 recruits, never in round III. It has nothing to sell in round I and it's pointless in round III. — medium
  - **Liquidator:** left unused in 7 of 9 holdings. — medium
  - **Dealer** and **Reinvestor:** zero 48–93% of the time without sales. — medium
  - **Magnate:** scored 0 in 70–73% of games. — medium
  - **Safety Net:** give it "now". — medium
  - **Exporter and Tipster** are twins of Coin Purse and Tax Collector (same effect, 4 → 8 and 4 → 6). — medium
- **Green:**
  - **Echo** (the new text) is dead in 31–43% of offers. **Encore** is dead in 32–43% of a round's first-pass offers. **Eternity** is dead in 97% of first-pass offers, and it's a center space, so people take it early. All three need a floor like Refrain's "+2 green". — high
  - **Afterimage:** give it "now". — medium
  - **Mirror:** 2.3 / 5.0 / 7.2 units by recruit round, the same template as Silver Spoon. Same fix. — medium
  - **Groupie:** see twins (line 23). — medium-low
  - **Chronicler:** scored 0 in 33–42% of games. — medium-low

**Checked and accepted:**
- Jubilee (27–30% dead: fewer than 2 silver), Strike (17%: no gold) and Spree (18%) are round-III centers you build toward.
- Gather and Windfall are dead in 14–22% of a round's first-pass offers in round II (no members yet).
- Showroom is dead in 0–9% now that 10 members are face up.
- Trade (2–8%), Steal, Ransom, Rob and Heist (0–2%) are fine.
- Tax Collector and Tipster's late-buy income counts toward the gold and white contests.
- Bookkeeper and Clockmaker are fixed. Purple now scores, so purple at the end of round III counts.
- The reworked Pawn ("Per round number: +1 follower or +2 white") has no dead window.

**Systemic rules that prevent the class.**
1. **"Now" is the rule, not a flag.** Every round-start effect also fires when the member is recruited. Write it once in the rulebook, and extend it to the 12 round-start cards still unflagged (line 3, plus Investor, Sower, Social Climber and Heir).
   - Side effect: an early recruit now gets one more payout. Banker recruited in round I measured 9 gold for a cost of 4, and Peddler 7.9 units. The fair-price screen should reprice them.
2. **No member pays at round end.** What paid at round end now pays "when you place your last worker of the round", before that turn's buy. That's the Bookkeeper precedent, applied to Dyer, Sower and Investor.
   - I'd not adopt "pays next round, converts to followers in round III". These payouts decided a ring 16–25% of the time in round III, and paying them on your last placement keeps that while making them spendable.
   - A leftover-to-followers sink isn't needed. Late income nothing counts is 0.1–0.4 units per game.
3. **Every conditional space prints a floor.** "At least 2" or "if you can't, +2 <color>", the Overtime/Rally/Refrain pattern. A lint for the eval-quadrant skill: a space's minimum yield, for a player holding the 2 starting resources and no members, is at least 2.
4. **One-shot payouts never start at zero.** "When recruited" uses a flat amount or "at least N". Benchmark: Pilgrim (cost 4 returns 4 resources and 1★). Nothing that pays once scales with the round number.
5. **One effect, one price.** A cross-sphere template ("whenever you recruit, +1", "round start, +3", "copy the richest rival") gets one cost wherever it appears.
6. **Extra turns never vanish.** An extra turn granted when no space is spare becomes "+1 worker next round". At 4 players round I is always full.
7. **UI nudge.** On a player's last buy step of the game, the buy panel lists their unused once-per-game members. Bots left Gala unused in 7 of 17 holdings, Rainmaker 4 of 6 and Big Score 15 of 25. People will forget too.
8. **Release mustn't refund a one-shot twice.** Release pays the full printed cost. So any "when recruited" card (Pilgrim, Feast Hall, Seed Money, Silver Spoon, Mirror, Understudy, Keepsake) is a buy, collect, release loop. Lender also sheds its game-end −2 that way. The Green agent flagged the same thing.
   - Pick one: a released member pays half its cost (rounded up), or a member can't be released in the round it was recruited.
   - Rule 4's flat refunds assume one of them.

## 5. Too hard to tell what's going on; board overwhelming; paying is complicated and not tactile (UX solver, then UI agent)
*UX solver. I played two full 4-player games on `?table=gold,thieves,echo,silver`: the frozen build (5192) at 1270×700, then HEAD (5193, Cults, shop of 10, no contest strip) at 1270×700 and on an iPhone 13 by touch. I took frame bursts after every bot turn. I judged by sight and measured with the DOM. Shots are in `design/eval/ux-shots/`. The specs below are for the UI agent. Nothing here is built yet.*

Three calls for Cory:
1. (a) **One place tells each turn.** A rival's turn builds up line by line on a single turn card, then folds into a tappable chip. The caption, ticker and "last move" tags go.
2. (b) **Ship mock A, fixed and never spun.** Every open space prints what it does. Rings that aren't open yet shrink into the hub. Each quadrant's rule and leader sit on its rim. The side list, tabs and spinning go.
3. (c) **Pay with coins, not a form.** Tapping a buy drops the suggested coins into the cost slots. Tap a coin to swap it, then tap Pay. That's two taps (one if there's only one way to pay). The steppers, chips and modal go.

### (a) "Still too hard to tell what's going on." Recommendation: one turn card per rival turn, then a chip.
**What I saw.**
- A bot turn is 3–5 steps in about 2–3 s: place, effect, choice, pay, recruit. Each step reports in a different place: the caption over the wheel, the ring and rim arrow on the space, "last move" tags on the player cards, gift floaters, the header ticker, and the card flying to its new owner.
- In `a1-laptop-bot-turn-fragments.png`, P3 takes Gift, and every surface tells a different piece:
  - the caption says "+2 silver";
  - P3's card says "+2 green";
  - every other card, mine included, says "last move +1 green", which reads as if *I* moved;
  - the ticker says "everyone else gains 1 green (P3 took 2 green and)."
  - Nothing states the whole move.
- The ticker shows the latest log line, not the latest move. Within about 1 s, bookkeeping lines ("P2 passed.", "P2's Evergreen: +3 green.") overwrite the turn's headline (`a2-laptop-bot-turns-burst.png`).
- On the phone, opponents are a one-line score bar, so card flights and gift tags land on nothing. Only the caption and the ring survive (`a3-phone-bot-turns-burst.png`).
- Snake order is invisible. "Your turn again (snake order)" comes as a surprise (`a4-laptop-snake-surprise.png`).
- The log has broken copy: "(P2 took 2 green and)". "P1 stole 2 (2 from P4)" names no color (`a5-laptop-log-wording.png`).

**Root cause.** The UI has no unit called "a turn" and no single place to look. It reports log lines and state diffs wherever their data lives, so the player has to assemble a turn from five places while it is still moving.

**My take.** I agree with Cory, and the phone is worse. The pacing is fine (600 ms per step); where things appear is broken. The round-end card and the final results are clear: keep them.

**Options.**
1. **History strip** of one tile per play, tap for detail (Hearthstone). Great afterwards, but weak while the turn is happening.
2. **Turn card in a fixed spot** that builds line by line, then folds into a tile (Hearthstone's history plus Balatro's one-cause-at-a-time counting). It covers both during and after the turn.
3. **Step-through:** bots wait for a tap after each turn (BGA's "replay last moves"; Into the Breach's ordered preview). Clear, but slow at about 36 bot turns a game.
4. **The camera visits each action,** panning or zooming (Wingspan digital). It fights the fixed board in (b).

**Pick:** 2, plus 3 as a setting ("Pause after each rival turn", off by default).

**Spec.**
- **Player row.** It runs in turn order and shows the snake: `P2 P3 P4 you │ you P4 P3 P2`. The seat to act is lifted, and the next seat is marked "next".
- **Turn card position.** One card slot sits under the player row. On the laptop it is 320 px wide, over the board's top-left corner. On the phone it spans the full width under the row, at most 3 lines.
- **The card builds line by line,** each line held for 600 ms:
  - "P3 · Gift: +2 ● silver, +2 ● green", while the worker flies from P3's pill to the space;
  - "everyone else +1 ● green (you +1)";
  - "recruited Evergreen 1★", while the card flies into this line.
  - It holds 900 ms, then shrinks into a chip in "Since your turn".
- **Coins and counts.** Resource coins fly from the space to the actor's pill, and to yours for gifts and steals. The digits count up (the ≥3-value gate already exists).
- **Card lines come from a per-turn diff** of resources, followers and members before and after the actor's turn, not from log lines. A line that changed your holdings gets a green or red edge and the word "you".
- **Chips** read like "P3 Gift +2●+2● · Evergreen". A tap or long-press reopens the turn card. They clear when your next turn ends. After 6 chips, older ones collapse into "+N more".
- **Your own turn** uses the same card (rubric check C2), e.g. "Rush: +2 ● gold".
- **Log copy:** no dangling "and)". Steals name their colors: "took 1 ● silver, 1 ● green from P4".
- **e2e assertions:**
  - After every rival turn at Normal pace, `.turn-card[data-pid]` is visible for ≥1.5 s, and its text has the space name and every non-zero resource delta of that turn.
  - There is one `.since-chip` per rival turn since your last, and chips with your deltas carry `data-you`.
  - At 390×664, the turn card's box is inside the viewport throughout bot turns.
  - `.caption`, `.ticker` and the "last move" tags are absent.
  - No log line matches `/ and\)\.$/`.

### (b) "The board is so overwhelming: the number of spaces and having to hover over them all." Recommendation: ship mock A, fixed, with B's rule-and-leader moved onto the rim.
**What I saw.**
- **Round I.** The board draws 24 spaces, and 12 of them are locked, dashed and meaningless. Each open space carries one 12 px word on a curve ("Joint", "Silver"), and what it does is only in a hover card (`b3-laptop-hover-to-read.png`). The side list shows one quadrant at a time and hides half its rows behind "More below" (`b1-laptop-r1-board-and-list.png`). Reading the 12 open spaces takes 12 hovers, or 4 tabs plus scrolling.
- **Later rounds.** By round III there are 21 open spaces, and the inner names run vertically ("Heist", "Jubilee"; `b4-laptop-r3-24-spaces.png`). Rival rings, halos, the rim arrow and the worker discs all compete for attention (`b2-laptop-r2-board-busy.png`).
- **Laptop layout.** The board is 391 px wide on a 1270 px screen. The side column takes 600 px and mostly repeats the board.
- **Shop.** On HEAD's 10-card shop, the buy view clips the last two cards under the follower buys (`b8-laptop-shop10-clipped.png`).
- **Phone.** Tapping a space opens a sheet that covers it (`b6-phone-sheet-covers-space.png`); the shop dock hides the board while you buy (`c6-phone-buy-dock.png`); the page is 2344 px tall, with a ~150 px empty band kept for Undo (`b7-phone-scroll-and-gap.png`).

**Root cause.** The board is a map of names, and their meaning lives somewhere else (the hover card, the side list). Spinning exists to make one quadrant readable, so three quarters of the board is always the hard part. Rings that aren't open yet take full space in rounds where they mean nothing.

**Options.**
1. **Mock A, text on the board:** glyph and number on each cell; rings that aren't open collapse into the hub; fixed orientation. Agricola and Lords of Waterdeep (Playdek) print the action on the space itself *(unverified)*.
2. **Mock B, the board as a map plus a full list to act in.** It reads like a BGA spreadsheet. The board stops being the game's face, and the eye shuttles between map and list, which is the same split that hurts (a).
3. **Today's wheel, with the list showing all quadrants.** The smallest change, but it is still two places.
4. **Tap a quadrant to zoom into it** (Root digital's clearing focus) *(unverified)*. This adds a mode.

**Pick:** A on both laptop and phone, taking two things from B.
- **Why A.** You look and act in one place, and the board stays the game's face. Hover becomes optional, because every round-I space shows its main effect.
- **Laptop.** The side list goes, so the board grows to about 560 px (it is 391 px today).
- **Phone.** Board, prompt and your pill fit in one 390×664 view (`design/prototypes/board-readability/shots/A-phone.png`). B needs three screens of scroll (`B-phone-full.png` in the same folder).
- **From B,** keep each quadrant's rule with its live leader (moved onto the rim, as Cory asked) and the full wording in a detail card.
- **Fix in A before shipping:** its phone sub-line renders at 8.8 px. Put sub-lines in the tap sheet on phones, with names ≥12 px and main lines ≥16 px.
- **If Cory later wants rotation as a mechanic,** the board can turn as a game event rather than as navigation.

**Spec.**
- **Orientation.** The board is fixed and never spun. Quadrants keep a fixed order. Cell text is drawn upright, never along a curve.
- **Rings.** Only open rings take radius.
  - Round I: one band of 12 cells, each with name, main line and sub-line.
  - Round II: two bands. Round I is the outer band, round II the inner one (8 cells). Sub-lines move into the detail card.
  - Round III: the 4 round-III cells take the hub.
  - Rings not open yet are ghost dots in the hub, labelled "II · III open later" or "III opens next round".
- **Cell states:**
  - legal: lit fill, 2 px stroke, pointer cursor, a slight lift on hover;
  - open but not now: dim, with no pointer cursor;
  - taken: text at 40%, with a disc in the player's color and their initial;
  - a rival's move since your turn: a ring in that player's color, kept until you act;
  - locked: a ghost dot in the hub.
- **Rim band, one per quadrant,** at ≥12 px: "Most gold +2 · P2 3 · you 2". Hovering or tapping it opens the standings for all players, with the tiebreak and the prize.
- **Detail card.** Laptop: hovering a cell fills a docked card in the side column (name, full text, round, status, "Place here"); clicking a legal cell still places directly. Touch: the first tap opens a bottom sheet ≤40% tall, scrolling the board first so the sheet never covers the cell; a second tap or "Place here" places.
- **Motion.** When a ring opens, the hub ghosts grow out into a band over 500 ms. With reduced motion, the change happens instantly.
- **e2e assertions,** at 1270×700 and 390×844:
  - `.spin`, the quadrant tablist and the side panel are absent.
  - Every open, untaken cell has a name ≥12 px and a main line ≥14 px on the laptop and ≥16 px on the phone (computed size × board scale).
  - Locked spaces render no text.
  - Each quadrant has a `.rim-rule` that names the leader, and tapping it opens a popover listing every player.
  - At 390×664, the board's bottom edge is ≤664, with the prompt and your pill on screen.
  - A touch sheet's box never intersects the tapped cell.

### (c) "Selecting how to pay is overly complicated and not tactile." Recommendation: coins drop into cost slots; swap by tapping; Pay.
**What I saw.**
- **One spend, five times.** The dialog shows the same spend five ways: a cost line, a coin row, four ± steppers ("n/max"), "Ways to pay" chips, and "You pay 2 magenta." (`c1-laptop-pay-mole.png`, `c3-laptop-pay-ways-colour-only.png`).
- **Illegal by construction.** The steppers let you build an illegal spend (5 coins for a 4 cost), then scold you: "That spend doesn't fit the cost", with Confirm dead (`c2-laptop-pay-illegal-state.png`).
- **Chips that don't scale.** The chips tell ways apart by color alone (●1 ●1 vs ●1 ●1). They also multiply: holding 6 of each color, +10 followers has 206 ways to pay, and 8 from 4/4/4/4 has 85.
- **Three taps even when forced.** A forced payment still goes card → modal → Confirm: Seed Money costs 4 gold and there is exactly one way (`c4-laptop-pay-forced-still-modal.png`).
- **A silent suggestion.** The suggested way spares colors whose contest you lead, which is smart, but "suggested" never says why.
- **Hidden context.** The modal dims your holdings and the board, and on the phone it's a full sheet (`c5-phone-pay.png`).

**Root cause.** The engine's output, a list of legal spend vectors, is rendered straight onto the screen. A list of vectors is a form, not a handful of coins.

**Options.**
1. **Auto-pay with Undo.** Dominion by Temple Gates has one "play treasures" tap; Hearthstone spends mana for you. It's the fastest, but it isn't tactile and it hides the choice.
2. **Coins into slots.** In Splendor digital, gems arrive pre-placed and you tap to substitute gold *(unverified detail)*. In Wingspan digital, food moves from your supply onto the cost and you choose only the flexible part. This is tactile, and illegal payments can't be built.
3. **Three labelled chips** ("keep your gold lead", "use extras", "cheapest"), preselected the way Race for the Galaxy preselects. Simpler than today, but still a list.
4. **Drag coins.** Dragging on a phone is slower than tapping, and it has the same legality problems as the steppers.

**Pick:** 2, with the speed of 1. The suggested coins arrive already placed, and a payment with only one way commits on the first tap (with Undo).

**Spec.**
- **No modal.** Tapping a card or a follower buy lifts it in place.
  - Under it sits a row of slots: colored slots (●● magenta) and "any" slots (○).
  - Your coins, grouped by color in real counts, sit below the slots, next to your pill.
- **Fill and labels.**
  - The suggested coins fly from your coins into the slots, staggered 150 ms.
  - The top line reads "Recruit Mole · pay 2 ● + 2 any".
  - The bottom line reads "You keep ●1 ●0 ●1 ●0", next to the Pay button. Enter pays; Back or Esc cancels.
- **Moving coins.**
  - Tap a placed coin and it flies back, leaving the slot dashed.
  - Tap one of your coins and it flies to the first empty slot that takes it.
  - A colored slot refuses other colors with a shake and "Mole needs ● magenta here".
  - Pay lights only when the slots match one of the payments the engine offers (an id in `pending.options`), so the engine doesn't change.
- **Coins you'd rather keep** wear a small crown ("you lead Most gold"). The suggestion never uses them, and placing one warns "Spending this costs your Most gold lead".
- **Shortcuts.** With one legal way (Seed Money), the first tap pays, the coins still fly, and a toast says "Paid 4 ● · Undo". A double tap on any card pays the suggested way.
- **Phone:** a bottom tray at most 45% tall, keeping your pill, the card and Pay in one view, with tap targets ≥44 px.
- **e2e assertions:**
  - `.steppers` and `.ways` are absent.
  - A one-way buy takes 1 tap; any other buy takes 2 (card, then Pay).
  - 50 random taps on coins and slots never light Pay on a spend outside `pending.options`.
  - Tapping a placed coin restores your count.
  - A `.coin` 100 ms into its flight has a transform different from where it ends.
  - At 390×664, the slots, your coins and Pay are all inside the viewport.

### Strip list: every element that could go, and where its information would live
| On screen now (HEAD) | Goes; its information moves to |
|---|---|
| Side quadrant panel: header, collapse ▾, 4 tabs, rows, "More below" | Text on the board's cells, plus the detail card on hover or tap |
| "Most gold +2 this round · now…" line (one quadrant at a time) | The rim band on each quadrant, and the standings on tap (Cory's call) |
| Spin buttons ‹ ›, drag to spin, arrow keys, "▲ facing you · drag…" hint, ▲ marker | Gone, because the board no longer spins |
| Ring numerals I/II/III, "ROUND II" tags, "opens round II" | The hub ghost ("II · III open later") and the detail card |
| Dots in empty spaces; halo + glow + ping + rim arrow + recent-move ring | Two marks only: a lit cell for legal, a player-colored ring for "since your turn" (the worker's flight does the ping's job) |
| "Last: …" ticker | The "Since your turn" chips; Log becomes a small header button |
| Caption over the wheel ("P3 took Gift (+2 silver)") | The turn card |
| "last move +N" tags and gift floaters on player cards | The turn card, plus coins flying into the pill |
| Four tall player cards (members, "3 workers", "N members") | A compact player row (followers, coins, worker dots); members open with one tap on the pill (rubric check B7) |
| Phone score bar, which repeats your followers from your strip | The same player row |
| "Round I · 3 workers each" | "Round I"; workers left show as dots on your pill |
| Undo pill, the phone's second Undo row and its reserved blank band (~150 px) | One "↶ Undo" inside the prompt pill |
| "Shop · 57 in the pile · click a member to recruit" | "Shop"; the pile count on hover or tap; the prompt already says what to do |
| "✓ YOU CAN AFFORD" and "you'd pay 7 gold, 3 silver" on cards | Lift and glow for affordable cards (plus a non-color cue); the payment shows in the slots |
| "Release a member ▸ once a round…" line under the buy view | "Release" on your own member chip, shown only while you buy |
| Pay dialog: cost line, coin row, steppers, chips, sentence | Cost slots and your coins, as in (c) |
| Leave as a big pill next to How to play | A ⋯ menu; How to play stays as one tap (rubric check B8) |
## 6. Follower buys shouldn't need colors; sold followers can't come off members (done in engine; UI hints by UI agent)
