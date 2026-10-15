# Balance bench (quick)

2026-10-15 00:49 UTC · commit 669f85e · content 17nxqj9f1m0.d8606c4f45 · 8.2 min on 4 workers (32 core-min) · Classic (gold, red, market, echo).
Instruments: **Normal** (all four seats) and **Hard-20** (Hard = Normal plus rollouts, at budget 20, uncapped, deterministic). Intervals are 90% (bootstrap over seeds for fits, Wilson for win rates). Method and limits: design/eval/bench/README.md.

## What moved since last run
First run of this mode: nothing to compare.

## 1. Anchors
Every anchor's interval reaches its expected range, Hard-20 beats Normal, and both price slopes are clearly positive: the instruments are trusted. (An anchor is off when its 90% interval misses the range, or it has too few probes to say.)

- Price slope, followers of margin per extra cost point (the exchange rate for everything below): Normal 0.84 [0.70–0.99] (by fork round I/II/III: 1.07 [0.76–1.47], 0.85 [0.65–1.11], 0.59 [0.45–0.74]); Hard-20 0.64 [0.43–1.10] (by fork round I/II/III: 0.12 [-0.24–0.84], 0.63 [0.32–1.24], 1.16 [0.74–1.92]). 
- Hard-20 alone vs 3 Normal (Classic, n=32): wins 34.4% [22.3%–48.9%]; parity is 25%, it must reach 32%. OK.

| instrument | anchor | printed | fair [90%] | n | expected | |
|---|---|---|---|---|---|---|
| Normal | Banker | 4 | 7.3 [4.8–9.8] | 137 | 4.5–10.5 | ok |
| Normal | Big Family | 4 | 4.6 [2.4–7.6] | 120 | 0.5–6.0 | ok |
| Normal | Sponsor | 10 | 7.8 [4.4–11.1] | 80 | 8.0–∞ | ok |
| Normal | Tycoon | 12 | 6.4 [3.8–8.5] | 107 | −∞–10.0 | ok |
| Hard-20 | Banker | 4 | 8.1 [0.2–15.0] | 22 | 4.5–10.5 | ok |
| Hard-20 | Big Family | 4 | 5.7 [-3.4–15.5] | 21 | 0.5–6.0 | ok |
| Hard-20 | Sponsor | 10 | 14.3 [3.8–21.2] | 13 | 8.0–∞ | ok |
| Hard-20 | Tycoon | 12 | 15.1 [9.1–22.4] | 22 | −∞–10.0 | ok |

- Banker (4: "Now and at round start, +3 gold"). By arithmetic +9/+6/+3 gold by round recruited, ~7 averaged, plus a follower; the Normal sweep read 7.3 [6.3–8.3] recruited in round I.
- Big Family (4: "Worth 3 followers", no ability), the plain worth-N member: 3 followers ≈ 4 resources at 4→3, less the follower buy it displaces. The Normal sweep read 2.4 [0.6–3.6].
- Sponsor (10: "Your members cost 2 less"), rework-candidates #1, known strong: must not read cheaper than printed − 2.
- Tycoon (12: "Game end: +1 follower per 3 gold"), rework-candidates #3, known weak: must read at least 2 under printed.

## 2. Cards
Paired forced recruit: a private copy of the card, at printed −4 / printed / +4, recruited at the seat's first affordable buy from a random round on (I, II or III), against the same seed without it. Fair price = the price where it nets 0 followers of margin. Normal: 3596 probes over 60 seeds, every card. Hard-20: 272 probes over 4 seeds, only the anchors and what Normal flags or reads ≥ 2.5 off (a card both must agree on can't be flagged by Hard alone). Flag = the 90% interval misses printed and the gap is ≥ 1.5, for BOTH instruments.

### Both instruments agree (0)
None.

### Needs an ability change, not a price (0)
None that both instruments agree on.

### Normal flags, Hard-20 confidently doesn't (likely a Normal-bot artifact) (2)
Tycoon 12 (Normal 6.4 [3.8–8.5], Hard-20 15.1 [9.1–22.4]); Underbidder 2 (Normal 8.7 [3.5–13.5], Hard-20 5.4 [-0.2–5.9]).

