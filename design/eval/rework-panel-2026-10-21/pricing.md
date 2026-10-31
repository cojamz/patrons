> Superseded Oct 21 by design/member-process.md: Cory wants concepts first and sim games to set prices ("my members aren't priced the best right now").

# Pricing v2 (Oct 21, after Cory's notes on the neutral members) — this section wins over everything below it

Cory, 12:03am Eastern: "these are all a little too expensive, except the Launderer. the extra hand should be expensive? but the rest seem slightly too expensive. the other problem here is everything is roughly the same cost." The neutral set had come out as 5, 6, 6, 6, 7, 7, 9.

## Why the old model came out high and flat
1. **It priced every card at its peak.** Rule-benders were "priced for round III", and every card was scored in "its best round". Most cards peak at about one round III placement, so they all landed around 5 to 7. The model was flat by construction.
2. **One ratio for every card.** The "1.2 to 1.5 in its best round" target forced every card to the same value for its cost. Then any card whose power we estimated at "about a space" got about the same price. Nothing in the model asked for a cheap card or a dear one.
3. **The bumps stacked up.** Neutral cards got "+1 to 2 because they pay no contest tax". His Oct 15 "too cheap" got read as another +1 to 2 (Front-runner 4 → 6, when he wanted 5). Every adjustment pointed up.
4. **It anchored on live prices**, which were already bunched from an earlier sim pass at 4 to 7.
5. **It ignored when you can afford it.** A round I player has about 6 loose resources for the whole round (section 1 below). A 6 or 7 is a whole round's income, so a card priced like that is a round II card whatever its text says. Pricing at the peak quietly moved every card into rounds II and III.

