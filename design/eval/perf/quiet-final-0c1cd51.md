# Quiet-box run on final (0c1cd51), 2026-10-15 12:44–13:43 UTC

This ran on a fresh 4-CPU remote box with nothing else running, and no game code was changed. The checkout was claude/cults-final at 0c1cd510bb0bfef04c187996a741cc385e755791. The harness, seed (20261015) and shape (4 placements for P1, production build on 5369) match quiet-w4-8ea3e24.md and quiet-w3-44e22bd.md. The perf JSON and reports sit next to this file (final-cpu4, final-cpu4-r2, final-cpu1). One extra 4× run (r2) was added because the first 4× run came back slower than w4. There was no online run this time.

## Load (1/5/15-min average, before → after)

- npm ci (56s): 1.64 → 2.07
- Gate, `check:v4 --commit` (1199s): 1.39 → 2.77/7.89/9.94. It peaked at 26.8 (12:53, unit tests plus the first e2e wave), so the gate overloads the box by itself, as it did on w3 and w4.
- Solo e2e re-runs: 2.29 → 1.51 · snappy alone: 1.39 → 0.85
- Perf: cpu4 0.78 → 1.42 · cpu1 1.42 → 0.59 · cpu4 r2 0.54 → 1.26 (all errors 0)
- Unit re-run of the timed-out test: 1.14 → 1.00

## Gate: FAIL, 6 of 20 lines (1199s; w4 was 4 of 20 in 833s)

- FAIL unit tests (1152s): 1040 passed, 1 skipped, 1 failed. The failure was market › "Blue table: 200 seeded bot games › finish cleanly with invariants holding", which hit "Test timed out in 600000ms". The "Error: kaboom" lines in the log come from tests that throw on purpose and are not failures.
- PASS production build (20s).
- PASS online (328s), hotseat (266s), tables (341s), memory (210s), benders (148s), pay (84s), resume-edge (158s), steal (63s), travel (62s), turndock (193s), turnstory (49s), layout (33s), motion (86s).
- FAIL spaces (157s): "[panels] (s8) placing: no prompt".
- FAIL members (61s): "[m14] a single move onto P2's resource row took 174ms to open its card (want ≤ 150ms)".
- FAIL reckoning (88s): "(r3) 7 prize flights for 9 winners". It also said "5 quadrants told, … longest flight 1882ms".
- FAIL info (103s): "[hover] (d) hover card p95 137ms, first run 165ms (want < 100ms)".
- FAIL snappy (95s): "(s1) the wheel spin took 503ms to land (want ≤ 400ms + one 17ms frame; runs 695, 507, 503ms)".

## Re-runs: real or flake

Each failing file was re-run once on its own (`V4_URL=http://127.0.0.1:5369`) against `vite build` + `vite preview` of the same clean commit, with the load at about 1.5–2.3.

- spaces: PASS (85s). All panels and sockets were lit and placed, and the longest ghost was 879ms (1339ms in the gate). Flake (load).
- members: PASS (35s), every ability, both Use paths. Flake (load).
- reckoning: PASS (52s). It told 4 quadrants, with 4 prize flights for 4 winners, and the longest flight was 942ms. Flake (load). One thing to note: under load it reported 5 quadrants told and 9 winners on a 4-quadrant board, so the count itself seems to drift under load, not only the timing.
- info: PASS (78s), hover p95 83ms over 21 cards. Flake (load).
- snappy: PASS (81s), spin 396ms. Flake (load).
- Unit Blue table (200 games): PASS alone in 187s. Flake (load). It also timed out under load on w3.

All six failures were load flakes, and no real failure remains on this commit. The gate keeps failing on its own load, though: it ran at load 27 on 4 CPUs, and every timing assertion is exposed to that.

## snappy alone on the production build

PASS (81s).
- Spin: 396ms (starts at 29ms, 10 frames, longest frame 50ms). w4 433ms, w3 421ms.
- Idle frame on your turn: 17ms.
- Hover: p95 61ms over 14/14 arrivals. w4 116ms, w3 198ms.
- Minion: 177ms and 136ms. w4 99ms, w3 178ms.
- Chain: 378ms planned at Quick and 865ms at Relaxed (505/961ms on screen). w4 557/1240.
- Turn gap at Steady: 9.2s scheduled, 9.8s wall. w4 9.5s, w3 9.8s.

## Perf: production build, scripts/v4-perf.mjs, seed 20261015

Values are p50/p95 in ms. At 4×, "final" is r1 → r2, and w4 and w3 are their r1 → r2 pairs.

