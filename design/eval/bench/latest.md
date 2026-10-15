# Balance bench (full)

2026-10-15 19:50 UTC · commit 95d2a6e+dirty · content mya33cqu8v.833f07e390 · 106.3 min on 4 workers (416 core-min) · 38 random 4-sphere tables (makeTables 4242, every compatible pair at least twice), dealt round-robin.
Games played: 11362 full-game equivalents (probe games fork mid-game and count as the part they play). Throughput: Normal 59.2 games per core-minute, Hard-20 4.8 (all four seats that level).
Instruments: **Normal** (all four seats) and **Hard-20** (Hard = Normal plus rollouts, at budget 20, uncapped, deterministic). Intervals are 90% (bootstrap over seeds for fits, Wilson for win rates). Method and limits: design/eval/bench/README.md.

One run is one sample: flags near the line churn from run to run (two full runs on the same rules kept 5 of 14 card flags, while estimates moved only as far as their intervals predict). **Act on the pooled list in trend.md**, which combines every run on the same rules content.

## What moved since last run
Against 2026-10-15 18:04 (17fb84a+dirty):
- Rules content changed (r57xahc8z2.65d9a9ad18 → mya33cqu8v.833f07e390).
- Cards: Revelers: Normal fair 6.7 → 2.7; Investor: flagged dear → not flagged; Sleepwalker: flagged cheap → not flagged; Underdog: not flagged → flagged cheap; Treasurer: Normal fair 4.0 → 7.4; Ensemble: not flagged → flagged dear; Timekeeper: not flagged → flagged dear; Lender: not flagged → flagged cheap; Blue Devotee: not flagged → flagged dear; Hustler: flagged cheap → not flagged; Green Patron: flagged dear → not flagged; Farmer: not flagged → flagged dear; Recruiter: Normal fair 3.9 → 8.0; Sticky Fingers: Normal fair 8.8 → 5.2; Crowd-Pleaser: not flagged → flagged cheap; Chronicler: not flagged → flagged dear; Groupie: not flagged → flagged dear; Pied Piper: Normal fair 1.5 → 5.1; Doppelganger: Normal fair 6.4 → 2.5; Gardener: Normal fair 7.3 → 1.7.
- Spaces: Branch Out (round 2): in → weak; Rising Tide (round 3): strong → in; Good Deed (round 1): strong → in; Crescendo (round 3): in → strong; Greatest Hits (round 3): in → weak; Cheap Seats (round 1): weak → in; Shake Down (round 3): in → strong; Hand-pick (round 3): strong → in.
- pure follower buyer vs 3 Normal: 11.5% → 17.5%.
- member hoarder (recruits whenever it can) vs 3 Normal: 14.0% → 6.7%.
- contest chaser (maximizes round-end leads) vs 3 Hard-20: 14.8% → 5.5%.
- Gold (gold) specialist vs 3 Normal: 25.4% → 20.0%.

## 1. Anchors
Every anchor's interval reaches its expected range, Hard-20 beats Normal, and both price slopes are clearly positive: the instruments are trusted. (An anchor is off when its 90% interval misses the range, or it has too few probes to say.)

- Price slope, followers of margin per extra cost point (the exchange rate for everything below): Normal 0.94 [0.89–0.98] (by fork round I/II/III: 1.12 [1.03–1.21], 1.01 [0.94–1.08], 0.68 [0.63–0.75]); Hard-20 0.84 [0.72–0.97] (by fork round I/II/III: 0.96 [0.70–1.21], 0.98 [0.75–1.23], 0.58 [0.39–0.79]). 
- Hard-20 alone vs 3 Normal (Classic, n=200): wins 44.8% [39.1%–50.6%]; parity is 25%, and its interval must clear it. OK.

| instrument | anchor | printed | fair [90%] | n | expected | |
|---|---|---|---|---|---|---|
| Normal | Banker | 8 | 7.3 [6.1–8.6] | 429 | 4.5–10.5 | ok |
| Normal | Big Family | 4 | 2.2 [1.1–3.3] | 355 | 0.5–6.0 | ok |
| Normal | Sponsor | 10 | 7.5 [6.0–8.6] | 228 | 8.0–∞ | ok |
| Normal | Tycoon | 4 | 3.9 [2.8–4.9] | 406 | −∞–10.0 | ok |
| Hard-20 | Banker | 8 | 7.5 [5.1–10.3] | 71 | 4.5–10.5 | ok |
| Hard-20 | Big Family | 4 | 3.8 [2.1–5.9] | 69 | 0.5–6.0 | ok |
| Hard-20 | Sponsor | 10 | 11.3 [8.1–14.1] | 34 | 8.0–∞ | ok |
| Hard-20 | Tycoon | 4 | 2.2 [-0.3–4.8] | 73 | −∞–10.0 | ok |

- Banker ("Now and at round start, +3 gold"; 4, repriced to 8 in balance pass 1; the range is absolute). By arithmetic +9/+6/+3 gold by round recruited, ~7 averaged, plus a follower; the Normal sweep read 7.3 [6.3–8.3] recruited in round I.
- Big Family (4: "Worth 3 followers", no ability), the plain worth-N member: 3 followers ≈ 4 resources at 4→3, less the follower buy it displaces. The Normal sweep read 2.4 [0.6–3.6].
- Sponsor (10: "Your members cost 2 less"), rework-candidates #1, known strong: must read 8 or more (printed − 2).
- Tycoon ("Game end: +1 follower per 3 gold"), rework-candidates #3, known weak at its old 12: must read 10 or less (absolute; repriced to 6 in balance pass 1, so it no longer has to read under printed).

## 2. Cards
Paired forced recruit: a private copy of the card, at printed −4 / printed / +4, recruited at the seat's first affordable buy from a random round on (I, II or III), against the same seed without it. Fair price = the price where it nets 0 followers of margin. Normal: 26364 probes over 440 seeds, every card. Hard-20: 2640 probes over 44 seeds, only the anchors and what Normal flags or reads ≥ 2.5 off (a card both must agree on can't be flagged by Hard alone). Flag = the 90% interval misses printed and the gap is ≥ 1.5, for BOTH instruments.

### Both instruments agree (11)
| card | printed | Normal fair [90%] n | Hard-20 fair [90%] n | reads | bought round |
|---|---|---|---|---|---|
| Crowd-Pleaser (red) | 2 | 6.7 [4.8–8.7] 106 | 4.0 [2.2–6.2] 57 | too cheap, needs an ability change (would need > 2× its price) | 2.4 |
| Groupie (echo) | 8 | 3.5 [1.1–5.6] 78 | 5.9 [4.2–7.4] 51 | too dear | 2.4 |
| Ensemble (echo) | 6 | 1.9 [0.2–3.9] 82 | 2.0 [-0.3–4.7] 55 | too dear | 2.3 |
| Timekeeper (purple) | 6 | 2.1 [0.3–3.5] 96 | 2.5 [-0.8–5.8] 49 | too dear | 2.4 |
| Chronicler (echo) | 8 | 4.5 [2.6–6.5] 79 | 2.9 [0.2–5.4] 57 | too dear | 2.4 |
| Farmer (yellow) | 6 | 2.6 [0.3–4.7] 60 | 2.0 [-1.0–5.8] 32 | too dear | 2.3 |
| Lender (trading) | 4 | 7.3 [5.3–9.3] 91 | 7.5 [4.9–11.2] 37 | too cheap | 2.2 |
| Underdog (gold) | 6 | 9.3 [7.6–11.0] 139 | 8.6 [6.1–11.0] 76 | too cheap | 2.2 |
| Tipster (trading) | 6 | 8.9 [7.2–10.9] 100 | 11.9 [8.7–14.7] 42 | too cheap | 2.2 |
| Extra Hand (benders) | 6 | 8.1 [7.0–9.2] 289 | 8.4 [7.1–10.1] 152 | too cheap | 2.2 |
| Blue Devotee (blue) | 4 | 2.3 [1.0–3.3] 133 | 0.9 [-0.9–3.3] 50 | too dear | 2.2 |

### Needs an ability change, not a price (1)
Crowd-Pleaser (printed 2; Normal 6.7, Hard-20 4.0: would need > 2× its price).

### Normal flags, Hard-20 confidently doesn't (likely a Normal-bot artifact) (9)
Choir 6 (Normal 2.9 [1.0–4.6], Hard-20 5.9 [3.7–7.9]); Treasurer 4 (Normal 7.4 [5.9–9.0], Hard-20 4.8 [2.2–7.1]); Pilgrim 4 (Normal 7.8 [6.1–9.8], Hard-20 4.2 [0.8–7.0]); Late Bloomer 4 (Normal 1.9 [0.7–3.5], Hard-20 4.0 [2.0–5.9]); Desperado 4 (Normal 7.8 [5.8–9.7], Hard-20 5.3 [3.6–7.1]); Mob 8 (Normal 4.4 [1.9–6.0], Hard-20 7.2 [4.7–9.2]); Robin Hood 4 (Normal 7.9 [6.4–9.6], Hard-20 4.8 [2.9–7.0]); Sponsor 10 (Normal 7.5 [6.0–8.6], Hard-20 11.3 [8.1–14.1]); Stylist 4 (Normal 7.0 [5.0–8.8], Hard-20 1.6 [-5.9–6.4]).

Normal flags, Hard-20 too thin or unsure to say: Patron Saint 6→3.9; Late Riser 6→3.5; Revelers 6→2.7 (Hard-20 5.2, n 46); Silversmith 6→7.9; Investor 6→3.7; Courier 6→3.9; Night Owl 10→7.2 (Hard-20 9.3, n 32); Grand Host 12→14.5; Corner-Cutter 2→3.8; Bookkeeper 6→3.9; Taskmaster 6→1.8 (Hard-20 4.2, n 45); Blue Recruit 1→3.1; Shift Crew 2→3.8; Hustler 4→6.6; Lottery Winner 10→12.6; Green Patron 6→4.2; Speculator 8→6.1; Penny Pincher 4→6.7; Admirer 4→1.0; Big Family 4→2.2 (Hard-20 3.8, n 69); Sticky Fingers 8→5.2 (Hard-20 6.7, n 49); Crew 2→4.5 (Hard-20 3.5, n 67); Mole 4→6.4; Bodyguard 6→7.8; Cutpurse 4→6.2; Kingpin 4→6.2; Doppelganger 6→2.5 (Hard-20 4.3, n 50); Talent Scout 4→1.7; Auctioneer 6→9.6 (Hard-20 5.9, n 13); Planner 4→6.1.

