# Quiet-box run on w4 (8ea3e24), 2026-10-15 11:19–12:28 UTC

This was a fresh 4-CPU remote box with nothing else running, and no game code was changed. The checkout was claude/cults-freeze-w4 at 8ea3e24d23c4f25fbf3b970f5590d299749f2167. The perf JSON and reports sit next to this file (w4-prod-*.json/.md). The comparison is against quiet-w3-44e22bd.md, which used the same harness, the same seed (20261015), the same shape (4 placements for P1, host 4 and guest 3 online) and a production build.

## Load (1/5/15-min average, before → after)

- npm ci (27s): 1.08 → 1.46
- Gate, `check:v4 --commit` (833s): 1.46 → 4.80/9.89/8.21. It peaked at 23.6 (11:27, during unit tests alongside the first e2e wave), so the gate loads the box heavily by itself, as it did on w3.
- Solo re-runs of the failing e2e: 3.24 → 1.25
- Perf: cpu4 r1 1.15 → 2.23 · cpu1 r1 2.23 → 1.07 · cpu4 r2 1.07 → 2.12 · cpu1 r2 2.12 → 1.00 · online 1.00 → 3.45 (all errors 0)
- snappy/turndock/travel/online alone: 3.16 → 3.19 (peak about 3.2)

## Gate: FAIL, 4 of 20 lines (833s; w3 was 11 of 19 failing in 1264s)

- PASS unit tests (810s): 1032 passed, 1 skipped, 0 failed. On w3, 4 had failed.
- PASS production build (13s).
- PASS online (189s), hotseat (184s), tables (261s), memory (164s), spaces (138s), benders (111s), resume-edge (149s), steal (44s), travel (51s), turndock (150s), turnstory (44s), layout (26s), info (82s), motion (73s).
- FAIL members (66s): "members: 1 problem(s) · [m12] the member's card closed when the pointer left it downward on its way to "Use"". That is the whole log.
- FAIL pay (63s): "dialogs gate: 1 problem(s) · (p1) no coin moved when a stack was clicked". That is the whole log.
- FAIL reckoning (190s): "(r1) the Reckoning told 3 of 4 quadrants ( | You win +2 followers | | P4 wins +2 followers | | P2 wins +2 followers)". Before that it printed "3 quadrants told, best count run 7, 3 prize flights for 3 winners, 12 minions out, 12 home, longest flight 1535ms", and the round-III summary fit at 700px.
- FAIL snappy (42s): it crashed in setup. `page.waitForSelector: Timeout 15000ms exceeded`, waiting for `.lt[data-phase="place"][data-yours="1"] .slot.can .base`, at freshPage (snappy.mjs:226), called from snappy.mjs:240.

## Re-runs: real or flake

Each failing file was re-run once on its own (`V4_URL=http://127.0.0.1:5369`) against `vite build` + `vite preview` of the same clean commit, with the load at about 2–3.

- members: PASS (30s), every ability, both Use paths. Flake (load).
- pay: PASS (27s), all twelve dialogs. Flake (load).
- reckoning: PASS (37s), 4 quadrants told, 6 prize flights for 6 winners, longest flight 809ms (1535ms in the gate). Flake (load).
- snappy: PASS (74s). Flake (load).

All four failures were load flakes. No real failure remains on this commit. Three of them (m12 hover close, p1 coin, r1 a quadrant not told) are timing-sensitive under load, and were caught when the gate ran at 15–23 load on 4 CPUs.

## Perf: production build, scripts/v4-perf.mjs, seed 20261015

Values are p50/p95 in ms, given as r1 → r2. The r1–r2 spread is the noise floor. "w3" is the r1/r2 pair from quiet-w3-44e22bd.md.

At 4× CPU:
- Input→paint, all events: 152/1122 → 161/1301. w3: 352/2357 → 292/2667. The p95 halved, and it now comes from one event: the first button click at 1.1–1.3s.
- Hover open, space: 60/123 → 50/87 (w3 287/704 → 272/546). Shop card: 79/110 → 76/115 (w3 390/616 → 270/551). Rim: 85/113 → 85/120 (w3 441/667 → 372/547). Tip: 192 once in r2 (w3 689/728 → 341/515). Hovers are now 4–6× faster at p95.
- End of your turn → your next turn painted: 9.4s/11.3s → 9.5s/11.4s. w3 was 20.2s/21.3s → 18.3s/18.5s, so the wait is about half.
- A rival's turn:
  - Bot state → move applied: 268/517 → 278/568 (w3 1030/3099 → 881/2116).
  - Applied → shown on the table: 2710/4668 → 2494/4606 (w3 1304/5246 → 1908/6762). The p50 is about 1s slower than w3 and the p95 is lower. This looks like pacing (finite animations playing out), not blocking: shown → painted is only 336/437 p95.
  - Gap between table steps: 608/9568 → 655/9706 (w3 1341/19683 → 1149/17976).
