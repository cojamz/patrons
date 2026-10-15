# Balance bench (full)

2026-10-15 06:52 UTC · commit bc4b5d7 · content 3ai6ymhpf7.4091cbca95 · 76.7 min on 4 workers (301 core-min) · 38 random 4-sphere tables (makeTables 4242, every compatible pair at least twice), dealt round-robin.
Games played: 11343 full-game equivalents (probe games fork mid-game and count as the part they play). Throughput: Normal 61.3 games per core-minute, Hard-20 8.9 (all four seats that level).
Instruments: **Normal** (all four seats) and **Hard-20** (Hard = Normal plus rollouts, at budget 20, uncapped, deterministic). Intervals are 90% (bootstrap over seeds for fits, Wilson for win rates). Method and limits: design/eval/bench/README.md.

One run is one sample: flags near the line churn from run to run (two full runs on the same rules kept 5 of 14 card flags, while estimates moved only as far as their intervals predict). **Act on the pooled list in trend.md**, which combines every run on the same rules content.

## What moved since last run
Against 2026-10-15 05:35 (bc4b5d7):
- Cards: Midas: flagged dear → not flagged; Banker: flagged dear → not flagged; Tycoon: not flagged → flagged dear; Big Spender: flagged dear → not flagged; Lamplighter: Normal fair 7.7 → 14.2; Timekeeper: flagged dear → not flagged; Lender: not flagged → flagged cheap; Go-Getter: Normal fair 5.5 → 9.6; Taskmaster: not flagged → flagged dear; Hustler: not flagged → flagged cheap; Tinker: flagged cheap → not flagged; Green Devotee: not flagged → flagged dear; Volunteer: not flagged → flagged cheap; Mole: not flagged → flagged cheap; Gleaner: Normal fair 3.7 → 9.6; Sponsor: flagged dear → not flagged; Patriarch: flagged dear → not flagged; Translator: not flagged → flagged dear; Reseller: not flagged → flagged dear; Curator: Normal fair 4.4 → 0.1; Auctioneer: Normal fair 9.5 → 4.6.
- Spaces: Grove (round 2): in → strong; Lie Low (round 3): in → strong; Lie Low (round 2): strong → in; Clock In (round 2): strong → in; Bloom (round 3): in → strong.
- Health (Hard-20): tied contests 23.4% → 29.4%.

## 1. Anchors
**The instrument is off: every section below is untrusted until the anchors pass.**

- Price slope, followers of margin per extra cost point (the exchange rate for everything below): Normal 0.81 [0.76–0.86] (by fork round I/II/III: 0.89 [0.81–0.98], 0.85 [0.77–0.93], 0.68 [0.62–0.75]); Hard-20 0.83 [0.70–0.96] (by fork round I/II/III: 0.91 [0.59–1.19], 0.94 [0.78–1.13], 0.62 [0.42–0.81]). 
- Hard-20 alone vs 3 Normal (Classic, n=96): wins 24.5% [18.0%–32.3%]; parity is 25%, it must reach 32%. FAIL: the second instrument is no stronger than the first.

| instrument | anchor | printed | fair [90%] | n | expected | |
|---|---|---|---|---|---|---|
| Normal | Banker | 8 | 6.0 [4.9–7.4] | 440 | 4.5–10.5 | ok |
| Normal | Big Family | 4 | 3.0 [1.7–4.4] | 374 | 0.5–6.0 | ok |
| Normal | Sponsor | 10 | 7.3 [5.7–8.8] | 215 | 8.0–∞ | ok |
| Normal | Tycoon | 6 | 4.5 [3.2–5.8] | 401 | −∞–10.0 | ok |
| Hard-20 | Banker | 8 | 10.6 [7.7–13.4] | 61 | 4.5–10.5 | ok |
| Hard-20 | Big Family | 4 | 1.7 [-1.1–3.7] | 46 | 0.5–6.0 | ok |
| Hard-20 | Sponsor | 10 | 12.7 [8.5–16.4] | 26 | 8.0–∞ | ok |
| Hard-20 | Tycoon | 6 | 1.9 [-0.8–4.8] | 56 | −∞–10.0 | ok |

- Banker ("Now and at round start, +3 gold"; 4, repriced to 8 in balance pass 1; the range is absolute). By arithmetic +9/+6/+3 gold by round recruited, ~7 averaged, plus a follower; the Normal sweep read 7.3 [6.3–8.3] recruited in round I.
- Big Family (4: "Worth 3 followers", no ability), the plain worth-N member: 3 followers ≈ 4 resources at 4→3, less the follower buy it displaces. The Normal sweep read 2.4 [0.6–3.6].
- Sponsor (10: "Your members cost 2 less"), rework-candidates #1, known strong: must read 8 or more (printed − 2).
- Tycoon ("Game end: +1 follower per 3 gold"), rework-candidates #3, known weak at its old 12: must read 10 or less (absolute; repriced to 6 in balance pass 1, so it no longer has to read under printed).

## 2. Cards — UNTRUSTED (anchor check failed)
Paired forced recruit: a private copy of the card, at printed −4 / printed / +4, recruited at the seat's first affordable buy from a random round on (I, II or III), against the same seed without it. Fair price = the price where it nets 0 followers of margin. Normal: 26376 probes over 440 seeds, every card. Hard-20: 2640 probes over 44 seeds, only the anchors and what Normal flags or reads ≥ 2.5 off (a card both must agree on can't be flagged by Hard alone). Flag = the 90% interval misses printed and the gap is ≥ 1.5, for BOTH instruments.

### Both instruments agree (17)
| card | printed | Normal fair [90%] n | Hard-20 fair [90%] n | reads | bought round |
|---|---|---|---|---|---|
| Snob (market) | 10 | 2.9 [0.0–6.5] 59 | 7.0 [4.0–9.5] 47 | too dear | 2.7 |
| Translator (echo) | 6 | -1.0 [-3.8–2.0] 77 | 2.7 [-0.9–5.7] 33 | too dear | 2.3 |
| Lender (trading) | 2 | 7.9 [5.7–10.5] 91 | 6.5 [4.6–8.4] 55 | too cheap, needs an ability change (would need > 2× its price) | 2.3 |
| Hustler (gold) | 2 | 7.7 [5.5–10.3] 135 | 6.6 [3.6–9.6] 62 | too cheap, needs an ability change (would need > 2× its price) | 2.1 |
| Reseller (market) | 12 | 6.4 [3.4–9.3] 56 | 5.8 [1.4–9.0] 44 | too dear | 2.8 |
| Talent Scout (market) | 4 | -0.7 [-2.9–2.0] 86 | 1.3 [-1.2–3.7] 69 | too dear | 2.2 |
| Heiress (trading) | 10 | 5.9 [3.5–8.5] 86 | 3.5 [-0.5–7.2] 51 | too dear | 2.4 |
| Investor (gold) | 6 | 2.1 [0.0–4.8] 128 | 1.2 [-1.2–4.0] 58 | too dear | 2.3 |
| Taskmaster (purple) | 6 | 2.1 [0.3–4.3] 101 | 3.1 [0.7–5.5] 47 | too dear | 2.3 |
| Volunteer (red) | 0 | 3.8 [2.3–5.7] 146 | 5.0 [2.2–8.5] 52 | too cheap | 2.0 |
| Patroness (market) | 8 | 4.2 [2.5–6.6] 77 | 4.5 [1.8–6.4] 58 | too dear | 2.4 |
| Extra Hand (benders) | 10 | 6.7 [5.2–8.0] 299 | 6.8 [4.7–8.6] 127 | too dear | 2.3 |
| Mole (thieves) | 4 | 7.2 [5.5–9.2] 101 | 6.4 [4.6–8.0] 82 | too cheap | 2.2 |
| Insider (benders) | 6 | 3.3 [2.0–4.7] 274 | 3.5 [1.8–5.0] 125 | too dear | 2.2 |
| Green Devotee (green) | 4 | 1.6 [0.2–3.1] 151 | 1.4 [-1.1–3.6] 55 | too dear | 2.0 |
| Straggler (benders) | 8 | 5.8 [4.5–6.7] 270 | 4.0 [1.4–6.2] 126 | too dear | 2.2 |
| Tycoon (gold) | 6 | 4.5 [3.2–5.8] 401 | 1.9 [-0.8–4.8] 56 | too dear | 2.3 |

### Needs an ability change, not a price (2)
Lender (printed 2; Normal 7.9, Hard-20 6.5: would need > 2× its price); Hustler (printed 2; Normal 7.7, Hard-20 6.6: would need > 2× its price).

### Normal flags, Hard-20 confidently doesn't (likely a Normal-bot artifact) (6)
Banker 8 (Normal 6.0 [4.9–7.4], Hard-20 10.6 [7.7–13.4]); Sleepwalker 6 (Normal 12.4 [9.9–15.0], Hard-20 7.4 [3.7–11.3]); Underdog 6 (Normal 9.5 [7.5–11.8], Hard-20 6.5 [3.5–9.3]); Sticky Fingers 8 (Normal 3.7 [1.0–6.1], Hard-20 8.6 [6.7–10.5]); Sponsor 10 (Normal 7.3 [5.7–8.8], Hard-20 12.7 [8.5–16.4]); Curator 4 (Normal 0.1 [-2.2–2.3], Hard-20 3.7 [1.3–5.8]).

Normal flags, Hard-20 too thin or unsure to say: Midas 8→2.6 (Hard-20 5.0, n 55); Majordomo 6→9.1; Big Spender 4→2.1; Groupie 8→2.0 (Hard-20 7.3, n 37); Late Riser 6→2.5; Night Owl 10→6.7; Apprentice 4→2.1; Debutante 8→10.4; Blue Devotee 4→2.3; Liquidator 6→2.0 (Hard-20 3.4, n 55); Bulk Buyer 6→7.7; Blue Patron 6→4.1; Freelancer 4→2.5; Blue Pillar 6→3.5; Treasurer 4→7.1 (Hard-20 6.2, n 50); Green Elder 4→1.9; Tinker 6→9.9; Green Recruit 1→2.7; Sower 4→1.3; Farmer 6→1.9; Bodyguard 6→8.5; Crew 2→5.1; Kingpin 2→4.3; Safecracker 4→7.4; Mob 8→4.0; Desperado 4→7.4; Bookkeeper 6→3.8; Rainmaker 6→0.4 (Hard-20 9.8, n 23); Harmonist 4→0.1; Doppelganger 6→3.5; Mentor & Protégé 10→7.1; Patriarch 10→7.2; Green Pillar 6→3.2 (Hard-20 2.9, n 55); Ensemble 6→3.3; Social Climber 2→5.1; Stylist 4→6.2; Minimalist 2→6.3; Underbidder 2→4.9; Grifter 6→8.8; Onlooker 10→6.4.

