# Balance bench (full)

2026-10-15 04:06 UTC · commit b00d4ac · content 172abw70sp3.c0ce2b6fc1 · 75.1 min on 4 workers (295 core-min) · 38 random 4-sphere tables (makeTables 4242, every compatible pair at least twice), dealt round-robin.
Games played: 11328 full-game equivalents (probe games fork mid-game and count as the part they play). Throughput: Normal 61.1 games per core-minute, Hard-20 8.6 (all four seats that level).
Instruments: **Normal** (all four seats) and **Hard-20** (Hard = Normal plus rollouts, at budget 20, uncapped, deterministic). Intervals are 90% (bootstrap over seeds for fits, Wilson for win rates). Method and limits: design/eval/bench/README.md.

One run is one sample: flags near the line churn from run to run (two full runs on the same rules kept 5 of 14 card flags, while estimates moved only as far as their intervals predict). **Act on the pooled list in trend.md**, which combines every run on the same rules content.

## What moved since last run
Against 2026-10-15 02:48 (a4d46e9):
- Rules content changed (17nxqj9f1m0.d8606c4f45 → 172abw70sp3.c0ce2b6fc1).
- Repriced: Banker 4→8, Tycoon 12→6, Corner-Cutter 6→4, Toastmaster 8→4, Patron Saint 12→6, Peddler 4→8, Extortionist 6→10, Magnate 8→4, Busker 4→8.
- Cards: Lamplighter: flagged cheap → not flagged; Tycoon: Normal fair 7.6 → 3.1; Hustler: flagged cheap → not flagged; Tribute Band: not flagged → flagged cheap; Squatter: Normal fair 5.4 → 8.5; Banker: flagged cheap → not flagged; Sleepwalker: flagged cheap → not flagged; Tinker: not flagged → flagged cheap; Investor: flagged dear → not flagged; Blue Hand: Normal fair 0.8 → 4.4; Upstart: not flagged → flagged cheap; Exporter: flagged dear → not flagged; Lottery Winner: Normal fair 12.1 → 6.6; Green Pillar: flagged dear → not flagged; Proselytizer: flagged dear → not flagged; Magnate: flagged dear → not flagged; Cutpurse: not flagged → flagged cheap; Harmonist: flagged dear → not flagged.
- Spaces: Your Call (round 3): strong → in; Cheap Seats (round 1): in → weak; Dividend (round 3): strong → in; Bloom (round 3): strong → in; Hand-pick (round 3): in → strong; Poach (round 3): in → strong; Open House (round 3): strong → in; Greatest Hits (round 3): weak → in; Lie Low (round 3): in → strong.
- pure follower buyer vs 3 Normal: 7.7% → 17.1%.
- member hoarder (recruits whenever it can) vs 3 Normal: 11.3% → 6.9%.
- Red (red) specialist vs 3 Normal: 20.4% → 26.9%.
- Red (red) specialist vs 3 Hard-20: 13.3% → 23.4%.

## 1. Anchors
Every anchor's interval reaches its expected range, Hard-20 beats Normal, and both price slopes are clearly positive: the instruments are trusted. (An anchor is off when its 90% interval misses the range, or it has too few probes to say.)

- Price slope, followers of margin per extra cost point (the exchange rate for everything below): Normal 0.84 [0.79–0.89] (by fork round I/II/III: 0.89 [0.81–1.00], 0.91 [0.83–0.98], 0.71 [0.65–0.77]); Hard-20 0.82 [0.69–1.02] (by fork round I/II/III: 1.02 [0.83–1.35], 0.88 [0.60–1.18], 0.55 [0.37–0.72]). 
- Hard-20 alone vs 3 Normal (Classic, n=96): wins 47.2% [39.0%–55.6%]; parity is 25%, it must reach 32%. OK.

| instrument | anchor | printed | fair [90%] | n | expected | |
|---|---|---|---|---|---|---|
| Normal | Banker | 8 | 7.3 [6.0–8.8] | 422 | 4.5–10.5 | ok |
| Normal | Big Family | 4 | 3.7 [2.7–5.0] | 388 | 0.5–6.0 | ok |
| Normal | Sponsor | 10 | 8.5 [7.0–10.0] | 240 | 8.0–∞ | ok |
| Normal | Tycoon | 6 | 3.1 [1.8–4.4] | 402 | −∞–10.0 | ok |
| Hard-20 | Banker | 8 | 7.8 [4.6–11.4] | 69 | 4.5–10.5 | ok |
| Hard-20 | Big Family | 4 | 3.4 [0.7–6.3] | 54 | 0.5–6.0 | ok |
| Hard-20 | Sponsor | 10 | 11.6 [5.8–19.8] | 34 | 8.0–∞ | ok |
| Hard-20 | Tycoon | 6 | 3.9 [1.4–6.7] | 66 | −∞–10.0 | ok |

- Banker ("Now and at round start, +3 gold"; 4, repriced to 8 in balance pass 1; the range is absolute). By arithmetic +9/+6/+3 gold by round recruited, ~7 averaged, plus a follower; the Normal sweep read 7.3 [6.3–8.3] recruited in round I.
- Big Family (4: "Worth 3 followers", no ability), the plain worth-N member: 3 followers ≈ 4 resources at 4→3, less the follower buy it displaces. The Normal sweep read 2.4 [0.6–3.6].
- Sponsor (10: "Your members cost 2 less"), rework-candidates #1, known strong: must read 8 or more (printed − 2).
- Tycoon ("Game end: +1 follower per 3 gold"), rework-candidates #3, known weak at its old 12: must read 10 or less (absolute; repriced to 6 in balance pass 1, so it no longer has to read under printed).

## 2. Cards
Paired forced recruit: a private copy of the card, at printed −4 / printed / +4, recruited at the seat's first affordable buy from a random round on (I, II or III), against the same seed without it. Fair price = the price where it nets 0 followers of margin. Normal: 26372 probes over 440 seeds, every card. Hard-20: 2640 probes over 44 seeds, only the anchors and what Normal flags or reads ≥ 2.5 off (a card both must agree on can't be flagged by Hard alone). Flag = the 90% interval misses printed and the gap is ≥ 1.5, for BOTH instruments.

### Both instruments agree (10)
| card | printed | Normal fair [90%] n | Hard-20 fair [90%] n | reads | bought round |
|---|---|---|---|---|---|
| Tribute Band (echo) | 12 | 18.4 [14.8–22.5] 47 | 16.9 [13.5–21.7] 37 | too cheap | 2.6 |
| Upstart (silver) | 6 | 12.1 [9.6–14.4] 128 | 16.1 [13.1–19.5] 56 | too cheap, needs an ability change (would need > 2× its price) | 2.3 |
| Desperado (thieves) | 4 | 9.9 [7.8–12.6] 92 | 7.5 [5.7–9.8] 75 | too cheap | 2.3 |
| Tinker (gold) | 6 | 11.0 [8.7–13.5] 121 | 11.2 [9.0–14.7] 65 | too cheap | 2.4 |
| Go-Between (yellow) | 8 | 3.7 [0.8–5.8] 62 | 3.3 [0.4–6.6] 60 | too dear | 2.4 |
| Lender (trading) | 2 | 6.1 [4.2–8.0] 100 | 9.9 [7.4–13.9] 44 | too cheap, needs an ability change (would need > 2× its price) | 2.2 |
| Crew (thieves) | 2 | 5.9 [4.3–7.9] 108 | 7.1 [5.3–9.2] 81 | too cheap, needs an ability change (would need > 2× its price) | 2.2 |
| Kingpin (thieves) | 2 | 5.6 [3.9–8.0] 98 | 5.0 [2.3–8.0] 69 | too cheap, needs an ability change (would need > 2× its price) | 2.2 |
| Tax Collector (gold) | 4 | 7.6 [5.5–9.7] 145 | 7.1 [4.6–9.6] 71 | too cheap | 2.1 |
| Cutpurse (thieves) | 4 | 7.6 [5.7–9.8] 113 | 7.0 [5.1–9.4] 76 | too cheap | 2.2 |

### Needs an ability change, not a price (4)
Upstart (printed 6; Normal 12.1, Hard-20 16.1: would need > 2× its price); Lender (printed 2; Normal 6.1, Hard-20 9.9: would need > 2× its price); Crew (printed 2; Normal 5.9, Hard-20 7.1: would need > 2× its price); Kingpin (printed 2; Normal 5.6, Hard-20 5.0: would need > 2× its price).

### Normal flags, Hard-20 confidently doesn't (likely a Normal-bot artifact) (6)
Midas 8 (Normal 2.5 [-0.3–4.7], Hard-20 6.4 [4.3–8.5]); Timekeeper 8 (Normal 4.6 [2.6–6.3], Hard-20 8.6 [6.6–10.7]); Ensemble 6 (Normal -0.9 [-3.8–1.9], Hard-20 4.1 [1.6–6.6]); Farmer 6 (Normal 0.6 [-2.4–3.6], Hard-20 4.6 [0.7–8.4]); Explorer 8 (Normal 3.8 [1.4–6.4], Hard-20 6.9 [4.1–9.6]); Talent Scout 4 (Normal 0.0 [-2.3–2.5], Hard-20 4.3 [1.9–7.6]).

Normal flags, Hard-20 too thin or unsure to say: Overseer 4→5.7; Go-Getter 8→11.1; Tycoon 6→3.1 (Hard-20 3.9, n 66); Heir 8→10.5; Revelers 6→3.1 (Hard-20 4.4, n 57); Hustler 2→5.0; Underdog 6→9.7; Penny Pincher 4→6.1; Bookkeeper 6→3.4; Investor 6→2.5 (Hard-20 4.8, n 63); Insider 6→4.0; Blue Patron 6→3.9; Blue Pillar 6→2.4 (Hard-20 3.6, n 28); Debutante 8→10.7; Bulk Buyer 6→3.2; Heiress 10→7.4; Blue Hand 2→4.4; Liquidator 6→2.8; Extra Hand 10→7.5 (Hard-20 8.8, n 148); Dealer 2→-0.9; Blue Recruit 1→3.3; Shopkeeper 4→6.1; Exporter 8→4.3; Green Elder 4→2.3; Lottery Winner 10→6.6; Admirer 6→1.2 (Hard-20 2.8, n 52); Pilgrim 4→5.8; Green Pillar 6→1.7 (Hard-20 5.4, n 41); Safecracker 4→6.1; Sponsor 10→8.5 (Hard-20 11.6, n 34); Benchwarmer 1→4.8 (Hard-20 3.4, n 56); Proselytizer 12→8.7; Volunteer 0→2.0; Crowd-Pleaser 2→4.7; Mole 4→7.0 (Hard-20 5.8, n 78); Understudy 6→9.0; Translator 6→2.7; Green Devotee 4→2.5; Sower 4→1.6; Rainmaker 6→2.4; Harmonist 8→3.0; Mentor & Protégé 10→7.2; Host 6→3.2; Extortionist 10→15.4 (Hard-20 12.1, n 29); Bodyguard 6→8.7; Robin Hood 4→6.6; Onlooker 10→6.3; Underbidder 2→5.1; Gleaner 10→5.0; Planner 4→8.3 (Hard-20 6.8, n 32).

