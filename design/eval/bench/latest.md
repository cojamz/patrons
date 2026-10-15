# Balance bench (full)

2026-10-15 02:48 UTC · commit a4d46e9 · content 17nxqj9f1m0.d8606c4f45 · 91.9 min on 4 workers (362 core-min) · 38 random 4-sphere tables (makeTables 4242, every compatible pair at least twice), dealt round-robin.
Games played: 11348 full-game equivalents (probe games fork mid-game and count as the part they play). Throughput: Normal 45.7 games per core-minute, Hard-20 8.5 (all four seats that level).
Instruments: **Normal** (all four seats) and **Hard-20** (Hard = Normal plus rollouts, at budget 20, uncapped, deterministic). Intervals are 90% (bootstrap over seeds for fits, Wilson for win rates). Method and limits: design/eval/bench/README.md.

One run is one sample: flags near the line churn from run to run (two full runs on the same rules kept 5 of 14 card flags, while estimates moved only as far as their intervals predict). **Act on the pooled list in trend.md**, which combines every run on the same rules content.

## What moved since last run
Against 2026-10-15 00:39 (669f85e):
- Cards: Lamplighter: not flagged → flagged cheap; Midas: flagged dear → not flagged; Corner-Cutter: flagged dear → not flagged; Tycoon: flagged dear → not flagged; Hustler: not flagged → flagged cheap; Big Spender: Normal fair 2.0 → 4.3; Sleepwalker: not flagged → flagged cheap; Ensemble: Normal fair 5.6 → -0.4; Busker: flagged cheap → not flagged; Blue Regular: Normal fair 1.0 → 4.5; Upstart: flagged cheap → not flagged; Lender: not flagged → flagged cheap; Exporter: not flagged → flagged dear; Patron Saint: flagged dear → not flagged; Toastmaster: flagged dear → not flagged; Peddler: flagged cheap → not flagged; Go-Between: not flagged → flagged dear; Proselytizer: not flagged → flagged dear; Light Fingers: Normal fair 3.3 → 7.5; Crew: not flagged → flagged cheap; Kingpin: not flagged → flagged cheap; Extortionist: flagged cheap → not flagged; Harmonist: not flagged → flagged dear; Desperado: not flagged → flagged cheap; Bodyguard: Normal fair 5.2 → 9.8.
- Spaces: Clock In (round 3): in → strong; Your Call (round 3): in → strong; Toast (round 3): in → strong; Dividend (round 3): in → strong; Orchard (round 2): strong → in; Branch Out (round 2): in → weak; Open House (round 2): strong → in; Shake Down (round 2): strong → in; Greatest Hits (round 3): in → weak.

## 1. Anchors
Every anchor's interval reaches its expected range, Hard-20 beats Normal, and both price slopes are clearly positive: the instruments are trusted. (An anchor is off when its 90% interval misses the range, or it has too few probes to say.)

- Price slope, followers of margin per extra cost point (the exchange rate for everything below): Normal 0.76 [0.72–0.80] (by fork round I/II/III: 0.78 [0.69–0.89], 0.88 [0.81–0.96], 0.62 [0.57–0.69]); Hard-20 0.85 [0.70–1.00] (by fork round I/II/III: 0.82 [0.45–1.15], 1.16 [0.98–1.43], 0.58 [0.37–0.78]). 
- Hard-20 alone vs 3 Normal (Classic, n=96): wins 37.0% [29.3%–45.3%]; parity is 25%, it must reach 32%. OK.

| instrument | anchor | printed | fair [90%] | n | expected | |
|---|---|---|---|---|---|---|
| Normal | Banker | 4 | 5.7 [4.2–7.1] | 455 | 4.5–10.5 | ok |
| Normal | Big Family | 4 | 2.9 [1.4–4.4] | 391 | 0.5–6.0 | ok |
| Normal | Sponsor | 10 | 8.0 [6.2–9.7] | 237 | 8.0–∞ | ok |
| Normal | Tycoon | 12 | 7.6 [6.1–9.0] | 307 | −∞–10.0 | ok |
| Hard-20 | Banker | 4 | 11.0 [8.4–13.9] | 74 | 4.5–10.5 | ok |
| Hard-20 | Big Family | 4 | 5.0 [2.3–8.2] | 72 | 0.5–6.0 | ok |
| Hard-20 | Sponsor | 10 | 10.8 [7.3–14.7] | 48 | 8.0–∞ | ok |
| Hard-20 | Tycoon | 12 | 8.5 [4.2–13.2] | 56 | −∞–10.0 | ok |

- Banker (4: "Now and at round start, +3 gold"). By arithmetic +9/+6/+3 gold by round recruited, ~7 averaged, plus a follower; the Normal sweep read 7.3 [6.3–8.3] recruited in round I.
- Big Family (4: "Worth 3 followers", no ability), the plain worth-N member: 3 followers ≈ 4 resources at 4→3, less the follower buy it displaces. The Normal sweep read 2.4 [0.6–3.6].
- Sponsor (10: "Your members cost 2 less"), rework-candidates #1, known strong: must not read cheaper than printed − 2.
- Tycoon (12: "Game end: +1 follower per 3 gold"), rework-candidates #3, known weak: must read at least 2 under printed.

## 2. Cards
Paired forced recruit: a private copy of the card, at printed −4 / printed / +4, recruited at the seat's first affordable buy from a random round on (I, II or III), against the same seed without it. Fair price = the price where it nets 0 followers of margin. Normal: 26372 probes over 440 seeds, every card. Hard-20: 2632 probes over 44 seeds, only the anchors and what Normal flags or reads ≥ 2.5 off (a card both must agree on can't be flagged by Hard alone). Flag = the 90% interval misses printed and the gap is ≥ 1.5, for BOTH instruments.

### Both instruments agree (16)
| card | printed | Normal fair [90%] n | Hard-20 fair [90%] n | reads | bought round |
|---|---|---|---|---|---|
| Sleepwalker (echo) | 6 | 13.1 [10.4–15.9] 72 | 10.0 [6.1–14.4] 64 | too cheap | 2.3 |
| Lender (trading) | 2 | 8.8 [6.6–11.3] 101 | 7.1 [5.2–9.8] 80 | too cheap, needs an ability change (would need > 2× its price) | 2.2 |
| Hustler (gold) | 2 | 8.7 [6.2–11.4] 128 | 8.1 [5.1–11.3] 68 | too cheap, needs an ability change (would need > 2× its price) | 2.2 |
| Go-Between (yellow) | 8 | 1.9 [-1.1–4.9] 67 | 2.6 [-1.1–5.4] 40 | too dear | 2.6 |
| Tax Collector (gold) | 4 | 9.7 [7.9–11.7] 144 | 7.8 [4.6–10.7] 72 | too cheap | 2.1 |
| Proselytizer (red) | 12 | 6.4 [3.9–8.8] 88 | 4.7 [-1.0–8.7] 39 | too dear | 2.5 |
| Kingpin (thieves) | 2 | 7.4 [5.4–9.4] 92 | 5.9 [3.3–8.9] 57 | too cheap, needs an ability change (would need > 2× its price) | 2.2 |
| Magnate (trading) | 8 | 2.8 [0.7–5.1] 90 | 5.0 [1.2–7.2] 75 | too dear | 2.4 |
| Crew (thieves) | 2 | 6.9 [4.9–9.8] 104 | 5.0 [3.1–6.9] 78 | too cheap, needs an ability change (would need > 2× its price) | 2.2 |
| Harmonist (yellow) | 8 | 3.3 [0.7–6.3] 46 | -0.9 [-4.1–2.1] 29 | too dear | 2.5 |
| Exporter (trading) | 8 | 3.4 [0.7–5.8] 73 | 4.9 [2.3–7.3] 83 | too dear | 2.4 |
| Lamplighter (purple) | 8 | 12.5 [9.8–15.2] 86 | 13.6 [11.6–15.9] 74 | too cheap | 2.5 |
| Green Pillar (green) | 6 | 1.6 [-0.5–3.4] 140 | 3.2 [0.0–5.8] 53 | too dear | 2.3 |
| Investor (gold) | 6 | 2.4 [0.3–4.7] 132 | 3.1 [-0.5–5.8] 67 | too dear | 2.4 |
| Desperado (thieves) | 4 | 7.1 [5.3–8.9] 88 | 7.5 [5.0–9.6] 73 | too cheap | 2.3 |
| Banker (gold) | 4 | 5.7 [4.2–7.1] 455 | 11.0 [8.4–13.9] 74 | too cheap | 2.1 |

### Needs an ability change, not a price (4)
Hustler (printed 2; Normal 8.7, Hard-20 8.1: would need > 2× its price); Lender (printed 2; Normal 8.8, Hard-20 7.1: would need > 2× its price); Crew (printed 2; Normal 6.9, Hard-20 5.0: would need > 2× its price); Kingpin (printed 2; Normal 7.4, Hard-20 5.9: would need > 2× its price).

### Normal flags, Hard-20 confidently doesn't (likely a Normal-bot artifact) (1)
Ensemble 6 (Normal -0.4 [-3.2–2.6], Hard-20 3.5 [-0.2–7.3]).

Normal flags, Hard-20 too thin or unsure to say: Midas 8→3.0 (Hard-20 6.3, n 71); Corner-Cutter 6→2.2 (Hard-20 3.4, n 73); Tycoon 12→7.6 (Hard-20 8.5, n 56); Foreman 6→9.0; Revelers 6→3.7; Apprentice 4→0.4; Timekeeper 8→4.6; Squatter 8→5.4; Retinue 4→0.4; Straggler 8→5.9; Late Riser 6→2.4; Tinker 6→9.2; Merchant 6→3.7; Chronicler 8→3.4; Groupie 8→4.4; Insider 6→3.5; Busker 4→7.0; Blue Pillar 6→2.6; Reinvestor 4→1.2; Heiress 10→6.0; Liquidator 6→2.5; Extra Hand 10→7.9; Upstart 6→10.2; Blue Devotee 4→1.5; Patron Saint 12→4.9 (Hard-20 8.9, n 33); Toastmaster 8→4.9; Green Elder 4→0.4 (Hard-20 2.3, n 54); Peddler 4→9.2 (Hard-20 6.6, n 44); Gardener 2→5.2 (Hard-20 2.5, n 37); Green Patron 6→3.6; Safecracker 4→7.7; Sponsor 10→8.0 (Hard-20 10.8, n 48); Extortionist 6→10.0; Mole 4→7.1 (Hard-20 5.8, n 72); Cutpurse 4→6.8; Double Agent 6→2.8; Choir 6→-0.0 (Hard-20 3.2, n 56); Green Devotee 4→1.0 (Hard-20 2.8, n 58); Dyer 6→2.9; Rainmaker 6→2.5; Mentor & Protégé 10→7.0; Farmer 6→3.2; Recluse 4→7.9; Bodyguard 6→9.8; Talent Scout 4→1.6; Robin Hood 4→7.1; Underbidder 2→5.4; Planner 4→9.8 (Hard-20 5.9, n 13).

