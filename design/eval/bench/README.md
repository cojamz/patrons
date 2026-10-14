# The balance bench

One standing, seeded, reproducible run that reads every balance question with two bot levels, so a finding can be told apart from a bot's blind spot. It measures; it never changes a card or a rule.

```
node scripts/v4-bench.mjs --quick          # Classic table, ~9 min on this box (4 cores)
node scripts/v4-bench.mjs                  # every card, space and sphere, ~75 min on this box
node scripts/v4-bench.mjs --only=cards,spaces   # sections: anchors, cards, spaces, archetypes, fairness, health
node scripts/v4-bench.mjs --records=<dir>  # friends' games ("Copy game record" JSON files) vs the bench
```

Writes `latest.md` (read this) and `latest.json` here, keeps `history/<date>-<sha>[-quick].json`, and opens the report with what moved since the newest earlier run of the same mode. `--records` writes `records.md` / `records.json` and puts the people's numbers next to the latest bench's Normal and Hard-20 columns. Same commit, same flags, same numbers: every game is a pure function of its seed, whatever the worker count. Any size can be overridden (`--normalSeeds=`, `--hardSeedsB=`, `--Kc=`, `--Ks=`, `--KcB=`, `--KsB=`, `--calib=`, `--archN=`, `--archH=`, `--hardBase=`, `--boot=`, `--workers=`); changing them changes the numbers.

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

1. **Anchors.** Banker (4), Big Family (4, the plain worth-3 member), Sponsor (10, known strong, rework-candidates #1) and Tycoon (12, known weak, #3) must read inside fixed ranges for both instruments: Banker 4.5–10.5 (by arithmetic +9/+6/+3 gold by round recruited, about 7, plus a follower; the fair-price sweep read 7.3 in round I), Big Family 0.5–6 (3 followers ≈ 4 resources at 4→3, less the follower buy it displaces; sweep 2.4), Sponsor ≥ 8 (not cheaper than printed − 2), Tycoon ≤ 10 (at least 2 under printed). Hard-20 must also beat 3 Normals (≥ 32%; parity 25%), and both price slopes must be clearly positive. If anything fails, the report says the instrument is off and marks every other section UNTRUSTED.
2. **Cards.** Fair price with 90% interval per instrument. Flag = the interval misses printed and the gap is ≥ 1.5 cost points, for both. "Needs an ability change" = both read it worth about nothing even free (fair ≤ 0.5, upper bound < 1.5) or needing more than twice its price. "Normal flags, Hard-20 doesn't" = probably Normal's blind spot, not the card. The full table also shows net margin at printed by the round the fork started (I/II/III).
3. **Spaces.** Worth per space and round, in followers and u, plus "vs choice" (against the bot's own pick; ≤ 0 means the bot was right to skip it) and how often it was blocked. Flag: above its round's band in any round, below the band in its own ring's round (a ring-I space in round III may be weak on purpose: weak versions are welcome), or below 0 anywhere.
4. **Archetypes.** One scripted seat (rotating) vs 3 Hard-20 and vs 3 Normal, on Classic: pure follower buyer (never recruits), a specialist per Classic sphere (+3 on its spaces, +2 on its members), contest chaser (adds twice the round-end contest standing a move leaves), member hoarder (recruits whenever a member is affordable). All are built on Normal's valuation. Target 15–35% each.
5. **Fairness.** Win share by seat, by round-I pick position, and for the round-III first pick (and the last of round III's first pass), from the base games of each instrument (random tables).
6. **Health.** From the same base games: members per player (target 6–7), where final followers came from (self, members' worth, buys by tier, contests by round, effects = member triggers, actions and game-end scoring), resources left at the end, contests paying 2+ and 3+ tied leaders, steal events per game, the longest run of placements by one player (the snake alone makes 2), and decision richness (Hard-20's rollouts: the share of weighed decisions whose top two options are within 1 follower; decisions with one candidate aren't counted).
7. **Humans** (`--records=<dir>`): the same health and fairness numbers from people's games, replayed through the same tracker, beside the bench's bot columns. Records from another rules content are counted but flagged.

## Run times on this box (4 cores)

| mode | stage A | stage B | total |
|---|---|---|---|
| `--quick` | (filled in by the first runs) | | |
| full | | | |

## Known limits

- **It is a bot's-eye reading.** Both instruments share Normal's valuation (Hard-20 is Normal plus look-ahead), so a blind spot in that valuation can survive both. The archetypes and the people's records are the check from outside.
- **Forced, not chosen.** A card probe is recruited at the first affordable chance, so a card that pays only at the right moment reads low. A space probe is the seat's first minion of the round.
- **Probe copies** are private clones of the member. Code that checks a member by its own id (Translator, Hustler's hint, Doppelganger's hint) doesn't see the copy as that card, so those read a little off.
- **Ring bands are in u**, converted with each instrument's measured price slope; a slope off by 20% moves every space by 20%.
- Engine crashes skip the game and are listed at the end of the report with their error, for the engine owner.
