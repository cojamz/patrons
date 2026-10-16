# Perf run: w3-prod-cpu4-r1

2026-10-15T09:10:22.485Z · local (1 person + 3 Normal bots, normal speed) · CPU 4× · seed 20261015 · think 650ms · 546s wall
Load average before 1.06 / 1.7 / 3.53, after 2.3 / 2.16 / 2.94 (box: 4 CPUs). Vite HMR/reloads during the run: not watched.

## P1: 4 placements (1 in round II)

### Input → next paint (Event Timing; rAF fallback below 16ms)

All: n 38, p50 352ms, p95 2357ms, max 2357ms

| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |
|---|---|---|---|---|---|---|
| pointerdown button | 2 | 197 | 2357 | 2357 | 19 | – |
| click button | 2 | 224 | 2357 | 2357 | 32 | 1375 |
| click next-round | 1 | 1016 | 1016 | 1016 | 24 | 698 |
| pointerdown wheel | 2 | 816 | 888 | 888 | 14 | 25 |
| pointerdown next-round | 1 | 847 | 847 | 847 | 18 | – |
| click wheel | 2 | 344 | 632 | 632 | 271 | 2 |
| keydown key:ArrowRight | 2 | 512 | 624 | 624 | 40 | 21 |
| keydown key:ArrowLeft | 4 | 352 | 536 | 536 | 165 | 12 |
| click rate | 2 | 432 | 512 | 512 | 227 | 36 |
| pointerdown pay | 2 | 404 | 464 | 464 | 26 | 2 |
| click pay | 2 | 404 | 464 | 464 | 39 | 51 |
| click option:color | 2 | 80 | 456 | 456 | 39 | 69 |
| pointerdown rate | 2 | 319 | 432 | 432 | 66 | 1 |
| pointerdown shop-card | 1 | 352 | 352 | 352 | 7 | 4 |
| click shop-card | 1 | 352 | 352 | 352 | 16 | 90 |
| pointerdown space | 4 | 98 | 294 | 294 | 22 | 5 |
| click space | 4 | 98 | 294 | 294 | 43 | 50 |
| pointerdown option:color | 2 | 79 | 253 | 253 | 32 | – |

### Click → new state on screen (harness, wall clock)

| click | n | p50 | max | no change in 4s |
|---|---|---|---|---|
| setup | 2 | 1160 | 1816 | 0 |
| place | 4 | 1682 | 1969 | 0 |
| followers | 2 | 2131 | 2316 | 0 |
| pay | 2 | 1271 | 1633 | 0 |
| recruit | 1 | 2512 | 2512 | 0 |
| next-round | 1 | 1414 | 1414 | 0 |

Clicks on a live option that changed nothing (tracer, 1.2s): 1 of 11 (card:15).

### Hover open delay (pointer over → card in the DOM; content = "You'd get" filled)

| target | n | p50 | p95 | max | content p95 | pointerover handler p95 |
|---|---|---|---|---|---|---|
| space | 36 | 287 | 704 | 716 | 704 | 1 |
| rim | 5 | 441 | 667 | 667 | 667 | 0 |
| shop-card | 15 | 390 | 616 | 616 | 616 | 1 |
| tip | 2 | 689 | 728 | 728 | 728 | 1 |

Hovers whose card never showed (moved on first, or no card): 10.

### Long animation frames

LoAF: 2657 frames ≥50ms, 1374 over 100ms, total blocking 197385ms. Long tasks: 1273, 269592ms total, max 2342ms.

| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |
|---|---|---|---|---|
| 106288 | 2562 | 2484 | 191 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 2342 (forced layout 1813) |
| 94880 | 2247 | 2168 | 681 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 1535 (forced layout 956) |
| 97179 | 1715 | 1637 | 904 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 782 (forced layout 475) |
| 1613 | 1554 | 1503 | 15 | DIV#root.onclick · xf · assets/index-Cwu4GImh.js:55662 · 1372 (forced layout 482) |
| 110582 | 1491 | 1408 | 765 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 693 (forced layout 415) |
| 154222 | 1457 | 1341 | 59 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 1309 (forced layout 975)<br>TimerHandler:setTimeout · ? · assets/App-tGzvX9QR.js:11984 · 71 |
| 20659 | 1303 | 1230 | 466 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 813 (forced layout 568)<br>TimerHandler:setTimeout · ? · assets/App-tGzvX9QR.js:11984 · 10 |
| 155749 | 1299 | 1185 | 1231 | FrameRequestCallback · ht · assets/CultSeat-C79IAyZ-.js:23419 · 869 (forced layout 829) |
| 25601 | 1266 | 1216 | 26 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 1239 (forced layout 896) |
| 13686 | 1227 | 1150 | 555 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 645 (forced layout 283) |