## The rules now
1. **Shape the deck's price curve first, then fit the cards to it.** In a deck of 6 to 10: about a third cheap (1 to 3), a third middle (4 to 6), and one to three dear (7 to 10). At least one card at 2 or less, and at least one at 8 or more. No more than two cards at the same total. Spread 1 to 10 is the target, and 3 to 9 is the narrowest acceptable.
2. **Price for the round you want it bought in, not the round it peaks.** Round I cards cost 4 or less (one round's income). Round II cards cost 4 to 7. Only a card whose whole point is a round III burst or a rule-bend that size (Extra Hand, Mob, Tribute Band) sits at 8 to 10.
3. **When in doubt, go a step cheaper.** A dear card dies in the row and teaches nothing. A cheap card gets played, and he'll tell us. His notes run "too dear" on quiet cards far more often than "too cheap".
4. **His "too cheap" or "too dear" means one step (±1)** unless he names a number. Never re-derive and stack.
5. **No surcharge for neutral cards.** Not paying a contest tax is not worth extra.
6. **Followers and member count are price levers too** (Cory, 12:11am: "you can mess around with how many followers/members a member is to also help with cost balances"). A card can move along the curve by changing what it's worth as well as what it costs. Give a dear ability card worth 2 or 3 so it beats a pack, or make a strong cheap one worth 0. Use "counts as N members" (Revelers) where a color counts members. Plain bodies stay at f = C or better (worth C+1 at 5 and 10). Don't leave every ability card at worth 1 by habit: that is part of what made decks flat.
7. **The cheap card is a design job, not a leftover.** It should still be one you want, like Twins, Crew, Volunteer or Recluse at 4. A cheap card that does something small but clear (on arrival, visible) beats a dear card that does a lot.

His liked members, by total cost: Volunteer 0, Twins 2, Crew 2, Shareholder 3, Recluse 4, Busker 4, Stunt Double 4, Treasurer 4, Doppelganger 5, Panel 6, Mentor & Protégé 8, Extra Hand 9, Mob 10, Tribute Band 10. That is the curve to imitate: wide, with most of the loved cards at 4 or less.

Calibration (his calls and Claude's gut spread, Oct 21): Straggler 3, Freelancer 4, Tiebreaker 4, Front-runner 5 (his), Squatter 6, Launderer 6 (he said it's fine), Extra Hand 9 (he says it should stay expensive).

---

# Member pricing under the current economy (panel: economy and pricing)

Claude, 2026-10-21, overnight panel. Arithmetic from the live rules (core.js: packs 1/5/10 at 1-for-1, one buy per turn, minions 3/4/5, contests 2/4/6, shop 7) and the approved Red (red.js) and Green (echo.js) decks. No sims, no games. Every estimate is marked **(guess)**; Cory's approved prices are the calibration, and where they disagree with the arithmetic his gut wins and this file says what it is pricing in.

## 1. What a resource and a buy are worth

**A resource is a follower, in every round.** Packs are 1-for-1 with no stock limit, so any resource you can get to a buy becomes one follower. There is no inflation: a follower bought in round I is worth the same as one in round III. Two things move a resource off par:
- **Contest equity** when held at round end (prize 2/4/6 to the leader). For a player in the race, a held unit of the color is worth roughly **+0.3 / +0.5 / +0.7** followers at the end of rounds I / II / III (guess: prize divided by the leader's typical lead spread). For a player out of that race, 0.
- **Death at game end.** Anything not converted by your last buy is worth 0 (unless a scorer reads it). Packs come in 1/5/10, so the last turn wastes up to 4 (holding 9 buys 5).

**Income per placement, reworked spaces** (resource equivalents, including the +1):
- Round I spaces: Gather and Build Up 2/3/4 by round; Help Yourself 2/3/4 stolen plus 1/2/3 followers (the richest ring-I space); Lie Low 2/3/4; Chorus and Redistribute 1 + how many minions sit there; Echo 1 + what it copies; Open Door 1 + the cheapest member (a 0–2-cost body); Even Swap 1 + a swap.
- Round II: Promote and Demote 1 + an upgrade of up to 2 cost; Crime Wave 1 + half a stack (2–4); Shake Down 1 + a member costing ≤5 or its cost; Encore and Reprise 1 + a copy (about 3).
- Round III: Recruit a Member 1 + any shop member (up to 10); Poach 1 + a rival's best member; Greatest Hits 1 + 3–4 copies.

**A typical player** (guess, 4 players, reworked colors only): about **2.3 per placement in round I, 3.3 in round II, 4.5–5 in round III**. Per round about **7 / 13 / 23** in value, of which roughly **6 / 10 / 14** arrives as loose resources (the rest comes as members and followers). Add the 1 drafted at setup, about 10 followers from contests (48 per game across the table, less ties), and the start follower: a typical final score lands around **50** (guess). One follower is about 2% of a winning score.

Gold's old spaces (Kickback +3, Golden Years up to +6, Double Down) sit well above this curve; they are an outlier until Gold is reworked, not the baseline.

**When the buy binds:**
- Round I: 3 buys, about 6 loose resources. A pack of 5 uses one buy; two buys are spare. **Resources bind; the buy is nearly free.**
- Round II: 4 buys, about 10 plus carry-over. Two packs of 5 use two; two spare. **Resources still bind**, the buy only a little.
- Round III: 5 buys, 14 plus carry-over (often 20–25 in hand), and the contest pulls you to hold. **The buy starts to bind**, and the last turn of the game always binds (the pile dies after it).
- Shadow price of one buy, in followers: about **0 / 0.5 / 1.5** by round (guess), far higher on the final turn and for anyone holding a burst (Crime Wave, Double Down, Spree).

Consequence: under this economy **extra buys and "two members in one buy" are worth little before round III**, because what runs out is resources. Cory's "you can always buy twice" member is worth most to the player whose income outruns one buy (bursts, Blue's Buy twice and Spree) and least to everyone else.

Price in placements, as a quick feel: a cost of 4 is about two round-I placements and under one round-III placement. **Cheap members are round-I decisions; dear ones are round II–III decisions.**

## 2. The fair follower count for a plain "worth N" member

A member uses the buy, its colored part comes out of the pile that scores that color's contest, and it sits where Shake Down, Demote and Poach can reach it. In return it gives **N followers and N bodies** (the engine counts a member worth N as N members), and it converts an awkward amount in one buy (3 resources is one buy as a member, three buys as packs).

The break-even, for a member of colored part s and total cost C bought in round r:

    N × (1 + b) + g  ≈  C + s × t(r) + λ(r)

where b ≈ 0.3 is what a body is worth to a typical cult (more in a counting build, section 5), g ≈ 0.5 is the one-buy convenience, t(r) is the contest equity of a colored unit (0.3 / 0.5 / 0.7), and λ(r) the buy's shadow price (0 / 0.5 / 1.5). All guesses.

Solved for N (the fair follower count):

| Cost (s+w) | Round I | Round II | Round III |
|---|---|---|---|
| 2 (1+1) | 1.4 | 1.9 | 2.8 |
| 3 (2+1) | 2.4 | 3.1 | 4.2 |
| 4 (2+2) | 3.2 | 3.8 | 4.9 |
| 6 (3+3) | 4.9 | 5.8 | 7.0 |

Checked against the approved bodies:
- **Twins** 2 red, worth 2: fair in round I (2.6 + 0.5 against 2.6), poor in round III. An early card, and Open Door's natural pick.
- **Crew** 1+1 worth 2, **Shift Crew** 1+1 worth 2: a small deal in rounds I–II.
- **Shareholder** 2+1 worth 3: a small deal in rounds I–II.
- **Retinue** 1+1 worth 3, "everyone else +1 silver": the 3 silver to rivals costs about 1 relative follower, so it nets a small deal, like Shareholder. Cory: "needs to be more members. More followers."
- **Loyalists** 2+3 worth 2: 2.6 of body against 5.6 of cost, so the swap block is priced at about 3. Fair only at a table with swapping in it; it is a defense card.

**Where Cory's gut disagrees, and why it's right.** The model says a plain body at f = C−1 breaks even in round I. Every body Cory approved sits at **f = C** or better, and he asked Retinue (f = C+1) for more. "4 resources for a member worth 2 is too expensive" came when followers cost 2 resources each; at 1-for-1 the same feeling reads: **a member has to beat the follower pack, visibly.** A body that only breaks even is a dead card in the row: nobody buys it, and the Oct 20 frame needs members to be where followers come from. So his floor is the right floor, and the model's break-even is the line below which a body is a trap.

Two special costs: at **5 and 10** a plain body worth C is a pack with extra downsides (colored, stealable), so it needs **f ≥ C+1** to exist. At 2–4 and 6–9, f = C still has the one-buy convenience.

## 3. A ladder for ability members

Score a card by **value ÷ cost in the round it is best**, where value = N × 1.3 + the ability's expected yield, and cost includes the colored part's contest tax (s × t). Healthy: **1.2–1.5** in its best round, about **0.8 or more** in its worst intended round. Above 1.7 in every round: auto-buy. Below 0.9 in every round: trap.

**One-shot (On Recruit).** Value is immediate. When the shot does a space's job, price it at that space's value in the round it peaks: about 2.5 (round I), 3.5 (round II), 6–8 (round III), plus the body.
- **Stunt Double** 2+2 ("copy the action you just took"): 1.0 in round I, about 1.35 in round III. Priced for round III; it gets better as spaces do.
- **Panel** 4+2 (worth 3, "Promote or Demote another member"): 3.9 of bodies + a round II space (3.5) = 7.4 against 7.2: fair in round I, 0.87 in round II. Cory's own price, and right once the Promote is valued as a whole space, not as "+2 cost".
- **Treasurer** 4+0 (gold equal to your member count): 4–7 + body for 4. Escalates with bodies, so the timing is the puzzle.
- **Mime**-style shots that hand back resources at or above their cost read as a plain conversion (Cory: "doesn't love"). One-shots should pay in another currency (a member, a swap, a copy, a placement) or scale with something you built.

**Per-round income ("now and at round start, +X").** Bought in round r it pays X × (4 − r).
- **Busker** 1+3 (+2 green): R1 7.3 / 4.3 = 1.7; R2 1.06; R3 about 0.65. Strong early, by design: colored 1 lets anyone take it, and then they hold green, which puts them in the green contest.
- **Banker** at 8 (+3 gold): R1 10.3 / 9.2 = 1.12, R2 below 0.9. "Too dear" matches. At **6** (e.g. 4+2, Claude's fill-in) it reads 1.43 in round I.
- **Host** 4+2 (+1 red per 2 members): about 1.0 in round I for a typical cult, 0.74 in round II. A hair dear unless you are building bodies (Mob alone adds +2.5 a round).
- Rule: **flat income X per round, paid now: price ≈ 2X.** Income that grows with what you build can sit a little higher.

**Game-end scorers.** No tempo, but the buy and the colored part are spent, often in round III where both are dearest.
- **Mob** 6+4 (worth 5, +1 per red member): 5 bodies (6.5) + 5 from itself + about 3 other red bodies = 14.5 against 13.5 in round II (1.07), 0.92 in round III. A capstone at par for the committed. It also feeds Patriarch and Host.
- **Patriarch** 3+2 (+1 per 2 members): 0.9–1.2 bought early, about 0.7 in round III.
- **Chronicler** 2+3 (+1 per green member): 1.0–1.3 for a green cult.
- **Recluse** (+2 per rival with more members): up to 7 for 4 in a lean cult (1.75), 3–5 in a medium one. Generous, and fine: it pays for the opposite of what most players do, so it isn't win-more.
- Rule: **price a scorer at what it pays a committed player at a realistic count**, so it is par for the committed and a loss for a dabbler. Count the card's own bodies when it counts members.

**Rule-benders.** Price for round III use (Cory's frame), and read what they add: a placement, a buy, or a pick.
- **Extra Hand** 6+3 (+1 minion in round III): a placement (4–6) after the snake, plus a buy on the last turn of the game, which can convert up to 10 of a pile that would otherwise die. About 1.0 on average, far above that for a hoarder: "SUPER strong" is the late buy.
- **Squatter** 5+2 (once per round, place on a taken space): about +1 in round I, +1.5 in round II, +4–6 in round III (take the round III space after its owner). About 1.3 overall, nearly all of it in round III: "maybe TOO strong in round III" agrees with the arithmetic.
- **Straggler** 4+1 (after the last minion, move your last minion to an unused space and do it): round I has no spare space at a full table, so it pays about 2.5 in round II and 3.5 in round III: about 1.3.
- **Front-runner** 4+0 (always pick first): worth most to a leader, who normally picks last. About 1.3–1.8. Leans win-more (section 6).
- **Freelancer** 3+3 (pay colored parts in any colors): removes the contest tax and the "can't buy it, wrong color" block on every later buy. About 1.2.

**Copiers.** **Doppelganger** 3+2 is worth the best member you own (2–10, median about 5): 1.0–2.0. "Almost any build takes it" is the arithmetic. **Tribute Band** 8+2 ("once per game: copy every action you took this round") copies 4–5 spaces in round III, about 15–20: 1.2–1.5 there, 0.75 in round II. At the ceiling, gated by 8 green.

### The ladder (approved cards placed; prices are total cost)

| Cost | Plain bodies | Ability members |
|---|---|---|
| 0–2 | Volunteer 0 (w1) · Twins 2 (w2) · Crew 2 (w2) · Shift Crew 2 (w2) · Retinue 2 (w3, gift) | |
| 3–4 | Shareholder 3 (w3) · Agents 3 (w2, can't be copied) | Busker 4 · Impressionist 4 · Stunt Double 4 · Recruiter 4 · Recluse 4 · Treasurer 4 |
| 5–6 | Loyalists 5 (w2, defense) | Doppelganger 5 · Patriarch 5 · Chronicler 5 · Straggler 5 · Panel 6 (w3) · Host 6 · Proselytizer 6 · Freelancer 6 · Banker at 6 (fill-in) |
| 7–8 | | Squatter 7 · Mentor & Protégé 8 |
| 9–10 | | Extra Hand 9 · Mob 10 (w5) · Tribute Band 10 |

**The one card where approved price and arithmetic part most: Mentor & Protégé 5+3** ("recruit the cheapest shop member"). The free member is usually a 0–2-cost body (about 2.5 of value), plus its own body and any recruit triggers: about 4–6 against 11 in round II, about 0.5. What it buys, two members in one buy, is worth little while resources bind (section 1). What Cory's 8 is pricing in: Red's ladder (Promote reaches 2 up, so 6 → 8 → 10 is a path; Panel 6, Mentor 8, Mob 10 was his "yep"), and the card as a Demote source and Recruit a Member target. A fair price by value alone is about 5 (it was 3+2 on Oct 14). Raised as a flag, not a change.

## 4. Colored part versus any part

The colored part does three jobs:
1. **Sets the earliest round you can buy it.** A player gets about +1 of a color per action of that color, plus a scaling gain. Colored ≤2: anyone dabbling can buy it in round I. 3–4: the color's own player in round I, others from round II. 5–6: rounds II–III, committed players only (Mob 6, Mentor 5). 8: a round III capstone (Tribute Band).
2. **Taxes the contest.** The units come out of the pile that scores that color, so the color's own leader pays most (about 0.3–0.7 per unit). The deeper the colored part, the more a buy is "member or contest".
3. **Decides who the card is for.** Heavy colored = a reward for commitment. Light colored = a splash card the whole table can grab.

Rules of thumb:
- **Identity and capstone cards: colored about 60% or more** (Mob 6+4, Mentor 5+3, Tribute Band 8+2, Twins 2+0).
- **Splash cards, light colored (1–2), rest any** (Busker 1+3, Chronicler 2+3, Loyalists 2+3, Agents 1+2). Best when the card pays out its own color: the splasher then holds that color and contests it, which is interaction through the board.
- **Never all-any on a colored card** unless it is meant to be neutral; the colored part is what makes a color's members feel like that color.
- **Neutral cards pay no contest tax**, so for the same power they can sit about 1–2 higher in total, and since everyone wants them, they should rarely run above a 1.2 ratio (the first player to see one takes it).

## 5. Multi-body members

Every member worth N counts as N members (core.js: a member counts as the larger of its worth and its printed count). So a body is never just a follower. What one extra body pays, to its owner (guess):
- Patriarch: +0.5 follower. Host: +0.5 red a round. Tithe: +1 gold a use. Treasurer, Heir, Heiress, Grifter: +1 of their resource once.
- Mob (red bodies) and Chronicler (green bodies): +1 follower each, so **a body of the right color is worth about 2 in a counting build**.
- Recluse: each body you add can push you past a Recluse owner (+2 for them), and costs you if you own it.
- Member contests (Blue, Purple, White, while they stay on members): a body can swing a 2/4/6 prize.

So a body is worth about **0.3 to a typical cult and about 1 or more in a counting build**. Pricing:
- **Price multi-bodies at par on followers** (f = C); the extra members are the bonus that makes them build pieces.
- **Counters multiply bodies**, so the dangerous combos are products (Mob + Twins + Panel + Patriarch). Keep the biggest bodies (worth 4+) in the color whose counter reads them, with a heavy colored part, so the combo needs commitment.
- **One card, N bodies, one target.** Shake Down, Poach and Demote take all N at once. A worth-3 at cost 3 is a cheap ransom to keep (they pay its cost), which is the safety valve. Don't price a multi-body below par (f > C+1 at cost ≤5), or Shake Down becomes the best follower source on the board.
- Cory's direction for Retinue ("more members, more followers") points at bodies as a build in their own right. The headroom is about f = C+1 or C+2 at cost ≤3, paired with a cost to the table (a gift) or a color tax.

## 6. Red flags

**Cost is also position.** On top of value, a member's cost decides where it sits on the board's ladders:
- Cost ≤5 is a **Shake Down** target (ransom = its cost); 6+ is immune.
- **Promote and Demote** read cost gaps of 2, and **Even Swap** reads equal costs. In a deck with Red, prices on an even grid make more pairs.
- Anything left in the row in round III is a free **Recruit a Member** pick, so a dear card showing late is a gift to whoever takes that space.

**Traps (dear and slow):**
- Flat income priced above 2.5X (Banker at 8).
- Scorers priced above a committed player's realistic count.
- "Two recruits in one buy" priced as if the buy were scarce (Mentor & Protégé).
- Once-per-game extra turns at 8 (Go-Getter 6+2, about 5 of value).
- Anything over the ceiling (Grand Host 8+4 = 12).

**Auto-buys:**
- Round-start income at about 2X with colored ≤2, bought in round I: Busker, and the old Shopkeeper (2+2, +2 white now and each round) and Clockmaker. Fine one per deck; a deck full of them makes round I scripted.
- Doppelganger (accepted; the choice is the fun).
- Recluse for a lean cult.
- Cheap members that add a late buy or placement (Extra Hand would be one under 7).

**Win-more:**
- Front-runner: the leader normally picks last, and it keeps them first.
- Anything that pays the follower leader or rewards holding the most of what you already lead. Scorers that double the contest pile (Tycoon "+1 per 2 gold", Kingpin "+1 per 2 magenta") aren't win-more by followers, but they pay the hoarder twice on the same pile. They do give held resources a value after round III, which sharpens hold or spend. Flag, don't cut.

**Deck visibility (pricing angle only).** At 4 players the live deck is about 49 cards (10–12 a color plus 5 guests). Seen per game: 7 at each round start (21) plus one refill per recruit (about 20, guess), about 40, so roughly **80% of the deck shows**, but each card shows once, in a 7-card row, for a few turns. A player who wants a card sees it maybe once, and it is often gone before their turn comes back. Pricing consequences:
- A great card at a low price is luck, not skill (whoever sees it first takes it).
- A heavy colored part keeps a card's value with the color's player when it shows.
- Fewer, stronger, distinct cards per color beat many middling ones.

## 7. Pricing rules a designer can apply in their head

1. **A resource is a follower.** A plain body is worth at least its cost (f = C), and worth C+1 when it's meant to be a deal. Never worth C−2 or less ("4 for 2 is too expensive"). At cost 5 or 10 a plain body needs C+1, or it is just a worse pack.
2. **Flat income X per round, paid now: cost about 2X.** (Banker +3 → 6. Busker +2 at 4 is the strong end.)
3. **An On Recruit that does a space's job costs about that space's value in the round it peaks**, plus its body: round I job about 3–4, round II job about 5–6, round III job about 8–10.
4. **A game-end scorer costs what it pays a committed player at a realistic count**, its own bodies included. Par for the committed, a loss for the dabbler.
5. **Rule-benders are priced for round III.** An extra placement is about 5; an extra late buy is worth up to the pile it rescues (up to 10); a first pick is about 2. Ceiling 10.
6. **The colored part picks the round and the buyer:** ≤2 anyone in round I, 3–4 the color's player in round I, 5+ committed players from round II. Capstones about 60% colored; splash cards 1–2 colored.
7. **Bodies are worth about 0.3 each, or 1–2 in a counting build.** Price multi-bodies at par on followers. Put big bodies only where their color counts them, behind a heavy colored part.
8. **Extra buys are cheap until round III.** Resources run out first; buys bind only late and in bursts. Price "buy again" and "two recruits in one buy" for the player whose income outruns one buy.
9. **Check the ratio** (followers + ability in its best round, over cost): 1.2–1.5 is good, above 1.7 every round is an auto-buy, below 0.9 every round is a trap.
10. **Gifts:** "everyone else +X" costs you about X, "a rival you choose +X" about X/3.

Plus Cory's principle on top of all of it: interesting but not complicated. A price can't rescue a card nobody wants to think about.
