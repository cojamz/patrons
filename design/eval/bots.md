# Bots: levels, the big-followers target, all-Hard tables

2026-10-15. Every line names its instrument. "vs 3 X" means the pure big-followers buyer sits in one seat and 3 bots of level X fill the others:
- The buyer never recruits and uses Normal's scoring with members switched off.
- Its seat rotates every game. Ties split, and intervals are 95% Wilson.

Two rule sets appear:
- **New rules** (merged from claude/gifted-newton-3lcy3i on 2026-10-14): 10→10 is unlimited, the game always ends after round III, and Classic = gold/red/market/echo.
- **Old rules**: 10→10 stock of 4 was the clock. Kept below for history.

## Summary
1. Levels run Easy < Casual < Normal < Hard. Against 3 Normal, each wins:
   - Easy 13.5% (new rules)
   - Casual 16.0% (new rules)
   - Hard 46–49% (old rules)
   - Parity is 25%.
2. Normal was retuned: it now likes members and weighs the best rival at 0.4, and the old Normal wins 21% against it. Easy is Normal played sloppily. The old greedy Easy hoarded and recruited 11+; it is kept as `chooseGreedyMove` for sims.
3. No hoarding. Seats ending with 50+ resources: 0.0% at all-Easy and all-Normal tables under the new rules, against 2.4% for the old bot.
4. Hard measured 115ms per move on average in headless Chromium, 220ms at worst, never over 300ms. It is capped at 200ms.
5. New rules: pure big followers is below the band. Classic: 10.3% vs 3 Normal, 5.6% [3.8–8.3] vs 3 Hard. Default table: 12–18% vs Easy, Casual and Normal. Old rules had it at 15–21%.
6. The rate tracks how much the table recruits. The buyer wins 27% against loose member-lovers and 91% against the old greedy bot.
7. One rules lever, measured under the old rules: member costs ×1.25 put the buyer at 24.9% with 5.6 members a player. That's Cory's call.
8. Contests are about a quarter of each seat's final followers: ~4% from round I, ~8% from II, ~12% from III. A contest pays 3+ tied leaders 1.6% of the time on Classic, 4% on the default table.
9. Tied leaders splitting the prize (runtime patch) trims contests to ~21% and barely moves the buyer: 7.6% vs 5.6% against Hard.
10. All-Hard tables, new rules, 400 games:
    - Seats are fair (24–25% each).
    - Follower buys are 50% of winners' followers, and spheres share the rest at 2.6–6.4% each.
    - 4.6 members a player.
    - 0.8 extra placements a game.
    - A run of 4+ placements in a row happens in 9.5% of games.
11. Engine crash found by Hard (Stunt Double + Open House stale choice). Repro is in design/eval/bots-repro-open-door.json, sent to the foreman. Hard now survives it; a human could still hit it.

## Levels (src/engine/v4/bots.js)
- **Easy**: Normal's valuation with heavy noise (placements +0–6 followers random, buys +0–4). It undervalues abilities (k 1) and plays pure margin.
- **Casual** (sim only): `blendProfile(0.5)`, halfway between Easy and Normal on every knob. `blendProfile(t)` is the "in-between parameter".
- **Collector** (sim only): loose play plus a member bias of +3 that never fades. Stands in for a table that recruits everything it likes.
- **Normal** (default): end-of-game valuation, plus a member bias of 2 fading to 0.6 by game end, plus spite 0.4.
- **Hard**: Normal plus rollouts (thinker.js). Budget 100, 200ms wall cap in the UI. Rollouts at a round boundary are now scored on the same pure-margin yardstick as finished games.
- `BOT_LEVELS` is unchanged (easy, normal, hard). `SIM_LEVELS` adds casual and collector. The old bot lives on as `chooseGreedyMove`.

Why these knobs: the member-bias and spite sweeps each pitted one variant against 3 old Normals, 400 games:
- old Normal 21.1%
- memberBias 0.75: 32.5%
- memberBias 1.5: 34.2%
- spite 0.4: 32.8%
- memberBias 1.5 + spite 0.4: 37.3%

Against 3 of that, mb 2 / floor 0.3 / spite 0.4 scored 28.2% with 7.3 members. Flat mb 2 scored 31.1%, but with 8.7 members. I took the fading version so Normal doesn't recruit everything. Gains above that were within noise.

