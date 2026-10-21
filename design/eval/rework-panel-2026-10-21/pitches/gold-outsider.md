# Gold, from the outsider seat (rework panel, 2026-10-21)

**All card texts and numbers are Claude's fill-ins, not approved.** Names are placeholders; Cory names cards.

Scope: Gold actions and members (live: src/engine/v4/content/gold.js). Seat: an experienced worker-placement designer seeing the color fresh. No sims, no games; arithmetic from pricing.md and the live rules.

## What the table lacks after Red, Green, Magenta and Blue

- **On the Classic table (Gold, Red, Blue, Green), nothing touches piles.** Red moves members, Blue churns the shop and multiplies buys, Green copies spaces. Magenta, the one color that acts on piles, isn't on Classic. So on every Classic table the holding half of "hold or spend" is private. You hold, I hold, the round ends, and nobody's move changes what anyone else is sitting on except Collect Debts.
- **Every reworked color hits a rival's stuff directly** (take, swap, copy). No color gives the table a *shared* thing that everyone's placements build and one player cashes. That's the oldest interaction in worker placement: a space that grows until someone takes it. Cory has said yes to it twice (Bandwagon, Catch Up 1/2/3: "spaces that grow during a round, with the risk of losing them").
- **The round III anchors are the game's catch-up** (fewest followers picks first). Every live anchor is best for its own specialist. None is built to be *the trailer's* pick.
- **Gold is half of the 2-player game.** Against Red, Gold has to give the Red player reasons to watch the Gold player's moves. Today, Golden Years and Double Down don't touch Red at all.
- **Gold's old identity is now the base game.** "Gold counts as any color in follower buys" became "every resource buys followers 1-for-1", and "most held wins" became every contest. What's left is doubling and Collect Debts.

So the outsider's question isn't "how should a hoarder work". It's what one Gold placement can do so the other three players look up from their own cults.

---

## Concept A: The Jackpot (a pot everyone builds and one player takes)

