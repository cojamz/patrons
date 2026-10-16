# Quiet-box run on w3 (44e22bd), 2026-10-15 08:17–09:47 UTC

This was a fresh 4-CPU remote box, with nothing else running and no game code changed. The checkout was claude/cults-freeze-w3 at 44e22bdeef0021824860c697ec46f843f100f5f3. Raw logs went to the runner's scratchpad; the perf JSON sits next to this file (w3-prod-*.json/.md).

## Load (1/5/15-min average, before → after)

- npm ci (37s): 1.65 → 2.28
- Gate, `check:v4 --commit` (1264s): 2.09 → 1.73/6.35/7.95. During the gate the load peaked around 13–16 on 4 CPUs (12.84/15.71 at 08:30), so the gate loads the box itself.
- e2e re-runs, one at a time on the production build: 1.6 → 1.4, with a peak of 4.9 after tables
- Unit re-run of the failing files: 1.26 → 1.07
- Perf cpu4 r1 1.06 → 2.52 · cpu1 r1 2.52 → 1.27 · cpu4 r2 1.27 → 2.34 · cpu1 r2 2.34 → 1.16 · online 1.16 → 3.86

## Gate: FAIL, 11 of 19 lines (1264s)

- FAIL unit tests (1126s): 4 failed out of 1002 tests.
- PASS production build (14s).
- FAIL e2e online (121s): "timed out playing until more moves". Pia was left on "Your turn — place a minion" with 7 options while the others waited.
- FAIL e2e hotseat (268s): "game did not finish in 4 minutes". Also, "the seat-1 region moved between setup and place (62,166 → 62,165)", and a text cut where "You've placed this turn — recruit, b" spills 58px.
- FAIL e2e tables (510s): three tables didn't finish in 8 minutes. trading-yellow-echo was "stuck at move 99 (choose): 0 clicks on [] moved nothing".
- PASS memory (327s), spaces (171s), benders (230s), pay (78s), steal (54s), reckoning (129s), layout (30s), motion (91s).
- FAIL e2e members (52s), 10 problems:
  - [m3] the member's hover closes while the pointer moves onto its Use button, so clicking Use doesn't use Lottery Winner.
  - [m3] Lottery Winner "gave 4 gold, its button said +7", and afterwards it still shows as ready and lit.
  - [m4] the seat card closes on the way to Use, so Heiress gives "used false, white +0 (want +10)".
- FAIL e2e resume-edge (326s): "never reached the results".
- FAIL e2e turndock (482s), at both 1270 and 1100: "page.click: Timeout 30000ms exceeded, waiting for locator('[data-home=\"local\"]')".
- FAIL e2e turnstory (50s): "[t8-log] the space card opened 423px from its name".
- FAIL e2e info (114s), three problems:
  - Pointing at a name in the strip stacks its card on another one, and the same happens in a pinned strip card.
  - Hover p95 was 132ms against a 100ms limit.
- FAIL e2e snappy (86s): "(s2) hover cards open in p95 185ms (want ≤ 100ms + one 67ms frame)".

Unit failures:
- cards-trading › "Doppelganger copying Lender: the copy gets +5 at once": `expect(R(s).white).toBe(0)` received 1, at cards-trading.test.js:204.
- market › "Reseller: whenever you recruit, +1 of that member's color": the test expects gold 7, blue 0 and got gold 6, blue 1, at market.test.js:188.
- render-budget › "a click on a lit space lets the press paint before the table re-renders": data-moves expected "14", received "13".
- market › "Blue table: 200 seeded bot games": timed out at 600000ms.

## Re-runs: real or flake

Each failing file was re-run once on its own, against a production build of the same commit. The tree was clean at 44e22bd, built with `vite build` and served by `vite preview` on 5369 (e2e) and 5368 (perf).

- Real (failed again): members and turnstory (identical problems), the two engine unit tests, and turndock (same click timeout at both sizes, so the test or the home screen is broken, not the box).
- Real, partly: hotseat finished this time (P4 won with 75 followers) but failed again on seat regions moving between setup and place, by 7–14px this time. The 4-minute timeout was load.
- Real, partly: info's hover p95 came in at 80ms alone, so the hover miss was load. The stacked strip card came back ("Open Door…"), so that problem is real.
- Real, different spot: online failed again, this time "timed out playing until final results" with Hana on a choice whose prompt reads "-" (options space:last:0-1, 0-2, 1-0, 1-3) while the others wait on "Hana is choosing".
- Flake (load), passed alone: tables (138s), resume-edge (91s), snappy, render-budget, and the Blue 200-game block (131s).