## Level ladder, old rules (bot-levels script, n = 400 seats for the lone level, 1200 for the Normals)
| seats | lone level win | members | left (max) |
|---|---|---|---|
| easy + 3 normal | 13.0% ±3.3 | 3.5 | 9.6 (56) |
| casual + 3 normal | 21.5% ±4.0 | 5.6 | 11.8 (43) |
| collector + 3 normal | 23.0% ±4.1 | 8.5 | 14.5 (46) |
| hard + 3 normal (uncapped, n=200) | 46.3% ±6.9 | 6.7 | 12.7 (63) |
| hard (200ms cap) + 3 normal (n=150) | 48.6% ±8.0 | 6.7 | 13.3 (79) |

Tables of one level, old rules (400 games, 1600 seats):
| level | members | left | 30+ left | 50+ left |
|---|---|---|---|---|
| easy | 4.5 | 9.3 | 0.3% | 0.0% |
| casual | 6.1 | 11.6 | 1.2% | 0.2% |
| normal | 7.4 | 13.7 | 4.1% | 0.3% |
| greedy (old easy) | 11.2 | 11.6 | 8.3% | 2.4% |

Half of what's left at the end holds a contest lead ("needed to hold a lead" 5–7 of it).

## Hard speed
Hard's speed was measured on this container, 4 Hard bots, 3 games, 305 place/buy decisions:
- headless Chromium: mean 115ms, p95 205ms, max 220ms, 0 over 300ms
- node, uncapped budget 100: p95 249ms, max 560ms. Hence the 200ms cap. Capped, its strength is unchanged (48.6% vs 46.3%).

## Big followers, old rules (scripts/v4-big-followers.mjs, default table gold/red/blue/green)
| rivals | buyer win [95%] | n | rivals' members |
|---|---|---|---|
| 3 greedy (old easy) | 83.8% [79.8–87.0] | 400 | 11.7 |
| 3 collector | 37.5% [32.9–42.3] | 400 | 9.3 |
| 3 easy | 19.5% [15.9–23.7] | 400 | 5.2 |
| blend 0.25 | 20.9% [17.2–25.2] | 400 | 6.0 |
| 3 casual (blend 0.5) | 16.9% [14.5–19.7] | 800 | 6.8 |
| blend 0.75 | 18.2% [14.7–22.2] | 400 | 7.6 |
| 3 normal | 18.6% [16.1–21.4] | 800 | 8.0 |
| 3 hard (budget 100, uncapped) | 14.6% [11.5–18.4] | 400 | 7.8 |

Across every sensible table, from Easy to Hard, the buyer lands at 15–21%. That is inside the band but under 25%. Skill barely moves it. What moves it is how much the table recruits.

What would move it, old rules (runtime patches in a scratch script vs 3 Normal, n = 400 each; not shipped):
| lever | buyer | members/rival |
|---|---|---|
| member costs ×0.75 | 15.6% [12.4–19.5] | 8.9 |
| member costs ×1.25 | 24.9% [20.9–29.3] | 5.6 |
| member costs ×1.5 | 31.3% [26.9–36.0] | 4.3 |
| 4→3 becomes 4→4 | 22.7% [18.9–27.1] | 7.1 |
| 8→6 becomes 8→7 | 15.8% [12.5–19.7] | 7.6 |
| 10→10 stock 6 | 16.4% [13.1–20.4] | 7.6 |

Member costs ×1.25 is the one lever that lands both targets at once: buyer ~25% and ~6 members a player, close to the 6–7 target. That's Cory's call.

## New rules (after the merge, 2026-10-14 night)
Level ladder (bot-levels script, default table, 400 games):
| seats | lone level win | members | left (max) | 50+ left |
|---|---|---|---|---|
| easy + 3 normal | 13.5% ±3.3 | 2.8 | 7.1 (28) | 0.0% |
| casual + 3 normal | 16.0% ±3.6 | 4.3 | 7.2 (25) | 0.0% |
| 4 normal | 25% | 5.6 | 7.9 (44) | 0.0% |
| 4 easy | 25% | 3.6 | 7.0 (31) | 0.0% |

Big followers (v4-big-followers.mjs, 400 games each):
| table | rivals | buyer win [95%] | rivals' members |
|---|---|---|---|
| default | 3 greedy (old easy) | 90.8% [87.6–93.3] | 11.5 |
| default | 3 collector | 27.0% [22.9–31.6] | 7.7 |
| default | 3 easy | 18.2% [14.7–22.3] | 4.2 |
| default | 3 casual | 12.2% [9.4–15.8] | 5.2 |
| default | 3 normal | 13.0% [10.0–16.6] | 6.3 |
| Classic | 3 normal | 10.3% [7.6–13.6] | 8.9 |
| Classic | 3 hard (budget 100, uncapped) | 5.6% [3.8–8.3] | 8.6 |

