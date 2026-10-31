# Perf run: w4-prod-cpu4-r1

2026-10-15T11:46:27.695Z · local (1 person + 3 Normal bots, normal speed) · CPU 4× · seed 20261015 · think 650ms · 544s wall
Load average before 1.15 / 5.55 / 6.81, after 2.23 / 2.66 / 4.71 (box: 4 CPUs). Vite HMR/reloads during the run: not watched.

## P1: 4 placements (1 in round II)

### Input → next paint (Event Timing; rAF fallback below 16ms)

All: n 38, p50 152ms, p95 1122ms, max 1122ms

| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |
|---|---|---|---|---|---|---|
| pointerdown button | 2 | 136 | 1122 | 1122 | 9 | – |
| click button | 2 | 152 | 1122 | 1122 | 13 | 716 |
| click next-round | 1 | 528 | 528 | 528 | 7 | 336 |
| pointerdown next-round | 1 | 434 | 434 | 434 | 3 | – |
| pointerdown wheel | 2 | 256 | 288 | 288 | 6 | 16 |
| click wheel | 2 | 136 | 272 | 272 | 16 | 1 |
| click option:color | 2 | 131 | 240 | 240 | 8 | 33 |
| click pay | 2 | 176 | 232 | 232 | 20 | 16 |
| keydown key:ArrowRight | 2 | 184 | 216 | 216 | 20 | 7 |
| keydown key:ArrowLeft | 4 | 136 | 200 | 200 | 4 | 2 |
| click rate | 2 | 168 | 200 | 200 | 18 | 20 |
| pointerdown option:color | 2 | 131 | 188 | 188 | 7 | – |
| pointerdown pay | 2 | 118 | 178 | 178 | 16 | – |
| pointerdown space | 4 | 52 | 165 | 165 | 3 | – |
| click space | 4 | 52 | 165 | 165 | 11 | 21 |
| pointerdown rate | 2 | 130 | 144 | 144 | 17 | – |
| click shop-card | 1 | 136 | 136 | 136 | 5 | 50 |
| pointerdown shop-card | 1 | 106 | 106 | 106 | 2 | – |

### Click → new state on screen (harness, wall clock)

| click | n | p50 | max | no change in 4s |
|---|---|---|---|---|
| setup | 2 | 277 | 539 | 0 |
| place | 4 | 357 | 481 | 0 |
| followers | 2 | 356 | 532 | 0 |
| pay | 2 | 339 | 428 | 0 |
| recruit | 1 | 464 | 464 | 0 |
| next-round | 1 | 552 | 552 | 0 |

Clicks on a live option that changed nothing (tracer, 1.2s): 0 of 11.

### Hover open delay (pointer over → card in the DOM; content = "You'd get" filled)

| target | n | p50 | p95 | max | content p95 | pointerover handler p95 |
|---|---|---|---|---|---|---|
| space | 38 | 60 | 123 | 125 | 123 | 1 |
| shop-card | 15 | 79 | 110 | 110 | 110 | 1 |
| rim | 4 | 85 | 113 | 113 | 113 | 1 |

Hovers whose card never showed (moved on first, or no card): 13.

### Long animation frames

LoAF: 1829 frames ≥50ms, 105 over 100ms, total blocking 7634ms. Long tasks: 138, 13865ms total, max 799ms.

| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |
|---|---|---|---|---|
| 1117 | 809 | 759 | 9 | DIV#root.onclick · xf · assets/index-MksUv53I.js:55911 · 713 (forced layout 198) |
| 46704 | 535 | 484 | 92 | MessagePort.onmessage · hn · assets/index-MksUv53I.js:29785 · 442 (forced layout 131) |
| 12 | 382 | 0 | 4 | (no script: style/layout/paint) |
| 112325 | 375 | 108 | 158 | (no script: style/layout/paint) |
| 66145 | 367 | 317 | 10 | DIV#root.onclick · xf · assets/index-MksUv53I.js:55911 · 335 (forced layout 127) |
| 68333 | 334 | 266 | 63 | MessagePort.onmessage · hn · assets/index-MksUv53I.js:29785 · 253 (forced layout 96)<br>FrameRequestCallback · Ct · assets/CultSeat-C0oAbDMU.js:26882 · 24 (forced layout 11)<br>TimerHandler:setTimeout · ? · assets/App-JvSY22jO.js:104276 · 9 |
| 47470 | 299 | 203 | 32 | MessagePort.onmessage · hn · assets/index-MksUv53I.js:29785 · 220 (forced layout 48)<br>TimerHandler:setTimeout · ? · assets/App-JvSY22jO.js:104694 · 14 |
| 13667 | 260 | 196 | 23 | MessagePort.onmessage · hn · assets/index-MksUv53I.js:29785 · 223 (forced layout 66)<br>TimerHandler:setTimeout · ? · assets/App-JvSY22jO.js:104276 · 7 |
| 44977 | 260 | 184 | 21 | MessagePort.onmessage · hn · assets/index-MksUv53I.js:29785 · 213 (forced layout 27) |
| 11673 | 253 | 191 | 29 | MessagePort.onmessage · hn · assets/index-MksUv53I.js:29785 · 212 (forced layout 50)<br>TimerHandler:setTimeout · ? · assets/App-JvSY22jO.js:104276 · 5 |

