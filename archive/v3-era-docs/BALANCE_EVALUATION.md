# Balance Evaluation — Patrons v3

**Data:** 2000 simulated games each for 3-player and 4-player (heuristic AI, full engine)
**Date:** 2026-03-02

---

## Champion Balance

### 3-Player (expected win rate: 33.3%)
| Champion   | Win Rate | Avg Glory | Assessment |
|------------|----------|-----------|------------|
| Favored    | **45.9%** | 33.3 | **TOO STRONG** |
| Blessed    | 33.4% | 30.4 | Balanced |
| Ambitious  | 28.0% | 28.9 | Slightly weak |
| Deft       | 24.6% | 28.1 | Weak |
| Fortunate  | 25.1% | 29.1 | Weak |
| Prescient  | 27.3% | 30.0 | Slightly weak |

### 4-Player (expected win rate: 25%)
| Champion   | Win Rate | Avg Glory | Assessment |
|------------|----------|-----------|------------|
| Favored    | **33.6%** | 31.6 | **TOO STRONG** |
| Blessed    | 27.0% | 29.2 | Balanced |
| Fortunate  | 22.8% | 28.0 | Balanced |
| Ambitious  | 19.6% | 27.3 | Slightly weak |
| Deft       | 18.9% | 26.6 | Weak |
| Prescient  | 23.0% | 28.1 | Balanced |

