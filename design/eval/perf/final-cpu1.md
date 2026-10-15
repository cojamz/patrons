# Perf run: final-cpu1

2026-10-15T13:30:10.828Z · local (1 person + 3 Normal bots, normal speed) · CPU 1× · seed 20261015 · think 650ms · 543s wall
Load average before 1.42 / 1.74 / 4.61, after 0.59 / 0.58 / 2.7 (box: 4 CPUs). Vite HMR/reloads during the run: not watched.

## P1: 4 placements (1 in round II)

### Input → next paint (Event Timing; rAF fallback below 16ms)

All: n 38, p50 74ms, p95 513ms, max 576ms

| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |
|---|---|---|---|---|---|---|
| click button | 2 | 80 | 576 | 576 | 6 | 430 |
| pointerdown button | 2 | 51 | 513 | 513 | 5 | – |
| click next-round | 1 | 192 | 192 | 192 | 2 | 106 |
| pointerdown next-round | 1 | 144 | 144 | 144 | 2 | – |
| pointerdown wheel | 2 | 48 | 120 | 120 | 2 | 6 |
| click wheel | 2 | 88 | 120 | 120 | 7 | 0 |
| keydown key:ArrowRight | 2 | 112 | 112 | 112 | 5 | 2 |
| keydown key:ArrowLeft | 4 | 72 | 104 | 104 | 4 | 1 |
| pointerdown option:color | 2 | 74 | 91 | 91 | 1 | – |
| click option:color | 2 | 74 | 91 | 91 | 3 | 16 |
| pointerdown rate | 2 | 66 | 86 | 86 | 8 | – |
| click rate | 2 | 66 | 86 | 86 | 9 | 6 |
| pointerdown pay | 2 | 49 | 80 | 80 | 5 | – |
| click pay | 2 | 49 | 80 | 80 | 6 | 6 |
| pointerdown space | 4 | 42 | 60 | 60 | 2 | 2 |
| click space | 4 | 41 | 59 | 59 | 5 | 8 |
| click shop-card | 1 | 48 | 48 | 48 | 2 | 20 |
| pointerdown shop-card | 1 | 36 | 36 | 36 | 1 | – |

### Click → new state on screen (harness, wall clock)

| click | n | p50 | max | no change in 4s |
|---|---|---|---|---|
| setup | 2 | 169 | 175 | 0 |
| place | 4 | 145 | 185 | 0 |
| followers | 2 | 174 | 197 | 0 |
| pay | 2 | 164 | 171 | 0 |
| recruit | 1 | 213 | 213 | 0 |
| next-round | 1 | 264 | 264 | 0 |

Clicks on a live option that changed nothing (tracer, 1.2s): 0 of 11.

### Hover open delay (pointer over → card in the DOM; content = "You'd get" filled)

| target | n | p50 | p95 | max | content p95 | pointerover handler p95 |
|---|---|---|---|---|---|---|
| space | 37 | 19 | 30 | 33 | 30 | 0 |
| rim | 7 | 26 | 41 | 41 | 41 | 0 |
| shop-card | 15 | 24 | 34 | 34 | 34 | 0 |

Hovers whose card never showed (moved on first, or no card): 19.

### Long animation frames

LoAF: 74 frames ≥50ms, 10 over 100ms, total blocking 1411ms. Long tasks: 42, 3263ms total, max 488ms.

| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |
|---|---|---|---|---|
| 895 | 492 | 441 | 3 | DIV#root.onclick · xf · assets/index-DlAqF-QP.js:55911 · 429 (forced layout 117) |
| 8 | 397 | 0 | 0 | http://127.0.0.1:5369/assets/index-DlAqF-QP.js · ? · assets/index-DlAqF-QP.js:0 · 21 |
| 39675 | 179 | 129 | 36 | MessagePort.onmessage · hn · assets/index-DlAqF-QP.js:29785 · 143 (forced layout 48) |
| 11187 | 159 | 0 | 2 | (no script: style/layout/paint) |
| 56576 | 120 | 0 | 3 | (no script: style/layout/paint) |
| 57636 | 117 | 67 | 4 | DIV#root.onclick · xf · assets/index-DlAqF-QP.js:55911 · 105 (forced layout 46) |
| 275894 | 115 | 0 | 22 | (no script: style/layout/paint) |
| 59197 | 114 | 59 | 12 | MessagePort.onmessage · hn · assets/index-DlAqF-QP.js:29785 · 96 (forced layout 25) |
| 35107 | 110 | 60 | 17 | MessagePort.onmessage · hn · assets/index-DlAqF-QP.js:29785 · 92 (forced layout 15) |
| 12669 | 108 | 50 | 11 | MessagePort.onmessage · hn · assets/index-DlAqF-QP.js:29785 · 88 (forced layout 15)<br>FrameRequestCallback · Ht · assets/CultSeat-CFDJPTDT.js:28183 · 5 (forced layout 2) |

### React commits per component (dev build actualDuration, inclusive of children)

Commits: 664; whole-tree commit p50 –ms, p95 –ms, max –ms.

| component | renders | p50 | p95 | max |
|---|---|---|---|---|

### Wheel spins (rAF-driven: one React render of the Wheel per frame)