<details><summary>Every card (Normal; Hard-20 where measured)</summary>

| card | printed | Normal fair [90%] | n | detectable | net at printed by round I/II/III | Hard-20 fair [90%] | n |
|---|---|---|---|---|---|---|---|
| Sleepwalker (echo.afterimage) | 6 | 13.1 [10.4–15.9] | 72 | ±4.2 | 11.7 / 4.6 / 6.4 | 10.0 [6.1–14.4] | 64 |
| Lender (trading.lender) | 2 | 8.8 [6.6–11.3] | 101 | ±3.6 | 10.8 / 1.1 / 1.0 | 7.1 [5.2–9.8] | 80 |
| Hustler (gold.hustler) | 2 | 8.7 [6.2–11.4] | 128 | ±3.9 | 5.6 / 5.7 / 5.3 | 8.1 [5.1–11.3] | 68 |
| Planner (market.planner) | 4 | 9.8 [6.5–12.7] | 86 | ±4.7 | 7.1 / 14.3 / 2.1 | 5.9 [1.9–10.0] | 13 |
| Tax Collector (gold.taxman) | 4 | 9.7 [7.9–11.7] | 144 | ±2.8 | 1.6 / 12.4 / 7.6 | 7.8 [4.6–10.7] | 72 |
| Kingpin (thieves.kingpin) | 2 | 7.4 [5.4–9.4] | 92 | ±3.0 | 7.2 / 10.4 / 5.6 | 5.9 [3.3–8.9] | 57 |
| Peddler (yellow.peddler) | 4 | 9.2 [6.5–12.1] | 90 | ±4.2 | 7.3 / -0.7 / 4.7 | 6.6 [4.0–9.5] | 44 |
| Crew (thieves.crew) | 2 | 6.9 [4.9–9.8] | 104 | ±3.7 | -12.7 / -0.0 / 4.4 | 5.0 [3.1–6.9] | 78 |
| Lamplighter (purple.lamplighter) | 8 | 12.5 [9.8–15.2] | 86 | ±4.1 | -6.7 / 0.8 / 7.5 | 13.6 [11.6–15.9] | 74 |
| Upstart (silver.spoon) | 6 | 10.2 [7.4–12.5] | 135 | ±3.8 | 1.0 / 2.4 / 9.7 | – |  |
| Extortionist (thieves.extortionist) | 6 | 10.0 [6.9–13.4] | 71 | ±4.9 | 4.1 / 12.4 / 1.3 | – |  |
| Recluse (market.recluse) | 4 | 7.9 [5.4–11.1] | 88 | ±4.3 | -5.6 / 2.7 / 4.4 | – |  |
| Bodyguard (thieves.watchdog) | 6 | 9.8 [7.5–12.5] | 79 | ±3.8 | 11.2 / -2.0 / 0.9 | – |  |
| Safecracker (thieves.bigscore) | 4 | 7.7 [5.5–10.1] | 95 | ±3.5 | 3.7 / 5.1 / 1.1 | – |  |
| Underbidder (market.underbidder) | 2 | 5.4 [2.3–8.1] | 81 | ±4.4 | 3.7 / 1.2 / 1.5 | – |  |
| Tinker (gold.tinker) | 6 | 9.2 [6.5–12.0] | 115 | ±4.2 | 2.6 / -3.3 / 1.9 | – |  |
| Gardener (yellow.gardener) | 2 | 5.2 [3.3–7.1] | 75 | ±2.9 | 2.8 / 5.1 / -1.2 | 2.5 [-1.7–6.4] | 37 |
| Robin Hood (thieves.robinhood) | 4 | 7.1 [4.6–10.4] | 105 | ±4.4 | -5.1 / 4.8 / 3.2 | – |  |
| Desperado (thieves.desperado) | 4 | 7.1 [5.3–8.9] | 88 | ±2.7 | -0.6 / 1.9 / 4.6 | 7.5 [5.0–9.6] | 73 |
| Mole (thieves.mole) | 4 | 7.1 [5.5–8.9] | 104 | ±2.6 | -1.1 / -1.7 / 4.3 | 5.8 [3.3–7.9] | 72 |
| Busker (echo.evergreen) | 4 | 7.0 [4.0–10.2] | 76 | ±4.6 | 7.0 / -0.5 / 5.2 | – |  |
| Foreman (purple.foreman) | 6 | 9.0 [6.7–11.7] | 114 | ±3.8 | 5.7 / -1.5 / 2.2 | – |  |
| Mime (echo.mirror) | 6 | 8.9 [5.8–11.6] | 93 | ±4.3 | 9.9 / 1.4 / -0.2 | – |  |
| Cutpurse (thieves.cutpurse) | 4 | 6.8 [4.7–8.9] | 116 | ±3.2 | 1.6 / 6.5 / -0.3 | – |  |
| Sticky Fingers (thieves.sticky) | 8 | 10.3 [7.5–12.5] | 72 | ±3.8 | 0.6 / 10.1 / -12.3 | – |  |
| Weaver (yellow.weaver) | 6 | 8.2 [5.1–11.0] | 66 | ±4.5 | 3.8 / -0.2 / 2.0 | – |  |
| Majordomo (silver.majordomo) | 6 | 8.2 [5.8–10.4] | 135 | ±3.5 | 4.3 / 1.7 / 4.9 | – |  |
| Lottery Winner (gold.jackpot) | 10 | 12.1 [9.7–14.7] | 129 | ±3.8 | 2.8 / 4.4 / 1.6 | – |  |
| Broker (trading.broker) | 2 | 4.0 [1.6–6.7] | 94 | ±3.8 | 0.9 / -3.6 / 0.5 | – |  |
| Intern (red.intern) | 1 | 2.9 [0.5–5.2] | 131 | ±3.6 | -4.4 / 2.6 / 2.7 | – |  |
| Muse (echo.muse) | 4 | 5.9 [3.8–8.3] | 91 | ±3.4 | 1.0 / 2.7 / 3.8 | – |  |
| Go-Getter (purple.secondwind) | 8 | 9.8 [7.2–12.4] | 96 | ±4.0 | -5.7 / 8.5 / 5.2 | – |  |
| Understudy (echo.understudy) | 6 | 7.7 [4.5–11.2] | 76 | ±5.0 | 17.8 / -4.7 / 2.2 | – |  |
| Shopkeeper (trading.shopkeeper) | 4 | 5.7 [3.4–8.5] | 94 | ±3.9 | 4.2 / -3.9 / 2.9 | – |  |
| Penny Pincher (gold.thrift) | 4 | 5.7 [3.9–7.6] | 149 | ±2.8 | 2.5 / 0.8 / -1.0 | – |  |
| Banker (gold.banker) | 4 | 5.7 [4.2–7.1] | 455 | ±2.2 | 2.2 / 0.6 / -1.8 | 11.0 [8.4–13.9] | 74 |
| Crowd-Pleaser (red.crowd) | 2 | 3.6 [1.0–6.0] | 128 | ±3.8 | -6.1 / -4.5 / 4.6 | – |  |
| Raider (trading.raider) | 2 | 3.6 [0.9–6.4] | 90 | ±4.1 | -0.5 / -3.8 / -0.6 | – |  |
| Blue Helper (blue.helper) | 2 | 3.5 [1.7–5.1] | 116 | ±2.6 | 2.0 / 2.5 / -0.3 | – |  |
| Blue Regular (blue.regular) | 3 | 4.5 [2.4–6.3] | 123 | ±2.9 | 4.3 / 0.0 / 1.5 | – |  |
| Twins (red.twins) | 2 | 3.4 [1.5–5.3] | 147 | ±2.9 | -6.1 / 0.0 / 8.2 | – |  |
| Caterer (silver.caterer) | 4 | 5.4 [3.3–7.3] | 143 | ±3.0 | -1.6 / -0.1 / -1.3 | – |  |
| Green Recruit (green.recruit) | 1 | 2.3 [0.5–4.1] | 146 | ±2.7 | 1.4 / 6.5 / -1.8 | – |  |
| Bulk Buyer (trading.bulkbuyer) | 6 | 7.3 [4.6–10.2] | 95 | ±4.3 | -2.5 / -2.6 / -0.5 | – |  |
| Tribute Band (echo.dejavu) | 12 | 13.2 [8.6–18.2] | 44 | ±7.2 | 21.8 / -10.3 / 1.2 | – |  |
| Heir (silver.heir) | 8 | 9.0 [6.8–11.1] | 140 | ±3.2 | 7.1 / 7.2 / 0.9 | – |  |
| Blue Recruit (blue.recruit) | 1 | 2.0 [0.5–3.8] | 126 | ±2.5 | -1.2 / 5.8 / 3.0 | – |  |
| Underdog (gold.underdog) | 6 | 7.0 [4.6–9.2] | 131 | ±3.5 | 3.4 / 4.0 / -0.7 | – |  |
| Feastmaker (yellow.feastmaker) | 10 | 10.9 [8.1–13.2] | 52 | ±3.8 | 1.9 / 1.0 / 4.3 | – |  |
| Errand Runner (purple.errand) | 8 | 8.8 [6.7–11.2] | 102 | ±3.4 | 4.5 / 1.4 / 1.3 | – |  |
| Stunt Double (echo.hourglass) | 10 | 10.6 [6.6–13.7] | 72 | ±5.3 | 6.6 / 2.8 / -1.3 | – |  |
| Volunteer (red.volunteer) | 0 | 0.6 [-1.4–2.9] | 139 | ±3.2 | 5.8 / -1.1 / 3.6 | – |  |
| Blue Elder (blue.elder) | 4 | 4.6 [2.6–6.2] | 119 | ±2.7 | -5.6 / 0.8 / -3.6 | – |  |
| Freelancer (benders.freelancer) | 4 | 4.6 [3.0–6.1] | 302 | ±2.3 | 1.5 / -3.1 / -0.9 | – |  |
| Lookout (thieves.lookout) | 6 | 6.6 [3.8–8.9] | 74 | ±3.8 | 2.3 / -0.4 / 1.0 | – |  |
| Social Climber (market.climber) | 2 | 2.6 [-0.3–5.5] | 72 | ±4.3 | 6.1 / -2.3 / -6.3 | – |  |
| Stylist (market.stylist) | 4 | 4.5 [1.8–7.4] | 74 | ±4.2 | -5.7 / -0.8 / 4.5 | – |  |
| Clockmaker (purple.clockmaker) | 4 | 4.5 [2.1–6.9] | 98 | ±3.6 | -2.3 / 8.0 / 4.8 | – |  |
| Tipster (trading.tipster) | 6 | 6.5 [4.5–9.0] | 94 | ±3.4 | -0.9 / 5.8 / 0.3 | – |  |
| Pawnbroker (trading.pawnbroker) | 4 | 4.5 [1.9–6.8] | 107 | ±3.7 | -4.8 / -6.3 / -2.4 | – |  |
| Rich Uncle (trading.safetynet) | 2 | 2.4 [-0.2–4.7] | 97 | ±3.7 | 2.3 / 3.4 / 3.4 | – |  |
| Accomplice (thieves.accomplice) | 8 | 8.4 [5.9–11.1] | 73 | ±3.9 | 1.2 / 7.2 / 0.4 | – |  |
| Grifter (thieves.grifter) | 6 | 6.3 [3.4–8.9] | 72 | ±4.2 | -0.8 / 2.1 / 3.6 | – |  |
| Treasurer (gold.seed) | 4 | 4.3 [1.7–6.4] | 128 | ±3.6 | -2.4 / 4.1 / 3.6 | – |  |
| Prospector (gold.prospector) | 4 | 4.3 [2.4–6.5] | 148 | ±3.1 | 8.2 / -3.3 / -0.2 | – |  |
| Big Spender (benders.bigspender) | 4 | 4.3 [3.0–5.7] | 307 | ±2.1 | 1.4 / 0.4 / 0.1 | – |  |
| Pilgrim (yellow.pilgrim) | 4 | 4.2 [1.6–6.9] | 93 | ±4.0 | 0.8 / -2.3 / -1.1 | – |  |
| Connoisseur (market.connoisseur) | 4 | 4.2 [1.4–7.2] | 85 | ±4.4 | -2.9 / -0.3 / -2.1 | – |  |
| Speculator (gold.speculator) | 8 | 8.2 [5.7–10.6] | 134 | ±3.7 | -2.0 / 1.4 / -2.2 | – |  |
| Benchwarmer (red.reserve) | 1 | 1.2 [-1.3–3.4] | 113 | ±3.5 | 3.2 / 2.2 / -1.3 | – |  |
| Mob (red.mob) | 8 | 8.2 [5.8–10.6] | 105 | ±3.7 | 5.5 / 12.1 / -0.2 | – |  |
| Wallflower (echo.wallflower) | 4 | 4.2 [1.3–6.7] | 86 | ±4.1 | -0.9 / -8.3 / -3.7 | – |  |
| Pied Piper (red.drive) | 4 | 4.1 [2.1–6.7] | 123 | ±3.5 | 0.1 / 5.0 / 2.1 | – |  |
| Debutante (silver.gala) | 8 | 8.1 [6.0–10.6] | 135 | ±3.4 | -8.4 / -0.1 / 2.5 | – |  |
| Shift Crew (purple.crew) | 2 | 2.1 [-0.5–5.1] | 95 | ±4.2 | -3.3 / -0.4 / 1.9 | – |  |
| Overseer (purple.overseer) | 4 | 4.0 [1.9–5.9] | 108 | ±3.0 | 5.3 / -0.4 / 0.0 | – |  |
| Green Regular (green.regular) | 3 | 3.0 [1.1–4.5] | 151 | ±2.6 | -1.9 / 2.0 / -3.0 | – |  |
| Courier (purple.courier) | 6 | 5.9 [4.1–9.0] | 99 | ±3.7 | -4.9 / -5.3 / -0.3 | – |  |
| Bookkeeper (purple.bookkeeper) | 6 | 5.9 [3.3–8.3] | 94 | ±3.8 | 6.6 / 8.3 / -6.2 | – |  |
| Late Bloomer (yellow.latebloomer) | 4 | 3.8 [1.5–6.0] | 80 | ±3.4 | 5.3 / -1.7 / -6.1 | – |  |
| Recruiter (red.recruiter) | 8 | 7.7 [5.2–10.3] | 102 | ±3.8 | -1.9 / 5.3 / -0.7 | – |  |
| Dealer (trading.dealer) | 2 | 1.7 [-0.2–4.2] | 100 | ±3.3 | -3.3 / 4.1 / 1.3 | – |  |
| Curator (market.curator) | 4 | 3.7 [0.9–7.2] | 89 | ±4.7 | -5.2 / -1.2 / -4.0 | – |  |
| Green Helper (green.helper) | 2 | 1.6 [0.1–3.3] | 146 | ±2.4 | -0.9 / 4.1 / -1.8 | – |  |
| Minimalist (market.minimalist) | 2 | 1.6 [-1.0–4.8] | 80 | ±4.4 | 7.5 / -4.4 / 2.4 | – |  |
| Benefactor (silver.benefactor) | 6 | 5.6 [3.6–7.6] | 150 | ±3.1 | 6.9 / -1.2 / 0.4 | – |  |
| Translator (echo.translator) | 6 | 5.6 [3.2–8.1] | 85 | ±3.7 | -1.8 / -10.3 / -2.6 | – |  |
| Light Fingers (thieves.lightfingers) | 8 | 7.5 [5.3–9.4] | 91 | ±3.0 | 1.6 / 2.2 / 4.3 | – |  |
| Sower (yellow.sower) | 4 | 3.4 [1.2–6.0] | 85 | ±3.6 | 7.3 / 6.2 / -3.0 | – |  |
| Shareholder (trading.shareholder) | 3 | 2.4 [-0.0–4.5] | 88 | ±3.4 | -11.6 / -1.5 / 5.7 | – |  |
| Admirer (yellow.admirer) | 6 | 5.3 [2.6–8.8] | 62 | ±4.7 | -0.3 / -0.8 / -2.1 | – |  |
| Explorer (yellow.explorer) | 8 | 7.2 [4.1–10.7] | 56 | ±4.9 | -1.3 / 1.5 / -9.1 | – |  |
| Blue Patron (blue.patron) | 6 | 5.2 [3.3–6.9] | 106 | ±2.7 | -2.6 / 1.0 / 1.7 | – |  |
| Dowager (silver.dowager) | 4 | 3.1 [0.8–5.1] | 140 | ±3.3 | 1.2 / -2.6 / 3.0 | – |  |
| Big Family (red.bigfamily) | 4 | 2.9 [1.4–4.4] | 391 | ±2.3 | -3.3 / -4.5 / -2.7 | 5.0 [2.3–8.2] | 72 |
| Onlooker (market.onlooker) | 10 | 8.8 [4.9–11.6] | 48 | ±5.0 | 0.8 / -4.4 / -2.1 | – |  |
| Guest (silver.guest) | 8 | 6.8 [4.9–8.7] | 147 | ±2.8 | -0.8 / 6.6 / -5.3 | – |  |
| Sommelier (market.sommelier) | 4 | 2.8 [0.4–5.2] | 82 | ±3.6 | -8.6 / -1.8 / -2.0 | – |  |
| Blue Hand (blue.hand) | 2 | 0.8 [-1.4–3.1] | 130 | ±3.3 | 1.9 / 4.8 / -2.4 | – |  |
| Front-runner (benders.frontrunner) | 2 | 0.7 [-1.0–2.2] | 311 | ±2.4 | 5.5 / -0.3 / -1.2 | – |  |
| Middleman (gold.coinpurse) | 4 | 2.7 [0.3–5.3] | 146 | ±3.8 | 3.8 / -2.8 / 3.8 | – |  |
| Silversmith (silver.silversmith) | 6 | 4.7 [2.7–6.9] | 140 | ±3.2 | 5.7 / -3.2 / -3.0 | – |  |
| Host (red.host) | 6 | 4.7 [2.0–7.0] | 99 | ±3.8 | 1.9 / 0.7 / 0.1 | – |  |
| Impressionist (echo.tuningfork) | 4 | 2.6 [0.1–5.4] | 87 | ±4.0 | -1.3 / -4.4 / -2.1 | – |  |
| Steward (silver.steward) | 4 | 2.6 [-0.2–6.3] | 150 | ±4.9 | -4.9 / -5.3 / 6.1 | – |  |
| Auctioneer (market.auctioneer) | 6 | 4.5 [1.5–7.8] | 65 | ±4.7 | -0.2 / -2.7 / -3.4 | – |  |
| Night Owl (purple.nightowl) | 10 | 8.4 [5.4–11.1] | 82 | ±4.3 | -11.9 / -1.7 / -3.4 | – |  |
| Green Hand (green.hand) | 2 | 0.1 [-1.6–2.0] | 157 | ±2.8 | -5.0 / -2.1 / 0.5 | – |  |
| Patriarch (red.patriarch) | 10 | 8.1 [5.1–10.5] | 86 | ±4.1 | -1.6 / -8.1 / 1.4 | – |  |
| Sponsor (red.sponsor) | 10 | 8.0 [6.2–9.7] | 237 | ±2.6 | 1.8 / -2.6 / -1.2 | 10.8 [7.3–14.7] | 48 |
| Taskmaster (purple.taskmaster) | 6 | 4.0 [1.6–6.4] | 97 | ±3.6 | -2.2 / -1.6 / -5.9 | – |  |
| Doppelganger (red.doppel) | 6 | 4.0 [1.4–6.2] | 104 | ±3.6 | -7.1 / -1.9 / -0.7 | – |  |
| Straggler (benders.straggler) | 8 | 5.9 [4.4–7.4] | 286 | ±2.3 | 0.5 / -3.6 / -3.8 | – |  |
| Extra Hand (benders.extrahand) | 10 | 7.9 [6.5–9.2] | 309 | ±2.0 | -0.7 / -3.3 / -7.2 | – |  |
| Grand Host (silver.grandhost) | 12 | 9.8 [7.3–12.7] | 119 | ±4.1 | -3.9 / 1.5 / -1.7 | – |  |
| Merchant (gold.merchant) | 6 | 3.7 [1.5–6.0] | 128 | ±3.4 | 4.3 / -4.2 / -0.1 | – |  |
| Revelers (silver.revelers) | 6 | 3.7 [1.5–5.8] | 139 | ±3.3 | 3.0 / 1.2 / -3.3 | – |  |
| Patroness (market.patroness) | 8 | 5.6 [3.1–8.8] | 64 | ±4.3 | -5.6 / 0.4 / 0.5 | – |  |
| Green Patron (green.patron) | 6 | 3.6 [1.5–5.6] | 146 | ±3.1 | -4.3 / -8.6 / -1.2 | – |  |
| Gleaner (yellow.gleaner) | 10 | 7.6 [5.0–10.7] | 43 | ±4.3 | 2.0 / 4.4 / -1.1 | – |  |
| Talent Scout (market.blackmarket) | 4 | 1.6 [-1.1–4.0] | 84 | ±3.8 | -11.9 / -7.7 / 1.7 | – |  |
| Reseller (market.reseller) | 12 | 9.5 [5.4–13.6] | 42 | ±6.2 | 0.5 / -5.8 / 5.8 | – |  |
| Blue Devotee (blue.devotee) | 4 | 1.5 [-0.6–3.6] | 123 | ±3.2 | -0.7 / -3.4 / 0.1 | – |  |
| Insider (benders.insider) | 6 | 3.5 [1.9–5.4] | 272 | ±2.7 | -4.7 / -2.0 / -2.2 | – |  |
| Squatter (benders.squatter) | 8 | 5.4 [3.7–6.9] | 254 | ±2.4 | -0.3 / -4.1 / -5.3 | – |  |
| Farmer (yellow.farmer) | 6 | 3.2 [0.5–5.5] | 58 | ±3.8 | -1.5 / -2.6 / -2.8 | – |  |
| Reinvestor (trading.reinvestor) | 4 | 1.2 [-1.4–3.7] | 87 | ±3.8 | -4.2 / -0.8 / -3.3 | – |  |
| Green Devotee (green.devotee) | 4 | 1.0 [-0.8–2.7] | 151 | ±2.6 | -6.8 / -4.4 / -0.7 | 2.8 [0.6–4.4] | 58 |
| Mentor & Protégé (red.mentor) | 10 | 7.0 [4.8–9.8] | 78 | ±3.8 | 8.9 / -2.7 / 1.5 | – |  |
| Toastmaster (silver.toastmaster) | 8 | 4.9 [2.6–7.2] | 128 | ±3.5 | -0.8 / -8.1 / -4.8 | – |  |
| Dyer (yellow.dyer) | 6 | 2.9 [0.0–5.4] | 59 | ±4.1 | 4.6 / -1.8 / -1.4 | – |  |
| Double Agent (thieves.doubleagent) | 6 | 2.8 [0.1–4.9] | 88 | ±3.6 | -10.4 / -7.8 / 0.5 | – |  |
| Snob (market.snob) | 10 | 6.7 [3.0–11.0] | 48 | ±6.0 | -18.9 / -8.7 / 7.2 | – |  |
| Timekeeper (purple.patience) | 8 | 4.6 [2.5–6.9] | 86 | ±3.4 | 1.3 / 5.0 / -3.5 | – |  |
| Blue Pillar (blue.pillar) | 6 | 2.6 [0.4–4.7] | 123 | ±3.2 | -4.7 / -2.2 / -1.7 | – |  |
| Rainmaker (yellow.rainmaker) | 6 | 2.5 [-0.2–5.2] | 67 | ±4.0 | 5.7 / -10.7 / -0.5 | – |  |
| Liquidator (trading.liquidator) | 6 | 2.5 [-0.0–4.3] | 85 | ±3.3 | -0.6 / 5.3 / 0.4 | – |  |
| Apprentice (purple.apprentice) | 4 | 0.4 [-1.9–3.1] | 108 | ±3.8 | -9.6 / 3.5 / 0.8 | – |  |
| Retinue (silver.retinue) | 4 | 0.4 [-2.0–2.4] | 144 | ±3.3 | -1.3 / -12.3 / -6.2 | – |  |
| Green Elder (green.elder) | 4 | 0.4 [-1.8–2.1] | 141 | ±2.9 | -8.3 / 0.3 / -3.5 | 2.3 [-0.8–5.0] | 54 |
| Groupie (echo.groupie) | 8 | 4.4 [1.2–7.5] | 75 | ±4.8 | -17.2 / -14.1 / -12.3 | – |  |
| Late Riser (purple.lateriser) | 6 | 2.4 [-0.0–4.7] | 105 | ±3.5 | -3.0 / -6.0 / -6.0 | – |  |
| Investor (gold.investor) | 6 | 2.4 [0.3–4.7] | 132 | ±3.3 | -9.7 / -0.8 / -0.3 | 3.1 [-0.5–5.8] | 67 |
| Corner-Cutter (purple.doubletime) | 6 | 2.2 [0.2–4.6] | 102 | ±3.3 | -8.5 / 1.5 / 0.9 | 3.4 [-0.4–6.1] | 73 |
| Heiress (trading.heiress) | 10 | 6.0 [3.6–8.5] | 89 | ±3.7 | -1.7 / 1.6 / -2.8 | – |  |
| Tycoon (gold.tycoon) | 12 | 7.6 [6.1–9.0] | 307 | ±2.1 | -1.7 / -6.3 / -3.3 | 8.5 [4.2–13.2] | 56 |
| Green Pillar (green.pillar) | 6 | 1.6 [-0.5–3.4] | 140 | ±3.0 | -1.1 / -4.0 / 1.9 | 3.2 [0.0–5.8] | 53 |
| Exporter (trading.exporter) | 8 | 3.4 [0.7–5.8] | 73 | ±3.9 | 2.0 / -8.7 / -4.4 | 4.9 [2.3–7.3] | 83 |
| Chronicler (echo.chronicler) | 8 | 3.4 [-0.0–6.6] | 84 | ±5.0 | -6.8 / -4.3 / -4.3 | – |  |
| Harmonist (yellow.harmonist) | 8 | 3.3 [0.7–6.3] | 46 | ±4.2 | -3.0 / -8.1 / – | -0.9 [-4.1–2.1] | 29 |
| Midas (gold.midas) | 8 | 3.0 [0.6–5.0] | 143 | ±3.3 | -4.2 / -3.4 / -1.2 | 6.3 [2.3–9.4] | 71 |
| Magnate (trading.magnate) | 8 | 2.8 [0.7–5.1] | 90 | ±3.3 | -21.2 / -10.6 / -1.9 | 5.0 [1.2–7.2] | 75 |
| Proselytizer (red.proselytizer) | 12 | 6.4 [3.9–8.8] | 88 | ±3.7 | 2.3 / -6.8 / -0.5 | 4.7 [-1.0–8.7] | 39 |
| Choir (echo.choir) | 6 | -0.0 [-2.9–3.3] | 91 | ±4.7 | -4.3 / -11.4 / -4.7 | 3.2 [-1.0–7.0] | 56 |
| Go-Between (yellow.gobetween) | 8 | 1.9 [-1.1–4.9] | 67 | ±4.6 | -6.4 / -8.6 / -1.4 | 2.6 [-1.1–5.4] | 40 |
| Ensemble (echo.ensemble) | 6 | -0.4 [-3.2–2.6] | 78 | ±4.4 | 4.2 / -11.0 / -3.8 | 3.5 [-0.2–7.3] | 62 |
| Patron Saint (silver.saint) | 12 | 4.9 [2.3–7.4] | 124 | ±3.8 | -9.7 / -11.2 / -4.0 | 8.9 [4.0–12.0] | 33 |