**Identity in one mechanic:** Gold spaces feed a shared pile of gold sitting on Gold's round III space. One round I space drains it. Round II pays out what's in it without emptying it. Round III takes it all. It isn't Red's (members), Green's (copies), Magenta's (taking from a rival's pile: the pot belongs to nobody) or Blue's (the shop). Nobody owns the pot. It grows on the board in plain sight, the same way the round III spaces work as catch-up.

**The color rule, printed on the round III space:** "Every other Gold space taken puts 1 gold here." The gold comes from the bank: nobody pays to use a space. On screen it's a coin pile with a number on the Jackpot space. On a table it's coins on the board.

### Actions (each ends +1 gold)

- **Round III, Jackpot:** "Take all the gold here. +1 gold."
- **Round II, Dividend:** "Gain gold equal to the gold on the Jackpot. +1 gold." (The pot stays.)
- **Round II, Collect Debts** (Cory's card, kept): "Take up to 3 gold from rivals, split however you like. +1 gold."
- **Round I, Stake:** "+1 gold × round, and 1 more gold onto the Jackpot. +1 gold."
- **Round I, Skim:** "Take 1 gold × round from the Jackpot. +1 gold."
- **Round I, Kickback** (Cory's card, renumbered): "+1 gold × round, and +1 gold to a rival you choose. +1 gold."

### Arithmetic

How the pot grows at a full table (every Gold space feeds 1 when taken):
- Round I: Stake +2, Skim +1−1, Kickback +1, so **3** at round I's end. Round I fills by rule, so all three get taken.
- Round II: Stake +2, Skim +1−2, Kickback +1, Dividend +1, Collect Debts +1, so **+4 → about 7** (about 6 at 2 players, where 4 of the 5 Gold spaces get taken).
- Round III before the Jackpot goes: +0–3. The trailer picks first, so it usually goes early.
- It doesn't depend on table size, because it counts Gold placements, not players or colors. That matters, since Gold sits on every Classic table.

What the taker walks away with:
- **Round I** (band 2–4): Stake, Skim and Kickback each give **2**. Side effects: Stake fattens the pot by 2 in all, Skim leaves it flat, Kickback hands a chosen rival 1.
- **Round II** (more): Stake/Skim/Kickback **3**. Dividend **about 4–7** (the pot at 3–6, plus 1). Collect Debts **4**, plus 3 off rivals, so it counts twice.
- **Round III** (band 8–12): Jackpot **about 8–11**. Ring I spaces **4**, so still worth taking. Collect Debts 4. Dividend is strong only *before* the Jackpot goes (see self-critique).
- The Jackpot's gold lands in your pile in round III, so it also swings the gold contest (6). That's the burst. Compare: Recruit a Member taking Mob is worth about 13 in round III.

Round II bar: Dividend changes how much you buy (4–7 resources, sized by the board) next to Promote (an upgrade worth about 3.5) and Shake Down (a member of 5 or less, or its cost). Collect Debts is the Classic table's only pile check, and it's his.

**Contest:** most gold held (default). The pot isn't anyone's pile until it's taken.

### How it touches the board (generically)
- **Every Gold placement is a public choice.** Stake feeds the trailer's round III prize, Skim starves it, Kickback hands a rival you pick 1 gold. A leader who has to take a Gold space in round I (it fills by rule) picks Skim or Kickback. A player behind picks Stake.
- **Turn order:** fewest followers picks first in round III. The player who held resources all game instead of buying followers is low on followers, so they take the pot. The hoarder's reward comes through the catch-up rule, not a printed condition.
- **Copying:** an action that copies Dividend pays the pot again. That's fine, since every round II space is designed for two players. A copy of the Jackpot after it's taken finds almost nothing, so it limits itself.
- **Moving members:** an On Recruit that touches the pot (Bagman below) fires again when another color moves the card. That's fuel for the mover, and every move drains the pot.
- **Taking and extra buys:** a fat gold pile right after the Jackpot is a target for half-a-stack theft. An extra buy lets the taker spend the pot that same turn (a pack tops out at 10).

### Deck (10)

| Card | Text | Cost | Worth | Why this price |
|---|---|---|---|---|
| Heirs | "When recruited: put 1 gold on the Jackpot." | 1+0 | 2 | Cheap body and Open Door bait. Its gift feeds a shared prize, about 0.35 to you. Ratio about 1.5 in round I. |
| Miser | "You win ties for the most gold." | 1+2 | 2 | Bends one rule (ties split). About 2–3 a game for a gold contender. Light colored part so others can buy it. Ratio about 1.35. |
| Bagman | "When recruited: take half the Jackpot, rounded up." | 2+2 | 2 | The color's verb on arrival. The pot mid-game is 4–8, so 2–4 gold. It's also the leader's tool for starving the trailer. Ratio about 1.15. |
| Treasurer (keep) | "When recruited: gain gold equal to your member count." | 4+0 | 1 | Cory: "really good". 5 gold in round II, about 8 in round III. Watch for an auto-buy in round III. |
| Banker (keep text) | "Now and at round start, +3 gold." | 3+3 | 1 | "Too dear" at 8. The 2X rule gives 6: 1.5 in round I, about 1.0 in round II. |
| Penny Pincher (keep text) | "Gold you spend on members counts double." | 4+2 | 1 | "Good, could get a little crazy". Doubles about 8 gold of member buys in a gold cult. Up from 4 to 6, about 1.2. |
| Tycoon (keep text) | "Game end: +1 follower per 2 gold." | 2+3 | 1 | Scorer. Pays 4–6 to a committed holder, 2–3 to a dabbler (a loss). Moved toward "any" so others can splash it. |
| Underdog (keep) | "While anyone has more gold than you, your gold gains are doubled." | 5+3 | 1 | "Likes it, interactive." Plays off rivals. **Flag:** it doubles the Jackpot for a trailer (up to about 20). The price stays 8, and the combo is a bonus that's rarely seen together (about 15–25%). |
| Launderer (Cory's idea) | "When recruited: change any of your resources into other colors, one for one." | 3+5 | 2 | Fits any build: snipe a contest, unlock a colored part. Priced for round III (one or two contests swung, about 6–10). Gets moved for its On Recruit. **Flag:** it could be a guest instead. |
| High Roller | "Once per game, on your turn: take the Jackpot." | 6+3 | 1 | Capstone, a timed one-shot you choose when to fire. 8–10 gold plus denying the round III taker. About 1.0 at 4 players, higher at 2. |

Prices 1, 3, 4, 4, 6, 6, 5, 8, 8, 9 (centred about 5.4). Followers 14. Nothing counts copies of its own color, so every card stands alone (deck-visibility.md: plan for 3–5 owned).

Cut from live: Prospector, Alchemist, Speculator, Tax Collector, Merchant. Prospector and Speculator are kept in B. Alchemist, under +1-per-action, fires on almost every non-gold action. Tax Collector fires about 12–18 times at 4 players and about 6 at 2 (count the triggers), so it's too table-size dependent for a color on every Classic table. Merchant is a rival-turn drip.

### Self-critique
- **Specialist.** Round I: take Stake while behind, then hold gold for the contest and stay low on followers. Round II: Dividend for 5–7. Round III: pick first and take the Jackpot (about 9) plus the gold contest. A clear plan, and it pulls against Red's "spend on members".
- **Rival.** The Red player at 2 players has to place on Gold in round I (it fills by rule). Skim or Stake is a real decision about who the pot is for. In round III they can't hold the trailer seat while buying members, so they lean on Bagman or High Roller to starve the pot.
- **Newcomer.** Readable at a glance: a pile of coins on a space, and "someone gets that". Of everything here, this needs the least explaining.
- **2 and 4 players.** The pot counts Gold placements, so its size is about the same at any table. At 2 players the trailer wins the pot about half the time, and the other player gets two picks in a row right after. At 4 players more seats are fighting to be "fewest followers", which suits a catch-up anchor.
- **Cory (rubric v3, honest).** It passes most checks: walk-away, scales, it's interaction through the board, his growing-space shape, nothing to remember, and a contrarian plan (stay low, take the pot). Risks: "+1 gold × round" three times in round I can read as a template ("slight variations"), since they differ only in where the side gold goes. He may say Dividend is a "gain equal to X" one-shot, like Lottery Winner. The difference is that the pot belongs to nobody, but he may not buy that. He may also call the pot a lottery.
- **Weakest action: Dividend.** In round III it's either as good as the Jackpot (before it's taken) or nearly dead (after). I kept it because round II needs a space sized by the board, and a lean ring II in round III is normal. A trim to "half the Jackpot" fixes the round III overlap but weakens round II.
- **Weakest card: Heirs.** Simple to the point of dull. I kept it because the deck needs a 0–2 body, and it's the one card that makes "feed the pot" a buy decision.

---

## Concept B: Compound (holding grows; round III doubles any stack)

This one is close to the strategist's lean, read from the outsider seat. It's here so the panel can set the two against each other.

**Identity:** your piles grow while you hold them. Round III doubles one stack of any color. That's the only Gold space that reaches every contest at the table, which is how it touches rivals: they have to watch which stack you'll double.

### Actions (each ends +1 gold)
- **Round III, Compound:** "Double one of your stacks. +1 gold." A stack of 6–10 gives **7–11**. Anyone with a stack wants it, so it isn't only the specialist's anchor.
- **Round II, Interest:** "+1 gold per 2 resources you hold. +1 gold." Holding 6–10 gives **4–6**. Holding 15–20 in round III gives 8–11. **Flag:** it rivals the anchor in round III, so Cory may trim it to per 3.
- **Round II, Collect Debts** (kept): **4**, plus 3 off rivals.
- **Round I, Mint:** "+1 gold × round. +1 gold." 2/3/4: the color's plain scaling space.
- **Round I, Kickback** (kept, renumbered): 2/3/4, and a rival you choose +1.
- **Round I, Tribute** (Cory's Oct 10 keeper): "Take 1 gold × round from the rival with the most gold, if they have more than you. +1 gold." 2/3/4 when you're behind on gold, 1 when you're not. It's catch-up keyed to a pile everyone can see, not a rescue clause.

**Contest:** most gold held.

**Touches the board:** Compound on a tied stack decides that color's contest in round III. Interest rewards the opposite of a member-buyer, so at 2 players it's banker against recruiter. A doubled stack is a theft target. Tribute and Collect Debts are the pile checks on Classic.

### Deck (10)
Miser 1+2 (worth 2, as in A) · Prospector (kept) 3+2, up from 4 to 5: under +1-per-action it fires on every Gold space · Banker 3+3 · Treasurer 4+0 · Penny Pincher 4+2 · Underdog 5+3 · Tax Collector 4+4 (kept, **flag** on its 4-player trigger count) · Tycoon 2+3 · Launderer 3+5 (worth 2) · Speculator 5+3, "Once per game, on your turn: double one of your stacks" (the verb on a card, Panel's shape). Prices sit at 3–8 and there's no 0–2 body. Followers 12, so it's thin on bodies; Cory pushes that up.

### Self-critique
- **Specialist:** hold, take Interest, double gold in round III, Tycoon at game end. **Rival:** watches which stack gets doubled. **Newcomer:** "double a stack" is instant.
- **At 2 players** only gold and red stacks exist, so Compound is a gold-or-red choice. At 4 it can snipe any contest.
- **Cory:** double, half and "per X" are his taste, and Double Down is his card. Most likely verdict: "fine, but it's the old Gold". Interest pays holders twice (the contest, then more gold), which is the win-more-adjacent flag from pricing.md.
- **Weakest card: Tax Collector.** I kept it because it's his rewrite, but its value at 4 players is about triple its value at 2.

---

## Recommendation

**A, the Jackpot.** It gives the Classic table what it lacks: a shared prize that every Gold placement visibly feeds or starves, and a round III anchor built for the trailer. It does that without theft, memory or charging anyone. If Cory finds the pot too much like a lottery, keep A's deck and round I, and take B's "Double one of your stacks" as the round III fallback.

---

## Appendix: seeds (12), and why each was cut or kept

1. **The Jackpot** (space: a growing shared pot). Developed as A.
2. **Compound / grow a stack** (holding vs spending; the strategist's lean). Developed as B.
3. **One stack counts double at round end** (Cory's own early idea). Cut: the taker gains nothing this turn, it's hard to show which pile counts where, and his Oct 12 note said "no Crown-specific effects".
4. **Gold is wild in every contest.** Cut: either it's too strong at 4 players (it adds to four contests) or every player needs a choice at round end.
5. **Sweeten a contest's prize** (interaction with rivals). Cut: it fails the round II bar and is win-more on your own lead.
6. **Tolls on rivals' spaces.** Cut: a board action that charges, imposed on others. Same ❌ from the other side.
7. **Reserve a round III space during round II** (tempo). Cut: access without power, Claim's ❌.
8. **Buyout: take a rival's member, they're paid its cost.** Cut: moving members is Red's and Magenta's job, and it's Shake Down inverted.
9. **Gold pays any colored part** (the shop and members; Cory's original core). Cut as the identity: Cory said "one member, not the anchor", and it overlaps Freelancer. Penny Pincher keeps the idea.
10. **Exact change: follower packs of any size.** Cut: it removes members' job as the gap-filler between packs, against the Oct 20 frame.
11. **Cash out without a buy** (holding vs spending). Cut: White's All In, and it pushes buy-followers over members.
12. **"If Gold didn't exist": levy on whoever's ahead.** Cut as the identity, because taking is Magenta's. Kept small as Tribute (B, round I) and Collect Debts (both concepts).