### React commits per component (dev build actualDuration, inclusive of children)

Commits: 637; whole-tree commit p50 –ms, p95 –ms, max –ms.

| component | renders | p50 | p95 | max |
|---|---|---|---|---|

### Wheel spins (rAF-driven: one React render of the Wheel per frame)

| from° → to° | ms | frames | worst frame gap |
|---|---|---|---|
| 0 → 0 | 0 | 1 | 0 |
| 24 → 0 | 1220 | 19 | 401 |
| 60 → 0 | 1325 | 16 | 503 |
| -9 → 0 | 1310 | 17 | 409 |
| 63 → 0 | 1340 | 17 | 512 |

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
| css-trans button.card.lt-card[uid] (filter) | 88 | 150 | 150 | 11700 | ease |  |
| css-anim span.tick.num (bump) | 29 | 260 | 420 | 9620 | linear |  |
| css-anim svg.sprite (cult-breathe) | 3 | 3263 | 3736 | 9389 | linear | yes |
| waapi ghost.piece-flight.piece-res.pay.path-drop | 21 | 440 | 500 | 9330 | linear |  |
| waapi span.cs-stack | 39 | 180 | 240 | 7620 | cubic-bezier(.3,1.5,.5,1) |  |
| waapi span.cs-member | 14 | 260 | 973 | 7467 | linear |  |
| css-anim span.lead (cult-gesture) | 13 | 550 | 550 | 7150 | linear |  |
| waapi ghost.flight.card-flight | 7 | 883 | 973 | 5647 | linear |  |
| waapi span.worker | 24 | 180 | 310 | 5460 | linear |  |
| css-trans path.glow (opacity) | 36 | 150 | 150 | 5018 | ease |  |
| css-trans path.edge-lit (opacity) | 36 | 150 | 150 | 5018 | ease |  |
| css-anim g.blink (cult-blink) | 1 | 4700 | 4700 | 4700 | linear | yes |
| css-trans path.wash (filter) | 56 | 120 | 120 | 4588 | ease |  |
| css-anim span.worker-fig (panelland) | 14 | 300 | 300 | 4200 | linear |  |
| css-anim span.lead (cult-scheme) | 7 | 600 | 600 | 4200 | linear |  |
| waapi ghost.worker-flight.minion-flight.home | 12 | 340 | 340 | 4080 | cubic-bezier(.25,.6,.3,1) |  |
| css-anim span.reckon-count (rise) | 16 | 250 | 250 | 4000 | linear |  |
| css-anim span.dots (blink) | 3 | 1200 | 1200 | 3600 | linear | yes |
| css-anim span.worker (land) | 14 | 240 | 240 | 3360 | linear |  |
| css-anim span.tick.dip (bump) | 8 | 420 | 420 | 3360 | linear |  |
| css-anim span.tc-line (tcline) | 11 | 300 | 300 | 3300 | linear |  |
| css-trans button.card.lt-card[uid] (transform) | 28 | 120 | 120 | 3240 | ease |  |
| css-anim span.lead (cult-celebrate) | 4 | 800 | 800 | 3200 | linear |  |
| css-trans button.fb.lt-rate (filter) | 24 | 150 | 150 | 3150 | ease |  |
| css-anim svg.leader (cult-breathe) | 1 | 3100 | 3100 | 3100 | linear | yes |
| waapi ghost.worker-flight.minion-flight.path-arc | 10 | 280 | 280 | 2800 | cubic-bezier(.45,0,.2,1) |  |
| waapi ghost.flight.shop-out | 10 | 260 | 385 | 2725 | cubic-bezier(.5,0,.75,0) |  |
| waapi b.bundle-n | 7 | 440 | 440 | 2716 | linear |  |
| waapi span.cs-stack.zero | 12 | 240 | 240 | 2700 | cubic-bezier(.3,1.45,.5,1) |  |
| css-trans span.base (opacity) | 18 | 150 | 150 | 2700 | ease |  |
| css-trans span.face (opacity) | 18 | 150 | 150 | 2700 | ease |  |

### Waiting

Your turn ends → your next turn painted: p50 9415ms, p95 11294ms, max 11294ms (n 3).
Still moving when your turn came (finite animations running, time left): p50 1033ms, max 1133ms.

### Bot pacing

A bot's state → its move applied: p50 268ms, p95 517ms. Applied → shown on the table: p50 2710ms, p95 4668ms, max 4692ms. Shown → painted p95 336ms. Gap between table steps: p50 608ms, p95 9568ms.
