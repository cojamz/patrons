# Skeptic critique (rework panel, phase 3, 2026-10-21)

Seat: a competitive player who breaks designs at the table. Scope: the 11 open files. Read: the brief pack, all 11 pitches, design/todo.md color notes, and the live engine (core.js buys, contests, round start/end, swapMembers/memberAcquired; red.js; echo.js copy ledger; thieves.js; purple.js Late Riser). No sims, no games. Card texts quoted below are the pitches' fill-ins.

## Engine facts the pitches got wrong or skipped (these drive most verdicts)

1. **A copy mints the taker's chip from the bank.** echo.js records only the taker's own `fromAction` gains, and marks a space "redo" only if some *player* lost resources, members or followers, or the action has `copyDoesIt`. So:
   - A space that takes from a **pot** (Jackpot, Skim, Dividend, silver Last Call/Skim) looks like a plain gain to the ledger: Echo ("Copy the previous action", a ring I space) taken right after the Jackpot pays the full pot again, from nowhere. gold-outsider's "a copy of the Jackpot after it's taken finds almost nothing" is false under the live rule.
   - Spaces that read the **taker's own state** (Bumper Crop, Potluck, High Tide, Fast Forward) copy at the taker's number and in the taker's colors, not the copier's. yellow-anchor's "copiers get paid in their own members' colors" is false unless the space is `copyDoesIt`.
   - Gift spaces copy **without the gift** (High Tide, Rising Tide, Toast): the copy is strictly better than the original. Live already; it gets worse as Silver's harvest grows.
   - Spaces that pay **followers only** (The Count, Cash a lead, Patience, Last Laugh, Lean Years, Feast, White B) record nothing and are uncopyable unless flagged. Each pitch must say which way it wants it.
   Rule for every survivor: pot, read-your-state and follower spaces ship with `copyDoesIt`, so the copier does the action from their own seat.
2. **On Recruit re-fires for whoever acquires the card by a swap or take** (`swapMembers` → `memberAcquired` for the actor; a gift into a rival is not a Recruit). "Now and at round start" cards fire their round-start part on every such acquisition too. Every arrival card below is a Red/Magenta magnet: Panel, Even Swap, Promote, Open Door ("the cheapest"), Mentor, Recruit a Member, Poach, Double Agent, and Doppelganger copying it.
3. **Late Riser pushes a real turn** (`queue.unshift({t:'turn'})`, `left += 1`), guarded to rounds II–III and a spare space. Anything that fires "your round-start effects now" mid-round hands its owner an extra minion each time.
4. **Ties already split** (`prize / 2` to each tied winner). Every "you win ties" card is a rule-bender against Cory's Oct 16 "ties all score"; the guest version is already with him.
5. **Contests pay once, in `endRound`.** "Pays now and again" needs a second payout path; "pays now, then it's over" needs a per-round flag on the rim. The second is one flag; the first multiplies prizes.

## Per concept

### gold-anchor A ("money for buying members") — 3/5, fix
- **Abuse:** Speculator ("Once per game, on your turn: double your gold") fires after Double Down on the same turn. 10 gold → 21 → 42, and round III's five buys (10 each) convert all of it: about +32 from two cards. Midas ("Your gains from actions come as gold") turns every space, every copy and every Greatest Hits into gold, wins the gold contest every round, then doubles it; with Freelancer it pays every colored part in gold. Underdog doubles Double Down's own gain for a gold player who trails one rival: ×3.
- **2 players:** Kickback's gift goes to your only rival, so it's +2 you, +1 them, worse than Golden Years every round after I. Miser ("Ties for the most gold go to you") is strongest at 2p, where both hold gold.
- **Rules gap:** Half Again ("Gain half your gold, rounded up. +1 gold"): is the +1 before or after the half? It changes the round I value.
- **Fixes:** cut Speculator or make it "Once per game: double your gold, at most +8" and never on a Double Down turn; cut Midas (it is a contest lock, not a deck card); widen Double Down to "Double one of your colors. +1 gold" (kills the flat spot, and the leader no longer gets it by default). Drop Miser (tie herd).

