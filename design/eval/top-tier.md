# Top tier and the big-followers target

> Since this was written (2026-10-14): follower buys need no colors at all (Cory), and the last 10→10 is the game-end clock, not 8→6 (Claude's gut call under Cory's go-with-your-gut). The measurements below were taken with the color rules and 8→6 as the clock.

2026-10-14. The brief: member costs ×2; follower buys 2→1, 4→3, 8→6 (3+ colors, limited) and a new 10→10 (4 colors, limited, supply 4); gold counts as any color. Then tune limits and tier details until the pure "big followers" strategy wins about 25% of 4-player games (15–30% band), with about 6–7 members per player, and a good engine still beats it.

## What's built
- Costs: all 158 member defs (11 spheres plus guests) have even costs, so ×2 is applied everywhere. Average cost is 6.1 and the most expensive is 12.
- TIERS (core.js): 2→1; 4→3 (2 colors); 8→6 (3 colors, 2 per player, so 8 at 4 players; this is the clock); 10→10 (4 colors, 4 per game).
- Gold-wild fix: the buy options already counted gold as any color, but the default payment plan (`followerPlan`) didn't. With 9 gold and 9 red it showed no plan for the 6-follower buy, even though the buy was legal. The plan now lets gold cover missing colors. rules.test.js is updated.

## Method
- Harness: a scratch copy of src/engine/v4. Variants are applied at runtime by replacing TIERS or scaling member costs. Default table (gold, red, blue, green), Release on, guests on.
- Seat 1 plays pure big followers: it never recruits and uses `chooseFollowerBuyerMove`, the normal bot's own scoring with members switched off. The other 3 seats are bots. The buyer's seat rotates.
- A win means finishing first under the real tiebreak (ties go to the player with more members). "Members" is the average number held by the non-buyer seats.
- 95% Wilson intervals. n = 200 per variant unless noted.
- Two other buyer styles did worse, so the bot-scored buyer is the strongest version of the strategy:
  - saver (always takes 10→10 or 8→6, otherwise holds): 5.5% [3–10]
  - eager (always buys the biggest tier it can afford): 0% [0–2]

## Numbers (instrument named on each line)
Shipped rates:
- **Repo script** `v4-big-followers.mjs` (live tree, 3 normal bots), n = 400: **11.2%** (ties split)
- 3 normal bots, n = 400: **9.8% [7–13]**; 3.4 members per player (winner 3.7)
- 3 easy bots, n = 400: **79.8% [76–83]**; 7.9 members per player
- 4 normal bots, no buyer (control): 2.8–3.4 members per player
- Thinking bot (6 rollouts) + buyer + 2 normal bots, n = 120:
  - thinker wins 48% [40–57]
  - buyer wins 6.7% [3–13]
  - thinker finishes above the buyer in 75% [67–82] of games
  - thinker holds 4.5 members
- White/Trading table (gold, red, trading, green), 3 normal bots: **6.5% [4–11]**; 4.0 members per player. Buy Low and Boom don't rescue pure buying, because the bots use them too.

Allowed levers (supply and tier details), against 3 normal bots:

| variant | buyer win | members/player |
|---|---|---|
| 8→6 supply 3/player | 8.5% [5–13] | 3.3 |
| 8→6 supply 1/player | 11.0% [7–16] | 3.4 |
| 8→6 unlimited, 10→10 as the clock | 8.5% [5–13] | 3.1 |
| 10→10 supply 8 | 6.0% [3–10] | 3.2 |
| 10→10 supply 2 | 10.0% [7–15] | 3.5 |
| 10→10 unlimited | 5.5% [3–10] | 3.0 |
| 10→10 needs 3 colors | 6.0% [3–10] | 3.4 |
| no 10→10 tier | 7.0% [4–11] | 3.9 |
| 10→10 as the clock, 8→6 limited but not the clock | 11.0% [7–16] | 3.3 |

Off-limits levers, measured only to show what the target would need (3 normal bots):

| variant | buyer win | members/player |
|---|---|---|
| 8→7 | 10.0% [7–15] | 3.4 |
| 10→12 | 7.0% [4–11] | 3.4 |
| 10→14 | 9.0% [6–14] | 3.2 |
| 8→7 and 10→12 | 10.5% [7–16] | 3.3 |
| member costs ×1.5 | 11.0% [7–16] | 4.0 |
| member costs ×1 | 2.0% [1–5] | 6.9 |

Pricier comparison set (3→1, 5→3, 8→6, 10→10; not shipped):
- 3 normal bots: 7.0% [4–11], 3.6 members per player
- 3 easy bots: 73.5% [67–79], 7.9 members per player

It moves nothing compared with the shipped rates.

## What the data says
1. **The tier ladder isn't a lever.** Across 13 ladder variants, the buyer's win rate against normal bots stays between 5.5% and 11%. The tiers are shared, and the normal bots already buy followers heavily (about 8 buys of 4→3 per game). Anything that makes buying better helps the bots as much as the buyer. What separates them is the 3 or so well-chosen members the bots hold.
2. **The win rate is set by the opponents.** It is 80% against easy bots, which recruit everything, and 10% against normal bots, which recruit selectively. The 15–30% band sits between those two instruments. It can't be reached with Cory's rates on either instrument by changing supply or tier details.
3. **6–7 members per player and a 25% buyer can't both happen on the normal-bot instrument.** Members reach 6.9 only at ×1 costs, and then the buyer wins 2%. At ×2 the normal bot recruits 3.4.
4. **A good engine does beat big followers:** the thinking bot finishes ahead of it 75% of the time. That part of the target holds.

## Clock recommendation
Make the 10→10 tier the clock, not 8→6. With 8 in stock, 8→6 sold out in only 2.5% of games (10/400) and never ended a game early. The 10→10 stock of 4 sells out in essentially every game. As the clock it ends about 5% of games after round II (9/200), and the buyer's rate is unchanged (11.0% vs 9.8%). Not shipped; this is Cory's call.

## Recommendation
- Keep Cory's rates. The supply levers move nothing measurable, so I left the stocks as built (8→6 at 2 per player, 10→10 at 4).
- Judge the 25% target with a human-like opponent, or with a bot whose recruiting sits between easy and normal (the bots agent's levels). Against today's normal bot, pure buying is a weak strategy (about 10%), which already meets "a good engine beats it".
- The open risk is the opposite one, against loose recruiters: pure buying wins 74–80% against easy bots. A first-time human table may look like that, so a blind tester should play the pure buyer against a casual table.
