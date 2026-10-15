# Perf run: w3-prod-cpu4-r2

2026-10-15T09:28:34.122Z · local (1 person + 3 Normal bots, normal speed) · CPU 4× · seed 20261015 · think 650ms · 547s wall
Load average before 1.27 / 1.38 / 2.17, after 2.37 / 2.08 / 2.19 (box: 4 CPUs). Vite HMR/reloads during the run: not watched.

## P1: 4 placements (1 in round II)

### Input → next paint (Event Timing; rAF fallback below 16ms)

All: n 38, p50 292ms, p95 2667ms, max 2667ms

| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |
|---|---|---|---|---|---|---|
| pointerdown button | 2 | 272 | 2667 | 2667 | 26 | – |
| click button | 2 | 280 | 2667 | 2667 | 44 | 1815 |
| click next-round | 1 | 960 | 960 | 960 | 22 | 725 |
| pointerdown next-round | 1 | 882 | 882 | 882 | 17 | – |
| pointerdown rate | 2 | 438 | 712 | 712 | 35 | 6 |
| click rate | 2 | 464 | 712 | 712 | 193 | 42 |
| keydown key:ArrowLeft | 4 | 359 | 488 | 488 | 184 | 16 |
| keydown key:ArrowRight | 2 | 424 | 448 | 448 | 25 | 10 |
| click wheel | 2 | 344 | 448 | 448 | 150 | 2 |
| click shop-card | 1 | 360 | 360 | 360 | 7 | 105 |
| pointerdown pay | 2 | 150 | 312 | 312 | 22 | – |
| click pay | 2 | 240 | 312 | 312 | 33 | 45 |
| pointerdown shop-card | 1 | 292 | 292 | 292 | 3 | – |
| pointerdown option:color | 2 | 54 | 272 | 272 | 13 | 0 |
| click option:color | 2 | 55 | 272 | 272 | 15 | 39 |
| pointerdown wheel | 2 | 100 | 272 | 272 | 20 | 21 |
| pointerdown space | 4 | 85 | 122 | 122 | 9 | – |
| click space | 4 | 85 | 121 | 121 | 37 | 37 |

### Click → new state on screen (harness, wall clock)

| click | n | p50 | max | no change in 4s |
|---|---|---|---|---|
| setup | 2 | 1228 | 1528 | 0 |
| place | 4 | 1533 | 1777 | 0 |
| followers | 2 | 1782 | 1841 | 0 |
| pay | 2 | 1620 | 1747 | 0 |
| recruit | 1 | 2209 | 2209 | 0 |
| next-round | 1 | 1581 | 1581 | 0 |

Clicks on a live option that changed nothing (tracer, 1.2s): 0 of 11.

### Hover open delay (pointer over → card in the DOM; content = "You'd get" filled)

| target | n | p50 | p95 | max | content p95 | pointerover handler p95 |
|---|---|---|---|---|---|---|
| space | 36 | 272 | 546 | 551 | 546 | 1 |
| rim | 5 | 372 | 547 | 547 | 547 | 0 |
| shop-card | 15 | 270 | 551 | 551 | 551 | 1 |
| tip | 2 | 341 | 515 | 515 | 515 | 1 |

Hovers whose card never showed (moved on first, or no card): 10.

### Long animation frames

LoAF: 2800 frames ≥50ms, 1375 over 100ms, total blocking 182234ms. Long tasks: 1297, 255220ms total, max 2671ms.

| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |
|---|---|---|---|---|
| 98110 | 2864 | 2807 | 186 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 2670 (forced layout 2236) |
| 1688 | 2060 | 2009 | 16 | DIV#root.onclick · xf · assets/index-Cwu4GImh.js:55662 · 1814 (forced layout 600) |
| 102796 | 1377 | 1314 | 512 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 851 (forced layout 450) |
| 93743 | 1319 | 1218 | 544 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 724 (forced layout 339)<br>TimerHandler:setTimeout · ? · assets/App-tGzvX9QR.js:11984 · 21 |
| 101517 | 1205 | 1137 | 234 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 953 (forced layout 612) |
| 15847 | 1197 | 1122 | 402 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 770 (forced layout 500)<br>TimerHandler:setTimeout · ? · assets/App-tGzvX9QR.js:99097 · 12 |
| 19366 | 1174 | 1091 | 377 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 763 (forced layout 532)<br>TimerHandler:setTimeout · ? · assets/App-tGzvX9QR.js:11984 · 17 |
| 87763 | 1148 | 1069 | 362 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 756 (forced layout 341)<br>TimerHandler:setTimeout · ? · assets/App-tGzvX9QR.js:99097 · 16 |
| 95677 | 1144 | 1021 | 570 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 500 (forced layout 240)<br>TimerHandler:setTimeout · ? · assets/App-tGzvX9QR.js:11984 · 39 |
| 23451 | 1127 | 1076 | 37 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 1089 (forced layout 819) |

### React commits per component (dev build actualDuration, inclusive of children)

Commits: 615; whole-tree commit p50 –ms, p95 –ms, max –ms.

| component | renders | p50 | p95 | max |
|---|---|---|---|---|

### Wheel spins (rAF-driven: one React render of the Wheel per frame)

| from° → to° | ms | frames | worst frame gap |
|---|---|---|---|
| 0 → 0 | 0 | 1 | 0 |
| 89 → 0 | 6457 | 31 | 932 |
| 87 → 0 | 1697 | 11 | 547 |
| 6 → 0 | 4386 | 22 | 500 |