At 4× CPU:
- Input→paint, all events: 196/2088 → 136/2608. w4 152/1122 → 161/1301, w3 352/2357 → 292/2667. The p95 is again one event, the first button click, which now takes 2.1–2.6s (w4 1.1–1.3s).
- Placement clicks (space): 104/199 → 79/98 (w4 52/165 → 76/207). Click → new state on screen for a placement: 879 → 875 p50 (w4 357 → 505).
- Hover, space: 72/146 → 73/157 (w4 60/123 → 50/87, w3 287/704 → 272/546). Shop card: 92/141 → 81/126 (w4 79/110 → 76/115, w3 390/616 → 270/551). Rim: 133/200 → 131/171 (w4 85/113 → 85/120).
- End of your turn → your next turn painted: 11.9s/14.5s → 12.0s/14.6s. w4 9.4s/11.3s → 9.5s/11.4s, w3 20.2s/21.3s → 18.3s/18.5s.
- A rival's turn: bot state → move applied 452/1228 → 435/969 (w4 268/517 → 278/568). Applied → shown 2906/4728 → 2516/4791 (w4 2710/4668 → 2494/4606). Gap between table steps 763/11729 → 822/11750 (w4 608/9568 → 655/9706).
- Long animation frames: 382 ≥50ms, 120 over 100ms, 23.4s blocking → 367, 113 over 100ms, 24.4s blocking. w4 had 105 → 176 over 100ms with 7.6s → 8.8s blocking. w3 had 1374 → 1375 over 100ms with 197s → 182s blocking. Long tasks: 382 (45.6s, max 1.9s) → 362 (45.6s, max 2.4s), against w4's 138–146 (14–16s, max 0.8–1.0s). The worst frames are the same two as on w4, only heavier. The first click (DIV#root.onclick) takes 1972–2444ms, with about 400ms of forced layout (w4 809ms). The React scheduler (MessagePort.onmessage) frames run 500–1085ms each (w4 535ms max).
- Wheel spin: 1.39–1.58s over 15–19 frames, with a worst gap of 327–374ms (w4 1.19–1.47s, w3 6.4–6.6s).
- Eaten clicks: 1 of 11 (card:15, a shop card) → 0 of 11 (w4 0 → 0, w3 1 → 0).

At 1× CPU (one run):
- Input→paint: 74/513 (w4 144/312 → 104/276, w3 152/648 → 216/418). Placement clicks: 41/59 (w4 57/71 → 83/91). Click → state for a placement: 145 p50 (w4 250 → 244).
- Hover: space 19/30 (w4 48/92 → 50/77, w3 77/159 → 75/172). Shop card 24/34 (w4 58/103 → 58/78, w3 113/165 → 98/158). Rim 26/41 (w4 47/72 → 50/87).
- Turn wait: 9.5s/10.9s (w4 8.9s/10.0s, w3 7.7s/11.2s → 7.8s/10.9s).
- A rival's turn: move applied 256/348 (w4 253/285). Applied → shown 2807/5236 (w4 2607/4693).
- Long frames: 74 ≥50ms, 10 over 100ms, 1.4s blocking (w4 59 → 87 over 100ms with 0.4s → 0.08s, w3 530 → 387 over 100ms).
- Spin: 1.23s, 1.25s and one at 3.46s over 50 frames with a 974ms worst gap (w4 1.11–1.27s).
- Eaten clicks: 0.

## In plain terms

Every gate failure was the gate's own load. Run alone, each file passes, and snappy passes with its best numbers yet (spin 396ms, hover p95 61ms).

The perf picture is split. At 1× the build is the quickest we've measured: hovers open in 30–40ms p95, half of w4's time. At 4×, though, final is slower than w4 on both runs, and the two runs agree with each other. Compared with w4:
- Total blocking is about 3× higher (23–24s against 8–9s).
- Long tasks are 2.6× more (about 370 against 140).
- The first click costs 2.1–2.6s instead of 1.1–1.3s.
- A placement takes about 0.9s to show instead of 0.4–0.5s.
- Hover p95 rose from 87–123 to 126–157ms.
- The wait between your turns grew from 9.5s to 12.0s.

It is still far better than w3 (24s of blocking against 190s, hovers 150ms against 550–700ms), but something between 8ea3e24 and 0c1cd51 added main-thread work that shows on slow machines. The forced layout in the React scheduler and in the first click is where to look. The 1× spin of 3.46s in one run is a single outlier.
