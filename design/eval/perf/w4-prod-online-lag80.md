# Perf run: w4-prod-online-lag80

2026-10-15T12:22:51.109Z · online (RTDB emulator, 2 people + 2 bots, lag 80ms each way) · CPU 4× · seed 20261015 · think 650ms · 552s wall
Load average before 1 / 1.16 / 1.87, after 3.45 / 3.09 / 2.59 (box: 4 CPUs). Vite HMR/reloads during the run: not watched.

## host: 4 placements (1 in round II)

### Input → next paint (Event Timing; rAF fallback below 16ms)

All: n 48, p50 304ms, p95 760ms, max 1072ms

| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |
|---|---|---|---|---|---|---|
| pointerdown button | 4 | 15 | 1072 | 1072 | 20 | 12 |
| click button | 4 | 16 | 1072 | 1072 | 37 | 30 |
| pointerdown next-round | 1 | 760 | 760 | 760 | 42 | 0 |
| click next-round | 1 | 760 | 760 | 760 | 55 | 322 |
| keydown key:ArrowLeft | 4 | 416 | 600 | 600 | 12 | 3 |
| pointerdown space | 4 | 119 | 528 | 528 | 18 | 5 |
| click space | 4 | 360 | 528 | 528 | 40 | 38 |
| click rate | 3 | 352 | 528 | 528 | 74 | 26 |
| click place-confirm | 4 | 328 | 496 | 496 | 57 | 20 |
| click pay | 1 | 496 | 496 | 496 | 30 | 4 |
| pointerdown wheel | 2 | 280 | 480 | 480 | 17 | 14 |
| keydown key:ArrowRight | 2 | 416 | 472 | 472 | 31 | 10 |
| click wheel | 2 | 376 | 400 | 400 | 27 | 1 |
| pointerdown option:color | 2 | 47 | 280 | 280 | 17 | 0 |
| click option:color | 2 | 120 | 280 | 280 | 21 | 28 |
| pointerdown rate | 3 | 153 | 220 | 220 | 51 | – |
| pointerdown place-confirm | 4 | 108 | 181 | 181 | 33 | – |
| pointerdown pay | 1 | 167 | 167 | 167 | 28 | – |

### Click → new state on screen (harness, wall clock)

| click | n | p50 | max | no change in 4s |
|---|---|---|---|---|
| setup | 2 | 704 | 975 | 0 |
| place | 4 | 337 | 434 | 0 |
| place-confirm | 4 | 1030 | 1159 | 0 |
| followers | 3 | 939 | 1097 | 0 |
| pay | 1 | 1024 | 1024 | 0 |
| next-round | 1 | 1003 | 1003 | 0 |

Clicks on a live option that changed nothing (tracer, 1.2s): 0 of 14.

### Hover open delay (pointer over → card in the DOM; content = "You'd get" filled)

| target | n | p50 | p95 | max | content p95 | pointerover handler p95 |
|---|---|---|---|---|---|---|
| space | 39 | 118 | 231 | 324 | 324 | 0 |
| shop-card | 14 | 142 | 205 | 205 | 205 | 1 |
| tip | 3 | 274 | 341 | 341 | 341 | 0 |
| rim | 4 | 161 | 217 | 217 | 217 | 1 |

Hovers whose card never showed (moved on first, or no card): 22.

### Long animation frames

LoAF: 2914 frames ≥50ms, 1223 over 100ms, total blocking 5178ms. Long tasks: 270, 25742ms total, max 810ms.

| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |
|---|---|---|---|---|
| 518187 | 511 | 0 | 7 | (no script: style/layout/paint) |
| 96824 | 497 | 403 | 28 | MessagePort.onmessage · hn · assets/index-MksUv53I.js:29785 · 425 (forced layout 120)<br>TimerHandler:setTimeout · ? · assets/index-MksUv53I.js:15955 · 16 |
| 150933 | 465 | 223 | 39 | MessagePort.onmessage · hn · assets/index-MksUv53I.js:29785 · 234 (forced layout 55)<br>TimerHandler:setTimeout · ? · :-1 · 8<br>FrameRequestCallback · ? · :-1 · 8 |
| 91952 | 431 | 166 | 19 | MessagePort.onmessage · hn · assets/index-MksUv53I.js:29785 · 195 (forced layout 25)<br>TimerHandler:setTimeout · ? · assets/index-MksUv53I.js:15955 · 6<br>TimerHandler:setTimeout · ? · :-1 · 5 |
| 95844 | 382 | 276 | 44 | MessagePort.onmessage · hn · assets/index-MksUv53I.js:29785 · 281 (forced layout 63)<br>TimerHandler:setTimeout · ? · assets/index-MksUv53I.js:15955 · 15 |
| 121795 | 376 | 227 | 28 | MessagePort.onmessage · hn · assets/index-MksUv53I.js:29785 · 249 (forced layout 32) |
| 100112 | 370 | 217 | 54 | MessagePort.onmessage · hn · assets/index-MksUv53I.js:29785 · 212 |
| 136359 | 370 | 320 | 8 | DIV#root.onclick · xf · assets/index-MksUv53I.js:55911 · 322 (forced layout 135) |
| 135978 | 363 | 0 | 23 | (no script: style/layout/paint) |
| 126232 | 361 | 275 | 39 | MessagePort.onmessage · hn · assets/index-MksUv53I.js:29785 · 285 (forced layout 32)<br>TimerHandler:setTimeout · ? · assets/index-MksUv53I.js:15955 · 27<br>FrameRequestCallback · w · assets/index-MksUv53I.js:22787 · 5 |

### React commits per component (dev build actualDuration, inclusive of children)

Commits: 658; whole-tree commit p50 –ms, p95 –ms, max –ms.

| component | renders | p50 | p95 | max |
|---|---|---|---|---|

### Wheel spins (rAF-driven: one React render of the Wheel per frame)

| from° → to° | ms | frames | worst frame gap |
|---|---|---|---|
| 0 → 0 | 0 | 1 | 0 |
| 42 → 0 | 1307 | 11 | 297 |
| 66 → 0 | 1343 | 10 | 504 |
| 49 → 0 | 1307 | 11 | 441 |
| 73 → 0 | 1518 | 12 | 463 |

### Animations and transitions (every one that ran)

| animation | count | duration p50 | max | total ms | easing | loop |
|---|---|---|---|---|---|---|
| css-anim i.cs-min (cs-bob) | 28 | 4612 | 5299 | 126209 | linear | yes |
| css-anim svg.mark (turn) | 1 | 40000 | 40000 | 40000 | linear | yes |
| waapi div.path-inner | 67 | 371 | 483 | 24094 | ease-out |  |
| waapi ghost.piece-flight.piece-res.path-arc | 66 | 360 | 400 | 23102 | cubic-bezier(.45,0,.2,1) |  |
| waapi ghost.piece-flight.piece-fol.path-arc | 42 | 440 | 483 | 18606 | cubic-bezier(.45,0,.2,1) |  |
| css-trans path.wash (fill) | 85 | 150 | 150 | 12600 | ease |  |
| css-trans button.card.lt-card[uid] (filter) | 78 | 150 | 150 | 11700 | ease |  |
| waapi ghost.piece-flight.piece-res.pay.path-drop | 26 | 440 | 440 | 11440 | linear |  |
| css-anim svg.sprite (cult-shift) | 3 | 2773 | 3645 | 9167 | linear | yes |
| waapi span.cs-stack | 45 | 180 | 240 | 8820 | cubic-bezier(.3,1.5,.5,1) |  |
| css-anim svg.sprite (cult-breathe) | 3 | 2456 | 3947 | 8792 | linear | yes |
| css-anim span.tick.num (bump) | 26 | 260 | 420 | 8200 | linear |  |
| waapi button.card.lt-card[uid] | 16 | 360 | 680 | 6920 | linear |  |
| waapi ghost.card.lt-card.paper.dim.lt-deal | 16 | 340 | 660 | 6600 | cubic-bezier(.3,.7,.4,1) |  |
| css-anim span.tc-line (tcline) | 23 | 300 | 300 | 6300 |  |  |
| css-anim span.lead (cult-gesture) | 11 | 550 | 550 | 6050 | linear |  |
| waapi span.worker | 22 | 180 | 310 | 4970 | linear |  |
| css-anim g.blink (cult-blink) | 1 | 4700 | 4700 | 4700 | linear | yes |
| css-trans path.glow (opacity) | 34 | 150 | 150 | 4327 |  |  |
| css-trans path.edge-lit (opacity) | 34 | 150 | 150 | 4327 |  |  |
| waapi ghost.worker-flight.minion-flight.home | 12 | 340 | 340 | 4080 | cubic-bezier(.25,.6,.3,1) |  |
| css-anim span.reckon-count (rise) | 16 | 250 | 250 | 4000 | linear |  |
| css-anim span.worker-fig (panelland) | 13 | 300 | 300 | 3900 | linear |  |
| css-anim span.lead (cult-scheme) | 6 | 600 | 600 | 3600 | linear |  |
| waapi span.cs-stack.zero | 14 | 240 | 240 | 3360 | cubic-bezier(.3,1.45,.5,1) |  |
| css-trans path.wash (filter) | 51 | 120 | 120 | 3356 |  |  |
| css-anim span.worker (land) | 13 | 240 | 240 | 3120 | linear |  |
| css-anim svg.leader (cult-breathe) | 1 | 3100 | 3100 | 3100 | linear | yes |
| css-trans button.fb.lt-rate (filter) | 20 | 150 | 150 | 3000 | ease |  |
| waapi ghost.token-flight.reckon | 9 | 341 | 406 | 2962 | cubic-bezier(.25,.6,.3,1) |  |
| css-trans button.card.lt-card[uid] (transform) | 28 | 120 | 120 | 2880 | ease |  |
| css-trans span.base (opacity) | 19 | 150 | 150 | 2850 | ease |  |
| css-trans span.face (opacity) | 19 | 150 | 150 | 2850 | ease |  |
| css-trans div.turn-card.folding (opacity) | 6 | 450 | 450 | 2700 | ease |  |
| css-trans div.turn-card.folding (transform) | 6 | 450 | 450 | 2700 | cubic-bezier(0.5, 0, 0.7, 0.4) |  |
| waapi ghost.worker-flight.minion-flight.path-arc | 9 | 280 | 280 | 2520 | cubic-bezier(.45,0,.2,1) |  |
| css-anim span.tick.dip (bump) | 6 | 420 | 420 | 2520 | linear |  |
| css-anim span.dots (blink) | 2 | 1200 | 1200 | 2400 | linear | yes |
| css-anim span.lead (cult-celebrate) | 3 | 800 | 800 | 2400 | linear |  |
| css-anim span.reckon-count.won (reckonstamp) | 9 | 240 | 240 | 2160 | linear |  |

