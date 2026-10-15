# Balance bench (full)

2026-10-15 05:35 UTC · commit bc4b5d7 · content 3ai6ymhpf7.4091cbca95 · 71.1 min on 4 workers (280 core-min) · 38 random 4-sphere tables (makeTables 4242, every compatible pair at least twice), dealt round-robin.
Games played: 11338 full-game equivalents (probe games fork mid-game and count as the part they play). Throughput: Normal 66.1 games per core-minute, Hard-20 9.3 (all four seats that level).
Instruments: **Normal** (all four seats) and **Hard-20** (Hard = Normal plus rollouts, at budget 20, uncapped, deterministic). Intervals are 90% (bootstrap over seeds for fits, Wilson for win rates). Method and limits: design/eval/bench/README.md.

One run is one sample: flags near the line churn from run to run (two full runs on the same rules kept 5 of 14 card flags, while estimates moved only as far as their intervals predict). **Act on the pooled list in trend.md**, which combines every run on the same rules content.

## What moved since last run
Against 2026-10-15 04:06 (b00d4ac):
- Rules content changed (172abw70sp3.c0ce2b6fc1 → 3ai6ymhpf7.4091cbca95).
- Repriced: Proselytizer 12→6, Corner-Cutter 4→2, Lamplighter 8→12, Go-Between 8→4, Harmonist 8→4, Exporter 8→4.
- Anchor check: passed → failed.
- Cards: Overseer: Normal fair 5.7 → 0.9; Go-Getter: Normal fair 11.1 → 5.5; Midas: not flagged → flagged dear; Timekeeper: not flagged → flagged dear; Big Spender: not flagged → flagged dear; Tribute Band: flagged cheap → not flagged; Banker: not flagged → flagged dear; Bookkeeper: Normal fair 3.4 → 7.0; Straggler: not flagged → flagged dear; Investor: not flagged → flagged dear; Insider: not flagged → flagged dear; Taskmaster: Normal fair 7.3 → 2.5; Heiress: not flagged → flagged dear; Blue Hand: Normal fair 4.4 → 0.9; Extra Hand: not flagged → flagged dear; Upstart: flagged cheap → not flagged; Lender: flagged cheap → not flagged; Blue Elder: Normal fair 4.4 → 1.4; Go-Between: flagged dear → not flagged; Tax Collector: flagged cheap → not flagged; Patriarch: not flagged → flagged dear; Sponsor: not flagged → flagged dear; Desperado: flagged cheap → not flagged; Crew: flagged cheap → not flagged; Kingpin: flagged cheap → not flagged; Cutpurse: flagged cheap → not flagged; Talent Scout: not flagged → flagged dear; Patroness: not flagged → flagged dear; Snob: not flagged → flagged dear.
- Spaces: Clock In (round 3): strong → in; Clock In (round 2): in → strong; Cheap Seats (round 1): weak → in; Crunch Time (round 3): strong → in; Branch Out (round 2): weak → in; Toast (round 3): strong → in; Hand-pick (round 3): strong → in; Poach (round 3): strong → in; Plan Ahead (round 3): strong → in; Lie Low (round 2): in → strong; Spree (round 3): in → weak; Lie Low (round 3): strong → in.
- pure follower buyer vs 3 Normal: 17.1% → 10.0%.
- contest chaser (maximizes round-end leads) vs 3 Normal: 11.0% → 16.3%.

## 1. Anchors
**The instrument is off: every section below is untrusted until the anchors pass.**

- Price slope, followers of margin per extra cost point (the exchange rate for everything below): Normal 0.84 [0.80–0.89] (by fork round I/II/III: 0.87 [0.79–0.96], 0.95 [0.87–1.01], 0.71 [0.66–0.77]); Hard-20 0.76 [0.66–0.87] (by fork round I/II/III: 0.81 [0.51–1.00], 0.63 [0.43–0.92], 0.85 [0.69–1.00]). 
- Hard-20 alone vs 3 Normal (Classic, n=96): wins 27.1% [20.3%–35.1%]; parity is 25%, it must reach 32%. FAIL: the second instrument is no stronger than the first.

| instrument | anchor | printed | fair [90%] | n | expected | |
|---|---|---|---|---|---|---|
| Normal | Banker | 8 | 6.2 [5.0–7.5] | 429 | 4.5–10.5 | ok |
| Normal | Big Family | 4 | 3.9 [2.6–5.1] | 381 | 0.5–6.0 | ok |
| Normal | Sponsor | 10 | 7.4 [5.7–9.2] | 243 | 8.0–∞ | ok |
| Normal | Tycoon | 6 | 4.5 [3.5–5.8] | 399 | −∞–10.0 | ok |
| Hard-20 | Banker | 8 | 4.3 [1.5–7.5] | 73 | 4.5–10.5 | ok |
| Hard-20 | Big Family | 4 | 1.7 [-0.6–4.9] | 69 | 0.5–6.0 | ok |
| Hard-20 | Sponsor | 10 | -0.7 [-5.1–5.0] | 36 | 8.0–∞ | **OFF** |
| Hard-20 | Tycoon | 6 | 3.5 [0.2–7.9] | 79 | −∞–10.0 | ok |

- Banker ("Now and at round start, +3 gold"; 4, repriced to 8 in balance pass 1; the range is absolute). By arithmetic +9/+6/+3 gold by round recruited, ~7 averaged, plus a follower; the Normal sweep read 7.3 [6.3–8.3] recruited in round I.
- Big Family (4: "Worth 3 followers", no ability), the plain worth-N member: 3 followers ≈ 4 resources at 4→3, less the follower buy it displaces. The Normal sweep read 2.4 [0.6–3.6].
- Sponsor (10: "Your members cost 2 less"), rework-candidates #1, known strong: must read 8 or more (printed − 2).
- Tycoon ("Game end: +1 follower per 3 gold"), rework-candidates #3, known weak at its old 12: must read 10 or less (absolute; repriced to 6 in balance pass 1, so it no longer has to read under printed).

## 2. Cards — UNTRUSTED (anchor check failed)
Paired forced recruit: a private copy of the card, at printed −4 / printed / +4, recruited at the seat's first affordable buy from a random round on (I, II or III), against the same seed without it. Fair price = the price where it nets 0 followers of margin. Normal: 26372 probes over 440 seeds, every card. Hard-20: 2636 probes over 44 seeds, only the anchors and what Normal flags or reads ≥ 2.5 off (a card both must agree on can't be flagged by Hard alone). Flag = the 90% interval misses printed and the gap is ≥ 1.5, for BOTH instruments.

### Both instruments agree (15)
| card | printed | Normal fair [90%] n | Hard-20 fair [90%] n | reads | bought round |
|---|---|---|---|---|---|
| Patriarch (red) | 10 | 3.5 [0.8–5.8] 77 | 4.9 [1.1–9.4] 49 | too dear | 2.4 |
| Patroness (market) | 8 | 1.5 [-1.5–4.9] 71 | -0.6 [-3.5–2.2] 46 | too dear | 2.3 |
| Midas (gold) | 8 | 2.0 [-0.3–4.3] 144 | 3.2 [0.3–6.7] 78 | too dear | 2.3 |
| Snob (market) | 10 | 4.1 [1.1–7.3] 58 | 3.8 [0.3–8.8] 41 | too dear | 2.6 |
| Timekeeper (purple) | 8 | 2.6 [0.4–5.2] 78 | 3.6 [1.2–6.0] 35 | too dear | 2.5 |
| Talent Scout (market) | 4 | -1.2 [-3.5–0.6] 88 | -0.5 [-2.8–1.6] 61 | too dear | 2.3 |
| Insider (benders) | 6 | 1.7 [0.5–3.1] 282 | 1.7 [-0.7–3.9] 127 | too dear | 2.2 |
| Tinker (gold) | 6 | 10.2 [8.0–12.7] 126 | 12.7 [10.0–16.2] 70 | too cheap | 2.4 |
| Heiress (trading) | 10 | 6.1 [4.1–8.5] 88 | 3.0 [-1.4–7.7] 53 | too dear | 2.5 |
| Extra Hand (benders) | 10 | 6.3 [5.0–7.5] 294 | 6.6 [4.4–9.4] 125 | too dear | 2.3 |
| Big Spender (benders) | 4 | 0.5 [-0.6–1.6] 307 | 1.8 [-0.7–3.5] 132 | too dear | 2.1 |
| Investor (gold) | 6 | 2.7 [1.1–4.7] 138 | 1.8 [-1.4–4.6] 80 | too dear | 2.4 |
| Straggler (benders) | 8 | 5.0 [3.9–6.2] 283 | 3.1 [0.5–5.2] 125 | too dear | 2.2 |
| Sponsor (red) | 10 | 7.4 [5.7–9.2] 243 | -0.7 [-5.1–5.0] 36 | too dear | 2.4 |
| Banker (gold) | 8 | 6.2 [5.0–7.5] 429 | 4.3 [1.5–7.5] 73 | too dear | 2.3 |

### Needs an ability change, not a price (0)
None that both instruments agree on.

### Normal flags, Hard-20 confidently doesn't (likely a Normal-bot artifact) (3)
Liquidator 6 (Normal 1.4 [-0.8–3.8], Hard-20 4.5 [1.5–7.7]); Lookout 6 (Normal 9.3 [7.7–11.2], Hard-20 5.2 [0.7–9.2]); Kingpin 2 (Normal 6.6 [4.9–8.8], Hard-20 1.1 [-1.7–3.8]).

