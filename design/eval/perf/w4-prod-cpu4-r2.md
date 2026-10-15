# Perf run: w4-prod-cpu4-r2

2026-10-15T12:04:35.222Z · local (1 person + 3 Normal bots, normal speed) · CPU 4× · seed 20261015 · think 650ms · 544s wall
Load average before 1.07 / 1.34 / 3.08, after 2.12 / 1.82 / 2.54 (box: 4 CPUs). Vite HMR/reloads during the run: not watched.

## P1: 4 placements (1 in round II)

### Input → next paint (Event Timing; rAF fallback below 16ms)

All: n 38, p50 161ms, p95 1301ms, max 1301ms

| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |
|---|---|---|---|---|---|---|
| pointerdown button | 2 | 120 | 1301 | 1301 | 11 | – |
| click button | 2 | 144 | 1301 | 1301 | 14 | 862 |
| click next-round | 1 | 504 | 504 | 504 | 6 | 362 |
| pointerdown next-round | 1 | 463 | 463 | 463 | 2 | – |
| keydown key:ArrowRight | 2 | 248 | 248 | 248 | 15 | 6 |
| pointerdown wheel | 2 | 144 | 232 | 232 | 7 | 12 |
| click rate | 2 | 160 | 232 | 232 | 33 | 19 |
| keydown key:ArrowLeft | 4 | 176 | 224 | 224 | 4 | 3 |
| pointerdown pay | 2 | 161 | 216 | 216 | 14 | – |
| click pay | 2 | 161 | 216 | 216 | 18 | 20 |
| pointerdown space | 4 | 76 | 208 | 208 | 10 | 4 |
| click space | 4 | 76 | 207 | 207 | 22 | 32 |
| click option:color | 2 | 106 | 200 | 200 | 21 | 40 |
| pointerdown rate | 2 | 160 | 190 | 190 | 25 | 3 |
| click wheel | 2 | 136 | 176 | 176 | 19 | 1 |
| pointerdown option:color | 2 | 106 | 158 | 158 | 15 | 2 |
| click shop-card | 1 | 120 | 120 | 120 | 7 | 51 |
| pointerdown shop-card | 1 | 100 | 100 | 100 | 3 | – |

### Click → new state on screen (harness, wall clock)

| click | n | p50 | max | no change in 4s |
|---|---|---|---|---|
| setup | 2 | 245 | 485 | 0 |
| place | 4 | 505 | 571 | 0 |
| followers | 2 | 494 | 584 | 0 |
| pay | 2 | 453 | 575 | 0 |
| recruit | 1 | 457 | 457 | 0 |
| next-round | 1 | 604 | 604 | 0 |

Clicks on a live option that changed nothing (tracer, 1.2s): 0 of 11.

### Hover open delay (pointer over → card in the DOM; content = "You'd get" filled)

| target | n | p50 | p95 | max | content p95 | pointerover handler p95 |
|---|---|---|---|---|---|---|
| space | 38 | 50 | 87 | 100 | 87 | 1 |
| shop-card | 15 | 76 | 115 | 115 | 115 | 0 |
| rim | 4 | 85 | 120 | 120 | 120 | 0 |
| tip | 1 | 192 | 192 | 192 | 192 | 0 |

Hovers whose card never showed (moved on first, or no card): 14.

### Long animation frames

LoAF: 2537 frames ≥50ms, 176 over 100ms, total blocking 8764ms. Long tasks: 146, 15555ms total, max 975ms.

| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |
|---|---|---|---|---|
| 1146 | 987 | 935 | 9 | DIV#root.onclick · xf · assets/index-MksUv53I.js:55911 · 862 (forced layout 264) |
| 47182 | 516 | 454 | 90 | MessagePort.onmessage · hn · assets/index-MksUv53I.js:29785 · 413 (forced layout 134)<br>TimerHandler:setTimeout · ? · assets/App-JvSY22jO.js:104276 · 11 |
| 8 | 473 | 21 | 8 | http://127.0.0.1:5368/assets/index-MksUv53I.js · ? · assets/index-MksUv53I.js:0 · 56 |
| 69457 | 406 | 340 | 58 | MessagePort.onmessage · hn · assets/index-MksUv53I.js:29785 · 332 (forced layout 75)<br>FrameRequestCallback · Ct · assets/CultSeat-C0oAbDMU.js:26882 · 26 (forced layout 13)<br>TimerHandler:setTimeout · ? · assets/App-JvSY22jO.js:104276 · 13 |
| 67295 | 391 | 339 | 10 | DIV#root.onclick · xf · assets/index-MksUv53I.js:55911 · 361 (forced layout 123) |
| 9950 | 370 | 304 | 26 | MessagePort.onmessage · hn · assets/index-MksUv53I.js:29785 · 326 (forced layout 50)<br>TimerHandler:setTimeout · ? · assets/App-JvSY22jO.js:104276 · 14 |
| 12034 | 306 | 234 | 33 | MessagePort.onmessage · hn · assets/index-MksUv53I.js:29785 · 250 (forced layout 54)<br>TimerHandler:setTimeout · ? · assets/App-JvSY22jO.js:104276 · 14 |
| 8667 | 278 | 222 | 28 | MessagePort.onmessage · hn · assets/index-MksUv53I.js:29785 · 244 (forced layout 31) |
| 9657 | 274 | 139 | 28 | MessagePort.onmessage · hn · assets/index-MksUv53I.js:29785 · 159 |
| 7985 | 260 | 208 | 15 | MessagePort.onmessage · hn · assets/index-MksUv53I.js:29785 · 242 (forced layout 94) |

### React commits per component (dev build actualDuration, inclusive of children)