Unlimited 10→10 helps the bots as much as the buyer, and the game now always runs three rounds, so engines get their full burst. The buyer fell out of the band: 10–13% against Normal, 6% against Hard.

### Contests and ties (same runs; `state.contests`, the engine's record of each round's scoring)
| instrument | table | buyer | contest share of final followers (I / II / III / all) | contests paying 3+ leaders (I / II / III / all) |
|---|---|---|---|---|
| 3 normal, ties score in full | Classic | 10.3% | 4.1 / 8.5 / 11.9 / 24.4% | 2.3 / 1.8 / 1.1 / 1.7% |
| 3 normal, ties SPLIT (patch) | Classic | 10.6% [8.0–14.0] | 3.3 / 7.4 / 11.1 / 21.8% | 2.3 / 1.8 / 0.8 / 1.6% |
| 3 normal, full | default | 13.0% | 5.0 / 8.8 / 14.3 / 28.1% | 5.3 / 1.8 / 5.1 / 4.0% |
| 3 normal, SPLIT (patch) | default | 12.5% [9.6–16.1] | 3.8 / 7.7 / 11.4 / 22.9% | 5.3 / 1.7 / 5.4 / 4.1% |
| 3 hard, full | Classic | 5.6% | 3.9 / 8.3 / 11.6 / 23.8% | 2.3 / 1.7 / 0.9 / 1.6% |
| 3 hard, SPLIT (patch) | Classic | 7.6% [5.4–10.6] | 3.2 / 7.3 / 10.7 / 21.2% | 2.3 / 1.4 / 0.9 / 1.5% |

Shares are each seat's contest followers from that round over its final followers, averaged over all 4 seats. Under split, a winner's take is prize ÷ leaders, rounded down. The bots don't plan for splitting: their contest model still assumes a full prize. Three-way ties are rare, so splitting mostly halves two-way ties. It costs each seat about 3 points of share and changes nothing measurable for the buyer.

## All-Hard tables (scripts/v4-thinker-tables.mjs, 4 Hard, budget 100, random 4-sphere tables)
400 games on 38 pair-covering random tables, 4 Hard (budget 100, uncapped), new rules (no early end).
- **Speed**: 68s of CPU a game. Hard averaged 178ms per place/buy decision in node with 4 workers, uncapped. The UI caps it at 200ms.
- **Seat (round-I order)**:
  - seat 1 25.3% ±4.3
  - seat 2 24.3% ±4.2
  - seat 3 25.4% ±4.3
  - seat 4 25.0% ±4.2

  Fair.
- **Round-III pick position**: 1st 12.5% · 2nd 12.5% · 3rd 27.8% · 4th 47.2% (±3–5). The last in followers picks first, so this is the leader picking last, not a seat edge.
- **Hard players**: 4.6 members and 55.0 followers each. Follower buys are 54.2% of their followers. They end with 9.4 resources (max 86).
- **Winners' followers by source** (games the sphere was on the table):
  - buys 50.1%
  - silver 6.4% (182)
  - red 6.0% (175)
  - trading 5.8% (125)
  - thieves 4.8% (138)
  - green 4.5% (169)
  - gold 4.4% (179)
  - market 3.9% (122)
  - blue 3.6% (140)
  - purple 3.2% (127)
  - echo 2.7% (127)
  - yellow 2.6% (116)
  - start 1.6%

  Per appearance, silver, red and trading carry the most; echo and yellow the least.
- **Extra placements** (beyond the base 12 a player, from extra workers and extra turns): 0.8 a game, max 6, in 35.5% of games.
- **Longest run of one player's placements in a row** (2 is natural at the snake's turn):
  - 2 in a row: 81.8%
  - 3: 8.8%
  - 4: 3.8%
  - 5: 3.5%
  - 6: 1.8%
  - 7: 0.5%

  **4+ happens in 9.5% ±2.9 of games.** Purple sat on 127 of 400 tables, so on Purple tables it's at most ~30% (if every long run was on one; not split out), against the 57% watch figure (Easy bots, Purple tables). Hard spends purple on turns less often than the old greedy bot did.

## Engine crash found (not fixed here)
A Stunt Double copy of Red's Open House queues "Open Door: which of the cheapest members?" with options built before the player's own buy. If that buy recruits one of those members, the pick throws "Card N is not in the shop" (red.takeFree → core recruit).
- Found in Hard rollouts on Classic.
- The repro's start state and moves are in design/eval/bots-repro-open-door.json; the last move throws.
- It's the same stale-choice family as the Straggler fix.
- Hard now scores a crashing rollout as a very bad line (−100) instead of crashing. THINKER_DUMP=<prefix> saves the crashing state.