### Animations and transitions (every one that ran)

| animation | count | duration p50 | max | total ms | easing | loop |
|---|---|---|---|---|---|---|
| css-anim i.cs-min (cs-bob) | 27 | 4612 | 5299 | 120910 | linear | yes |
| css-anim svg.mark (turn) | 1 | 40000 | 40000 | 40000 | linear | yes |
| waapi ghost.piece-flight.piece-res.path-arc | 76 | 369 | 417 | 27762 | cubic-bezier(.45,0,.2,1) |  |
| waapi div.path-inner | 74 | 348 | 500 | 25189 | ease-out |  |
| css-anim svg.sprite (cult-shift) | 6 | 3353 | 3987 | 19861 | linear | yes |
| waapi ghost.piece-flight.piece-fol.path-arc | 44 | 439 | 500 | 15576 | cubic-bezier(.45,0,.2,1) |  |
| waapi button.card.lt-card[uid] | 18 | 600 | 1133 | 12101 | linear |  |
| waapi ghost.card.lt-card.paper.dim.lt-deal | 17 | 620 | 1113 | 11321 | cubic-bezier(.3,.7,.4,1) |  |
| css-anim g.blink (cult-blink) | 2 | 4700 | 4700 | 9400 | linear | yes |
| css-anim svg.sprite (cult-breathe) | 3 | 3263 | 3736 | 9389 | linear | yes |
| waapi ghost.piece-flight.piece-res.pay.path-drop | 21 | 440 | 500 | 9330 | linear |  |
| waapi span.cs-stack | 42 | 180 | 240 | 8160 | cubic-bezier(.3,1.5,.5,1) |  |
| waapi span.cs-member | 14 | 260 | 973 | 7467 | linear |  |
| css-anim span.tick.num (bump) | 21 | 420 | 420 | 6860 |  |  |
| waapi ghost.flight.card-flight | 7 | 883 | 973 | 5647 | linear |  |
| waapi span.worker | 24 | 180 | 310 | 5460 | linear |  |
| css-anim span.lead (cult-gesture) | 9 | 550 | 550 | 4400 | linear |  |
| waapi ghost.worker-flight.minion-flight.home | 12 | 340 | 340 | 4080 | cubic-bezier(.25,.6,.3,1) |  |
| css-anim span.reckon-count (rise) | 16 | 250 | 250 | 4000 | linear |  |
| css-anim span.dots (blink) | 3 | 1200 | 1200 | 3600 | linear | yes |
| css-trans path.wash (fill) | 104 | 150 | 150 | 3150 | ease |  |
| css-anim span.worker (land) | 13 | 240 | 240 | 3120 | linear |  |
| css-anim svg.leader (cult-breathe) | 1 | 3100 | 3100 | 3100 | linear | yes |
| waapi ghost.worker-flight.minion-flight.path-arc | 10 | 280 | 280 | 2800 | cubic-bezier(.45,0,.2,1) |  |
| waapi b.bundle-n | 7 | 440 | 440 | 2716 | linear |  |
| css-trans button.card.lt-card[uid] (filter) | 93 | 150 | 150 | 2550 | ease |  |
| waapi span.cs-stack.zero | 9 | 240 | 240 | 2160 | cubic-bezier(.3,1.45,.5,1) |  |
| waapi ghost.token-flight.reckon | 6 | 320 | 405 | 2036 | cubic-bezier(.25,.6,.3,1) |  |
| css-trans path.glow (opacity) | 33 | 150 | 150 | 1906 |  |  |
| css-trans path.edge-lit (opacity) | 33 | 150 | 150 | 1906 |  |  |
| css-anim span.lead (cult-scheme) | 6 | 600 | 600 | 1800 | linear |  |
| css-trans path.rim.wait (fill-opacity) | 6 | 300 | 300 | 1800 | ease |  |
| css-trans path.wash (filter) | 55 | 120 | 120 | 1793 |  |  |
| css-anim span.tick.re-f (bump) | 4 | 420 | 420 | 1680 | linear |  |
| css-anim section.prompt.choice (cta-pulse) | 1 | 1500 | 1500 | 1500 | linear |  |
| css-anim span.worker-fig (panelland) | 13 | 300 | 300 | 1500 | linear |  |
| waapi span.base | 14 | 90 | 140 | 1460 | cubic-bezier(.3,1.4,.5,1) |  |
| waapi span.cs-total.lead | 8 | 180 | 180 | 1440 | cubic-bezier(.3,1.5,.5,1) |  |
| waapi ghost.worker-flight.minion-flight.trail.path-arc | 8 | 180 | 180 | 1440 | cubic-bezier(.45,0,.2,1) |  |
| waapi span.cs-total | 8 | 180 | 180 | 1440 | cubic-bezier(.3,1.5,.5,1) |  |

### Waiting

Your turn ends → your next turn painted: p50 18350ms, p95 18540ms, max 18540ms (n 3).
Still moving when your turn came (finite animations running, time left): p50 1033ms, max 1133ms.

### Bot pacing

A bot's state → its move applied: p50 881ms, p95 2116ms. Applied → shown on the table: p50 1908ms, p95 6762ms, max 6994ms. Shown → painted p95 1658ms. Gap between table steps: p50 1149ms, p95 17976ms.