Normal flags, Hard-20 too thin or unsure to say: Hustler 2→5.9; Middleman 4→10.5; Intern 1→4.9; Treasurer 4→8.9 (Hard-20 9.6, n 22); Busker 4→9.0 (Hard-20 8.9, n 22); Banker 4→7.3 (Hard-20 8.1, n 22); Lottery Winner 10→15.8 (Hard-20 15.8, n 21); Tribute Band 12→17.9; Pied Piper 4→7.9; Volunteer 0→4.6 (Hard-20 7.5, n 22); Speculator 8→12.2; Translator 6→-0.4 (Hard-20 -0.8, n 20).

<details><summary>Every card (Normal; Hard-20 where measured)</summary>

| card | printed | Normal fair [90%] | n | net at printed by round I/II/III | Hard-20 fair [90%] | n |
|---|---|---|---|---|---|---|
| Underbidder (market.underbidder) | 2 | 8.7 [3.5–13.5] | 29 | 6.0 / 10.8 / -3.5 | 5.4 [-0.2–5.9] | 19 |
| Middleman (gold.coinpurse) | 4 | 10.5 [5.5–16.6] | 37 | 3.4 / -10.0 / 9.4 | – |  |
| Tribute Band (echo.dejavu) | 12 | 17.9 [13.2–23.6] | 20 | 2.0 / – / -16.7 | – |  |
| Lottery Winner (gold.jackpot) | 10 | 15.8 [12.7–20.9] | 34 | 13.3 / 8.9 / 3.3 | 15.8 [0.4–25.7] | 21 |
| Busker (echo.evergreen) | 4 | 9.0 [5.7–12.6] | 40 | -2.5 / – / 5.7 | 8.9 [2.2–13.3] | 22 |
| Treasurer (gold.seed) | 4 | 8.9 [5.6–11.8] | 42 | -12.9 / 3.3 / 1.1 | 9.6 [2.4–18.7] | 22 |
| Volunteer (red.volunteer) | 0 | 4.6 [1.1–7.7] | 47 | 12.5 / 5.7 / -2.3 | 7.5 [-6.2–21.1] | 22 |
| Doppelganger (red.doppel) | 6 | 10.6 [5.7–14.6] | 33 | 1.9 / 8.1 / 15.2 | – |  |
| Speculator (gold.speculator) | 8 | 12.2 [8.4–16.4] | 41 | -0.5 / -1.1 / 4.8 | – |  |
| Intern (red.intern) | 1 | 4.9 [1.4–9.7] | 34 | 0.1 / 3.3 / 14.7 | – |  |
| Hustler (gold.hustler) | 2 | 5.9 [2.1–10.9] | 35 | -8.4 / -9.7 / 8.6 | – |  |
| Pied Piper (red.drive) | 4 | 7.9 [4.7–11.6] | 37 | 4.2 / -6.4 / 0.8 | – |  |
| Tinker (gold.tinker) | 6 | 9.9 [5.6–14.6] | 35 | -1.8 / 26.9 / 2.3 | – |  |
| Sleepwalker (echo.afterimage) | 6 | 9.7 [4.8–14.6] | 30 | -15.9 / 8.8 / 6.3 | – |  |
| Mime (echo.mirror) | 6 | 9.5 [5.2–14.2] | 25 | 7.5 / -4.0 / 5.4 | – |  |
| Banker (gold.banker) | 4 | 7.3 [4.8–9.8] | 137 | -5.5 / 8.1 / 1.8 | 8.1 [0.2–15.0] | 22 |
| Social Climber (market.climber) | 2 | 5.2 [1.3–10.4] | 27 | -13.4 / -5.9 / -1.7 | – |  |
| Host (red.host) | 6 | 9.0 [4.3–13.8] | 32 | 7.3 / -9.3 / 7.2 | – |  |
| Patroness (market.patroness) | 8 | 10.9 [5.7–17.0] | 24 | 4.8 / -3.0 / -11.7 | – |  |
| Talent Scout (market.blackmarket) | 4 | 6.7 [2.2–11.4] | 35 | 8.1 / -3.8 / -1.1 | – |  |
| Understudy (echo.understudy) | 6 | 8.7 [2.9–14.3] | 37 | 15.2 / -11.5 / -1.3 | – |  |
| Freelancer (benders.freelancer) | 4 | 6.4 [3.2–10.2] | 42 | -8.2 / 6.9 / 7.7 | – |  |
| Tax Collector (gold.taxman) | 4 | 6.4 [2.5–10.8] | 41 | 8.9 / 7.9 / 11.7 | – |  |
| Ensemble (echo.ensemble) | 6 | 8.2 [3.6–14.4] | 33 | 6.8 / 6.0 / -2.3 | – |  |
| Planner (market.planner) | 4 | 5.8 [2.5–9.3] | 34 | 7.9 / -5.1 / -3.1 | – |  |
| Recruiter (red.recruiter) | 8 | 9.5 [4.3–14.2] | 27 | -1.6 / 13.3 / -10.1 | – |  |
| Front-runner (benders.frontrunner) | 2 | 3.2 [-0.9–6.5] | 36 | -13.7 / 13.0 / -1.2 | – |  |
| Twins (red.twins) | 2 | 3.0 [-2.1–7.0] | 36 | 12.3 / -2.0 / 1.4 | – |  |
| Squatter (benders.squatter) | 8 | 8.9 [5.0–13.6] | 35 | 6.0 / 12.7 / -4.3 | – |  |
| Snob (market.snob) | 10 | 10.8 [3.9–17.4] | 16 | -8.3 / -20.3 / 13.8 | – |  |
| Merchant (gold.merchant) | 6 | 6.6 [1.4–13.0] | 38 | -0.2 / 15.9 / 2.0 | – |  |
| Benchwarmer (red.reserve) | 1 | 1.6 [-3.0–5.1] | 39 | 4.0 / 3.4 / 1.3 | – |  |
| Big Family (red.bigfamily) | 4 | 4.6 [2.4–7.6] | 120 | -2.6 / -2.9 / -1.1 | 5.7 [-3.4–15.5] | 21 |
| Groupie (echo.groupie) | 8 | 8.4 [5.2–12.2] | 38 | -1.3 / 2.3 / 4.7 | – |  |
| Impressionist (echo.tuningfork) | 4 | 4.4 [1.3–7.2] | 35 | 17.0 / -8.8 / 3.3 | – |  |
| Big Spender (benders.bigspender) | 4 | 4.4 [-0.0–9.7] | 40 | 5.2 / -6.8 / -5.8 | – |  |
| Stylist (market.stylist) | 4 | 4.3 [-0.4–9.7] | 34 | 16.7 / 7.3 / -8.6 | – |  |
| Auctioneer (market.auctioneer) | 6 | 6.2 [0.4–12.5] | 22 | -5.9 / 7.3 / 3.0 | – |  |
| Crowd-Pleaser (red.crowd) | 2 | 1.9 [-2.5–5.7] | 41 | 6.1 / 0.7 / 0.6 | – |  |
| Minimalist (market.minimalist) | 2 | 1.9 [-2.0–5.5] | 30 | -2.2 / 1.3 / -6.3 | – |  |
| Investor (gold.investor) | 6 | 5.7 [1.0–11.4] | 37 | -9.3 / 6.8 / -2.8 | – |  |
| Curator (market.curator) | 4 | 3.7 [-1.1–8.7] | 26 | -20.6 / -5.0 / -7.4 | – |  |
| Mentor & Protégé (red.mentor) | 10 | 9.2 [4.8–13.4] | 28 | -9.9 / -0.6 / 18.7 | – |  |
| Prospector (gold.prospector) | 4 | 3.2 [-0.2–6.4] | 39 | 3.9 / -9.0 / 0.3 | – |  |
| Penny Pincher (gold.thrift) | 4 | 3.1 [-0.2–6.1] | 48 | 3.8 / 3.1 / -2.7 | – |  |
| Sommelier (market.sommelier) | 4 | 3.1 [-0.8–6.8] | 37 | -2.3 / -8.2 / -12.3 | – |  |
| Mob (red.mob) | 8 | 7.0 [1.6–14.4] | 21 | -13.0 / 6.0 / 16.7 | – |  |
| Muse (echo.muse) | 4 | 2.9 [-2.2–7.3] | 36 | 11.8 / 3.2 / -3.5 | – |  |
| Midas (gold.midas) | 8 | 6.9 [1.7–11.8] | 46 | -11.6 / -1.7 / -5.7 | – |  |
| Chronicler (echo.chronicler) | 8 | 6.8 [0.2–11.6] | 31 | 0.0 / 17.5 / 1.3 | – |  |
| Wallflower (echo.wallflower) | 4 | 2.3 [-1.4–6.2] | 33 | -20.0 / 7.0 / -2.7 | – |  |
| Underdog (gold.underdog) | 6 | 4.3 [0.2–9.5] | 38 | -15.2 / 0.3 / -2.3 | – |  |
| Straggler (benders.straggler) | 8 | 6.3 [0.7–11.8] | 33 | -2.2 / -5.0 / -5.1 | – |  |
| Extra Hand (benders.extrahand) | 10 | 8.2 [4.0–12.7] | 36 | 11.7 / -9.4 / -4.4 | – |  |
| Proselytizer (red.proselytizer) | 12 | 10.1 [5.8–15.8] | 22 | -20.7 / -24.1 / – | – |  |
| Stunt Double (echo.hourglass) | 10 | 8.0 [2.7–13.8] | 21 | -4.9 / -7.3 / -4.5 | – |  |
| Sponsor (red.sponsor) | 10 | 7.8 [4.4–11.1] | 80 | -7.0 / -1.3 / -1.4 | 14.3 [3.8–21.2] | 13 |
| Connoisseur (market.connoisseur) | 4 | 1.8 [-2.0–6.1] | 37 | 3.3 / 17.8 / -21.7 | – |  |
| Patriarch (red.patriarch) | 10 | 7.7 [0.4–14.7] | 25 | -25.9 / -15.0 / 3.9 | – |  |
| Choir (echo.choir) | 6 | 2.9 [-1.0–6.8] | 36 | -1.0 / -0.5 / 5.1 | – |  |
| Insider (benders.insider) | 6 | 2.6 [-2.5–8.2] | 22 | 26.5 / -27.0 / -5.1 | – |  |
| Recluse (market.recluse) | 4 | 0.4 [-5.3–6.5] | 33 | -19.9 / 9.6 / 4.0 | – |  |
| Onlooker (market.onlooker) | 10 | 5.3 [0.7–10.9] | 24 | -20.0 / -16.2 / -8.2 | – |  |
| Reseller (market.reseller) | 12 | 6.6 [0.0–14.0] | 14 | 0.2 / -8.8 / – | – |  |
| Tycoon (gold.tycoon) | 12 | 6.4 [3.8–8.5] | 107 | -5.1 / -8.8 / -1.0 | 15.1 [9.1–22.4] | 22 |
| Translator (echo.translator) | 6 | -0.4 [-5.3–4.2] | 21 | 5.2 / -9.8 / -16.0 | -0.8 [-8.4–12.8] | 20 |