Normal flags, Hard-20 too thin or unsure to say: Overseer 4→0.9; Go-Getter 8→5.5; Benefactor 6→8.0; Tycoon 6→4.5 (Hard-20 3.5, n 79); Revelers 6→3.8; Hustler 2→5.7; Retinue 4→0.3 (Hard-20 3.0, n 49); Sleepwalker 6→9.3; Late Riser 6→4.0; Chronicler 8→2.3 (Hard-20 5.5, n 20); Groupie 8→2.9; Choir 6→3.3; Taskmaster 6→2.5 (Hard-20 3.1, n 40); Lender 2→4.9; Blue Devotee 4→1.5; Lamplighter 12→7.7; Blue Elder 4→1.4 (Hard-20 3.3, n 11); Patron Saint 6→4.0; Admirer 6→1.9 (Hard-20 3.7, n 34); Green Pillar 6→2.8 (Hard-20 8.0, n 23); Volunteer 0→2.9; Light Fingers 8→4.8 (Hard-20 6.4, n 28); Desperado 4→7.1; Crew 2→5.3; Crowd-Pleaser 2→5.6; Mole 4→6.4; Understudy 6→9.8; Double Agent 6→3.9; Extortionist 10→13.0; Translator 6→2.8; Safecracker 4→6.6; Sower 4→-0.3 (Hard-20 1.1, n 51); Mentor & Protégé 10→7.6; Mob 8→5.8; Rainmaker 6→3.2; Recruiter 8→5.2; Farmer 6→1.5; Explorer 8→4.3; Reseller 12→5.2 (Hard-20 7.6, n 26); Auctioneer 6→9.5; Gleaner 10→3.7 (Hard-20 7.5, n 31).

<details><summary>Every card (Normal; Hard-20 where measured)</summary>