Commits: 640; whole-tree commit p50 –ms, p95 –ms, max –ms.

| component | renders | p50 | p95 | max |
|---|---|---|---|---|

### Wheel spins (rAF-driven: one React render of the Wheel per frame)

| from° → to° | ms | frames | worst frame gap |
|---|---|---|---|
| 0 → 0 | 0 | 1 | 0 |
| 42 → 0 | 1189 | 17 | 357 |
| 61 → 0 | 1315 | 18 | 484 |
| 49 → 0 | 1197 | 16 | 328 |
| 63 → 0 | 1472 | 16 | 479 |

### Animations and transitions (every one that ran)

| animation | count | duration p50 | max | total ms | easing | loop |
|---|---|---|---|---|---|---|
| css-anim i.cs-min (cs-bob) | 28 | 4612 | 5299 | 126209 | linear | yes |
| css-anim svg.mark (turn) | 1 | 40000 | 40000 | 40000 | linear | yes |
| waapi ghost.piece-flight.piece-res.path-arc | 76 | 364 | 417 | 27880 | cubic-bezier(.45,0,.2,1) |  |
| waapi div.path-inner | 74 | 352 | 500 | 25248 | ease-out |  |
| css-anim svg.sprite (cult-shift) | 6 | 3353 | 3987 | 19861 | linear | yes |
| waapi button.card.lt-card[uid] | 18 | 883 | 1133 | 15951 | linear |  |
| css-trans path.wash (fill) | 104 | 150 | 150 | 15600 | ease |  |
| waapi ghost.piece-flight.piece-fol.path-arc | 44 | 439 | 500 | 15576 | cubic-bezier(.45,0,.2,1) |  |
| waapi ghost.card.lt-card.paper.dim.lt-deal | 17 | 885 | 1113 | 14786 | cubic-bezier(.3,.7,.4,1) |  |
| css-trans button.card.lt-card[uid] (filter) | 88 | 150 | 150 | 13200 | ease |  |
| css-anim span.tick.num (bump) | 29 | 260 | 420 | 9620 | linear |  |
| css-anim svg.sprite (cult-breathe) | 3 | 3263 | 3736 | 9389 | linear | yes |
| waapi ghost.piece-flight.piece-res.pay.path-drop | 21 | 440 | 500 | 9330 | linear |  |
| waapi span.cs-stack | 39 | 180 | 240 | 7620 | cubic-bezier(.3,1.5,.5,1) |  |
| waapi span.cs-member | 14 | 260 | 973 | 7467 | linear |  |
| css-anim span.lead (cult-gesture) | 13 | 550 | 550 | 7150 | linear |  |
| waapi ghost.flight.card-flight | 7 | 883 | 973 | 5647 | linear |  |
| waapi span.worker | 24 | 180 | 310 | 5460 | linear |  |
| css-trans path.glow (opacity) | 36 | 150 | 150 | 5118 | ease |  |
| css-trans path.edge-lit (opacity) | 36 | 150 | 150 | 5118 | ease |  |
| css-anim g.blink (cult-blink) | 1 | 4700 | 4700 | 4700 | linear | yes |
| css-trans path.wash (filter) | 56 | 120 | 120 | 4609 | ease |  |
| css-anim span.worker-fig (panelland) | 14 | 300 | 300 | 4200 | linear |  |
| css-anim span.lead (cult-scheme) | 7 | 600 | 600 | 4200 | linear |  |
| waapi ghost.worker-flight.minion-flight.home | 12 | 340 | 340 | 4080 | cubic-bezier(.25,.6,.3,1) |  |
| css-anim span.reckon-count (rise) | 16 | 250 | 250 | 4000 | linear |  |
| css-anim span.dots (blink) | 3 | 1200 | 1200 | 3600 | linear | yes |
| css-trans button.fb.lt-rate (filter) | 24 | 150 | 150 | 3600 | ease |  |
| css-anim span.worker (land) | 14 | 240 | 240 | 3360 | linear |  |
| css-anim span.tick.dip (bump) | 8 | 420 | 420 | 3360 | linear |  |
| css-anim span.tc-line (tcline) | 11 | 300 | 300 | 3300 | linear |  |
| css-trans button.card.lt-card[uid] (transform) | 28 | 120 | 120 | 3240 | ease |  |
| css-anim span.lead (cult-celebrate) | 4 | 800 | 800 | 3200 | linear |  |
| css-anim svg.leader (cult-breathe) | 1 | 3100 | 3100 | 3100 | linear | yes |
| waapi ghost.worker-flight.minion-flight.path-arc | 10 | 280 | 280 | 2800 | cubic-bezier(.45,0,.2,1) |  |
| waapi ghost.flight.shop-out | 10 | 260 | 385 | 2725 | cubic-bezier(.5,0,.75,0) |  |
| waapi b.bundle-n | 7 | 440 | 440 | 2716 | linear |  |
| waapi span.cs-stack.zero | 12 | 240 | 240 | 2700 | cubic-bezier(.3,1.45,.5,1) |  |
| css-trans span.base (opacity) | 18 | 150 | 150 | 2700 | ease |  |
| css-trans span.face (opacity) | 18 | 150 | 150 | 2700 | ease |  |

### Waiting

Your turn ends → your next turn painted: p50 9530ms, p95 11435ms, max 11435ms (n 3).
Still moving when your turn came (finite animations running, time left): p50 1033ms, max 1133ms.

### Bot pacing

A bot's state → its move applied: p50 278ms, p95 568ms. Applied → shown on the table: p50 2494ms, p95 4606ms, max 4693ms. Shown → painted p95 437ms. Gap between table steps: p50 655ms, p95 9706ms.