</details>

## 3. Spaces
Paired forced placement: from the start of round r, the seat's first minion must take the space (base: the bot's own choice). A "null" minion (bot's own choice, action does nothing) in every game gives the zero, so worth = followers of margin over a minion that does nothing; u = worth ÷ that round's price slope (Normal 1.07 / 0.85 / 0.59, Hard-20 1.07 / 0.63 / 1.16 followers per resource, rounds I / II / III). Raw u also counts the buy a placement enables and early compounding, so it runs high; scaled u sets each round's median space to the middle of its band (×0.47 / 0.90 / 1.45 for rounds I / II / III) and says where a space sits among its round's field on the value model's ruler (round I 2–3u, II 3–5u, III 5–9u). Flag, on scaled u: above the band in any round, below it in the space's own ring's round, or worth below 0. "vs choice" = against the bot's own pick (≤ 0 means the bot was right to skip it). Blocked = a rival took it first.
Normal's own pick is worth 6.7 followers in round 1, 5.1 followers in round 2, 5.1 followers in round 3 over a null minion (6.2u / 5.9u / 8.5u).

### Both instruments agree (1)
| space | ring | round | Normal scaled u [90%] n | Hard-20 scaled u [90%] n | band | reads |
|---|---|---|---|---|---|---|
| Crescendo (echo) | 1 | 3 | 17.4 [11.2–24.0] 20 | 11.5 [9.3–13.8] 14 | 5–9 | strong |

### Normal flags, Hard-20 confidently doesn't (likely a Normal-bot artifact) (2)
Tithe r3 (Normal 17.8 [10.2–24.4], Hard-20 4.9 [1.2–10.0] scaled u); Golden Years r3 (Normal 17.7 [11.1–23.6], Hard-20 8.6 [6.2–12.6] scaled u).

Normal flags, Hard-20 too thin or unsure to say: Golden Years r2 strong (8.9u; Hard-20 2.9u, n 9); Open House r2 strong (9.6u; Hard-20 11.0u, n 10); Echo r1 weak (0.3u; Hard-20 9.2u, n 5).

<details><summary>Every space and round (Normal; Hard-20 where measured)</summary>

| space | sphere | ring | round | worth (followers) [90%] | raw u | scaled u [90%] | vs choice | blocked | n | Hard-20 scaled u [90%] |
|---|---|---|---|---|---|---|---|---|---|---|
| Hum | echo | 1 | 1 | 9.2 [5.1–16.1] | 8.6 | 4.1 [2.3–7.2] | 2.6 | 16.7% | 20 | 0.5 [-3.6–3.0] |
| Bandwagon | red | 1 | 1 | 8.9 [5.9–13.7] | 8.3 | 3.9 [2.6–6.1] | 2.2 | 0.0% | 31 | – |
| Intro Offer | gold | 1 | 1 | 8.0 [3.5–12.2] | 7.5 | 3.6 [1.6–5.4] | 1.3 | 0.0% | 34 | 2.3 [-3.1–3.6] |
| Kickback | gold | 1 | 1 | 7.2 [3.9–10.9] | 6.8 | 3.2 [1.7–4.8] | 0.6 | 12.1% | 51 | 4.6 [-3.1–6.5] |
| Snap Up | market | 1 | 1 | 6.6 [1.8–12.2] | 6.1 | 2.9 [0.8–5.4] | -0.1 | 3.7% | 26 | -0.1 [-3.8–2.2] |
| New Faces | market | 1 | 1 | 5.6 [0.6–11.7] | 5.3 | 2.5 [0.2–5.2] | -1.0 | 0.0% | 39 | 1.4 [-3.1–2.7] |
| Name Drop | market | 1 | 1 | 5.3 [-0.3–10.6] | 4.9 | 2.3 [-0.1–4.7] | -1.4 | 0.0% | 29 | -3.9 [-6.2–3.0] |
| Crescendo | echo | 1 | 1 | 5.2 [1.2–9.5] | 4.8 | 2.3 [0.5–4.2] | -1.5 | 0.0% | 32 | – |
| Golden Years | gold | 1 | 1 | 3.5 [-0.2–9.2] | 3.2 | 1.5 [-0.1–4.1] | -3.2 | 0.0% | 26 | 5.3 [2.9–6.4] |
| Open Door | red | 1 | 1 | 3.2 [0.0–7.7] | 3.0 | 1.4 [0.0–3.4] | -3.5 | 10.0% | 36 | – |
| Even Swap | red | 1 | 1 | 2.2 [-1.1–7.4] | 2.1 | 1.0 [-0.5–3.3] | -4.5 | 0.0% | 47 | -3.7 [-5.0–1.7] |
| Echo | echo | 1 | 1 | 0.6 [-2.6–4.1] | 0.6 | 0.3 [-1.1–1.8] | -6.0 | 3.3% | 29 | 9.2 [1.7–11.3] |
| Open House | red | 2 | 2 | 9.1 [5.7–13.7] | 10.7 | 9.6 [6.0–14.4] | 4.1 | 6.3% | 30 | 11.0 [4.2–16.4] |
| Golden Years | gold | 1 | 2 | 8.5 [5.5–11.4] | 9.9 | 8.9 [5.8–12.1] | 3.4 | 3.8% | 50 | 2.9 [-1.9–4.9] |
| Name Drop | market | 1 | 2 | 7.4 [3.9–11.9] | 8.7 | 7.8 [4.1–12.5] | 2.4 | 0.0% | 46 | -2.1 [-3.3–5.9] |
| Hum | echo | 1 | 2 | 5.5 [2.7–8.7] | 6.4 | 5.8 [2.8–9.2] | 0.4 | 0.0% | 40 | 12.4 [-1.4–21.5] |
| Open Door | red | 1 | 2 | 5.0 [0.3–8.6] | 5.9 | 5.3 [0.4–9.0] | -0.0 | 0.0% | 47 | – |
| Reprise | echo | 2 | 2 | 4.6 [0.4–9.1] | 5.4 | 4.9 [0.4–9.6] | -0.5 | 0.0% | 35 | – |
| Encore | echo | 2 | 2 | 4.4 [0.5–7.8] | 5.1 | 4.6 [0.5–8.2] | -0.7 | 0.0% | 26 | – |
| Intro Offer | gold | 1 | 2 | 4.2 [0.9–7.6] | 4.9 | 4.4 [0.9–8.0] | -0.9 | 0.0% | 38 | – |
| Show Off | market | 2 | 2 | 4.0 [0.2–7.5] | 4.7 | 4.2 [0.2–7.9] | -1.1 | 0.0% | 44 | 7.0 [2.9–8.9] |
| Kickback | gold | 1 | 2 | 3.8 [2.1–6.4] | 4.4 | 4.0 [2.2–6.8] | -1.3 | 0.0% | 80 | -6.0 [-18.8–20.4] |
| Swap Sides | red | 2 | 2 | 3.5 [-0.5–7.1] | 4.1 | 3.6 [-0.6–7.5] | -1.6 | 2.9% | 34 | 19.2 [4.9–22.5] |
| Crescendo | echo | 1 | 2 | 3.4 [-0.2–7.0] | 4.0 | 3.6 [-0.3–7.4] | -1.6 | 10.3% | 26 | – |
| Collect Debts | gold | 2 | 2 | 3.0 [0.2–6.3] | 3.6 | 3.2 [0.2–6.6] | -2.0 | 10.5% | 51 | – |
| Half Price | market | 2 | 2 | 2.9 [0.2–6.8] | 3.4 | 3.1 [0.2–7.2] | -2.2 | 2.8% | 35 | – |
| Bandwagon | red | 1 | 2 | 2.7 [-0.6–6.5] | 3.2 | 2.9 [-0.7–6.8] | -2.3 | 0.0% | 45 | 7.0 [-4.4–23.1] |
| Snap Up | market | 1 | 2 | 2.7 [-0.7–5.8] | 3.1 | 2.8 [-0.7–6.1] | -2.4 | 2.9% | 33 | – |
| New Faces | market | 1 | 2 | 2.6 [-0.4–6.1] | 3.1 | 2.8 [-0.4–6.5] | -2.4 | 0.0% | 34 | – |
| Tithe | gold | 2 | 2 | 1.9 [-1.1–4.0] | 2.3 | 2.0 [-1.1–4.3] | -3.1 | 0.0% | 48 | – |
| Echo | echo | 1 | 2 | 1.2 [-3.0–5.0] | 1.4 | 1.3 [-3.1–5.3] | -3.8 | 0.0% | 36 | – |
| Even Swap | red | 1 | 2 | -1.4 [-3.3–1.3] | -1.7 | -1.5 [-3.5–1.4] | -6.5 | 5.8% | 49 | – |
| Tithe | gold | 2 | 3 | 7.3 [4.2–10.0] | 12.2 | 17.8 [10.2–24.4] | 2.2 | 0.0% | 24 | 4.9 [1.2–10.0] |
| Golden Years | gold | 1 | 3 | 7.2 [4.5–9.6] | 12.2 | 17.7 [11.1–23.6] | 2.2 | 8.7% | 42 | 8.6 [6.2–12.6] |
| Crescendo | echo | 1 | 3 | 7.1 [4.6–9.8] | 12.0 | 17.4 [11.2–24.0] | 2.0 | 13.0% | 20 | 11.5 [9.3–13.8] |
| Hand-pick | red | 3 | 3 | 5.9 [3.1–9.0] | 10.0 | 14.5 [7.6–22.1] | 0.9 | 26.5% | 25 | – |
| Show Off | market | 2 | 3 | 5.9 [3.6–7.8] | 9.9 | 14.4 [8.8–19.0] | 0.8 | 0.0% | 32 | – |
| Echo | echo | 1 | 3 | 5.7 [2.3–9.4] | 9.7 | 14.1 [5.6–22.9] | 0.7 | 0.0% | 25 | – |
| Collect Debts | gold | 2 | 3 | 4.6 [2.5–6.5] | 7.7 | 11.2 [6.0–16.0] | -0.5 | 0.0% | 63 | – |
| Open House | red | 2 | 3 | 4.3 [0.5–9.3] | 7.2 | 10.5 [1.2–22.8] | -0.8 | 0.0% | 28 | – |
| Reprise | echo | 2 | 3 | 4.0 [1.5–5.9] | 6.8 | 9.8 [3.6–14.5] | -1.1 | 0.0% | 34 | – |
| Kickback | gold | 1 | 3 | 3.9 [1.7–6.2] | 6.5 | 9.4 [4.1–15.1] | -1.2 | 0.0% | 74 | – |
| Spree | market | 3 | 3 | 3.0 [0.4–5.9] | 5.1 | 7.4 [1.0–14.5] | -2.0 | 0.0% | 30 | – |
| Double Down | gold | 3 | 3 | 2.9 [0.5–5.4] | 4.8 | 7.0 [1.1–13.2] | -2.2 | 10.8% | 33 | – |
| Hum | echo | 1 | 3 | 2.7 [-0.6–6.2] | 4.6 | 6.7 [-1.6–15.3] | -2.3 | 0.0% | 28 | – |
| Open Door | red | 1 | 3 | 2.4 [0.2–4.8] | 4.0 | 5.9 [0.6–11.6] | -2.7 | 0.0% | 33 | – |
| Intro Offer | gold | 1 | 3 | 2.4 [-0.1–5.5] | 4.0 | 5.8 [-0.3–13.4] | -2.7 | 0.0% | 38 | – |
| New Faces | market | 1 | 3 | 2.3 [-0.4–5.0] | 3.9 | 5.7 [-0.9–12.2] | -2.7 | 0.0% | 32 | – |
| Greatest Hits | echo | 3 | 3 | 1.5 [-0.6–4.2] | 2.6 | 3.8 [-1.6–10.4] | -3.5 | 0.0% | 39 | – |
| Even Swap | red | 1 | 3 | 1.5 [-1.0–4.8] | 2.6 | 3.7 [-2.5–11.7] | -3.5 | 0.0% | 37 | – |
| Name Drop | market | 1 | 3 | 1.5 [-0.7–4.0] | 2.5 | 3.7 [-1.7–9.7] | -3.6 | 0.0% | 40 | – |
| Half Price | market | 2 | 3 | 0.8 [-1.1–2.8] | 1.3 | 2.0 [-2.8–6.8] | -4.3 | 2.8% | 35 | – |
| Bandwagon | red | 1 | 3 | 0.4 [-2.3–2.8] | 0.7 | 1.0 [-5.6–6.9] | -4.6 | 0.0% | 51 | – |
| Snap Up | market | 1 | 3 | 0.1 [-3.0–3.6] | 0.2 | 0.3 [-7.4–8.9] | -4.9 | 0.0% | 39 | – |
| Encore | echo | 2 | 3 | -0.1 [-3.3–2.7] | -0.2 | -0.3 [-8.1–6.5] | -5.2 | 0.0% | 30 | – |
| Swap Sides | red | 2 | 3 | -1.2 [-3.5–0.7] | -2.1 | -3.0 [-8.7–1.7] | -6.3 | 2.3% | 43 | – |

</details>

## 4. Archetypes
One scripted seat (rotating) against 3 bots, Classic table. Target band 15–35% (parity 25%). Scripts are built on Normal's valuation: the buyer never recruits; a specialist adds +3 to its sphere's spaces and +2 to its members; the chaser adds twice the round-end contest standing a move leaves it; the hoarder recruits whenever any member is affordable.

| archetype | vs | n | win [90%] | followers (rivals) | members (rivals) | |
|---|---|---|---|---|---|---|
| pure follower buyer | 3 Normal | 40 | 11.3% [5.4%–22.0%] | 52.9 (53.8) | 0.0 (8.7) | edge |
| member hoarder (recruits whenever it can) | 3 Normal | 40 | 10.0% [4.6%–20.5%] | 42.5 (56.8) | 13.5 (8.0) | edge |
| contest chaser (maximizes round-end leads) | 3 Normal | 40 | 15.0% [8.0%–26.5%] | 51.4 (56.4) | 8.8 (8.5) |  |
| Gold (gold) specialist | 3 Normal | 40 | 40.0% [28.3%–53.0%] | 62.5 (56.5) | 9.4 (8.0) | edge |
| Red (red) specialist | 3 Normal | 40 | 26.3% [16.6%–38.9%] | 56.6 (54.0) | 10.7 (7.5) |  |
| Blue (market) specialist | 3 Normal | 40 | 16.3% [8.9%–27.9%] | 52.1 (56.6) | 10.3 (8.2) |  |
| Green (echo) specialist | 3 Normal | 40 | 23.8% [14.6%–36.3%] | 55.4 (55.8) | 9.1 (8.4) |  |

## 5. Fairness
Base games (no probes), random tables. Parity is 25%.
- Normal tables, 60 games. By seat: P1 31.7% [22.8%–42.2%], P2 16.7% [10.2%–26.0%], P3 30.0% [21.3%–40.4%], P4 21.7% [14.2%–31.5%]. By round-I pick order: 1st 16.7% [10.2%–26.0%], 2nd 31.7% [22.8%–42.2%], 3rd 31.7% [22.8%–42.2%], 4th 20.0% [12.9%–29.7%]. Round-III first pick (fewest followers) wins 18.3% [11.5%–27.9%]; last of the first pass 45.0% [34.9%–55.6%].
- Hard-20 tables, 4 games. By seat: P1 25.0% [5.8%–64.4%], P2 50.0% [18.2%–81.8%], P3 0.0% [0.0%–40.4%], P4 25.0% [5.8%–64.4%]. By round-I pick order: 1st 25.0% [5.8%–64.4%], 2nd 25.0% [5.8%–64.4%], 3rd 0.0% [0.0%–40.4%], 4th 50.0% [18.2%–81.8%]. Round-III first pick (fewest followers) wins 0.0% [0.0%–40.4%]; last of the first pass 100.0% [59.6%–100.0%].

## 6. Health
| | Normal (60 games) | Hard-20 (4 games) |
|---|---|---|
| members per player (target 6–7) | 7.9 ±3.0 sd (18.3% land on 6–7; 7.9 cards) | 6.6 ±3.1 sd (31.3% land on 6–7; 6.6 cards) |
| final followers | 53.8 | 51.2 |
| … self | 1.0 (1.9%) | 1.0 (2.0%) |
| … members' worth | 8.5 (15.8%) | 7.3 (14.2%) |
| … buys 2→1 / 4→3 / 8→6 / 10→10 | 0.3 / 0.9 / 1.6 / 24.5 (50.8%) | 1.3 / 1.7 / 0.8 / 23.1 (52.4%) |
| … contests round I / II / III | 2.4 / 4.8 / 6.5 (25.4%) | 2.8 / 5.0 / 6.4 (27.6%) |
| … effects (member triggers, actions, game end) | 3.3 (6.1%) | 2.0 (3.9%) |
| resources left at the end | 8.8 mean, 20.0 p90, 61 max (2.9% hold 30+) | 8.6 mean, 28.0 p90, 34 max (6.3% hold 30+) |
| contests that paid 2+ / 3+ tied leaders | 15.6% / 2.7% of 705 | 20.8% / 2.1% of 48 |
| steal events per game (units taken) | 3.8 (8.2) | 4.3 (9.0) |
| longest run of placements by one player (the snake alone makes 2) | 2.0 mean, 2 max (0.0% of games have 3+) | 2.0 mean, 2 max (0.0% of games have 3+) |
| decision richness: top two within 1 follower | n/a (needs Hard rollouts) | 28.7% of 321 weighed decisions (median gap 2.90) |