| card | printed | Normal fair [90%] | n | detectable | net at printed by round I/II/III | Hard-20 fair [90%] | n |
|---|---|---|---|---|---|---|---|
| Kingpin (thieves.kingpin) | 2 | 6.6 [4.9–8.8] | 94 | ±3.0 | -2.1 / 3.4 / 1.8 | 1.1 [-1.7–3.8] | 45 |
| Tinker (gold.tinker) | 6 | 10.2 [8.0–12.7] | 126 | ±3.6 | 7.4 / 9.3 / 0.6 | 12.7 [10.0–16.2] | 70 |
| Understudy (echo.understudy) | 6 | 9.8 [7.0–12.0] | 79 | ±3.7 | -2.2 / 6.5 / -5.8 | – |  |
| Hustler (gold.hustler) | 2 | 5.7 [3.3–8.9] | 121 | ±4.2 | 1.3 / 4.1 / 1.2 | – |  |
| Crowd-Pleaser (red.crowd) | 2 | 5.6 [3.7–8.0] | 120 | ±3.2 | 8.5 / 0.7 / 4.0 | – |  |
| Auctioneer (market.auctioneer) | 6 | 9.5 [7.3–12.0] | 76 | ±3.6 | 9.3 / -0.1 / -7.7 | – |  |
| Crew (thieves.crew) | 2 | 5.3 [3.5–7.4] | 108 | ±3.0 | 0.9 / 2.9 / -1.8 | – |  |
| Lookout (thieves.lookout) | 6 | 9.3 [7.7–11.2] | 74 | ±2.7 | 4.0 / 7.6 / 4.3 | 5.2 [0.7–9.2] | 32 |
| Sleepwalker (echo.afterimage) | 6 | 9.3 [7.0–12.0] | 76 | ±3.7 | -3.3 / 3.5 / -2.4 | – |  |
| Desperado (thieves.desperado) | 4 | 7.1 [5.3–9.0] | 98 | ±2.7 | -0.3 / 4.0 / -1.2 | – |  |
| Extortionist (thieves.extortionist) | 10 | 13.0 [10.2–16.0] | 41 | ±4.4 | 5.1 / 1.2 / 1.1 | – |  |
| Volunteer (red.volunteer) | 0 | 2.9 [1.3–4.9] | 139 | ±2.7 | -3.5 / 4.8 / 4.9 | – |  |
| Lender (trading.lender) | 2 | 4.9 [2.6–7.0] | 98 | ±3.4 | 6.9 / 3.0 / -1.1 | – |  |
| Safecracker (thieves.bigscore) | 4 | 6.6 [4.9–8.4] | 96 | ±2.6 | 5.0 / 4.5 / 0.4 | – |  |
| Mole (thieves.mole) | 4 | 6.4 [4.5–8.2] | 108 | ±2.8 | 6.6 / 1.1 / 1.5 | – |  |
| Tipster (trading.tipster) | 6 | 8.2 [5.8–9.8] | 93 | ±3.0 | 2.6 / -1.9 / 8.6 | – |  |
| Benefactor (silver.benefactor) | 6 | 8.0 [6.1–10.2] | 147 | ±3.1 | 4.0 / 1.2 / -3.5 | – |  |
| Tribute Band (echo.dejavu) | 12 | 13.9 [10.2–16.7] | 47 | ±4.9 | 1.1 / -0.5 / -10.1 | – |  |
| Underdog (gold.underdog) | 6 | 7.9 [5.9–10.3] | 133 | ±3.3 | 0.4 / 1.7 / -3.4 | – |  |
| Recluse (market.recluse) | 4 | 5.6 [3.0–8.3] | 95 | ±4.1 | -5.8 / -2.2 / -2.1 | – |  |
| Grifter (thieves.grifter) | 6 | 7.6 [5.8–9.4] | 75 | ±2.8 | 0.1 / 11.4 / 1.2 | – |  |
| Shopkeeper (trading.shopkeeper) | 4 | 5.5 [3.5–7.5] | 95 | ±3.1 | 3.7 / 5.7 / 0.4 | – |  |
| Planner (market.planner) | 4 | 5.4 [2.9–8.5] | 85 | ±4.2 | 0.4 / -3.8 / -4.3 | – |  |
| Green Recruit (green.recruit) | 1 | 2.3 [0.6–3.9] | 151 | ±2.5 | -0.3 / 5.6 / 1.0 | – |  |
| Cutpurse (thieves.cutpurse) | 4 | 5.3 [3.4–7.1] | 117 | ±2.8 | -1.5 / 9.0 / -3.7 | – |  |
| Wallflower (echo.wallflower) | 4 | 5.3 [2.6–8.0] | 88 | ±4.1 | 8.7 / 13.2 / -0.2 | – |  |
| Green Helper (green.helper) | 2 | 3.2 [1.9–4.7] | 149 | ±2.1 | -5.2 / 0.3 / 2.1 | – |  |
| Bulk Buyer (trading.bulkbuyer) | 6 | 7.2 [4.6–9.9] | 91 | ±4.0 | -3.5 / -6.3 / -2.1 | – |  |
| Robin Hood (thieves.robinhood) | 4 | 5.0 [3.3–7.0] | 103 | ±2.8 | -0.8 / -1.9 / -3.8 | – |  |
| Bookkeeper (purple.bookkeeper) | 6 | 7.0 [4.9–8.9] | 88 | ±3.0 | -1.5 / 7.6 / 0.2 | – |  |
| Debutante (silver.gala) | 8 | 9.0 [6.2–11.7] | 136 | ±4.2 | -1.3 / -6.4 / 7.7 | – |  |
| Blue Recruit (blue.recruit) | 1 | 1.9 [0.7–3.5] | 127 | ±2.1 | 6.0 / 3.8 / 0.6 | – |  |
| Majordomo (silver.majordomo) | 6 | 6.9 [4.9–9.0] | 134 | ±3.0 | -0.6 / 2.4 / -0.0 | – |  |
| Benchwarmer (red.reserve) | 1 | 1.9 [-0.3–4.2] | 110 | ±3.4 | 1.4 / 2.4 / -0.6 | – |  |
| Corner-Cutter (purple.doubletime) | 2 | 2.8 [0.4–4.9] | 100 | ±3.4 | -0.4 / -4.6 / 6.2 | – |  |
| Raider (trading.raider) | 2 | 2.7 [1.0–4.8] | 89 | ±2.9 | -1.3 / -14.8 / 3.3 | – |  |
| Social Climber (market.climber) | 2 | 2.6 [0.3–4.7] | 86 | ±3.4 | -0.3 / -5.0 / -2.0 | – |  |
| Grand Host (silver.grandhost) | 12 | 12.5 [10.2–15.1] | 133 | ±3.7 | 2.2 / 8.9 / -4.0 | – |  |
| Curator (market.curator) | 4 | 4.4 [2.2–6.9] | 99 | ±3.5 | 0.1 / -4.5 / 4.1 | – |  |
| Connoisseur (market.connoisseur) | 4 | 4.4 [2.3–6.7] | 99 | ±3.3 | 4.7 / 7.8 / -1.8 | – |  |
| Accomplice (thieves.accomplice) | 8 | 8.4 [6.3–10.6] | 87 | ±3.2 | 4.7 / 1.3 / -7.1 | – |  |
| Pilgrim (yellow.pilgrim) | 4 | 4.4 [2.6–6.4] | 90 | ±2.8 | 6.7 / 0.5 / 0.7 | – |  |
| Treasurer (gold.seed) | 4 | 4.4 [2.5–6.1] | 129 | ±2.8 | -5.1 / 4.8 / 1.0 | – |  |
| Gardener (yellow.gardener) | 2 | 2.4 [0.1–4.4] | 67 | ±3.3 | 3.8 / 4.3 / 3.5 | – |  |
| Dealer (trading.dealer) | 2 | 2.3 [0.1–4.5] | 97 | ±3.3 | 5.2 / 4.9 / 3.9 | – |  |
| Front-runner (benders.frontrunner) | 2 | 2.3 [1.1–3.6] | 309 | ±1.9 | 1.9 / 2.0 / 4.2 | – |  |
| Underbidder (market.underbidder) | 2 | 2.3 [-0.1–4.4] | 91 | ±3.4 | 5.3 / -2.0 / 2.2 | – |  |
| Clockmaker (purple.clockmaker) | 4 | 4.2 [2.3–6.1] | 96 | ±2.9 | 2.6 / 3.6 / -2.1 | – |  |
| Minimalist (market.minimalist) | 2 | 2.2 [0.0–4.7] | 90 | ±3.5 | -2.6 / 3.6 / -1.5 | – |  |
| Go-Between (yellow.gobetween) | 4 | 4.1 [1.1–6.7] | 90 | ±4.2 | -1.7 / 0.8 / -1.4 | – |  |
| Speculator (gold.speculator) | 8 | 8.0 [6.1–10.2] | 134 | ±3.1 | 2.3 / -3.8 / 7.2 | – |  |
| Steward (silver.steward) | 4 | 4.0 [2.2–6.1] | 150 | ±2.9 | 2.0 / 1.9 / -0.7 | – |  |
| Intern (red.intern) | 1 | 1.0 [-0.7–2.5] | 128 | ±2.4 | -7.3 / 1.1 / -2.5 | – |  |
| Green Regular (green.regular) | 3 | 2.9 [1.4–4.3] | 154 | ±2.2 | -0.6 / -2.8 / 0.0 | – |  |
| Weaver (yellow.weaver) | 6 | 5.9 [2.8–8.7] | 60 | ±4.5 | 9.5 / -4.9 / 3.6 | – |  |
| Feastmaker (yellow.feastmaker) | 10 | 9.9 [6.5–13.0] | 48 | ±4.9 | 4.3 / 1.8 / 3.5 | – |  |
| Heir (silver.heir) | 8 | 7.9 [5.9–9.7] | 140 | ±2.9 | -3.1 / -3.5 / -2.6 | – |  |
| Guest (silver.guest) | 8 | 7.9 [6.2–10.0] | 149 | ±2.8 | 5.7 / -0.9 / 0.1 | – |  |
| Magnate (trading.magnate) | 4 | 3.9 [2.1–5.5] | 97 | ±2.5 | -2.2 / -2.0 / 6.2 | – |  |
| Silversmith (silver.silversmith) | 6 | 5.9 [4.3–7.9] | 138 | ±2.7 | 3.0 / -3.3 / 1.3 | – |  |
| Big Family (red.bigfamily) | 4 | 3.9 [2.6–5.1] | 381 | ±1.9 | -0.5 / -2.3 / -1.5 | 1.7 [-0.6–4.9] | 69 |
| Rich Uncle (trading.safetynet) | 2 | 1.8 [-0.3–4.2] | 96 | ±3.4 | -2.3 / 6.0 / 0.1 | – |  |
| Squatter (benders.squatter) | 8 | 7.7 [6.5–9.1] | 246 | ±2.0 | -3.1 / -3.0 / -0.4 | – |  |
| Upstart (silver.spoon) | 6 | 5.7 [4.0–7.5] | 134 | ±2.7 | 8.0 / -3.0 / 6.5 | – |  |
| Stylist (market.stylist) | 4 | 3.7 [1.1–6.3] | 84 | ±3.9 | 3.2 / 3.9 / -3.7 | – |  |
| Foreman (purple.foreman) | 6 | 5.7 [3.4–7.8] | 115 | ±3.4 | 2.7 / 0.1 / -3.8 | – |  |
| Reinvestor (trading.reinvestor) | 4 | 3.7 [0.7–5.9] | 90 | ±3.9 | 4.1 / 0.5 / -2.8 | – |  |
| Host (red.host) | 6 | 5.6 [3.0–8.5] | 91 | ±4.1 | 5.0 / -9.9 / 1.6 | – |  |
| Doppelganger (red.doppel) | 6 | 5.6 [3.3–7.7] | 98 | ±3.4 | -4.0 / 6.3 / 1.8 | – |  |
| Bodyguard (thieves.watchdog) | 6 | 5.6 [3.5–7.9] | 78 | ±3.3 | 2.4 / -6.3 / 4.5 | – |  |
| Shift Crew (purple.crew) | 2 | 1.6 [-0.4–3.7] | 95 | ±3.1 | -6.8 / 6.3 / 7.6 | – |  |
| Blue Helper (blue.helper) | 2 | 1.6 [0.0–3.4] | 114 | ±2.6 | -0.4 / -3.9 / -2.5 | – |  |
| Dyer (yellow.dyer) | 6 | 5.6 [3.1–7.8] | 59 | ±3.6 | 1.9 / -3.8 / -7.1 | – |  |
| Prospector (gold.prospector) | 4 | 3.5 [1.6–5.6] | 148 | ±3.1 | 6.8 / -4.8 / -1.8 | – |  |
| Exporter (trading.exporter) | 4 | 3.5 [1.1–6.0] | 77 | ±3.7 | -17.7 / -2.9 / 0.7 | – |  |
| Impressionist (echo.tuningfork) | 4 | 3.4 [1.5–5.8] | 93 | ±3.2 | 3.8 / 0.1 / 8.6 | – |  |
| Green Hand (green.hand) | 2 | 1.4 [-0.3–2.9] | 156 | ±2.4 | -2.7 / 0.9 / 2.2 | – |  |
| Twins (red.twins) | 2 | 1.4 [-0.6–3.3] | 137 | ±3.0 | -7.5 / -0.5 / 5.1 | – |  |
| Errand Runner (purple.errand) | 8 | 7.4 [5.7–9.6] | 99 | ±3.0 | 4.5 / 1.9 / -5.0 | – |  |
| Late Bloomer (yellow.latebloomer) | 4 | 3.4 [1.4–5.2] | 77 | ±2.9 | 2.9 / 7.4 / 3.1 | – |  |
| Peddler (yellow.peddler) | 8 | 7.3 [4.3–10.0] | 63 | ±4.3 | 2.9 / -7.8 / -1.4 | – |  |
| Dowager (silver.dowager) | 4 | 3.3 [1.4–5.1] | 141 | ±2.8 | -7.8 / -1.7 / 3.2 | – |  |
| Toastmaster (silver.toastmaster) | 4 | 3.3 [1.4–5.2] | 132 | ±2.9 | 0.5 / -1.6 / -4.2 | – |  |
| Pied Piper (red.drive) | 4 | 3.3 [1.6–5.3] | 125 | ±2.8 | -5.8 / 5.9 / 1.7 | – |  |
| Pawnbroker (trading.pawnbroker) | 4 | 3.3 [1.1–5.2] | 107 | ±3.1 | 2.4 / 8.1 / 1.3 | – |  |
| Penny Pincher (gold.thrift) | 4 | 3.2 [1.4–4.9] | 145 | ±2.7 | 0.2 / -2.3 / -4.4 | – |  |
| Middleman (gold.coinpurse) | 4 | 3.1 [1.4–4.8] | 146 | ±2.6 | -4.0 / -5.0 / -0.6 | – |  |
| Sommelier (market.sommelier) | 4 | 3.1 [1.3–5.0] | 82 | ±2.8 | 4.4 / -4.2 / 3.7 | – |  |
| Green Patron (green.patron) | 6 | 5.0 [3.3–6.5] | 139 | ±2.4 | 0.2 / -1.4 / 2.4 | – |  |
| Merchant (gold.merchant) | 6 | 5.0 [2.8–7.1] | 122 | ±3.2 | -1.1 / 3.1 / -2.4 | – |  |
| Blue Hand (blue.hand) | 2 | 0.9 [-1.1–2.8] | 131 | ±3.0 | 1.7 / 4.2 / -4.7 | – |  |
| Green Elder (green.elder) | 4 | 2.9 [1.4–4.6] | 142 | ±2.4 | -3.8 / 1.1 / -0.7 | – |  |
| Stunt Double (echo.hourglass) | 10 | 8.9 [5.9–11.8] | 75 | ±4.4 | -3.4 / 4.5 / -0.5 | – |  |
| Shareholder (trading.shareholder) | 3 | 1.9 [-0.3–4.2] | 85 | ±3.4 | -9.8 / 3.9 / 4.0 | – |  |
| Proselytizer (red.proselytizer) | 6 | 4.8 [2.9–7.1] | 117 | ±3.1 | 3.4 / 1.2 / -7.0 | – |  |
| Freelancer (benders.freelancer) | 4 | 2.8 [1.6–4.0] | 307 | ±1.8 | 3.8 / -2.2 / 0.4 | – |  |
| Tax Collector (gold.taxman) | 4 | 2.7 [1.1–4.3] | 146 | ±2.4 | 2.8 / -1.4 / 2.3 | – |  |
| Onlooker (market.onlooker) | 10 | 8.7 [6.4–11.3] | 64 | ±3.7 | -5.3 / 2.5 / 1.6 | – |  |
| Green Devotee (green.devotee) | 4 | 2.7 [1.1–4.3] | 151 | ±2.3 | 0.8 / 0.5 / 1.4 | – |  |
| Lottery Winner (gold.jackpot) | 10 | 8.7 [6.2–10.8] | 129 | ±3.5 | 1.6 / 6.2 / 2.0 | – |  |
| Apprentice (purple.apprentice) | 4 | 2.7 [0.8–4.8] | 104 | ±3.0 | -0.9 / -7.8 / 1.9 | – |  |
| Blue Pillar (blue.pillar) | 6 | 4.7 [3.2–6.1] | 118 | ±2.2 | -3.7 / -1.7 / -2.1 | – |  |
| Busker (echo.evergreen) | 8 | 6.5 [3.0–9.7] | 69 | ±5.0 | -4.4 / 2.3 / 1.6 | – |  |
| Tycoon (gold.tycoon) | 6 | 4.5 [3.5–5.8] | 399 | ±1.7 | -1.4 / -0.7 / 0.4 | 3.5 [0.2–7.9] | 79 |
| Muse (echo.muse) | 4 | 2.5 [0.5–4.8] | 96 | ±3.3 | -4.5 / 0.4 / -7.9 | – |  |
| Broker (trading.broker) | 2 | 0.4 [-1.4–2.4] | 93 | ±2.9 | 2.6 / 0.4 / -1.7 | – |  |
| Blue Regular (blue.regular) | 3 | 1.4 [-0.3–3.0] | 125 | ±2.5 | 1.8 / -3.0 / -1.3 | – |  |
| Night Owl (purple.nightowl) | 10 | 8.4 [6.1–10.4] | 69 | ±3.3 | -1.0 / -2.0 / -1.2 | – |  |
| Sticky Fingers (thieves.sticky) | 8 | 6.3 [4.5–8.1] | 74 | ±2.7 | 2.5 / 1.1 / -6.0 | – |  |
| Banker (gold.banker) | 8 | 6.2 [5.0–7.5] | 429 | ±1.9 | 0.2 / -0.9 / -3.4 | 4.3 [1.5–7.5] | 73 |
| Caterer (silver.caterer) | 4 | 2.1 [0.4–4.0] | 143 | ±2.8 | -6.3 / -0.1 / -1.4 | – |  |
| Blue Patron (blue.patron) | 6 | 4.1 [2.2–6.0] | 107 | ±2.9 | 0.9 / -1.3 / 0.1 | – |  |
| Courier (purple.courier) | 6 | 4.1 [2.1–6.4] | 88 | ±3.2 | 3.3 / -0.9 / -0.4 | – |  |
| Mime (echo.mirror) | 6 | 4.0 [1.2–7.0] | 87 | ±4.3 | -5.4 / 4.5 / 5.1 | – |  |
| Patron Saint (silver.saint) | 6 | 4.0 [2.0–5.7] | 140 | ±2.8 | -0.2 / -1.0 / 4.0 | – |  |
| Late Riser (purple.lateriser) | 6 | 4.0 [2.3–5.9] | 97 | ±2.7 | 5.1 / -4.0 / -0.2 | – |  |
| Double Agent (thieves.doubleagent) | 6 | 3.9 [1.8–6.0] | 82 | ±3.1 | -0.4 / -4.5 / -1.9 | – |  |
| Revelers (silver.revelers) | 6 | 3.8 [1.9–5.8] | 138 | ±2.9 | -4.6 / 1.4 / 0.3 | – |  |
| Mob (red.mob) | 8 | 5.8 [3.7–7.8] | 97 | ±3.1 | 4.2 / -2.3 / -4.3 | – |  |
| Harmonist (yellow.harmonist) | 4 | 1.7 [-0.4–4.2] | 68 | ±3.5 | 3.1 / -5.8 / -6.0 | – |  |
| Ensemble (echo.ensemble) | 6 | 3.6 [1.4–6.2] | 81 | ±3.6 | -5.5 / 3.0 / -2.9 | – |  |
| Mentor & Protégé (red.mentor) | 10 | 7.6 [5.4–9.6] | 75 | ±3.2 | 3.9 / 2.7 / 5.2 | – |  |
| Go-Getter (purple.secondwind) | 8 | 5.5 [3.6–7.3] | 90 | ±2.7 | -7.6 / 3.4 / -1.8 | – |  |
| Blue Devotee (blue.devotee) | 4 | 1.5 [-0.0–3.1] | 118 | ±2.4 | -1.5 / -1.7 / 0.4 | – |  |
| Sponsor (red.sponsor) | 10 | 7.4 [5.7–9.2] | 243 | ±2.6 | -0.8 / 4.4 / -6.5 | -0.7 [-5.1–5.0] | 36 |
| Blue Elder (blue.elder) | 4 | 1.4 [-0.0–2.9] | 125 | ±2.2 | -1.9 / -5.0 / -1.7 | 3.3 [-0.1–8.2] | 11 |
| Choir (echo.choir) | 6 | 3.3 [1.2–5.4] | 88 | ±3.2 | -4.6 / -2.2 / 3.5 | – |  |
| Recruiter (red.recruiter) | 8 | 5.2 [3.3–7.5] | 102 | ±3.2 | 1.2 / 5.5 / -4.7 | – |  |
| Rainmaker (yellow.rainmaker) | 6 | 3.2 [0.9–5.5] | 71 | ±3.5 | 7.6 / -4.4 / -1.7 | – |  |
| Straggler (benders.straggler) | 8 | 5.0 [3.9–6.2] | 283 | ±1.7 | -3.3 / 2.1 / -3.2 | 3.1 [0.5–5.2] | 125 |
| Overseer (purple.overseer) | 4 | 0.9 [-1.0–2.8] | 108 | ±2.8 | -3.7 / -4.2 / -0.7 | – |  |
| Light Fingers (thieves.lightfingers) | 8 | 4.8 [3.2–6.4] | 85 | ±2.4 | -3.6 / 4.3 / -3.0 | 6.4 [3.5–8.7] | 28 |
| Translator (echo.translator) | 6 | 2.8 [0.8–4.9] | 92 | ±3.1 | -4.9 / -0.7 / -2.7 | – |  |
| Green Pillar (green.pillar) | 6 | 2.8 [1.4–4.3] | 141 | ±2.2 | -3.3 / -6.3 / 1.5 | 8.0 [1.0–16.3] | 23 |
| Investor (gold.investor) | 6 | 2.7 [1.1–4.7] | 138 | ±2.7 | -7.4 / -3.8 / -1.7 | 1.8 [-1.4–4.6] | 80 |
| Big Spender (benders.bigspender) | 4 | 0.5 [-0.6–1.6] | 307 | ±1.7 | 0.3 / -2.4 / -1.7 | 1.8 [-0.7–3.5] | 132 |
| Taskmaster (purple.taskmaster) | 6 | 2.5 [0.4–4.4] | 95 | ±3.1 | -4.8 / -4.1 / 1.6 | 3.1 [-1.0–7.9] | 40 |
| Extra Hand (benders.extrahand) | 10 | 6.3 [5.0–7.5] | 294 | ±1.9 | -1.5 / -2.1 / -4.0 | 6.6 [4.4–9.4] | 125 |
| Explorer (yellow.explorer) | 8 | 4.3 [1.9–6.5] | 63 | ±3.5 | -5.8 / -5.3 / 1.3 | – |  |
| Retinue (silver.retinue) | 4 | 0.3 [-1.4–2.1] | 144 | ±2.6 | -2.8 / -4.3 / 1.7 | 3.0 [0.1–6.8] | 49 |
| Heiress (trading.heiress) | 10 | 6.1 [4.1–8.5] | 88 | ±3.3 | -13.0 / -2.0 / -1.6 | 3.0 [-1.4–7.7] | 53 |
| Admirer (yellow.admirer) | 6 | 1.9 [-0.2–4.1] | 57 | ±3.2 | -6.8 / -7.6 / -5.1 | 3.7 [-0.6–8.8] | 34 |
| Sower (yellow.sower) | 4 | -0.3 [-2.6–2.2] | 82 | ±3.6 | -6.9 / -3.4 / 0.7 | 1.1 [-2.7–5.1] | 51 |
| Insider (benders.insider) | 6 | 1.7 [0.5–3.1] | 282 | ±1.9 | -3.1 / -5.8 / -2.5 | 1.7 [-0.7–3.9] | 127 |
| Lamplighter (purple.lamplighter) | 12 | 7.7 [4.6–10.5] | 45 | ±4.5 | -4.7 / 0.7 / -3.2 | – |  |
| Farmer (yellow.farmer) | 6 | 1.5 [-1.3–4.2] | 56 | ±4.1 | -8.2 / -8.4 / -3.1 | – |  |
| Liquidator (trading.liquidator) | 6 | 1.4 [-0.8–3.8] | 84 | ±3.5 | -3.4 / -1.9 / -0.6 | 4.5 [1.5–7.7] | 61 |
| Groupie (echo.groupie) | 8 | 2.9 [0.2–6.4] | 75 | ±4.7 | -2.8 / -9.5 / -10.2 | – |  |
| Talent Scout (market.blackmarket) | 4 | -1.2 [-3.5–0.6] | 88 | ±3.1 | 1.3 / -7.7 / -5.5 | -0.5 [-2.8–1.6] | 61 |
| Timekeeper (purple.patience) | 8 | 2.6 [0.4–5.2] | 78 | ±3.6 | -9.2 / -8.9 / 0.1 | 3.6 [1.2–6.0] | 35 |
| Chronicler (echo.chronicler) | 8 | 2.3 [-0.2–5.3] | 85 | ±4.2 | -3.8 / -13.2 / 6.9 | 5.5 [-0.4–12.4] | 20 |
| Snob (market.snob) | 10 | 4.1 [1.1–7.3] | 58 | ±4.7 | -3.0 / -5.9 / -3.0 | 3.8 [0.3–8.8] | 41 |
| Midas (gold.midas) | 8 | 2.0 [-0.3–4.3] | 144 | ±3.5 | -7.2 / -2.3 / -0.8 | 3.2 [0.3–6.7] | 78 |
| Gleaner (yellow.gleaner) | 10 | 3.7 [0.5–6.4] | 45 | ±4.5 | 2.8 / -18.3 / -23.8 | 7.5 [2.2–12.9] | 31 |
| Patroness (market.patroness) | 8 | 1.5 [-1.5–4.9] | 71 | ±4.8 | -8.6 / -4.1 / 3.6 | -0.6 [-3.5–2.2] | 46 |
| Patriarch (red.patriarch) | 10 | 3.5 [0.8–5.8] | 77 | ±3.8 | -6.4 / -7.9 / -2.5 | 4.9 [1.1–9.4] | 49 |
| Reseller (market.reseller) | 12 | 5.2 [2.1–8.3] | 52 | ±4.7 | -8.2 / -13.7 / -8.8 | 7.6 [2.8–13.0] | 26 |

