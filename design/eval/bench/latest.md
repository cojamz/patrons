# Balance bench (full)

2026-10-15 00:39 UTC · commit 669f85e · content 17nxqj9f1m0.d8606c4f45 · 72.3 min on 4 workers (287 core-min) · 38 random 4-sphere tables (makeTables 4242), every compatible pair at least twice.
Instruments: **Normal** (all four seats) and **Hard-20** (Hard = Normal plus rollouts, at budget 20, uncapped, deterministic). Intervals are 90% (bootstrap over seeds for fits, Wilson for win rates). Method and limits: design/eval/bench/README.md.

## What moved since last run
First run of this mode: nothing to compare.

## 1. Anchors
Every anchor's interval reaches its expected range, Hard-20 beats Normal, and both price slopes are clearly positive: the instruments are trusted. (An anchor is off when its 90% interval misses the range, or it has too few probes to say.)

- Price slope, followers of margin per extra cost point (the exchange rate for everything below): Normal 0.81 [0.76–0.86] (by fork round I/II/III: 0.81 [0.72–0.91], 0.94 [0.85–1.01], 0.67 [0.61–0.73]); Hard-20 0.76 [0.56–0.93] (by fork round I/II/III: 0.84 [0.40–1.26], 0.71 [0.45–1.00], 0.73 [0.49–1.00]). 
- Hard-20 alone vs 3 Normal (Classic, n=96): wins 37.0% [29.3%–45.3%]; parity is 25%, it must reach 32%. OK.

| instrument | anchor | printed | fair [90%] | n | expected | |
|---|---|---|---|---|---|---|
| Normal | Banker | 4 | 7.7 [6.5–9.2] | 470 | 4.5–10.5 | ok |
| Normal | Big Family | 4 | 3.8 [2.6–4.9] | 393 | 0.5–6.0 | ok |
| Normal | Sponsor | 10 | 9.5 [7.6–11.4] | 232 | 8.0–∞ | ok |
| Normal | Tycoon | 12 | 4.9 [3.3–6.4] | 321 | −∞–10.0 | ok |
| Hard-20 | Banker | 4 | 9.0 [4.8–12.9] | 65 | 4.5–10.5 | ok |
| Hard-20 | Big Family | 4 | 3.4 [0.5–7.1] | 73 | 0.5–6.0 | ok |
| Hard-20 | Sponsor | 10 | 11.4 [8.7–15.0] | 53 | 8.0–∞ | ok |
| Hard-20 | Tycoon | 12 | 7.5 [3.2–11.7] | 56 | −∞–10.0 | ok |

- Banker (4: "Now and at round start, +3 gold"). By arithmetic +9/+6/+3 gold by round recruited, ~7 averaged, plus a follower; the Normal sweep read 7.3 [6.3–8.3] recruited in round I.
- Big Family (4: "Worth 3 followers", no ability), the plain worth-N member: 3 followers ≈ 4 resources at 4→3, less the follower buy it displaces. The Normal sweep read 2.4 [0.6–3.6].
- Sponsor (10: "Your members cost 2 less"), rework-candidates #1, known strong: must not read cheaper than printed − 2.
- Tycoon (12: "Game end: +1 follower per 3 gold"), rework-candidates #3, known weak: must read at least 2 under printed.

## 2. Cards
Paired forced recruit: a private copy of the card, at printed −4 / printed / +4, recruited at the seat's first affordable buy from a random round on (I, II or III), against the same seed without it. Fair price = the price where it nets 0 followers of margin. Normal: 26348 probes over 440 seeds, every card. Hard-20: 2628 probes over 44 seeds, only the anchors and what Normal flags or reads ≥ 2.5 off (a card both must agree on can't be flagged by Hard alone). Flag = the 90% interval misses printed and the gap is ≥ 1.5, for BOTH instruments.

### Both instruments agree (14)
| card | printed | Normal fair [90%] n | Hard-20 fair [90%] n | reads | bought round |
|---|---|---|---|---|---|
| Patron Saint (silver) | 12 | 3.7 [1.6–5.8] 127 | 4.6 [1.6–7.4] 59 | too dear | 2.5 |
| Tycoon (gold) | 12 | 4.9 [3.3–6.4] 321 | 7.5 [3.2–11.7] 56 | too dear | 2.7 |
| Midas (gold) | 8 | 1.1 [-1.1–3.3] 142 | 3.0 [-1.0–6.2] 63 | too dear | 2.3 |
| Upstart (silver) | 6 | 12.1 [9.7–14.3] 133 | 12.9 [9.5–16.9] 74 | too cheap, needs an ability change (would need > 2× its price) | 2.3 |
| Extortionist (thieves) | 6 | 11.0 [8.8–13.6] 92 | 9.0 [6.2–12.4] 46 | too cheap | 2.4 |
| Busker (echo) | 4 | 8.8 [6.3–11.7] 96 | 7.4 [5.2–10.7] 49 | too cheap | 2.2 |
| Tax Collector (gold) | 4 | 8.7 [6.6–10.9] 148 | 8.7 [5.0–13.0] 69 | too cheap, needs an ability change (would need > 2× its price) | 2.2 |
| Magnate (trading) | 8 | 3.6 [1.7–5.5] 85 | 3.6 [-0.1–6.7] 54 | too dear | 2.4 |
| Investor (gold) | 6 | 1.9 [-0.1–4.1] 130 | 1.6 [-1.5–5.1] 64 | too dear | 2.3 |
| Peddler (yellow) | 4 | 8.1 [5.9–10.7] 86 | 6.7 [4.2–9.7] 30 | too cheap | 2.2 |
| Corner-Cutter (purple) | 6 | 2.3 [0.4–4.2] 98 | -0.2 [-4.4–3.6] 43 | too dear | 2.3 |
| Banker (gold) | 4 | 7.7 [6.5–9.2] 470 | 9.0 [4.8–12.9] 65 | too cheap | 2.1 |
| Toastmaster (silver) | 8 | 4.6 [2.8–6.7] 129 | 5.3 [3.3–7.5] 72 | too dear | 2.3 |
| Green Pillar (green) | 6 | 2.8 [1.0–4.3] 141 | 1.4 [-3.3–4.4] 38 | too dear | 2.2 |

### Needs an ability change, not a price (2)
Tax Collector (printed 4; Normal 8.7, Hard-20 8.7: would need > 2× its price); Upstart (printed 6; Normal 12.1, Hard-20 12.9: would need > 2× its price).

### Normal flags, Hard-20 confidently doesn't (likely a Normal-bot artifact) (6)
Revelers 6 (Normal 1.8 [-0.2–3.8], Hard-20 4.8 [2.1–7.7]); Hustler 2 (Normal 9.2 [6.7–12.3], Hard-20 2.4 [-1.1–6.6]); Sleepwalker 6 (Normal 11.0 [8.0–14.0], Hard-20 3.8 [1.9–6.6]); Insider 6 (Normal 2.5 [1.1–3.9], Hard-20 4.7 [2.7–7.4]); Kingpin 2 (Normal 6.3 [4.2–9.1], Hard-20 0.7 [-1.8–3.7]); Farmer 6 (Normal 0.8 [-1.2–2.8], Hard-20 9.7 [3.1–14.8]).

Normal flags, Hard-20 too thin or unsure to say: Overseer 4→1.3; Silversmith 6→3.9; Heir 8→10.4; Timekeeper 8→5.3; Big Spender 4→2.0 (Hard-20 6.8, n 142); Treasurer 4→6.5; Straggler 8→5.1 (Hard-20 5.5, n 141); Merchant 6→4.0; Chronicler 8→4.8; Groupie 8→5.1; Volunteer 0→4.3 (Hard-20 1.9, n 91); Lottery Winner 10→13.7; Blue Patron 6→3.5; Green Patron 6→3.7; Extra Hand 10→8.0; Blue Regular 3→1.0; Twins 2→3.9; Mole 4→6.6; Translator 6→2.6; Blue Pillar 6→3.6; Courier 6→2.8; Talent Scout 4→-0.1 (Hard-20 4.7, n 31); Snob 10→6.1; Crew 2→4.7; Green Elder 4→1.9; Planner 4→7.8 (Hard-20 5.8, n 31); Curator 4→2.2; Grifter 6→8.3; Onlooker 10→5.4; Rich Uncle 2→5.5; Liquidator 6→3.1; Lender 2→5.6; Exporter 8→2.2 (Hard-20 5.5, n 52); Light Fingers 8→3.3 (Hard-20 6.3, n 48); Tipster 6→9.9; Bulk Buyer 6→2.9; Shopkeeper 4→6.4; Dealer 2→-0.1; Heiress 10→7.0; Go-Between 8→4.5; Dyer 6→2.6; Harmonist 8→2.3 (Hard-20 -3.9, n 18); Recruiter 8→4.7; Rainmaker 6→2.1; Speculator 8→5.5; Pied Piper 4→6.3; Reseller 12→6.0; Night Owl 10→5.9.