### Waiting

Your turn ends → your next turn painted: p50 30253ms, p95 35791ms, max 35791ms (n 3).
Still moving when your turn came (finite animations running, time left): p50 600ms, max 600ms.

### Bot pacing

A bot's state → its move applied: p50 601ms, p95 909ms. Applied → shown on the table: p50 187ms, p95 428ms, max 481ms. Shown → painted p95 124ms. Gap between table steps: p50 803ms, p95 15223ms.

### Online round trips (this person's moves)

States received: 90. Sent → host applied p50 184ms, p95 261ms; → received p50 401ms, p95 459ms, max 459ms; → painted p50 719ms, p95 909ms.
State snapshot size: 4716–14703 bytes (the whole game state as JSON, every move).

## guest: 3 placements (0 in round II)

### Input → next paint (Event Timing; rAF fallback below 16ms)

All: n 31, p50 344ms, p95 560ms, max 880ms

| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |
|---|---|---|---|---|---|---|
| click next-round | 1 | 880 | 880 | 880 | 31 | 302 |
| keydown key:ArrowRight | 1 | 560 | 560 | 560 | 38 | 3 |
| keydown key:ArrowLeft | 2 | 352 | 472 | 472 | 14 | 2 |
| click shop-card | 2 | 400 | 448 | 448 | 30 | 21 |
| click rate | 1 | 448 | 448 | 448 | 56 | 30 |
| click space | 3 | 400 | 440 | 440 | 49 | 51 |
| pointerdown next-round | 1 | 433 | 433 | 433 | 21 | – |
| pointerdown place-confirm | 3 | 168 | 432 | 432 | 20 | 1 |
| click place-confirm | 3 | 376 | 432 | 432 | 41 | 38 |
| pointerdown wheel | 1 | 416 | 416 | 416 | 15 | 11 |
| click wheel | 1 | 392 | 392 | 392 | 29 | 2 |
| pointerdown option:color | 2 | 112 | 216 | 216 | 16 | 2 |
| click option:color | 2 | 112 | 216 | 216 | 18 | 10 |
| pointerdown rate | 1 | 149 | 149 | 149 | 45 | – |
| pointerdown space | 3 | 131 | 135 | 135 | 26 | – |
| pointerdown shop-card | 2 | 119 | 133 | 133 | 27 | – |
| click button | 1 | 64 | 64 | 64 | 24 | 26 |
| pointerdown button | 1 | 61 | 61 | 61 | 13 | – |