### React commits per component (dev build actualDuration, inclusive of children)

Commits: 605; whole-tree commit p50 –ms, p95 –ms, max –ms.

| component | renders | p50 | p95 | max |
|---|---|---|---|---|

### Wheel spins (rAF-driven: one React render of the Wheel per frame)

| from° → to° | ms | frames | worst frame gap |
|---|---|---|---|
| 0 → 0 | 0 | 1 | 0 |
| 87 → 0 | 6434 | 31 | 803 |
| 87 → 0 | 6635 | 32 | 756 |

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
| css-anim span.tick.num (bump) | 20 | 420 | 420 | 6180 |  |  |
| waapi ghost.flight.card-flight | 7 | 883 | 973 | 5647 | linear |  |
| waapi span.worker | 24 | 180 | 310 | 5460 | linear |  |
| waapi ghost.worker-flight.minion-flight.home | 12 | 340 | 340 | 4080 | cubic-bezier(.25,.6,.3,1) |  |
| css-anim span.lead (cult-gesture) | 8 | 550 | 550 | 3850 | linear |  |
| css-anim span.dots (blink) | 3 | 1200 | 1200 | 3600 | linear | yes |
| css-anim span.worker (land) | 14 | 240 | 240 | 3360 | linear |  |
| css-anim span.reckon-count (rise) | 14 | 250 | 250 | 3250 |  |  |
| css-anim svg.leader (cult-breathe) | 1 | 3100 | 3100 | 3100 | linear | yes |
| css-trans path.wash (fill) | 104 | 150 | 150 | 3000 |  |  |
| css-trans button.card.lt-card[uid] (filter) | 94 | 150 | 150 | 2850 |  |  |
| waapi ghost.worker-flight.minion-flight.path-arc | 10 | 280 | 280 | 2800 | cubic-bezier(.45,0,.2,1) |  |
| waapi b.bundle-n | 7 | 440 | 440 | 2716 | linear |  |
| waapi span.cs-stack.zero | 9 | 240 | 240 | 2160 | cubic-bezier(.3,1.45,.5,1) |  |
| css-anim span.tc-line (tcline) | 13 | 300 | 300 | 2100 | linear |  |
| waapi ghost.token-flight.reckon | 6 | 320 | 405 | 2036 | cubic-bezier(.25,.6,.3,1) |  |
| css-anim span.lead (cult-scheme) | 6 | 600 | 600 | 1800 | linear |  |
| css-anim span.tick.re-f (bump) | 4 | 420 | 420 | 1680 | linear |  |
| css-anim section.prompt.choice (cta-pulse) | 1 | 1500 | 1500 | 1500 | linear |  |
| waapi span.base | 14 | 90 | 140 | 1460 | cubic-bezier(.3,1.4,.5,1) |  |
| waapi span.cs-total.lead | 8 | 180 | 180 | 1440 | cubic-bezier(.3,1.5,.5,1) |  |
| waapi ghost.worker-flight.minion-flight.trail.path-arc | 8 | 180 | 180 | 1440 | cubic-bezier(.45,0,.2,1) |  |
| waapi span.cs-total | 8 | 180 | 180 | 1440 | cubic-bezier(.3,1.5,.5,1) |  |
| css-anim span.reckon-count.won (reckonstamp) | 6 | 240 | 240 | 1440 | linear |  |
| css-trans path.glow (opacity) | 31 | 150 | 150 | 1350 |  |  |
| css-trans path.edge-lit (opacity) | 31 | 150 | 150 | 1350 |  |  |
| css-anim span.worker-fig (panelland) | 14 | 300 | 300 | 1200 | linear |  |

### Waiting

Your turn ends → your next turn painted: p50 20198ms, p95 21298ms, max 21298ms (n 3).
Still moving when your turn came (finite animations running, time left): p50 1033ms, max 1133ms.

### Bot pacing

A bot's state → its move applied: p50 1030ms, p95 3099ms. Applied → shown on the table: p50 1304ms, p95 5246ms, max 5491ms. Shown → painted p95 1839ms. Gap between table steps: p50 1341ms, p95 19683ms.