<details><summary>Every card (Normal; Hard-20 where measured)</summary>

| card | printed | Normal fair [90%] | n | net at printed by round I/II/III | Hard-20 fair [90%] | n |
|---|---|---|---|---|---|---|
| Hustler (gold.hustler) | 2 | 9.2 [6.7–12.3] | 128 | -1.4 / 12.2 / 5.3 | 2.4 [-1.1–6.6] | 66 |
| Upstart (silver.spoon) | 6 | 12.1 [9.7–14.3] | 133 | 3.0 / -4.0 / 13.9 | 12.9 [9.5–16.9] | 74 |
| Extortionist (thieves.extortionist) | 6 | 11.0 [8.8–13.6] | 92 | 1.1 / -0.3 / 6.0 | 9.0 [6.2–12.4] | 46 |
| Sleepwalker (echo.afterimage) | 6 | 11.0 [8.0–14.0] | 89 | 7.9 / 4.7 / 0.3 | 3.8 [1.9–6.6] | 37 |
| Busker (echo.evergreen) | 4 | 8.8 [6.3–11.7] | 96 | 8.2 / 3.5 / 0.5 | 7.4 [5.2–10.7] | 49 |
| Tax Collector (gold.taxman) | 4 | 8.7 [6.6–10.9] | 148 | 5.2 / 7.0 / 8.4 | 8.7 [5.0–13.0] | 69 |
| Kingpin (thieves.kingpin) | 2 | 6.3 [4.2–9.1] | 95 | 1.3 / 3.2 / -0.6 | 0.7 [-1.8–3.7] | 58 |
| Volunteer (red.volunteer) | 0 | 4.3 [2.0–6.3] | 152 | -5.0 / -2.1 / 2.2 | 1.9 [-0.0–4.5] | 91 |
| Peddler (yellow.peddler) | 4 | 8.1 [5.9–10.7] | 86 | 11.7 / -1.0 / 4.7 | 6.7 [4.2–9.7] | 30 |
| Tipster (trading.tipster) | 6 | 9.9 [7.2–12.5] | 93 | 7.7 / 5.7 / 9.6 | – |  |
| Planner (market.planner) | 4 | 7.8 [5.4–10.4] | 89 | 6.4 / 11.8 / -2.8 | 5.8 [1.8–10.3] | 31 |
| Banker (gold.banker) | 4 | 7.7 [6.5–9.2] | 470 | 3.0 / 4.4 / -0.4 | 9.0 [4.8–12.9] | 65 |
| Lottery Winner (gold.jackpot) | 10 | 13.7 [11.1–16.6] | 126 | 2.0 / 7.0 / 1.4 | – |  |
| Lender (trading.lender) | 2 | 5.6 [2.7–8.2] | 88 | 2.1 / 7.7 / 7.7 | – |  |
| Rich Uncle (trading.safetynet) | 2 | 5.5 [3.0–8.2] | 105 | -6.5 / -3.0 / 3.0 | – |  |
| Understudy (echo.understudy) | 6 | 9.2 [5.9–12.5] | 78 | -3.5 / 0.8 / 9.9 | – |  |
| Crew (thieves.crew) | 2 | 4.7 [2.6–6.8] | 103 | -10.2 / 6.9 / -2.6 | – |  |
| Mole (thieves.mole) | 4 | 6.6 [4.6–8.8] | 105 | -5.5 / 2.8 / 2.8 | – |  |
| Treasurer (gold.seed) | 4 | 6.5 [4.2–8.6] | 127 | 3.3 / 2.0 / 3.5 | – |  |
| Shopkeeper (trading.shopkeeper) | 4 | 6.4 [4.0–8.7] | 93 | -7.0 / 3.3 / 3.9 | – |  |
| Heir (silver.heir) | 8 | 10.4 [8.2–12.9] | 131 | -3.0 / 3.2 / -1.7 | – |  |
| Pied Piper (red.drive) | 4 | 6.3 [4.2–8.5] | 119 | -2.9 / -0.1 / -1.9 | – |  |
| Mime (echo.mirror) | 6 | 8.3 [5.7–11.0] | 87 | 3.4 / 10.3 / -2.9 | – |  |
| Grifter (thieves.grifter) | 6 | 8.3 [6.2–10.7] | 68 | 4.7 / -7.0 / 3.1 | – |  |
| Benchwarmer (red.reserve) | 1 | 3.1 [0.9–5.4] | 112 | -3.8 / 3.1 / -3.6 | – |  |
| Pilgrim (yellow.pilgrim) | 4 | 6.0 [3.6–8.8] | 82 | 0.7 / 4.3 / 7.0 | – |  |
| Minimalist (market.minimalist) | 2 | 3.9 [1.8–6.1] | 75 | 3.8 / -5.5 / -1.4 | – |  |
| Twins (red.twins) | 2 | 3.9 [2.1–5.9] | 146 | -4.6 / 3.6 / 3.1 | – |  |
| Go-Getter (purple.secondwind) | 8 | 9.9 [7.2–12.7] | 96 | -0.9 / 4.0 / 9.4 | – |  |
| Underdog (gold.underdog) | 6 | 7.9 [5.9–9.7] | 135 | 5.1 / -0.3 / 1.5 | – |  |
| Lamplighter (purple.lamplighter) | 8 | 9.9 [7.8–12.3] | 87 | 10.4 / 0.3 / -3.5 | – |  |
| Robin Hood (thieves.robinhood) | 4 | 5.8 [3.8–8.0] | 101 | -2.9 / -0.7 / -2.8 | – |  |
| Cutpurse (thieves.cutpurse) | 4 | 5.8 [3.7–7.9] | 96 | 6.0 / 9.3 / 3.0 | – |  |
| Underbidder (market.underbidder) | 2 | 3.6 [1.1–6.1] | 82 | 2.0 / -0.3 / 2.2 | – |  |
| Green Recruit (green.recruit) | 1 | 2.5 [0.7–4.5] | 141 | 0.6 / 3.9 / 3.2 | – |  |
| Auctioneer (market.auctioneer) | 6 | 7.4 [4.7–10.0] | 59 | -5.7 / 0.5 / 7.8 | – |  |
| Raider (trading.raider) | 2 | 3.3 [1.4–6.3] | 92 | 1.8 / 13.1 / 5.1 | – |  |
| Gardener (yellow.gardener) | 2 | 3.3 [0.8–5.6] | 76 | 5.6 / 1.3 / -1.5 | – |  |
| Safecracker (thieves.bigscore) | 4 | 5.3 [3.1–7.5] | 101 | 2.0 / -4.7 / -0.4 | – |  |
| Tinker (gold.tinker) | 6 | 7.2 [5.0–9.5] | 124 | 5.4 / 2.9 / -1.1 | – |  |
| Majordomo (silver.majordomo) | 6 | 7.0 [4.5–9.2] | 134 | -3.2 / 4.0 / -0.4 | – |  |
| Benefactor (silver.benefactor) | 6 | 7.0 [4.8–8.6] | 145 | -0.8 / 0.8 / 3.9 | – |  |
| Penny Pincher (gold.thrift) | 4 | 4.9 [3.1–7.0] | 135 | 0.3 / -6.8 / -4.0 | – |  |
| Social Climber (market.climber) | 2 | 2.7 [0.1–4.7] | 98 | 0.8 / 4.7 / 4.2 | – |  |
| Stylist (market.stylist) | 4 | 4.6 [2.4–7.2] | 83 | 20.7 / 8.7 / -2.5 | – |  |
| Green Regular (green.regular) | 3 | 3.6 [2.2–5.5] | 150 | 2.6 / 3.3 / 2.3 | – |  |
| Lookout (thieves.lookout) | 6 | 6.5 [4.3–9.0] | 69 | 2.3 / -5.1 / 0.3 | – |  |
| Blue Hand (blue.hand) | 2 | 2.5 [0.7–4.3] | 130 | -0.2 / 6.4 / -3.5 | – |  |
| Pawnbroker (trading.pawnbroker) | 4 | 4.5 [2.6–6.6] | 100 | 0.9 / 1.8 / -3.0 | – |  |
| Errand Runner (purple.errand) | 8 | 8.4 [6.8–10.5] | 101 | 0.4 / -0.8 / 2.5 | – |  |
| Accomplice (thieves.accomplice) | 8 | 8.4 [6.3–10.6] | 84 | -1.4 / -0.6 / -3.1 | – |  |
| Middleman (gold.coinpurse) | 4 | 4.4 [2.7–5.9] | 148 | -7.3 / -2.1 / 5.4 | – |  |
| Desperado (thieves.desperado) | 4 | 4.4 [3.0–6.0] | 87 | -1.9 / 2.3 / 2.4 | – |  |
| Front-runner (benders.frontrunner) | 2 | 2.4 [1.0–3.4] | 300 | -0.1 / -2.6 / 1.7 | – |  |
| Apprentice (purple.apprentice) | 4 | 4.3 [2.3–7.1] | 106 | 5.4 / -2.8 / -0.5 | – |  |
| Blue Elder (blue.elder) | 4 | 4.3 [2.1–6.3] | 113 | 4.8 / 0.5 / 2.4 | – |  |
| Muse (echo.muse) | 4 | 4.3 [2.0–6.9] | 89 | 1.7 / 4.1 / 0.0 | – |  |
| Sticky Fingers (thieves.sticky) | 8 | 8.3 [5.9–10.7] | 80 | -4.8 / 5.3 / 6.2 | – |  |
| Intern (red.intern) | 1 | 1.3 [-0.8–3.3] | 132 | -1.6 / 4.8 / -2.7 | – |  |
| Crowd-Pleaser (red.crowd) | 2 | 2.2 [0.4–4.9] | 116 | 0.7 / 0.3 / -0.1 | – |  |
| Green Helper (green.helper) | 2 | 2.2 [0.3–4.5] | 127 | -3.6 / 1.2 / 0.1 | – |  |
| Prospector (gold.prospector) | 4 | 4.1 [2.1–6.2] | 146 | -2.9 / -8.9 / -5.4 | – |  |
| Taskmaster (purple.taskmaster) | 6 | 6.1 [3.8–8.3] | 111 | 8.9 / -4.8 / -0.1 | – |  |
| Freelancer (benders.freelancer) | 4 | 4.1 [2.7–5.5] | 305 | 1.2 / 0.6 / -2.2 | – |  |
| Foreman (purple.foreman) | 6 | 6.1 [4.1–8.3] | 99 | 0.6 / -19.2 / 9.3 | – |  |
| Late Riser (purple.lateriser) | 6 | 5.9 [3.7–8.4] | 104 | 1.8 / -1.5 / 0.9 | – |  |
| Patroness (market.patroness) | 8 | 7.9 [5.2–10.3] | 58 | 15.7 / 5.5 / 1.7 | – |  |
| Impressionist (echo.tuningfork) | 4 | 3.9 [1.7–6.3] | 96 | -2.0 / 0.1 / 1.1 | – |  |
| Big Family (red.bigfamily) | 4 | 3.8 [2.6–4.9] | 393 | -3.6 / -1.1 / -0.1 | 3.4 [0.5–7.1] | 73 |
| Blue Helper (blue.helper) | 2 | 1.8 [-0.1–4.0] | 110 | -1.0 / -2.4 / 0.7 | – |  |
| Caterer (silver.caterer) | 4 | 3.7 [2.0–6.0] | 148 | 1.6 / 0.3 / -1.7 | – |  |
| Wallflower (echo.wallflower) | 4 | 3.7 [0.8–6.9] | 81 | -1.9 / -10.0 / -2.9 | – |  |
| Ensemble (echo.ensemble) | 6 | 5.6 [2.8–8.3] | 82 | 9.5 / -2.0 / -3.2 | – |  |
| Guest (silver.guest) | 8 | 7.6 [5.4–9.7] | 135 | 6.6 / -2.9 / 1.8 | – |  |
| Broker (trading.broker) | 2 | 1.6 [-0.7–4.0] | 99 | -3.6 / 0.6 / -0.1 | – |  |
| Sommelier (market.sommelier) | 4 | 3.6 [0.9–5.7] | 87 | -6.5 / -3.2 / 2.6 | – |  |
| Sponsor (red.sponsor) | 10 | 9.5 [7.6–11.4] | 232 | 5.6 / 0.6 / -2.3 | 11.4 [8.7–15.0] | 53 |
| Grand Host (silver.grandhost) | 12 | 11.4 [8.8–13.6] | 117 | 2.7 / -1.9 / -2.2 | – |  |
| Recluse (market.recluse) | 4 | 3.4 [0.9–6.3] | 76 | -3.6 / -2.5 / -0.0 | – |  |
| Reinvestor (trading.reinvestor) | 4 | 3.3 [1.0–5.6] | 96 | 10.1 / -2.1 / -3.6 | – |  |
| Shift Crew (purple.crew) | 2 | 1.3 [-1.0–3.5] | 97 | -12.1 / 8.7 / -3.5 | – |  |
| Green Devotee (green.devotee) | 4 | 3.2 [1.5–4.9] | 157 | -0.0 / -3.1 / 4.3 | – |  |
| Admirer (yellow.admirer) | 6 | 5.2 [1.9–8.5] | 57 | 3.8 / -10.3 / -1.5 | – |  |
| Green Hand (green.hand) | 2 | 1.2 [-0.3–2.8] | 152 | 0.7 / 0.1 / 3.6 | – |  |
| Host (red.host) | 6 | 5.2 [3.2–8.2] | 113 | 4.3 / 3.6 / -4.4 | – |  |
| Bodyguard (thieves.watchdog) | 6 | 5.2 [3.4–7.5] | 76 | 4.0 / 1.9 / -2.5 | – |  |
| Late Bloomer (yellow.latebloomer) | 4 | 3.2 [1.0–5.9] | 83 | 2.6 / -0.9 / 0.4 | – |  |
| Connoisseur (market.connoisseur) | 4 | 3.0 [0.5–5.2] | 98 | -4.7 / -1.9 / -0.7 | – |  |
| Retinue (silver.retinue) | 4 | 3.0 [0.6–5.1] | 137 | -4.4 / -3.0 / -1.4 | – |  |
| Weaver (yellow.weaver) | 6 | 4.9 [2.3–7.9] | 59 | 10.0 / -9.3 / 3.2 | – |  |
| Squatter (benders.squatter) | 8 | 6.9 [5.4–8.3] | 260 | 0.6 / 0.8 / -3.4 | – |  |
| Blue Recruit (blue.recruit) | 1 | -0.2 [-1.9–1.7] | 124 | 2.3 / -0.1 / 0.5 | – |  |
| Blue Devotee (blue.devotee) | 4 | 2.7 [1.0–4.8] | 121 | -7.0 / 3.4 / 0.5 | – |  |
| Tribute Band (echo.dejavu) | 12 | 10.6 [7.2–14.3] | 56 | -7.3 / 16.7 / -1.7 | – |  |
| Doppelganger (red.doppel) | 6 | 4.6 [2.3–6.8] | 111 | -3.8 / -1.5 / 1.8 | – |  |
| Patriarch (red.patriarch) | 10 | 8.5 [5.7–11.7] | 69 | 1.6 / 3.4 / 2.1 | – |  |
| Clockmaker (purple.clockmaker) | 4 | 2.3 [0.6–4.4] | 104 | 0.9 / -5.9 / 1.6 | – |  |
| Debutante (silver.gala) | 8 | 6.3 [3.7–8.8] | 139 | 1.7 / -0.1 / 0.7 | – |  |
| Steward (silver.steward) | 4 | 2.3 [0.8–4.1] | 156 | -0.7 / 0.7 / -2.5 | – |  |
| Curator (market.curator) | 4 | 2.2 [0.2–3.9] | 93 | 1.2 / -4.2 / -2.1 | – |  |
| Double Agent (thieves.doubleagent) | 6 | 4.1 [1.4–6.5] | 79 | -5.0 / -8.0 / -2.5 | – |  |
| Mob (red.mob) | 8 | 6.1 [3.4–8.9] | 98 | -3.5 / -4.6 / -1.4 | – |  |
| Bookkeeper (purple.bookkeeper) | 6 | 4.0 [1.5–6.8] | 94 | -2.4 / -1.5 / -6.6 | – |  |
| Choir (echo.choir) | 6 | 4.0 [1.7–6.5] | 77 | -13.1 / -0.1 / -5.7 | – |  |
| Blue Regular (blue.regular) | 3 | 1.0 [-0.7–2.5] | 114 | -1.9 / 1.0 / -1.6 | – |  |
| Extra Hand (benders.extrahand) | 10 | 8.0 [6.7–9.5] | 303 | -2.4 / -3.7 / -1.8 | – |  |
| Big Spender (benders.bigspender) | 4 | 2.0 [0.9–3.3] | 314 | -3.7 / 1.1 / -2.3 | 6.8 [4.4–9.5] | 142 |
| Dowager (silver.dowager) | 4 | 2.0 [-0.6–4.3] | 144 | -4.2 / -2.2 / 2.7 | – |  |
| Shareholder (trading.shareholder) | 3 | 1.0 [-1.5–3.8] | 91 | 0.0 / -3.4 / 2.6 | – |  |
| Merchant (gold.merchant) | 6 | 4.0 [1.8–6.0] | 133 | 1.0 / -6.0 / -4.9 | – |  |
| Green Elder (green.elder) | 4 | 1.9 [0.5–3.4] | 139 | -5.2 / -0.4 / -1.3 | – |  |
| Stunt Double (echo.hourglass) | 10 | 7.9 [4.5–11.8] | 72 | -9.6 / -1.5 / -1.4 | – |  |
| Dealer (trading.dealer) | 2 | -0.1 [-2.3–1.9] | 86 | 5.5 / 7.8 / -6.0 | – |  |
| Sower (yellow.sower) | 4 | 1.9 [-0.9–4.8] | 78 | -13.1 / -6.8 / -0.8 | – |  |
| Silversmith (silver.silversmith) | 6 | 3.9 [1.9–5.5] | 143 | -7.4 / 2.7 / -3.5 | – |  |
| Green Patron (green.patron) | 6 | 3.7 [2.2–5.5] | 136 | 0.4 / -6.8 / -0.1 | – |  |
| Explorer (yellow.explorer) | 8 | 5.7 [3.1–8.1] | 62 | 2.3 / 0.8 / -8.5 | – |  |
| Proselytizer (red.proselytizer) | 12 | 9.7 [7.3–12.1] | 89 | -0.6 / -8.9 / 2.7 | – |  |
| Blue Pillar (blue.pillar) | 6 | 3.6 [1.7–5.7] | 115 | -0.3 / 0.2 / 1.3 | – |  |
| Speculator (gold.speculator) | 8 | 5.5 [3.5–7.6] | 136 | -6.6 / -3.5 / -1.8 | – |  |
| Blue Patron (blue.patron) | 6 | 3.5 [1.6–5.5] | 119 | -3.8 / -1.3 / -2.7 | – |  |
| Feastmaker (yellow.feastmaker) | 10 | 7.4 [3.4–10.1] | 42 | 3.4 / -2.3 / -4.4 | – |  |
| Timekeeper (purple.patience) | 8 | 5.3 [2.9–7.6] | 88 | -11.4 / 1.7 / -3.8 | – |  |
| Overseer (purple.overseer) | 4 | 1.3 [-0.8–3.6] | 100 | 0.6 / -9.9 / -3.0 | – |  |
| Liquidator (trading.liquidator) | 6 | 3.1 [0.7–5.4] | 92 | 5.3 / -4.8 / -2.8 | – |  |
| Straggler (benders.straggler) | 8 | 5.1 [4.0–6.4] | 309 | 0.7 / -0.3 / -3.3 | 5.5 [3.0–8.3] | 141 |
| Groupie (echo.groupie) | 8 | 5.1 [2.6–7.7] | 87 | 6.4 / 3.0 / -1.2 | – |  |
| Heiress (trading.heiress) | 10 | 7.0 [4.4–9.5] | 90 | -9.8 / -4.4 / -1.0 | – |  |
| Mentor & Protégé (red.mentor) | 10 | 6.9 [3.7–10.0] | 76 | -9.1 / 4.1 / -6.0 | – |  |
| Bulk Buyer (trading.bulkbuyer) | 6 | 2.9 [0.4–5.3] | 82 | -10.7 / -1.0 / 3.3 | – |  |
| Chronicler (echo.chronicler) | 8 | 4.8 [2.8–7.3] | 88 | 2.3 / -9.6 / -1.2 | – |  |
| Green Pillar (green.pillar) | 6 | 2.8 [1.0–4.3] | 141 | -0.3 / -0.2 / -2.5 | 1.4 [-3.3–4.4] | 38 |
| Courier (purple.courier) | 6 | 2.8 [0.6–5.0] | 94 | -8.1 / -11.0 / -2.6 | – |  |
| Recruiter (red.recruiter) | 8 | 4.7 [2.4–7.0] | 104 | -0.6 / 4.7 / -4.1 | – |  |
| Dyer (yellow.dyer) | 6 | 2.6 [-0.6–5.6] | 60 | -3.0 / -4.7 / -2.1 | – |  |
| Toastmaster (silver.toastmaster) | 8 | 4.6 [2.8–6.7] | 129 | -2.6 / 2.7 / 4.6 | 5.3 [3.3–7.5] | 72 |
| Translator (echo.translator) | 6 | 2.6 [0.4–5.3] | 83 | 6.0 / 0.8 / 1.7 | – |  |
| Go-Between (yellow.gobetween) | 8 | 4.5 [2.3–7.3] | 63 | -0.6 / -1.0 / -2.6 | – |  |
| Insider (benders.insider) | 6 | 2.5 [1.1–3.9] | 273 | -0.1 / -2.2 / -4.4 | 4.7 [2.7–7.4] | 128 |
| Gleaner (yellow.gleaner) | 10 | 6.4 [4.0–10.7] | 50 | -5.1 / -10.1 / -5.3 | – |  |
| Corner-Cutter (purple.doubletime) | 6 | 2.3 [0.4–4.2] | 98 | -2.8 / -7.1 / -0.1 | -0.2 [-4.4–3.6] | 43 |
| Snob (market.snob) | 10 | 6.1 [3.0–9.0] | 51 | -10.4 / -12.7 / 4.6 | – |  |
| Rainmaker (yellow.rainmaker) | 6 | 2.1 [-0.5–4.9] | 63 | -2.7 / -3.8 / -9.6 | – |  |
| Night Owl (purple.nightowl) | 10 | 5.9 [2.9–9.3] | 71 | -0.8 / -8.2 / -0.3 | – |  |
| Talent Scout (market.blackmarket) | 4 | -0.1 [-2.3–2.2] | 93 | 5.4 / -3.5 / -5.8 | 4.7 [-1.0–11.4] | 31 |
| Investor (gold.investor) | 6 | 1.9 [-0.1–4.1] | 130 | -5.1 / -6.6 / -1.3 | 1.6 [-1.5–5.1] | 64 |
| Revelers (silver.revelers) | 6 | 1.8 [-0.2–3.8] | 137 | -6.0 / -7.0 / -2.4 | 4.8 [2.1–7.7] | 70 |
| Magnate (trading.magnate) | 8 | 3.6 [1.7–5.5] | 85 | -7.2 / 2.3 / -4.7 | 3.6 [-0.1–6.7] | 54 |
| Onlooker (market.onlooker) | 10 | 5.4 [0.1–9.1] | 50 | 8.3 / -1.9 / -7.0 | – |  |
| Light Fingers (thieves.lightfingers) | 8 | 3.3 [1.2–5.5] | 73 | 3.6 / -2.0 / -6.1 | 6.3 [2.6–10.9] | 48 |
| Farmer (yellow.farmer) | 6 | 0.8 [-1.2–2.8] | 70 | 2.5 / -2.6 / -4.3 | 9.7 [3.1–14.8] | 22 |
| Harmonist (yellow.harmonist) | 8 | 2.3 [-0.7–5.2] | 51 | -0.2 / -7.3 / -9.8 | -3.9 [-11.9–0.9] | 18 |
| Exporter (trading.exporter) | 8 | 2.2 [-0.5–5.0] | 76 | -6.7 / 1.5 / -7.8 | 5.5 [0.4–8.9] | 52 |
| Reseller (market.reseller) | 12 | 6.0 [1.5–11.4] | 41 | -2.0 / 7.7 / 0.7 | – |  |
| Midas (gold.midas) | 8 | 1.1 [-1.1–3.3] | 142 | -17.2 / -2.1 / -4.2 | 3.0 [-1.0–6.2] | 63 |
| Tycoon (gold.tycoon) | 12 | 4.9 [3.3–6.4] | 321 | -5.2 / -8.7 / -7.1 | 7.5 [3.2–11.7] | 56 |
| Patron Saint (silver.saint) | 12 | 3.7 [1.6–5.8] | 127 | -3.4 / -10.9 / -2.4 | 4.6 [1.6–7.4] | 59 |