### Click → new state on screen (harness, wall clock)

| click | n | p50 | max | no change in 4s |
|---|---|---|---|---|
| setup | 2 | 648 | 746 | 0 |
| place | 3 | 400 | 442 | 0 |
| place-confirm | 3 | 991 | 1050 | 0 |
| recruit | 2 | 946 | 984 | 0 |
| followers | 1 | 1102 | 1102 | 0 |
| next-round | 1 | 676 | 676 | 0 |

Clicks on a live option that changed nothing (tracer, 1.2s): 0 of 11.

### Hover open delay (pointer over → card in the DOM; content = "You'd get" filled)

| target | n | p50 | p95 | max | content p95 | pointerover handler p95 |
|---|---|---|---|---|---|---|
| space | 46 | 118 | 186 | 233 | 186 | 1 |
| shop-card | 15 | 135 | 190 | 190 | 190 | 2 |
| tip | 1 | 223 | 223 | 223 | 223 | 0 |
| rim | 2 | 114 | 191 | 191 | 191 | 0 |

Hovers whose card never showed (moved on first, or no card): 17.

### Long animation frames

LoAF: 2568 frames ≥50ms, 1035 over 100ms, total blocking 0ms. Long tasks: 226, 21445ms total, max 866ms.

| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |
|---|---|---|---|---|
| 515618 | 381 | 0 | 3 | (no script: style/layout/paint) |
| 462951 | 276 | 0 | 4 | (no script: style/layout/paint) |
| 357370 | 271 | 0 | 5 | (no script: style/layout/paint) |
| 342188 | 261 | 0 | 4 | (no script: style/layout/paint) |
| 477269 | 261 | 0 | 6 | (no script: style/layout/paint) |
| 222588 | 258 | 0 | 3 | (no script: style/layout/paint) |
| 537292 | 256 | 0 | 4 | (no script: style/layout/paint) |
| 244989 | 254 | 0 | 6 | (no script: style/layout/paint) |
| 358348 | 252 | 0 | 5 | (no script: style/layout/paint) |
| 476876 | 252 | 0 | 6 | (no script: style/layout/paint) |

### React commits per component (dev build actualDuration, inclusive of children)

Commits: 630; whole-tree commit p50 –ms, p95 –ms, max –ms.

| component | renders | p50 | p95 | max |
|---|---|---|---|---|

### Wheel spins (rAF-driven: one React render of the Wheel per frame)

| from° → to° | ms | frames | worst frame gap |
|---|---|---|---|
| 0 → 0 | 0 | 1 | 0 |
| 53 → 0 | 1187 | 10 | 338 |
| 69 → 0 | 1403 | 13 | 432 |

### Animations and transitions (every one that ran)