### gold-anchor B ("multiplies whatever you hold") — 2/5, cut
- Gold Standard ("Raise one of your colors to match your gold") is Cash In again: hold 10 gold, raise an empty color, +10 in round II. Cory: "way too strong… like +10 blue in round 2". With Midas it's a free second stack.
- At 2p, Gold Standard plus "double one of your colors" takes both contests.
- It collides with yellow-anchor B's Even Out (same verb). Keep only the widened Double Down, inside A.

### gold-outsider A (the Jackpot) — 3/5, fix
- **Abuse 1, copy minting (fact 1):** Echo in round III right after the Jackpot is a ring I space paying 8–11. Encore (ring II, open in round III) copies it too. Must be `copyDoesIt`, so a copy takes the now-empty pot.
- **Abuse 2, High Roller** ("Once per game, on your turn: take the Jackpot"): the leader fires it in round III before the trailer's first pick and deletes the table's catch-up anchor. At 2p that's one of only two anchors. Anti-catch-up, bought by whoever can afford 9. Cut.
- **Dividend** ("Gain gold equal to the gold on the Jackpot"): in round III before the pot goes it's a second Jackpot (about 11) on a ring II space; after, it's +1 and dead. Use "half the Jackpot".
- **Skim** in round I's first pick reads an empty pot; it only works if its own feed lands first. Say so on the card.
- Underdog doubles the pot for a trailer (up to about 20); rare (both need to show), but it's the one blow-up.
- **Survives** after those three fixes: it's the only Gold that makes the Red player at a 2p table watch the Gold player's placements.

### gold-outsider B (Compound) — 2/5, cut
- Same round III as gold-anchor A widened. Interest ("+1 gold per 2 resources you hold") pays 8–11 in round III from a ring II space, rivaling the anchor, and pays hoarders twice. Tax Collector triples at 4p. Nothing here A doesn't already cover.

### purple-anchor A ("Skip ahead") — 3/5, fix (heavy)
- **Abuse 1, anchor lockout.** Turn moves stack: Crunch Time (turns 2 and 3 now), buy Errand Runner ("When recruited: take your next turn right away") on one of them, Double Shift ("Your first turn each round: take your next turn right away"), Head Start. A trailer picking first in round III at 4p places four minions back to back and takes all four anchors before anyone answers. Errand Runner also re-fires on every Red swap or Doppelganger. Fix: cut Errand Runner and Double Shift; Crunch Time and Head Start are enough.
- **Abuse 2, extra minions (fact 3).** Fast Forward ("Your members' round-start effects happen now"), Wake Up and Alarm Clock each fire Late Riser: an extra placement every time while you trail. In round III Wake Up (ring I) plus Fast Forward plus Alarm Clock plus a copy of Fast Forward is up to four extra minions. They also fire Cutpurse (a theft per fire) and Clockmaker ("+1 purple per 2 purple you have"), which compounds: 10 → 15 → 22. Fix: "…happen now (resources only)", and cut Wake Up or Alarm Clock (two of three is a template).
- Punch Clock ("+1 purple per rival with more followers than you") is White's live Sob Story; cut. Sprinter runs hot at 2p, where every turn after the first is doubled.
- Fast Forward collides with the strategist's White lean; it can only live in one color.

### purple-anchor B ("Own the order") — 2/5, cut
- Hold Up ("a rival you choose takes their next turn last this round") is kingmaking at 3–4p: the third player decides which rival loses a round III anchor. With Time Thief two purple effects bury one player's whole round. It's #99 ("non-intuitive turns") three times over. Night Watch is dead without them.

### purple-outsider 1 (The Count) — 1/5, cut
- Contests "pay out now… still pay at round end". One lead pays again and again: Early Count, The Count, Election Night, Snap Poll (re-fires on every Red swap and on a Doppelganger), and Green copies (Echo after The Count is a ring I space paying 6 a contest; Greatest Hits copies Early Count). A 10-red lead can collect 6 four or five times in round III.
- It pays the hoarder repeatedly, so "never buy members, sit on stacks" becomes the line, against "members are where followers come from".
- Early Count ("Choose a contest… it pays out now") hands 4 followers to a rival you pick: kingmaking.
- Tiebreaker is tie herd. If contest timing lives anywhere, it is the "then it's over" form (silver-outsider A / white-anchor A), never a repeat payout.