</details>

Power: for the 92 cards Normal reads in band, the smallest gap this run could have caught (80% power, 90% interval) is 3.7 cost points at the median card, 4.7 at the 90th percentile (column "detectable" in the full table). More seeds narrow it as 1/√n.

## 2b. Card × sphere and space × sphere outliers
Normal's residuals on the tables where the seat held the item, grouped by each other sphere at the table: a card fine overall but off beside one sphere. Listed at |deviation| ≥ 3 cost points (spaces: 3 scaled u) and |z| ≥ 3.5 among 1365 card × sphere and 1349 space × sphere pairs with n ≥ 15 (about one false alarm expected). Hard-20 beside it where its targets covered the pair.

| card | beside | deviation [90%] | n | Hard-20 |
|---|---|---|---|---|
| Go-Between | Blue (market) | +10.0 ±4.0 pts | 15 | – |
| Blue Pillar | White (trading) | +5.7 ±2.3 pts | 22 | – |
| Late Riser | Magenta (thieves) | +5.8 ±2.7 pts | 28 | – |

| space | beside | deviation [90%] | n | Hard-20 |
|---|---|---|---|---|
| Hum r3 | Yellow (yellow) | +8.8 ±4.1 u | 30 | – |

## 3. Spaces
Paired forced placement: from the start of round r, the seat's first minion must take the space (base: the bot's own choice). A "null" minion (bot's own choice, action does nothing) in every game gives the zero, so worth = followers of margin over a minion that does nothing; u = worth ÷ that round's price slope (Normal 0.78 / 0.88 / 0.62, Hard-20 0.82 / 1.16 / 0.58 followers per resource, rounds I / II / III). Raw u also counts the buy a placement enables and early compounding, so it runs high; scaled u sets each round's median space to the middle of its band (×0.77 / 1.24 / 1.54 for rounds I / II / III) and says where a space sits among its round's field on the value model's ruler (round I 2–3u, II 3–5u, III 5–9u). Flag, on scaled u: above the band in any round, below it in the space's own ring's round, or worth below 0. "vs choice" = against the bot's own pick (≤ 0 means the bot was right to skip it). Blocked = a rival took it first.
Normal's own pick is worth 2.6 followers in round 1, 4.8 followers in round 2, 6.6 followers in round 3 over a null minion (3.3u / 5.4u / 10.6u).

### Both instruments agree (10)
| space | ring | round | Normal scaled u [90%] n | Hard-20 scaled u [90%] n | band | reads |
|---|---|---|---|---|---|---|
| Clock In (purple) | 1 | 3 | 13.5 [9.5–17.1] 92 | 19.1 [13.1–25.7] 53 | 5–9 | strong |
| Your Call (trading) | 1 | 3 | 13.4 [9.9–17.3] 85 | 16.1 [12.9–20.2] 80 | 5–9 | strong |
| Crunch Time (purple) | 3 | 3 | 17.1 [12.5–22.4] 89 | 19.3 [12.3–26.4] 55 | 5–9 | strong |
| Toast (silver) | 1 | 3 | 19.9 [16.6–23.1] 100 | 16.8 [10.1–25.0] 25 | 5–9 | strong |
| Dividend (trading) | 2 | 3 | 16.6 [11.5–20.9] 56 | 20.5 [16.4–25.2] 54 | 5–9 | strong |
| Bloom (green) | 3 | 3 | 15.7 [12.7–18.3] 94 | 17.2 [11.3–23.1] 32 | 5–9 | strong |
| Branch Out (yellow) | 2 | 2 | -0.6 [-3.1–2.1] 102 | -0.7 [-3.9–2.4] 42 | 3–5 | weak |
| Plan Ahead (purple) | 2 | 3 | 17.9 [13.5–22.9] 59 | 22.6 [14.7–30.7] 39 | 5–9 | strong |
| Open House (red) | 2 | 3 | 13.2 [10.2–16.2] 98 | 16.8 [10.2–23.8] 49 | 5–9 | strong |
| Greatest Hits (echo) | 3 | 3 | 0.2 [-2.9–3.5] 81 | -5.8 [-10.9–0.1] 45 | 5–9 | weak |

### Normal flags, Hard-20 confidently doesn't (likely a Normal-bot artifact) (7)
Rising Tide r3 (Normal 16.5 [13.2–20.8], Hard-20 7.5 [-1.4–15.2] scaled u); Plan Ahead r2 (Normal 10.5 [7.0–14.3], Hard-20 5.8 [3.2–9.6] scaled u); All In r3 (Normal 16.2 [10.8–21.3], Hard-20 7.2 [3.1–12.9] scaled u); Bandwagon r1 (Normal -0.7 [-2.9–1.2], Hard-20 5.2 [1.0–9.1] scaled u); Help Yourself r2 (Normal 7.7 [5.3–10.0], Hard-20 3.9 [2.4–5.7] scaled u); Crime Wave r2 (Normal 7.6 [5.1–10.2], Hard-20 3.4 [2.0–5.0] scaled u); Lie Low r2 (Normal 7.9 [5.6–10.4], Hard-20 3.3 [1.0–5.9] scaled u).

Normal flags, Hard-20 too thin or unsure to say: Crescendo r3 strong (15.4u; Hard-20 10.1u, n 35); Golden Years r3 strong (13.4u; Hard-20 13.3u, n 59); Catch Up r1 weak (-0.2u; Hard-20 1.6u, n 29); Cheap Seats r1 weak (-2.0u; Hard-20 2.2u, n 41); Flood r3 strong (13.7u; Hard-20 10.7u, n 6); Hand-pick r3 strong (13.9u; Hard-20 12.4u, n 50); Open House r2 strong (9.1u; Hard-20 6.8u, n 38).

Power: for the 130 space-rounds Normal reads in band, the smallest miss this run could have caught is 4.0 scaled u at the median, 5.6 at the 90th percentile (column "detectable").

<details><summary>Every space and round (Normal; Hard-20 where measured)</summary>

| space | sphere | ring | round | worth (followers) [90%] | raw u | scaled u [90%] | detectable | vs choice | blocked | n | Hard-20 scaled u [90%] |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Kickback | gold | 1 | 1 | 4.5 [2.4–6.9] | 5.8 | 4.5 [2.4–6.8] | ±3.3 | 2.0 | 8.7% | 147 | 4.7 [-3.7–13.8] |
| Tide | blue | 1 | 1 | 4.4 [2.7–6.2] | 5.7 | 4.4 [2.7–6.2] | ±2.6 | 1.9 | 3.2% | 121 | 1.5 [-1.5–4.8] |
| Help Yourself | thieves | 1 | 1 | 4.3 [2.4–6.5] | 5.5 | 4.3 [2.3–6.4] | ±3.1 | 1.7 | 1.0% | 103 | 3.4 [-3.7–11.3] |
| Intro Offer | gold | 1 | 1 | 4.2 [2.0–6.2] | 5.4 | 4.2 [2.0–6.1] | ±3.1 | 1.6 | 0.0% | 130 | -8.0 [-18.3–2.5] |
| Good Deed | silver | 1 | 1 | 3.6 [1.7–6.2] | 4.6 | 3.6 [1.6–6.1] | ±3.4 | 1.0 | 4.0% | 120 | 0.7 [-4.0–5.2] |
| New Faces | market | 1 | 1 | 3.6 [1.1–6.1] | 4.6 | 3.6 [1.1–6.1] | ±3.7 | 1.0 | 0.0% | 97 | – |
| Root | green | 1 | 1 | 3.5 [1.6–5.4] | 4.5 | 3.5 [1.6–5.3] | ±2.8 | 1.0 | 9.1% | 100 | -3.1 [-9.2–4.0] |
| Sob Story | trading | 1 | 1 | 3.3 [0.5–5.8] | 4.2 | 3.3 [0.4–5.7] | ±4.0 | 0.7 | 5.9% | 80 | 2.3 [-3.7–8.1] |
| Shoal | blue | 1 | 1 | 3.3 [1.5–5.4] | 4.2 | 3.2 [1.5–5.4] | ±2.9 | 0.7 | 14.4% | 77 | – |
| Crescendo | echo | 1 | 1 | 3.2 [0.8–5.7] | 4.1 | 3.2 [0.8–5.6] | ±3.6 | 0.6 | 0.0% | 96 | 3.4 [-1.6–7.7] |
| Graft | green | 1 | 1 | 3.2 [1.3–5.1] | 4.1 | 3.2 [1.2–5.1] | ±2.9 | 0.6 | 4.2% | 114 | -2.4 [-13.2–7.4] |
| Roll Call | purple | 1 | 1 | 3.0 [0.5–5.7] | 3.9 | 3.0 [0.5–5.7] | ±3.9 | 0.5 | 0.0% | 96 | -9.0 [-13.1–1.4] |
| Name Drop | market | 1 | 1 | 3.0 [0.6–5.4] | 3.8 | 3.0 [0.6–5.3] | ±3.6 | 0.4 | 1.1% | 87 | – |
| Goody Bags | silver | 1 | 1 | 3.0 [0.7–5.4] | 3.8 | 3.0 [0.7–5.3] | ±3.5 | 0.4 | 28.6% | 90 | 1.5 [-14.2–13.9] |
| Your Call | trading | 1 | 1 | 2.7 [-1.1–6.1] | 3.4 | 2.7 [-1.1–6.1] | ±5.4 | 0.1 | 0.0% | 77 | 4.9 [-6.2–10.4] |
| Clock In | purple | 1 | 1 | 2.6 [0.4–4.7] | 3.4 | 2.6 [0.4–4.6] | ±3.2 | 0.1 | 10.5% | 102 | 14.0 [3.7–18.1] |
| Toast | silver | 1 | 1 | 2.5 [0.5–4.6] | 3.2 | 2.5 [0.5–4.6] | ±3.1 | -0.1 | 0.0% | 139 | -4.0 [-9.2–2.5] |
| Sprout | green | 1 | 1 | 2.1 [0.7–4.0] | 2.7 | 2.1 [0.7–3.9] | ±2.5 | -0.5 | 2.3% | 127 | -4.9 [-8.5–0.8] |
| Echo | echo | 1 | 1 | 2.1 [-0.9–5.0] | 2.7 | 2.1 [-0.9–4.9] | ±4.4 | -0.5 | 1.1% | 89 | – |
| Open Door | red | 1 | 1 | 2.0 [-0.3–4.0] | 2.5 | 2.0 [-0.3–3.9] | ±3.2 | -0.6 | 8.0% | 104 | -8.6 [-12.6–2.8] |
| Golden Years | gold | 1 | 1 | 1.9 [-0.4–4.4] | 2.4 | 1.8 [-0.4–4.4] | ±3.6 | -0.7 | 0.0% | 120 | -6.1 [-22.1–6.4] |
| Snap Up | market | 1 | 1 | 1.7 [-0.7–3.8] | 2.2 | 1.7 [-0.7–3.7] | ±3.4 | -0.9 | 4.5% | 105 | 1.3 [-1.4–4.5] |
| Redistribute | thieves | 1 | 1 | 1.7 [-0.0–3.7] | 2.1 | 1.7 [-0.0–3.7] | ±2.8 | -0.9 | 0.0% | 103 | -8.1 [-11.3–1.2] |
| Even Swap | red | 1 | 1 | 1.6 [-0.2–3.2] | 2.0 | 1.6 [-0.2–3.2] | ±2.6 | -1.0 | 0.0% | 140 | 7.7 [-3.9–18.6] |
| Lie Low | thieves | 1 | 1 | 1.4 [-0.7–3.4] | 1.8 | 1.4 [-0.6–3.3] | ±3.0 | -1.2 | 0.0% | 87 | 5.1 [0.6–10.2] |
| Current | blue | 1 | 1 | 1.3 [-0.4–3.1] | 1.6 | 1.3 [-0.4–3.1] | ±2.6 | -1.3 | 1.0% | 97 | – |
| Harvest | yellow | 1 | 1 | 1.0 [-1.1–3.0] | 1.3 | 1.0 [-1.1–3.0] | ±3.1 | -1.6 | 0.0% | 103 | 11.6 [-0.6–15.3] |
| Top Up | yellow | 1 | 1 | 0.9 [-1.8–4.0] | 1.1 | 0.9 [-1.8–4.0] | ±4.3 | -1.7 | 32.9% | 51 | 2.6 [-5.1–10.6] |
| Hum | echo | 1 | 1 | -0.1 [-2.7–2.5] | -0.1 | -0.1 [-2.7–2.4] | ±3.9 | -2.7 | 12.1% | 94 | 2.6 [-7.1–14.4] |
| Trade Seeds | yellow | 1 | 1 | -0.1 [-1.9–2.1] | -0.2 | -0.1 [-1.9–2.0] | ±3.0 | -2.7 | 0.0% | 83 | 0.0 [-8.3–12.7] |
| Catch Up | purple | 1 | 1 | -0.2 [-1.8–1.3] | -0.2 | -0.2 [-1.8–1.3] | ±2.3 | -2.8 | 0.0% | 91 | 1.6 [-3.5–8.5] |
| Bandwagon | red | 1 | 1 | -0.7 [-2.9–1.2] | -0.9 | -0.7 [-2.9–1.2] | ±3.1 | -3.3 | 0.0% | 119 | 5.2 [1.0–9.1] |
| Cheap Seats | trading | 1 | 1 | -2.0 [-4.7–0.6] | -2.6 | -2.0 [-4.7–0.6] | ±4.0 | -4.6 | 0.0% | 85 | 2.2 [-2.0–5.9] |
| Plan Ahead | purple | 2 | 2 | 7.5 [5.0–10.2] | 8.5 | 10.5 [7.0–14.3] | ±5.6 | 2.7 | 19.5% | 66 | 5.8 [3.2–9.6] |
| Open House | red | 2 | 2 | 6.5 [4.9–8.6] | 7.3 | 9.1 [6.9–12.1] | ±3.9 | 1.7 | 2.9% | 100 | 6.8 [1.8–11.6] |
| Lie Low | thieves | 1 | 2 | 5.6 [4.0–7.4] | 6.4 | 7.9 [5.6–10.4] | ±3.6 | 0.8 | 0.0% | 88 | 3.3 [1.0–5.9] |
| Help Yourself | thieves | 1 | 2 | 5.5 [3.8–7.1] | 6.2 | 7.7 [5.3–10.0] | ±3.6 | 0.7 | 1.8% | 111 | 3.9 [2.4–5.7] |
| Crime Wave | thieves | 2 | 2 | 5.4 [3.6–7.3] | 6.1 | 7.6 [5.1–10.2] | ±3.9 | 0.6 | 0.0% | 113 | 3.4 [2.0–5.0] |
| Good Deed | silver | 1 | 2 | 4.8 [3.3–6.5] | 5.4 | 6.7 [4.7–9.1] | ±3.3 | -0.0 | 0.8% | 117 | – |
| Crescendo | echo | 1 | 2 | 4.7 [2.4–7.7] | 5.4 | 6.6 [3.4–10.8] | ±5.6 | -0.1 | 7.0% | 66 | 8.4 [-3.2–18.3] |
| Harbor | blue | 2 | 2 | 4.5 [2.4–6.8] | 5.1 | 6.3 [3.4–9.5] | ±4.6 | -0.3 | 21.1% | 60 | – |
| Open Door | red | 1 | 2 | 4.4 [2.7–6.1] | 5.0 | 6.2 [3.8–8.5] | ±3.5 | -0.4 | 0.0% | 141 | 1.7 [-2.7–4.1] |
| Clock In | purple | 1 | 2 | 4.3 [2.2–6.3] | 4.9 | 6.0 [3.1–8.8] | ±4.3 | -0.5 | 0.0% | 87 | -1.7 [-6.3–3.4] |
| Redistribute | thieves | 1 | 2 | 4.0 [2.4–5.6] | 4.5 | 5.6 [3.3–7.9] | ±3.4 | -0.8 | 0.0% | 89 | – |
| Sell High | trading | 2 | 2 | 3.9 [1.9–6.6] | 4.4 | 5.4 [2.6–9.3] | ±5.0 | -0.9 | 4.9% | 78 | -0.8 [-16.3–16.4] |
| Shake Down | thieves | 2 | 2 | 3.8 [2.5–5.3] | 4.3 | 5.4 [3.5–7.4] | ±3.0 | -1.0 | 9.1% | 90 | – |
| Golden Years | gold | 1 | 2 | 3.8 [2.0–5.7] | 4.3 | 5.3 [2.7–8.0] | ±4.0 | -1.0 | 6.4% | 131 | – |
| Orchard | green | 2 | 2 | 3.7 [1.8–5.3] | 4.2 | 5.2 [2.5–7.5] | ±3.7 | -1.1 | 8.7% | 94 | – |
| Goody Bags | silver | 1 | 2 | 3.6 [1.8–5.3] | 4.1 | 5.0 [2.5–7.4] | ±3.7 | -1.2 | 0.0% | 100 | -2.7 [-8.4–3.1] |
| Grove | green | 2 | 2 | 3.6 [2.0–5.3] | 4.1 | 5.0 [2.8–7.5] | ±3.5 | -1.2 | 12.4% | 99 | – |
| Hum | echo | 1 | 2 | 3.5 [2.1–5.1] | 4.0 | 4.9 [2.9–7.2] | ±3.2 | -1.3 | 0.0% | 123 | -5.7 [-13.3–1.0] |
| Swell | blue | 2 | 2 | 3.5 [1.8–5.3] | 3.9 | 4.9 [2.5–7.5] | ±3.8 | -1.3 | 9.2% | 89 | – |
| Toast | silver | 1 | 2 | 3.4 [1.7–5.4] | 3.9 | 4.8 [2.3–7.6] | ±4.0 | -1.4 | 19.7% | 118 | – |
| Intro Offer | gold | 1 | 2 | 3.4 [1.6–5.2] | 3.8 | 4.7 [2.2–7.2] | ±3.8 | -1.4 | 0.0% | 124 | 9.5 [-1.8–14.5] |
| Encore | echo | 2 | 2 | 3.2 [1.6–5.5] | 3.6 | 4.5 [2.2–7.7] | ±4.2 | -1.6 | 2.0% | 98 | 1.3 [-3.6–6.2] |
| Catch Up | purple | 1 | 2 | 3.2 [1.4–4.8] | 3.6 | 4.4 [2.0–6.7] | ±3.5 | -1.6 | 0.0% | 88 | 7.9 [-3.2–13.3] |
| Your Call | trading | 1 | 2 | 3.1 [1.0–5.7] | 3.5 | 4.3 [1.4–7.9] | ±4.9 | -1.7 | 2.8% | 69 | 3.9 [-7.1–8.8] |
| Kickback | gold | 1 | 2 | 3.0 [1.1–4.5] | 3.3 | 4.1 [1.6–6.3] | ±3.6 | -1.8 | 0.0% | 185 | -9.8 [-19.6–-0.2] |
| Collect Debts | gold | 2 | 2 | 2.9 [0.9–5.0] | 3.3 | 4.1 [1.3–6.9] | ±4.2 | -1.9 | 3.1% | 123 | – |
| Sweet Talk | silver | 2 | 2 | 2.9 [1.3–4.6] | 3.3 | 4.1 [1.8–6.5] | ±3.5 | -1.9 | 0.8% | 126 | – |
| Rising Tide | silver | 2 | 2 | 2.9 [1.1–4.5] | 3.2 | 4.0 [1.6–6.3] | ±3.6 | -1.9 | 0.0% | 117 | – |
| Root | green | 1 | 2 | 2.7 [1.2–4.2] | 3.0 | 3.8 [1.7–5.9] | ±3.2 | -2.1 | 0.8% | 127 | – |
| Sprout | green | 1 | 2 | 2.7 [1.3–4.1] | 3.0 | 3.7 [1.9–5.7] | ±2.9 | -2.1 | 0.0% | 151 | – |
| Tide | blue | 1 | 2 | 2.5 [1.4–3.7] | 2.8 | 3.5 [2.0–5.1] | ±2.4 | -2.3 | 0.0% | 135 | – |
| Top Up | yellow | 1 | 2 | 2.4 [0.7–4.2] | 2.7 | 3.4 [1.0–5.9] | ±3.7 | -2.4 | 3.4% | 86 | -9.3 [-13.2–2.3] |
| Dividend | trading | 2 | 2 | 2.3 [0.5–4.4] | 2.6 | 3.2 [0.7–6.2] | ±4.2 | -2.5 | 0.0% | 96 | 16.0 [-2.1–22.1] |
| Reprise | echo | 2 | 2 | 1.9 [-0.7–4.4] | 2.2 | 2.7 [-1.0–6.2] | ±5.5 | -2.9 | 0.0% | 76 | -5.3 [-6.9–1.4] |
| Potluck | yellow | 2 | 2 | 1.9 [-0.6–4.0] | 2.2 | 2.7 [-0.9–5.6] | ±4.9 | -2.9 | 0.0% | 71 | 1.8 [-2.2–6.4] |
| Snap Up | market | 1 | 2 | 1.8 [-0.2–3.9] | 2.0 | 2.5 [-0.3–5.5] | ±4.4 | -3.0 | 1.7% | 118 | – |
| Current | blue | 1 | 2 | 1.8 [-0.1–3.4] | 2.0 | 2.5 [-0.1–4.8] | ±3.7 | -3.0 | 0.0% | 83 | – |
| Sob Story | trading | 1 | 2 | 1.6 [-0.4–3.9] | 1.8 | 2.3 [-0.5–5.4] | ±4.5 | -3.2 | 7.3% | 89 | 5.2 [-3.0–7.2] |
| Shoal | blue | 1 | 2 | 1.5 [0.3–3.0] | 1.7 | 2.1 [0.5–4.3] | ±2.9 | -3.3 | 1.9% | 105 | – |
| Echo | echo | 1 | 2 | 1.3 [-0.8–3.4] | 1.5 | 1.8 [-1.1–4.7] | ±4.4 | -3.5 | 0.0% | 72 | – |
| Name Drop | market | 1 | 2 | 1.3 [-0.4–3.3] | 1.5 | 1.8 [-0.6–4.6] | ±4.0 | -3.5 | 0.0% | 106 | – |
| New Faces | market | 1 | 2 | 1.2 [-1.3–3.7] | 1.4 | 1.7 [-1.9–5.1] | ±5.3 | -3.6 | 0.0% | 84 | – |
| Swap Sides | red | 2 | 2 | 1.2 [-0.6–2.9] | 1.3 | 1.6 [-0.8–4.1] | ±3.7 | -3.6 | 1.1% | 94 | 4.8 [-2.3–7.2] |
| Half Price | market | 2 | 2 | 1.1 [-0.5–3.1] | 1.3 | 1.6 [-0.7–4.4] | ±3.8 | -3.7 | 3.9% | 99 | – |
| Graft | green | 1 | 2 | 1.1 [-0.5–2.6] | 1.2 | 1.5 [-0.7–3.7] | ±3.3 | -3.7 | 0.0% | 123 | – |
| Tithe | gold | 2 | 2 | 1.1 [-0.5–3.0] | 1.2 | 1.5 [-0.7–4.1] | ±3.7 | -3.7 | 0.0% | 121 | -5.2 [-13.0–3.7] |
| Trade Seeds | yellow | 1 | 2 | 1.1 [-0.5–2.9] | 1.2 | 1.5 [-0.7–4.1] | ±3.6 | -3.7 | 0.0% | 81 | – |
| Harvest | yellow | 1 | 2 | 1.0 [-0.5–2.8] | 1.1 | 1.4 [-0.7–3.9] | ±3.4 | -3.8 | 4.5% | 106 | 5.4 [-7.8–15.4] |
| Bandwagon | red | 1 | 2 | 1.0 [-0.6–2.5] | 1.1 | 1.3 [-0.9–3.5] | ±3.3 | -3.8 | 0.0% | 115 | – |
| Roll Call | purple | 1 | 2 | 0.9 [-0.8–2.8] | 1.0 | 1.2 [-1.1–3.9] | ±3.8 | -3.9 | 0.0% | 88 | -10.9 [-20.5–-2.7] |
| Show Off | market | 2 | 2 | 0.8 [-1.6–3.8] | 1.0 | 1.2 [-2.2–5.4] | ±5.7 | -3.9 | 0.0% | 61 | – |
| Even Swap | red | 1 | 2 | 0.6 [-1.3–2.5] | 0.6 | 0.8 [-1.8–3.5] | ±4.0 | -4.2 | 2.4% | 123 | -8.3 [-26.4–11.0] |
| Overtime | purple | 2 | 2 | 0.5 [-1.2–2.5] | 0.6 | 0.7 [-1.7–3.4] | ±3.8 | -4.3 | 0.0% | 95 | 7.1 [0.6–10.5] |
| Branch Out | yellow | 2 | 2 | -0.4 [-2.2–1.5] | -0.5 | -0.6 [-3.1–2.1] | ±3.9 | -5.2 | 0.0% | 102 | -0.7 [-3.9–2.4] |
| Cheap Seats | trading | 1 | 2 | -0.9 [-3.0–1.2] | -1.0 | -1.3 [-4.2–1.7] | ±4.5 | -5.7 | 0.0% | 76 | -7.7 [-13.5–3.6] |
| Toast | silver | 1 | 3 | 8.1 [6.7–9.4] | 12.9 | 19.9 [16.6–23.1] | ±4.9 | 1.4 | 16.7% | 100 | 16.8 [10.1–25.0] |
| Plan Ahead | purple | 2 | 3 | 7.2 [5.5–9.3] | 11.6 | 17.9 [13.5–22.9] | ±7.1 | 0.6 | 30.6% | 59 | 22.6 [14.7–30.7] |
| Crunch Time | purple | 3 | 3 | 6.9 [5.1–9.1] | 11.1 | 17.1 [12.5–22.4] | ±7.5 | 0.3 | 0.0% | 89 | 19.3 [12.3–26.4] |
| Dividend | trading | 2 | 3 | 6.7 [4.7–8.5] | 10.8 | 16.6 [11.5–20.9] | ±7.1 | 0.1 | 18.8% | 56 | 20.5 [16.4–25.2] |
| Rising Tide | silver | 2 | 3 | 6.7 [5.3–8.4] | 10.7 | 16.5 [13.2–20.8] | ±5.7 | 0.0 | 6.1% | 107 | 7.5 [-1.4–15.2] |
| All In | trading | 3 | 3 | 6.6 [4.4–8.6] | 10.5 | 16.2 [10.8–21.3] | ±7.9 | -0.1 | 0.0% | 74 | 7.2 [3.1–12.9] |
| Bloom | green | 3 | 3 | 6.4 [5.1–7.4] | 10.2 | 15.7 [12.7–18.3] | ±4.3 | -0.3 | 24.2% | 94 | 17.2 [11.3–23.1] |
| Crescendo | echo | 1 | 3 | 6.2 [4.9–7.4] | 10.0 | 15.4 [12.2–18.4] | ±4.7 | -0.4 | 4.0% | 97 | 10.1 [5.7–16.1] |
| Hand-pick | red | 3 | 3 | 5.6 [4.2–6.9] | 9.0 | 13.9 [10.3–17.2] | ±5.2 | -1.0 | 10.4% | 86 | 12.4 [6.9–19.5] |
| Flood | blue | 3 | 3 | 5.5 [4.5–6.8] | 8.8 | 13.7 [11.0–16.7] | ±4.3 | -1.1 | 33.3% | 60 | 10.7 [7.8–19.5] |
| Clock In | purple | 1 | 3 | 5.5 [3.8–6.9] | 8.8 | 13.5 [9.5–17.1] | ±5.7 | -1.2 | 5.2% | 92 | 19.1 [13.1–25.7] |
| Your Call | trading | 1 | 3 | 5.4 [4.0–7.0] | 8.7 | 13.4 [9.9–17.3] | ±5.6 | -1.2 | 4.5% | 85 | 16.1 [12.9–20.2] |
| Golden Years | gold | 1 | 3 | 5.4 [4.0–6.6] | 8.7 | 13.4 [9.8–16.4] | ±5.0 | -1.2 | 4.3% | 132 | 13.3 [6.8–20.3] |
| Open House | red | 2 | 3 | 5.3 [4.1–6.5] | 8.6 | 13.2 [10.2–16.2] | ±4.5 | -1.3 | 0.0% | 98 | 16.8 [10.2–23.8] |
| Crime Wave | thieves | 2 | 3 | 4.9 [3.5–6.2] | 7.8 | 12.0 [8.6–15.3] | ±5.0 | -1.8 | 0.0% | 97 | – |
| Help Yourself | thieves | 1 | 3 | 4.5 [3.2–6.0] | 7.2 | 11.1 [7.9–14.7] | ±5.1 | -2.1 | 1.1% | 88 | – |
| Shake Down | thieves | 2 | 3 | 4.4 [2.9–5.6] | 7.1 | 10.9 [7.2–13.8] | ±4.9 | -2.2 | 0.0% | 75 | – |
| Lie Low | thieves | 1 | 3 | 4.3 [3.0–5.6] | 7.0 | 10.7 [7.4–13.8] | ±4.9 | -2.3 | 0.0% | 79 | – |
| Orchard | green | 2 | 3 | 4.3 [3.2–5.3] | 6.8 | 10.5 [7.8–13.1] | ±4.0 | -2.4 | 0.0% | 95 | – |
| Grove | green | 2 | 3 | 3.9 [2.8–4.7] | 6.2 | 9.6 [6.8–11.7] | ±3.7 | -2.7 | 0.0% | 131 | – |
| Swell | blue | 2 | 3 | 3.8 [2.3–4.9] | 6.1 | 9.4 [5.8–12.2] | ±4.9 | -2.8 | 0.0% | 84 | – |
| Sprout | green | 1 | 3 | 3.8 [3.0–4.7] | 6.1 | 9.3 [7.3–11.7] | ±3.3 | -2.8 | 0.0% | 156 | – |
| Overtime | purple | 2 | 3 | 3.6 [1.3–6.7] | 5.8 | 8.9 [3.1–16.6] | ±10.2 | -3.0 | 0.0% | 79 | – |
| Good Deed | silver | 1 | 3 | 3.4 [2.2–4.7] | 5.5 | 8.5 [5.4–11.7] | ±4.8 | -3.2 | 0.0% | 117 | – |
| Hold Court | silver | 3 | 3 | 3.2 [2.1–4.3] | 5.1 | 7.9 [5.1–10.8] | ±4.3 | -3.4 | 0.9% | 111 | – |
| Tithe | gold | 2 | 3 | 3.2 [1.9–4.5] | 5.1 | 7.9 [4.7–11.1] | ±4.8 | -3.4 | 0.9% | 116 | – |
| Sell High | trading | 2 | 3 | 3.1 [1.6–4.6] | 4.9 | 7.6 [4.0–11.5] | ±5.6 | -3.5 | 0.0% | 93 | – |
| Goody Bags | silver | 1 | 3 | 3.1 [1.8–4.5] | 4.9 | 7.6 [4.3–11.1] | ±5.1 | -3.6 | 0.0% | 113 | – |
| Root | green | 1 | 3 | 3.0 [1.9–4.1] | 4.8 | 7.4 [4.6–10.1] | ±4.1 | -3.6 | 0.0% | 93 | – |
| Open Door | red | 1 | 3 | 2.9 [1.2–4.5] | 4.7 | 7.3 [3.1–11.0] | ±6.0 | -3.7 | 0.0% | 94 | – |
| New Faces | market | 1 | 3 | 2.9 [1.7–4.4] | 4.7 | 7.3 [4.2–10.8] | ±5.0 | -3.7 | 0.0% | 100 | – |
| Collect Debts | gold | 2 | 3 | 2.8 [1.8–3.8] | 4.6 | 7.0 [4.3–9.5] | ±3.9 | -3.8 | 0.0% | 158 | – |
| Shoal | blue | 1 | 3 | 2.8 [1.8–4.1] | 4.5 | 7.0 [4.4–10.0] | ±4.3 | -3.8 | 0.0% | 81 | – |
| Poach | thieves | 3 | 3 | 2.7 [1.5–4.2] | 4.4 | 6.7 [3.7–10.5] | ±5.1 | -3.9 | 2.4% | 80 | – |
| Double Down | gold | 3 | 3 | 2.7 [1.3–4.2] | 4.4 | 6.7 [3.2–10.3] | ±5.3 | -3.9 | 0.0% | 126 | – |
| Current | blue | 1 | 3 | 2.7 [1.6–3.8] | 4.3 | 6.7 [4.1–9.5] | ±4.1 | -3.9 | 0.0% | 98 | – |
| Kickback | gold | 1 | 3 | 2.6 [1.5–3.8] | 4.1 | 6.3 [3.7–9.3] | ±4.2 | -4.1 | 0.0% | 169 | – |
| Intro Offer | gold | 1 | 3 | 2.3 [1.3–3.6] | 3.8 | 5.8 [3.3–9.0] | ±4.3 | -4.3 | 0.0% | 122 | – |
| Redistribute | thieves | 1 | 3 | 2.2 [0.6–3.9] | 3.6 | 5.5 [1.4–9.6] | ±6.2 | -4.4 | 0.0% | 84 | – |
| Bandwagon | red | 1 | 3 | 2.2 [1.1–3.2] | 3.6 | 5.5 [2.7–8.0] | ±4.0 | -4.4 | 0.0% | 132 | – |
| Harbor | blue | 2 | 3 | 2.1 [0.9–3.3] | 3.3 | 5.2 [2.3–8.2] | ±4.4 | -4.5 | 0.0% | 82 | – |
| Show Off | market | 2 | 3 | 2.0 [0.2–3.8] | 3.2 | 5.0 [0.5–9.5] | ±6.8 | -4.6 | 0.0% | 70 | – |
| Half Price | market | 2 | 3 | 2.0 [0.6–3.3] | 3.1 | 4.9 [1.6–8.1] | ±4.9 | -4.7 | 0.0% | 118 | – |
| Potluck | yellow | 2 | 3 | 2.0 [0.7–3.4] | 3.1 | 4.9 [1.6–8.4] | ±5.1 | -4.7 | 0.0% | 68 | – |
| Cheap Seats | trading | 1 | 3 | 2.0 [0.4–3.5] | 3.1 | 4.8 [1.0–8.7] | ±5.9 | -4.7 | 0.0% | 77 | – |
| Reprise | echo | 2 | 3 | 1.9 [0.4–3.6] | 3.1 | 4.7 [0.9–8.8] | ±5.9 | -4.7 | 2.9% | 68 | – |
| Bumper Crop | yellow | 3 | 3 | 1.9 [0.6–3.5] | 3.0 | 4.7 [1.6–8.6] | ±5.3 | -4.7 | 8.8% | 73 | – |
| Hum | echo | 1 | 3 | 1.8 [0.5–3.3] | 2.9 | 4.4 [1.1–8.2] | ±5.3 | -4.8 | 0.0% | 98 | – |
| Harvest | yellow | 1 | 3 | 1.7 [0.6–2.9] | 2.8 | 4.3 [1.6–7.1] | ±4.2 | -4.9 | 0.9% | 106 | – |
| Roll Call | purple | 1 | 3 | 1.7 [0.6–3.3] | 2.8 | 4.3 [1.5–8.3] | ±5.1 | -4.9 | 0.0% | 59 | – |
| Graft | green | 1 | 3 | 1.7 [0.6–2.6] | 2.7 | 4.1 [1.5–6.5] | ±3.8 | -4.9 | 0.0% | 123 | – |
| Even Swap | red | 1 | 3 | 1.6 [0.2–3.0] | 2.6 | 4.0 [0.6–7.5] | ±5.2 | -5.0 | 0.0% | 115 | – |
| Encore | echo | 2 | 3 | 1.6 [-0.0–3.5] | 2.6 | 3.9 [-0.1–8.6] | ±6.6 | -5.0 | 2.0% | 96 | – |
| Name Drop | market | 1 | 3 | 1.6 [0.2–3.3] | 2.6 | 3.9 [0.6–8.3] | ±5.8 | -5.0 | 0.0% | 92 | – |
| Trade Seeds | yellow | 1 | 3 | 1.5 [-0.0–3.0] | 2.4 | 3.7 [-0.1–7.4] | ±5.7 | -5.1 | 0.0% | 80 | – |
| Top Up | yellow | 1 | 3 | 1.4 [-0.4–3.3] | 2.3 | 3.5 [-1.0–8.1] | ±6.8 | -5.2 | 0.0% | 79 | – |
| Sob Story | trading | 1 | 3 | 1.4 [-0.1–2.9] | 2.2 | 3.5 [-0.3–7.2] | ±5.6 | -5.2 | 0.0% | 91 | – |
| Echo | echo | 1 | 3 | 1.3 [0.1–2.7] | 2.1 | 3.2 [0.2–6.7] | ±4.9 | -5.3 | 2.4% | 80 | – |
| Snap Up | market | 1 | 3 | 1.2 [0.2–2.3] | 1.9 | 3.0 [0.5–5.6] | ±3.9 | -5.4 | 0.0% | 133 | – |
| Tide | blue | 1 | 3 | 1.1 [0.1–2.0] | 1.8 | 2.8 [0.2–5.0] | ±3.6 | -5.5 | 0.0% | 115 | – |
| Catch Up | purple | 1 | 3 | 1.1 [-0.2–2.6] | 1.8 | 2.7 [-0.6–6.4] | ±5.2 | -5.5 | 0.0% | 105 | – |
| Sweet Talk | silver | 2 | 3 | 0.9 [-0.3–2.2] | 1.4 | 2.1 [-0.7–5.5] | ±4.7 | -5.8 | 0.0% | 126 | – |
| Spree | market | 3 | 3 | 0.7 [-1.1–2.6] | 1.2 | 1.8 [-2.7–6.4] | ±6.9 | -5.9 | 0.0% | 71 | – |
| Branch Out | yellow | 2 | 3 | 0.6 [-0.8–1.7] | 0.9 | 1.4 [-1.9–4.3] | ±4.6 | -6.1 | 0.0% | 86 | – |
| Swap Sides | red | 2 | 3 | 0.5 [-0.9–1.8] | 0.7 | 1.1 [-2.3–4.4] | ±5.0 | -6.2 | 1.0% | 100 | – |
| Greatest Hits | echo | 3 | 3 | 0.1 [-1.2–1.4] | 0.1 | 0.2 [-2.9–3.5] | ±4.8 | -6.5 | 0.0% | 81 | -5.8 [-10.9–0.1] |

</details>

## 4. Archetypes
One scripted seat (rotating) against 3 bots, Classic table. Target band 15–35% (parity 25%). Scripts are built on Normal's valuation: the buyer never recruits; a specialist adds +3 to its sphere's spaces and +2 to its members; the chaser adds twice the round-end contest standing a move leaves it; the hoarder recruits whenever any member is affordable.

| archetype | vs | n | win [90%] | followers (rivals) | members (rivals) | |
|---|---|---|---|---|---|---|
| pure follower buyer | 3 Normal | 240 | 7.7% [5.3%–11.0%] | 52.3 (54.9) | 0.0 (8.6) | below band |
| pure follower buyer | 3 Hard-20 | 64 | 3.9% [1.4%–10.1%] | 51.6 (57.6) | 0.0 (8.3) | below band |
| member hoarder (recruits whenever it can) | 3 Normal | 240 | 11.3% [8.3%–15.0%] | 42.5 (54.4) | 13.3 (7.9) | edge |
| member hoarder (recruits whenever it can) | 3 Hard-20 | 64 | 4.7% [1.9%–11.2%] | 40.2 (58.1) | 13.4 (7.1) | below band |
| contest chaser (maximizes round-end leads) | 3 Normal | 240 | 11.5% [8.5%–15.3%] | 50.5 (55.6) | 8.2 (8.2) | edge |
| contest chaser (maximizes round-end leads) | 3 Hard-20 | 64 | 7.0% [3.3%–14.2%] | 47.5 (57.1) | 8.9 (7.3) | below band |
| Gold (gold) specialist | 3 Normal | 240 | 26.9% [22.4%–31.8%] | 53.7 (54.7) | 8.8 (8.2) |  |
| Gold (gold) specialist | 3 Hard-20 | 64 | 26.6% [18.6%–36.5%] | 55.4 (57.3) | 10.3 (7.2) |  |
| Red (red) specialist | 3 Normal | 240 | 20.4% [16.5%–25.0%] | 52.4 (54.7) | 10.2 (7.8) |  |
| Red (red) specialist | 3 Hard-20 | 64 | 13.3% [7.8%–21.8%] | 48.9 (56.9) | 10.7 (6.8) | edge |
| Blue (market) specialist | 3 Normal | 240 | 21.5% [17.4%–26.1%] | 52.2 (56.1) | 9.4 (8.1) |  |
| Blue (market) specialist | 3 Hard-20 | 64 | 17.2% [10.8%–26.2%] | 51.5 (58.5) | 10.2 (7.1) |  |
| Green (echo) specialist | 3 Normal | 240 | 19.5% [15.7%–24.1%] | 51.5 (55.7) | 8.6 (8.2) |  |
| Green (echo) specialist | 3 Hard-20 | 64 | 10.9% [6.0%–19.0%] | 53.2 (57.9) | 9.3 (7.5) | edge |

## 5. Fairness
Base games (no probes), random tables. Parity is 25%.
- Normal tables, 440 games. By seat: P1 25.2% [22.0%–28.8%], P2 26.6% [23.3%–30.2%], P3 23.4% [20.3%–26.9%], P4 24.8% [21.5%–28.3%]. By round-I pick order: 1st 28.6% [25.2%–32.3%], 2nd 24.1% [20.9%–27.6%], 3rd 25.9% [22.6%–29.5%], 4th 21.4% [18.3%–24.7%]. Round-III first pick (fewest followers) wins 11.6% [9.3%–14.3%]; last of the first pass 52.7% [48.8%–56.6%].
- Hard-20 tables, 68 games. By seat: P1 22.1% [14.9%–31.3%], P2 26.5% [18.7%–36.0%], P3 23.5% [16.2%–32.9%], P4 27.9% [20.0%–37.6%]. By round-I pick order: 1st 32.4% [23.9%–42.2%], 2nd 23.5% [16.2%–32.9%], 3rd 25.0% [17.4%–34.5%], 4th 19.1% [12.5%–28.1%]. Round-III first pick (fewest followers) wins 25.0% [17.4%–34.5%]; last of the first pass 50.0% [40.2%–59.8%].

## 6. Health
| | Normal (440 games) | Hard-20 (68 games) |
|---|---|---|
| members per player (target 6–7) | 5.1 ±2.9 sd (17.1% land on 6–7; 5.1 cards) | 4.0 ±2.6 sd (12.5% land on 6–7; 4.0 cards) |
| final followers | 56.1 | 53.3 |
| … self | 1.0 (1.8%) | 1.0 (1.9%) |
| … members' worth | 6.8 (12.1%) | 5.3 (10.0%) |
| … buys 2→1 / 4→3 / 8→6 / 10→10 | 0.5 / 1.1 / 1.6 / 26.4 (52.8%) | 1.0 / 2.3 / 2.3 / 24.2 (55.8%) |
| … contests round I / II / III | 2.7 / 5.1 / 7.6 (27.5%) | 2.6 / 4.8 / 7.6 (28.3%) |
| … effects (member triggers, actions, game end) | 3.2 (5.8%) | 2.2 (4.0%) |
| resources left at the end | 9.5 mean, 21.0 p90, 105 max (3.8% hold 30+) | 8.8 mean, 18.0 p90, 64 max (2.9% hold 30+) |
| contests that paid 2+ / 3+ tied leaders | 26.0% / 5.2% of 5205 | 22.5% / 5.1% of 803 |
| steal events per game (units taken) | 10.1 (15.5) | 12.5 (18.9) |
| longest run of placements by one player (the snake alone makes 2) | 2.4 mean, 6 max (20.0% of games have 3+) | 2.6 mean, 6 max (27.9% of games have 3+) |
| decision richness: top two within 1 follower | n/a (needs Hard rollouts) | 29.5% of 5822 weighed decisions (median gap 2.85) |