| animation | count | duration p50 | max | total ms | easing | loop |
|---|---|---|---|---|---|---|
| css-anim i.cs-min (cs-bob) | 28 | 4612 | 5299 | 126209 | linear | yes |
| css-anim svg.mark (turn) | 1 | 40000 | 40000 | 40000 | linear | yes |
| waapi div.path-inner | 67 | 371 | 485 | 24168 | ease-out |  |
| waapi ghost.piece-flight.piece-res.path-arc | 66 | 361 | 400 | 23028 | cubic-bezier(.45,0,.2,1) |  |
| waapi ghost.piece-flight.piece-fol.path-arc | 42 | 440 | 485 | 18628 | cubic-bezier(.45,0,.2,1) |  |
| waapi ghost.piece-flight.piece-res.pay.path-drop | 26 | 440 | 440 | 11440 | linear |  |
| css-anim svg.sprite (cult-shift) | 3 | 2773 | 3645 | 9167 | linear | yes |
| css-trans button.card.lt-card[uid] (filter) | 72 | 150 | 150 | 9000 |  |  |
| waapi span.cs-stack | 45 | 180 | 240 | 8820 | cubic-bezier(.3,1.5,.5,1) |  |
| css-anim svg.sprite (cult-breathe) | 3 | 2456 | 3947 | 8792 | linear | yes |
| css-anim span.tick.num (bump) | 25 | 260 | 420 | 7780 | linear |  |
| css-anim span.dots (blink) | 6 | 1200 | 1200 | 7200 | linear | yes |
| css-anim span.tc-line (tcline) | 24 | 300 | 300 | 7200 | linear |  |
| waapi button.card.lt-card[uid] | 16 | 360 | 680 | 6920 | linear |  |
| css-trans path.wash (fill) | 68 | 150 | 150 | 6900 | ease |  |
| waapi ghost.card.lt-card.paper.dim.lt-deal | 16 | 340 | 660 | 6600 | cubic-bezier(.3,.7,.4,1) |  |
| css-anim span.lead (cult-gesture) | 11 | 550 | 550 | 6050 | linear |  |
| waapi span.worker | 23 | 180 | 310 | 5320 | linear |  |
| css-anim g.blink (cult-blink) | 1 | 4700 | 4700 | 4700 | linear | yes |
| waapi ghost.worker-flight.minion-flight.home | 12 | 340 | 340 | 4080 | cubic-bezier(.25,.6,.3,1) |  |
| css-anim span.reckon-count (rise) | 16 | 250 | 250 | 4000 | linear |  |
| css-anim span.worker-fig (panelland) | 13 | 300 | 300 | 3900 | linear |  |
| css-anim span.lead (cult-scheme) | 6 | 600 | 600 | 3600 | linear |  |
| waapi span.cs-stack.zero | 14 | 240 | 240 | 3360 | cubic-bezier(.3,1.45,.5,1) |  |
| css-trans path.glow (opacity) | 24 | 150 | 150 | 3300 | ease |  |
| css-trans path.edge-lit (opacity) | 24 | 150 | 150 | 3300 | ease |  |
| css-anim span.worker (land) | 13 | 240 | 240 | 3120 | linear |  |
| css-anim svg.leader (cult-breathe) | 1 | 3100 | 3100 | 3100 | linear | yes |
| waapi ghost.token-flight.reckon | 9 | 344 | 406 | 2968 | cubic-bezier(.25,.6,.3,1) |  |
| waapi ghost.worker-flight.minion-flight.path-arc | 10 | 280 | 280 | 2800 | cubic-bezier(.45,0,.2,1) |  |
| css-trans div.turn-card.folding (opacity) | 6 | 450 | 450 | 2700 | ease |  |
| css-trans div.turn-card.folding (transform) | 6 | 450 | 450 | 2700 | cubic-bezier(0.5, 0, 0.7, 0.4) |  |
| css-anim span.tick.dip (bump) | 6 | 420 | 420 | 2520 | linear |  |
| css-trans button.fb.lt-rate (filter) | 18 | 150 | 150 | 2400 | ease |  |
| css-anim span.lead (cult-celebrate) | 3 | 800 | 800 | 2400 | linear |  |
| css-trans path.wash (filter) | 35 | 120 | 120 | 2280 |  |  |
| css-anim span.reckon-count.won (reckonstamp) | 9 | 240 | 240 | 2160 | linear |  |
| css-trans section.lt-shop (filter) | 10 | 200 | 300 | 2100 | ease |  |
| css-trans button.card.lt-card[uid] (transform) | 30 | 120 | 120 | 1920 |  |  |
| waapi button.fb.lt-rate | 10 | 180 | 180 | 1800 | cubic-bezier(.3,1.5,.5,1) |  |

### Waiting

Your turn ends → your next turn painted: p50 8176ms, p95 36878ms, max 36878ms (n 3).
Still moving when your turn came (finite animations running, time left): p50 440ms, max 600ms.

### Bot pacing

A bot's state → its move applied: p50 586ms, p95 890ms. Applied → shown on the table: p50 194ms, p95 494ms, max 500ms. Shown → painted p95 142ms. Gap between table steps: p50 803ms, p95 15106ms.

### Online round trips (this person's moves)

States received: 45. Sent → host applied p50 200ms, p95 227ms; → received p50 403ms, p95 450ms, max 450ms; → painted p50 692ms, p95 798ms.
State snapshot size: 4744–11154 bytes (the whole game state as JSON, every move).