### purple-outsider 2 (Put It Off) — 2/5, fix or harvest
- Patience ("+2 followers per minion you placed before this one") pays 8 on a round III fifth minion, 10 with Extra Hand or Night Owl, and Straggler moves your last minion onto it. No buy needed, so it beats the anchor on the last turn. Make it +1.
- Rush Job ("Recruit: take your next 2 turns right away") is the same lockout as above and re-fires on swaps. Cut. Long Shot is Sob Story ×2. Night Shift needs a round-end hook for a space (members have one, spaces don't).
- Latecomer (+1 follower per minion placed this round, on recruit) is clean; worth keeping in any Purple.

### silver-anchor A (The Tide) — 4/5, survives with fixes
- **Kingmaking:** Good Deed in round III ("a rival you choose gets 2 of a color you choose") decides who wins a 6-follower contest between two rivals. Warm Welcome's "A rival you choose gains 1 follower" on the last turn picks a winner in a close game. Fix: Good Deed's gift is silver only, or goes to "the rival with the fewest followers"; Warm Welcome's follower goes to the trailer.
- **Copy (fact 1):** a copied High Tide pays the harvest without the +3 gifts, so the copier beats the taker. Flag `copyDoesIt` on both Tides.
- **Regift** ("Give a rival one of your members. Gain silver equal to its cost, up to 6") turns free recruits into cash: take Mob free with Recruit a Member, Regift it next turn for 6 (you also hand a rival 5 followers, so it's self-limiting). The real use is dumping a spent On Recruit card or breaking a rival's Recluse by gifting bodies. Fine; it is not Release because the card stays in play.
- **2p:** both Tides read one rival, about 1–2 lower. Silver isn't on Classic, so low risk.
- Best concept in this batch from my seat: nothing loops, nothing stacks, the counterweight is the contest.

### silver-anchor B (The Pot) — 2/5, cut
- Same copy-minting hole as the Jackpot. Sponsor ("the pot pays its cost, as far as it goes") either pays the rest from your pile (spending to use a space) or is undefined. Grand Host ("Once per game: take the pot") is High Roller. One pot, at most, and Gold's is better placed.

### silver-outsider A (calls the contests early) — 3/5, fix; one home only
- **Broken card, Hecklers** ("Rivals can't score early a contest you hold any of"): one player holding 1 of each color blocks every call at the table, and the whole color goes dead. Calls already need the caller to lead; the defense is leading. Cut it.
- **Broken at 2p, Runner-up** ("At round end, +1 follower per contest where you're second"): at 2p second place is "lost it", so it pays +2 a round for nothing. Cut or "second, within 2 of the leader".
- **Toast in round I** ("Score half of a contest you lead now"): after the setup draft, a player whose drafted color is unique already leads it, so the first pick of the game scores a contest before anyone has played.
- Last Call leading 2 at 2p is the whole round III prize pool plus freed piles. Trim to "one contest you lead, scored double" as the pitch itself offers.
- Good property: a called contest is over, so no repeat payout and no loop.
- Same mechanic as white-anchor A: only one color can own it.

### silver-outsider B — 2/5, cut
- Keep Up is white-outsider's Keep Pace word for word. Grand Host ("Silver spaces you take give you twice the silver") doubles High Tide to about 20. Four of six spaces are matches. silver-anchor A does the giving color better.

### yellow-anchor A ("Your cult is your harvest") — 3/5, fix
- **Body bloat:** "members" counts bodies, so Bumper Crop ("Each of your members brings you 2 of its color") on a Red cult with Mob (5) + Panel (3) + Twins (2) + two singles pays 24 red, plus the red contest. Feast ("+1 follower per member you have of another color") pays the same cult 10 followers with no buy, on a ring II space. Fix: count member cards, not bodies ("each member card"), or cap at 10.
- **Copy (fact 1):** Echo right after Bumper Crop copies the taker's chip: a ring I space paying 13–24 in the taker's colors. `copyDoesIt` on Potluck and Bumper Crop.
- Chefs and Orchard re-fire on swaps (Chefs at 6 is an Even Swap target for the Panel/Promote crowd). Granary ("+1 follower per resource in your second-largest color") pays the hoarder twice, uncapped. Diplomat is tie herd.

### yellow-anchor B ("Even out") — 2/5, cut
- Even Out ("Raise one of your colors to match your largest") on an empty color is "double your largest", the same arithmetic as Gold's widened Double Down and Gold Standard. Only one color gets the doubling verb, and Gold had it first.

### yellow-outsider A ("Dye") — 4/5, survives with fixes
- **Abuse:** Pour all into gold, then a widened Double Down: ×3 on one stack. Pour then Chameleon ("At round end, your yellow also counts toward one other contest"): one pile wins two 6-follower contests in round III. Chameleon is also the "which pile counts where" display problem. Fix: cut Chameleon (or replace with a plain capstone body).
- **Rules gap:** Fade ("Up to 3 of a rival's resources of one color turn yellow") isn't a steal, so Lie Low and Bodyguard don't stop it. Decide: either it obeys "can't be stolen from" or Colorfast is the only shield. I'd make it obey.
- Dyer ("When recruited: turn any of your resources into one color") is Cory's Launderer, which is already on the guest list: one home only. Melting Pot must count cards, not bodies. Tiebreaker is tie herd.
- Copies are clean: Pour and Fade change piles, so they're "redo" under the live rule.

### yellow-outsider B ("Spotlight") — 1/5, cut
- Spotlight and Barker double a contest for whoever leads it: you pay a rival 2/4/6 to make your point, which is kingmaking, and the leader spotlights their own lead, which is win-more. Fails the walk-away test (pays at round end). Match is the fifth "tie the leader" space tonight.

### white-anchor A (take the prize early) — 3/5, fix; preferred home for contest timing
- **Abuse:** Take the lead ("gain enough to lead it by 1, at most 5") then Cash a lead next turn strips a rival's held prize in two placements, and with Crunch Time or Head Start in between the rival can't answer. "Nothing is taken" is not how it feels: they held all round and got 0. Fix: Take the lead gains "to tie", not "to lead by 1" (a tie can't be cashed, so the holder can answer).
- **Holdout** ("Rivals can't take early a contest you hold any of") has the Hecklers flaw: holding 1 of each color shuts White down. Cut.
- Even odds is tie herd. Arbiter is yellow's Chameleon.
- Crown and Magistrate re-fire on swaps, but each contest can be cashed once a round, so the loop is bounded. Good.
- Engine: one flag per rim per round. Cleanest of the three contest-timing pitches; if it goes here, silver-outsider A and purple-outsider 1 are dead.

### white-anchor B (followers on members) — 2/5, cut
- Shake Down a 2-cost card carrying 8 followers: pay 2 or lose 8. Promote or Demote a rival's piled card into the shop, then Open Door it. That's "straight up losing" big chunks before round III, against "crazy bad only in round III". New tracked state on every card, and three spaces are one verb at three sizes.

### white-outsider A (catches up) — 3/5, fix
- **Sandbagging line:** hold everything (contests pay, so you're not poor), stay low on followers, pick first in round III, take Last Laugh ("Your follower buy this turn gives that many again, up to how many you trail the leader by") for +10, with Nest Egg ("white you spend buying followers counts double") on the way. The hoarder looks behind and is rich.
- **Stacking:** Windfall ("…gives that many again") plus Last Laugh on the same buy: 10 → 30? And with Buy twice or Spree, is it "your follower buy" or every buy? Pick one: "your next follower buy this turn", and they don't stack.
- **Body bloat:** Lean Years ("+1 follower per member you have fewer than the rival with the most") against a Mob/Panel/Retinue cult of 12 bodies pays 10 followers on a ring II space. Count cards, cap at 5.
- **Loop:** Tall Poppy ("On Recruit: the leader loses 2 followers, and you gain 2") re-fires on every swap and take (fact 2). A Red player cycles it with Even Swap: −2 to the leader each placement. Cut, or make it a game-end card.
- Nest Egg is a follower price cut; the anchor seat cut the same idea for that reason.
- Untouchable ("You never count as the leader") needs one defined word, "the leader", shared with Robin Hood and the White spaces.

### white-outsider B (ties the leader) — 2/5, cut
- Dead Heat ("raise each [of two colors] to tie the rival who holds the most") is 9–13 resources plus two spoiled 6-prizes: a gain and a theft at once, about double the band. With Tiebreaker it wins both. Photo Finish is +12–20. Keep Pace is the herd card (Keep Up, Match, Take the lead, Upstage). It also makes every leader hold, the slowest possible table.

### blue-members A ("Every extra buy pays") — 4/5, survives with fixes
- **Product combo:** Bulk Buyer ("Each turn, +1 follower per buy after your first") with Shopaholic ("You can always buy twice") makes every turn's second buy a 1-follower pack for 1 resource that pays 2: about +9 over rounds II–III. At 3p the 37-card deck shows nearly everything, so both appear. Fix: "+1 follower per member you buy after your first" (packs don't count). Rename: "Bulk Buyer" is a live White card.
- **Plus-One** ("Recruit: buy again this turn") is Open Door's natural pick at 2 and re-fires on Mentor, Panel, Doppelganger: each is a free buy. Bounded (one copy), fine at 2.
- **Doorbuster** ("Round start: you may buy once before anyone places") is a buy outside your turn: Plus-One's "this turn" has no turn there. Cut, as the pitch half-expects.
- Recluse can't be both here and in white-outsider A (Cory: "Recluse not in blue").
- Insider is a standing Claim; mild, and the live engine already has the flag (`pileReach`).

### blue-members B ("You set the row") — 2/5, cut
- Tastemaker ("look at the top 10 of the pile; choose the 7 that come out") at 3p reads a third of the remaining pile twice a game; with Doorbuster you buy first from the row you built. It doesn't say where the other 3 go. Snob and Curator count blue bodies (Window Dresser 2, Entourage 3), so they're luck plus bloat. Gatekeeper and Window Dresser are Blue's two round I actions on cards, a variation pair.

## Herd collisions: one home each
- **Contest timing:** White (white-anchor A, "then it's over"). Cut The Count; silver-outsider A goes if White takes it.
- **Shared pot:** Gold (gold-outsider A) or nowhere. Never Silver too.
- **"You win ties":** none in a color. The guest version is with Cory; his Oct 16 call is "ties all score".
- **Doubling:** Gold only (widened Double Down). Yellow's Pour (+50%, one color) stays distinct only if they never multiply each other; flag Pour + Double Down.
- **"Your round-start effects now":** one color, resources only (never extra turns).
- **Tie or match the leader** (Keep Pace, Keep Up, Match, Take the lead, Upstage, Dead Heat): at most one card on the board.
- **Catch-up on the follower gap:** White (outsider A) owns it; cut Punch Clock and Long Shot from Purple.
- **Launderer:** guests; cut Yellow's Dyer as a near-copy.

## Top per scope (my seat)
- Gold: gold-anchor A, 3 (4 with Speculator and Midas cut and Double Down widened). gold-outsider A is close behind if its copy hole and High Roller are fixed.
- Purple: purple-anchor A, 3, only after cutting Errand Runner and Double Shift and limiting Fast Forward to resources.
- Silver: silver-anchor A, 4.
- Yellow: yellow-outsider A, 4 (cut Chameleon, Fade obeys theft protection).
- White: white-anchor A, 3 (Take the lead gains to tie; cut Holdout).
- Blue members: deck A, 4 (Bulk Buyer counts members only, cut Doorbuster).
- Magenta members and guests: already with Cory; see their critiques.

## The one thing not to let through
**The copy rule mints from the bank.** Any space that takes from a pot or reads the taker's own state (Jackpot, Skim, Dividend, Bumper Crop, High Tide, Fast Forward), or pays only followers (contest calls, Patience, Last Laugh, Lean Years), copies at the taker's number unless it is flagged to be redone by the copier. Unflagged, Green's ring I Echo becomes a second round III anchor. Every survivor ships with its copy behavior stated.
Close second: nothing that pays a contest twice (The Count), and no stacked "take your next turn now" that lets one player take every round III anchor.