<details><summary>Every card (Normal; Hard-20 where measured)</summary>

| card | printed | Normal fair [90%] | n | detectable | net at printed by round I/II/III | Hard-20 fair [90%] | n |
|---|---|---|---|---|---|---|---|
| Sleepwalker (echo.afterimage) | 6 | 12.4 [9.9–15.0] | 88 | ±3.9 | 1.4 / 8.0 / 3.8 | 7.4 [3.7–11.3] | 33 |
| Lender (trading.lender) | 2 | 7.9 [5.7–10.5] | 91 | ±3.7 | 5.0 / 15.7 / 2.0 | 6.5 [4.6–8.4] | 55 |
| Hustler (gold.hustler) | 2 | 7.7 [5.5–10.3] | 135 | ±3.6 | 0.7 / 6.7 / -0.1 | 6.6 [3.6–9.6] | 62 |
| Minimalist (market.minimalist) | 2 | 6.3 [3.9–9.1] | 87 | ±4.0 | 20.4 / -4.1 / 0.0 | – |  |
| Tinker (gold.tinker) | 6 | 9.9 [7.6–13.0] | 131 | ±4.0 | 0.4 / 5.5 / -0.1 | – |  |
| Volunteer (red.volunteer) | 0 | 3.8 [2.3–5.7] | 146 | ±2.5 | 7.8 / 5.3 / 6.5 | 5.0 [2.2–8.5] | 52 |
| Underdog (gold.underdog) | 6 | 9.5 [7.5–11.8] | 128 | ±3.2 | 9.5 / 5.6 / 1.3 | 6.5 [3.5–9.3] | 58 |
| Safecracker (thieves.bigscore) | 4 | 7.4 [5.2–9.5] | 103 | ±3.3 | 3.5 / 1.0 / 4.4 | – |  |
| Desperado (thieves.desperado) | 4 | 7.4 [5.3–9.6] | 107 | ±3.3 | -1.3 / 3.4 / 0.9 | – |  |
| Tribute Band (echo.dejavu) | 12 | 15.2 [11.7–18.3] | 49 | ±5.0 | 2.4 / -11.5 / 11.1 | – |  |
| Mole (thieves.mole) | 4 | 7.2 [5.5–9.2] | 101 | ±2.8 | 9.3 / 2.0 / 2.8 | 6.4 [4.6–8.0] | 82 |
| Majordomo (silver.majordomo) | 6 | 9.1 [6.7–11.6] | 148 | ±3.7 | 9.5 / 0.0 / -0.4 | – |  |
| Crew (thieves.crew) | 2 | 5.1 [3.0–7.0] | 107 | ±3.0 | 2.5 / 6.3 / 1.3 | – |  |
| Social Climber (market.climber) | 2 | 5.1 [2.9–7.5] | 94 | ±3.5 | 6.3 / -1.9 / 0.1 | – |  |
| Treasurer (gold.seed) | 4 | 7.1 [5.3–8.9] | 126 | ±2.8 | 0.7 / 5.1 / 6.3 | 6.2 [2.5–9.7] | 50 |
| Underbidder (market.underbidder) | 2 | 4.9 [2.4–7.7] | 78 | ±4.0 | -2.9 / 3.0 / -3.0 | – |  |
| Grifter (thieves.grifter) | 6 | 8.8 [6.6–11.0] | 67 | ±3.3 | 3.0 / 1.4 / -0.4 | – |  |
| Bodyguard (thieves.watchdog) | 6 | 8.5 [6.5–10.5] | 82 | ±3.0 | -7.8 / -0.1 / 2.3 | – |  |
| Debutante (silver.gala) | 8 | 10.4 [8.1–12.5] | 138 | ±3.4 | 0.4 / 1.0 / 2.8 | – |  |
| Kingpin (thieves.kingpin) | 2 | 4.3 [2.4–6.5] | 83 | ±3.1 | 7.8 / 7.1 / 4.0 | – |  |
| Lamplighter (purple.lamplighter) | 12 | 14.2 [10.0–17.6] | 39 | ±5.7 | -8.6 / 5.2 / 3.3 | – |  |
| Benchwarmer (red.reserve) | 1 | 3.2 [1.0–5.7] | 117 | ±3.5 | 4.2 / -3.8 / 1.0 | – |  |
| Stylist (market.stylist) | 4 | 6.2 [4.5–8.5] | 95 | ±3.0 | -6.1 / 2.4 / 0.5 | – |  |
| Cutpurse (thieves.cutpurse) | 4 | 6.1 [3.9–8.1] | 102 | ±3.2 | 9.8 / -4.7 / -0.5 | – |  |
| Green Recruit (green.recruit) | 1 | 2.7 [1.3–4.2] | 144 | ±2.2 | 3.5 / 2.0 / 1.0 | – |  |
| Connoisseur (market.connoisseur) | 4 | 5.7 [3.3–8.4] | 95 | ±3.8 | -9.3 / 3.2 / -0.5 | – |  |
| Bulk Buyer (trading.bulkbuyer) | 6 | 7.7 [6.3–9.8] | 82 | ±2.6 | 5.6 / 1.2 / -1.2 | – |  |
| Go-Getter (purple.secondwind) | 8 | 9.6 [7.2–12.3] | 84 | ±3.9 | 0.9 / -0.2 / -6.0 | – |  |
| Planner (market.planner) | 4 | 5.6 [3.0–8.8] | 92 | ±4.4 | 4.8 / -6.8 / 1.1 | – |  |
| Robin Hood (thieves.robinhood) | 4 | 5.5 [3.6–7.3] | 109 | ±2.8 | 3.4 / 3.5 / 0.1 | – |  |
| Tipster (trading.tipster) | 6 | 7.5 [5.3–9.4] | 95 | ±3.1 | 3.2 / -0.3 / 7.8 | – |  |
| Crowd-Pleaser (red.crowd) | 2 | 3.5 [1.5–5.6] | 114 | ±3.1 | 10.2 / -1.9 / -2.8 | – |  |
| Upstart (silver.spoon) | 6 | 7.5 [5.2–9.9] | 127 | ±3.6 | 3.5 / -3.8 / 2.1 | – |  |
| Penny Pincher (gold.thrift) | 4 | 5.3 [3.3–7.3] | 131 | ±3.0 | 10.2 / 0.5 / 3.1 | – |  |
| Pilgrim (yellow.pilgrim) | 4 | 5.2 [2.8–8.2] | 81 | ±4.0 | 6.5 / -7.4 / 8.1 | – |  |
| Steward (silver.steward) | 4 | 5.2 [2.7–7.6] | 141 | ±3.7 | -7.7 / 1.4 / -3.5 | – |  |
| Silversmith (silver.silversmith) | 6 | 7.0 [4.6–9.5] | 143 | ±3.7 | 1.1 / 3.4 / -0.9 | – |  |
| Blue Helper (blue.helper) | 2 | 3.0 [1.4–4.7] | 113 | ±2.5 | 1.5 / 0.8 / 2.5 | – |  |
| Clockmaker (purple.clockmaker) | 4 | 4.9 [2.6–7.1] | 100 | ±3.4 | 7.8 / 0.7 / 4.3 | – |  |
| Host (red.host) | 6 | 6.8 [4.4–9.7] | 102 | ±4.0 | 0.5 / -4.6 / -5.4 | – |  |
| Blue Regular (blue.regular) | 3 | 3.8 [2.2–5.5] | 127 | ±2.5 | -1.5 / 0.7 / 3.2 | – |  |
| Heir (silver.heir) | 8 | 8.7 [6.9–11.0] | 137 | ±3.1 | -2.8 / -1.2 / 2.1 | – |  |
| Blue Hand (blue.hand) | 2 | 2.7 [1.0–4.3] | 122 | ±2.4 | -2.9 / -0.1 / -0.9 | – |  |
| Green Patron (green.patron) | 6 | 6.6 [5.1–8.0] | 133 | ±2.2 | 1.5 / 6.7 / 0.4 | – |  |
| Recluse (market.recluse) | 4 | 4.5 [2.7–7.0] | 83 | ±3.2 | 3.9 / -11.0 / 6.5 | – |  |
| Guest (silver.guest) | 8 | 8.5 [6.6–10.8] | 138 | ±3.1 | 0.3 / 9.3 / 0.1 | – |  |
| Late Bloomer (yellow.latebloomer) | 4 | 4.5 [2.6–6.7] | 90 | ±3.1 | 0.7 / -0.9 / -16.3 | – |  |
| Errand Runner (purple.errand) | 8 | 8.5 [6.2–10.8] | 101 | ±3.5 | -2.0 / -2.3 / 5.2 | – |  |
| Corner-Cutter (purple.doubletime) | 2 | 2.5 [0.4–4.4] | 95 | ±3.0 | 7.2 / 3.1 / 4.7 | – |  |
| Shareholder (trading.shareholder) | 3 | 3.5 [1.3–6.3] | 105 | ±3.8 | 4.2 / 4.0 / 4.8 | – |  |
| Blue Recruit (blue.recruit) | 1 | 1.4 [0.1–3.2] | 127 | ±2.3 | -0.4 / -5.3 / 0.7 | – |  |
| Exporter (trading.exporter) | 4 | 4.4 [1.9–7.6] | 92 | ±4.3 | 3.2 / -6.7 / -2.1 | – |  |
| Raider (trading.raider) | 2 | 2.4 [0.1–4.8] | 103 | ±3.5 | -3.9 / -4.8 / 1.3 | – |  |
| Understudy (echo.understudy) | 6 | 6.4 [3.5–8.5] | 87 | ±3.7 | -1.3 / 8.1 / -3.0 | – |  |
| Extortionist (thieves.extortionist) | 10 | 10.3 [6.7–14.0] | 32 | ±5.5 | -8.3 / 10.0 / 5.8 | – |  |
| Sommelier (market.sommelier) | 4 | 4.3 [1.4–7.3] | 83 | ±4.5 | 7.5 / 4.7 / -9.0 | – |  |
| Intern (red.intern) | 1 | 1.2 [-0.7–3.1] | 121 | ±2.8 | -1.9 / 5.7 / 0.3 | – |  |
| Lookout (thieves.lookout) | 6 | 6.2 [4.4–8.1] | 79 | ±2.8 | -6.2 / -0.3 / -0.1 | – |  |
| Double Agent (thieves.doubleagent) | 6 | 6.1 [3.8–8.4] | 70 | ±3.5 | -4.3 / 3.5 / 1.8 | – |  |
| Overseer (purple.overseer) | 4 | 4.1 [2.2–6.2] | 100 | ±3.1 | -1.4 / -0.8 / -0.3 | – |  |
| Mime (echo.mirror) | 6 | 6.0 [3.1–9.5] | 81 | ±4.8 | -11.9 / 2.5 / 10.2 | – |  |
| Rich Uncle (trading.safetynet) | 2 | 2.0 [-0.5–4.9] | 93 | ±4.0 | 5.3 / -1.6 / -4.7 | – |  |
| Shopkeeper (trading.shopkeeper) | 4 | 4.0 [1.8–5.9] | 96 | ±3.1 | -11.1 / 1.8 / -1.0 | – |  |
| Recruiter (red.recruiter) | 8 | 7.9 [5.9–10.5] | 96 | ±3.4 | -1.5 / 1.5 / -3.4 | – |  |
| Blue Elder (blue.elder) | 4 | 3.8 [2.4–5.5] | 114 | ±2.4 | -6.0 / 1.7 / 0.3 | – |  |
| Broker (trading.broker) | 2 | 1.8 [-0.6–3.9] | 89 | ±3.4 | -1.2 / -1.9 / -3.1 | – |  |
| Weaver (yellow.weaver) | 6 | 5.7 [2.5–8.8] | 66 | ±4.7 | -6.4 / 1.7 / -1.3 | – |  |
| Twins (red.twins) | 2 | 1.7 [0.0–3.3] | 143 | ±2.5 | 0.8 / 0.5 / 0.1 | – |  |
| Feastmaker (yellow.feastmaker) | 10 | 9.6 [5.9–13.2] | 32 | ±5.5 | -7.5 / 11.3 / 5.8 | – |  |
| Gardener (yellow.gardener) | 2 | 1.6 [-0.2–3.2] | 76 | ±2.6 | -8.7 / 5.8 / -0.2 | – |  |
| Grand Host (silver.grandhost) | 12 | 11.6 [9.5–14.1] | 138 | ±3.5 | -0.9 / 7.5 / -1.4 | – |  |
| Pied Piper (red.drive) | 4 | 3.6 [1.4–5.8] | 111 | ±3.3 | -5.0 / 4.5 / -5.9 | – |  |
| Green Helper (green.helper) | 2 | 1.6 [0.3–3.4] | 142 | ±2.3 | -8.0 / -4.9 / -2.8 | – |  |
| Gleaner (yellow.gleaner) | 10 | 9.6 [6.6–13.0] | 50 | ±4.9 | -5.6 / -12.7 / -0.7 | – |  |
| Merchant (gold.merchant) | 6 | 5.5 [3.3–7.6] | 123 | ±3.2 | -1.8 / -2.5 / 3.8 | – |  |
| Accomplice (thieves.accomplice) | 8 | 7.5 [5.4–9.7] | 81 | ±3.3 | 8.4 / 4.0 / -4.8 | – |  |
| Toastmaster (silver.toastmaster) | 4 | 3.5 [1.7–5.6] | 138 | ±3.0 | 0.1 / 3.0 / -4.9 | – |  |
| Lottery Winner (gold.jackpot) | 10 | 9.5 [7.2–12.1] | 117 | ±3.7 | -4.9 / -6.4 / -0.6 | – |  |
| Shift Crew (purple.crew) | 2 | 1.5 [-0.4–4.2] | 100 | ±3.4 | 6.3 / 1.6 / -0.4 | – |  |
| Dyer (yellow.dyer) | 6 | 5.4 [2.8–8.2] | 61 | ±4.1 | -5.2 / 0.6 / -6.4 | – |  |
| Light Fingers (thieves.lightfingers) | 8 | 7.3 [5.3–9.6] | 87 | ±3.2 | 0.9 / -1.3 / -2.5 | – |  |
| Squatter (benders.squatter) | 8 | 7.3 [6.1–8.7] | 239 | ±2.0 | -2.1 / 2.6 / -0.8 | – |  |
| Green Hand (green.hand) | 2 | 1.3 [-0.0–2.7] | 159 | ±2.0 | -1.3 / -3.9 / -2.4 | – |  |
| Impressionist (echo.tuningfork) | 4 | 3.3 [1.3–5.2] | 97 | ±2.9 | 1.6 / 2.7 / 3.8 | – |  |
| Reinvestor (trading.reinvestor) | 4 | 3.2 [0.9–5.6] | 87 | ±3.5 | -1.1 / -2.9 / 1.7 | – |  |
| Middleman (gold.coinpurse) | 4 | 3.1 [1.2–5.2] | 137 | ±3.0 | -5.1 / 1.4 / -0.4 | – |  |
| Big Family (red.bigfamily) | 4 | 3.0 [1.7–4.4] | 374 | ±2.0 | 2.2 / -0.8 / 2.7 | 1.7 [-1.1–3.7] | 46 |
| Patron Saint (silver.saint) | 6 | 5.0 [3.2–7.0] | 135 | ±2.9 | 0.4 / -7.5 / 0.1 | – |  |
| Go-Between (yellow.gobetween) | 4 | 3.0 [0.3–5.8] | 76 | ±4.2 | 2.9 / 7.4 / 0.5 | – |  |
| Front-runner (benders.frontrunner) | 2 | 1.0 [-0.2–2.2] | 306 | ±1.8 | 2.5 / -6.5 / -1.4 | – |  |
| Revelers (silver.revelers) | 6 | 4.9 [3.3–6.9] | 143 | ±2.7 | 3.8 / -2.1 / 3.3 | – |  |
| Tax Collector (gold.taxman) | 4 | 2.9 [1.2–4.8] | 151 | ±2.7 | 7.0 / -3.0 / -2.9 | – |  |
| Prospector (gold.prospector) | 4 | 2.9 [1.2–4.9] | 142 | ±2.7 | 0.7 / -0.7 / -3.4 | – |  |
| Busker (echo.evergreen) | 8 | 6.8 [4.3–9.7] | 81 | ±4.0 | -7.6 / -5.1 / -5.2 | – |  |
| Caterer (silver.caterer) | 4 | 2.8 [0.9–4.8] | 150 | ±2.9 | 2.2 / 1.8 / -0.8 | – |  |
| Auctioneer (market.auctioneer) | 6 | 4.6 [2.3–7.6] | 71 | ±4.0 | -9.1 / -6.5 / 5.5 | – |  |
| Timekeeper (purple.patience) | 8 | 6.5 [4.7–8.5] | 83 | ±2.9 | 0.1 / -3.7 / -1.2 | – |  |
| Dowager (silver.dowager) | 4 | 2.5 [0.7–4.4] | 136 | ±2.8 | -10.0 / -2.1 / 2.6 | – |  |
| Tycoon (gold.tycoon) | 6 | 4.5 [3.2–5.8] | 401 | ±2.0 | -3.5 / 0.9 / 1.7 | 1.9 [-0.8–4.8] | 56 |
| Freelancer (benders.freelancer) | 4 | 2.5 [1.1–3.8] | 307 | ±2.0 | -0.9 / -6.0 / 0.3 | – |  |
| Magnate (trading.magnate) | 4 | 2.5 [0.3–4.8] | 94 | ±3.4 | -3.5 / 1.0 / -3.2 | – |  |
| Green Regular (green.regular) | 3 | 1.5 [-0.2–3.3] | 151 | ±2.6 | -5.0 / -1.3 / -2.5 | – |  |
| Benefactor (silver.benefactor) | 6 | 4.4 [2.4–6.7] | 143 | ±3.3 | -1.2 / -2.8 / -1.1 | – |  |
| Retinue (silver.retinue) | 4 | 2.4 [0.1–4.6] | 154 | ±3.4 | -3.3 / -5.5 / -1.6 | – |  |
| Pawnbroker (trading.pawnbroker) | 4 | 2.4 [0.2–5.0] | 109 | ±3.6 | -2.5 / 1.3 / -1.4 | – |  |
| Blue Devotee (blue.devotee) | 4 | 2.3 [1.0–3.7] | 119 | ±2.0 | -3.9 / 1.0 / -3.2 | – |  |
| Foreman (purple.foreman) | 6 | 4.3 [1.9–6.9] | 95 | ±3.8 | -0.8 / 1.4 / 6.5 | – |  |
| Admirer (yellow.admirer) | 6 | 4.3 [1.5–7.1] | 72 | ±4.2 | -8.3 / -5.3 / -4.8 | – |  |
| Peddler (yellow.peddler) | 8 | 6.3 [4.0–9.0] | 66 | ±3.8 | -1.0 / -0.9 / -2.5 | – |  |
| Stunt Double (echo.hourglass) | 10 | 8.2 [5.6–11.1] | 68 | ±4.2 | 0.9 / 4.2 / -9.9 | – |  |
| Explorer (yellow.explorer) | 8 | 6.2 [2.5–9.6] | 62 | ±5.3 | 1.0 / 0.0 / 6.0 | – |  |
| Muse (echo.muse) | 4 | 2.2 [-0.0–4.8] | 79 | ±3.6 | -0.2 / -7.0 / -4.8 | – |  |
| Speculator (gold.speculator) | 8 | 6.1 [4.0–8.2] | 137 | ±3.1 | -1.5 / 0.6 / -1.7 | – |  |
| Apprentice (purple.apprentice) | 4 | 2.1 [0.5–3.9] | 106 | ±2.6 | 0.1 / 3.2 / -0.1 | – |  |
| Big Spender (benders.bigspender) | 4 | 2.1 [0.7–3.6] | 309 | ±2.2 | -1.9 / 0.5 / -6.8 | – |  |
| Proselytizer (red.proselytizer) | 6 | 4.1 [2.1–6.4] | 104 | ±3.3 | 6.8 / -4.6 / 2.0 | – |  |
| Chronicler (echo.chronicler) | 8 | 6.1 [3.3–8.6] | 87 | ±4.0 | 6.7 / 2.1 / 0.9 | – |  |
| Blue Patron (blue.patron) | 6 | 4.1 [2.7–5.5] | 112 | ±2.1 | -5.8 / 1.8 / -2.1 | – |  |
| Courier (purple.courier) | 6 | 4.1 [2.4–6.2] | 89 | ±2.9 | 0.3 / -0.9 / -4.3 | – |  |
| Banker (gold.banker) | 8 | 6.0 [4.9–7.4] | 440 | ±1.8 | 0.6 / -3.7 / 3.2 | 10.6 [7.7–13.4] | 61 |
| Green Elder (green.elder) | 4 | 1.9 [0.1–3.5] | 134 | ±2.6 | -1.5 / 0.4 / -0.4 | – |  |
| Wallflower (echo.wallflower) | 4 | 1.9 [-0.2–4.4] | 92 | ±3.5 | -8.1 / -5.0 / 7.2 | – |  |
| Bookkeeper (purple.bookkeeper) | 6 | 3.8 [2.0–6.0] | 96 | ±3.0 | 3.7 / -6.5 / -4.0 | – |  |
| Straggler (benders.straggler) | 8 | 5.8 [4.5–6.7] | 270 | ±1.7 | -1.1 / -1.8 / -3.7 | 4.0 [1.4–6.2] | 126 |
| Green Devotee (green.devotee) | 4 | 1.6 [0.2–3.1] | 151 | ±2.2 | -1.7 / -8.3 / 0.7 | 1.4 [-1.1–3.6] | 55 |
| Choir (echo.choir) | 6 | 3.5 [0.7–6.2] | 79 | ±4.1 | 8.8 / 3.4 / -3.8 | – |  |
| Doppelganger (red.doppel) | 6 | 3.5 [1.1–6.0] | 104 | ±3.7 | -0.9 / -3.4 / -4.6 | – |  |
| Dealer (trading.dealer) | 2 | -0.5 [-2.7–2.0] | 84 | ±3.6 | -9.8 / 4.6 / -1.0 | – |  |
| Blue Pillar (blue.pillar) | 6 | 3.5 [1.9–5.1] | 121 | ±2.4 | -2.1 / -2.4 / 3.0 | – |  |
| Ensemble (echo.ensemble) | 6 | 3.3 [1.4–5.4] | 77 | ±3.0 | -6.1 / 4.2 / -4.4 | – |  |
| Insider (benders.insider) | 6 | 3.3 [2.0–4.7] | 274 | ±2.1 | 0.4 / 0.2 / -2.6 | 3.5 [1.8–5.0] | 125 |
| Sponsor (red.sponsor) | 10 | 7.3 [5.7–8.8] | 215 | ±2.3 | 0.3 / 0.5 / -4.3 | 12.7 [8.5–16.4] | 26 |
| Sower (yellow.sower) | 4 | 1.3 [-0.7–3.7] | 82 | ±3.3 | -4.9 / -6.6 / -4.5 | – |  |
| Green Pillar (green.pillar) | 6 | 3.2 [1.5–4.9] | 148 | ±2.5 | -3.3 / -1.2 / 2.1 | 2.9 [0.4–6.1] | 55 |
| Patriarch (red.patriarch) | 10 | 7.2 [4.8–9.5] | 82 | ±3.5 | 0.1 / -10.2 / -8.8 | – |  |
| Mentor & Protégé (red.mentor) | 10 | 7.1 [4.9–9.2] | 80 | ±3.2 | 1.1 / 1.4 / -3.2 | – |  |
| Extra Hand (benders.extrahand) | 10 | 6.7 [5.2–8.0] | 299 | ±2.1 | -1.9 / -5.2 / -5.1 | 6.8 [4.7–8.6] | 127 |
| Night Owl (purple.nightowl) | 10 | 6.7 [4.4–9.0] | 67 | ±3.5 | -9.6 / -6.8 / -4.3 | – |  |
| Late Riser (purple.lateriser) | 6 | 2.5 [-0.1–4.7] | 90 | ±3.6 | -1.2 / -5.2 / -7.6 | – |  |
| Onlooker (market.onlooker) | 10 | 6.4 [4.1–9.1] | 65 | ±3.8 | 4.5 / -2.4 / 5.2 | – |  |
| Patroness (market.patroness) | 8 | 4.2 [2.5–6.6] | 77 | ±3.1 | -1.8 / 1.8 / -5.7 | 4.5 [1.8–6.4] | 58 |
| Taskmaster (purple.taskmaster) | 6 | 2.1 [0.3–4.3] | 101 | ±3.0 | -0.8 / -4.6 / -8.6 | 3.1 [0.7–5.5] | 47 |
| Harmonist (yellow.harmonist) | 4 | 0.1 [-2.8–2.5] | 56 | ±4.0 | -10.5 / -7.7 / -11.9 | – |  |
| Investor (gold.investor) | 6 | 2.1 [0.0–4.8] | 128 | ±3.6 | -12.9 / 4.4 / -5.0 | 1.2 [-1.2–4.0] | 58 |
| Curator (market.curator) | 4 | 0.1 [-2.2–2.3] | 88 | ±3.5 | -10.6 / -4.3 / 3.0 | 3.7 [1.3–5.8] | 75 |
| Liquidator (trading.liquidator) | 6 | 2.0 [0.2–4.0] | 99 | ±2.8 | -2.9 / -5.6 / -4.5 | 3.4 [0.9–6.8] | 55 |
| Mob (red.mob) | 8 | 4.0 [1.6–6.6] | 87 | ±3.8 | 1.1 / -5.9 / -1.9 | – |  |
| Heiress (trading.heiress) | 10 | 5.9 [3.5–8.5] | 86 | ±3.7 | 5.4 / -1.2 / -3.4 | 3.5 [-0.5–7.2] | 51 |
| Farmer (yellow.farmer) | 6 | 1.9 [-1.2–4.4] | 62 | ±4.2 | -0.2 / 2.6 / -2.7 | – |  |
| Sticky Fingers (thieves.sticky) | 8 | 3.7 [1.0–6.1] | 83 | ±3.9 | -5.8 / -5.1 / -1.5 | 8.6 [6.7–10.5] | 65 |
| Talent Scout (market.blackmarket) | 4 | -0.7 [-2.9–2.0] | 86 | ±3.7 | -6.5 / 5.1 / -8.8 | 1.3 [-1.2–3.7] | 69 |
| Midas (gold.midas) | 8 | 2.6 [0.4–4.7] | 139 | ±3.2 | -5.5 / -8.8 / -4.1 | 5.0 [1.6–8.2] | 55 |
| Rainmaker (yellow.rainmaker) | 6 | 0.4 [-2.6–2.9] | 55 | ±4.2 | -2.7 / -14.4 / -8.0 | 9.8 [6.8–13.1] | 23 |
| Reseller (market.reseller) | 12 | 6.4 [3.4–9.3] | 56 | ±4.4 | -5.8 / -1.4 / -8.8 | 5.8 [1.4–9.0] | 44 |
| Groupie (echo.groupie) | 8 | 2.0 [-1.1–5.2] | 88 | ±4.7 | -0.1 / 1.7 / 1.9 | 7.3 [1.6–12.6] | 37 |
| Translator (echo.translator) | 6 | -1.0 [-3.8–2.0] | 77 | ±4.3 | -7.8 / 3.2 / -4.3 | 2.7 [-0.9–5.7] | 33 |
| Snob (market.snob) | 10 | 2.9 [0.0–6.5] | 59 | ±4.9 | -8.3 / -8.6 / -8.8 | 7.0 [4.0–9.5] | 47 |

