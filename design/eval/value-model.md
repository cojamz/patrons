# Value Model v2

> **Superseded for pricing (2026-10-14).** Keep it as a rough ruler for actions; don't price members from it.
> - Rates changed: follower buys take any resources at 2→1, 4→3, 8→6 (stock 2 per player) and 10→10 (stock 4, the clock); member costs doubled, so a unit here is about half a member-cost point. Plain "worth N" members kept their old price. "Fixtures", Laurel, Garland and Diadem are retired words: say "buy followers".
> - "Take only from players ahead of you" no longer holds: most steals hit any rival.
> - Members are now priced by measurement: `scripts/v4-member-value.mjs` (hand one member to one seat, compare) and the fair-price screen `scripts/v4-fair-price.mjs` (every card at once, then outliers), plus the dead-window audit's systemic rules (design/eval/cory-notes-2026-10-14.md §4). Name the instrument with every number.
> - Cory's anchors still rule.

These are rough, shared numbers so prices and yields can be argued with arithmetic instead of vibes. They'll be refined when a simulator exists. Until then they're a ruler, not the truth.

## Cory's anchors (these override everything below)
Calibrate from his calls, not from this model. When they disagree, he's right and the model is wrong.
- Cash Out: 2 gold for 1 follower. So in his head a follower costs about 2 resources, not 3.
- 4 resources for a member worth 2 followers is "too expensive". A member takes your one buy, so its follower rate has to beat 2:1 clearly.
- Joint Venture: +3 gold, +1 to another player (a solid round-I space).
- Banker: +3–4 gold every round start (a solid workhorse member).
- Bribe: 4 gold to take a rival's member, once per round.
- Steal: 3 gold from players (a round-II space).
- Too strong: +3 resources plus a free swap; an extra recruit plus +2.
- Fixtures (Cory, 2026-10-12): Laurel 2→1, Garland 4→3, Diadem 6→6. He says something still feels off.

## Units
- **1 resource = 1 unit (u)**, any color. A flexible resource ("any color") is worth 1.2u, and a specific off-color one is worth 0.9u.
- **1 Favor ≈ 1.5u.** The fixtures set the rate:
  - Laurel: 2u for 1 Favor (2.0 per Favor).
  - Garland: 5u for 3 Favor (1.67 per Favor).
  - Diadem: 8u for 6 Favor (1.33 per Favor).
  - Bigger buys are more efficient, which pulls the game toward saving up.
- **Tempo.** Taking an extra placement or acting earlier in the snake is worth about 1u. Sharing an occupied space is worth about 0.5u, as option value.
- **Information and flexibility** ("buy from any stall", "pay in any colors") are worth 0.5–1u each time they're used.

## The game's budget (4 players)
- Each player gets 3 + 4 + 5 = **12 placements**.
- Expected value of one space, by ring:
  - Round I: **about 2.5u** (band 2–3).
  - Round II: **about 4u** (band 3–5).
  - Round III: **about 7u** (band 5–9). This is the burst.
- Total income for a decent player is **about 45–55u** across the game, plus 2 at setup.
- That works out to roughly 4–6 items, plus 2–4 fixtures.

## Members (items) under the Cult Wars frame
- Every member counts as 1 follower (that's 1 VP, about 1.5u) on top of its ability.
- So a member's price ≈ 1.5u plus 50–70% of the ability's EV.
- A 2-cost member with a decent ability beats the Laurel fixture (2u for 1 follower). That's intended: recruiting should be the main path, and the fixtures should be the bulk path for big late hauls.
- Fixtures therefore need to be more efficient than members only at the high end. Garland and Diadem are where saving up pays off.
- Releasing a member gives up its follower (−1.5u), so whatever releasing it buys must beat that.

## Pricing items
- Expected value (EV) of an item = value per use × expected uses for the rest of the game, assuming it's bought at the start of round II, so 9 placements remain.
- Healthy price = **50–70% of EV**:
  - Below 40% is an auto-buy.
  - Above 90% is a trap.
- **Payback** = price ÷ value per round. The sweet spot is 1–2.5 rounds.
- Items that also carry Favor get Favor × 1.5u added to their EV.
- Trigger items fire on rivals' actions. To count their uses, assume at 4 players that each rival does any common thing (buy an item, gain 3 or more at once, echo) about 4 times a game, so roughly 12 triggers. Each trigger is worth about 0.5u once you allow for timing.

## Spillover
- Give X to every rival at 4 players and the table gains 3X.
- An action that spills must give its actor at least 1.5u more than it would without the spill.
- Keep the spill ratio (rivals' total gain ÷ actor's gain) at or below 1.

## Ring contests (seasoning)
- A contest worth F Favor per round counts for about F × 1.5u, multiplied by the chance of winning it.
- Contest totals across the game should stay at or below about 25% of the Favor a winner usually ends with. A typical winner ends with about 20–26 Favor, so a contest should total at most about 6–7 Favor over the game.

## Shared vocabulary (generic verbs any quadrant may use)
These are the signals quadrants emit and consume without naming each other:
- gain;
- give;
- trade;
- take (only from players ahead of you);
- echo (repeat or copy);
- buy an item;
- buy a fixture;
- share a space;
- mark a space;
- hold the most of a color;
- set (one of each color);
- round start / round end;
- ahead / behind (in Favor);
- the leader.