<details><summary>Every card (Normal; Hard-20 where measured)</summary>

| card | printed | Normal fair [90%] | n | detectable | net at printed by round I/II/III | Hard-20 fair [90%] | n |
|---|---|---|---|---|---|---|---|
| Tribute Band (echo.dejavu) | 12 | 18.4 [14.8–22.5] | 47 | ±5.8 | 17.0 / -5.8 / -2.3 | 16.9 [13.5–21.7] | 37 |
| Upstart (silver.spoon) | 6 | 12.1 [9.6–14.4] | 128 | ±3.6 | 3.1 / 11.9 / 11.6 | 16.1 [13.1–19.5] | 56 |
| Desperado (thieves.desperado) | 4 | 9.9 [7.8–12.6] | 92 | ±3.7 | 5.7 / 8.3 / 6.1 | 7.5 [5.7–9.8] | 75 |
| Extortionist (thieves.extortionist) | 10 | 15.4 [11.8–18.4] | 36 | ±5.0 | 7.7 / 0.3 / 8.2 | 12.1 [8.8–15.6] | 29 |
| Tinker (gold.tinker) | 6 | 11.0 [8.7–13.5] | 121 | ±3.6 | 3.3 / 4.9 / 0.2 | 11.2 [9.0–14.7] | 65 |
| Planner (market.planner) | 4 | 8.3 [5.7–10.9] | 81 | ±4.0 | 5.6 / 11.8 / 1.0 | 6.8 [3.8–9.3] | 32 |
| Lender (trading.lender) | 2 | 6.1 [4.2–8.0] | 100 | ±2.9 | 6.2 / -1.1 / 1.1 | 9.9 [7.4–13.9] | 44 |
| Crew (thieves.crew) | 2 | 5.9 [4.3–7.9] | 108 | ±2.7 | 6.4 / 4.7 / 0.7 | 7.1 [5.3–9.2] | 81 |
| Benchwarmer (red.reserve) | 1 | 4.8 [2.8–6.7] | 114 | ±3.0 | 5.1 / 3.3 / 1.1 | 3.4 [0.0–6.3] | 56 |
| Underdog (gold.underdog) | 6 | 9.7 [7.3–11.9] | 136 | ±3.5 | 1.3 / 2.3 / -4.2 | – |  |
| Kingpin (thieves.kingpin) | 2 | 5.6 [3.9–8.0] | 98 | ±3.1 | 3.4 / 6.7 / 1.5 | 5.0 [2.3–8.0] | 69 |
| Tax Collector (gold.taxman) | 4 | 7.6 [5.5–9.7] | 145 | ±3.2 | 12.9 / -1.4 / 2.1 | 7.1 [4.6–9.6] | 71 |
| Cutpurse (thieves.cutpurse) | 4 | 7.6 [5.7–9.8] | 113 | ±3.0 | -2.8 / 1.8 / -0.5 | 7.0 [5.1–9.4] | 76 |
| Underbidder (market.underbidder) | 2 | 5.1 [2.8–7.3] | 83 | ±3.4 | 1.5 / -11.2 / -1.7 | – |  |
| Go-Getter (purple.secondwind) | 8 | 11.1 [9.0–13.1] | 99 | ±3.1 | -0.5 / 5.9 / 2.7 | – |  |
| Mole (thieves.mole) | 4 | 7.0 [5.2–8.9] | 109 | ±2.7 | 3.6 / 7.1 / -2.0 | 5.8 [3.8–8.1] | 78 |
| Understudy (echo.understudy) | 6 | 9.0 [6.3–11.7] | 74 | ±4.1 | 2.6 / 3.3 / 1.7 | – |  |
| Hustler (gold.hustler) | 2 | 5.0 [2.7–7.4] | 123 | ±3.5 | 3.3 / 3.0 / 3.5 | – |  |
| Late Bloomer (yellow.latebloomer) | 4 | 6.7 [3.9–9.6] | 78 | ±4.3 | -0.4 / -14.9 / -3.8 | – |  |
| Bodyguard (thieves.watchdog) | 6 | 8.7 [6.7–11.4] | 81 | ±3.5 | 1.1 / 9.8 / -0.4 | – |  |
| Debutante (silver.gala) | 8 | 10.7 [8.6–13.4] | 136 | ±3.6 | 5.7 / 5.2 / 6.0 | – |  |
| Crowd-Pleaser (red.crowd) | 2 | 4.7 [2.8–7.2] | 123 | ±3.3 | 0.3 / 10.8 / 5.7 | – |  |
| Robin Hood (thieves.robinhood) | 4 | 6.6 [4.7–8.6] | 99 | ±2.9 | -0.6 / 4.6 / 1.4 | – |  |
| Heir (silver.heir) | 8 | 10.5 [8.8–12.6] | 143 | ±2.9 | 4.1 / 1.4 / 6.2 | – |  |
| Blue Hand (blue.hand) | 2 | 4.4 [2.8–6.4] | 131 | ±2.7 | 4.5 / 6.9 / 2.0 | – |  |
| Lamplighter (purple.lamplighter) | 8 | 10.4 [7.7–13.1] | 88 | ±4.1 | 4.6 / 9.6 / 3.9 | – |  |
| Shift Crew (purple.crew) | 2 | 4.3 [1.8–7.1] | 92 | ±4.1 | 2.7 / 4.3 / 5.0 | – |  |
| Blue Recruit (blue.recruit) | 1 | 3.3 [1.5–5.2] | 125 | ±2.7 | -1.2 / 3.8 / 0.9 | – |  |
| Recluse (market.recluse) | 4 | 6.2 [3.7–8.7] | 91 | ±3.7 | -4.1 / -10.6 / 5.5 | – |  |
| Safecracker (thieves.bigscore) | 4 | 6.1 [4.2–8.2] | 93 | ±3.0 | 2.1 / 2.9 / 2.4 | – |  |
| Penny Pincher (gold.thrift) | 4 | 6.1 [4.4–8.1] | 147 | ±2.8 | -0.0 / -1.8 / -0.3 | – |  |
| Shopkeeper (trading.shopkeeper) | 4 | 6.1 [4.1–8.3] | 93 | ±3.2 | 5.7 / 1.7 / 0.3 | – |  |
| Volunteer (red.volunteer) | 0 | 2.0 [0.2–4.1] | 139 | ±2.9 | 0.3 / 4.8 / 0.2 | – |  |
| Foreman (purple.foreman) | 6 | 8.0 [5.2–10.9] | 113 | ±4.3 | -0.7 / -0.9 / 5.6 | – |  |
| Intern (red.intern) | 1 | 3.0 [0.9–4.9] | 127 | ±3.0 | 3.4 / 6.0 / 0.1 | – |  |
| Sleepwalker (echo.afterimage) | 6 | 8.0 [5.6–11.1] | 74 | ±4.2 | -9.0 / 5.0 / 9.1 | – |  |
| Pilgrim (yellow.pilgrim) | 4 | 5.8 [4.1–7.8] | 90 | ±2.8 | 5.4 / 2.3 / -6.9 | – |  |
| Overseer (purple.overseer) | 4 | 5.7 [4.2–7.4] | 110 | ±2.5 | -0.6 / 1.3 / 1.4 | – |  |
| Tipster (trading.tipster) | 6 | 7.6 [5.4–9.7] | 94 | ±3.3 | 9.4 / -1.2 / -0.6 | – |  |
| Mime (echo.mirror) | 6 | 7.5 [5.3–10.4] | 93 | ±3.9 | -3.9 / 5.3 / 1.3 | – |  |
| Minimalist (market.minimalist) | 2 | 3.5 [0.8–6.5] | 82 | ±4.3 | -9.9 / 5.7 / -3.4 | – |  |
| Majordomo (silver.majordomo) | 6 | 7.5 [5.5–9.5] | 135 | ±3.0 | 4.4 / -1.5 / -3.1 | – |  |
| Accomplice (thieves.accomplice) | 8 | 9.5 [7.5–11.8] | 74 | ±3.2 | 7.4 / -0.9 / -0.6 | – |  |
| Blue Helper (blue.helper) | 2 | 3.4 [1.8–4.8] | 115 | ±2.3 | -0.1 / 0.7 / 3.0 | – |  |
| Taskmaster (purple.taskmaster) | 6 | 7.3 [5.0–9.7] | 101 | ±3.5 | 5.5 / 3.1 / -3.0 | – |  |
| Connoisseur (market.connoisseur) | 4 | 5.2 [2.9–7.7] | 90 | ±3.6 | -1.1 / 8.0 / -0.5 | – |  |
| Feastmaker (yellow.feastmaker) | 10 | 11.1 [7.7–13.9] | 43 | ±4.7 | -1.1 / 6.6 / 14.6 | – |  |
| Errand Runner (purple.errand) | 8 | 8.9 [6.6–10.8] | 105 | ±3.1 | -5.2 / 2.9 / 4.3 | – |  |
| Broker (trading.broker) | 2 | 2.8 [0.6–5.3] | 93 | ±3.6 | -3.2 / 3.9 / -2.3 | – |  |
| Caterer (silver.caterer) | 4 | 4.7 [2.5–6.5] | 144 | ±3.1 | 7.6 / 1.6 / 0.8 | – |  |
| Impressionist (echo.tuningfork) | 4 | 4.6 [2.6–6.8] | 96 | ±3.2 | 2.7 / -4.7 / 1.5 | – |  |
| Green Recruit (green.recruit) | 1 | 1.5 [0.1–3.0] | 152 | ±2.2 | -4.1 / 6.2 / -0.1 | – |  |
| Grifter (thieves.grifter) | 6 | 6.5 [4.7–8.7] | 71 | ±3.0 | -1.9 / 6.8 / 0.4 | – |  |
| Squatter (benders.squatter) | 8 | 8.5 [6.9–10.1] | 252 | ±2.4 | 3.0 / -1.0 / 3.7 | – |  |
| Patroness (market.patroness) | 8 | 8.5 [5.5–11.5] | 69 | ±4.6 | 6.0 / 8.0 / 3.4 | – |  |
| Blue Elder (blue.elder) | 4 | 4.4 [2.5–6.6] | 120 | ±3.1 | -0.7 / 3.2 / 0.4 | – |  |
| Raider (trading.raider) | 2 | 2.4 [0.4–4.5] | 87 | ±3.1 | -2.4 / 0.9 / 2.8 | – |  |
| Prospector (gold.prospector) | 4 | 4.4 [2.9–6.3] | 146 | ±2.6 | 2.3 / 3.1 / -0.8 | – |  |
| Lookout (thieves.lookout) | 6 | 6.4 [4.6–8.5] | 71 | ±3.0 | -4.6 / 3.6 / 3.4 | – |  |
| Treasurer (gold.seed) | 4 | 4.3 [2.2–6.2] | 134 | ±3.0 | -0.5 / -3.3 / -4.4 | – |  |
| Gardener (yellow.gardener) | 2 | 2.3 [-0.1–4.7] | 73 | ±3.6 | 7.6 / -4.8 / -6.6 | – |  |
| Stunt Double (echo.hourglass) | 10 | 10.3 [6.5–14.0] | 80 | ±5.7 | 3.5 / 0.4 / -1.3 | – |  |
| Busker (echo.evergreen) | 8 | 8.2 [5.6–11.1] | 78 | ±4.1 | 1.4 / 8.1 / -7.3 | – |  |
| Night Owl (purple.nightowl) | 10 | 10.2 [7.3–12.8] | 78 | ±4.1 | 3.1 / -2.0 / -3.1 | – |  |
| Courier (purple.courier) | 6 | 6.1 [3.5–8.8] | 97 | ±4.0 | -2.2 / -7.9 / 0.5 | – |  |
| Freelancer (benders.freelancer) | 4 | 4.1 [2.9–5.5] | 305 | ±2.0 | 1.4 / -3.9 / 1.0 | – |  |
| Silversmith (silver.silversmith) | 6 | 6.1 [4.2–8.2] | 137 | ±3.0 | -2.7 / 0.5 / 0.3 | – |  |
| Dyer (yellow.dyer) | 6 | 6.1 [3.7–8.0] | 59 | ±3.3 | -0.9 / 4.8 / -2.3 | – |  |
| Speculator (gold.speculator) | 8 | 8.1 [5.4–10.5] | 128 | ±3.8 | -2.8 / -4.0 / 3.8 | – |  |
| Blue Regular (blue.regular) | 3 | 2.9 [1.2–4.4] | 126 | ±2.4 | -2.0 / 1.4 / -2.4 | – |  |
| Steward (silver.steward) | 4 | 3.9 [1.9–5.8] | 150 | ±2.9 | -1.3 / -0.1 / 4.5 | – |  |
| Benefactor (silver.benefactor) | 6 | 5.9 [4.0–8.0] | 150 | ±3.0 | 3.8 / -6.8 / -1.9 | – |  |
| Shareholder (trading.shareholder) | 3 | 2.9 [0.3–5.8] | 85 | ±4.2 | -12.6 / 6.7 / 1.7 | – |  |
| Guest (silver.guest) | 8 | 7.8 [6.0–9.7] | 149 | ±2.8 | -3.4 / 1.3 / 0.1 | – |  |
| Recruiter (red.recruiter) | 8 | 7.8 [5.5–11.0] | 99 | ±4.2 | -1.7 / 4.1 / 3.0 | – |  |
| Big Family (red.bigfamily) | 4 | 3.7 [2.7–5.0] | 388 | ±1.8 | -0.1 / -2.1 / -0.5 | 3.4 [0.7–6.3] | 54 |
| Clockmaker (purple.clockmaker) | 4 | 3.7 [1.6–5.6] | 96 | ±3.0 | 0.8 / -0.3 / 1.3 | – |  |
| Sticky Fingers (thieves.sticky) | 8 | 7.7 [5.7–10.0] | 71 | ±3.3 | -0.3 / 4.2 / -5.8 | – |  |
| Rich Uncle (trading.safetynet) | 2 | 1.7 [-0.4–3.8] | 96 | ±3.1 | -0.6 / -1.3 / 2.2 | – |  |
| Grand Host (silver.grandhost) | 12 | 11.7 [9.3–14.6] | 128 | ±3.9 | 7.6 / -0.8 / -4.2 | – |  |
| Green Helper (green.helper) | 2 | 1.7 [0.2–3.1] | 146 | ±2.2 | -5.0 / 5.8 / -0.5 | – |  |
| Social Climber (market.climber) | 2 | 1.7 [-1.0–4.6] | 75 | ±4.2 | -4.5 / -2.5 / 4.6 | – |  |
| Patron Saint (silver.saint) | 6 | 5.7 [4.0–7.9] | 142 | ±2.9 | 3.4 / -7.2 / 2.0 | – |  |
| Twins (red.twins) | 2 | 1.6 [0.0–3.7] | 139 | ±2.8 | -0.6 / 2.8 / -0.0 | – |  |
| Toastmaster (silver.toastmaster) | 4 | 3.6 [1.9–5.5] | 131 | ±2.8 | 2.7 / -2.1 / -7.7 | – |  |
| Weaver (yellow.weaver) | 6 | 5.5 [3.2–8.3] | 67 | ±3.9 | 5.8 / -3.6 / -0.8 | – |  |
| Middleman (gold.coinpurse) | 4 | 3.5 [1.4–5.5] | 145 | ±3.1 | -4.2 / -0.9 / 3.8 | – |  |
| Reinvestor (trading.reinvestor) | 4 | 3.5 [1.2–6.2] | 86 | ±3.7 | -10.2 / 1.9 / -1.0 | – |  |
| Auctioneer (market.auctioneer) | 6 | 5.5 [2.6–9.0] | 72 | ±4.8 | -5.6 / 0.3 / -5.8 | – |  |
| Mob (red.mob) | 8 | 7.5 [5.3–9.8] | 109 | ±3.4 | 4.7 / 4.4 / -2.9 | – |  |
| Pied Piper (red.drive) | 4 | 3.4 [1.6–5.3] | 122 | ±2.8 | -4.9 / -2.2 / -0.6 | – |  |
| Sommelier (market.sommelier) | 4 | 3.4 [0.7–5.8] | 76 | ±3.8 | -12.1 / 1.3 / -4.6 | – |  |
| Light Fingers (thieves.lightfingers) | 8 | 7.3 [5.2–9.4] | 93 | ±3.1 | -4.3 / 0.4 / -5.5 | – |  |
| Front-runner (benders.frontrunner) | 2 | 1.3 [0.2–2.7] | 311 | ±1.9 | -4.8 / 0.0 / 2.3 | – |  |
| Banker (gold.banker) | 8 | 7.3 [6.0–8.8] | 422 | ±2.2 | 4.0 / 3.2 / -2.8 | 7.8 [4.6–11.4] | 69 |
| Stylist (market.stylist) | 4 | 3.2 [0.6–6.0] | 71 | ±4.1 | -8.3 / 3.0 / 3.8 | – |  |
| Dowager (silver.dowager) | 4 | 3.2 [1.5–5.1] | 140 | ±2.8 | -0.8 / -7.8 / -0.2 | – |  |
| Curator (market.curator) | 4 | 3.2 [1.0–5.8] | 95 | ±3.6 | -7.3 / 2.0 / -5.0 | – |  |
| Big Spender (benders.bigspender) | 4 | 3.2 [2.1–4.6] | 310 | ±1.9 | -3.1 / 1.0 / -3.1 | – |  |
| Muse (echo.muse) | 4 | 3.1 [0.9–6.0] | 98 | ±3.8 | 2.6 / 2.9 / -0.6 | – |  |
| Corner-Cutter (purple.doubletime) | 4 | 3.1 [1.4–5.1] | 99 | ±2.8 | 0.4 / -4.4 / 4.5 | – |  |
| Double Agent (thieves.doubleagent) | 6 | 4.9 [2.7–7.1] | 86 | ±3.3 | -6.0 / -7.3 / -3.2 | – |  |
| Straggler (benders.straggler) | 8 | 6.9 [5.5–8.2] | 287 | ±2.0 | 0.4 / 1.4 / -0.5 | – |  |
| Green Hand (green.hand) | 2 | 0.9 [-0.7–2.3] | 157 | ±2.3 | -1.9 / 2.3 / -5.4 | – |  |
| Green Regular (green.regular) | 3 | 1.9 [-0.0–3.6] | 156 | ±2.7 | -3.6 / -3.0 / 1.0 | – |  |
| Merchant (gold.merchant) | 6 | 4.7 [3.1–6.7] | 120 | ±2.7 | -0.9 / -8.7 / 0.4 | – |  |
| Blue Devotee (blue.devotee) | 4 | 2.6 [1.2–4.5] | 121 | ±2.5 | -2.5 / -2.7 / -1.9 | – |  |
| Late Riser (purple.lateriser) | 6 | 4.6 [2.5–6.6] | 106 | ±3.1 | 4.9 / -6.5 / 1.6 | – |  |
| Apprentice (purple.apprentice) | 4 | 2.6 [0.9–4.4] | 106 | ±2.6 | -4.1 / 0.4 / -5.8 | – |  |
| Retinue (silver.retinue) | 4 | 2.6 [0.9–4.3] | 144 | ±2.6 | 2.1 / -6.6 / -4.5 | – |  |
| Sponsor (red.sponsor) | 10 | 8.5 [7.0–10.0] | 240 | ±2.3 | -1.5 / -6.1 / 0.7 | 11.6 [5.8–19.8] | 34 |
| Green Devotee (green.devotee) | 4 | 2.5 [1.0–3.9] | 149 | ±2.2 | 0.0 / -5.2 / 1.8 | – |  |
| Snob (market.snob) | 10 | 8.4 [5.5–12.2] | 53 | ±5.0 | -10.9 / -4.3 / 0.2 | – |  |
| Magnate (trading.magnate) | 4 | 2.3 [0.2–4.8] | 94 | ±3.5 | -9.4 / -6.8 / -0.2 | – |  |
| Green Patron (green.patron) | 6 | 4.3 [2.3–6.2] | 144 | ±2.9 | -5.7 / 2.2 / -0.6 | – |  |
| Wallflower (echo.wallflower) | 4 | 2.3 [-0.2–4.8] | 88 | ±3.7 | 8.5 / 12.4 / -2.4 | – |  |
| Green Elder (green.elder) | 4 | 2.3 [0.5–3.9] | 139 | ±2.6 | -7.9 / 0.9 / 3.2 | – |  |
| Choir (echo.choir) | 6 | 4.1 [2.1–6.1] | 91 | ±3.0 | 2.8 / -0.8 / -2.2 | – |  |
| Pawnbroker (trading.pawnbroker) | 4 | 2.1 [-0.1–4.3] | 107 | ±3.3 | -1.5 / 2.3 / 0.6 | – |  |
| Chronicler (echo.chronicler) | 8 | 6.0 [3.7–9.1] | 84 | ±4.1 | -8.4 / -5.8 / -3.3 | – |  |
| Patriarch (red.patriarch) | 10 | 8.0 [5.0–11.1] | 79 | ±4.6 | 5.7 / -7.6 / 2.6 | – |  |
| Insider (benders.insider) | 6 | 4.0 [2.5–5.5] | 268 | ±2.3 | -3.2 / -3.6 / -0.1 | – |  |
| Blue Patron (blue.patron) | 6 | 3.9 [2.2–5.7] | 110 | ±2.6 | -3.7 / 0.0 / -3.9 | – |  |
| Doppelganger (red.doppel) | 6 | 3.7 [1.7–6.3] | 109 | ±3.4 | -3.0 / 1.2 / 7.7 | – |  |
| Sower (yellow.sower) | 4 | 1.6 [-0.8–3.7] | 84 | ±3.4 | 2.7 / 2.9 / -4.9 | – |  |
| Extra Hand (benders.extrahand) | 10 | 7.5 [6.2–9.0] | 298 | ±2.1 | -2.7 / -4.5 / -6.0 | 8.8 [6.4–10.8] | 148 |
| Peddler (yellow.peddler) | 8 | 5.5 [2.9–8.5] | 67 | ±4.3 | 2.5 / 0.8 / 1.2 | – |  |
| Bookkeeper (purple.bookkeeper) | 6 | 3.4 [1.7–5.9] | 97 | ±3.2 | -1.3 / -1.9 / -3.8 | – |  |
| Heiress (trading.heiress) | 10 | 7.4 [5.0–9.5] | 89 | ±3.4 | 3.8 / -4.9 / -6.6 | – |  |
| Host (red.host) | 6 | 3.2 [1.0–5.5] | 90 | ±3.4 | 4.7 / -11.9 / -5.3 | – |  |
| Bulk Buyer (trading.bulkbuyer) | 6 | 3.2 [0.9–5.5] | 92 | ±3.5 | -4.3 / -4.1 / 3.3 | – |  |
| Mentor & Protégé (red.mentor) | 10 | 7.2 [4.3–9.7] | 76 | ±4.1 | -7.3 / -3.9 / 0.2 | – |  |
| Tycoon (gold.tycoon) | 6 | 3.1 [1.8–4.4] | 402 | ±1.9 | -3.6 / -2.0 / -1.2 | 3.9 [1.4–6.7] | 66 |
| Revelers (silver.revelers) | 6 | 3.1 [1.3–4.7] | 137 | ±2.6 | -5.0 / -0.7 / -3.8 | 4.4 [0.5–8.1] | 57 |
| Dealer (trading.dealer) | 2 | -0.9 [-3.2–1.6] | 99 | ±3.6 | 8.6 / -0.8 / 0.4 | – |  |
| Liquidator (trading.liquidator) | 6 | 2.8 [0.3–5.2] | 78 | ±3.7 | -5.3 / -0.9 / -6.8 | – |  |
| Reseller (market.reseller) | 12 | 8.8 [5.9–12.7] | 42 | ±5.2 | 7.2 / -13.2 / -7.7 | – |  |
| Proselytizer (red.proselytizer) | 12 | 8.7 [6.1–11.4] | 93 | ±4.0 | -1.0 / -14.2 / -6.3 | – |  |
| Translator (echo.translator) | 6 | 2.7 [-0.1–5.4] | 90 | ±4.1 | -18.1 / -6.6 / -5.7 | – |  |
| Groupie (echo.groupie) | 8 | 4.6 [1.2–8.1] | 73 | ±5.2 | -5.6 / -6.0 / -6.9 | – |  |
| Lottery Winner (gold.jackpot) | 10 | 6.6 [4.3–8.9] | 119 | ±3.5 | -5.9 / 2.9 / 1.0 | – |  |
| Timekeeper (purple.patience) | 8 | 4.6 [2.6–6.3] | 87 | ±2.8 | 2.0 / 1.4 / -2.3 | 8.6 [6.6–10.7] | 68 |
| Investor (gold.investor) | 6 | 2.5 [0.6–4.3] | 127 | ±2.8 | -6.0 / 1.4 / 0.1 | 4.8 [2.0–7.8] | 63 |
| Blue Pillar (blue.pillar) | 6 | 2.4 [0.7–4.4] | 122 | ±2.9 | -1.9 / -8.9 / 0.8 | 3.6 [0.2–6.7] | 28 |
| Rainmaker (yellow.rainmaker) | 6 | 2.4 [0.0–4.7] | 76 | ±3.5 | -4.5 / -2.1 / -4.9 | – |  |
| Exporter (trading.exporter) | 8 | 4.3 [1.8–6.4] | 74 | ±3.5 | -5.3 / -7.8 / -1.9 | – |  |
| Onlooker (market.onlooker) | 10 | 6.3 [3.3–9.4] | 51 | ±4.7 | -12.2 / -1.0 / -9.2 | – |  |
| Talent Scout (market.blackmarket) | 4 | 0.0 [-2.3–2.5] | 80 | ±3.7 | -7.2 / -9.8 / -0.1 | 4.3 [1.9–7.6] | 24 |
| Explorer (yellow.explorer) | 8 | 3.8 [1.4–6.4] | 61 | ±3.7 | 0.0 / -5.4 / -6.4 | 6.9 [4.1–9.6] | 59 |
| Go-Between (yellow.gobetween) | 8 | 3.7 [0.8–5.8] | 62 | ±3.8 | -6.6 / -5.8 / -4.0 | 3.3 [0.4–6.6] | 60 |
| Green Pillar (green.pillar) | 6 | 1.7 [-0.0–3.2] | 143 | ±2.5 | -4.6 / -5.8 / -0.9 | 5.4 [1.3–9.5] | 41 |
| Admirer (yellow.admirer) | 6 | 1.2 [-1.6–4.2] | 59 | ±4.4 | -7.9 / -2.9 / -4.7 | 2.8 [-0.2–6.2] | 52 |
| Gleaner (yellow.gleaner) | 10 | 5.0 [1.0–8.4] | 42 | ±5.6 | -39.2 / 10.7 / -9.5 | – |  |
| Harmonist (yellow.harmonist) | 8 | 3.0 [-0.1–6.6] | 54 | ±5.0 | 4.2 / 6.0 / -6.0 | – |  |
| Farmer (yellow.farmer) | 6 | 0.6 [-2.4–3.6] | 60 | ±4.5 | -10.2 / -7.9 / 5.3 | 4.6 [0.7–8.4] | 58 |
| Midas (gold.midas) | 8 | 2.5 [-0.3–4.7] | 143 | ±3.7 | -8.8 / -2.1 / -9.6 | 6.4 [4.3–8.5] | 70 |
| Ensemble (echo.ensemble) | 6 | -0.9 [-3.8–1.9] | 72 | ±4.3 | -11.4 / -13.4 / 0.8 | 4.1 [1.6–6.6] | 45 |

