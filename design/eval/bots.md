# Bots: levels, the big-followers target, all-Hard tables

2026-10-14. Instruments are named on every line. "vs 3 X" = the pure big-followers buyer (never recruits; normal's
scoring with members off) in one seat, rotating, 3 bots of level X in the others; ties split; 95% Wilson interval.

## Summary
1. The levels are Easy < Casual < Normal < Hard. Each level's win share against 3 Normals: Easy 13%, Casual 21.5%, Hard 46–49% (parity 25%).
2. Normal was under-recruiting. It now likes members (+2 followers per recruit, fading late) and weighs the best rival at 0.4. The old Normal wins 21% against 3 new ones.
3. Easy is no longer the old greedy bot, which hoarded up to 108 and recruited ~11. Easy is now Normal played sloppily: 4.5 members, 9.3 left.
4. Hoarding is gone. 50+ resources left at the end happens in 0.0% of Easy seats, 0.2% of Casual and 0.3% of Normal (greedy bot 2.4%). The rare piles come from once-per-game gold doublers (Speculator, Jackpot) in round III: one buy a turn can't absorb 60 gold.
5. Hard measured 115ms per move on average in headless Chromium, 220ms at worst, never over 300ms. It is capped at 200ms.
6. Pure big followers wins 14.6% [11.5–18.4] vs 3 Hard, 16.6–18.6% vs Normal, 15.6–18.2% vs Casual and 19.5% vs Easy. That sits at the bottom edge of the 15–30% band, below the 25% target.
7. The win rate depends far more on how much the table recruits than on how well it plays. It is 37.5% against loose member-lovers (9.3 members each) and 84% against the old greedy bot (11.7 members).
8. One rules lever moves it, and only for the report: member costs ×1.25 gives 24.9% [20.9–29.3] with 5.6 members a rival. ×1.5 gives 31%. 4→4 gives 22.7%. Tier stock and 8→7 don't move it.
9. All-Hard tables: see the section below (400 games).

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

## Level ladder (bot-levels script, n = 400 seats for the lone level, 1200 for the Normals)
| seats | lone level win | members | left (max) |
|---|---|---|---|
| easy + 3 normal | 13.0% ±3.3 | 3.5 | 9.6 (56) |
| casual + 3 normal | 21.5% ±4.0 | 5.6 | 11.8 (43) |
| collector + 3 normal | 23.0% ±4.1 | 8.5 | 14.5 (46) |
| hard + 3 normal (uncapped, n=200) | 46.3% ±6.9 | 6.7 | 12.7 (63) |
| hard (200ms cap) + 3 normal (n=150) | 48.6% ±8.0 | 6.7 | 13.3 (79) |

Tables of one level (400 games, 1600 seats):
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

## Big followers (scripts/v4-big-followers.mjs)
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

What would move it (runtime patches in a scratch script vs 3 Normal, n = 400 each; not shipped):
| lever | buyer | members/rival |
|---|---|---|
| member costs ×0.75 | 15.6% [12.4–19.5] | 8.9 |
| member costs ×1.25 | 24.9% [20.9–29.3] | 5.6 |
| member costs ×1.5 | 31.3% [26.9–36.0] | 4.3 |
| 4→3 becomes 4→4 | 22.7% [18.9–27.1] | 7.1 |
| 8→6 becomes 8→7 | 15.8% [12.5–19.7] | 7.6 |
| 10→10 stock 6 | 16.4% [13.1–20.4] | 7.6 |

Member costs ×1.25 is the one lever that lands both targets at once: buyer ~25% and ~6 members a player, close to the 6–7 target. That's Cory's call.

## All-Hard tables (scripts/v4-thinker-tables.mjs, 4 Hard, budget 100, random 4-sphere tables)
TABLES