</details>

Power: for the 98 cards Normal reads in band, the smallest gap this run could have caught (80% power, 90% interval) is 3.1 cost points at the median card, 4.2 at the 90th percentile (column "detectable" in the full table). More seeds narrow it as 1/√n.

## 2b. Card × sphere and space × sphere outliers — UNTRUSTED (anchor check failed)
Normal's residuals on the tables where the seat held the item, grouped by each other sphere at the table: a card fine overall but off beside one sphere. Listed at |deviation| ≥ 3 cost points (spaces: 3 scaled u) and |z| ≥ 3.5 among 1368 card × sphere and 1351 space × sphere pairs with n ≥ 15 (about one false alarm expected). Hard-20 beside it where its targets covered the pair.

Cards: none.

| space | beside | deviation [90%] | n | Hard-20 |
|---|---|---|---|---|
| Bandwagon r2 | Blue (blue) | -5.5 ±2.3 u | 30 | – |

## 3. Spaces — UNTRUSTED (anchor check failed)
Paired forced placement: from the start of round r, the seat's first minion must take the space (base: the bot's own choice). A "null" minion (bot's own choice, action does nothing) in every game gives the zero, so worth = followers of margin over a minion that does nothing; u = worth ÷ that round's price slope (Normal 0.87 / 0.95 / 0.71, Hard-20 0.81 / 0.63 / 0.85 followers per resource, rounds I / II / III). Raw u also counts the buy a placement enables and early compounding, so it runs high; scaled u sets each round's median space to the middle of its band (×1.52 / 1.26 / 1.58 for rounds I / II / III) and says where a space sits among its round's field on the value model's ruler (round I 2–3u, II 3–5u, III 5–9u). Flag, on scaled u: above the band in any round, below it in the space's own ring's round, or worth below 0. "vs choice" = against the bot's own pick (≤ 0 means the bot was right to skip it). Blocked = a rival took it first.
Normal's own pick is worth 2.9 followers in round 1, 4.2 followers in round 2, 6.4 followers in round 3 over a null minion (3.4u / 4.4u / 9.0u).

### Both instruments agree (3)
| space | ring | round | Normal scaled u [90%] n | Hard-20 scaled u [90%] n | band | reads |
|---|---|---|---|---|---|---|
| Clock In (purple) | 1 | 2 | 8.7 [6.0–11.5] 69 | 12.2 [7.2–19.4] 34 | 3–5 | strong |
| Lie Low (thieves) | 1 | 2 | 8.3 [6.1–11.0] 88 | 11.5 [8.8–17.2] 50 | 3–5 | strong |
| Spree (market) | 3 | 3 | 1.3 [-1.7–4.5] 71 | 1.5 [-1.9–4.2] 57 | 5–9 | weak |

### Normal flags, Hard-20 confidently doesn't (likely a Normal-bot artifact) (1)
Toast r3 (Normal 21.3 [18.6–24.6], Hard-20 15.1 [5.2–21.3] scaled u).

Normal flags, Hard-20 too thin or unsure to say: Golden Years r3 strong (12.0u; Hard-20 13.8u, n 59); Cheap Seats r1 weak (-7.7u; Hard-20 -3.0u, n 49); Dividend r3 strong (13.3u; Hard-20 10.5u, n 50); Hand-pick r3 strong (12.9u; Hard-20 10.4u, n 55); Golden Years r2 strong (7.9u; Hard-20 4.6u, n 70); Crime Wave r2 strong (6.7u; Hard-20 6.4u, n 53).

Power: for the 144 space-rounds Normal reads in band, the smallest miss this run could have caught is 4.2 scaled u at the median, 5.8 at the 90th percentile (column "detectable").

<details><summary>Every space and round (Normal; Hard-20 where measured)</summary>

| space | sphere | ring | round | worth (followers) [90%] | raw u | scaled u [90%] | detectable | vs choice | blocked | n | Hard-20 scaled u [90%] |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Top Up | yellow | 1 | 1 | 3.6 [1.3–6.0] | 4.2 | 6.3 [2.3–10.5] | ±6.1 | 0.7 | 32.9% | 51 | 6.4 [-1.3–14.8] |
| Crescendo | echo | 1 | 1 | 3.5 [1.2–5.7] | 4.0 | 6.1 [2.2–10.0] | ±5.9 | 0.6 | 0.0% | 96 | -0.8 [-8.4–8.8] |
| Good Deed | silver | 1 | 1 | 3.4 [1.3–5.4] | 3.9 | 6.0 [2.2–9.3] | ±5.3 | 0.5 | 3.2% | 121 | 5.3 [-0.5–9.3] |
| Name Drop | market | 1 | 1 | 3.4 [1.3–6.2] | 3.9 | 5.9 [2.2–10.9] | ±6.6 | 0.4 | 14.8% | 75 | 1.5 [-5.6–6.3] |
| Open Door | red | 1 | 1 | 3.3 [1.4–5.6] | 3.8 | 5.8 [2.4–9.7] | ±5.5 | 0.4 | 7.1% | 105 | 4.7 [-0.6–11.3] |
| Kickback | gold | 1 | 1 | 3.1 [1.5–4.6] | 3.6 | 5.4 [2.6–8.1] | ±4.1 | 0.2 | 8.7% | 147 | 9.1 [4.7–15.0] |
| Trade Seeds | yellow | 1 | 1 | 2.8 [0.1–5.1] | 3.2 | 4.8 [0.2–8.9] | ±6.6 | -0.2 | 0.0% | 83 | -4.3 [-6.8–4.4] |
| Intro Offer | gold | 1 | 1 | 2.7 [0.7–4.7] | 3.0 | 4.6 [1.2–8.2] | ±5.3 | -0.3 | 0.0% | 130 | – |
| Your Call | trading | 1 | 1 | 2.6 [0.4–4.9] | 3.0 | 4.6 [0.8–8.5] | ±5.8 | -0.3 | 0.0% | 77 | – |
| Hum | echo | 1 | 1 | 2.5 [0.0–4.5] | 2.8 | 4.3 [0.0–7.9] | ±5.9 | -0.5 | 10.3% | 96 | – |
| Lie Low | thieves | 1 | 1 | 2.3 [0.6–4.1] | 2.7 | 4.0 [1.0–7.2] | ±4.7 | -0.6 | 0.0% | 87 | – |
| New Faces | market | 1 | 1 | 2.2 [0.1–4.3] | 2.5 | 3.9 [0.2–7.5] | ±5.5 | -0.7 | 2.1% | 95 | 16.8 [-5.3–27.3] |
| Shoal | blue | 1 | 1 | 2.1 [-0.2–4.3] | 2.4 | 3.6 [-0.4–7.5] | ±6.0 | -0.8 | 14.4% | 77 | – |
| Sprout | green | 1 | 1 | 1.7 [0.2–3.4] | 1.9 | 3.0 [0.4–5.8] | ±4.1 | -1.2 | 0.8% | 129 | -19.7 [-27.6–2.8] |
| Bandwagon | red | 1 | 1 | 1.6 [-0.2–4.0] | 1.8 | 2.8 [-0.3–6.9] | ±5.4 | -1.3 | 0.0% | 119 | – |
| Clock In | purple | 1 | 1 | 1.5 [-0.9–3.8] | 1.7 | 2.6 [-1.7–6.7] | ±6.3 | -1.5 | 8.8% | 104 | -20.5 [-29.5–4.1] |
| Tide | blue | 1 | 1 | 1.4 [-0.1–2.8] | 1.6 | 2.5 [-0.2–4.9] | ±3.9 | -1.5 | 3.2% | 121 | – |
| Root | green | 1 | 1 | 1.4 [-0.2–3.7] | 1.6 | 2.5 [-0.4–6.4] | ±5.1 | -1.5 | 14.5% | 94 | -30.8 [-40.8–4.1] |
| Current | blue | 1 | 1 | 1.4 [-0.2–3.0] | 1.6 | 2.4 [-0.4–5.2] | ±4.2 | -1.5 | 1.0% | 97 | – |
| Goody Bags | silver | 1 | 1 | 1.4 [-0.9–3.7] | 1.6 | 2.4 [-1.5–6.5] | ±6.0 | -1.6 | 29.4% | 89 | – |
| Toast | silver | 1 | 1 | 1.1 [-0.6–2.9] | 1.3 | 2.0 [-1.0–5.1] | ±4.6 | -1.8 | 0.0% | 139 | -6.8 [-12.5–4.4] |
| Sob Story | trading | 1 | 1 | 1.1 [-2.0–4.1] | 1.3 | 1.9 [-3.5–7.2] | ±8.0 | -1.8 | 8.2% | 78 | – |
| Catch Up | purple | 1 | 1 | 1.0 [-0.8–2.9] | 1.1 | 1.7 [-1.4–5.1] | ±4.9 | -2.0 | 0.0% | 91 | 8.8 [-2.4–18.2] |
| Even Swap | red | 1 | 1 | 0.9 [-0.6–2.7] | 1.1 | 1.6 [-1.1–4.7] | ±4.4 | -2.0 | 0.0% | 140 | – |
| Echo | echo | 1 | 1 | 0.9 [-1.2–3.1] | 1.0 | 1.5 [-2.0–5.3] | ±5.6 | -2.1 | 0.0% | 90 | – |
| Harvest | yellow | 1 | 1 | 0.8 [-1.1–2.2] | 0.9 | 1.3 [-2.0–3.8] | ±4.4 | -2.2 | 0.0% | 103 | 12.7 [-4.4–17.5] |
| Graft | green | 1 | 1 | 0.6 [-1.1–2.6] | 0.7 | 1.0 [-2.0–4.5] | ±4.9 | -2.3 | 3.4% | 115 | 5.7 [-8.4–12.2] |
| Golden Years | gold | 1 | 1 | 0.6 [-1.2–2.5] | 0.7 | 1.0 [-2.1–4.4] | ±4.9 | -2.4 | 0.0% | 120 | – |
| Roll Call | purple | 1 | 1 | 0.2 [-2.3–3.0] | 0.2 | 0.3 [-4.0–5.3] | ±7.0 | -2.8 | 0.0% | 96 | 1.2 [-8.6–8.7] |
| Help Yourself | thieves | 1 | 1 | -0.1 [-2.6–2.1] | -0.1 | -0.2 [-4.5–3.6] | ±6.1 | -3.0 | 1.0% | 103 | – |
| Redistribute | thieves | 1 | 1 | -0.2 [-2.1–1.8] | -0.3 | -0.4 [-3.7–3.2] | ±5.2 | -3.2 | 0.0% | 103 | 2.1 [-6.2–9.8] |
| Snap Up | market | 1 | 1 | -0.7 [-2.4–1.2] | -0.9 | -1.3 [-4.3–2.1] | ±4.8 | -3.7 | 5.5% | 104 | 1.0 [-4.5–7.4] |
| Cheap Seats | trading | 1 | 1 | -4.4 [-6.4–-2.8] | -5.1 | -7.7 [-11.1–-4.9] | ±4.7 | -7.4 | 0.0% | 85 | -3.0 [-9.5–4.3] |
| Clock In | purple | 1 | 2 | 6.5 [4.5–8.6] | 6.9 | 8.7 [6.0–11.5] | ±4.1 | 2.3 | 20.7% | 69 | 12.2 [7.2–19.4] |
| Lie Low | thieves | 1 | 2 | 6.2 [4.6–8.2] | 6.6 | 8.3 [6.1–11.0] | ±3.7 | 2.1 | 0.0% | 88 | 11.5 [8.8–17.2] |
| Golden Years | gold | 1 | 2 | 5.9 [4.0–8.1] | 6.3 | 7.9 [5.4–10.8] | ±4.1 | 1.7 | 7.1% | 130 | 4.6 [0.3–9.9] |
| Crime Wave | thieves | 2 | 2 | 5.1 [3.8–6.5] | 5.3 | 6.7 [5.0–8.6] | ±2.7 | 0.9 | 0.9% | 112 | 6.4 [2.4–11.5] |
| Harbor | blue | 2 | 2 | 4.9 [2.7–7.3] | 5.1 | 6.5 [3.6–9.8] | ±4.7 | 0.7 | 18.4% | 62 | – |
| Help Yourself | thieves | 1 | 2 | 4.7 [3.2–6.2] | 5.0 | 6.3 [4.3–8.2] | ±3.0 | 0.5 | 0.9% | 112 | – |
| Toast | silver | 1 | 2 | 4.7 [2.9–6.7] | 5.0 | 6.3 [3.9–8.9] | ±3.8 | 0.5 | 13.6% | 127 | 13.1 [2.6–20.6] |
| Intro Offer | gold | 1 | 2 | 4.6 [2.9–6.1] | 4.9 | 6.2 [3.9–8.1] | ±3.2 | 0.5 | 0.0% | 124 | – |
| Crescendo | echo | 1 | 2 | 4.4 [2.2–6.9] | 4.7 | 5.9 [3.0–9.2] | ±4.7 | 0.3 | 9.9% | 64 | – |
| Collect Debts | gold | 2 | 2 | 4.4 [2.9–6.0] | 4.7 | 5.9 [3.9–8.0] | ±3.1 | 0.2 | 7.9% | 117 | – |
| Name Drop | market | 1 | 2 | 4.3 [2.3–6.5] | 4.5 | 5.7 [3.0–8.7] | ±4.3 | 0.1 | 4.7% | 101 | – |
| Dividend | trading | 2 | 2 | 4.2 [2.1–6.8] | 4.5 | 5.6 [2.8–9.0] | ±4.7 | 0.0 | 4.2% | 92 | -12.5 [-15.7–6.8] |
| Half Price | market | 2 | 2 | 4.2 [2.7–5.7] | 4.4 | 5.6 [3.5–7.6] | ±3.1 | 0.0 | 1.0% | 102 | -2.3 [-11.4–8.6] |
| Shake Down | thieves | 2 | 2 | 4.1 [2.6–5.9] | 4.4 | 5.5 [3.5–7.9] | ±3.3 | -0.1 | 5.1% | 94 | – |
| Open Door | red | 1 | 2 | 4.0 [2.4–5.5] | 4.2 | 5.3 [3.2–7.3] | ±3.1 | -0.2 | 2.1% | 138 | – |
| Open House | red | 2 | 2 | 4.0 [2.3–5.5] | 4.2 | 5.3 [3.0–7.3] | ±3.2 | -0.2 | 0.0% | 103 | 14.7 [1.5–23.7] |
| Grove | green | 2 | 2 | 3.9 [2.6–5.7] | 4.1 | 5.2 [3.5–7.5] | ±3.1 | -0.3 | 11.5% | 100 | – |
| Good Deed | silver | 1 | 2 | 3.9 [1.9–5.8] | 4.1 | 5.2 [2.5–7.7] | ±3.9 | -0.3 | 0.8% | 117 | 0.7 [-5.9–6.8] |
| Graft | green | 1 | 2 | 3.8 [2.1–5.7] | 4.1 | 5.1 [2.8–7.6] | ±3.7 | -0.3 | 0.0% | 123 | – |
| Bandwagon | red | 1 | 2 | 3.6 [2.1–5.1] | 3.8 | 4.8 [2.8–6.9] | ±3.1 | -0.6 | 0.0% | 115 | – |
| Overtime | purple | 2 | 2 | 3.5 [2.0–4.9] | 3.7 | 4.6 [2.7–6.5] | ±2.9 | -0.7 | 0.0% | 95 | – |
| Harvest | yellow | 1 | 2 | 3.4 [2.1–4.6] | 3.6 | 4.6 [2.8–6.2] | ±2.6 | -0.8 | 0.9% | 110 | 3.0 [-0.5–7.1] |
| Swell | blue | 2 | 2 | 3.4 [1.8–5.1] | 3.6 | 4.5 [2.4–6.8] | ±3.4 | -0.8 | 8.2% | 90 | -12.5 [-16.7–5.7] |
| Reprise | echo | 2 | 2 | 3.2 [0.5–5.2] | 3.4 | 4.2 [0.6–6.9] | ±4.7 | -1.0 | 0.0% | 76 | – |
| Your Call | trading | 1 | 2 | 3.2 [0.9–6.2] | 3.4 | 4.2 [1.2–8.2] | ±5.3 | -1.0 | 0.0% | 71 | – |
| Goody Bags | silver | 1 | 2 | 3.1 [1.5–4.8] | 3.3 | 4.2 [2.0–6.4] | ±3.3 | -1.0 | 1.0% | 99 | 14.2 [-0.6–18.8] |
| Root | green | 1 | 2 | 3.1 [1.6–4.6] | 3.3 | 4.1 [2.2–6.1] | ±3.0 | -1.1 | 0.8% | 127 | – |
| Current | blue | 1 | 2 | 3.0 [1.1–5.0] | 3.2 | 4.0 [1.5–6.6] | ±3.9 | -1.2 | 0.0% | 83 | – |
| Orchard | green | 2 | 2 | 2.7 [1.0–4.7] | 2.8 | 3.5 [1.4–6.2] | ±3.6 | -1.5 | 10.7% | 92 | – |
| Sell High | trading | 2 | 2 | 2.6 [0.3–5.3] | 2.8 | 3.5 [0.4–7.0] | ±5.0 | -1.6 | 8.5% | 75 | – |
| Sweet Talk | silver | 2 | 2 | 2.6 [0.5–4.4] | 2.7 | 3.4 [0.7–5.9] | ±3.9 | -1.6 | 0.0% | 127 | – |
| Shoal | blue | 1 | 2 | 2.6 [0.7–4.1] | 2.7 | 3.4 [0.9–5.5] | ±3.5 | -1.6 | 0.9% | 106 | – |
| Tithe | gold | 2 | 2 | 2.5 [1.0–4.4] | 2.7 | 3.4 [1.3–5.8] | ±3.4 | -1.7 | 0.0% | 121 | – |
| Hum | echo | 1 | 2 | 2.5 [0.9–4.2] | 2.6 | 3.3 [1.2–5.5] | ±3.3 | -1.7 | 0.0% | 123 | -8.5 [-15.0–4.4] |
| Sprout | green | 1 | 2 | 2.5 [1.1–3.7] | 2.6 | 3.3 [1.4–5.0] | ±2.7 | -1.7 | 0.0% | 151 | – |
| Sob Story | trading | 1 | 2 | 2.4 [0.7–4.2] | 2.5 | 3.2 [0.9–5.5] | ±3.5 | -1.8 | 6.3% | 90 | – |
| Trade Seeds | yellow | 1 | 2 | 2.4 [0.5–4.4] | 2.5 | 3.2 [0.7–5.9] | ±3.9 | -1.8 | 1.2% | 80 | 0.2 [-2.7–7.1] |
| Rising Tide | silver | 2 | 2 | 2.4 [0.6–4.2] | 2.5 | 3.2 [0.7–5.6] | ±3.6 | -1.8 | 0.0% | 117 | 1.2 [-3.0–6.5] |
| Plan Ahead | purple | 2 | 2 | 2.3 [0.1–4.3] | 2.4 | 3.0 [0.2–5.8] | ±4.2 | -1.9 | 0.0% | 82 | -11.2 [-16.4–2.6] |
| Show Off | market | 2 | 2 | 2.3 [-0.3–4.7] | 2.4 | 3.0 [-0.4–6.2] | ±5.0 | -1.9 | 1.6% | 60 | -2.3 [-5.4–6.9] |
| Potluck | yellow | 2 | 2 | 2.0 [0.5–3.7] | 2.1 | 2.7 [0.6–4.9] | ±3.2 | -2.2 | 1.4% | 70 | 18.6 [0.3–25.8] |
| Encore | echo | 2 | 2 | 1.9 [0.1–3.7] | 2.0 | 2.5 [0.1–4.9] | ±3.6 | -2.3 | 2.0% | 98 | -1.3 [-3.8–6.8] |
| Tide | blue | 1 | 2 | 1.8 [0.6–3.1] | 2.0 | 2.5 [0.7–4.1] | ±2.6 | -2.3 | 0.0% | 135 | 10.1 [-2.2–13.7] |
| Top Up | yellow | 1 | 2 | 1.8 [-0.1–4.1] | 1.9 | 2.5 [-0.1–5.4] | ±4.2 | -2.3 | 3.4% | 86 | -7.0 [-12.2–6.9] |
| Kickback | gold | 1 | 2 | 1.6 [0.0–2.9] | 1.6 | 2.1 [0.0–3.9] | ±2.9 | -2.6 | 1.6% | 182 | – |
| Even Swap | red | 1 | 2 | 1.3 [-0.3–2.9] | 1.3 | 1.7 [-0.3–3.9] | ±3.2 | -2.9 | 2.4% | 123 | -14.8 [-23.6–6.4] |
| New Faces | market | 1 | 2 | 1.1 [-0.8–3.3] | 1.2 | 1.5 [-1.1–4.3] | ±4.1 | -3.1 | 0.0% | 84 | 9.4 [-0.6–13.4] |
| Redistribute | thieves | 1 | 2 | 1.1 [-0.6–2.6] | 1.2 | 1.5 [-0.8–3.5] | ±3.3 | -3.1 | 0.0% | 89 | – |
| Branch Out | yellow | 2 | 2 | 0.9 [-0.7–3.0] | 0.9 | 1.2 [-0.9–3.9] | ±3.6 | -3.3 | 1.0% | 101 | -3.7 [-9.8–2.9] |
| Swap Sides | red | 2 | 2 | 0.7 [-1.3–2.6] | 0.7 | 0.9 [-1.8–3.4] | ±3.9 | -3.5 | 0.0% | 95 | -0.0 [-5.1–6.5] |
| Echo | echo | 1 | 2 | 0.6 [-1.3–3.1] | 0.6 | 0.8 [-1.8–4.1] | ±4.5 | -3.6 | 0.0% | 72 | -2.8 [-5.5–6.8] |
| Snap Up | market | 1 | 2 | 0.5 [-1.0–2.3] | 0.5 | 0.6 [-1.4–3.0] | ±3.3 | -3.7 | 0.8% | 119 | -3.6 [-13.5–10.3] |
| Catch Up | purple | 1 | 2 | 0.4 [-1.9–2.4] | 0.5 | 0.6 [-2.6–3.2] | ±4.3 | -3.7 | 0.0% | 88 | 23.7 [0.8–50.2] |
| Roll Call | purple | 1 | 2 | 0.1 [-1.5–1.9] | 0.1 | 0.2 [-2.0–2.6] | ±3.5 | -4.1 | 0.0% | 88 | – |
| Cheap Seats | trading | 1 | 2 | -0.4 [-2.7–1.5] | -0.4 | -0.6 [-3.6–2.0] | ±4.3 | -4.6 | 0.0% | 76 | -4.5 [-8.9–0.4] |
| Toast | silver | 1 | 3 | 9.6 [8.4–11.1] | 13.5 | 21.3 [18.6–24.6] | ±4.5 | 3.3 | 12.5% | 105 | 15.1 [5.2–21.3] |
| Dividend | trading | 2 | 3 | 6.0 [4.2–7.6] | 8.4 | 13.3 [9.2–16.7] | ±5.7 | -0.4 | 18.8% | 56 | 10.5 [7.5–13.9] |
| Hand-pick | red | 3 | 3 | 5.8 [4.6–7.2] | 8.2 | 12.9 [10.2–16.0] | ±4.4 | -0.5 | 7.3% | 89 | 10.4 [3.7–18.0] |
| Crunch Time | purple | 3 | 3 | 5.5 [3.7–7.2] | 7.7 | 12.1 [8.1–16.0] | ±6.0 | -0.9 | 0.0% | 89 | 9.3 [5.4–14.5] |
| Golden Years | gold | 1 | 3 | 5.4 [4.1–6.9] | 7.6 | 12.0 [9.1–15.3] | ±4.7 | -1.0 | 4.3% | 132 | 13.8 [8.5–19.3] |
| Rising Tide | silver | 2 | 3 | 5.4 [4.1–6.6] | 7.6 | 12.0 [9.0–14.6] | ±4.2 | -1.0 | 5.3% | 108 | 17.1 [10.5–22.9] |
| Your Call | trading | 1 | 3 | 5.3 [4.0–6.7] | 7.4 | 11.7 [8.8–14.8] | ±4.5 | -1.1 | 2.2% | 87 | 11.1 [8.1–14.0] |
| Bloom | green | 3 | 3 | 5.0 [3.8–6.2] | 7.0 | 11.1 [8.4–13.8] | ±4.1 | -1.4 | 21.0% | 98 | 8.5 [6.8–11.0] |
| Crescendo | echo | 1 | 3 | 5.0 [3.2–6.5] | 7.0 | 11.0 [7.1–14.4] | ±5.5 | -1.4 | 10.9% | 90 | – |
| Lie Low | thieves | 1 | 3 | 4.9 [3.5–6.1] | 6.9 | 10.8 [7.9–13.6] | ±4.3 | -1.5 | 0.0% | 79 | – |
| Good Deed | silver | 1 | 3 | 4.6 [3.3–5.6] | 6.5 | 10.2 [7.4–12.3] | ±3.7 | -1.8 | 0.0% | 117 | – |
| Help Yourself | thieves | 1 | 3 | 4.5 [3.3–5.6] | 6.3 | 9.9 [7.4–12.4] | ±3.7 | -1.9 | 3.4% | 86 | – |
| Tithe | gold | 2 | 3 | 4.4 [3.3–5.7] | 6.2 | 9.7 [7.2–12.6] | ±4.1 | -2.0 | 0.9% | 116 | – |
| Harbor | blue | 2 | 3 | 4.3 [2.5–5.6] | 6.0 | 9.4 [5.5–12.5] | ±5.3 | -2.1 | 0.0% | 82 | – |
| Root | green | 1 | 3 | 4.2 [2.9–5.5] | 5.9 | 9.4 [6.5–12.2] | ±4.3 | -2.2 | 0.0% | 93 | – |
| Shake Down | thieves | 2 | 3 | 4.2 [2.7–5.8] | 5.9 | 9.3 [6.0–12.8] | ±5.1 | -2.2 | 0.0% | 75 | – |
| All In | trading | 3 | 3 | 4.2 [2.4–5.8] | 5.8 | 9.2 [5.3–12.9] | ±5.8 | -2.2 | 0.0% | 74 | – |
| Harvest | yellow | 1 | 3 | 4.2 [2.7–5.4] | 5.8 | 9.2 [6.0–11.9] | ±4.5 | -2.2 | 0.0% | 107 | – |
| Plan Ahead | purple | 2 | 3 | 4.1 [2.7–5.7] | 5.7 | 9.0 [5.9–12.5] | ±5.0 | -2.3 | 0.0% | 85 | – |
| Clock In | purple | 1 | 3 | 4.1 [3.1–5.2] | 5.7 | 9.0 [6.8–11.4] | ±3.5 | -2.3 | 8.2% | 89 | – |
| Poach | thieves | 3 | 3 | 3.8 [2.5–4.9] | 5.3 | 8.4 [5.6–10.9] | ±4.0 | -2.6 | 0.0% | 82 | – |
| Sob Story | trading | 1 | 3 | 3.8 [2.0–5.4] | 5.3 | 8.3 [4.5–11.9] | ±5.6 | -2.6 | 0.0% | 91 | – |
| Flood | blue | 3 | 3 | 3.8 [2.5–5.0] | 5.3 | 8.3 [5.6–11.0] | ±4.1 | -2.6 | 24.4% | 68 | – |
| Bumper Crop | yellow | 3 | 3 | 3.7 [2.4–5.1] | 5.2 | 8.3 [5.3–11.3] | ±4.5 | -2.7 | 5.0% | 76 | – |
| Grove | green | 2 | 3 | 3.7 [2.6–4.9] | 5.2 | 8.1 [5.7–10.9] | ±3.9 | -2.7 | 0.0% | 131 | – |
| Double Down | gold | 3 | 3 | 3.5 [2.1–4.6] | 4.9 | 7.7 [4.7–10.2] | ±4.1 | -2.9 | 2.4% | 123 | – |
| Open House | red | 2 | 3 | 3.5 [2.6–4.7] | 4.9 | 7.7 [5.7–10.3] | ±3.5 | -2.9 | 0.0% | 98 | – |
| Hold Court | silver | 3 | 3 | 3.5 [2.0–4.9] | 4.9 | 7.7 [4.4–10.9] | ±4.9 | -2.9 | 1.8% | 110 | – |
| Collect Debts | gold | 2 | 3 | 3.5 [1.9–4.7] | 4.8 | 7.6 [4.3–10.5] | ±4.7 | -2.9 | 1.3% | 156 | – |
| Sweet Talk | silver | 2 | 3 | 3.3 [2.1–4.5] | 4.7 | 7.4 [4.5–10.0] | ±4.2 | -3.1 | 0.0% | 126 | – |
| Swell | blue | 2 | 3 | 3.2 [1.8–4.6] | 4.5 | 7.1 [4.0–10.2] | ±4.7 | -3.2 | 0.0% | 84 | – |
| Hum | echo | 1 | 3 | 3.2 [1.8–4.8] | 4.4 | 7.0 [3.9–10.7] | ±5.2 | -3.2 | 0.0% | 98 | – |
| Shoal | blue | 1 | 3 | 3.2 [2.0–4.3] | 4.4 | 7.0 [4.3–9.5] | ±3.9 | -3.2 | 0.0% | 81 | – |
| Graft | green | 1 | 3 | 3.2 [2.0–4.4] | 4.4 | 7.0 [4.4–9.8] | ±4.1 | -3.2 | 0.0% | 123 | – |
| Crime Wave | thieves | 2 | 3 | 3.0 [1.7–4.2] | 4.3 | 6.7 [3.7–9.2] | ±4.2 | -3.4 | 1.0% | 96 | – |
| Overtime | purple | 2 | 3 | 3.0 [1.4–4.8] | 4.2 | 6.6 [3.1–10.6] | ±5.6 | -3.4 | 0.0% | 79 | – |
| Sprout | green | 1 | 3 | 3.0 [2.1–3.9] | 4.1 | 6.5 [4.5–8.7] | ±3.1 | -3.4 | 0.0% | 156 | – |
| Show Off | market | 2 | 3 | 2.8 [1.6–3.9] | 3.9 | 6.1 [3.4–8.7] | ±4.0 | -3.6 | 0.0% | 70 | – |
| Kickback | gold | 1 | 3 | 2.7 [1.7–3.5] | 3.8 | 5.9 [3.8–7.8] | ±3.0 | -3.7 | 0.0% | 169 | – |
| Intro Offer | gold | 1 | 3 | 2.7 [1.5–3.9] | 3.7 | 5.9 [3.4–8.5] | ±3.9 | -3.7 | 0.0% | 122 | – |
| Orchard | green | 2 | 3 | 2.6 [1.4–3.9] | 3.7 | 5.8 [3.0–8.5] | ±4.2 | -3.7 | 0.0% | 95 | – |
| Potluck | yellow | 2 | 3 | 2.6 [1.0–4.2] | 3.6 | 5.8 [2.1–9.3] | ±5.4 | -3.8 | 0.0% | 68 | – |
| Open Door | red | 1 | 3 | 2.4 [1.0–3.8] | 3.3 | 5.2 [2.3–8.5] | ±4.7 | -4.0 | 0.0% | 94 | – |
| Tide | blue | 1 | 3 | 2.2 [1.2–3.1] | 3.1 | 4.9 [2.7–6.8] | ±3.1 | -4.2 | 0.0% | 115 | – |
| Current | blue | 1 | 3 | 2.2 [1.0–3.3] | 3.1 | 4.8 [2.3–7.3] | ±3.8 | -4.2 | 0.0% | 98 | – |
| Bandwagon | red | 1 | 3 | 2.2 [0.8–3.4] | 3.0 | 4.8 [1.7–7.5] | ±4.4 | -4.2 | 0.0% | 132 | – |
| Top Up | yellow | 1 | 3 | 2.1 [0.8–3.8] | 2.9 | 4.6 [1.8–8.4] | ±5.0 | -4.3 | 1.3% | 78 | – |
| Redistribute | thieves | 1 | 3 | 2.0 [0.8–3.2] | 2.8 | 4.5 [1.8–7.1] | ±4.0 | -4.4 | 0.0% | 84 | – |
| Goody Bags | silver | 1 | 3 | 1.9 [0.8–3.3] | 2.7 | 4.2 [1.8–7.3] | ±4.1 | -4.5 | 0.0% | 113 | – |
| Cheap Seats | trading | 1 | 3 | 1.9 [0.3–3.3] | 2.6 | 4.1 [0.6–7.4] | ±5.1 | -4.5 | 0.0% | 77 | – |
| Encore | echo | 2 | 3 | 1.7 [0.1–3.1] | 2.4 | 3.8 [0.3–6.9] | ±4.9 | -4.7 | 2.0% | 96 | – |
| Even Swap | red | 1 | 3 | 1.7 [0.6–2.9] | 2.4 | 3.8 [1.3–6.5] | ±3.9 | -4.7 | 0.0% | 115 | – |
| Roll Call | purple | 1 | 3 | 1.6 [0.2–3.4] | 2.3 | 3.6 [0.4–7.4] | ±5.3 | -4.7 | 0.0% | 59 | – |
| Greatest Hits | echo | 3 | 3 | 1.6 [0.4–2.8] | 2.3 | 3.6 [0.8–6.2] | ±4.1 | -4.7 | 0.0% | 81 | – |
| New Faces | market | 1 | 3 | 1.5 [0.2–2.8] | 2.1 | 3.4 [0.5–6.1] | ±4.2 | -4.9 | 0.0% | 100 | – |
| Reprise | echo | 2 | 3 | 1.4 [-0.1–3.4] | 2.0 | 3.2 [-0.3–7.5] | ±5.9 | -4.9 | 0.0% | 70 | – |
| Sell High | trading | 2 | 3 | 1.0 [-0.3–2.3] | 1.3 | 2.1 [-0.8–5.0] | ±4.4 | -5.4 | 0.0% | 93 | – |
| Echo | echo | 1 | 3 | 0.9 [-0.8–2.3] | 1.2 | 2.0 [-1.7–5.0] | ±5.0 | -5.5 | 0.0% | 82 | – |
| Spree | market | 3 | 3 | 0.6 [-0.8–2.0] | 0.8 | 1.3 [-1.7–4.5] | ±4.7 | -5.8 | 0.0% | 71 | 1.5 [-1.9–4.2] |
| Half Price | market | 2 | 3 | 0.6 [-0.3–1.7] | 0.8 | 1.3 [-0.8–3.7] | ±3.3 | -5.8 | 0.0% | 118 | – |
| Catch Up | purple | 1 | 3 | 0.6 [-0.7–2.0] | 0.8 | 1.3 [-1.4–4.4] | ±4.4 | -5.8 | 0.0% | 105 | – |
| Trade Seeds | yellow | 1 | 3 | 0.5 [-0.9–1.8] | 0.7 | 1.0 [-2.0–3.9] | ±4.5 | -5.9 | 0.0% | 80 | – |
| Snap Up | market | 1 | 3 | 0.4 [-0.6–1.6] | 0.6 | 0.9 [-1.4–3.7] | ±3.8 | -6.0 | 0.0% | 133 | – |
| Name Drop | market | 1 | 3 | 0.2 [-1.3–1.5] | 0.3 | 0.5 [-2.9–3.3] | ±4.7 | -6.1 | 2.2% | 90 | – |
| Branch Out | yellow | 2 | 3 | 0.1 [-1.2–1.7] | 0.2 | 0.3 [-2.7–3.7] | ±4.9 | -6.3 | 1.2% | 85 | – |
| Swap Sides | red | 2 | 3 | -0.5 [-1.6–0.9] | -0.7 | -1.0 [-3.6–2.1] | ±4.3 | -6.9 | 0.0% | 101 | -3.1 [-6.7–-0.6] |

</details>

## 4. Archetypes
One scripted seat (rotating) against 3 bots, Classic table. Target band 15–35% (parity 25%). Scripts are built on Normal's valuation: the buyer never recruits; a specialist adds +3 to its sphere's spaces and +2 to its members; the chaser adds twice the round-end contest standing a move leaves it; the hoarder recruits whenever any member is affordable.

| archetype | vs | n | win [90%] | followers (rivals) | members (rivals) | |
|---|---|---|---|---|---|---|
| pure follower buyer | 3 Normal | 240 | 10.0% [7.2%–13.6%] | 53.3 (55.2) | 0.0 (8.1) | below band |
| pure follower buyer | 3 Hard-20 | 64 | 7.8% [3.9%–15.2%] | 49.3 (56.4) | 0.1 (7.0) | edge |
| member hoarder (recruits whenever it can) | 3 Normal | 240 | 5.4% [3.5%–8.4%] | 42.7 (56.0) | 13.9 (7.0) | below band |
| member hoarder (recruits whenever it can) | 3 Hard-20 | 64 | 6.3% [2.8%–13.2%] | 41.8 (56.6) | 14.2 (5.5) | below band |
| contest chaser (maximizes round-end leads) | 3 Normal | 240 | 16.3% [12.7%–20.5%] | 53.1 (56.9) | 8.2 (7.5) |  |
| contest chaser (maximizes round-end leads) | 3 Hard-20 | 64 | 14.1% [8.4%–22.7%] | 50.5 (57.2) | 9.0 (6.3) | edge |
| Gold (gold) specialist | 3 Normal | 240 | 26.8% [22.4%–31.7%] | 55.5 (56.7) | 9.0 (7.3) |  |
| Gold (gold) specialist | 3 Hard-20 | 64 | 25.0% [17.2%–34.8%] | 54.2 (57.6) | 9.1 (6.0) |  |
| Red (red) specialist | 3 Normal | 240 | 27.5% [23.0%–32.5%] | 54.5 (56.1) | 10.0 (6.6) |  |
| Red (red) specialist | 3 Hard-20 | 64 | 21.9% [14.6%–31.4%] | 52.3 (56.8) | 10.1 (5.6) |  |
| Blue (market) specialist | 3 Normal | 240 | 16.8% [13.2%–21.1%] | 52.7 (57.0) | 9.8 (7.4) |  |
| Blue (market) specialist | 3 Hard-20 | 64 | 13.3% [7.8%–21.8%] | 53.2 (57.8) | 10.2 (6.1) | edge |
| Green (echo) specialist | 3 Normal | 240 | 17.7% [14.0%–22.1%] | 53.4 (56.2) | 8.5 (7.5) |  |
| Green (echo) specialist | 3 Hard-20 | 64 | 19.5% [12.7%–28.8%] | 53.1 (57.5) | 9.0 (6.2) |  |

## 5. Fairness
Base games (no probes), random tables. Parity is 25%.
- Normal tables, 440 games. By seat: P1 26.8% [23.5%–30.4%], P2 26.8% [23.5%–30.4%], P3 21.6% [18.5%–25.0%], P4 24.8% [21.5%–28.3%]. By round-I pick order: 1st 27.5% [24.1%–31.1%], 2nd 24.1% [20.9%–27.6%], 3rd 26.1% [22.8%–29.7%], 4th 22.3% [19.2%–25.7%]. Round-III first pick (fewest followers) wins 11.1% [8.9%–13.8%]; last of the first pass 53.2% [49.3%–57.1%].
- Hard-20 tables, 68 games. By seat: P1 35.3% [26.5%–45.2%], P2 39.7% [30.5%–49.7%], P3 16.2% [10.2%–24.8%], P4 8.8% [4.6%–16.2%]. By round-I pick order: 1st 19.1% [12.5%–28.1%], 2nd 29.4% [21.3%–39.1%], 3rd 29.4% [21.3%–39.1%], 4th 22.1% [14.9%–31.3%]. Round-III first pick (fewest followers) wins 11.8% [6.8%–19.7%]; last of the first pass 50.0% [40.2%–59.8%].

## 6. Health
| | Normal (440 games) | Hard-20 (68 games) |
|---|---|---|
| members per player (target 6–7) | 5.0 ±2.6 sd (19.3% land on 6–7; 5.0 cards) | 4.4 ±2.8 sd (12.5% land on 6–7; 4.3 cards) |
| final followers | 55.7 | 52.2 |
| … self | 1.0 (1.8%) | 1.0 (1.9%) |
| … members' worth | 6.7 (12.1%) | 5.6 (10.6%) |
| … buys 2→1 / 4→3 / 8→6 / 10→10 | 0.4 / 1.0 / 1.6 / 26.0 (52.0%) | 1.0 / 1.9 / 1.7 / 23.2 (53.4%) |
| … contests round I / II / III | 2.8 / 5.2 / 7.9 (28.5%) | 2.6 / 5.0 / 7.5 (29.0%) |
| … effects (member triggers, actions, game end) | 3.1 (5.6%) | 2.7 (5.1%) |
| resources left at the end | 9.2 mean, 19.0 p90, 67 max (2.7% hold 30+) | 7.8 mean, 16.0 p90, 39 max (2.2% hold 30+) |
| contests that paid 2+ / 3+ tied leaders | 28.1% / 6.1% of 5240 | 23.4% / 4.2% of 808 |
| steal events per game (units taken) | 9.8 (15.3) | 12.1 (18.3) |
| longest run of placements by one player (the snake alone makes 2) | 2.2 mean, 6 max (13.9% of games have 3+) | 2.1 mean, 5 max (8.8% of games have 3+) |
| decision richness: top two within 1 follower | n/a (needs Hard rollouts) | 28.4% of 5797 weighed decisions (median gap 3.00) |

