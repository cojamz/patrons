# The balance bench

One standing, seeded, reproducible run that reads every balance question with two bot levels, so a finding can be told apart from a bot's blind spot. It measures; it never changes a card or a rule.

```
node scripts/v4-bench.mjs --quick          # Classic table, ~9 min on this box (4 cores)
node scripts/v4-bench.mjs                  # every card, space and sphere, ~75 min on this box
node scripts/v4-bench.mjs --only=cards,spaces   # sections: anchors, cards, spaces, archetypes, fairness, health
node scripts/v4-bench.mjs --records=<dir>  # friends' games ("Copy game record" JSON files) vs the bench
node scripts/v4-bench.mjs --stage=A --shard=i/n ; node scripts/v4-bench-merge.mjs …   # across machines (below)
```

A full run of every section writes `latest.md` (read this) and `latest.json` here; `--quick` and `--only` runs write `latest-quick.md` / `latest-full-<sections>.md` so they never overwrite it. Every run keeps `history/<date>-<sha>[-quick].json`, and opens the report with what moved since the newest earlier run of the same mode. `--records` writes `records.md` / `records.json` and puts the people's numbers next to the latest bench's Normal and Hard-20 columns. Same commit, same flags, same numbers: every game is a pure function of its seed, whatever the worker count. Any size can be overridden (`--normalSeeds=`, `--hardSeedsB=`, `--Kc=`, `--Ks=`, `--KcB=`, `--KsB=`, `--calib=`, `--archN=`, `--archH=`, `--hardBase=`, `--boot=`, `--workers=`); changing them changes the numbers.

## Instruments

- **Normal**: the default bot, all four seats.
- **Hard-20**: Hard (Normal plus rollouts, thinker.js) at a budget of 20 simulated moves per decision, uncapped wall clock so it's deterministic. Hard as shipped uses budget 100 under a 200 ms cap. Measured on Classic, a lone Hard-20 wins 39% against 3 Normals (n=160), budget 40 wins 45%, and budget 100 wins about 48% (bots.md). Budget 20 costs a fifth as much: an all-Hard-20 game takes about 6.5 s here, against 0.8 s for Normal. The anchors re-measure it every run.

Every number in the report names its instrument, n and interval. Intervals are 90%: a bootstrap over seeds for the fits, Wilson for win rates.

## Method

**Paired probes.** Each seed draws a table and plays a base game; the state at the start of each round is kept. A probe game forks from the start of round r with the same dice as that round's base continuation, and every seat gets its own probe:
- a **card**: a private copy of a member (rivals never see it) at printed −4, printed or +4, which the seat must recruit at its first affordable buy from round r on, in place of its normal buy. r is uniform over I, II and III, so the fair price averages "recruited early" and "recruited late".
- a **space**: the seat's first minion of round r must take that space (if a rival took it first, the probe is "blocked" and dropped).
- a **null**: the seat's first minion of round r goes where the bot wants, but its action does nothing. One seat in every space game holds one. It is the zero that turns "vs the bot's choice" into an absolute worth.

The probe's effect on a seat is its follower margin (own followers minus the rivals' mean) in the probe game minus the same seat's margin in the base continuation. All probes are fitted jointly, because a seat's margin also moves when its rivals hold probes:
- cards: Δ = a_c + b_c·(P − printed) − ⅓ Σ rivals' (a + b·ΔP), with b_c = b̄ + β_c (β ridged hard toward 0). **Fair price** = where a_c + b_c·(P − printed) = 0. b̄ is the **price slope**, followers of margin per cost point, and it is the exchange rate for everything else.
- spaces: Δ = v_cell − ⅓ Σ rivals' v_cell (cell = space × round). **Worth** = v_cell − v_null(same round), in followers; **u** = worth ÷ price slope, compared with the ring bands of design/eval/value-model.md (round I 2–3u, II 3–5u, III 5–9u).

**Two stages.** Stage A runs Normal on every card and every space of every sphere, plus everything else. Stage B runs Hard-20 on the anchors and on what Normal flags or reads far off (cards ≥ 2.5 from printed, spaces 1u outside their band), with the tables chosen to hold those targets. A card or space is listed only when both instruments put it outside its band, so Hard-20 never needs to see what Normal reads as fine. That is what keeps the full run inside 90 minutes.

## Sections