## Perf: production build, scripts/v4-perf.mjs, seed 20261015

The baseline (quiet-baseline-b3ac40c.md) was measured on a dev build. These runs are production, so the comparison isn't like for like: dev React checks inflate the baseline's input and render numbers. Values below are p50/p95 in ms, run 1 → run 2. The r1–r2 spread is the noise floor.

At 4× CPU:
- Input→paint, all events: 352/2357 → 292/2667. Baseline 706/1035.
- Hover open, space: 287/704 → 272/546. Baseline space p95 215. Other hovers: rim 441/667 → 372/547, shop card 390/616 → 270/551, tip 689/728 → 341/515.
- End of your turn → your next turn painted: 20.2s/21.3s → 18.3s/18.5s. Baseline 12.5s p50; the 79dee80 run was 20.1s.
- A rival's turn:
  - Bot state → move applied: 1030/3099 → 881/2116. Baseline 513.
  - Applied → shown on the table: 1304/5246 → 1908/6762. Baseline 2.5s/5.9s.
  - Gap between table steps: 1341/19683 → 1149/17976.
- Long animation frames (≥50ms): 2657 (1374 over 100ms, 197s blocking) → 2800 (1375, 182s). Baseline about 330 and 45s. The worst frames are the React scheduler (MessagePort.onmessage) at 1.5–2.3s each, mostly forced layout, and the very first click at 1.4s.
- Wheel spin: 6.4–6.6s over 31–32 frames, against the baseline's 4.6s over 38 frames.
- Eaten clicks: 1 of 11 (shop card card:15) → 0 of 11.

At 1× CPU:
- Input→paint: 152/648 → 216/418. Baseline 168/273 → 184/360.
- Hover, space: 77/159 → 75/172; shop card 113/165 → 98/158.
- Turn wait: 7.7s/11.2s → 7.8s/10.9s.
- A rival's turn: bot move applied 256/484 → 255/433; applied → shown 1566/4125 → 1571/4139.
- Long frames: 2591 (530 over 100ms) → 2640 (387).
- Spin: 4.1–4.2s over 33–38 frames.
- Eaten clicks: 0 → 0.

Online, 80ms lag each way, 4× CPU (java and the emulator jar were present):
- Input→paint: host 464/976, guest 528/944.
- Hover, space: host 327/768, guest 312/603.
- Turn wait: host 48.7s/74.8s, guest 20.0s/64.8s.
- Sent → applied: 257/578 (host), 288/387 (guest). Received: 553/935 and 512/942. Painted: 1315/1965 and 1135/2190. Baseline painted was 1100–1200 p50.
- Long frames: host 2246 (151s blocking), guest 2337 (145s).
- Eaten clicks: host 4 of 10, guest 3 of 8, all of them space clicks (slot:1-1, 2-2, 2-0, 1-3; slot:1-0, 3-0, 0-2). The baseline had 3 dead clicks.

In plain terms, at 1× the build is quick: hovers come in under 175ms p95 and the turn wait is under 8s p50. At 4× it isn't. Hovers run 550–700ms p95, the turn wait is 18–20s, and long frames are about 8× the dev baseline's count, with the worst coming from forced layout inside React's scheduler. Online, 7 of 18 space clicks did nothing.

## snappy and turndock, alone on the production build (port 5369)

- snappy: PASS.
  - Spin: 421ms (starts at 122ms, 8 frames, longest frame 67ms).
  - Hover: p95 198ms over 14 arrivals, with a 100ms box frame (first run 202ms).
  - Minion on its space: 178ms.
  - Chain length: 378ms planned at Quick, 865ms at Relaxed (755/1300ms on screen).
  - Gap between your turns at Steady: 9.2s scheduled, 9.8s wall.
  - In the gate it failed on hover (185ms p95 against an allowance of 100 + 67ms).
- turndock: FAIL, at both sizes, before any turn was seen: it can't click the home screen's "Play on this device" button (`[data-home="local"]`) within 30s.