**The Favored is +10-14% above expected.** The passive (+1 resource of shop's god color per shop use) compounds over the game. A player uses shops ~6 times per game, generating ~6 free resources — equivalent to 2 extra resource-gain actions.

**The Deft underperforms** despite getting 3 extra worker placements per game. The extra action per round is mechanically correct (confirmed 3.0 extra placements per Deft game), but doesn't translate to wins. Possible reason: extra placements use up workers faster, meaning the Deft runs out before opponents and misses late-round opportunities.

---

## Seat Position

### 3-Player
| Seat | Win Rate | Assessment |
|------|----------|------------|
| P1   | 32.6% | Balanced |
| P2   | 29.1% | Balanced |
| P3   | **38.4%** | Slight P3 advantage |

### 4-Player
| Seat | Win Rate | Assessment |
|------|----------|------------|
| P1   | 28.2% | Balanced |
| P2   | 22.8% | Balanced |
| P3   | 23.0% | Balanced |
| P4   | 26.1% | Balanced |

4-player seat balance is excellent. 3-player P3 advantage may be an artifact of the catch-up mechanic (lowest glory goes first each round) combined with snake turn order.

---

## Glory Sources

| Source | 3P avg | 4P avg | % of total | Assessment |
|--------|--------|--------|------------|------------|
| **green_vp_shop** | **26.3** | **35.8** | **29-32%** | **DOMINANT** |
| yellow_glory_condition | 19.6 | 25.3 | 20-23% | Healthy |
| gold_glory_condition | 20.7 | 22.3 | 20-22% | Healthy |
| gold_vp_shop | 16.8 | 20.1 | 16-18% | Healthy |
| black_glory_condition | 11.9 | 24.0 | 12-21% | Scales well with players |
| black_vp_shop | 10.1 | 18.7 | 10-17% | Scales well with players |
| green_glory_condition | **1.5** | **3.3** | **1-3%** | **VERY WEAK** |
| yellow_vp_shop | 1.8 | 1.8 | 2% | Low |
| cash_in (gold T3) | 3.9-4.3 | — | 4% | OK |

**green_vp_shop (+4 Glory, +1 extra turn) accounts for ~30% of all glory.** It's the single biggest source. At cost 5 green, it's undercosted given that green is easy to accumulate (green actions give 2-3 green each).

**Green glory condition (repeating actions) generates only 1-3%** of total glory. Other conditions trigger passively at round end (gold = have gold, yellow = have diversity, black = penalize others), but green requires actively using repeat actions, which have limited targets.

---

## Power Card Tier List

### S-Tier (10%+ purchase rate)
- **Crystal Watch** (green, +3 green/round) — 15-20% purchase rate. Pure economy dominance.
- **Onyx Spyglass** (black, +1 when others buy cards) — 12% purchase rate.
- **Tome of Deeds** (black, glory reduction immunity) — 9-13% purchase rate.

### A-Tier (6-10%)
- **Horn of Plenty** (yellow, +1 each color/round) — 8-10%. Premium economy.
- **Voodoo Doll** (black, -2 glory to chosen player/round) — 8-10%. Strong disruption.
- **Crystal Ball** (green, repeat from unoccupied) — 6-12%. Repeat flexibility.

### B-Tier (2-6%)
- Golden Scepter, Gold Idol, Abundance Charm, Emerald Coin, Alchemist's Trunk, Diadem of Expertise, Traveler's Journal

### C-Tier (1-2%)
- Capacitor, Thieves' Gloves, Gold Vault, Rainbow Crest, Golden Ring

### D-Tier (<1%)
- Cursed Blade, Golden Chalice, Obsidian Coin, Prismatic Gem, Gold Crown

### Dead (never purchased)
- **Hourglass** (green, ignore occupied) — Cost: green:4 + any:2 = 6 total. Too expensive.

---

## Recommended Balance Changes (Prioritized)

### 1. Nerf green_vp_shop (HIGH PRIORITY)
**Problem:** 30%+ of all glory comes from this one shop.
**Options:**
- (a) Remove the extra turn: just +4 Glory for 5 green
- (b) Reduce glory: +3 Glory + extra turn
- (c) Increase cost: 7 green instead of 5
- Recommendation: **(b)** — keeps the feel but reduces raw value

### 2. Nerf The Favored (HIGH PRIORITY)
**Problem:** +10-14% above expected win rate.
**Options:**
- (a) Change to "first shop use per round" (+1 resource per round)
- (b) Change to "once per turn" (still strong but doesn't stack)
- (c) Reduce to +1 of ANY color instead of the shop's god color
- Recommendation: **(a)** — clear, bounded, still valuable

### 3. Buff green glory condition (MEDIUM)
**Problem:** Only 1-3% of total glory. Other conditions are passive; green requires active repeat actions.
**Options:**
- (a) Trigger on COPY as well as REPEAT
- (b) Award +2 Glory per repeat instead of +1
- (c) Also trigger when using green shops (which are repeat-themed)
- Recommendation: **(a) + (c)** — broader triggers without changing the reward

### 4. Reduce Hourglass cost (LOW)
**Current:** green:4 + any:2 = 6 total
**Proposed:** green:3 + any:1 = 4 total
"Ignore occupied" is powerful but the card is literally never purchased.

### 5. Buff The Deft (LOW-MEDIUM)
**Options:**
- (a) Change extra action from "once per round" to "once per turn" in the first round (then back to per-round)
- (b) Grant +1 resource of the action's god color on extra action (makes the extra action more valuable)
- (c) Accept current balance — Deft is a "consistency" champion, not a "win more" one

### 6. Gold Crown + wildcard coins (LOW)
- Gold Crown: reduce cost from gold:4+any:2 to gold:3+any:1
- Wildcard coins: add +2 of color instead of on-purchase +1 each
---

## Game Health Metrics

| Metric | 3P | 4P | Assessment |
|--------|----|----|------------|
| Avg turns/game | 34.6 | 46.0 | Correct (12 workers/player/game) |
| Avg glory spread | 15.7 | 23.6 | Moderate snowball |
| Errors | 0 | 0 | Engine stable |
| Dead cards | 1 | 1 | Hourglass only |
| Simulation speed | 2.4ms/game | 3.0ms/game | Fast |

Overall the game is in good shape. The primary concerns are green_vp_shop dominance and The Favored's win rate. Addressing those two would bring the balance into a much healthier range.