1. **Anchors.** Banker (4), Big Family (4, the plain worth-3 member), Sponsor (10, known strong, rework-candidates #1) and Tycoon (12, known weak, #3) must read inside fixed ranges for both instruments: Banker 4.5–10.5 (printed 4, now 8 after balance pass 1; the ranges are absolute fair prices and don't move with a reprice. By arithmetic +9/+6/+3 gold by round recruited, about 7, plus a follower; the fair-price sweep read 7.3 in round I), Big Family 0.5–6 (3 followers ≈ 4 resources at 4→3, less the follower buy it displaces; sweep 2.4), Sponsor ≥ 8 (not cheaper than printed − 2), Tycoon ≤ 10 (2 under its old 12; it is 6 since balance pass 1, so it may now read above printed). Hard-20 must also beat 3 Normals: its 90% interval must clear parity (25%), over 200 games (a point estimate against 32% on 96 games was a coin flip at Hard-20's real 33–37% on 618a8f5), and both price slopes must be clearly positive. If anything fails, the report says the instrument is off and marks every other section UNTRUSTED.
2. **Cards.** Fair price with 90% interval per instrument. Flag = the interval misses printed and the gap is ≥ 1.5 cost points, for both. "Needs an ability change" = both read it worth about nothing even free (fair ≤ 0.5, upper bound < 1.5) or needing more than twice its price. "Normal flags, Hard-20 doesn't" = probably Normal's blind spot, not the card. The full table also shows net margin at printed by the round the fork started (I/II/III).
3. **Spaces.** Worth per space and round, in followers and u, plus "vs choice" (against the bot's own pick; ≤ 0 means the bot was right to skip it) and how often it was blocked. Flag: above its round's band in any round, below the band in its own ring's round (a ring-I space in round III may be weak on purpose: weak versions are welcome), or below 0 anywhere.
4. **Archetypes.** One scripted seat (rotating) vs 3 Hard-20 and vs 3 Normal, on Classic: pure follower buyer (never recruits), a specialist per Classic sphere (+3 on its spaces, +2 on its members), contest chaser (adds twice the round-end contest standing a move leaves), member hoarder (recruits whenever a member is affordable). All are built on Normal's valuation. Target 15–35% each.
5. **Fairness.** Win share by seat, by round-I pick position, and for the round-III first pick (and the last of round III's first pass), from the base games of each instrument (random tables).
6. **Health.** From the same base games: members per player (target 6–7), where final followers came from (self, members' worth, buys by tier, contests by round, effects = member triggers, actions and game-end scoring), resources left at the end, contests paying 2+ and 3+ tied leaders, steal events per game, the longest run of placements by one player (the snake alone makes 2), and decision richness (Hard-20's rollouts: the share of weighed decisions whose top two options are within 1 follower; decisions with one candidate aren't counted).
7. **Humans** (`--records=<dir>`): the same health and fairness numbers from people's games, replayed through the same tracker, beside the bench's bot columns. Records from another rules content are counted but flagged.

## Run times on this box (4 cores)

| mode | stage A (Normal, archetypes, calibration) | stage B (Hard-20 re-measures) | total |
|---|---|---|---|
| `--quick` (Classic: 60 Normal seeds, 4 Hard-20 seeds, 6+6 targets) | 5.8 min | 2.5 min | 8.2 min |
| full (38 tables: 440 Normal seeds, 44 Hard-20 seeds, 26 cards + 24 spaces + anchors) | 50 min | 21 min | 72 min |

Quick's Hard-20 column is a smoke check (13–22 probes an anchor): read cards and spaces from the full run. In the full run Hard-20 re-measures at most 26 cards and 24 spaces beyond the anchors, so Normal's longer tail of flags is listed as "too thin or unsure"; `--only=cards --cardsB=60 --hardSeedsB=90` widens it at about 1.5 min a seed.

## Running at scale (shards)

Measured on this box (4 cores): **Normal plays 46–62 full-game equivalents per core-minute; Hard-20 (all four seats) 8.5–9.7** (the range is box load between runs). A probe game forks mid-game and counts as the part it plays. Every report prints both numbers, so the sizing below stays honest as the engine changes.

Games per unit (full-game equivalents):
- a Normal seed: one base game, the round II and III continuations, 12 card-probe and 12 space-probe games ≈ 19.5 games, 0.31 core-min.
- an archetype or calibration game: 1 (Normal tables) to ~4.5 (Hard-20 tables) Normal-game costs.
- a Hard-20 stage-B seed: base continuations plus 12 card and 10 space probe games ≈ 18 games, 1.9 core-min.

One machine, default full run: 440 Normal seeds ≈ 8,600 games plus 3,700 archetype and calibration games, then 44 Hard-20 seeds ≈ 800 Hard games, about 12,000 game equivalents in 72 min. Tables are dealt round-robin over the 38 tables (seed g plays table g mod 38), so every card and space meets each sphere it can share a table with in proportion, at any seed count.

Bigger runs fan out over machines (each its own clone at the same commit; results are bit-identical to a one-machine run of the same settings, whatever the shard count):

```
# stage A on machine i of n (same flags everywhere; --scale=k multiplies every game count)
node scripts/v4-bench.mjs --scale=4 --stage=A --shard=i/n          # writes design/eval/bench/partial-A-*.json
node scripts/v4-bench-merge.mjs partial-A-*.json                    # fits stage A, writes the stage-B plan, prints the commands
# stage B: Hard-20 on stage A's outliers and the anchors; --perTarget=N in stage A's flags sizes it to N probes a target
node scripts/v4-bench.mjs --stage=B --plan=<plan> --shard=i/n       # writes partial-B-*.json
node scripts/v4-bench-merge.mjs partial-A-*.json partial-B-*.json  # the report, history and trend
```

Sizing: `--scale=4` is about 35,000 Normal games for stage A, about 200 core-min, so 50 min a shard over 4 four-core machines. "A few hundred paired games each" in stage B: `--perTarget=300` with the usual ~50 targets is about 690 Hard-20 seeds, 1,300 core-min: about 55 min a shard over 6 four-core machines. Partials hold raw results (about 2 KB a Normal seed) and stay out of git; only the merged result goes in history.

## Trend, power and interactions

- **Act on the pooled list, not one run's flags.** Each run is an independent sample, and many cards sit near the flag line: two full runs on the same rules kept only 5 of 14 card flags, although every estimate moved just as far as its interval predicted (RMS z 0.99 for cards, 0.84 for spaces, so the intervals are honest). `trend.md` opens with every run on the latest rules content pooled by inverse variance, flagged when both instruments' pooled intervals agree. More runs tighten it, but only with fresh seeds: rerun with `--seedBase=<new>` (e.g. 500000, 600000, 700000…), since the same seeds replay the same games and the pool keeps only the newest run per seed base. A rules change starts a new pool.

- `trend.md` (`trend-quick.md` for quick runs) shows every card's Normal fair price, every space's scaled u and every archetype's win rate across the last 8 runs of that mode, with what changed between runs (rules content hash, repriced, new and cut cards). History keeps every merged run.
- Power: every unflagged item shows "detectable", the smallest gap its interval could have caught with 80% power (1.51 × its 90% half-width; at least 1.5 cost points for cards), with the median and 90th percentile in the section text. Flagged items show n and interval for both instruments.
- Section 2b lists card × sphere and space × sphere outliers: Normal's residuals where the seat held the item, grouped by each other sphere at the table, at |deviation| ≥ 3 and |z| ≥ 3.5, with Hard-20's reading where its targets covered the pair.

## Known limits

- **It is a bot's-eye reading.** Both instruments share Normal's valuation (Hard-20 is Normal plus look-ahead), so a blind spot in that valuation can survive both. The archetypes and the people's records are the check from outside.
- **Forced, not chosen.** A card probe is recruited at the first affordable chance, so a card that pays only at the right moment reads low. A space probe is the seat's first minion of the round.
- **Probe copies** are a second copy of the real member (rivals never see it; the probe price applies only at the moment of recruiting), so rules that check a member by its id work. Two copies of one member can then be in play at once, which no real game allows.
- **Interactions** are read from the main fit's residuals, not fitted per pair, and the within-fork demeaning shrinks them a little: they err small. With ~1,500 pairs, |z| ≥ 3.5 still lets about one false alarm through a run.
- **Ring bands are in u**, converted with each instrument's measured price slope; a slope off by 20% moves every space by 20%.
- Engine crashes skip the game and are listed at the end of the report with their error, for the engine owner.