<details><summary>Every card (Normal; Hard-20 where measured)</summary>

| card | printed | Normal fair [90%] | n | detectable | net at printed by round I/II/III | Hard-20 fair [90%] | n |
|---|---|---|---|---|---|---|---|
| Crowd-Pleaser (red.crowd) | 2 | 6.7 [4.8–8.7] | 106 | ±3.0 | 4.5 / 2.4 / -3.1 | 4.0 [2.2–6.2] | 57 |
| Robin Hood (thieves.robinhood) | 4 | 7.9 [6.4–9.6] | 108 | ±2.5 | 4.3 / 3.6 / 1.2 | 4.8 [2.9–7.0] | 66 |
| Pilgrim (yellow.pilgrim) | 4 | 7.8 [6.1–9.8] | 93 | ±2.8 | 8.2 / -0.9 / 0.7 | 4.2 [0.8–7.0] | 64 |
| Desperado (thieves.desperado) | 4 | 7.8 [5.8–9.7] | 108 | ±2.9 | -0.0 / 4.7 / 0.7 | 5.3 [3.6–7.1] | 62 |
| Auctioneer (market.auctioneer) | 6 | 9.6 [7.5–11.9] | 76 | ±3.3 | 0.8 / 1.4 / 3.7 | 5.9 [-0.6–15.5] | 13 |
| Treasurer (gold.seed) | 4 | 7.4 [5.9–9.0] | 133 | ±2.4 | 8.3 / -5.0 / 7.7 | 4.8 [2.2–7.1] | 75 |
| Lender (trading.lender) | 4 | 7.3 [5.3–9.3] | 91 | ±3.0 | 1.3 / 5.2 / 1.1 | 7.5 [4.9–11.2] | 37 |
| Underdog (gold.underdog) | 6 | 9.3 [7.6–11.0] | 139 | ±2.6 | 6.8 / 13.8 / -3.0 | 8.6 [6.1–11.0] | 76 |
| Stylist (market.stylist) | 4 | 7.0 [5.0–8.8] | 92 | ±2.9 | -0.9 / 4.0 / 0.6 | 1.6 [-5.9–6.4] | 20 |
| Tipster (trading.tipster) | 6 | 8.9 [7.2–10.9] | 100 | ±2.8 | 1.2 / 6.6 / 7.1 | 11.9 [8.7–14.7] | 42 |
| Penny Pincher (gold.thrift) | 4 | 6.7 [4.7–8.9] | 143 | ±3.2 | -1.7 / 12.4 / -4.5 | – |  |
| Hustler (gold.hustler) | 4 | 6.6 [4.7–8.8] | 120 | ±3.1 | 2.9 / -0.2 / 4.2 | – |  |
| Lottery Winner (gold.jackpot) | 10 | 12.6 [10.8–14.6] | 111 | ±2.9 | 2.5 / -0.3 / 9.1 | – |  |
| Crew (thieves.crew) | 2 | 4.5 [2.9–6.3] | 112 | ±2.6 | -4.0 / 9.2 / 6.9 | 3.5 [1.8–5.3] | 67 |
| Grand Host (silver.grandhost) | 12 | 14.5 [12.3–16.7] | 127 | ±3.3 | 3.3 / -5.1 / -0.9 | – |  |
| Debutante (silver.gala) | 8 | 10.4 [7.9–12.7] | 138 | ±3.6 | 8.8 / -0.2 / -0.9 | – |  |
| Mole (thieves.mole) | 4 | 6.4 [4.7–8.1] | 100 | ±2.6 | 5.0 / -0.9 / 7.1 | – |  |
| Connoisseur (market.connoisseur) | 4 | 6.3 [3.8–8.6] | 89 | ±3.6 | -1.4 / 2.4 / 2.5 | – |  |
| Cutpurse (thieves.cutpurse) | 4 | 6.2 [4.6–7.9] | 107 | ±2.5 | -0.4 / 3.9 / -2.9 | – |  |
| Kingpin (thieves.kingpin) | 4 | 6.2 [4.3–7.9] | 66 | ±2.7 | 4.7 / -3.5 / -1.5 | – |  |
| Blue Recruit (blue.recruit) | 1 | 3.1 [1.7–4.9] | 120 | ±2.4 | 0.7 / 4.8 / -2.2 | – |  |
| Sleepwalker (echo.afterimage) | 6 | 8.1 [5.1–10.9] | 69 | ±4.4 | 0.2 / 3.0 / 0.6 | – |  |
| Recluse (market.recluse) | 4 | 6.1 [3.6–8.2] | 83 | ±3.5 | -3.7 / 3.5 / 4.2 | – |  |
| Extra Hand (benders.extrahand) | 6 | 8.1 [7.0–9.2] | 289 | ±1.7 | 1.4 / 3.4 / 2.6 | 8.4 [7.1–10.1] | 152 |
| Planner (market.planner) | 4 | 6.1 [4.3–8.1] | 88 | ±2.9 | -0.6 / 7.9 / 6.3 | – |  |
| Silversmith (silver.silversmith) | 6 | 7.9 [6.1–9.8] | 144 | ±2.8 | 4.3 / 5.7 / -0.5 | – |  |
| Corner-Cutter (purple.doubletime) | 2 | 3.8 [2.0–5.7] | 107 | ±2.7 | 7.4 / -0.0 / -1.3 | – |  |
| Shift Crew (purple.crew) | 2 | 3.8 [2.6–5.6] | 110 | ±2.3 | 4.9 / -1.4 / 0.4 | – |  |
| Bodyguard (thieves.watchdog) | 6 | 7.8 [6.0–9.6] | 69 | ±2.7 | 9.1 / 6.2 / 1.9 | – |  |
| Liquidator (trading.liquidator) | 3 | 4.8 [2.6–7.5] | 96 | ±3.7 | -1.7 / -6.5 / -0.1 | – |  |
| Shopkeeper (trading.shopkeeper) | 4 | 5.7 [3.5–8.1] | 96 | ±3.4 | 18.3 / -1.1 / -1.0 | – |  |
| Tribute Band (echo.dejavu) | 12 | 13.6 [10.5–16.2] | 54 | ±4.3 | 0.5 / -6.3 / 2.0 | – |  |
| Safecracker (thieves.bigscore) | 4 | 5.5 [3.8–7.3] | 102 | ±2.6 | 5.8 / -0.8 / 2.5 | – |  |
| Blue Regular (blue.regular) | 3 | 4.5 [2.9–6.1] | 119 | ±2.4 | 4.3 / -0.7 / 3.6 | – |  |
| Rainmaker (yellow.rainmaker) | 4 | 5.4 [2.6–8.0] | 67 | ±4.0 | 2.1 / -1.0 / 6.5 | – |  |
| Green Recruit (green.recruit) | 1 | 2.4 [1.0–3.7] | 140 | ±2.0 | 3.6 / -3.9 / 2.9 | – |  |
| Caterer (silver.caterer) | 4 | 5.4 [3.7–7.1] | 163 | ±2.6 | 0.6 / 1.8 / 3.6 | – |  |
| Broker (trading.broker) | 2 | 3.3 [1.2–5.4] | 91 | ±3.2 | 4.8 / -2.7 / -4.0 | – |  |
| Prospector (gold.prospector) | 4 | 5.1 [3.4–6.9] | 146 | ±2.7 | 1.5 / 0.7 / -1.9 | – |  |
| Pied Piper (red.drive) | 4 | 5.1 [3.5–7.1] | 114 | ±2.8 | 4.9 / 1.2 / 2.2 | – |  |
| Errand Runner (purple.errand) | 8 | 9.0 [6.9–11.0] | 101 | ±3.1 | -1.9 / 5.4 / 7.4 | – |  |
| Twins (red.twins) | 2 | 3.0 [1.1–4.8] | 130 | ±2.8 | -2.8 / -2.9 / 2.3 | – |  |
| Go-Between (yellow.gobetween) | 4 | 5.0 [2.9–7.2] | 89 | ±3.3 | 7.9 / -3.0 / -4.4 | – |  |
| Underbidder (market.underbidder) | 2 | 2.9 [0.6–5.3] | 87 | ±3.6 | -4.9 / 4.2 / 4.2 | – |  |
| Straggler (benders.straggler) | 5 | 5.9 [4.7–7.2] | 289 | ±1.9 | 2.2 / -0.1 / -1.6 | – |  |
| Wallflower (echo.wallflower) | 4 | 4.9 [2.8–7.0] | 89 | ±3.2 | 3.5 / -4.9 / 0.3 | – |  |
| Majordomo (silver.majordomo) | 6 | 6.9 [5.2–8.8] | 145 | ±2.7 | -1.4 / -4.2 / -4.7 | – |  |
| Proselytizer (red.proselytizer) | 6 | 6.9 [5.0–9.0] | 100 | ±3.1 | 7.6 / -6.7 / -0.5 | – |  |
| Toastmaster (silver.toastmaster) | 4 | 4.9 [3.4–6.1] | 145 | ±2.1 | 0.7 / 3.0 / -1.7 | – |  |
| Tinker (gold.tinker) | 10 | 10.8 [8.9–12.8] | 116 | ±3.0 | -5.0 / -0.9 / 4.3 | – |  |
| Green Hand (green.hand) | 2 | 2.8 [1.4–4.2] | 157 | ±2.1 | -2.2 / 5.2 / -1.7 | – |  |
| Magnate (trading.magnate) | 4 | 4.8 [2.7–7.2] | 89 | ±3.3 | 4.3 / -0.6 / -2.2 | – |  |
| Patriarch (red.patriarch) | 5 | 5.7 [4.0–7.6] | 104 | ±2.7 | -3.7 / -5.2 / -3.8 | – |  |
| Mentor & Protégé (red.mentor) | 10 | 10.6 [8.5–12.7] | 67 | ±3.2 | -5.1 / 4.1 / 1.1 | – |  |
| Lookout (thieves.lookout) | 6 | 6.6 [4.8–8.2] | 74 | ±2.6 | 5.6 / 0.8 / 0.7 | – |  |
| Feastmaker (yellow.feastmaker) | 10 | 10.6 [7.5–13.8] | 35 | ±4.8 | -4.1 / 1.7 / 7.0 | – |  |
| Dealer (trading.dealer) | 2 | 2.5 [0.7–4.7] | 97 | ±3.0 | -4.1 / 3.0 / 0.3 | – |  |
| Big Spender (benders.bigspender) | 2 | 2.5 [1.5–3.8] | 307 | ±1.7 | 5.0 / 0.6 / 1.4 | – |  |
| Front-runner (benders.frontrunner) | 2 | 2.4 [1.7–3.4] | 308 | ±1.5 | -0.5 / 0.2 / 0.5 | – |  |
| Blue Hand (blue.hand) | 2 | 2.4 [1.2–3.8] | 118 | ±2.0 | -2.4 / 7.5 / 2.7 | – |  |
| Weaver (yellow.weaver) | 6 | 6.4 [4.3–8.9] | 57 | ±3.5 | 3.0 / 1.9 / -0.1 | – |  |
| Minimalist (market.minimalist) | 2 | 2.4 [0.2–5.0] | 81 | ±3.6 | -1.1 / 2.2 / 3.1 | – |  |
| Social Climber (market.climber) | 2 | 2.3 [-0.0–4.8] | 84 | ±3.7 | 0.4 / 10.3 / -3.6 | – |  |
| Rich Uncle (trading.safetynet) | 2 | 2.3 [0.4–4.4] | 98 | ±3.1 | 2.4 / -9.7 / -2.4 | – |  |
| Dyer (yellow.dyer) | 6 | 6.2 [4.1–8.8] | 56 | ±3.5 | 12.3 / 5.1 / -2.0 | – |  |
| Accomplice (thieves.accomplice) | 8 | 8.2 [6.8–10.1] | 77 | ±2.5 | 1.9 / 1.7 / 4.5 | – |  |
| Middleman (gold.coinpurse) | 4 | 4.2 [2.3–5.5] | 139 | ±2.5 | 3.4 / -2.3 / 0.4 | – |  |
| Reinvestor (trading.reinvestor) | 4 | 4.1 [2.1–6.2] | 93 | ±3.1 | -5.7 / 1.0 / -1.4 | – |  |
| Bulk Buyer (trading.bulkbuyer) | 6 | 6.1 [4.1–8.2] | 80 | ±3.1 | -0.7 / -1.9 / 2.9 | – |  |
| Overseer (purple.overseer) | 4 | 4.1 [2.6–5.8] | 106 | ±2.4 | -2.4 / -2.5 / 1.0 | – |  |
| Benchwarmer (red.reserve) | 1 | 1.1 [-0.6–2.7] | 114 | ±2.5 | 0.9 / -1.4 / -2.1 | – |  |
| Blue Patron (blue.patron) | 6 | 6.0 [4.4–7.9] | 110 | ±2.7 | -4.6 / 1.8 / -0.7 | – |  |
| Green Devotee (green.devotee) | 2 | 2.0 [0.8–3.3] | 150 | ±1.9 | -2.7 / -2.0 / -1.2 | – |  |
| Recruiter (red.recruiter) | 8 | 8.0 [6.1–10.0] | 81 | ±2.9 | -3.2 / -0.4 / 0.5 | – |  |
| Light Fingers (thieves.lightfingers) | 8 | 8.0 [6.2–10.2] | 75 | ±3.1 | 0.1 / 1.8 / -4.3 | – |  |
| Sommelier (market.sommelier) | 4 | 4.0 [2.0–5.9] | 96 | ±3.0 | -10.2 / 5.1 / -1.1 | – |  |
| Foreman (purple.foreman) | 6 | 6.0 [3.7–8.2] | 93 | ±3.4 | -1.4 / -1.6 / 2.1 | – |  |
| Tycoon (gold.tycoon) | 4 | 3.9 [2.8–4.9] | 406 | ±1.6 | -0.4 / 0.6 / 0.3 | 2.2 [-0.3–4.8] | 73 |
| Heir (silver.heir) | 8 | 7.9 [6.1–9.8] | 137 | ±2.8 | 3.5 / -2.5 / 0.6 | – |  |
| Raider (trading.raider) | 2 | 1.9 [-0.4–3.8] | 87 | ±3.2 | -4.8 / -6.8 / 0.3 | – |  |
| Intern (red.intern) | 1 | 0.9 [-0.8–2.7] | 125 | ±2.6 | 1.8 / 6.7 / 0.0 | – |  |
| Sower (yellow.sower) | 2 | 1.8 [0.2–3.4] | 99 | ±2.5 | 0.9 / 0.0 / -7.2 | – |  |
| Steward (silver.steward) | 4 | 3.8 [2.1–5.9] | 141 | ±2.9 | -3.7 / -3.3 / -1.0 | – |  |
| Shareholder (trading.shareholder) | 3 | 2.8 [1.2–4.6] | 89 | ±2.6 | -9.3 / 4.8 / -2.1 | – |  |
| Squatter (benders.squatter) | 8 | 7.8 [6.7–9.0] | 249 | ±1.8 | 1.2 / 4.5 / -2.4 | – |  |
| Tax Collector (gold.taxman) | 4 | 3.7 [2.2–5.5] | 136 | ±2.5 | -5.0 / -0.1 / 3.4 | – |  |
| Gardener (yellow.gardener) | 2 | 1.7 [-0.1–3.5] | 75 | ±2.8 | -1.5 / -4.2 / -0.5 | – |  |
| Merchant (gold.merchant) | 6 | 5.7 [4.0–7.4] | 128 | ±2.6 | 0.7 / -2.4 / -1.6 | – |  |
| Stunt Double (echo.hourglass) | 10 | 9.7 [7.5–12.3] | 71 | ±3.6 | 3.2 / -11.6 / 2.6 | – |  |
| Busker (echo.evergreen) | 8 | 7.7 [5.0–10.1] | 75 | ±3.9 | 3.1 / 4.1 / 12.0 | – |  |
| Green Elder (green.elder) | 4 | 3.7 [2.2–5.6] | 129 | ±2.6 | -4.3 / -1.2 / 0.7 | – |  |
| Insider (benders.insider) | 4 | 3.7 [2.6–4.8] | 301 | ±1.6 | -7.5 / -1.3 / -1.6 | – |  |
| Exporter (trading.exporter) | 4 | 3.7 [1.6–5.9] | 98 | ±3.3 | 3.1 / -0.6 / 0.9 | – |  |
| Harmonist (yellow.harmonist) | 4 | 3.6 [1.3–5.9] | 55 | ±3.5 | 7.8 / -2.9 / 0.8 | – |  |
| Grifter (thieves.grifter) | 6 | 5.6 [4.2–7.0] | 71 | ±2.1 | 0.0 / -3.0 / 3.2 | – |  |
| Benefactor (silver.benefactor) | 6 | 5.6 [3.8–7.2] | 146 | ±2.5 | 0.6 / 2.1 / -0.8 | – |  |
| Extortionist (thieves.extortionist) | 10 | 9.5 [6.1–12.8] | 31 | ±5.1 | -7.3 / 11.7 / -5.3 | – |  |
| Double Agent (thieves.doubleagent) | 6 | 5.5 [3.3–7.8] | 63 | ±3.4 | -3.7 / -4.8 / 3.3 | – |  |
| Curator (market.curator) | 4 | 3.5 [1.4–5.6] | 87 | ±3.2 | -1.9 / -6.0 / 1.1 | – |  |
| Patroness (market.patroness) | 4 | 3.5 [1.9–5.5] | 88 | ±2.7 | -2.8 / 3.9 / -0.7 | – |  |
| Guest (silver.guest) | 8 | 7.5 [5.8–8.8] | 141 | ±2.3 | -5.9 / 0.7 / -2.3 | – |  |
| Understudy (echo.understudy) | 6 | 5.4 [3.3–7.9] | 75 | ±3.5 | -17.9 / -5.3 / 0.7 | – |  |
| Blue Helper (blue.helper) | 2 | 1.4 [-0.2–3.0] | 120 | ±2.4 | 1.9 / -3.2 / -1.8 | – |  |
| Onlooker (market.onlooker) | 10 | 9.4 [7.2–11.4] | 70 | ±3.2 | 8.5 / -6.1 / -5.2 | – |  |
| Pawnbroker (trading.pawnbroker) | 4 | 3.4 [1.7–5.1] | 97 | ±2.6 | 5.3 / -3.6 / -0.5 | – |  |
| Green Regular (green.regular) | 3 | 2.3 [1.1–3.6] | 143 | ±1.9 | 1.8 / -1.9 / -2.6 | – |  |
| Go-Getter (purple.secondwind) | 8 | 7.3 [5.3–9.1] | 81 | ±2.9 | -1.0 / -2.9 / -3.4 | – |  |
| Banker (gold.banker) | 8 | 7.3 [6.1–8.6] | 429 | ±1.9 | 0.5 / -4.9 / -1.1 | 7.5 [5.1–10.3] | 71 |
| Freelancer (benders.freelancer) | 4 | 3.3 [2.4–4.4] | 301 | ±1.5 | 2.1 / -1.4 / -3.8 | – |  |
| Midas (gold.midas) | 4 | 3.2 [1.6–5.0] | 146 | ±2.5 | 0.1 / -6.9 / -6.9 | – |  |
| Lamplighter (purple.lamplighter) | 12 | 11.2 [9.0–13.4] | 66 | ±3.3 | -3.0 / 7.6 / -3.9 | – |  |
| Host (red.host) | 6 | 5.1 [3.5–6.9] | 100 | ±2.6 | -11.8 / -4.7 / -1.6 | – |  |
| Translator (echo.translator) | 4 | 3.1 [1.2–5.2] | 94 | ±3.0 | 2.6 / -2.7 / -5.1 | – |  |
| Upstart (silver.spoon) | 6 | 5.1 [3.2–7.3] | 138 | ±3.1 | 2.3 / -2.9 / 1.4 | – |  |
| Clockmaker (purple.clockmaker) | 4 | 3.0 [1.1–4.7] | 101 | ±2.8 | 4.4 / -4.4 / -2.7 | – |  |
| Green Helper (green.helper) | 2 | 1.0 [-0.5–2.3] | 145 | ±2.1 | -7.1 / -0.8 / -1.3 | – |  |
| Muse (echo.muse) | 4 | 3.0 [1.3–4.7] | 88 | ±2.6 | 0.9 / -10.2 / 0.7 | – |  |
| Retinue (silver.retinue) | 2 | 0.8 [-0.9–2.3] | 132 | ±2.4 | -3.0 / 1.8 / 1.8 | – |  |
| Peddler (yellow.peddler) | 8 | 6.8 [5.1–8.4] | 76 | ±2.5 | 4.4 / 4.3 / -2.0 | – |  |
| Blue Pillar (blue.pillar) | 6 | 4.8 [3.5–6.2] | 117 | ±2.0 | -0.5 / -8.6 / 1.6 | – |  |
| Green Pillar (green.pillar) | 4 | 2.7 [1.1–4.3] | 145 | ±2.4 | 1.0 / 0.5 / -2.5 | – |  |
| Heiress (trading.heiress) | 6 | 4.7 [2.8–6.9] | 86 | ±3.1 | -4.9 / -4.9 / 0.1 | – |  |
| Explorer (yellow.explorer) | 8 | 6.7 [4.2–9.6] | 66 | ±4.1 | -4.1 / -3.7 / -2.6 | – |  |
| Apprentice (purple.apprentice) | 4 | 2.5 [1.1–4.0] | 101 | ±2.2 | -5.1 / -8.4 / -2.3 | – |  |
| Reseller (market.reseller) | 6 | 4.5 [1.9–7.0] | 78 | ±3.8 | -7.5 / -2.3 / -0.8 | – |  |
| Mime (echo.mirror) | 6 | 4.5 [2.4–7.0] | 80 | ±3.5 | -12.3 / -0.9 / 3.1 | – |  |
| Snob (market.snob) | 5 | 3.5 [1.4–5.4] | 83 | ±3.0 | -2.0 / -5.5 / -4.9 | – |  |
| Blue Elder (blue.elder) | 4 | 2.4 [0.8–4.3] | 113 | ±2.6 | 0.3 / 0.1 / 0.4 | – |  |
| Dowager (silver.dowager) | 4 | 2.3 [0.4–4.1] | 138 | ±2.8 | -7.7 / -5.2 / 3.2 | – |  |
| Blue Devotee (blue.devotee) | 4 | 2.3 [1.0–3.3] | 133 | ±1.7 | -11.3 / -3.2 / -2.1 | 0.9 [-0.9–3.3] | 50 |
| Big Family (red.bigfamily) | 4 | 2.2 [1.1–3.3] | 355 | ±1.6 | -4.2 / -3.6 / -1.2 | 3.8 [2.1–5.9] | 69 |
| Green Patron (green.patron) | 6 | 4.2 [2.6–5.8] | 122 | ±2.4 | -3.2 / 1.6 / -2.6 | – |  |
| Volunteer (red.volunteer) | 4 | 2.2 [0.1–4.2] | 105 | ±3.1 | -2.1 / 6.2 / -1.9 | – |  |
| Speculator (gold.speculator) | 8 | 6.1 [4.5–7.9] | 135 | ±2.5 | -4.0 / -5.2 / -2.7 | – |  |
| Impressionist (echo.tuningfork) | 4 | 2.0 [-0.5–4.5] | 80 | ±3.8 | 3.9 / 1.6 / -6.1 | – |  |
| Patron Saint (silver.saint) | 6 | 3.9 [2.2–5.5] | 134 | ±2.5 | -3.3 / -3.0 / -3.0 | – |  |
| Bookkeeper (purple.bookkeeper) | 6 | 3.9 [2.4–5.5] | 95 | ±2.4 | 3.8 / -2.8 / -0.5 | – |  |
| Courier (purple.courier) | 6 | 3.9 [2.4–5.6] | 100 | ±2.4 | -4.9 / 0.8 / 2.0 | – |  |
| Late Bloomer (yellow.latebloomer) | 4 | 1.9 [0.7–3.5] | 93 | ±2.2 | 0.4 / -8.4 / 0.2 | 4.0 [2.0–5.9] | 62 |
| Talent Scout (market.blackmarket) | 4 | 1.7 [-0.4–3.8] | 88 | ±3.2 | -2.3 / -1.7 / 1.7 | – |  |
| Investor (gold.investor) | 6 | 3.7 [2.0–5.6] | 132 | ±2.7 | 0.6 / -0.1 / 1.5 | – |  |
| Late Riser (purple.lateriser) | 6 | 3.5 [1.4–5.4] | 94 | ±3.0 | -7.0 / 0.1 / -5.0 | – |  |
| Sponsor (red.sponsor) | 10 | 7.5 [6.0–8.6] | 228 | ±2.0 | -5.3 / -4.6 / -7.0 | 11.3 [8.1–14.1] | 34 |
| Sticky Fingers (thieves.sticky) | 8 | 5.2 [3.4–7.1] | 74 | ±2.7 | -7.5 / -9.5 / -1.7 | 6.7 [5.0–8.5] | 49 |
| Gleaner (yellow.gleaner) | 10 | 7.2 [5.0–10.3] | 45 | ±4.0 | -6.5 / -4.9 / -8.9 | – |  |
| Night Owl (purple.nightowl) | 10 | 7.2 [5.5–9.5] | 79 | ±3.0 | -0.2 / -8.2 / -4.7 | 9.3 [4.6–14.3] | 32 |
| Admirer (yellow.admirer) | 4 | 1.0 [-1.5–3.9] | 69 | ±4.1 | -3.0 / 2.3 / 3.4 | – |  |
| Choir (echo.choir) | 6 | 2.9 [1.0–4.6] | 73 | ±2.7 | -2.1 / -5.8 / 4.3 | 5.9 [3.7–7.9] | 51 |
| Revelers (silver.revelers) | 6 | 2.7 [0.8–4.4] | 136 | ±2.7 | 1.0 / 0.7 / -2.0 | 5.2 [1.4–7.9] | 46 |
| Farmer (yellow.farmer) | 6 | 2.6 [0.3–4.7] | 60 | ±3.3 | -5.7 / 5.0 / -10.6 | 2.0 [-1.0–5.8] | 32 |
| Doppelganger (red.doppel) | 6 | 2.5 [1.1–4.2] | 108 | ±2.3 | -10.0 / -3.5 / -2.6 | 4.3 [2.4–6.5] | 50 |
| Chronicler (echo.chronicler) | 8 | 4.5 [2.6–6.5] | 79 | ±2.9 | -8.4 / -7.9 / -5.3 | 2.9 [0.2–5.4] | 57 |
| Mob (red.mob) | 8 | 4.4 [1.9–6.0] | 101 | ±3.1 | -3.4 / -0.8 / -7.8 | 7.2 [4.7–9.2] | 43 |
| Timekeeper (purple.patience) | 6 | 2.1 [0.3–3.5] | 96 | ±2.4 | -2.9 / -5.7 / -4.4 | 2.5 [-0.8–5.8] | 49 |
| Ensemble (echo.ensemble) | 6 | 1.9 [0.2–3.9] | 82 | ±2.8 | -2.0 / -10.9 / -5.1 | 2.0 [-0.3–4.7] | 55 |
| Taskmaster (purple.taskmaster) | 6 | 1.8 [-0.1–3.9] | 95 | ±3.0 | -6.5 / -1.6 / -5.6 | 4.2 [0.6–7.9] | 45 |
| Groupie (echo.groupie) | 8 | 3.5 [1.1–5.6] | 78 | ±3.4 | -10.9 / 2.0 / -1.8 | 5.9 [4.2–7.4] | 51 |