</details>

## 3. Spaces
Paired forced placement: from the start of round r, the seat's first minion must take the space (base: the bot's own choice). A "null" minion (bot's own choice, action does nothing) in every game gives the zero, so worth = followers of margin over a minion that does nothing; u = worth ÷ that round's price slope (Normal 0.81 / 0.94 / 0.67, Hard-20 0.84 / 0.71 / 0.73 followers per resource, rounds I / II / III). Raw u also counts the buy a placement enables and early compounding, so it runs high; scaled u sets each round's median space to the middle of its band (×1.06 / 1.32 / 1.59 for rounds I / II / III) and says where a space sits among its round's field on the value model's ruler (round I 2–3u, II 3–5u, III 5–9u). Flag, on scaled u: above the band in any round, below it in the space's own ring's round, or worth below 0. "vs choice" = against the bot's own pick (≤ 0 means the bot was right to skip it). Blocked = a rival took it first.
Normal's own pick is worth 2.0 followers in round 1, 2.5 followers in round 2, 6.3 followers in round 3 over a null minion (2.4u / 2.7u / 9.4u).

### Both instruments agree (7)
| space | ring | round | Normal scaled u [90%] n | Hard-20 scaled u [90%] n | band | reads |
|---|---|---|---|---|---|---|
| Bloom (green) | 3 | 3 | 15.0 [12.6–17.7] 90 | 15.9 [13.4–18.7] 20 | 5–9 | strong |
| Shake Down (thieves) | 2 | 2 | 10.4 [7.8–13.3] 78 | 12.0 [7.6–17.2] 58 | 3–5 | strong |
| Crunch Time (purple) | 3 | 3 | 19.7 [15.7–24.1] 78 | 22.9 [16.0–29.2] 33 | 5–9 | strong |
| Orchard (green) | 2 | 2 | 7.3 [5.2–9.6] 102 | 12.7 [8.9–17.3] 35 | 3–5 | strong |
| Plan Ahead (purple) | 2 | 3 | 20.3 [17.0–24.3] 74 | 19.0 [16.6–22.1] 26 | 5–9 | strong |
| Open House (red) | 2 | 3 | 14.6 [11.4–18.1] 110 | 13.9 [9.0–17.9] 80 | 5–9 | strong |
| Open House (red) | 2 | 2 | 8.4 [5.4–11.2] 79 | 10.0 [6.7–14.2] 66 | 3–5 | strong |

### Normal flags, Hard-20 confidently doesn't (likely a Normal-bot artifact) (6)
Crescendo r3 (Normal 16.3 [12.5–20.4], Hard-20 10.9 [7.6–14.1] scaled u); Rising Tide r3 (Normal 16.2 [12.8–19.6], Hard-20 10.7 [7.0–15.5] scaled u); Hand-pick r3 (Normal 15.3 [11.0–18.9], Hard-20 9.5 [6.2–14.0] scaled u); Crime Wave r2 (Normal 7.9 [5.4–10.3], Hard-20 4.1 [0.4–7.3] scaled u); Toast r3 (Normal 20.2 [16.1–24.1], Hard-20 13.0 [8.2–18.4] scaled u); Toast r2 (Normal 10.1 [7.4–12.9], Hard-20 1.9 [-2.3–6.5] scaled u).

Normal flags, Hard-20 too thin or unsure to say: Golden Years r1 strong (7.6u; Hard-20 2.7u, n 34); Half Price r2 weak (0.1u; Hard-20 5.2u, n 32); Dividend r3 strong (18.1u; Hard-20 13.6u, n 31); Flood r3 strong (13.8u; Hard-20 14.7u, n 6).

<details><summary>Every space and round (Normal; Hard-20 where measured)</summary>

| space | sphere | ring | round | worth (followers) [90%] | raw u | scaled u [90%] | vs choice | blocked | n | Hard-20 scaled u [90%] |
|---|---|---|---|---|---|---|---|---|---|---|
| Golden Years | gold | 1 | 1 | 5.8 [3.9–7.6] | 7.1 | 7.6 [5.1–9.9] | 3.9 | 0.0% | 138 | 2.7 [-3.4–9.1] |
| Shoal | blue | 1 | 1 | 4.4 [2.0–6.7] | 5.4 | 5.7 [2.6–8.8] | 2.4 | 18.2% | 72 | – |
| Name Drop | market | 1 | 1 | 4.1 [1.6–6.6] | 5.0 | 5.3 [2.1–8.6] | 2.1 | 0.0% | 91 | 0.1 [-7.9–7.6] |
| Kickback | gold | 1 | 1 | 4.0 [2.3–5.8] | 4.9 | 5.2 [3.0–7.6] | 2.0 | 5.2% | 145 | -0.6 [-8.2–13.1] |
| Help Yourself | thieves | 1 | 1 | 3.5 [2.1–5.0] | 4.3 | 4.6 [2.7–6.6] | 1.5 | 0.9% | 116 | 8.0 [0.9–13.8] |
| Sob Story | trading | 1 | 1 | 3.5 [1.0–6.3] | 4.3 | 4.5 [1.4–8.2] | 1.5 | 10.6% | 76 | 3.3 [-7.2–13.2] |
| Goody Bags | silver | 1 | 1 | 3.4 [1.0–5.8] | 4.1 | 4.4 [1.4–7.6] | 1.4 | 29.5% | 79 | 12.4 [-12.2–34.8] |
| Graft | green | 1 | 1 | 3.1 [1.4–5.1] | 3.8 | 4.1 [1.9–6.6] | 1.2 | 5.0% | 115 | 8.1 [2.8–11.4] |
| Current | blue | 1 | 1 | 3.1 [1.2–5.0] | 3.8 | 4.0 [1.6–6.6] | 1.1 | 2.4% | 81 | – |
| Tide | blue | 1 | 1 | 2.8 [0.4–4.4] | 3.5 | 3.7 [0.5–5.8] | 0.9 | 3.5% | 109 | – |
| Your Call | trading | 1 | 1 | 2.8 [0.5–5.3] | 3.4 | 3.6 [0.7–6.9] | 0.8 | 0.0% | 82 | 4.3 [-5.7–18.2] |
| Harvest | yellow | 1 | 1 | 2.8 [0.8–4.8] | 3.4 | 3.6 [1.1–6.3] | 0.8 | 0.0% | 110 | 13.6 [1.7–16.1] |
| Intro Offer | gold | 1 | 1 | 2.7 [0.8–4.4] | 3.3 | 3.5 [1.0–5.8] | 0.7 | 0.0% | 122 | 6.1 [-4.9–18.6] |
| Crescendo | echo | 1 | 1 | 2.4 [-0.3–5.3] | 3.0 | 3.1 [-0.4–7.0] | 0.4 | 0.0% | 81 | 13.5 [-0.3–28.0] |
| New Faces | market | 1 | 1 | 2.0 [-0.1–4.4] | 2.5 | 2.6 [-0.1–5.7] | 0.0 | 0.0% | 97 | – |
| Hum | echo | 1 | 1 | 2.0 [-1.1–5.5] | 2.4 | 2.6 [-1.5–7.1] | 0.0 | 8.2% | 89 | 19.4 [3.0–32.0] |
| Clock In | purple | 1 | 1 | 1.9 [-0.2–4.3] | 2.3 | 2.5 [-0.2–5.6] | -0.0 | 7.8% | 94 | 13.6 [4.1–18.8] |
| Open Door | red | 1 | 1 | 1.9 [-0.0–4.1] | 2.3 | 2.5 [-0.0–5.4] | -0.1 | 8.5% | 108 | 3.2 [-0.2–7.3] |
| Lie Low | thieves | 1 | 1 | 1.8 [-0.3–3.8] | 2.3 | 2.4 [-0.4–4.9] | -0.1 | 0.0% | 75 | 7.2 [2.0–14.7] |
| Top Up | yellow | 1 | 1 | 1.8 [-0.9–4.2] | 2.2 | 2.4 [-1.2–5.5] | -0.1 | 42.0% | 51 | – |
| Good Deed | silver | 1 | 1 | 1.6 [-0.3–3.1] | 2.0 | 2.1 [-0.3–4.1] | -0.4 | 2.5% | 117 | 13.7 [5.7–19.8] |
| Toast | silver | 1 | 1 | 1.6 [-0.3–3.7] | 1.9 | 2.1 [-0.4–4.8] | -0.4 | 0.0% | 125 | 7.4 [-5.3–16.8] |
| Sprout | green | 1 | 1 | 1.4 [0.1–2.6] | 1.7 | 1.8 [0.2–3.4] | -0.6 | 1.8% | 168 | 10.8 [3.7–13.1] |
| Even Swap | red | 1 | 1 | 1.2 [-0.5–2.9] | 1.4 | 1.5 [-0.7–3.8] | -0.8 | 0.0% | 142 | 6.8 [-1.6–18.5] |
| Catch Up | purple | 1 | 1 | 1.0 [-1.9–4.0] | 1.2 | 1.3 [-2.4–5.2] | -1.0 | 0.0% | 73 | 3.6 [0.1–11.2] |
| Trade Seeds | yellow | 1 | 1 | 0.9 [-1.2–3.4] | 1.2 | 1.2 [-1.5–4.4] | -1.0 | 0.0% | 77 | 12.6 [3.9–21.1] |
| Redistribute | thieves | 1 | 1 | 0.8 [-1.1–2.9] | 1.0 | 1.1 [-1.4–3.8] | -1.1 | 0.0% | 97 | 11.5 [1.9–18.6] |
| Bandwagon | red | 1 | 1 | 0.4 [-1.7–2.6] | 0.5 | 0.5 [-2.2–3.4] | -1.6 | 0.0% | 99 | 25.4 [5.3–29.6] |
| Snap Up | market | 1 | 1 | 0.3 [-1.4–2.1] | 0.4 | 0.4 [-1.9–2.7] | -1.6 | 2.5% | 119 | 14.0 [3.0–18.7] |
| Echo | echo | 1 | 1 | 0.2 [-2.0–2.9] | 0.3 | 0.3 [-2.6–3.8] | -1.7 | 2.7% | 71 | 10.0 [1.7–11.9] |
| Root | green | 1 | 1 | 0.2 [-1.5–2.0] | 0.3 | 0.3 [-1.9–2.6] | -1.7 | 9.7% | 93 | 12.7 [2.8–16.5] |
| Cheap Seats | trading | 1 | 1 | -0.4 [-2.4–1.7] | -0.5 | -0.6 [-3.1–2.2] | -2.4 | 0.0% | 103 | 7.4 [0.2–14.0] |
| Roll Call | purple | 1 | 1 | -0.4 [-2.6–1.8] | -0.5 | -0.6 [-3.5–2.4] | -2.4 | 0.0% | 81 | – |
| Shake Down | thieves | 2 | 2 | 7.4 [5.5–9.4] | 7.9 | 10.4 [7.8–13.3] | 4.9 | 10.3% | 78 | 12.0 [7.6–17.2] |
| Toast | silver | 1 | 2 | 7.1 [5.2–9.1] | 7.6 | 10.1 [7.4–12.9] | 4.6 | 17.9% | 115 | 1.9 [-2.3–6.5] |
| Open House | red | 2 | 2 | 5.9 [3.8–7.9] | 6.3 | 8.4 [5.4–11.2] | 3.4 | 6.0% | 79 | 10.0 [6.7–14.2] |
| Plan Ahead | purple | 2 | 2 | 5.8 [3.4–8.4] | 6.2 | 8.2 [4.8–11.9] | 3.3 | 19.8% | 65 | 13.0 [7.0–16.7] |
| Crime Wave | thieves | 2 | 2 | 5.6 [3.8–7.3] | 6.0 | 7.9 [5.4–10.3] | 3.1 | 2.1% | 95 | 4.1 [0.4–7.3] |
| Orchard | green | 2 | 2 | 5.1 [3.7–6.8] | 5.5 | 7.3 [5.2–9.6] | 2.6 | 2.9% | 102 | 12.7 [8.9–17.3] |
| Intro Offer | gold | 1 | 2 | 5.0 [3.5–6.8] | 5.4 | 7.1 [4.9–9.7] | 2.5 | 0.0% | 150 | 9.3 [5.6–14.0] |
| Help Yourself | thieves | 1 | 2 | 4.8 [3.4–6.8] | 5.1 | 6.8 [4.8–9.6] | 2.3 | 4.2% | 92 | – |
| Lie Low | thieves | 1 | 2 | 4.6 [2.7–6.9] | 4.9 | 6.5 [3.8–9.8] | 2.1 | 0.0% | 76 | – |
| Harbor | blue | 2 | 2 | 4.4 [2.5–6.0] | 4.7 | 6.3 [3.5–8.5] | 2.0 | 12.6% | 76 | – |
| Open Door | red | 1 | 2 | 4.3 [2.1–6.6] | 4.6 | 6.1 [3.0–9.3] | 1.8 | 0.0% | 113 | 44.3 [5.9–55.8] |
| Clock In | purple | 1 | 2 | 4.3 [2.5–5.9] | 4.5 | 6.0 [3.6–8.3] | 1.8 | 2.9% | 100 | – |
| Reprise | echo | 2 | 2 | 4.2 [1.8–6.4] | 4.4 | 5.9 [2.5–9.0] | 1.7 | 0.0% | 79 | 12.9 [1.7–24.2] |
| Golden Years | gold | 1 | 2 | 4.1 [2.4–5.9] | 4.4 | 5.8 [3.4–8.3] | 1.6 | 5.7% | 132 | 21.8 [-2.2–57.3] |
| Grove | green | 2 | 2 | 3.9 [1.9–5.5] | 4.2 | 5.5 [2.8–7.8] | 1.4 | 8.1% | 79 | – |
| Collect Debts | gold | 2 | 2 | 3.9 [2.3–5.9] | 4.1 | 5.5 [3.3–8.3] | 1.4 | 3.8% | 126 | 36.2 [9.1–44.2] |
| Overtime | purple | 2 | 2 | 3.8 [1.8–6.0] | 4.0 | 5.3 [2.6–8.5] | 1.3 | 0.0% | 78 | 7.6 [4.6–15.2] |
| Crescendo | echo | 1 | 2 | 3.6 [1.1–6.5] | 3.8 | 5.1 [1.5–9.2] | 1.1 | 3.7% | 78 | – |
| Root | green | 1 | 2 | 3.3 [1.8–4.7] | 3.5 | 4.7 [2.5–6.6] | 0.8 | 1.6% | 120 | – |
| Hum | echo | 1 | 2 | 3.2 [1.0–5.1] | 3.4 | 4.5 [1.4–7.2] | 0.7 | 0.0% | 112 | – |
| Name Drop | market | 1 | 2 | 3.2 [1.5–5.0] | 3.4 | 4.5 [2.2–7.0] | 0.7 | 0.0% | 112 | – |
| Swell | blue | 2 | 2 | 3.2 [1.1–4.9] | 3.4 | 4.5 [1.6–7.0] | 0.7 | 5.8% | 81 | – |
| Encore | echo | 2 | 2 | 3.0 [1.1–5.1] | 3.2 | 4.3 [1.6–7.1] | 0.5 | 1.2% | 83 | 5.2 [-10.6–28.3] |
| New Faces | market | 1 | 2 | 3.0 [0.9–5.2] | 3.2 | 4.3 [1.3–7.3] | 0.5 | 0.0% | 91 | – |
| Tide | blue | 1 | 2 | 3.0 [1.7–4.7] | 3.2 | 4.2 [2.4–6.6] | 0.5 | 0.0% | 131 | – |
| Goody Bags | silver | 1 | 2 | 2.9 [0.7–5.0] | 3.1 | 4.1 [1.0–7.1] | 0.4 | 0.0% | 103 | – |
| Your Call | trading | 1 | 2 | 2.8 [0.0–5.6] | 3.0 | 4.0 [0.1–7.9] | 0.3 | 1.4% | 72 | – |
| Redistribute | thieves | 1 | 2 | 2.8 [1.0–4.8] | 3.0 | 4.0 [1.4–6.7] | 0.3 | 0.0% | 86 | – |
| Good Deed | silver | 1 | 2 | 2.8 [1.1–4.7] | 3.0 | 3.9 [1.5–6.6] | 0.3 | 0.9% | 116 | -28.7 [-41.3–13.9] |
| Harvest | yellow | 1 | 2 | 2.7 [1.0–4.6] | 2.9 | 3.8 [1.4–6.5] | 0.2 | 0.7% | 141 | – |
| Sweet Talk | silver | 2 | 2 | 2.6 [0.8–4.6] | 2.8 | 3.7 [1.1–6.5] | 0.1 | 0.8% | 119 | 12.3 [5.9–14.8] |
| Dividend | trading | 2 | 2 | 2.5 [0.5–4.7] | 2.6 | 3.5 [0.7–6.7] | -0.0 | 2.5% | 78 | – |
| Sprout | green | 1 | 2 | 2.2 [0.9–3.4] | 2.4 | 3.1 [1.3–4.8] | -0.3 | 0.0% | 140 | 28.4 [5.9–34.2] |
| Tithe | gold | 2 | 2 | 2.0 [0.5–3.8] | 2.2 | 2.9 [0.7–5.4] | -0.4 | 0.0% | 112 | -0.7 [-7.3–12.4] |
| Sob Story | trading | 1 | 2 | 2.0 [0.0–4.2] | 2.2 | 2.9 [0.0–6.0] | -0.5 | 8.8% | 104 | – |
| Kickback | gold | 1 | 2 | 1.9 [0.2–3.6] | 2.1 | 2.7 [0.3–5.1] | -0.6 | 0.7% | 152 | – |
| Echo | echo | 1 | 2 | 1.8 [-0.1–3.9] | 1.9 | 2.5 [-0.2–5.5] | -0.7 | 0.0% | 90 | – |
| Graft | green | 1 | 2 | 1.6 [0.2–3.3] | 1.7 | 2.3 [0.2–4.6] | -0.9 | 0.0% | 108 | – |
| Current | blue | 1 | 2 | 1.6 [-0.4–3.5] | 1.7 | 2.2 [-0.5–5.0] | -0.9 | 0.0% | 92 | – |
| Shoal | blue | 1 | 2 | 1.5 [0.0–3.3] | 1.7 | 2.2 [0.0–4.6] | -0.9 | 1.0% | 101 | – |
| Potluck | yellow | 2 | 2 | 1.5 [-0.7–4.0] | 1.6 | 2.2 [-1.0–5.6] | -1.0 | 0.0% | 70 | – |
| Top Up | yellow | 1 | 2 | 1.3 [-0.5–3.3] | 1.4 | 1.9 [-0.7–4.6] | -1.2 | 1.0% | 100 | 1.0 [-2.7–13.5] |
| Swap Sides | red | 2 | 2 | 1.3 [-0.5–3.2] | 1.4 | 1.8 [-0.8–4.6] | -1.2 | 2.1% | 94 | – |
| Snap Up | market | 1 | 2 | 1.2 [-0.4–3.2] | 1.3 | 1.7 [-0.6–4.5] | -1.3 | 0.0% | 125 | – |
| Branch Out | yellow | 2 | 2 | 1.1 [-0.8–3.0] | 1.2 | 1.6 [-1.2–4.3] | -1.4 | 0.0% | 88 | 7.0 [4.6–12.4] |
| Roll Call | purple | 1 | 2 | 1.0 [-0.4–2.5] | 1.1 | 1.5 [-0.6–3.5] | -1.5 | 0.0% | 97 | – |
| Show Off | market | 2 | 2 | 1.0 [-0.9–2.9] | 1.0 | 1.3 [-1.2–4.0] | -1.5 | 0.0% | 86 | – |
| Rising Tide | silver | 2 | 2 | 0.8 [-1.2–2.9] | 0.9 | 1.1 [-1.6–4.2] | -1.7 | 0.0% | 114 | 8.6 [4.4–15.5] |
| Sell High | trading | 2 | 2 | 0.5 [-1.8–2.8] | 0.5 | 0.7 [-2.6–3.9] | -2.0 | 5.9% | 80 | – |
| Catch Up | purple | 1 | 2 | 0.4 [-1.7–2.2] | 0.4 | 0.5 [-2.4–3.1] | -2.1 | 0.0% | 85 | – |
| Even Swap | red | 1 | 2 | 0.1 [-1.3–1.7] | 0.1 | 0.1 [-1.9–2.4] | -2.4 | 2.6% | 147 | – |
| Trade Seeds | yellow | 1 | 2 | 0.1 [-2.0–2.4] | 0.1 | 0.1 [-2.8–3.4] | -2.4 | 0.0% | 91 | 5.1 [2.1–13.5] |
| Half Price | market | 2 | 2 | 0.0 [-1.8–2.1] | 0.0 | 0.1 [-2.6–2.9] | -2.5 | 7.1% | 91 | 5.2 [-0.7–10.6] |
| Bandwagon | red | 1 | 2 | -0.5 [-2.2–1.3] | -0.5 | -0.7 [-3.1–1.9] | -3.0 | 0.0% | 110 | 1.3 [-2.3–5.3] |
| Cheap Seats | trading | 1 | 2 | -1.2 [-3.5–1.2] | -1.2 | -1.6 [-5.0–1.7] | -3.7 | 0.0% | 74 | 2.5 [-2.3–7.0] |
| Plan Ahead | purple | 2 | 3 | 8.6 [7.2–10.3] | 12.8 | 20.3 [17.0–24.3] | 2.3 | 19.6% | 74 | 19.0 [16.6–22.1] |
| Toast | silver | 1 | 3 | 8.6 [6.8–10.2] | 12.7 | 20.2 [16.1–24.1] | 2.2 | 21.2% | 89 | 13.0 [8.2–18.4] |
| Crunch Time | purple | 3 | 3 | 8.4 [6.6–10.2] | 12.4 | 19.7 [15.7–24.1] | 2.0 | 0.0% | 78 | 22.9 [16.0–29.2] |
| Dividend | trading | 2 | 3 | 7.7 [5.6–9.3] | 11.4 | 18.1 [13.2–21.9] | 1.3 | 9.1% | 70 | 13.6 [8.0–18.3] |
| Crescendo | echo | 1 | 3 | 6.9 [5.3–8.7] | 10.3 | 16.3 [12.5–20.4] | 0.6 | 6.4% | 88 | 10.9 [7.6–14.1] |
| Rising Tide | silver | 2 | 3 | 6.9 [5.4–8.3] | 10.2 | 16.2 [12.8–19.6] | 0.5 | 7.3% | 102 | 10.7 [7.0–15.5] |
| Hand-pick | red | 3 | 3 | 6.5 [4.7–8.0] | 9.7 | 15.3 [11.0–18.9] | 0.2 | 9.4% | 106 | 9.5 [6.2–14.0] |
| Bloom | green | 3 | 3 | 6.3 [5.3–7.5] | 9.4 | 15.0 [12.6–17.7] | 0.0 | 19.6% | 90 | 15.9 [13.4–18.7] |
| Open House | red | 2 | 3 | 6.2 [4.8–7.7] | 9.2 | 14.6 [11.4–18.1] | -0.2 | 4.3% | 110 | 13.9 [9.0–17.9] |
| Flood | blue | 3 | 3 | 5.8 [4.6–7.3] | 8.7 | 13.8 [10.8–17.3] | -0.5 | 21.2% | 78 | 14.7 [-3.4–20.6] |
| Overtime | purple | 2 | 3 | 5.4 [3.8–7.2] | 8.1 | 12.8 [9.0–16.9] | -0.9 | 0.0% | 73 | 11.1 [3.9–18.0] |
| Help Yourself | thieves | 1 | 3 | 5.2 [3.8–6.4] | 7.7 | 12.2 [8.9–15.1] | -1.2 | 0.0% | 100 | 8.8 [3.5–13.4] |
| Lie Low | thieves | 1 | 3 | 4.8 [3.2–6.3] | 7.1 | 11.3 [7.6–15.0] | -1.6 | 0.0% | 90 | 7.3 [0.9–16.2] |
| Your Call | trading | 1 | 3 | 4.5 [2.9–6.4] | 6.7 | 10.7 [6.8–15.1] | -1.8 | 3.7% | 79 | – |
| Shake Down | thieves | 2 | 3 | 4.4 [2.7–6.4] | 6.6 | 10.5 [6.3–15.1] | -1.9 | 0.0% | 67 | – |
| Swell | blue | 2 | 3 | 4.4 [3.4–5.5] | 6.5 | 10.3 [7.9–13.0] | -2.0 | 0.0% | 106 | – |
| Good Deed | silver | 1 | 3 | 4.1 [2.9–5.4] | 6.1 | 9.7 [6.9–12.8] | -2.2 | 0.0% | 127 | – |
| Golden Years | gold | 1 | 3 | 3.9 [2.2–5.3] | 5.8 | 9.2 [5.1–12.5] | -2.4 | 5.8% | 129 | – |
| Orchard | green | 2 | 3 | 3.8 [2.7–5.1] | 5.7 | 9.0 [6.5–12.1] | -2.5 | 0.0% | 103 | – |
| All In | trading | 3 | 3 | 3.8 [2.0–5.7] | 5.7 | 9.0 [4.7–13.6] | -2.5 | 0.0% | 71 | – |
| Clock In | purple | 1 | 3 | 3.8 [2.4–4.9] | 5.7 | 9.0 [5.6–11.6] | -2.5 | 0.9% | 113 | – |
| Open Door | red | 1 | 3 | 3.7 [2.3–5.2] | 5.5 | 8.7 [5.3–12.3] | -2.7 | 0.0% | 99 | – |
| Half Price | market | 2 | 3 | 3.7 [2.3–5.2] | 5.5 | 8.7 [5.5–12.3] | -2.7 | 0.0% | 108 | – |
| Poach | thieves | 3 | 3 | 3.7 [2.3–5.1] | 5.4 | 8.6 [5.5–11.9] | -2.7 | 2.2% | 87 | – |
| Hold Court | silver | 3 | 3 | 3.4 [2.2–4.9] | 5.1 | 8.1 [5.1–11.5] | -2.9 | 2.7% | 109 | – |
| Crime Wave | thieves | 2 | 3 | 3.4 [1.8–4.8] | 5.0 | 7.9 [4.2–11.4] | -3.0 | 0.0% | 87 | – |
| Harbor | blue | 2 | 3 | 3.4 [2.1–5.1] | 5.0 | 7.9 [4.9–11.9] | -3.0 | 0.0% | 75 | – |
| Tithe | gold | 2 | 3 | 3.3 [2.0–4.8] | 5.0 | 7.9 [4.6–11.4] | -3.0 | 0.9% | 105 | – |
| Collect Debts | gold | 2 | 3 | 3.3 [2.2–4.3] | 4.9 | 7.8 [5.3–10.1] | -3.1 | 0.0% | 174 | 18.2 [13.5–21.7] |
| Intro Offer | gold | 1 | 3 | 3.3 [2.0–4.5] | 4.9 | 7.7 [4.8–10.6] | -3.1 | 0.0% | 138 | – |
| Name Drop | market | 1 | 3 | 3.2 [2.0–4.4] | 4.8 | 7.6 [4.8–10.4] | -3.1 | 1.0% | 103 | – |
| Grove | green | 2 | 3 | 3.2 [2.1–4.3] | 4.7 | 7.4 [4.9–10.2] | -3.2 | 0.0% | 123 | – |
| Harvest | yellow | 1 | 3 | 3.0 [1.9–4.1] | 4.4 | 7.0 [4.6–9.7] | -3.4 | 0.9% | 114 | – |
| Tide | blue | 1 | 3 | 2.8 [1.7–4.0] | 4.2 | 6.7 [4.1–9.5] | -3.5 | 0.0% | 91 | – |
| Show Off | market | 2 | 3 | 2.8 [1.3–4.6] | 4.2 | 6.6 [3.0–10.9] | -3.5 | 0.0% | 64 | – |
| Roll Call | purple | 1 | 3 | 2.7 [0.8–4.4] | 4.0 | 6.3 [2.0–10.3] | -3.7 | 0.0% | 67 | – |
| Encore | echo | 2 | 3 | 2.7 [1.2–4.2] | 4.0 | 6.3 [2.7–10.0] | -3.7 | 2.0% | 100 | – |
| Sweet Talk | silver | 2 | 3 | 2.6 [1.2–4.1] | 3.8 | 6.1 [2.9–9.6] | -3.8 | 0.0% | 121 | – |
| Root | green | 1 | 3 | 2.5 [1.4–3.8] | 3.8 | 6.0 [3.3–9.0] | -3.8 | 0.0% | 107 | – |
| Double Down | gold | 3 | 3 | 2.5 [1.2–3.8] | 3.7 | 5.8 [2.7–8.9] | -3.9 | 4.1% | 116 | – |
| Sprout | green | 1 | 3 | 2.4 [1.6–3.4] | 3.6 | 5.8 [3.8–8.0] | -3.9 | 0.0% | 141 | – |
| Hum | echo | 1 | 3 | 2.4 [1.1–3.7] | 3.6 | 5.7 [2.5–8.8] | -3.9 | 0.0% | 110 | – |
| Graft | green | 1 | 3 | 2.3 [1.3–3.5] | 3.5 | 5.5 [3.1–8.3] | -4.0 | 0.0% | 125 | – |
| New Faces | market | 1 | 3 | 2.3 [1.2–3.3] | 3.4 | 5.5 [2.8–7.9] | -4.0 | 0.0% | 101 | 18.4 [12.8–19.7] |
| Sell High | trading | 2 | 3 | 2.3 [0.8–4.0] | 3.4 | 5.5 [1.9–9.4] | -4.0 | 0.0% | 114 | 21.0 [13.5–22.7] |
| Spree | market | 3 | 3 | 2.3 [1.1–3.5] | 3.4 | 5.4 [2.5–8.3] | -4.0 | 0.0% | 85 | – |
| Potluck | yellow | 2 | 3 | 2.2 [0.1–4.5] | 3.3 | 5.2 [0.2–10.6] | -4.1 | 0.0% | 51 | – |
| Current | blue | 1 | 3 | 2.1 [0.9–3.2] | 3.2 | 5.1 [2.1–7.7] | -4.2 | 0.0% | 94 | – |
| Cheap Seats | trading | 1 | 3 | 2.1 [0.4–3.9] | 3.2 | 5.0 [0.9–9.3] | -4.2 | 0.0% | 84 | – |
| Kickback | gold | 1 | 3 | 2.0 [1.0–2.9] | 3.0 | 4.8 [2.4–6.8] | -4.3 | 0.0% | 194 | – |
| Bandwagon | red | 1 | 3 | 1.9 [0.7–3.0] | 2.8 | 4.5 [1.6–7.2] | -4.4 | 0.0% | 133 | – |
| Redistribute | thieves | 1 | 3 | 1.8 [0.6–3.3] | 2.7 | 4.3 [1.5–7.7] | -4.5 | 0.0% | 79 | – |
| Bumper Crop | yellow | 3 | 3 | 1.6 [0.5–2.9] | 2.4 | 3.8 [1.1–6.9] | -4.7 | 9.1% | 80 | – |
| Reprise | echo | 2 | 3 | 1.6 [0.4–3.1] | 2.3 | 3.7 [1.0–7.4] | -4.8 | 2.5% | 78 | – |
| Echo | echo | 1 | 3 | 1.5 [0.1–3.1] | 2.2 | 3.6 [0.3–7.4] | -4.8 | 1.2% | 84 | – |
| Shoal | blue | 1 | 3 | 1.5 [0.1–3.0] | 2.2 | 3.5 [0.2–7.0] | -4.8 | 0.0% | 80 | – |
| Even Swap | red | 1 | 3 | 1.4 [0.3–2.4] | 2.0 | 3.3 [0.7–5.6] | -5.0 | 0.0% | 135 | – |
| Top Up | yellow | 1 | 3 | 1.2 [-0.0–2.4] | 1.7 | 2.8 [-0.1–5.7] | -5.2 | 2.2% | 90 | – |
| Trade Seeds | yellow | 1 | 3 | 1.2 [-0.3–2.9] | 1.7 | 2.7 [-0.7–7.0] | -5.2 | 0.0% | 63 | – |
| Goody Bags | silver | 1 | 3 | 1.1 [-0.3–2.4] | 1.6 | 2.5 [-0.6–5.6] | -5.3 | 0.0% | 136 | – |
| Sob Story | trading | 1 | 3 | 0.9 [-0.6–2.3] | 1.4 | 2.2 [-1.4–5.5] | -5.4 | 0.0% | 95 | 14.1 [3.0–22.7] |
| Catch Up | purple | 1 | 3 | 0.9 [-0.4–2.1] | 1.4 | 2.2 [-0.9–5.0] | -5.4 | 0.0% | 90 | – |
| Snap Up | market | 1 | 3 | 0.9 [-0.4–2.1] | 1.3 | 2.0 [-1.0–4.8] | -5.5 | 0.0% | 139 | – |
| Greatest Hits | echo | 3 | 3 | 0.7 [-0.6–2.1] | 1.0 | 1.5 [-1.4–5.1] | -5.7 | 1.4% | 71 | -3.3 [-7.5–0.8] |
| Branch Out | yellow | 2 | 3 | 0.6 [-0.7–2.2] | 0.9 | 1.4 [-1.7–5.1] | -5.7 | 0.0% | 79 | – |
| Swap Sides | red | 2 | 3 | -0.2 [-1.3–1.2] | -0.3 | -0.5 [-3.0–2.8] | -6.6 | 1.0% | 100 | 2.1 [-0.9–5.8] |

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
- Normal tables, 440 games. By seat: P1 23.4% [20.3%–26.9%], P2 24.8% [21.5%–28.3%], P3 27.5% [24.1%–31.1%], P4 24.3% [21.1%–27.8%]. By round-I pick order: 1st 21.8% [18.8%–25.2%], 2nd 27.3% [23.9%–30.9%], 3rd 27.5% [24.1%–31.1%], 4th 23.4% [20.3%–26.9%]. Round-III first pick (fewest followers) wins 13.0% [10.5%–15.8%]; last of the first pass 49.8% [45.9%–53.7%].
- Hard-20 tables, 68 games. By seat: P1 29.4% [21.3%–39.1%], P2 22.1% [14.9%–31.3%], P3 29.4% [21.3%–39.1%], P4 19.1% [12.5%–28.1%]. By round-I pick order: 1st 20.6% [13.7%–29.7%], 2nd 26.5% [18.7%–36.0%], 3rd 30.9% [22.5%–40.7%], 4th 22.1% [14.9%–31.3%]. Round-III first pick (fewest followers) wins 14.7% [9.0%–23.1%]; last of the first pass 50.0% [40.2%–59.8%].

## 6. Health
| | Normal (440 games) | Hard-20 (68 games) |
|---|---|---|
| members per player (target 6–7) | 5.1 ±2.8 sd (20.1% land on 6–7; 5.1 cards) | 4.3 ±2.8 sd (16.5% land on 6–7; 4.3 cards) |
| final followers | 56.1 | 53.7 |
| … self | 1.0 (1.8%) | 1.0 (1.9%) |
| … members' worth | 6.8 (12.1%) | 5.4 (10.1%) |
| … buys 2→1 / 4→3 / 8→6 / 10→10 | 0.5 / 1.2 / 1.8 / 26.6 (53.5%) | 1.0 / 2.0 / 2.0 / 24.6 (55.0%) |
| … contests round I / II / III | 2.7 / 5.0 / 7.5 (27.2%) | 2.6 / 4.9 / 7.3 (27.5%) |
| … effects (member triggers, actions, game end) | 3.1 (5.4%) | 3.0 (5.6%) |
| resources left at the end | 9.1 mean, 21.0 p90, 105 max (2.9% hold 30+) | 8.4 mean, 18.0 p90, 46 max (3.3% hold 30+) |
| contests that paid 2+ / 3+ tied leaders | 25.3% / 4.7% of 5180 | 22.7% / 3.1% of 802 |
| steal events per game (units taken) | 9.9 (15.2) | 14.9 (21.7) |
| longest run of placements by one player (the snake alone makes 2) | 2.3 mean, 6 max (17.5% of games have 3+) | 2.3 mean, 7 max (16.2% of games have 3+) |
| decision richness: top two within 1 follower | n/a (needs Hard rollouts) | 29.1% of 5749 weighed decisions (median gap 2.93) |