| from° → to° | ms | frames | worst frame gap |
|---|---|---|---|
| 0 → 0 | 0 | 1 | 0 |
| 9 → 0 | 1228 | 25 | 430 |
| 63 → 0 | 1253 | 29 | 547 |
| 6 → 0 | 3459 | 50 | 974 |

### Animations and transitions (every one that ran)

| animation | count | duration p50 | max | total ms | easing | loop |
|---|---|---|---|---|---|---|
| css-anim i.cs-min (cs-bob) | 28 | 4612 | 5299 | 126209 | linear | yes |
| css-anim svg.mark (turn) | 1 | 40000 | 40000 | 40000 | linear | yes |
| waapi ghost.piece-flight.piece-res.path-arc | 76 | 363 | 417 | 27874 | cubic-bezier(.45,0,.2,1) |  |
| waapi div.path-inner | 74 | 351 | 500 | 25247 | ease-out |  |
| css-anim svg.sprite (cult-shift) | 6 | 3353 | 3987 | 19861 | linear | yes |
| waapi button.card.lt-card[uid] | 18 | 883 | 1133 | 15951 | linear |  |
| css-trans path.wash (fill) | 104 | 150 | 150 | 15600 | ease |  |
| waapi ghost.piece-flight.piece-fol.path-arc | 44 | 440 | 500 | 15580 | cubic-bezier(.45,0,.2,1) |  |
| waapi ghost.card.lt-card.paper.dim.lt-deal | 17 | 885 | 1113 | 14786 | cubic-bezier(.3,.7,.4,1) |  |
| css-trans button.card.lt-card[uid] (filter) | 88 | 150 | 150 | 13200 | ease |  |
| css-anim svg.sprite (cult-breathe) | 3 | 3263 | 3736 | 9389 | linear | yes |
| css-anim span.tick.num (bump) | 28 | 260 | 420 | 9360 | linear |  |
| waapi ghost.piece-flight.piece-res.pay.path-drop | 21 | 440 | 500 | 9330 | linear |  |
| waapi span.cs-stack | 39 | 180 | 240 | 7620 | cubic-bezier(.3,1.5,.5,1) |  |
| waapi span.cs-member | 14 | 260 | 973 | 7467 | linear |  |
| css-anim span.lead (cult-gesture) | 13 | 550 | 550 | 7150 | linear |  |
| waapi ghost.flight.card-flight | 7 | 883 | 973 | 5647 | linear |  |
| waapi span.worker | 24 | 180 | 310 | 5460 | linear |  |
| css-trans path.glow (opacity) | 36 | 150 | 150 | 5048 | ease |  |
| css-trans path.edge-lit (opacity) | 36 | 150 | 150 | 5048 | ease |  |
| css-anim g.blink (cult-blink) | 1 | 4700 | 4700 | 4700 | linear | yes |
| css-trans path.wash (filter) | 53 | 120 | 120 | 4556 | ease |  |
| css-anim span.worker-fig (panelland) | 14 | 300 | 300 | 4200 | linear |  |
| css-anim span.lead (cult-scheme) | 7 | 600 | 600 | 4200 | linear |  |
| waapi ghost.worker-flight.minion-flight.home | 12 | 340 | 340 | 4080 | cubic-bezier(.25,.6,.3,1) |  |
| css-anim span.reckon-count (rise) | 16 | 250 | 250 | 4000 | linear |  |
| css-anim span.dots (blink) | 3 | 1200 | 1200 | 3600 | linear | yes |
| css-trans button.fb.lt-rate (filter) | 24 | 150 | 150 | 3600 | ease |  |
| css-anim span.worker (land) | 14 | 240 | 240 | 3360 | linear |  |
| css-anim span.tc-line (tcline) | 11 | 300 | 300 | 3300 | linear |  |
| css-trans button.card.lt-card[uid] (transform) | 28 | 120 | 120 | 3240 | ease |  |
| css-anim span.lead (cult-celebrate) | 4 | 800 | 800 | 3200 | linear |  |
| css-anim svg.leader (cult-breathe) | 1 | 3100 | 3100 | 3100 | linear | yes |
| css-anim span.tick.dip (bump) | 7 | 420 | 420 | 2940 | linear |  |
| waapi ghost.worker-flight.minion-flight.path-arc | 10 | 280 | 280 | 2800 | cubic-bezier(.45,0,.2,1) |  |
| waapi ghost.flight.shop-out | 10 | 260 | 385 | 2725 | cubic-bezier(.5,0,.75,0) |  |
| waapi b.bundle-n | 7 | 440 | 440 | 2716 | linear |  |
| waapi span.cs-stack.zero | 12 | 240 | 240 | 2700 | cubic-bezier(.3,1.45,.5,1) |  |
| css-trans span.base (opacity) | 18 | 150 | 150 | 2700 | ease |  |
| css-trans span.face (opacity) | 18 | 150 | 150 | 2700 | ease |  |

### Waiting

Your turn ends → your next turn painted: p50 9503ms, p95 10897ms, max 10897ms (n 3).
Still moving when your turn came (finite animations running, time left): p50 1033ms, max 1133ms.

### Bot pacing

A bot's state → its move applied: p50 256ms, p95 348ms. Applied → shown on the table: p50 2807ms, p95 5236ms, max 5342ms. Shown → painted p95 109ms. Gap between table steps: p50 680ms, p95 9276ms.