</details>

Power: for the 94 cards Normal reads in band, the smallest gap this run could have caught (80% power, 90% interval) is 3.4 cost points at the median card, 4.4 at the 90th percentile (column "detectable" in the full table). More seeds narrow it as 1/√n.

## 2b. Card × sphere and space × sphere outliers — UNTRUSTED (anchor check failed)
Normal's residuals on the tables where the seat held the item, grouped by each other sphere at the table: a card fine overall but off beside one sphere. Listed at |deviation| ≥ 3 cost points (spaces: 3 scaled u) and |z| ≥ 3.5 among 1367 card × sphere and 1341 space × sphere pairs with n ≥ 15 (about one false alarm expected). Hard-20 beside it where its targets covered the pair.

Cards: none.

Spaces: none.

## 3. Spaces — UNTRUSTED (anchor check failed)
Paired forced placement: from the start of round r, the seat's first minion must take the space (base: the bot's own choice). A "null" minion (bot's own choice, action does nothing) in every game gives the zero, so worth = followers of margin over a minion that does nothing; u = worth ÷ that round's price slope (Normal 0.89 / 0.85 / 0.68, Hard-20 0.91 / 0.94 / 0.62 followers per resource, rounds I / II / III). Raw u also counts the buy a placement enables and early compounding, so it runs high; scaled u sets each round's median space to the middle of its band (×1.33 / 1.11 / 1.42 for rounds I / II / III) and says where a space sits among its round's field on the value model's ruler (round I 2–3u, II 3–5u, III 5–9u). Flag, on scaled u: above the band in any round, below it in the space's own ring's round, or worth below 0. "vs choice" = against the bot's own pick (≤ 0 means the bot was right to skip it). Blocked = a rival took it first.
Normal's own pick is worth 2.5 followers in round 1, 4.1 followers in round 2, 5.5 followers in round 3 over a null minion (2.8u / 4.8u / 8.1u).

### Both instruments agree (4)
| space | ring | round | Normal scaled u [90%] n | Hard-20 scaled u [90%] n | band | reads |
|---|---|---|---|---|---|---|
| Grove (green) | 2 | 2 | 7.4 [5.8–8.9] 119 | 6.9 [5.2–9.2] 39 | 3–5 | strong |
| Lie Low (thieves) | 1 | 3 | 12.9 [11.2–15.2] 109 | 13.8 [11.1–17.5] 54 | 5–9 | strong |
| Bloom (green) | 3 | 3 | 11.6 [9.1–13.7] 78 | 15.1 [11.4–20.9] 28 | 5–9 | strong |
| Spree (market) | 3 | 3 | 0.5 [-2.2–3.8] 90 | -1.9 [-4.8–0.9] 86 | 5–9 | weak |

### Normal flags, Hard-20 confidently doesn't (likely a Normal-bot artifact) (5)
Lie Low r2 (Normal 8.4 [6.1–11.3], Hard-20 4.1 [2.1–6.3] scaled u); Shake Down r2 (Normal 7.9 [5.7–10.5], Hard-20 5.2 [3.2–7.8] scaled u); Crunch Time r3 (Normal 16.1 [12.1–21.5], Hard-20 10.1 [6.0–13.1] scaled u); Lie Low r1 (Normal 6.2 [3.1–9.6], Hard-20 1.2 [-1.2–3.9] scaled u); Half Price r2 (Normal 0.2 [-1.9–2.4], Hard-20 2.6 [0.4–5.2] scaled u).

Normal flags, Hard-20 too thin or unsure to say: Dividend r3 strong (14.6u; Hard-20 14.0u, n 30); Flood r3 strong (12.4u; Hard-20 -3.8u, n 3); Rising Tide r3 strong (12.9u; Hard-20 17.9u, n 26); Help Yourself r3 strong (12.5u; Hard-20 8.6u, n 63); Swap Sides r2 weak (-0.1u; Hard-20 1.8u, n 76); Catch Up r1 weak (-1.4u; Hard-20 1.4u, n 26); Toast r3 strong (16.7u; Hard-20 14.1u, n 28); Help Yourself r1 strong (5.4u; Hard-20 2.5u, n 66); Cheap Seats r1 weak (-3.9u; Hard-20 1.0u, n 37).

Power: for the 136 space-rounds Normal reads in band, the smallest miss this run could have caught is 4.0 scaled u at the median, 5.0 at the 90th percentile (column "detectable").

<details><summary>Every space and round (Normal; Hard-20 where measured)</summary>

| space | sphere | ring | round | worth (followers) [90%] | raw u | scaled u [90%] | detectable | vs choice | blocked | n | Hard-20 scaled u [90%] |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Lie Low | thieves | 1 | 1 | 4.1 [2.1–6.4] | 4.6 | 6.2 [3.1–9.6] | ±4.9 | 1.6 | 0.0% | 71 | 1.2 [-1.2–3.9] |
| Kickback | gold | 1 | 1 | 3.6 [1.7–5.5] | 4.1 | 5.4 [2.5–8.2] | ±4.3 | 1.1 | 2.8% | 174 | -5.8 [-10.2–5.6] |
| Help Yourself | thieves | 1 | 1 | 3.6 [2.0–5.4] | 4.0 | 5.4 [3.1–8.1] | ±3.8 | 1.1 | 0.9% | 113 | 2.5 [-1.0–6.2] |
| Sob Story | trading | 1 | 1 | 3.5 [1.2–6.7] | 4.0 | 5.3 [1.8–9.9] | ±6.2 | 1.0 | 2.9% | 101 | 27.7 [-3.0–34.7] |
| Name Drop | market | 1 | 1 | 3.4 [1.4–5.4] | 3.8 | 5.1 [2.2–8.1] | ±4.4 | 0.9 | 9.0% | 81 | 4.1 [-6.9–18.2] |
| Golden Years | gold | 1 | 1 | 2.3 [0.2–4.9] | 2.6 | 3.5 [0.2–7.3] | ±5.4 | -0.2 | 0.0% | 133 | -13.3 [-19.9–4.5] |
| New Faces | market | 1 | 1 | 2.3 [0.2–4.6] | 2.6 | 3.5 [0.3–6.9] | ±5.0 | -0.2 | 1.1% | 93 | 0.4 [-3.0–7.8] |
| Crescendo | echo | 1 | 1 | 2.3 [0.8–4.5] | 2.6 | 3.4 [1.1–6.7] | ±4.2 | -0.2 | 0.0% | 106 | 10.4 [-1.5–15.2] |
| Current | blue | 1 | 1 | 2.3 [0.9–4.1] | 2.5 | 3.4 [1.4–6.2] | ±3.6 | -0.2 | 1.0% | 97 | -11.1 [-13.9–7.7] |
| Toast | silver | 1 | 1 | 2.1 [0.3–4.5] | 2.4 | 3.2 [0.5–6.7] | ±4.7 | -0.4 | 1.4% | 139 | – |
| Your Call | trading | 1 | 1 | 2.1 [0.3–4.5] | 2.4 | 3.2 [0.4–6.7] | ±4.7 | -0.4 | 0.0% | 94 | – |
| Shoal | blue | 1 | 1 | 2.0 [-0.1–4.3] | 2.3 | 3.0 [-0.2–6.4] | ±5.0 | -0.5 | 16.5% | 91 | – |
| Good Deed | silver | 1 | 1 | 2.0 [-0.3–4.3] | 2.2 | 2.9 [-0.5–6.5] | ±5.3 | -0.5 | 1.6% | 125 | -1.8 [-3.8–7.0] |
| Intro Offer | gold | 1 | 1 | 1.9 [0.1–3.6] | 2.1 | 2.8 [0.2–5.4] | ±4.0 | -0.6 | 0.0% | 131 | 14.2 [-1.6–18.9] |
| Goody Bags | silver | 1 | 1 | 1.7 [-0.6–4.3] | 1.9 | 2.5 [-0.9–6.4] | ±5.5 | -0.8 | 29.9% | 94 | -10.1 [-16.5–7.0] |
| Redistribute | thieves | 1 | 1 | 1.7 [-0.1–3.6] | 1.9 | 2.5 [-0.2–5.4] | ±4.3 | -0.8 | 0.0% | 102 | 12.9 [-1.7–16.4] |
| Sprout | green | 1 | 1 | 1.7 [0.2–3.2] | 1.9 | 2.5 [0.3–4.9] | ±3.4 | -0.8 | 1.2% | 169 | – |
| Trade Seeds | yellow | 1 | 1 | 1.5 [-0.5–3.9] | 1.7 | 2.2 [-0.8–5.8] | ±5.0 | -1.0 | 0.0% | 86 | – |
| Hum | echo | 1 | 1 | 1.4 [-1.4–3.2] | 1.6 | 2.1 [-2.0–4.8] | ±5.1 | -1.1 | 9.2% | 108 | 4.4 [-5.7–12.8] |
| Open Door | red | 1 | 1 | 1.3 [-0.6–3.2] | 1.5 | 2.0 [-0.8–4.9] | ±4.3 | -1.2 | 4.9% | 116 | 9.4 [-1.5–12.1] |
| Root | green | 1 | 1 | 1.1 [-0.5–2.6] | 1.2 | 1.6 [-0.8–3.8] | ±3.5 | -1.4 | 14.5% | 112 | – |
| Top Up | yellow | 1 | 1 | 0.9 [-2.0–3.6] | 1.0 | 1.3 [-3.0–5.4] | ±6.3 | -1.6 | 28.2% | 56 | 9.7 [-6.7–34.7] |
| Bandwagon | red | 1 | 1 | 0.8 [-1.4–2.9] | 0.9 | 1.1 [-2.0–4.3] | ±4.8 | -1.7 | 0.0% | 115 | 4.9 [-5.1–18.5] |
| Tide | blue | 1 | 1 | 0.6 [-1.3–2.4] | 0.7 | 0.9 [-1.9–3.6] | ±4.2 | -1.9 | 2.5% | 119 | – |
| Clock In | purple | 1 | 1 | 0.5 [-1.3–2.5] | 0.6 | 0.8 [-2.0–3.7] | ±4.3 | -2.0 | 10.9% | 98 | -2.6 [-5.9–8.2] |
| Echo | echo | 1 | 1 | 0.4 [-2.3–3.5] | 0.5 | 0.6 [-3.4–5.2] | ±6.5 | -2.1 | 1.1% | 90 | -1.1 [-12.8–12.8] |
| Even Swap | red | 1 | 1 | 0.4 [-1.7–2.6] | 0.4 | 0.6 [-2.5–3.9] | ±4.8 | -2.1 | 0.0% | 142 | -3.0 [-6.9–7.8] |
| Snap Up | market | 1 | 1 | 0.4 [-1.2–2.0] | 0.4 | 0.5 [-1.9–2.9] | ±3.6 | -2.1 | 1.7% | 114 | 4.1 [-0.6–8.2] |
| Graft | green | 1 | 1 | 0.4 [-1.0–1.8] | 0.4 | 0.5 [-1.4–2.7] | ±3.1 | -2.1 | 1.4% | 137 | – |
| Harvest | yellow | 1 | 1 | 0.0 [-1.6–2.2] | 0.0 | 0.0 [-2.4–3.2] | ±4.3 | -2.5 | 0.0% | 100 | – |
| Roll Call | purple | 1 | 1 | -0.0 [-2.1–2.0] | -0.0 | -0.1 [-3.2–3.0] | ±4.6 | -2.5 | 0.0% | 101 | 9.1 [-1.6–11.8] |
| Catch Up | purple | 1 | 1 | -0.9 [-2.9–1.0] | -1.0 | -1.4 [-4.4–1.5] | ±4.5 | -3.4 | 0.0% | 97 | 1.4 [-4.9–9.5] |
| Cheap Seats | trading | 1 | 1 | -2.6 [-4.8–0.1] | -2.9 | -3.9 [-7.2–0.1] | ±5.5 | -5.1 | 0.0% | 102 | 1.0 [-4.3–6.1] |
| Lie Low | thieves | 1 | 2 | 6.4 [4.7–8.7] | 7.5 | 8.4 [6.1–11.3] | ±3.9 | 2.4 | 0.0% | 74 | 4.1 [2.1–6.3] |
| Shake Down | thieves | 2 | 2 | 6.1 [4.4–8.1] | 7.2 | 7.9 [5.7–10.5] | ±3.6 | 2.0 | 5.7% | 83 | 5.2 [3.2–7.8] |
| Grove | green | 2 | 2 | 5.7 [4.5–6.9] | 6.7 | 7.4 [5.8–8.9] | ±2.4 | 1.6 | 5.6% | 119 | 6.9 [5.2–9.2] |
| Clock In | purple | 1 | 2 | 5.6 [3.5–7.7] | 6.6 | 7.3 [4.6–10.0] | ±4.1 | 1.5 | 19.6% | 74 | – |
| Intro Offer | gold | 1 | 2 | 5.6 [3.8–7.6] | 6.5 | 7.2 [4.9–9.8] | ±3.7 | 1.5 | 0.0% | 115 | – |
| Hum | echo | 1 | 2 | 5.3 [3.7–6.7] | 6.2 | 6.9 [4.8–8.6] | ±2.9 | 1.2 | 0.0% | 105 | 0.7 [-2.7–3.6] |
| Toast | silver | 1 | 2 | 5.1 [2.8–7.0] | 5.9 | 6.6 [3.6–9.1] | ±4.2 | 1.0 | 19.5% | 107 | – |
| Help Yourself | thieves | 1 | 2 | 4.7 [2.5–6.9] | 5.5 | 6.1 [3.2–9.0] | ±4.4 | 0.6 | 0.8% | 122 | – |
| Top Up | yellow | 1 | 2 | 4.7 [2.6–6.6] | 5.5 | 6.1 [3.4–8.6] | ±3.9 | 0.6 | 3.3% | 88 | – |
| Harbor | blue | 2 | 2 | 4.5 [2.7–6.0] | 5.2 | 5.8 [3.6–7.8] | ±3.2 | 0.4 | 16.9% | 69 | – |
| Crime Wave | thieves | 2 | 2 | 4.5 [2.6–6.4] | 5.2 | 5.8 [3.3–8.3] | ±3.7 | 0.4 | 0.0% | 96 | – |
| Crescendo | echo | 1 | 2 | 4.2 [2.0–6.7] | 5.0 | 5.5 [2.6–8.7] | ±4.6 | 0.2 | 5.3% | 71 | 24.3 [1.9–31.0] |
| Shoal | blue | 1 | 2 | 4.2 [2.2–6.1] | 4.9 | 5.5 [2.9–7.9] | ±3.8 | 0.1 | 2.4% | 83 | – |
| Harvest | yellow | 1 | 2 | 4.2 [2.4–6.3] | 4.9 | 5.4 [3.1–8.2] | ±3.9 | 0.1 | 2.1% | 93 | – |
| Orchard | green | 2 | 2 | 4.2 [2.3–5.9] | 4.9 | 5.4 [3.0–7.6] | ±3.5 | 0.1 | 9.3% | 78 | – |
| Tide | blue | 1 | 2 | 4.1 [2.4–5.7] | 4.8 | 5.3 [3.2–7.3] | ±3.2 | -0.0 | 0.0% | 108 | – |
| Swell | blue | 2 | 2 | 4.0 [2.6–5.5] | 4.7 | 5.2 [3.3–7.1] | ±2.9 | -0.1 | 3.8% | 76 | – |
| Plan Ahead | purple | 2 | 2 | 3.9 [2.2–5.6] | 4.6 | 5.1 [2.9–7.3] | ±3.3 | -0.1 | 0.0% | 74 | – |
| Sell High | trading | 2 | 2 | 3.8 [1.6–6.0] | 4.4 | 4.9 [2.1–7.8] | ±4.4 | -0.3 | 5.6% | 84 | – |
| Name Drop | market | 1 | 2 | 3.6 [1.6–5.6] | 4.2 | 4.7 [2.1–7.2] | ±3.9 | -0.5 | 4.0% | 96 | – |
| Good Deed | silver | 1 | 2 | 3.6 [1.7–5.7] | 4.2 | 4.6 [2.2–7.3] | ±3.9 | -0.5 | 0.0% | 112 | – |
| Open House | red | 2 | 2 | 3.5 [1.5–5.3] | 4.1 | 4.5 [2.0–6.9] | ±3.7 | -0.6 | 1.7% | 113 | – |
| Collect Debts | gold | 2 | 2 | 3.5 [1.8–5.3] | 4.0 | 4.5 [2.3–6.9] | ±3.5 | -0.6 | 2.1% | 137 | – |
| Sprout | green | 1 | 2 | 3.4 [1.9–4.6] | 4.0 | 4.4 [2.4–6.0] | ±2.7 | -0.6 | 0.0% | 142 | – |
| Sweet Talk | silver | 2 | 2 | 3.3 [1.7–5.0] | 3.9 | 4.3 [2.2–6.4] | ±3.2 | -0.8 | 0.8% | 125 | – |
| Overtime | purple | 2 | 2 | 3.3 [0.9–5.4] | 3.9 | 4.3 [1.2–7.0] | ±4.4 | -0.8 | 0.0% | 74 | – |
| Graft | green | 1 | 2 | 3.2 [1.7–4.8] | 3.8 | 4.2 [2.1–6.3] | ±3.1 | -0.8 | 0.0% | 132 | – |
| Your Call | trading | 1 | 2 | 3.1 [1.2–4.8] | 3.6 | 4.0 [1.6–6.2] | ±3.5 | -1.0 | 2.6% | 74 | – |
| Golden Years | gold | 1 | 2 | 3.0 [1.6–4.7] | 3.5 | 3.9 [2.0–6.1] | ±3.1 | -1.0 | 3.5% | 137 | – |
| New Faces | market | 1 | 2 | 2.8 [0.2–5.2] | 3.3 | 3.7 [0.3–6.8] | ±4.9 | -1.2 | 0.0% | 83 | – |
| Snap Up | market | 1 | 2 | 2.8 [0.9–5.1] | 3.3 | 3.7 [1.1–6.6] | ±4.1 | -1.2 | 0.0% | 100 | – |
| Redistribute | thieves | 1 | 2 | 2.8 [1.1–4.6] | 3.3 | 3.6 [1.5–6.0] | ±3.4 | -1.3 | 0.0% | 100 | – |
| Reprise | echo | 2 | 2 | 2.7 [0.8–5.1] | 3.2 | 3.5 [1.0–6.7] | ±4.3 | -1.4 | 0.0% | 83 | – |
| Current | blue | 1 | 2 | 2.4 [0.5–4.3] | 2.8 | 3.1 [0.6–5.6] | ±3.7 | -1.7 | 0.0% | 85 | – |
| Kickback | gold | 1 | 2 | 2.1 [0.5–3.5] | 2.4 | 2.7 [0.7–4.5] | ±2.9 | -2.0 | 0.0% | 192 | – |
| Tithe | gold | 2 | 2 | 2.0 [0.4–3.6] | 2.4 | 2.6 [0.5–4.7] | ±3.2 | -2.0 | 0.0% | 123 | -13.3 [-18.9–7.7] |
| Cheap Seats | trading | 1 | 2 | 1.7 [-0.3–3.7] | 2.0 | 2.3 [-0.3–4.8] | ±3.9 | -2.3 | 0.0% | 67 | – |
| Dividend | trading | 2 | 2 | 1.6 [-0.2–3.5] | 1.9 | 2.1 [-0.2–4.5] | ±3.6 | -2.4 | 5.0% | 76 | – |
| Encore | echo | 2 | 2 | 1.6 [-0.1–3.4] | 1.9 | 2.1 [-0.2–4.4] | ±3.5 | -2.4 | 2.2% | 89 | – |
| Root | green | 1 | 2 | 1.6 [0.4–3.1] | 1.9 | 2.1 [0.5–4.0] | ±2.6 | -2.5 | 2.7% | 109 | – |
| Goody Bags | silver | 1 | 2 | 1.4 [-0.5–3.1] | 1.7 | 1.9 [-0.7–4.0] | ±3.5 | -2.6 | 1.0% | 104 | -2.9 [-7.6–8.7] |
| Echo | echo | 1 | 2 | 1.3 [-0.9–3.5] | 1.6 | 1.7 [-1.2–4.5] | ±4.3 | -2.7 | 3.3% | 87 | – |
| Rising Tide | silver | 2 | 2 | 1.3 [-0.8–3.1] | 1.6 | 1.7 [-1.0–4.1] | ±3.8 | -2.7 | 0.0% | 110 | -4.4 [-9.5–8.7] |
| Open Door | red | 1 | 2 | 1.3 [-0.2–2.9] | 1.5 | 1.7 [-0.3–3.7] | ±3.0 | -2.7 | 1.6% | 124 | – |
| Roll Call | purple | 1 | 2 | 1.2 [-0.5–3.0] | 1.5 | 1.6 [-0.7–3.9] | ±3.5 | -2.8 | 0.0% | 101 | – |
| Catch Up | purple | 1 | 2 | 1.2 [-0.9–3.0] | 1.4 | 1.5 [-1.1–3.9] | ±3.8 | -2.9 | 0.0% | 100 | – |
| Trade Seeds | yellow | 1 | 2 | 1.0 [-0.7–2.7] | 1.2 | 1.3 [-0.9–3.5] | ±3.3 | -3.1 | 0.0% | 99 | – |
| Potluck | yellow | 2 | 2 | 0.6 [-1.1–2.6] | 0.7 | 0.8 [-1.4–3.3] | ±3.6 | -3.5 | 0.0% | 81 | 0.7 [-1.9–4.3] |
| Sob Story | trading | 1 | 2 | 0.6 [-1.8–2.8] | 0.7 | 0.7 [-2.3–3.6] | ±4.4 | -3.5 | 10.3% | 96 | – |
| Branch Out | yellow | 2 | 2 | 0.5 [-1.0–2.3] | 0.6 | 0.7 [-1.3–3.0] | ±3.3 | -3.6 | 1.0% | 101 | 2.5 [-1.2–5.7] |
| Half Price | market | 2 | 2 | 0.2 [-1.5–1.9] | 0.2 | 0.2 [-1.9–2.4] | ±3.3 | -3.9 | 0.9% | 106 | 2.6 [0.4–5.2] |
| Even Swap | red | 1 | 2 | 0.1 [-1.3–1.5] | 0.1 | 0.1 [-1.7–1.9] | ±2.7 | -4.0 | 2.0% | 144 | – |
| Swap Sides | red | 2 | 2 | -0.1 [-1.8–1.6] | -0.1 | -0.1 [-2.3–2.1] | ±3.3 | -4.1 | 2.1% | 95 | 1.8 [-0.6–3.8] |
| Show Off | market | 2 | 2 | -0.2 [-2.8–2.6] | -0.3 | -0.3 [-3.6–3.4] | ±5.2 | -4.3 | 0.0% | 69 | 1.0 [-0.7–2.6] |
| Bandwagon | red | 1 | 2 | -0.5 [-2.3–1.0] | -0.6 | -0.7 [-3.0–1.3] | ±3.3 | -4.6 | 0.0% | 107 | -2.2 [-4.4–0.5] |
| Toast | silver | 1 | 3 | 8.0 [6.6–9.6] | 11.8 | 16.7 [13.7–20.0] | ±4.7 | 2.5 | 12.7% | 89 | 14.1 [9.0–19.2] |
| Crunch Time | purple | 3 | 3 | 7.7 [5.8–10.3] | 11.3 | 16.1 [12.1–21.5] | ±7.1 | 2.1 | 0.0% | 65 | 10.1 [6.0–13.1] |
| Dividend | trading | 2 | 3 | 7.0 [5.2–8.6] | 10.3 | 14.6 [10.9–18.0] | ±5.4 | 1.5 | 9.7% | 56 | 14.0 [8.6–20.7] |
| Lie Low | thieves | 1 | 3 | 6.2 [5.3–7.3] | 9.1 | 12.9 [11.2–15.2] | ±3.0 | 0.6 | 0.0% | 109 | 13.8 [11.1–17.5] |
| Rising Tide | silver | 2 | 3 | 6.2 [5.2–7.3] | 9.0 | 12.9 [10.8–15.3] | ±3.4 | 0.6 | 8.3% | 88 | 17.9 [7.2–27.8] |
| Help Yourself | thieves | 1 | 3 | 6.0 [4.4–7.6] | 8.8 | 12.5 [9.2–15.8] | ±5.0 | 0.4 | 0.0% | 83 | 8.6 [5.1–12.7] |
| Flood | blue | 3 | 3 | 5.9 [4.8–7.1] | 8.7 | 12.4 [10.0–14.8] | ±3.6 | 0.4 | 25.0% | 75 | -3.8 [-8.0–16.6] |
| Clock In | purple | 1 | 3 | 5.6 [4.1–6.9] | 8.2 | 11.7 [8.5–14.5] | ±4.5 | 0.1 | 8.9% | 82 | – |
| Crescendo | echo | 1 | 3 | 5.6 [4.1–6.9] | 8.2 | 11.7 [8.5–14.4] | ±4.4 | 0.1 | 9.6% | 75 | – |
| Bloom | green | 3 | 3 | 5.6 [4.3–6.6] | 8.2 | 11.6 [9.1–13.7] | ±3.5 | 0.0 | 22.0% | 78 | 15.1 [11.4–20.9] |
| Hand-pick | red | 3 | 3 | 5.2 [3.9–6.7] | 7.6 | 10.8 [8.1–14.0] | ±4.4 | -0.4 | 8.7% | 115 | 14.6 [9.6–19.7] |
| Your Call | trading | 1 | 3 | 5.0 [3.8–6.4] | 7.3 | 10.4 [7.9–13.3] | ±4.1 | -0.6 | 1.0% | 97 | – |
| Harbor | blue | 2 | 3 | 4.9 [3.5–6.1] | 7.2 | 10.3 [7.4–12.8] | ±4.1 | -0.6 | 0.0% | 83 | – |
| Golden Years | gold | 1 | 3 | 4.8 [3.6–6.1] | 7.1 | 10.1 [7.6–12.8] | ±4.0 | -0.7 | 8.5% | 129 | 12.9 [6.9–16.9] |
| Open Door | red | 1 | 3 | 4.4 [3.3–5.8] | 6.5 | 9.3 [6.9–12.1] | ±3.9 | -1.1 | 0.0% | 110 | 36.7 [9.9–43.9] |
| Intro Offer | gold | 1 | 3 | 4.4 [3.3–5.4] | 6.5 | 9.2 [6.9–11.3] | ±3.4 | -1.2 | 0.0% | 124 | – |
| Hold Court | silver | 3 | 3 | 4.3 [3.0–5.6] | 6.4 | 9.1 [6.2–11.7] | ±4.2 | -1.2 | 0.8% | 124 | – |
| Show Off | market | 2 | 3 | 4.3 [2.9–5.5] | 6.4 | 9.0 [6.0–11.6] | ±4.2 | -1.2 | 2.4% | 83 | – |
| Swell | blue | 2 | 3 | 4.3 [3.0–5.6] | 6.3 | 8.9 [6.3–11.6] | ±4.0 | -1.3 | 0.0% | 81 | – |
| Bumper Crop | yellow | 3 | 3 | 4.1 [2.7–5.7] | 6.1 | 8.7 [5.6–12.0] | ±4.8 | -1.4 | 6.3% | 60 | – |
| All In | trading | 3 | 3 | 4.1 [2.4–6.0] | 6.1 | 8.6 [5.0–12.6] | ±5.8 | -1.4 | 0.0% | 75 | – |
| Overtime | purple | 2 | 3 | 4.1 [2.5–5.7] | 6.0 | 8.5 [5.3–12.0] | ±5.0 | -1.5 | 0.0% | 64 | – |
| Poach | thieves | 3 | 3 | 3.9 [2.4–5.4] | 5.8 | 8.2 [5.0–11.3] | ±4.7 | -1.6 | 2.4% | 81 | – |
| Crime Wave | thieves | 2 | 3 | 3.9 [2.9–4.9] | 5.7 | 8.1 [6.1–10.3] | ±3.2 | -1.7 | 0.0% | 82 | – |
| Tide | blue | 1 | 3 | 3.9 [2.9–5.0] | 5.7 | 8.1 [6.0–10.4] | ±3.3 | -1.7 | 0.0% | 110 | – |
| Grove | green | 2 | 3 | 3.8 [2.6–5.1] | 5.6 | 8.0 [5.4–10.6] | ±4.0 | -1.7 | 0.0% | 113 | – |
| Double Down | gold | 3 | 3 | 3.7 [2.8–4.8] | 5.5 | 7.8 [5.8–10.1] | ±3.2 | -1.8 | 6.4% | 102 | – |
| Good Deed | silver | 1 | 3 | 3.7 [2.5–5.1] | 5.4 | 7.7 [5.2–10.8] | ±4.2 | -1.9 | 0.0% | 108 | – |
| Sell High | trading | 2 | 3 | 3.6 [2.2–5.1] | 5.3 | 7.5 [4.6–10.6] | ±4.6 | -1.9 | 0.9% | 112 | – |
| Tithe | gold | 2 | 3 | 3.6 [2.2–5.0] | 5.2 | 7.4 [4.6–10.5] | ±4.4 | -2.0 | 2.1% | 94 | -2.6 [-9.7–17.1] |
| Shake Down | thieves | 2 | 3 | 3.5 [2.0–4.6] | 5.1 | 7.3 [4.2–9.7] | ±4.1 | -2.1 | 0.0% | 68 | – |
| Name Drop | market | 1 | 3 | 3.4 [1.9–4.6] | 5.0 | 7.1 [4.0–9.5] | ±4.1 | -2.1 | 1.1% | 86 | 30.0 [9.9–36.2] |
| Sweet Talk | silver | 2 | 3 | 3.3 [2.2–4.4] | 4.9 | 7.0 [4.5–9.2] | ±3.5 | -2.2 | 1.6% | 120 | – |
| Reprise | echo | 2 | 3 | 3.3 [1.9–4.8] | 4.9 | 6.9 [4.0–10.1] | ±4.6 | -2.2 | 1.3% | 74 | – |
| Orchard | green | 2 | 3 | 3.3 [2.1–4.5] | 4.9 | 6.9 [4.3–9.5] | ±3.9 | -2.2 | 0.0% | 99 | – |
| Collect Debts | gold | 2 | 3 | 3.3 [2.2–4.4] | 4.8 | 6.8 [4.5–9.2] | ±3.5 | -2.3 | 0.0% | 127 | – |
| Hum | echo | 1 | 3 | 3.1 [2.0–4.5] | 4.6 | 6.5 [4.1–9.5] | ±4.1 | -2.4 | 0.0% | 107 | 17.0 [9.9–18.7] |
| Sob Story | trading | 1 | 3 | 3.1 [1.7–4.8] | 4.5 | 6.4 [3.6–10.0] | ±4.8 | -2.5 | 0.0% | 81 | – |
| Current | blue | 1 | 3 | 2.9 [1.8–4.1] | 4.3 | 6.1 [3.7–8.6] | ±3.7 | -2.6 | 0.0% | 97 | – |
| Open House | red | 2 | 3 | 2.8 [1.7–4.0] | 4.0 | 5.8 [3.5–8.3] | ±3.6 | -2.8 | 0.0% | 96 | -5.7 [-13.5–17.1] |
| Potluck | yellow | 2 | 3 | 2.6 [1.4–4.1] | 3.9 | 5.5 [2.9–8.6] | ±4.3 | -2.9 | 0.0% | 72 | – |
| Shoal | blue | 1 | 3 | 2.6 [1.4–3.8] | 3.9 | 5.5 [3.0–8.0] | ±3.8 | -2.9 | 0.0% | 101 | – |
| Plan Ahead | purple | 2 | 3 | 2.6 [1.5–4.0] | 3.9 | 5.5 [3.1–8.4] | ±4.0 | -2.9 | 0.0% | 88 | 2.9 [1.3–13.8] |
| Echo | echo | 1 | 3 | 2.6 [1.3–3.9] | 3.8 | 5.4 [2.6–8.1] | ±4.2 | -2.9 | 0.0% | 93 | – |
| Goody Bags | silver | 1 | 3 | 2.6 [1.0–4.1] | 3.8 | 5.4 [2.2–8.6] | ±4.9 | -3.0 | 0.0% | 118 | – |
| Greatest Hits | echo | 3 | 3 | 2.6 [1.2–4.0] | 3.8 | 5.3 [2.5–8.4] | ±4.5 | -3.0 | 0.0% | 75 | – |
| Harvest | yellow | 1 | 3 | 2.5 [1.7–3.5] | 3.7 | 5.3 [3.5–7.3] | ±2.8 | -3.0 | 0.9% | 111 | – |
| Even Swap | red | 1 | 3 | 2.5 [1.2–3.9] | 3.7 | 5.3 [2.5–8.1] | ±4.2 | -3.0 | 0.0% | 113 | – |
| Kickback | gold | 1 | 3 | 2.5 [1.3–3.9] | 3.7 | 5.2 [2.8–8.1] | ±4.0 | -3.0 | 0.0% | 153 | 18.9 [-0.9–28.6] |
| Top Up | yellow | 1 | 3 | 2.5 [1.1–4.0] | 3.7 | 5.2 [2.3–8.3] | ±4.6 | -3.0 | 0.0% | 81 | – |
| Redistribute | thieves | 1 | 3 | 2.5 [1.2–3.5] | 3.6 | 5.1 [2.6–7.2] | ±3.5 | -3.1 | 0.0% | 93 | – |
| Graft | green | 1 | 3 | 2.4 [1.7–3.3] | 3.6 | 5.1 [3.6–6.9] | ±2.5 | -3.1 | 0.0% | 134 | 4.3 [-1.3–17.1] |
| Sprout | green | 1 | 3 | 2.4 [1.6–3.3] | 3.5 | 5.0 [3.4–6.9] | ±2.7 | -3.2 | 0.0% | 130 | 8.4 [6.3–17.1] |
| Root | green | 1 | 3 | 2.4 [1.3–3.5] | 3.5 | 4.9 [2.7–7.3] | ±3.5 | -3.2 | 0.0% | 95 | – |
| Bandwagon | red | 1 | 3 | 2.1 [1.1–3.2] | 3.1 | 4.5 [2.3–6.6] | ±3.3 | -3.4 | 0.0% | 129 | -2.8 [-26.1–15.1] |
| Half Price | market | 2 | 3 | 2.1 [0.9–3.3] | 3.1 | 4.4 [1.9–7.0] | ±3.9 | -3.4 | 0.9% | 109 | – |
| New Faces | market | 1 | 3 | 1.8 [0.7–3.2] | 2.7 | 3.8 [1.4–6.7] | ±4.0 | -3.7 | 0.0% | 96 | – |
| Trade Seeds | yellow | 1 | 3 | 1.7 [0.6–3.0] | 2.5 | 3.6 [1.2–6.3] | ±3.8 | -3.8 | 0.0% | 83 | 0.3 [-6.0–17.1] |
| Swap Sides | red | 2 | 3 | 1.7 [0.5–2.9] | 2.5 | 3.5 [1.1–6.1] | ±3.8 | -3.9 | 0.0% | 107 | – |
| Snap Up | market | 1 | 3 | 1.6 [0.4–3.1] | 2.4 | 3.4 [0.7–6.5] | ±4.3 | -3.9 | 0.9% | 109 | – |
| Encore | echo | 2 | 3 | 1.3 [-0.2–3.0] | 1.9 | 2.8 [-0.3–6.3] | ±5.0 | -4.2 | 2.1% | 93 | – |
| Catch Up | purple | 1 | 3 | 1.2 [-0.1–2.7] | 1.8 | 2.5 [-0.2–5.6] | ±4.4 | -4.3 | 0.0% | 95 | 24.8 [10.4–28.9] |
| Branch Out | yellow | 2 | 3 | 1.0 [-0.5–2.3] | 1.4 | 2.0 [-1.0–4.8] | ±4.4 | -4.6 | 0.0% | 76 | -2.3 [-9.4–17.1] |
| Cheap Seats | trading | 1 | 3 | 0.9 [-0.5–2.4] | 1.3 | 1.9 [-1.1–5.0] | ±4.6 | -4.6 | 0.0% | 74 | – |
| Spree | market | 3 | 3 | 0.3 [-1.1–1.8] | 0.4 | 0.5 [-2.2–3.8] | ±4.5 | -5.3 | 0.0% | 90 | -1.9 [-4.8–0.9] |
| Roll Call | purple | 1 | 3 | -0.2 [-1.6–1.1] | -0.2 | -0.4 [-3.3–2.2] | ±4.2 | -5.7 | 0.0% | 70 | 6.0 [1.0–10.7] |

</details>

## 4. Archetypes
One scripted seat (rotating) against 3 bots, Classic table. Target band 15–35% (parity 25%). Scripts are built on Normal's valuation: the buyer never recruits; a specialist adds +3 to its sphere's spaces and +2 to its members; the chaser adds twice the round-end contest standing a move leaves it; the hoarder recruits whenever any member is affordable.

| archetype | vs | n | win [90%] | followers (rivals) | members (rivals) | |
|---|---|---|---|---|---|---|
| pure follower buyer | 3 Normal | 240 | 9.4% [6.7%–12.9%] | 53.0 (55.8) | 0.0 (8.1) | below band |
| pure follower buyer | 3 Hard-20 | 64 | 6.3% [2.8%–13.2%] | 49.3 (56.1) | 0.0 (6.9) | below band |
| member hoarder (recruits whenever it can) | 3 Normal | 240 | 7.5% [5.2%–10.8%] | 41.7 (55.8) | 13.6 (7.1) | below band |
| member hoarder (recruits whenever it can) | 3 Hard-20 | 64 | 1.6% [0.3%–6.7%] | 40.7 (56.3) | 14.1 (5.7) | below band |
| contest chaser (maximizes round-end leads) | 3 Normal | 240 | 13.1% [9.9%–17.1%] | 52.6 (56.9) | 7.8 (7.6) | edge |
| contest chaser (maximizes round-end leads) | 3 Hard-20 | 64 | 13.3% [7.8%–21.8%] | 50.0 (57.3) | 8.5 (6.3) | edge |
| Gold (gold) specialist | 3 Normal | 240 | 26.2% [21.8%–31.1%] | 57.6 (56.2) | 9.1 (7.4) |  |
| Gold (gold) specialist | 3 Hard-20 | 64 | 23.4% [15.9%–33.1%] | 54.6 (57.8) | 9.1 (6.4) |  |
| Red (red) specialist | 3 Normal | 240 | 23.8% [19.5%–28.5%] | 54.6 (55.6) | 9.6 (6.9) |  |
| Red (red) specialist | 3 Hard-20 | 64 | 18.8% [12.1%–28.0%] | 54.6 (57.1) | 10.0 (5.6) |  |
| Blue (market) specialist | 3 Normal | 240 | 17.6% [14.0%–22.0%] | 52.3 (57.0) | 9.5 (7.3) |  |
| Blue (market) specialist | 3 Hard-20 | 64 | 19.5% [12.7%–28.8%] | 53.9 (58.3) | 10.2 (6.1) |  |
| Green (echo) specialist | 3 Normal | 240 | 18.7% [14.9%–23.2%] | 53.6 (56.1) | 8.5 (7.5) |  |
| Green (echo) specialist | 3 Hard-20 | 64 | 15.6% [9.6%–24.5%] | 51.6 (56.4) | 8.7 (6.2) |  |

## 5. Fairness
Base games (no probes), random tables. Parity is 25%.
- Normal tables, 440 games. By seat: P1 24.3% [21.1%–27.8%], P2 25.7% [22.4%–29.2%], P3 25.2% [22.0%–28.8%], P4 24.8% [21.5%–28.3%]. By round-I pick order: 1st 25.7% [22.4%–29.2%], 2nd 27.7% [24.4%–31.4%], 3rd 23.2% [20.0%–26.6%], 4th 23.4% [20.3%–26.9%]. Round-III first pick (fewest followers) wins 9.8% [7.7%–12.4%]; last of the first pass 55.2% [51.3%–59.1%].
- Hard-20 tables, 68 games. By seat: P1 26.5% [18.7%–36.0%], P2 30.9% [22.5%–40.7%], P3 25.0% [17.4%–34.5%], P4 17.6% [11.3%–26.4%]. By round-I pick order: 1st 20.6% [13.7%–29.7%], 2nd 25.0% [17.4%–34.5%], 3rd 27.9% [20.0%–37.6%], 4th 26.5% [18.7%–36.0%]. Round-III first pick (fewest followers) wins 11.8% [6.8%–19.7%]; last of the first pass 54.4% [44.5%–64.0%].

## 6. Health
| | Normal (440 games) | Hard-20 (68 games) |
|---|---|---|
| members per player (target 6–7) | 5.0 ±2.6 sd (19.7% land on 6–7; 5.0 cards) | 4.3 ±2.5 sd (14.3% land on 6–7; 4.3 cards) |
| final followers | 55.4 | 49.7 |
| … self | 1.0 (1.8%) | 1.0 (2.0%) |
| … members' worth | 6.8 (12.2%) | 5.6 (11.2%) |
| … buys 2→1 / 4→3 / 8→6 / 10→10 | 0.5 / 1.0 / 1.8 / 25.5 (52.0%) | 0.9 / 2.1 / 2.1 / 20.2 (50.6%) |
| … contests round I / II / III | 2.7 / 5.2 / 7.8 (28.4%) | 2.7 / 5.3 / 8.0 (32.1%) |
| … effects (member triggers, actions, game end) | 3.1 (5.6%) | 2.0 (4.1%) |
| resources left at the end | 8.9 mean, 19.0 p90, 102 max (2.7% hold 30+) | 7.1 mean, 16.0 p90, 41 max (1.5% hold 30+) |
| contests that paid 2+ / 3+ tied leaders | 27.0% / 5.1% of 5242 | 29.4% / 5.1% of 807 |
| steal events per game (units taken) | 9.7 (15.5) | 15.3 (23.0) |
| longest run of placements by one player (the snake alone makes 2) | 2.2 mean, 6 max (13.0% of games have 3+) | 2.0 mean, 4 max (2.9% of games have 3+) |
| decision richness: top two within 1 follower | n/a (needs Hard rollouts) | 29.9% of 5725 weighed decisions (median gap 2.88) |

