# Balance cross-check, Oct 29 overnight (independent reviewer)

An independent re-check of the balance thread's runs ("Run balance tests and suggest 2.0 changes"). It uses its own runner, seeds, tables and bot policies. Prices only. The engine is pre-v0.9.846 (bba6d6ec/2ccf3490), so Launderers is the old card here.

## How
- Runner: `scripts/xcheck/xc-run.mjs` (seed `500000 + SALT*100000 + g*31 + seats`, so it shares no seeds with v4-balance.mjs). It shards via `xc-shards.sh`, and there's a buy-followers-only seat every 5th game.
- Policies: `normal`, `hard` (the game's bots), `cold` (Normal with no member bias and full spite), `mixplus` (one Hard seat with 5 candidates and 3x budget, against three Normal seats).
- Report: `xc-report.py` gives two lifts in win-share points: raw (vs seats with the same member count, as the balance thread does) and adjusted (ridge regression on every member, artifact, member count and seat at once). It also covers spaces (followers and resources per placement, takers' win), Last Call and Echo, skips, and contests (last placer, single-holder colors). `xc-compare.py` compares paired runs, and `xc-grid.py` makes the cross-run grid.
- Noise: a same-price repeat at 4p (1,500 games, new seeds) gave a z-score spread of 1.15, so ±SE is about honest at 4p. At 2p (800 games), unchanged cards swung 10-23 points between runs, so 2p single runs can't price anything. Hard samples (150-400 games) disagree with the balance thread's Hard by 3-5 SE on several single cards.
- Raw runs: branches xcheck-hardA, xcheck-hardB (design/eval/xcheck/runs/). Local Normal runs weren't kept (re-run from seeds).

## Round 0 grid
`round0-grid.txt`: adjusted lift ±1 SE for every member and artifact, by Normal 4/3/2p, cold Normal 4p, Hard 4p, Hard 2-3p, and mixed tables with one Hard+ seat. JSON per run: `r0-*.json`.

## Findings
- The buy-followers-only seat (target ~25%) depends on the bot. Normal: 2p 61%, 3p 33%, 4p 28-30%. Cold Normal 4p: 25%. Hard: 2p 22%, 3p 15%, 4p 8.5%. Mixed tables: 20%. So members aren't weak against good play, and the balance target should be read on Hard.
- Off with both bots: Accomplice strong (N4 +13, H4 +8.5, and the Hard+ seat buys it more), Heiress strong (N4 +19, H4 +14), Agents weak (N4 −7, H4 −15, every count), Money Changer artifact weak (−10 to −14 everywhere). Bait is weak on N4 (−4.6) and H4 (−11).
- Normal-only: Tiebreaker (N4 +18, H4 +1.4). It's a Normal quirk; Cory set 4 on Oct 28, so it stays. Impressionist (N −13, H4 −3).
- Price raises on expensive cards mostly cut how often they're bought, while owners still win (selection). Cuts on 9-cost cards raise buys with flat lift.
- Spaces on Hard 4p, by takers' win vs fair: Greatest Hits +39 (+2 followers +15 resources a placement), Crowd In +14, Last Call +12.6 (+8 followers when taken first in round III). Exchange −4.5, so it's mid-board by value and not the best conversion. Spaces have no price.
- Last Call then Echo: rare (105 of 1,500 Normal games, 33 of 400 Hard), and the Echo averages +3 followers.
- Going last: the last placer takes 35% of round III contest followers at 4p (fair 25), 45% at 3p (33), 66% at 2p (50). Round I is fair.
- Skip chains: a player is skipped 3+ times in one round in 7% (Hard) to 11% (Normal) of 4p games, and those players still win 22-35%. Bouncer reads weak (H2-3 −17).
- Plus-One: lift neutral on Normal and Hard 4p, but the Hard+ seat buys it 8 points less than Normal does. Some support for "trap".
- One color held by one player at round end: magenta 10-28% and green 10-18%, highest at 2p.

## Price rounds (Normal 4p, paired on the same seeds; adjusted lift before → after)
See the thread report for the per-round numbers. Summary: Accomplice 1/2 drops ~6 points every time (still +6 to +12). Agents at 1/2 reads −3 to −8 (1/1 reads −3), so its ability is the problem. Bait 1/2 fixes 2 of 4 runs. Heiress 4/4 is bought half as often, and lift doesn't move. Bodyguard 5/3 and Night Owl 6/2 are bought 3x as often. Exporter 2/5 and Scout 0/3 are small and harmless. Spread of member lifts 4.84 → 4.43.
