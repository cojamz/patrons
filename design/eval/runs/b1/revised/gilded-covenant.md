## Gold: The Gilded Covenant (Tithers)
Pitch: Wealth is the true faith.
Verbs: gain, sponsor (mark a space), trade
Scoring: The Coffers. At round end, whoever holds the most gold (at least 1) gains followers: I 1 / II 2 / III 3. On a tie, only the tied player with the fewest followers gains; if they are still tied, no one gains. Game total at most 6.
Emits: gain (gold, often 3+ at once), give (Patronage), mark a space, hold the most of a color
Consumes: buy an item (recruit: Collection, Almoner), rivals taking spaces (Patronage), rivals' resource counts (Covet, Coffers tie), member count (Tithe, Banker)

| Ring | Action | Effect (≤14 words) |
|---|---|---|
| I | Tithe | +2 gold, +1 per 2 members you have (max +3). |
| I | Patronage | +2 gold. Mark an open empty space; its first rival taker: both +1 gold. |
| I | Indulgence | Trade 0-3 resources for gold one-for-one, then +2 gold, +1 per round after I. |
| II | Covet | +3 gold, +1 per rival who held more gold than you (max +2). |
| II | Collection | +3 gold, +1 per 2 members rivals recruited this round (max +2). |
| III | Jubilee | +5 gold, +1 per 3 gold you held (max +4). |

| Member | Cost | Effect (≤14 words) | Extra followers |
|---|---|---|---|
| Fickle Donor | 2 | Your turn: release it for 3 gold. It leaves the game. | 0 |
| Tithe-Taker | 4 | Whenever you gain 3+ gold at once, gain 1 more (max 2 per round). | 0 |
| Moneylender | 3 | When you recruit a member, your gold pays as any color. | 0 |
| Almoner | 4 | Whenever a rival recruits a member, gain 1 gold (max 2 per round). | 0 |
| Banker | 5 | At each round start, +1 gold per member you have (max +4). | +1 |
| Gilded Prophet | 5 | At game end, +1 follower per gold you hold (max 3). | +1 |

Notes:
- Core tension, unchanged: gold is both the Coffers score and your most flexible currency (Moneylender). Every recruit paid in gold costs you Coffers standing. Gilded Prophet resolves this at game end at 1 gold per follower, capped at 3. Order at game end: Coffers III resolves first, then Prophet. Prophet reads gold and does not spend it.
- Cost colors (print on the card frame): members cost the stall's own color; fixtures take any colors. Moneylender changes only how you pay. It never opens another stall.
- 'At once' means one gain from one source. Each action effect is one gain, including Covet's and Collection's bonuses. Banker's round-start payout and Donor's release are each one gain. Indulgence's trade is not a gain; only its bonus gold counts.
- Patronage: one mark per space, on a ring that is already open. The marker can't take their own marked space. The mark clears when the first rival takes the space, or at round end. With no open empty space, just +2. There is no expiry refund. The mark is a token on the wheel, and the UI highlights the likely takers (L5 warn).
- Indulgence pays +2 gold in round I, +3 in round II and +4 in round III, so this round-I space keeps scaling.
- Covet compares gold held before the action. A rival tied with you doesn't count. In 2 players the max is +1 (3-4u); in 3+ players it is 3-5u.
- Collection counts members rivals recruited since the round began, including cross-stall buys, but not sways. Almoner uses the same rule. Halving the count brings back the table read: you have to wait for 2 or 4 recruits.
- Jubilee counts gold held before the action. Its value is 5u at 0 gold, 7u at 6 and 9u at 12+. The hoarder gets the most from it, and a first picker with little gold still gets a fair 5-6. Tithe-Taker can push it past the max (+1).
- Fickle Donor stops counting as a member as soon as you release it. It leaves the game, not the stall, so it can't be looped. Its follower is lost at round end (banked, L10).
- Coffers ties: the tied player with fewer followers wins, which turns tie-sniping into catch-up and points the loss at the leader. Total stays within the 6-7 contest budget.
- Values (u): Tithe 2-3 early, 4-5 late. Patronage 2-3: 3 when the mark lands, which is near-certain on a round-I ring in R1; the spill adds 1u to the actor and 1u to the rival. Indulgence about 2.3/3.3/4.3 by round, plus the trade. Covet 3-5. Collection 3-5. Jubilee 5-9.
- Members (price / EV incl. 1.5u per follower):
  - Donor 2 / ~3 = 67%.
  - Tithe-Taker 4 / ~6.5 (about 5 capped triggers + 1.5) = 62%.
  - Moneylender 3 / 3.5-5 = 60-86%. Fragile: its value depends on which stalls are on the wheel.
  - Almoner 4 / ~6 bought in R1 (2+2+2 gold... about 5-6 + 1.5 = 7) = 57%; bought in R2 about 4+1.5 = 5.5, so 73%.
  - Banker 5 / ~8-9 in R1 (max 4 per round start) = 55-62%; 67% in R2.
  - Gilded Prophet 5 / ~7.5 (3 from its 2 followers + up to 4.5 from the hoard) = 67%.
- Hoard ceiling: Coffers 6 + Prophet 3 + Prophet's own 2 = 11 followers from one lane. That is down from about 14, and only the gold leader gets all of it.
- Silo index ~0.7, at the flag line. Patronage, Covet, Collection, Almoner and the Coffers tie key off rivals; Tithe, Indulgence and Jubilee are self-contained.
- Known cross-sphere risk: with a taking sphere on the wheel, the gold hoard is the most visible target. Covet pays the looted player back. Watch this in the set eval.
- Stall: 6 one-copy members ran dry by R2 move 8 in mind-play. Raising Tithe-Taker's price and halving Collection should slow gold buying. For the set/market eval: try 2 copies of each 2-3 cost member, market-wide. Not patched here, because of L7.
- Lints: L1 pass (counted: Tithe 10, Patronage 14, Indulgence 14, Covet 12, Collection 12, Jubilee 10, Donor 10, Tithe-Taker 13, Moneylender 11, Almoner 13, Banker 11, Prophet 10). L2 pass. L3 pass. L4 pass. L5 warn: mark token, per-round rival-recruit counter, and cap trackers for Almoner and Tithe-Taker. Donor's pending state is gone, but its delayed follower loss remains. L6 pass. L7 pass. L8 pass (floors: Patronage 2, Covet 3, Collection 3, Jubilee 5). L9 n/a. L10 pass.