</details>

Power: for the 91 cards Normal reads in band, the smallest gap this run could have caught (80% power, 90% interval) is 3.2 cost points at the median card, 4.3 at the 90th percentile (column "detectable" in the full table). More seeds narrow it as 1/√n.

## 2b. Card × sphere and space × sphere outliers
Normal's residuals on the tables where the seat held the item, grouped by each other sphere at the table: a card fine overall but off beside one sphere. Listed at |deviation| ≥ 3 cost points (spaces: 3 scaled u) and |z| ≥ 3.5 among 1362 card × sphere and 1350 space × sphere pairs with n ≥ 15 (about one false alarm expected). Hard-20 beside it where its targets covered the pair.

| card | beside | deviation [90%] | n | Hard-20 |
|---|---|---|---|---|
| Tycoon | Purple (purple) | -5.3 ±2.4 pts | 44 | – |

Spaces: none.

## 3. Spaces
Paired forced placement: from the start of round r, the seat's first minion must take the space (base: the bot's own choice). A "null" minion (bot's own choice, action does nothing) in every game gives the zero, so worth = followers of margin over a minion that does nothing; u = worth ÷ that round's price slope (Normal 0.89 / 0.91 / 0.71, Hard-20 1.02 / 0.88 / 0.55 followers per resource, rounds I / II / III). Raw u also counts the buy a placement enables and early compounding, so it runs high; scaled u sets each round's median space to the middle of its band (×2.08 / 1.15 / 1.76 for rounds I / II / III) and says where a space sits among its round's field on the value model's ruler (round I 2–3u, II 3–5u, III 5–9u). Flag, on scaled u: above the band in any round, below it in the space's own ring's round, or worth below 0. "vs choice" = against the bot's own pick (≤ 0 means the bot was right to skip it). Blocked = a rival took it first.
Normal's own pick is worth 1.8 followers in round 1, 4.9 followers in round 2, 6.5 followers in round 3 over a null minion (2.1u / 5.5u / 9.2u).

### Both instruments agree (9)
| space | ring | round | Normal scaled u [90%] n | Hard-20 scaled u [90%] n | band | reads |
|---|---|---|---|---|---|---|
| Clock In (purple) | 1 | 3 | 13.5 [10.7–16.8] 94 | 26.7 [14.8–36.3] 46 | 5–9 | strong |
| Cheap Seats (trading) | 1 | 1 | -8.9 [-13.8–-3.9] 85 | -15.3 [-22.8–-9.1] 22 | 2–3 | weak |
| Crunch Time (purple) | 3 | 3 | 20.0 [15.8–24.1] 88 | 27.4 [21.0–33.4] 46 | 5–9 | strong |
| Toast (silver) | 1 | 3 | 19.2 [15.6–22.9] 109 | 15.1 [9.5–21.4] 45 | 5–9 | strong |
| Branch Out (yellow) | 2 | 2 | -0.6 [-2.5–1.5] 102 | -3.8 [-7.1–-0.8] 66 | 3–5 | weak |
| Hand-pick (red) | 3 | 3 | 15.6 [11.0–19.7] 84 | 19.0 [14.3–23.3] 69 | 5–9 | strong |
| Poach (thieves) | 3 | 3 | 14.0 [11.0–16.9] 79 | 12.5 [9.3–15.7] 59 | 5–9 | strong |
| Plan Ahead (purple) | 2 | 3 | 19.3 [15.1–23.7] 66 | 16.3 [9.3–24.0] 35 | 5–9 | strong |
| Lie Low (thieves) | 1 | 3 | 12.6 [9.9–16.1] 79 | 15.3 [11.7–20.3] 92 | 5–9 | strong |

### Normal flags, Hard-20 confidently doesn't (likely a Normal-bot artifact) (3)
All In r3 (Normal 14.1 [9.4–19.0], Hard-20 5.8 [0.5–11.3] scaled u); Dividend r3 (Normal 15.5 [12.2–19.5], Hard-20 7.4 [2.5–13.0] scaled u); Help Yourself r2 (Normal 8.0 [6.1–10.2], Hard-20 4.3 [1.1–7.8] scaled u).

Normal flags, Hard-20 too thin or unsure to say: Reprise r2 weak (-0.8u; Hard-20 0.2u, n 28); Kickback r1 strong (11.0u; Hard-20 4.5u, n 39); Overtime r3 strong (15.2u; Hard-20 11.2u, n 48); Flood r3 strong (16.6u; Hard-20 12.3u, n 14); Bloom r3 strong (14.0u; Hard-20 18.6u, n 19); Open House r2 strong (9.2u; Hard-20 7.7u, n 57); Rising Tide r3 strong (13.8u; Hard-20 10.0u, n 58); Plan Ahead r2 strong (9.1u; Hard-20 7.5u, n 40).

Power: for the 134 space-rounds Normal reads in band, the smallest miss this run could have caught is 4.7 scaled u at the median, 7.8 at the 90th percentile (column "detectable").

<details><summary>Every space and round (Normal; Hard-20 where measured)</summary>

| space | sphere | ring | round | worth (followers) [90%] | raw u | scaled u [90%] | detectable | vs choice | blocked | n | Hard-20 scaled u [90%] |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Kickback | gold | 1 | 1 | 4.7 [2.9–6.5] | 5.3 | 11.0 [6.9–15.2] | ±6.3 | 2.9 | 9.3% | 146 | 4.5 [-4.0–12.8] |
| Sob Story | trading | 1 | 1 | 3.6 [0.6–6.4] | 4.0 | 8.4 [1.4–14.8] | ±10.1 | 1.8 | 8.2% | 78 | – |
| Help Yourself | thieves | 1 | 1 | 3.1 [0.3–5.4] | 3.5 | 7.3 [0.8–12.7] | ±9.0 | 1.3 | 1.0% | 103 | -11.5 [-44.6–20.5] |
| New Faces | market | 1 | 1 | 3.0 [0.4–6.0] | 3.3 | 7.0 [0.9–13.9] | ±9.8 | 1.1 | 0.0% | 97 | -3.7 [-11.6–6.9] |
| Goody Bags | silver | 1 | 1 | 2.9 [0.8–5.3] | 3.3 | 6.8 [1.9–12.4] | ±7.9 | 1.1 | 28.6% | 90 | 2.0 [-11.7–6.0] |
| Toast | silver | 1 | 1 | 2.5 [0.3–4.5] | 2.8 | 5.8 [0.8–10.5] | ±7.3 | 0.6 | 0.0% | 139 | -8.2 [-17.2–15.0] |
| Your Call | trading | 1 | 1 | 2.3 [-0.4–4.9] | 2.6 | 5.4 [-1.0–11.5] | ±9.4 | 0.5 | 0.0% | 77 | -19.1 [-43.9–10.1] |
| Name Drop | market | 1 | 1 | 2.3 [-0.4–4.7] | 2.5 | 5.3 [-1.0–10.8] | ±8.9 | 0.4 | 1.1% | 87 | -4.3 [-13.9–3.2] |
| Intro Offer | gold | 1 | 1 | 2.2 [0.4–4.1] | 2.5 | 5.2 [1.0–9.5] | ±6.4 | 0.4 | 0.0% | 130 | 3.0 [-12.7–9.0] |
| Roll Call | purple | 1 | 1 | 2.0 [0.1–4.0] | 2.3 | 4.8 [0.2–9.3] | ±6.9 | 0.2 | 0.0% | 96 | – |
| Lie Low | thieves | 1 | 1 | 1.7 [-0.4–3.6] | 1.9 | 3.9 [-1.0–8.3] | ±7.1 | -0.2 | 0.0% | 87 | 15.4 [-10.8–23.2] |
| Redistribute | thieves | 1 | 1 | 1.5 [-0.5–3.1] | 1.7 | 3.5 [-1.1–7.3] | ±6.3 | -0.4 | 0.0% | 103 | 7.7 [-14.4–22.1] |
| Good Deed | silver | 1 | 1 | 1.5 [-0.7–3.5] | 1.6 | 3.4 [-1.7–8.2] | ±7.5 | -0.4 | 4.0% | 120 | -3.6 [-13.3–0.4] |
| Snap Up | market | 1 | 1 | 1.4 [-1.2–3.8] | 1.6 | 3.4 [-2.9–8.7] | ±8.8 | -0.4 | 4.5% | 105 | 7.7 [1.5–14.9] |
| Crescendo | echo | 1 | 1 | 1.4 [-0.7–3.4] | 1.6 | 3.3 [-1.6–7.9] | ±7.2 | -0.4 | 0.0% | 96 | – |
| Current | blue | 1 | 1 | 1.2 [-0.7–2.9] | 1.4 | 2.8 [-1.6–6.8] | ±6.3 | -0.6 | 1.0% | 97 | – |
| Graft | green | 1 | 1 | 1.1 [-0.8–3.1] | 1.2 | 2.5 [-1.9–7.2] | ±6.8 | -0.8 | 4.2% | 114 | – |
| Tide | blue | 1 | 1 | 1.0 [-0.9–2.4] | 1.1 | 2.2 [-2.2–5.5] | ±5.8 | -0.9 | 3.2% | 121 | – |
| Golden Years | gold | 1 | 1 | 0.9 [-1.5–3.4] | 1.1 | 2.2 [-3.6–7.8] | ±8.6 | -0.9 | 0.0% | 120 | -8.8 [-21.7–-1.5] |
| Sprout | green | 1 | 1 | 0.9 [-1.1–2.7] | 1.0 | 2.0 [-2.5–6.3] | ±6.6 | -1.0 | 2.3% | 127 | – |
| Shoal | blue | 1 | 1 | 0.8 [-0.9–3.0] | 0.9 | 1.9 [-2.1–6.9] | ±6.8 | -1.0 | 14.4% | 77 | – |
| Even Swap | red | 1 | 1 | 0.7 [-1.4–3.2] | 0.8 | 1.6 [-3.3–7.4] | ±8.1 | -1.2 | 0.0% | 140 | 0.1 [-8.6–9.0] |
| Catch Up | purple | 1 | 1 | 0.4 [-1.8–2.6] | 0.4 | 0.9 [-4.3–6.1] | ±7.8 | -1.5 | 0.0% | 91 | 22.5 [-13.2–32.4] |
| Bandwagon | red | 1 | 1 | 0.3 [-1.6–1.7] | 0.3 | 0.6 [-3.7–4.0] | ±5.8 | -1.6 | 0.0% | 119 | -0.9 [-12.0–4.9] |
| Open Door | red | 1 | 1 | 0.1 [-1.9–2.5] | 0.1 | 0.3 [-4.4–5.9] | ±7.8 | -1.7 | 8.0% | 104 | 4.6 [-11.1–12.1] |
| Harvest | yellow | 1 | 1 | -0.2 [-2.0–1.9] | -0.2 | -0.4 [-4.7–4.4] | ±6.9 | -2.0 | 0.0% | 103 | 36.2 [-10.4–61.6] |
| Root | green | 1 | 1 | -0.4 [-2.3–1.2] | -0.5 | -1.0 [-5.3–2.8] | ±6.1 | -2.3 | 9.1% | 100 | 0.8 [-13.0–4.8] |
| Clock In | purple | 1 | 1 | -0.6 [-2.5–1.1] | -0.7 | -1.4 [-5.9–2.6] | ±6.4 | -2.5 | 9.6% | 103 | 5.5 [-13.2–10.2] |
| Echo | echo | 1 | 1 | -0.8 [-2.8–1.4] | -0.9 | -2.0 [-6.6–3.3] | ±7.5 | -2.7 | 1.1% | 89 | – |
| Top Up | yellow | 1 | 1 | -1.3 [-3.9–1.4] | -1.5 | -3.1 [-9.1–3.2] | ±9.3 | -3.2 | 34.2% | 50 | -16.0 [-27.7–-2.9] |
| Trade Seeds | yellow | 1 | 1 | -1.5 [-3.6–1.0] | -1.7 | -3.5 [-8.5–2.2] | ±8.1 | -3.3 | 0.0% | 83 | -25.6 [-36.3–-2.5] |
| Hum | echo | 1 | 1 | -1.5 [-4.0–1.1] | -1.7 | -3.6 [-9.3–2.6] | ±9.0 | -3.4 | 12.1% | 94 | -18.8 [-25.4–-1.5] |
| Cheap Seats | trading | 1 | 1 | -3.8 [-5.9–-1.7] | -4.3 | -8.9 [-13.8–-3.9] | ±7.4 | -5.7 | 0.0% | 85 | -15.3 [-22.8–-9.1] |
| Open House | red | 2 | 2 | 7.3 [5.4–9.5] | 8.0 | 9.2 [6.8–12.1] | ±4.0 | 2.3 | 6.8% | 96 | 7.7 [2.3–13.6] |
| Plan Ahead | purple | 2 | 2 | 7.2 [4.4–10.2] | 8.0 | 9.1 [5.6–12.9] | ±5.6 | 2.3 | 26.8% | 60 | 7.5 [1.5–13.0] |
| Help Yourself | thieves | 1 | 2 | 6.3 [4.8–8.0] | 6.9 | 8.0 [6.1–10.2] | ±3.0 | 1.3 | 0.9% | 112 | 4.3 [1.1–7.8] |
| Harbor | blue | 2 | 2 | 5.9 [3.8–8.4] | 6.5 | 7.5 [4.8–10.7] | ±4.4 | 1.0 | 18.4% | 62 | – |
| Toast | silver | 1 | 2 | 5.8 [3.9–7.6] | 6.5 | 7.4 [4.9–9.6] | ±3.6 | 0.9 | 17.7% | 121 | – |
| Clock In | purple | 1 | 2 | 5.5 [3.8–7.5] | 6.0 | 6.9 [4.8–9.4] | ±3.5 | 0.5 | 1.1% | 86 | 4.6 [-1.3–5.6] |
| Crescendo | echo | 1 | 2 | 5.3 [3.1–7.8] | 5.9 | 6.8 [3.9–9.8] | ±4.4 | 0.4 | 4.2% | 68 | – |
| New Faces | market | 1 | 2 | 4.9 [2.6–7.3] | 5.5 | 6.2 [3.3–9.2] | ±4.5 | -0.0 | 0.0% | 84 | – |
| Golden Years | gold | 1 | 2 | 4.8 [3.1–6.4] | 5.2 | 6.0 [3.9–8.0] | ±3.1 | -0.2 | 4.3% | 134 | – |
| Shake Down | thieves | 2 | 2 | 4.5 [3.2–6.1] | 5.0 | 5.7 [4.1–7.7] | ±2.8 | -0.4 | 13.1% | 86 | -4.5 [-8.9–4.7] |
| Your Call | trading | 1 | 2 | 4.4 [2.3–6.5] | 4.9 | 5.6 [2.9–8.2] | ±4.0 | -0.5 | 2.8% | 69 | 10.6 [-1.0–13.7] |
| Rising Tide | silver | 2 | 2 | 4.3 [2.7–6.3] | 4.7 | 5.4 [3.4–7.9] | ±3.4 | -0.6 | 0.0% | 117 | – |
| Good Deed | silver | 1 | 2 | 4.1 [2.5–6.0] | 4.6 | 5.2 [3.2–7.6] | ±3.3 | -0.8 | 0.8% | 117 | – |
| Open Door | red | 1 | 2 | 4.0 [2.9–5.8] | 4.5 | 5.1 [3.7–7.4] | ±2.8 | -0.9 | 0.0% | 141 | – |
| Show Off | market | 2 | 2 | 4.0 [1.4–6.5] | 4.4 | 5.1 [1.7–8.2] | ±4.9 | -0.9 | 0.0% | 61 | 10.1 [0.1–20.7] |
| Collect Debts | gold | 2 | 2 | 4.0 [1.7–5.8] | 4.4 | 5.1 [2.2–7.3] | ±3.9 | -0.9 | 5.5% | 120 | – |
| Goody Bags | silver | 1 | 2 | 4.0 [2.3–6.0] | 4.4 | 5.0 [2.9–7.6] | ±3.5 | -1.0 | 0.0% | 100 | – |
| Swell | blue | 2 | 2 | 3.9 [2.5–5.4] | 4.3 | 4.9 [3.1–6.8] | ±2.8 | -1.0 | 7.1% | 91 | – |
| Sob Story | trading | 1 | 2 | 3.9 [2.0–6.6] | 4.3 | 4.9 [2.5–8.4] | ±4.4 | -1.1 | 8.3% | 88 | 0.7 [-2.1–4.3] |
| Root | green | 1 | 2 | 3.5 [1.9–4.8] | 3.8 | 4.4 [2.4–6.1] | ±2.8 | -1.5 | 0.8% | 127 | – |
| Dividend | trading | 2 | 2 | 3.4 [1.6–5.2] | 3.8 | 4.3 [2.0–6.6] | ±3.5 | -1.5 | 4.2% | 92 | 11.4 [-0.6–13.1] |
| Hum | echo | 1 | 2 | 3.3 [1.4–4.8] | 3.7 | 4.2 [1.7–6.0] | ±3.3 | -1.6 | 0.0% | 123 | – |
| Shoal | blue | 1 | 2 | 3.3 [2.0–4.7] | 3.7 | 4.2 [2.6–5.9] | ±2.5 | -1.6 | 0.9% | 106 | 12.9 [-1.3–16.4] |
| Encore | echo | 2 | 2 | 3.3 [1.5–5.6] | 3.6 | 4.1 [1.9–7.1] | ±4.0 | -1.7 | 0.0% | 100 | 18.5 [-1.1–24.6] |
| Sweet Talk | silver | 2 | 2 | 3.2 [1.2–4.9] | 3.5 | 4.0 [1.5–6.2] | ±3.6 | -1.7 | 0.8% | 126 | – |
| Sell High | trading | 2 | 2 | 3.2 [1.3–5.6] | 3.5 | 4.0 [1.7–7.1] | ±4.1 | -1.8 | 6.1% | 77 | -3.0 [-6.9–4.7] |
| Half Price | market | 2 | 2 | 3.2 [1.0–6.0] | 3.5 | 4.0 [1.2–7.6] | ±4.8 | -1.8 | 8.7% | 94 | – |
| Crime Wave | thieves | 2 | 2 | 3.2 [1.7–4.8] | 3.5 | 4.0 [2.1–6.1] | ±3.0 | -1.8 | 0.0% | 113 | 0.7 [-1.3–4.3] |
| Intro Offer | gold | 1 | 2 | 3.1 [1.0–4.9] | 3.4 | 3.9 [1.3–6.2] | ±3.7 | -1.8 | 0.0% | 124 | 26.9 [-1.0–33.6] |
| Potluck | yellow | 2 | 2 | 3.0 [0.8–5.1] | 3.3 | 3.8 [1.1–6.5] | ±4.1 | -1.9 | 0.0% | 71 | – |
| Lie Low | thieves | 1 | 2 | 3.0 [1.5–4.6] | 3.3 | 3.7 [1.9–5.8] | ±3.0 | -2.0 | 0.0% | 88 | -0.7 [-3.3–3.1] |
| Orchard | green | 2 | 2 | 2.9 [1.4–4.9] | 3.2 | 3.7 [1.8–6.2] | ±3.3 | -2.0 | 7.8% | 95 | – |
| Grove | green | 2 | 2 | 2.9 [1.2–4.4] | 3.2 | 3.6 [1.5–5.5] | ±3.0 | -2.1 | 12.4% | 99 | -1.4 [-3.0–4.7] |
| Catch Up | purple | 1 | 2 | 2.8 [1.3–4.6] | 3.1 | 3.6 [1.6–5.8] | ±3.2 | -2.1 | 0.0% | 88 | 10.4 [-1.3–13.3] |
| Graft | green | 1 | 2 | 2.8 [1.5–4.2] | 3.1 | 3.6 [1.9–5.3] | ±2.6 | -2.1 | 0.0% | 123 | 1.2 [-0.9–3.7] |
| Current | blue | 1 | 2 | 2.7 [0.7–4.4] | 3.0 | 3.4 [0.9–5.6] | ±3.6 | -2.2 | 0.0% | 83 | -0.7 [-3.5–4.7] |
| Sprout | green | 1 | 2 | 2.6 [1.0–4.1] | 2.9 | 3.3 [1.2–5.2] | ±3.0 | -2.3 | 0.0% | 151 | -0.1 [-1.8–4.4] |
| Redistribute | thieves | 1 | 2 | 2.6 [1.2–4.1] | 2.9 | 3.3 [1.6–5.2] | ±2.8 | -2.3 | 0.0% | 89 | – |
| Kickback | gold | 1 | 2 | 2.4 [0.8–3.8] | 2.6 | 3.0 [1.0–4.9] | ±2.9 | -2.6 | 0.0% | 185 | 13.0 [-1.0–15.0] |
| Tithe | gold | 2 | 2 | 2.0 [-0.3–4.3] | 2.3 | 2.6 [-0.4–5.5] | ±4.4 | -2.9 | 0.0% | 121 | 2.0 [-1.3–4.3] |
| Cheap Seats | trading | 1 | 2 | 2.0 [-0.2–4.1] | 2.2 | 2.5 [-0.3–5.2] | ±4.1 | -3.0 | 0.0% | 76 | 0.5 [-1.4–4.3] |
| Snap Up | market | 1 | 2 | 1.7 [0.0–3.3] | 1.9 | 2.2 [0.0–4.1] | ±3.1 | -3.2 | 0.0% | 120 | – |
| Tide | blue | 1 | 2 | 1.6 [0.4–2.7] | 1.8 | 2.1 [0.5–3.4] | ±2.1 | -3.3 | 0.0% | 135 | – |
| Top Up | yellow | 1 | 2 | 1.6 [0.1–3.1] | 1.7 | 2.0 [0.1–4.0] | ±2.9 | -3.4 | 2.2% | 87 | – |
| Harvest | yellow | 1 | 2 | 1.5 [0.0–3.2] | 1.6 | 1.9 [0.0–4.0] | ±3.1 | -3.5 | 2.7% | 108 | – |
| Swap Sides | red | 2 | 2 | 1.2 [-0.6–3.1] | 1.3 | 1.5 [-0.7–3.9] | ±3.5 | -3.7 | 4.2% | 91 | – |
| Overtime | purple | 2 | 2 | 1.2 [-0.6–2.9] | 1.3 | 1.5 [-0.8–3.6] | ±3.3 | -3.7 | 0.0% | 95 | -0.2 [-2.4–4.8] |
| Roll Call | purple | 1 | 2 | 1.1 [-1.1–2.8] | 1.2 | 1.4 [-1.3–3.5] | ±3.7 | -3.9 | 0.0% | 88 | – |
| Bandwagon | red | 1 | 2 | 0.1 [-1.6–2.0] | 0.1 | 0.1 [-2.0–2.5] | ±3.4 | -4.8 | 0.0% | 115 | – |
| Echo | echo | 1 | 2 | -0.1 [-3.1–2.4] | -0.1 | -0.1 [-3.9–3.0] | ±5.2 | -5.0 | 0.0% | 72 | – |
| Trade Seeds | yellow | 1 | 2 | -0.1 [-2.1–2.1] | -0.2 | -0.2 [-2.6–2.7] | ±4.0 | -5.1 | 0.0% | 81 | -0.5 [-3.6–2.6] |
| Even Swap | red | 1 | 2 | -0.4 [-1.7–1.1] | -0.4 | -0.4 [-2.2–1.3] | ±2.6 | -5.3 | 4.0% | 121 | -1.7 [-5.3–1.7] |
| Branch Out | yellow | 2 | 2 | -0.5 [-2.0–1.2] | -0.5 | -0.6 [-2.5–1.5] | ±3.1 | -5.4 | 0.0% | 102 | -3.8 [-7.1–-0.8] |
| Reprise | echo | 2 | 2 | -0.6 [-2.8–1.8] | -0.7 | -0.8 [-3.5–2.3] | ±4.4 | -5.6 | 0.0% | 76 | 0.2 [-5.9–4.6] |
| Name Drop | market | 1 | 2 | -0.7 [-2.5–1.1] | -0.7 | -0.8 [-3.1–1.4] | ±3.4 | -5.6 | 0.9% | 105 | 4.5 [0.7–8.2] |
| Crunch Time | purple | 3 | 3 | 8.1 [6.4–9.8] | 11.4 | 20.0 [15.8–24.1] | ±6.2 | 1.6 | 1.1% | 88 | 27.4 [21.0–33.4] |
| Plan Ahead | purple | 2 | 3 | 7.8 [6.1–9.6] | 11.0 | 19.3 [15.1–23.7] | ±6.5 | 1.3 | 22.4% | 66 | 16.3 [9.3–24.0] |
| Toast | silver | 1 | 3 | 7.8 [6.3–9.3] | 10.9 | 19.2 [15.6–22.9] | ±5.5 | 1.3 | 9.2% | 109 | 15.1 [9.5–21.4] |
| Flood | blue | 3 | 3 | 6.7 [5.4–8.0] | 9.4 | 16.6 [13.2–19.6] | ±4.9 | 0.2 | 23.3% | 69 | 12.3 [3.4–21.4] |
| Hand-pick | red | 3 | 3 | 6.4 [4.5–8.0] | 8.9 | 15.6 [11.0–19.7] | ±6.6 | -0.2 | 12.5% | 84 | 19.0 [14.3–23.3] |
| Dividend | trading | 2 | 3 | 6.3 [5.0–7.9] | 8.8 | 15.5 [12.2–19.5] | ±5.5 | -0.3 | 4.3% | 66 | 7.4 [2.5–13.0] |
| Overtime | purple | 2 | 3 | 6.2 [4.8–7.6] | 8.7 | 15.2 [11.7–18.7] | ±5.3 | -0.4 | 0.0% | 79 | 11.2 [2.3–18.6] |
| All In | trading | 3 | 3 | 5.7 [3.8–7.7] | 8.0 | 14.1 [9.4–19.0] | ±7.2 | -0.8 | 0.0% | 74 | 5.8 [0.5–11.3] |
| Bloom | green | 3 | 3 | 5.7 [4.2–6.9] | 8.0 | 14.0 [10.3–17.1] | ±5.1 | -0.9 | 16.1% | 104 | 18.6 [7.2–29.1] |
| Poach | thieves | 3 | 3 | 5.7 [4.5–6.9] | 8.0 | 14.0 [11.0–16.9] | ±4.5 | -0.9 | 3.7% | 79 | 12.5 [9.3–15.7] |
| Rising Tide | silver | 2 | 3 | 5.6 [4.2–7.1] | 7.9 | 13.8 [10.3–17.5] | ±5.5 | -0.9 | 8.8% | 104 | 10.0 [2.3–17.9] |
| Clock In | purple | 1 | 3 | 5.5 [4.4–6.8] | 7.7 | 13.5 [10.7–16.8] | ±4.6 | -1.1 | 3.1% | 94 | 26.7 [14.8–36.3] |
| Shake Down | thieves | 2 | 3 | 5.4 [3.6–6.9] | 7.5 | 13.2 [8.8–17.0] | ±6.2 | -1.2 | 0.0% | 75 | – |
| Lie Low | thieves | 1 | 3 | 5.1 [4.0–6.5] | 7.2 | 12.6 [9.9–16.1] | ±4.7 | -1.4 | 0.0% | 79 | 15.3 [11.7–20.3] |
| Help Yourself | thieves | 1 | 3 | 5.0 [3.3–6.5] | 7.0 | 12.3 [8.1–15.9] | ±5.9 | -1.5 | 2.2% | 87 | – |
| Golden Years | gold | 1 | 3 | 4.6 [3.2–5.9] | 6.5 | 11.3 [7.9–14.5] | ±4.9 | -1.9 | 2.2% | 135 | – |
| Your Call | trading | 1 | 3 | 4.5 [3.6–5.6] | 6.4 | 11.2 [8.9–13.8] | ±3.7 | -2.0 | 1.1% | 88 | – |
| Open House | red | 2 | 3 | 4.5 [3.1–6.0] | 6.3 | 11.1 [7.7–14.8] | ±5.4 | -2.0 | 0.0% | 98 | – |
| Crescendo | echo | 1 | 3 | 4.5 [2.8–6.3] | 6.3 | 11.0 [7.0–15.5] | ±6.5 | -2.1 | 5.9% | 95 | – |
| Grove | green | 2 | 3 | 4.4 [3.3–5.6] | 6.2 | 10.9 [8.0–13.8] | ±4.4 | -2.1 | 0.0% | 131 | – |
| Collect Debts | gold | 2 | 3 | 4.4 [3.2–5.7] | 6.1 | 10.8 [8.0–14.0] | ±4.6 | -2.2 | 0.0% | 158 | – |
| Show Off | market | 2 | 3 | 4.2 [2.5–6.0] | 5.9 | 10.3 [6.2–14.8] | ±6.5 | -2.3 | 0.0% | 70 | – |
| Sob Story | trading | 1 | 3 | 3.7 [2.2–5.1] | 5.3 | 9.2 [5.5–12.5] | ±5.2 | -2.8 | 0.0% | 91 | – |
| Swell | blue | 2 | 3 | 3.7 [2.2–5.1] | 5.1 | 9.0 [5.4–12.5] | ±5.3 | -2.9 | 0.0% | 84 | – |
| Good Deed | silver | 1 | 3 | 3.3 [1.8–4.5] | 4.7 | 8.2 [4.5–11.0] | ±4.9 | -3.2 | 0.0% | 117 | – |
| Harbor | blue | 2 | 3 | 3.3 [2.0–4.5] | 4.7 | 8.2 [4.9–11.0] | ±4.6 | -3.2 | 0.0% | 82 | – |
| Orchard | green | 2 | 3 | 3.3 [2.2–4.3] | 4.6 | 8.0 [5.3–10.6] | ±4.0 | -3.3 | 0.0% | 95 | – |
| Tithe | gold | 2 | 3 | 3.2 [1.9–4.4] | 4.5 | 7.9 [4.7–10.7] | ±4.5 | -3.3 | 0.0% | 117 | – |
| Goody Bags | silver | 1 | 3 | 3.0 [1.7–4.6] | 4.3 | 7.5 [4.2–11.4] | ±5.4 | -3.5 | 0.9% | 112 | – |
| Double Down | gold | 3 | 3 | 3.0 [1.7–4.0] | 4.2 | 7.4 [4.2–9.9] | ±4.3 | -3.5 | 2.4% | 123 | – |
| New Faces | market | 1 | 3 | 3.0 [1.9–3.9] | 4.2 | 7.3 [4.6–9.6] | ±3.8 | -3.6 | 0.0% | 100 | – |
| Redistribute | thieves | 1 | 3 | 2.9 [1.4–4.4] | 4.1 | 7.2 [3.3–10.7] | ±5.6 | -3.6 | 0.0% | 84 | – |
| Sprout | green | 1 | 3 | 2.8 [1.9–3.7] | 4.0 | 7.0 [4.8–9.2] | ±3.3 | -3.7 | 0.0% | 156 | – |
| Crime Wave | thieves | 2 | 3 | 2.7 [1.5–3.9] | 3.8 | 6.6 [3.7–9.7] | ±4.5 | -3.9 | 0.0% | 97 | – |
| Reprise | echo | 2 | 3 | 2.7 [1.0–4.5] | 3.7 | 6.6 [2.4–11.1] | ±6.5 | -3.9 | 0.0% | 70 | – |
| Current | blue | 1 | 3 | 2.7 [1.4–3.7] | 3.7 | 6.6 [3.5–9.1] | ±4.2 | -3.9 | 0.0% | 98 | – |
| Open Door | red | 1 | 3 | 2.6 [1.3–3.9] | 3.6 | 6.4 [3.2–9.7] | ±4.9 | -3.9 | 0.0% | 94 | – |
| Sweet Talk | silver | 2 | 3 | 2.6 [1.5–3.8] | 3.6 | 6.4 [3.7–9.3] | ±4.2 | -3.9 | 0.8% | 125 | – |
| Hum | echo | 1 | 3 | 2.5 [0.7–4.5] | 3.5 | 6.2 [1.8–11.1] | ±7.0 | -4.0 | 0.0% | 98 | – |
| Encore | echo | 2 | 3 | 2.4 [0.9–4.1] | 3.4 | 6.0 [2.2–10.1] | ±6.0 | -4.1 | 0.0% | 98 | – |
| Graft | green | 1 | 3 | 2.4 [1.4–3.6] | 3.4 | 6.0 [3.5–8.8] | ±4.0 | -4.1 | 0.0% | 123 | – |
| Snap Up | market | 1 | 3 | 2.4 [1.3–3.9] | 3.4 | 6.0 [3.2–9.5] | ±4.7 | -4.1 | 0.0% | 133 | – |
| Harvest | yellow | 1 | 3 | 2.4 [1.3–3.8] | 3.4 | 5.9 [3.2–9.3] | ±4.6 | -4.1 | 0.9% | 106 | – |
| Intro Offer | gold | 1 | 3 | 2.4 [1.1–4.1] | 3.4 | 5.9 [2.7–10.1] | ±5.6 | -4.1 | 0.0% | 122 | – |
| Catch Up | purple | 1 | 3 | 2.3 [1.0–3.8] | 3.3 | 5.8 [2.5–9.3] | ±5.1 | -4.2 | 0.0% | 105 | – |
| Even Swap | red | 1 | 3 | 2.3 [1.4–3.5] | 3.3 | 5.7 [3.3–8.7] | ±4.0 | -4.2 | 0.0% | 115 | – |
| Root | green | 1 | 3 | 2.2 [1.0–3.6] | 3.1 | 5.4 [2.5–8.8] | ±4.7 | -4.3 | 0.0% | 93 | – |
| Echo | echo | 1 | 3 | 2.0 [0.3–3.6] | 2.9 | 5.0 [0.7–8.9] | ±6.2 | -4.5 | 0.0% | 82 | – |
| Name Drop | market | 1 | 3 | 2.0 [0.8–3.4] | 2.8 | 5.0 [2.0–8.5] | ±4.9 | -4.5 | 0.0% | 92 | – |
| Sell High | trading | 2 | 3 | 2.0 [0.4–3.6] | 2.8 | 4.9 [1.1–8.8] | ±5.8 | -4.5 | 0.0% | 93 | – |
| Hold Court | silver | 3 | 3 | 2.0 [0.8–3.3] | 2.8 | 4.9 [2.0–8.2] | ±4.7 | -4.5 | 0.0% | 112 | – |
| Bandwagon | red | 1 | 3 | 1.9 [0.9–3.0] | 2.6 | 4.6 [2.1–7.4] | ±4.0 | -4.7 | 0.0% | 132 | – |
| Tide | blue | 1 | 3 | 1.8 [0.6–3.1] | 2.6 | 4.5 [1.4–7.7] | ±4.8 | -4.7 | 0.0% | 115 | – |
| Shoal | blue | 1 | 3 | 1.8 [0.5–3.2] | 2.6 | 4.5 [1.2–7.8] | ±5.0 | -4.7 | 0.0% | 81 | – |
| Greatest Hits | echo | 3 | 3 | 1.8 [0.2–3.8] | 2.5 | 4.3 [0.4–9.3] | ±6.7 | -4.8 | 1.2% | 80 | – |
| Potluck | yellow | 2 | 3 | 1.3 [-0.1–2.7] | 1.9 | 3.3 [-0.2–6.6] | ±5.1 | -5.2 | 0.0% | 68 | – |
| Spree | market | 3 | 3 | 1.3 [0.0–3.1] | 1.9 | 3.3 [0.0–7.6] | ±5.7 | -5.2 | 0.0% | 71 | – |
| Bumper Crop | yellow | 3 | 3 | 1.3 [-0.6–3.1] | 1.8 | 3.2 [-1.4–7.6] | ±6.8 | -5.2 | 10.0% | 72 | – |
| Half Price | market | 2 | 3 | 1.2 [-0.0–2.5] | 1.8 | 3.1 [-0.0–6.1] | ±4.6 | -5.3 | 0.0% | 118 | – |
| Kickback | gold | 1 | 3 | 0.9 [-0.2–2.1] | 1.3 | 2.3 [-0.4–5.1] | ±4.2 | -5.6 | 0.0% | 169 | – |
| Roll Call | purple | 1 | 3 | 0.7 [-1.2–2.6] | 1.0 | 1.8 [-2.9–6.5] | ±7.1 | -5.8 | 0.0% | 59 | – |
| Branch Out | yellow | 2 | 3 | 0.6 [-1.0–1.9] | 0.8 | 1.4 [-2.5–4.6] | ±5.3 | -6.0 | 0.0% | 86 | – |
| Top Up | yellow | 1 | 3 | 0.4 [-1.1–2.3] | 0.5 | 0.9 [-2.6–5.5] | ±6.2 | -6.2 | 1.3% | 78 | – |
| Cheap Seats | trading | 1 | 3 | 0.2 [-1.4–2.2] | 0.3 | 0.6 [-3.4–5.3] | ±6.6 | -6.3 | 0.0% | 77 | – |
| Swap Sides | red | 2 | 3 | 0.1 [-1.3–1.4] | 0.1 | 0.2 [-3.2–3.4] | ±5.0 | -6.5 | 0.0% | 101 | – |
| Trade Seeds | yellow | 1 | 3 | -0.7 [-2.2–0.8] | -1.0 | -1.7 [-5.4–2.0] | ±5.5 | -7.2 | 0.0% | 80 | 2.8 [-3.7–9.4] |

</details>

## 4. Archetypes
One scripted seat (rotating) against 3 bots, Classic table. Target band 15–35% (parity 25%). Scripts are built on Normal's valuation: the buyer never recruits; a specialist adds +3 to its sphere's spaces and +2 to its members; the chaser adds twice the round-end contest standing a move leaves it; the hoarder recruits whenever any member is affordable.

| archetype | vs | n | win [90%] | followers (rivals) | members (rivals) | |
|---|---|---|---|---|---|---|
| pure follower buyer | 3 Normal | 240 | 17.1% [13.5%–21.4%] | 53.4 (53.2) | 0.0 (8.9) |  |
| pure follower buyer | 3 Hard-20 | 64 | 3.9% [1.4%–10.1%] | 49.3 (54.5) | 0.0 (8.2) | below band |
| member hoarder (recruits whenever it can) | 3 Normal | 240 | 6.9% [4.6%–10.1%] | 42.9 (53.3) | 13.3 (8.1) | below band |
| member hoarder (recruits whenever it can) | 3 Hard-20 | 64 | 4.7% [1.9%–11.2%] | 39.3 (56.2) | 13.0 (7.4) | below band |
| contest chaser (maximizes round-end leads) | 3 Normal | 240 | 11.0% [8.1%–14.8%] | 49.9 (54.5) | 8.3 (8.5) | below band |
| contest chaser (maximizes round-end leads) | 3 Hard-20 | 64 | 12.5% [7.2%–20.9%] | 47.0 (56.7) | 9.6 (7.5) | edge |
| Gold (gold) specialist | 3 Normal | 240 | 27.7% [23.2%–32.7%] | 53.9 (54.3) | 9.2 (8.4) |  |
| Gold (gold) specialist | 3 Hard-20 | 64 | 25.0% [17.2%–34.8%] | 54.7 (55.9) | 9.6 (7.3) |  |
| Red (red) specialist | 3 Normal | 240 | 26.9% [22.4%–31.8%] | 53.9 (53.9) | 10.2 (7.8) |  |
| Red (red) specialist | 3 Hard-20 | 64 | 23.4% [15.9%–33.1%] | 51.1 (56.3) | 10.7 (6.8) |  |
| Blue (market) specialist | 3 Normal | 240 | 17.4% [13.8%–21.8%] | 52.4 (55.5) | 9.9 (8.3) |  |
| Blue (market) specialist | 3 Hard-20 | 64 | 21.1% [14.0%–30.6%] | 51.3 (56.1) | 10.7 (7.3) |  |
| Green (echo) specialist | 3 Normal | 240 | 16.7% [13.1%–21.0%] | 52.2 (54.7) | 9.0 (8.5) |  |
| Green (echo) specialist | 3 Hard-20 | 64 | 11.7% [6.6%–19.9%] | 48.0 (56.9) | 9.1 (7.7) | edge |

## 5. Fairness
Base games (no probes), random tables. Parity is 25%.
- Normal tables, 440 games. By seat: P1 23.4% [20.3%–26.9%], P2 28.4% [25.0%–32.1%], P3 22.7% [19.6%–26.2%], P4 25.5% [22.2%–29.0%]. By round-I pick order: 1st 25.2% [22.0%–28.8%], 2nd 27.7% [24.4%–31.4%], 3rd 27.5% [24.1%–31.1%], 4th 19.5% [16.6%–22.8%]. Round-III first pick (fewest followers) wins 14.8% [12.2%–17.8%]; last of the first pass 50.9% [47.0%–54.8%].
- Hard-20 tables, 68 games. By seat: P1 32.4% [23.9%–42.2%], P2 27.9% [20.0%–37.6%], P3 17.6% [11.3%–26.4%], P4 22.1% [14.9%–31.3%]. By round-I pick order: 1st 19.1% [12.5%–28.1%], 2nd 23.5% [16.2%–32.9%], 3rd 32.4% [23.9%–42.2%], 4th 25.0% [17.4%–34.5%]. Round-III first pick (fewest followers) wins 19.1% [12.5%–28.1%]; last of the first pass 51.5% [41.6%–61.2%].

## 6. Health
| | Normal (440 games) | Hard-20 (68 games) |
|---|---|---|
| members per player (target 6–7) | 5.3 ±2.8 sd (18.8% land on 6–7; 5.2 cards) | 4.1 ±2.8 sd (12.1% land on 6–7; 4.1 cards) |
| final followers | 55.6 | 52.3 |
| … self | 1.0 (1.8%) | 1.0 (1.9%) |
| … members' worth | 7.0 (12.6%) | 5.3 (10.2%) |
| … buys 2→1 / 4→3 / 8→6 / 10→10 | 0.5 / 1.0 / 1.6 / 25.8 (52.1%) | 1.1 / 2.0 / 1.9 / 22.9 (53.3%) |
| … contests round I / II / III | 2.7 / 5.1 / 7.6 (27.5%) | 2.5 / 5.1 / 7.7 (29.3%) |
| … effects (member triggers, actions, game end) | 3.3 (6.0%) | 2.8 (5.3%) |
| resources left at the end | 9.7 mean, 21.0 p90, 113 max (4.0% hold 30+) | 8.7 mean, 18.0 p90, 61 max (3.3% hold 30+) |
| contests that paid 2+ / 3+ tied leaders | 25.0% / 5.4% of 5194 | 24.7% / 4.8% of 797 |
| steal events per game (units taken) | 9.8 (15.1) | 14.8 (21.7) |
| longest run of placements by one player (the snake alone makes 2) | 2.4 mean, 7 max (19.8% of games have 3+) | 2.3 mean, 5 max (16.2% of games have 3+) |
| decision richness: top two within 1 follower | n/a (needs Hard rollouts) | 29.2% of 5758 weighed decisions (median gap 2.92) |