</details>

Power: for the 107 cards Normal reads in band, the smallest gap this run could have caught (80% power, 90% interval) is 2.8 cost points at the median card, 3.7 at the 90th percentile (column "detectable" in the full table). More seeds narrow it as 1/√n.

## 2b. Card × sphere and space × sphere outliers
Normal's residuals on the tables where the seat held the item, grouped by each other sphere at the table: a card fine overall but off beside one sphere. Listed at |deviation| ≥ 3 cost points (spaces: 3 scaled u) and |z| ≥ 3.5 among 1372 card × sphere and 1345 space × sphere pairs with n ≥ 15 (about one false alarm expected). Hard-20 beside it where its targets covered the pair.

| card | beside | deviation [90%] | n | Hard-20 |
|---|---|---|---|---|
| Dyer | Gold (gold) | -5.0 ±2.3 pts | 15 | – |

| space | beside | deviation [90%] | n | Hard-20 |
|---|---|---|---|---|
| Open House r3 | Purple (purple) | -8.3 ±3.4 u | 30 | – |
| Shake Down r3 | Gold (gold) | +8.4 ±3.6 u | 16 | -0.8 ±3.3 (n 33) |

## 3. Spaces
Paired forced placement: from the start of round r, the seat's first minion must take the space (base: the bot's own choice). A "null" minion (bot's own choice, action does nothing) in every game gives the zero, so worth = followers of margin over a minion that does nothing; u = worth ÷ that round's price slope (Normal 1.12 / 1.01 / 0.68, Hard-20 0.96 / 0.98 / 0.58 followers per resource, rounds I / II / III). Raw u also counts the buy a placement enables and early compounding, so it runs high; scaled u sets each round's median space to the middle of its band (×1.70 / 1.23 / 1.62 for rounds I / II / III) and says where a space sits among its round's field on the value model's ruler (round I 2–3u, II 3–5u, III 5–9u). Flag, on scaled u: above the band in any round, below it in the space's own ring's round, or worth below 0. "vs choice" = against the bot's own pick (≤ 0 means the bot was right to skip it). Blocked = a rival took it first.
Normal's own pick is worth 1.0 followers in round 1, 4.2 followers in round 2, 5.3 followers in round 3 over a null minion (0.9u / 4.2u / 7.8u).

### Both instruments agree (8)
| space | ring | round | Normal scaled u [90%] n | Hard-20 scaled u [90%] n | band | reads |
|---|---|---|---|---|---|---|
| Crunch Time (purple) | 3 | 3 | 13.9 [10.0–18.6] 71 | 18.7 [12.6–28.2] 55 | 5–9 | strong |
| Toast (silver) | 1 | 3 | 20.2 [16.9–23.3] 111 | 16.1 [10.0–23.5] 28 | 5–9 | strong |
| Golden Years (gold) | 1 | 3 | 12.0 [9.9–14.7] 123 | 15.2 [11.3–19.9] 64 | 5–9 | strong |
| Branch Out (yellow) | 2 | 2 | 0.2 [-2.0–2.2] 77 | -0.5 [-4.2–2.8] 58 | 3–5 | weak |
| Crescendo (echo) | 1 | 3 | 13.0 [10.1–15.9] 92 | 17.2 [10.5–24.7] 53 | 5–9 | strong |
| Greatest Hits (echo) | 3 | 3 | -2.6 [-6.0–0.3] 71 | -1.2 [-5.1–4.4] 53 | 5–9 | weak |
| Shake Down (thieves) | 2 | 3 | 12.6 [9.9–15.6] 77 | 14.0 [10.7–19.0] 57 | 5–9 | strong |
| Dividend (trading) | 2 | 3 | 16.7 [13.1–21.6] 58 | 26.0 [17.4–35.5] 36 | 5–9 | strong |

### Normal flags, Hard-20 confidently doesn't (likely a Normal-bot artifact) (2)
Toast r2 (Normal 7.0 [5.3–9.2], Hard-20 -0.3 [-5.2–5.3] scaled u); Harvest r2 (Normal 8.2 [6.2–10.3], Hard-20 4.2 [1.2–7.2] scaled u).

Normal flags, Hard-20 too thin or unsure to say: Intro Offer r1 strong (6.2u; Hard-20 3.8u, n 57); Bloom r3 strong (13.5u; Hard-20 16.1u, n 13); Orchard r3 strong (13.4u; Hard-20 13.8u, n 15); Rising Tide r3 strong (17.5u; Hard-20 16.6u, n 26); Intro Offer r2 strong (7.4u; Hard-20 6.4u, n 40); Help Yourself r1 strong (6.3u; Hard-20 4.1u, n 47); Bandwagon r1 weak (-0.8u; Hard-20 -1.4u, n 77).

Power: for the 137 space-rounds Normal reads in band, the smallest miss this run could have caught is 4.1 scaled u at the median, 5.6 at the 90th percentile (column "detectable").

<details><summary>Every space and round (Normal; Hard-20 where measured)</summary>

| space | sphere | ring | round | worth (followers) [90%] | raw u | scaled u [90%] | detectable | vs choice | blocked | n | Hard-20 scaled u [90%] |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Help Yourself | thieves | 1 | 1 | 4.1 [2.0–6.9] | 3.7 | 6.3 [3.1–10.5] | ±5.6 | 3.1 | 0.0% | 88 | 4.1 [-0.6–9.2] |
| Intro Offer | gold | 1 | 1 | 4.1 [2.0–6.1] | 3.7 | 6.2 [3.1–9.3] | ±4.7 | 3.1 | 0.0% | 119 | 3.8 [-0.1–7.9] |
| Shoal | blue | 1 | 1 | 4.0 [1.4–6.5] | 3.5 | 6.0 [2.1–9.9] | ±5.9 | 3.0 | 17.8% | 74 | 2.4 [-2.4–5.8] |
| Harvest | yellow | 1 | 1 | 3.8 [1.6–5.9] | 3.4 | 5.7 [2.4–9.0] | ±5.0 | 2.8 | 0.0% | 85 | -18.1 [-26.1–5.2] |
| Lie Low | thieves | 1 | 1 | 3.6 [0.9–6.3] | 3.2 | 5.4 [1.4–9.6] | ±6.2 | 2.6 | 0.0% | 72 | 3.6 [-4.8–12.9] |
| Sob Story | trading | 1 | 1 | 3.5 [0.4–5.9] | 3.1 | 5.3 [0.6–9.0] | ±6.3 | 2.5 | 5.1% | 74 | 7.1 [-0.1–14.5] |
| Kickback | gold | 1 | 1 | 3.2 [1.4–4.6] | 2.8 | 4.8 [2.1–7.1] | ±3.7 | 2.2 | 4.1% | 162 | 4.4 [-3.1–7.8] |
| Name Drop | market | 1 | 1 | 3.1 [0.8–6.1] | 2.7 | 4.7 [1.2–9.2] | ±6.0 | 2.1 | 14.1% | 79 | – |
| Tide | blue | 1 | 1 | 2.9 [1.0–5.1] | 2.6 | 4.5 [1.5–7.8] | ±4.7 | 1.9 | 1.7% | 118 | 6.0 [-0.5–8.8] |
| Sprout | green | 1 | 1 | 2.4 [0.5–4.3] | 2.1 | 3.6 [0.7–6.6] | ±4.4 | 1.4 | 1.6% | 122 | 5.5 [-3.5–17.2] |
| Clock In | purple | 1 | 1 | 2.3 [0.4–4.7] | 2.0 | 3.5 [0.6–7.1] | ±5.0 | 1.3 | 13.3% | 91 | -13.8 [-16.1–-1.6] |
| Roll Call | purple | 1 | 1 | 2.1 [0.4–4.0] | 1.9 | 3.2 [0.7–6.1] | ±4.1 | 1.1 | 0.0% | 76 | – |
| Good Deed | silver | 1 | 1 | 2.1 [-0.2–4.3] | 1.8 | 3.1 [-0.3–6.5] | ±5.1 | 1.1 | 0.8% | 119 | – |
| Snap Up | market | 1 | 1 | 1.9 [-0.7–4.4] | 1.7 | 2.8 [-1.0–6.7] | ±5.8 | 0.9 | 2.8% | 106 | -4.3 [-7.7–5.2] |
| Crescendo | echo | 1 | 1 | 1.7 [-0.7–3.7] | 1.5 | 2.6 [-1.0–5.6] | ±5.0 | 0.7 | 1.2% | 82 | 2.0 [-27.5–28.4] |
| New Faces | market | 1 | 1 | 1.7 [-0.7–3.5] | 1.5 | 2.5 [-1.1–5.3] | ±4.8 | 0.7 | 1.1% | 92 | – |
| Goody Bags | silver | 1 | 1 | 1.6 [-0.5–4.6] | 1.5 | 2.5 [-0.7–7.0] | ±5.8 | 0.6 | 25.4% | 94 | -4.7 [-10.3–6.3] |
| Redistribute | thieves | 1 | 1 | 1.6 [-0.2–3.4] | 1.4 | 2.4 [-0.3–5.2] | ±4.2 | 0.5 | 0.0% | 92 | 6.4 [-1.7–13.2] |
| Trade Seeds | yellow | 1 | 1 | 1.5 [-0.2–3.9] | 1.4 | 2.3 [-0.2–6.0] | ±4.7 | 0.5 | 0.0% | 82 | 9.5 [-7.7–21.0] |
| Graft | green | 1 | 1 | 1.4 [-0.2–3.2] | 1.3 | 2.1 [-0.2–4.9] | ±3.9 | 0.4 | 0.0% | 140 | -14.6 [-19.4–5.2] |
| Open Door | red | 1 | 1 | 1.0 [-0.7–3.0] | 0.8 | 1.4 [-1.1–4.5] | ±4.2 | -0.1 | 5.1% | 131 | 17.5 [-2.4–26.2] |
| Current | blue | 1 | 1 | 0.9 [-1.3–3.6] | 0.8 | 1.4 [-2.0–5.4] | ±5.6 | -0.1 | 1.4% | 68 | – |
| Root | green | 1 | 1 | 0.9 [-1.3–3.1] | 0.8 | 1.3 [-2.0–4.7] | ±5.1 | -0.1 | 15.6% | 92 | 4.5 [-2.0–11.9] |
| Catch Up | purple | 1 | 1 | 0.5 [-1.6–3.0] | 0.5 | 0.8 [-2.5–4.5] | ±5.2 | -0.5 | 0.0% | 67 | 8.2 [-5.2–19.6] |
| Hum | echo | 1 | 1 | 0.5 [-1.8–3.4] | 0.4 | 0.7 [-2.7–5.1] | ±5.9 | -0.5 | 5.9% | 80 | -9.5 [-15.0–0.1] |
| Cheap Seats | trading | 1 | 1 | 0.4 [-1.6–2.4] | 0.3 | 0.6 [-2.4–3.7] | ±4.6 | -0.6 | 0.0% | 92 | -6.7 [-10.6–4.1] |
| Echo | echo | 1 | 1 | 0.3 [-2.2–2.9] | 0.3 | 0.5 [-3.3–4.3] | ±5.8 | -0.7 | 4.3% | 89 | -1.4 [-6.7–6.7] |
| Top Up | yellow | 1 | 1 | 0.2 [-3.2–3.6] | 0.2 | 0.4 [-4.9–5.4] | ±7.8 | -0.8 | 26.5% | 61 | 9.8 [-4.6–27.6] |
| Toast | silver | 1 | 1 | 0.2 [-2.2–2.4] | 0.1 | 0.2 [-3.4–3.6] | ±5.3 | -0.8 | 0.0% | 118 | -12.0 [-19.3–6.3] |
| Golden Years | gold | 1 | 1 | -0.0 [-2.2–1.8] | -0.0 | -0.1 [-3.4–2.8] | ±4.7 | -1.0 | 0.0% | 121 | – |
| Your Call | trading | 1 | 1 | -0.1 [-2.4–2.6] | -0.1 | -0.1 [-3.6–4.0] | ±5.7 | -1.1 | 1.3% | 75 | 9.9 [-3.1–14.5] |
| Even Swap | red | 1 | 1 | -0.2 [-2.0–1.4] | -0.2 | -0.4 [-3.0–2.2] | ±3.9 | -1.3 | 0.0% | 153 | -1.6 [-5.2–2.4] |
| Bandwagon | red | 1 | 1 | -0.5 [-2.5–1.0] | -0.5 | -0.8 [-3.9–1.5] | ±4.1 | -1.5 | 0.0% | 135 | -1.4 [-5.1–3.0] |
| Harvest | yellow | 1 | 2 | 6.7 [5.1–8.5] | 6.6 | 8.2 [6.2–10.3] | ±3.2 | 2.5 | 1.0% | 97 | 4.2 [1.2–7.2] |
| Intro Offer | gold | 1 | 2 | 6.1 [4.6–8.0] | 6.0 | 7.4 [5.6–9.8] | ±3.2 | 1.8 | 0.0% | 120 | 6.4 [3.2–12.3] |
| Help Yourself | thieves | 1 | 2 | 5.7 [3.8–8.1] | 5.7 | 7.0 [4.7–9.8] | ±3.9 | 1.5 | 1.2% | 79 | 11.9 [3.0–14.8] |
| Toast | silver | 1 | 2 | 5.7 [4.3–7.5] | 5.7 | 7.0 [5.3–9.2] | ±2.9 | 1.5 | 17.2% | 111 | -0.3 [-5.2–5.3] |
| Harbor | blue | 2 | 2 | 5.4 [3.6–6.9] | 5.3 | 6.5 [4.4–8.5] | ±3.0 | 1.1 | 15.5% | 71 | 9.9 [0.8–13.0] |
| Tide | blue | 1 | 2 | 5.3 [3.7–6.6] | 5.2 | 6.4 [4.5–8.0] | ±2.6 | 1.0 | 0.0% | 124 | 5.4 [-0.9–8.0] |
| Lie Low | thieves | 1 | 2 | 5.2 [3.4–7.0] | 5.2 | 6.4 [4.1–8.5] | ±3.3 | 1.0 | 0.0% | 86 | 4.9 [-1.6–12.9] |
| Clock In | purple | 1 | 2 | 5.1 [2.9–7.6] | 5.0 | 6.2 [3.6–9.2] | ±4.3 | 0.8 | 14.0% | 80 | – |
| Swell | blue | 2 | 2 | 4.9 [3.4–6.2] | 4.9 | 6.0 [4.1–7.6] | ±2.6 | 0.7 | 7.4% | 88 | – |
| Good Deed | silver | 1 | 2 | 4.8 [3.2–6.8] | 4.8 | 5.9 [3.9–8.3] | ±3.3 | 0.6 | 0.9% | 111 | 2.7 [-0.9–5.1] |
| Name Drop | market | 1 | 2 | 4.8 [2.8–7.2] | 4.8 | 5.9 [3.4–8.8] | ±4.1 | 0.6 | 8.9% | 82 | – |
| Shake Down | thieves | 2 | 2 | 4.7 [2.9–6.8] | 4.7 | 5.7 [3.6–8.3] | ±3.6 | 0.5 | 3.0% | 96 | 5.3 [1.6–10.1] |
| Sell High | trading | 2 | 2 | 4.6 [2.0–7.3] | 4.6 | 5.7 [2.4–8.9] | ±4.8 | 0.4 | 6.8% | 68 | 5.5 [-0.8–8.1] |
| Open House | red | 2 | 2 | 4.6 [3.1–6.4] | 4.6 | 5.7 [3.8–7.8] | ±3.0 | 0.4 | 0.0% | 112 | – |
| Grove | green | 2 | 2 | 4.4 [3.0–6.2] | 4.4 | 5.4 [3.7–7.6] | ±2.9 | 0.2 | 6.3% | 120 | 6.5 [3.3–8.9] |
| Open Door | red | 1 | 2 | 4.0 [2.5–5.8] | 4.0 | 4.9 [3.1–7.1] | ±3.1 | -0.2 | 1.5% | 135 | 15.3 [-0.4–18.9] |
| Plan Ahead | purple | 2 | 2 | 3.9 [2.1–5.7] | 3.9 | 4.8 [2.6–7.0] | ±3.3 | -0.3 | 0.0% | 93 | – |
| Sprout | green | 1 | 2 | 3.8 [2.2–5.1] | 3.8 | 4.6 [2.7–6.2] | ±2.7 | -0.4 | 0.0% | 149 | – |
| Sob Story | trading | 1 | 2 | 3.7 [1.7–5.3] | 3.6 | 4.5 [2.1–6.5] | ±3.3 | -0.6 | 3.9% | 98 | – |
| Goody Bags | silver | 1 | 2 | 3.6 [1.1–5.7] | 3.6 | 4.4 [1.4–6.9] | ±4.2 | -0.6 | 2.1% | 93 | – |
| Overtime | purple | 2 | 2 | 3.5 [1.3–5.5] | 3.5 | 4.3 [1.5–6.7] | ±3.9 | -0.7 | 0.0% | 73 | – |
| Graft | green | 1 | 2 | 3.5 [2.0–5.1] | 3.4 | 4.2 [2.4–6.3] | ±2.9 | -0.8 | 0.0% | 137 | – |
| Shoal | blue | 1 | 2 | 3.4 [2.0–4.8] | 3.4 | 4.2 [2.5–5.9] | ±2.6 | -0.8 | 1.1% | 94 | – |
| Crescendo | echo | 1 | 2 | 3.4 [1.3–5.3] | 3.4 | 4.2 [1.6–6.5] | ±3.7 | -0.8 | 6.3% | 74 | – |
| Collect Debts | gold | 2 | 2 | 3.4 [1.5–5.2] | 3.4 | 4.2 [1.8–6.3] | ±3.4 | -0.8 | 6.7% | 126 | -4.1 [-7.7–4.3] |
| Reprise | echo | 2 | 2 | 3.4 [1.6–5.0] | 3.4 | 4.2 [1.9–6.0] | ±3.1 | -0.8 | 0.0% | 111 | -0.6 [-2.7–3.9] |
| Half Price | market | 2 | 2 | 3.3 [0.7–6.1] | 3.3 | 4.1 [0.8–7.4] | ±5.0 | -0.9 | 4.8% | 79 | 2.4 [-1.4–4.7] |
| Golden Years | gold | 1 | 2 | 3.3 [1.8–4.9] | 3.3 | 4.0 [2.1–6.0] | ±2.9 | -0.9 | 3.9% | 124 | -1.3 [-4.3–3.9] |
| Hum | echo | 1 | 2 | 3.3 [1.5–4.9] | 3.2 | 4.0 [1.8–5.9] | ±3.1 | -1.0 | 0.0% | 117 | – |
| Top Up | yellow | 1 | 2 | 3.2 [1.7–5.0] | 3.2 | 3.9 [2.1–6.1] | ±3.1 | -1.0 | 1.2% | 82 | – |
| New Faces | market | 1 | 2 | 3.1 [1.6–5.0] | 3.1 | 3.8 [1.9–6.1] | ±3.2 | -1.1 | 0.0% | 101 | – |
| Orchard | green | 2 | 2 | 3.1 [1.6–4.6] | 3.0 | 3.7 [2.0–5.6] | ±2.7 | -1.2 | 4.7% | 102 | 9.4 [-1.2–13.1] |
| Crime Wave | thieves | 2 | 2 | 3.1 [1.4–4.5] | 3.0 | 3.7 [1.7–5.5] | ±2.8 | -1.2 | 0.0% | 111 | -7.3 [-11.7–2.9] |
| Even Swap | red | 1 | 2 | 3.0 [1.5–4.5] | 3.0 | 3.7 [1.9–5.5] | ±2.7 | -1.2 | 1.5% | 133 | 1.0 [-3.4–7.4] |
| Echo | echo | 1 | 2 | 3.0 [0.8–5.2] | 3.0 | 3.7 [1.0–6.3] | ±4.0 | -1.2 | 2.4% | 82 | -3.6 [-5.6–4.3] |
| Redistribute | thieves | 1 | 2 | 2.8 [1.4–4.5] | 2.8 | 3.4 [1.7–5.5] | ±2.8 | -1.4 | 0.0% | 89 | – |
| Root | green | 1 | 2 | 2.8 [1.2–4.4] | 2.8 | 3.4 [1.5–5.4] | ±2.9 | -1.4 | 2.8% | 140 | 2.9 [-1.0–6.2] |
| Your Call | trading | 1 | 2 | 2.8 [0.8–4.8] | 2.7 | 3.4 [1.0–5.8] | ±3.6 | -1.5 | 1.2% | 85 | – |
| Sweet Talk | silver | 2 | 2 | 2.7 [0.9–4.3] | 2.7 | 3.3 [1.1–5.2] | ±3.1 | -1.5 | 0.0% | 111 | – |
| Dividend | trading | 2 | 2 | 2.7 [0.6–4.7] | 2.7 | 3.3 [0.8–5.7] | ±3.7 | -1.5 | 2.9% | 66 | – |
| Current | blue | 1 | 2 | 2.7 [1.4–4.2] | 2.7 | 3.3 [1.8–5.1] | ±2.5 | -1.5 | 0.0% | 106 | -5.2 [-14.5–4.6] |
| Potluck | yellow | 2 | 2 | 2.3 [-0.4–4.3] | 2.2 | 2.8 [-0.5–5.3] | ±4.4 | -2.0 | 0.0% | 63 | -5.4 [-9.7–2.0] |
| Tithe | gold | 2 | 2 | 2.2 [0.4–4.4] | 2.2 | 2.7 [0.5–5.4] | ±3.7 | -2.0 | 0.0% | 99 | 4.3 [-1.0–9.8] |
| Swap Sides | red | 2 | 2 | 2.2 [0.3–3.9] | 2.2 | 2.7 [0.3–4.8] | ±3.4 | -2.0 | 1.8% | 108 | -12.3 [-22.2–-1.7] |
| Kickback | gold | 1 | 2 | 2.0 [0.4–3.6] | 2.0 | 2.5 [0.5–4.4] | ±3.0 | -2.2 | 0.6% | 155 | -10.6 [-13.4–4.3] |
| Show Off | market | 2 | 2 | 1.8 [-0.3–4.2] | 1.8 | 2.2 [-0.4–5.1] | ±4.1 | -2.4 | 0.0% | 73 | – |
| Rising Tide | silver | 2 | 2 | 1.4 [-0.3–3.1] | 1.4 | 1.8 [-0.4–3.8] | ±3.1 | -2.8 | 0.0% | 127 | 15.6 [4.4–23.8] |
| Roll Call | purple | 1 | 2 | 1.2 [-0.3–3.0] | 1.2 | 1.5 [-0.3–3.6] | ±3.0 | -3.0 | 0.0% | 101 | – |
| Cheap Seats | trading | 1 | 2 | 1.1 [-1.1–3.3] | 1.1 | 1.4 [-1.3–4.1] | ±4.0 | -3.1 | 0.0% | 85 | 2.7 [-0.9–5.2] |
| Encore | echo | 2 | 2 | 1.0 [-1.1–3.4] | 1.0 | 1.3 [-1.3–4.1] | ±4.1 | -3.2 | 0.0% | 70 | -0.5 [-2.7–3.6] |
| Trade Seeds | yellow | 1 | 2 | 1.0 [-0.7–2.7] | 1.0 | 1.2 [-0.8–3.2] | ±3.0 | -3.2 | 1.4% | 69 | -4.8 [-7.5–3.9] |
| Bandwagon | red | 1 | 2 | 0.9 [-0.9–2.6] | 0.9 | 1.1 [-1.1–3.2] | ±3.2 | -3.3 | 0.0% | 117 | -1.8 [-6.5–2.4] |
| Snap Up | market | 1 | 2 | 0.7 [-1.0–2.2] | 0.7 | 0.8 [-1.2–2.7] | ±3.0 | -3.6 | 2.9% | 101 | – |
| Catch Up | purple | 1 | 2 | 0.6 [-1.3–2.8] | 0.6 | 0.8 [-1.6–3.4] | ±3.8 | -3.6 | 0.0% | 82 | 4.2 [-1.3–10.1] |
| Branch Out | yellow | 2 | 2 | 0.2 [-1.6–1.8] | 0.2 | 0.2 [-2.0–2.2] | ±3.2 | -4.0 | 0.0% | 77 | -0.5 [-4.2–2.8] |
| Toast | silver | 1 | 3 | 8.5 [7.1–9.8] | 12.4 | 20.2 [16.9–23.3] | ±4.8 | 3.2 | 14.0% | 111 | 16.1 [10.0–23.5] |
| Rising Tide | silver | 2 | 3 | 7.4 [6.3–8.9] | 10.8 | 17.5 [14.9–21.0] | ±4.7 | 2.0 | 10.4% | 103 | 16.6 [7.8–24.7] |
| Dividend | trading | 2 | 3 | 7.0 [5.5–9.1] | 10.3 | 16.7 [13.1–21.6] | ±6.5 | 1.7 | 12.1% | 58 | 26.0 [17.4–35.5] |
| Crunch Time | purple | 3 | 3 | 5.8 [4.2–7.9] | 8.5 | 13.9 [10.0–18.6] | ±6.5 | 0.5 | 0.0% | 71 | 18.7 [12.6–28.2] |
| Bloom | green | 3 | 3 | 5.7 [4.5–6.8] | 8.3 | 13.5 [10.6–16.2] | ±4.2 | 0.3 | 22.0% | 92 | 16.1 [8.7–23.5] |
| Orchard | green | 2 | 3 | 5.7 [4.5–6.9] | 8.3 | 13.4 [10.8–16.3] | ±4.2 | 0.3 | 0.0% | 97 | 13.8 [7.5–19.3] |
| Crescendo | echo | 1 | 3 | 5.5 [4.3–6.7] | 8.0 | 13.0 [10.1–15.9] | ±4.3 | 0.1 | 9.8% | 92 | 17.2 [10.5–24.7] |
| Shake Down | thieves | 2 | 3 | 5.3 [4.2–6.6] | 7.8 | 12.6 [9.9–15.6] | ±4.3 | -0.0 | 0.0% | 77 | 14.0 [10.7–19.0] |
| Clock In | purple | 1 | 3 | 5.2 [3.8–6.9] | 7.6 | 12.4 [8.9–16.3] | ±5.6 | -0.1 | 7.1% | 105 | 9.5 [4.8–13.5] |
| Your Call | trading | 1 | 3 | 5.1 [3.6–6.6] | 7.5 | 12.1 [8.6–15.5] | ±5.3 | -0.2 | 6.5% | 87 | 13.3 [7.4–20.4] |
| Flood | blue | 3 | 3 | 5.1 [3.8–6.3] | 7.5 | 12.1 [8.9–14.9] | ±4.5 | -0.2 | 24.2% | 75 | 16.6 [10.4–22.7] |
| Harbor | blue | 2 | 3 | 5.1 [3.8–6.3] | 7.4 | 12.1 [9.0–14.9] | ±4.5 | -0.3 | 0.0% | 82 | 10.4 [7.3–13.7] |
| Golden Years | gold | 1 | 3 | 5.1 [4.2–6.2] | 7.4 | 12.0 [9.9–14.7] | ±3.6 | -0.3 | 3.9% | 123 | 15.2 [11.3–19.9] |
| Hand-pick | red | 3 | 3 | 5.0 [3.7–6.0] | 7.3 | 11.8 [8.7–14.1] | ±4.1 | -0.4 | 4.6% | 103 | 18.4 [15.8–22.1] |
| Swell | blue | 2 | 3 | 4.7 [3.8–5.8] | 6.9 | 11.2 [8.9–13.6] | ±3.6 | -0.6 | 0.0% | 102 | 11.7 [8.2–15.4] |
| Help Yourself | thieves | 1 | 3 | 4.7 [3.3–6.2] | 6.8 | 11.1 [7.9–14.8] | ±5.2 | -0.6 | 0.0% | 95 | – |
| Plan Ahead | purple | 2 | 3 | 4.4 [3.2–5.5] | 6.4 | 10.4 [7.7–13.2] | ±4.1 | -0.9 | 0.0% | 89 | – |
| Lie Low | thieves | 1 | 3 | 4.4 [3.4–5.5] | 6.4 | 10.4 [8.0–13.1] | ±3.9 | -1.0 | 0.0% | 83 | – |
| Overtime | purple | 2 | 3 | 4.2 [3.2–5.5] | 6.1 | 10.0 [7.7–12.9] | ±4.0 | -1.1 | 0.0% | 88 | – |
| Poach | thieves | 3 | 3 | 4.2 [3.1–5.4] | 6.1 | 9.9 [7.4–12.8] | ±4.1 | -1.2 | 0.0% | 92 | – |
| Grove | green | 2 | 3 | 4.0 [2.9–5.1] | 5.8 | 9.5 [6.9–12.1] | ±3.9 | -1.3 | 0.0% | 110 | – |
| Show Off | market | 2 | 3 | 3.6 [1.9–5.6] | 5.3 | 8.6 [4.5–13.2] | ±6.6 | -1.7 | 0.0% | 75 | – |
| All In | trading | 3 | 3 | 3.5 [1.9–5.4] | 5.2 | 8.4 [4.5–12.8] | ±6.3 | -1.8 | 0.0% | 86 | – |
| Harvest | yellow | 1 | 3 | 3.5 [2.2–5.0] | 5.1 | 8.3 [5.1–11.8] | ±5.0 | -1.8 | 1.8% | 107 | – |
| Root | green | 1 | 3 | 3.5 [2.3–4.4] | 5.1 | 8.2 [5.6–10.4] | ±3.7 | -1.9 | 0.0% | 100 | – |
| Double Down | gold | 3 | 3 | 3.4 [2.1–4.8] | 5.0 | 8.1 [5.0–11.3] | ±4.7 | -1.9 | 5.1% | 112 | – |
| Open House | red | 2 | 3 | 3.3 [1.9–4.8] | 4.9 | 7.9 [4.6–11.4] | ±5.1 | -2.0 | 0.0% | 91 | – |
| Tithe | gold | 2 | 3 | 3.2 [1.9–4.2] | 4.7 | 7.7 [4.5–10.1] | ±4.2 | -2.1 | 1.9% | 102 | – |
| Sprout | green | 1 | 3 | 3.2 [2.4–4.1] | 4.7 | 7.7 [5.8–9.7] | ±2.9 | -2.1 | 0.0% | 165 | – |
| Goody Bags | silver | 1 | 3 | 3.1 [2.1–4.1] | 4.6 | 7.4 [5.0–9.8] | ±3.7 | -2.2 | 0.0% | 123 | – |
| Potluck | yellow | 2 | 3 | 3.1 [1.5–4.4] | 4.5 | 7.3 [3.5–10.5] | ±5.3 | -2.3 | 1.4% | 69 | – |
| Encore | echo | 2 | 3 | 3.0 [1.9–4.4] | 4.4 | 7.2 [4.4–10.4] | ±4.5 | -2.3 | 0.0% | 91 | – |
| Sob Story | trading | 1 | 3 | 3.0 [1.4–4.1] | 4.3 | 7.0 [3.3–9.8] | ±4.9 | -2.4 | 0.0% | 109 | – |
| Cheap Seats | trading | 1 | 3 | 2.9 [1.5–4.2] | 4.3 | 6.9 [3.6–10.0] | ±4.8 | -2.4 | 0.0% | 84 | – |
| New Faces | market | 1 | 3 | 2.7 [1.4–4.3] | 4.0 | 6.5 [3.3–10.2] | ±5.2 | -2.6 | 0.0% | 93 | – |
| Bumper Crop | yellow | 3 | 3 | 2.7 [1.5–4.0] | 4.0 | 6.4 [3.5–9.5] | ±4.6 | -2.6 | 6.3% | 90 | – |
| Collect Debts | gold | 2 | 3 | 2.6 [1.5–3.9] | 3.8 | 6.2 [3.6–9.2] | ±4.3 | -2.7 | 0.8% | 130 | – |
| Open Door | red | 1 | 3 | 2.4 [1.2–3.9] | 3.6 | 5.8 [2.8–9.1] | ±4.8 | -2.9 | 1.0% | 101 | – |
| Good Deed | silver | 1 | 3 | 2.4 [1.2–3.7] | 3.6 | 5.8 [3.0–8.7] | ±4.4 | -2.9 | 0.0% | 122 | – |
| Hum | echo | 1 | 3 | 2.4 [1.0–3.8] | 3.5 | 5.6 [2.3–8.9] | ±5.0 | -3.0 | 0.0% | 105 | – |
| Spree | market | 3 | 3 | 2.4 [0.9–3.9] | 3.4 | 5.6 [2.0–9.1] | ±5.4 | -3.0 | 0.0% | 82 | – |
| Bandwagon | red | 1 | 3 | 2.3 [1.3–3.2] | 3.4 | 5.5 [3.2–7.5] | ±3.3 | -3.0 | 0.0% | 141 | – |
| Echo | echo | 1 | 3 | 2.3 [0.9–3.7] | 3.3 | 5.4 [2.1–8.8] | ±5.0 | -3.1 | 1.1% | 86 | – |
| Trade Seeds | yellow | 1 | 3 | 2.2 [1.1–3.3] | 3.3 | 5.3 [2.6–7.7] | ±3.9 | -3.1 | 0.0% | 101 | – |
| Shoal | blue | 1 | 3 | 2.2 [1.3–3.4] | 3.3 | 5.3 [3.1–8.0] | ±3.7 | -3.1 | 0.0% | 83 | – |
| Kickback | gold | 1 | 3 | 2.2 [1.4–3.1] | 3.2 | 5.2 [3.4–7.3] | ±3.0 | -3.1 | 0.0% | 174 | – |
| Tide | blue | 1 | 3 | 2.1 [1.2–3.2] | 3.1 | 5.1 [2.9–7.6] | ±3.5 | -3.2 | 0.0% | 122 | – |
| Sweet Talk | silver | 2 | 3 | 2.1 [1.0–3.2] | 3.1 | 5.0 [2.4–7.5] | ±3.9 | -3.2 | 0.0% | 134 | – |
| Crime Wave | thieves | 2 | 3 | 2.1 [0.8–3.2] | 3.0 | 4.9 [2.0–7.6] | ±4.2 | -3.3 | 0.0% | 98 | – |
| Graft | green | 1 | 3 | 2.1 [1.2–3.0] | 3.0 | 4.9 [2.8–7.0] | ±3.2 | -3.3 | 0.0% | 117 | – |
| Current | blue | 1 | 3 | 2.0 [0.8–3.1] | 2.9 | 4.7 [1.8–7.3] | ±4.1 | -3.4 | 0.0% | 124 | – |
| Name Drop | market | 1 | 3 | 1.9 [0.6–3.2] | 2.8 | 4.6 [1.3–7.6] | ±4.8 | -3.4 | 0.0% | 90 | – |
| Top Up | yellow | 1 | 3 | 1.9 [0.6–3.4] | 2.8 | 4.6 [1.3–8.0] | ±5.0 | -3.4 | 0.0% | 76 | – |
| Sell High | trading | 2 | 3 | 1.9 [0.6–3.2] | 2.8 | 4.5 [1.4–7.7] | ±4.7 | -3.4 | 0.0% | 89 | – |
| Hold Court | silver | 3 | 3 | 1.8 [0.4–3.2] | 2.6 | 4.2 [1.1–7.5] | ±4.9 | -3.6 | 0.0% | 131 | – |
| Redistribute | thieves | 1 | 3 | 1.7 [0.6–2.8] | 2.5 | 4.0 [1.5–6.7] | ±3.9 | -3.6 | 0.0% | 89 | – |
| Intro Offer | gold | 1 | 3 | 1.7 [0.6–2.7] | 2.5 | 4.0 [1.4–6.3] | ±3.7 | -3.7 | 0.0% | 138 | – |
| Catch Up | purple | 1 | 3 | 1.3 [0.1–2.8] | 2.0 | 3.2 [0.3–6.5] | ±4.7 | -4.0 | 0.0% | 106 | – |
| Even Swap | red | 1 | 3 | 1.2 [0.2–2.3] | 1.8 | 3.0 [0.4–5.5] | ±3.9 | -4.1 | 0.0% | 131 | – |
| Roll Call | purple | 1 | 3 | 1.1 [-0.1–2.4] | 1.6 | 2.6 [-0.2–5.6] | ±4.4 | -4.2 | 0.0% | 74 | – |
| Reprise | echo | 2 | 3 | 0.9 [-0.2–2.2] | 1.4 | 2.2 [-0.5–5.2] | ±4.3 | -4.4 | 1.1% | 86 | – |
| Swap Sides | red | 2 | 3 | 0.7 [-0.7–1.8] | 0.9 | 1.5 [-1.6–4.3] | ±4.4 | -4.7 | 0.0% | 93 | – |
| Branch Out | yellow | 2 | 3 | 0.6 [-0.2–1.4] | 0.9 | 1.5 [-0.5–3.3] | ±2.9 | -4.7 | 0.9% | 109 | – |
| Snap Up | market | 1 | 3 | 0.6 [-0.5–1.8] | 0.9 | 1.4 [-1.2–4.3] | ±4.2 | -4.7 | 0.0% | 121 | – |
| Half Price | market | 2 | 3 | 0.6 [-0.8–1.9] | 0.9 | 1.4 [-1.9–4.6] | ±4.9 | -4.7 | 0.0% | 116 | – |
| Greatest Hits | echo | 3 | 3 | -1.1 [-2.5–0.1] | -1.6 | -2.6 [-6.0–0.3] | ±4.7 | -6.4 | 0.0% | 71 | -1.2 [-5.1–4.4] |

</details>

## 4. Archetypes
One scripted seat (rotating) against 3 bots, Classic table. Target band 15–35% (parity 25%). Scripts are built on Normal's valuation: the buyer never recruits; a specialist adds +3 to its sphere's spaces and +2 to its members; the chaser adds twice the round-end contest standing a move leaves it; the hoarder recruits whenever any member is affordable.

| archetype | vs | n | win [90%] | followers (rivals) | members (rivals) | |
|---|---|---|---|---|---|---|
| pure follower buyer | 3 Normal | 240 | 17.5% [13.8%–21.9%] | 56.2 (56.4) | 0.0 (8.1) |  |
| pure follower buyer | 3 Hard-20 | 64 | 3.1% [1.0%–9.0%] | 53.3 (59.0) | 0.1 (7.4) | below band |
| member hoarder (recruits whenever it can) | 3 Normal | 240 | 6.7% [4.5%–9.8%] | 46.3 (57.5) | 14.2 (7.1) | below band |
| member hoarder (recruits whenever it can) | 3 Hard-20 | 64 | 12.5% [7.2%–20.9%] | 45.0 (58.4) | 14.6 (5.9) | edge |
| contest chaser (maximizes round-end leads) | 3 Normal | 240 | 13.7% [10.4%–17.7%] | 54.2 (59.0) | 8.4 (7.7) | edge |
| contest chaser (maximizes round-end leads) | 3 Hard-20 | 64 | 5.5% [2.4%–12.2%] | 51.2 (58.9) | 9.3 (6.2) | below band |
| Gold (gold) specialist | 3 Normal | 240 | 20.0% [16.1%–24.6%] | 56.9 (59.3) | 8.8 (7.8) |  |
| Gold (gold) specialist | 3 Hard-20 | 64 | 16.4% [10.2%–25.4%] | 52.6 (60.1) | 9.8 (6.8) |  |
| Red (red) specialist | 3 Normal | 240 | 27.4% [22.9%–32.3%] | 57.8 (57.7) | 10.2 (7.1) |  |
| Red (red) specialist | 3 Hard-20 | 64 | 22.7% [15.3%–32.3%] | 53.5 (58.1) | 10.8 (5.9) |  |
| Blue (market) specialist | 3 Normal | 240 | 19.2% [15.3%–23.7%] | 54.9 (58.3) | 9.6 (7.7) |  |
| Blue (market) specialist | 3 Hard-20 | 64 | 12.5% [7.2%–20.9%] | 53.3 (60.2) | 10.0 (6.6) | edge |
| Green (echo) specialist | 3 Normal | 240 | 18.3% [14.6%–22.8%] | 55.5 (58.0) | 8.9 (7.4) |  |
| Green (echo) specialist | 3 Hard-20 | 64 | 18.8% [12.1%–28.0%] | 53.5 (59.1) | 8.7 (6.6) |  |

## 5. Fairness
Base games (no probes), random tables. Parity is 25%.
- Normal tables, 440 games. By seat: P1 26.8% [23.5%–30.4%], P2 24.3% [21.1%–27.8%], P3 24.3% [21.1%–27.8%], P4 24.5% [21.3%–28.1%]. By round-I pick order: 1st 26.6% [23.3%–30.2%], 2nd 25.0% [21.8%–28.5%], 3rd 27.7% [24.4%–31.4%], 4th 20.7% [17.7%–24.0%]. Round-III first pick (fewest followers) wins 12.7% [10.3%–15.6%]; last of the first pass 51.8% [47.9%–55.7%].
- Hard-20 tables, 68 games. By seat: P1 26.5% [18.7%–36.0%], P2 25.0% [17.4%–34.5%], P3 27.9% [20.0%–37.6%], P4 20.6% [13.7%–29.7%]. By round-I pick order: 1st 35.3% [26.5%–45.2%], 2nd 35.3% [26.5%–45.2%], 3rd 14.7% [9.0%–23.1%], 4th 14.7% [9.0%–23.1%]. Round-III first pick (fewest followers) wins 8.8% [4.6%–16.2%]; last of the first pass 48.5% [38.8%–58.4%].

## 6. Health
| | Normal (440 games) | Hard-20 (68 games) |
|---|---|---|
| members per player (target 6–7) | 5.2 ±2.6 sd (21.0% land on 6–7; 5.2 cards) | 4.2 ±2.7 sd (15.1% land on 6–7; 4.2 cards) |
| final followers | 58.5 | 56.2 |
| … self | 1.0 (1.7%) | 1.0 (1.8%) |
| … members' worth | 7.1 (12.2%) | 5.7 (10.1%) |
| … buys 2→1 / 4→3 / 8→6 / 10→10 | 0.2 / 2.9 / 5.5 / 22.7 (53.5%) | 0.6 / 4.6 / 8.3 / 18.3 (56.6%) |
| … contests round I / II / III | 2.8 / 5.2 / 7.9 (27.1%) | 2.8 / 5.2 / 7.7 (27.8%) |
| … effects (member triggers, actions, game end) | 3.2 (5.5%) | 2.1 (3.7%) |
| resources left at the end | 8.9 mean, 18.0 p90, 90 max (2.4% hold 30+) | 7.8 mean, 16.0 p90, 38 max (0.7% hold 30+) |
| contests that paid 2+ / 3+ tied leaders | 27.8% / 5.8% of 5239 | 26.8% / 5.7% of 811 |
| steal events per game (units taken) | 9.6 (15.0) | 12.5 (19.1) |
| longest run of placements by one player (the snake alone makes 2) | 2.2 mean, 6 max (14.8% of games have 3+) | 2.2 mean, 4 max (16.2% of games have 3+) |
| decision richness: top two within 1 follower | n/a (needs Hard rollouts) | 28.3% of 5948 weighed decisions (median gap 2.64) |