- Long animation frames (≥50ms): 1829 (105 over 100ms, 7.6s blocking) → 2537 (176 over 100ms, 8.8s blocking). w3 was 2657 (1374, 197s) → 2800 (1375, 182s). Total blocking fell about 22× and frames over 100ms fell about 10×. The ≥50ms count is noisy run to run (1829 vs 2537). The worst frames are still the first click (DIV#root.onclick, 809ms, 198ms of forced layout) and the React scheduler (MessagePort.onmessage, 535ms, 131ms of forced layout). Long tasks: 138 (13.9s) → 146 (15.6s), max 799–975ms.
- Wheel spin: 1.19–1.47s per spin over 16–19 frames, with a worst frame gap of 328–512ms. w3 was 6.4–6.6s over 31–32 frames.
- Eaten clicks (live option, nothing changed): 0 of 11 → 0 of 11 (w3 1 → 0).

At 1× CPU:
- Input→paint: 144/312 → 104/276 (w3 152/648 → 216/418).
- Hover: space 48/92 → 50/77 (w3 77/159 → 75/172). Shop card 58/103 → 58/78 (w3 113/165 → 98/158). Rim 47/72 → 50/87.
- Turn wait: 8.9s/10.0s → 8.9s/10.0s (w3 7.7s/11.2s → 7.8s/10.9s). The p50 is about 1.1s longer than w3 and the p95 is shorter.
- A rival's turn: move applied 253/285 → 254/297 (w3 256/484 → 255/433). Applied → shown 2607/4693 → 2622/4655 (w3 1566/4125 → 1571/4139), about 1s slower at p50, the same pacing shift as at 4×.
- Long frames: 1783 (59 over 100ms, 369ms blocking) → 2668 (87, 78ms). w3 was 2591 (530) → 2640 (387).
- Spin: 1.11–1.27s over 15–18 frames (w3 4.1–4.2s over 33–38).
- Eaten clicks: 0 → 0.

Online, 80ms lag each way, 4× CPU, over the RTDB emulator (java and the jar were present), one run:
- Input→paint: host 304/760 (w3 464/976), guest 344/560 (w3 528/944).
- Hover, space: host 118/231 (w3 327/768), guest 118/186 (w3 312/603). Shop card: host 142/205, guest 135/190.
- Turn wait: host 30.3s/35.8s (w3 48.7s/74.8s), guest 8.2s/36.9s (w3 20.0s/64.8s).
- Sent → host applied: 184/261 (host), 200/227 (guest). Received: 401/459 and 403/450 (w3 553/935 and 512/942). Painted: 719/909 and 692/798 (w3 1315/1965 and 1135/2190).
- Long frames: host 2914 (1223 over 100ms, 5.2s blocking; w3 151s), guest 2568 (1035 over 100ms, 0ms blocking; w3 145s). Long tasks: host 270 (25.7s, max 810ms), guest 226 (21.4s, max 866ms).
- Eaten clicks: host 0 of 14, guest 0 of 11. w3 had 4 of 10 and 3 of 8.

In plain terms, w4 is much faster than w3 at 4×. Hovers open within about 120ms p95, the turn wait is about 9.5s instead of 18–20s, the wheel spins in about 1.3s instead of 6.5s, and blocking fell from about 190s to about 8s per run. At 1× it was already quick and stays quick. Online, no click was eaten, against 7 of 18 on w3, and states paint in about 0.7s instead of 1.1–1.3s.

Two things got worse. A rival's move takes about 1s longer between being applied and being shown, at both CPU speeds, and that pushes the 1× turn wait p50 from 7.8s to 8.9s. The first click of a game still costs over 1s at 4×. The host's online turn wait is still 30s p50.

## snappy, turndock, travel and online, alone on the production build (port 5369)

- snappy: PASS (75s).
  - Spin: 433ms (starts at 124ms, 9 frames, longest frame 83ms). w3: 421ms.
  - Hover: p95 116ms over 14/14 arrivals, with a 50ms box frame. The solo re-run earlier gave 95ms. w3: 198ms.
  - Minion: 99ms (w3 178ms).
  - Chain: 378ms planned at Quick and 865ms at Relaxed (557/1240ms on screen).
  - Turn gap at Steady: 9.2s scheduled, 9.5s wall.
- turndock: PASS (94s). At 1270×700, 52 rival placements, 8 turn cards, worst cover 0px. At 1100×700, 52 placements, 14 cards, 0px. On w3 it failed at both sizes on the home-screen click.
- travel: PASS (19s). Flights landed after the click: steal round I 754ms, steal round III 772ms, gift 580ms, member taken 769ms, ransom paid 636ms (3 flights), member use 869ms (3 flights). Every flight went from its source to its destination.
- online: PASS (99s, firebase-emulator). Reloads, Back with the seat kept, a bot standing in for Pia at move 20 and her return all held, and the game finished (Pia won with 47 followers). On w3 it failed alone.
