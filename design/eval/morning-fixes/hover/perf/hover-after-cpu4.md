# Perf run: hover-after-cpu4

2026-10-15T16:58:17.508Z · local (1 person + 3 Normal bots, normal speed) · CPU 4× · seed 20261015 · think 650ms · 546s wall
Load average before 2.38 / 2.22 / 3.12, after 8.39 / 4.92 / 3.74 (box: 4 CPUs). Vite HMR/reloads during the run: not watched.

## P1: 4 placements (1 in round II)

### Input → next paint (Event Timing; rAF fallback below 16ms)

All: n 38, p50 130ms, p95 1339ms, max 1360ms

| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |
|---|---|---|---|---|---|---|
| click button | 2 | 224 | 1360 | 1360 | 29 | 1097 |
| pointerdown button | 2 | 209 | 1339 | 1339 | 18 | – |
| click next-round | 1 | 416 | 416 | 416 | 16 | 261 |
| pointerdown next-round | 1 | 360 | 360 | 360 | 10 | – |
| keydown key:ArrowRight | 2 | 152 | 192 | 192 | 38 | 12 |
| pointerdown rate | 2 | 109 | 164 | 164 | 29 | 0 |
| click rate | 2 | 108 | 162 | 162 | 31 | 25 |
| click shop-card | 1 | 155 | 155 | 155 | 10 | 74 |
| pointerdown shop-card | 1 | 155 | 155 | 155 | 4 | – |
| click wheel | 2 | 128 | 152 | 152 | 41 | 1 |
| keydown key:ArrowLeft | 4 | 96 | 144 | 144 | 17 | 3 |
| pointerdown option:color | 2 | 56 | 140 | 140 | 19 | – |
| pointerdown space | 4 | 86 | 138 | 138 | 17 | – |
| click space | 4 | 72 | 138 | 138 | 35 | 35 |
| pointerdown pay | 2 | 90 | 130 | 130 | 17 | – |
| click pay | 2 | 96 | 130 | 130 | 22 | 35 |
| pointerdown wheel | 2 | 96 | 112 | 112 | 15 | 27 |
| click option:color | 2 | 56 | 88 | 88 | 28 | 39 |

### Click → new state on screen (harness, wall clock)

| click | n | p50 | max | no change in 4s |
|---|---|---|---|---|
| setup | 2 | 177 | 742 | 0 |
| place | 4 | 596 | 883 | 0 |
| followers | 2 | 373 | 564 | 0 |
| pay | 2 | 564 | 581 | 0 |
| recruit | 1 | 890 | 890 | 0 |
| next-round | 1 | 475 | 475 | 0 |

Clicks on a live option that changed nothing (tracer, 1.2s): 0 of 11.

### Hover open delay (pointer over → card in the DOM; content = "You'd get" filled)

| target | n | p50 | p95 | max | content p95 | pointerover handler p95 |
|---|---|---|---|---|---|---|
| space | 37 | 54 | 106 | 156 | 106 | 1 |
| rim | 7 | 74 | 108 | 108 | 108 | 0 |
| shop-card | 15 | 60 | 131 | 131 | 131 | 3 |

Hovers whose card never showed (moved on first, or no card): 21.

### Long animation frames

LoAF: 281 frames ≥50ms, 65 over 100ms, total blocking 9195ms. Long tasks: 283, 24560ms total, max 1266ms.

| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |
|---|---|---|---|---|
| 1458 | 1285 | 1232 | 16 | DIV#root.onclick · xf · assets/index-DSpDbARw.js:55911 · 1096 (forced layout 288) |
| 49470 | 607 | 555 | 164 | MessagePort.onmessage · hn · assets/index-DSpDbARw.js:29785 · 441 (forced layout 174) |
| 11 | 452 | 0 | 9 | (no script: style/layout/paint) |
| 46371 | 323 | 206 | 72 | MessagePort.onmessage · hn · assets/index-DSpDbARw.js:29785 · 184 (forced layout 63)<br>TimerHandler:setTimeout · ? · assets/App-gfFveC8S.js:12127 · 44<br>TimerHandler:setTimeout · ? · assets/App-gfFveC8S.js:103219 · 10 |
| 10767 | 321 | 249 | 106 | MessagePort.onmessage · hn · assets/index-DSpDbARw.js:29785 · 193 (forced layout 65)<br>TimerHandler:setTimeout · ? · assets/App-gfFveC8S.js:103219 · 9 |
| 71059 | 309 | 252 | 8 | DIV#root.onclick · xf · assets/index-DSpDbARw.js:55911 · 260 (forced layout 138)<br>PerformanceObserverCallback · ? · assets/index-DSpDbARw.js:21281 · 5 |
| 50307 | 282 | 231 | 61 | MessagePort.onmessage · hn · assets/index-DSpDbARw.js:29785 · 219 (forced layout 85) |
| 48509 | 259 | 183 | 44 | MessagePort.onmessage · hn · assets/index-DSpDbARw.js:29785 · 189 (forced layout 51) |
| 61074 | 257 | 206 | 44 | MessagePort.onmessage · hn · assets/index-DSpDbARw.js:29785 · 212 (forced layout 108)<br>FrameRequestCallback · ? · :-1 · 7 |
| 12797 | 248 | 180 | 44 | MessagePort.onmessage · hn · assets/index-DSpDbARw.js:29785 · 185 (forced layout 67)<br>TimerHandler:setTimeout · ? · assets/App-gfFveC8S.js:103219 · 9 |

### React commits per component (dev build actualDuration, inclusive of children)

Commits: 608; whole-tree commit p50 –ms, p95 –ms, max –ms.

| component | renders | p50 | p95 | max |
|---|---|---|---|---|

### Wheel spins (rAF-driven: one React render of the Wheel per frame)

| from° → to° | ms | frames | worst frame gap |
|---|---|---|---|
| 0 → 0 | 0 | 1 | 0 |
| -28 → 0 | 1294 | 24 | 336 |
| 72 → 0 | 1303 | 22 | 524 |
| -11 → 0 | 1308 | 20 | 495 |
| 59 → 0 | 1299 | 18 | 606 |

### Animations and transitions (every one that ran)

| animation | count | duration p50 | max | total ms | easing | loop |
|---|---|---|---|---|---|---|
| css-anim i.cs-min (cs-bob) | 28 | 4612 | 5299 | 126209 | linear | yes |
| css-anim svg.mark (turn) | 1 | 40000 | 40000 | 40000 | linear | yes |
| waapi ghost.piece-flight.piece-res.path-arc | 76 | 363 | 417 | 27874 | cubic-bezier(.45,0,.2,1) |  |
| waapi div.path-inner | 74 | 351 | 500 | 25247 | ease-out |  |
| css-anim svg.sprite (cult-shift) | 6 | 3353 | 3987 | 19861 | linear | yes |
| waapi button.card.lt-card[uid] | 18 | 883 | 1133 | 15951 | linear |  |
| waapi ghost.piece-flight.piece-fol.path-arc | 44 | 440 | 500 | 15580 | cubic-bezier(.45,0,.2,1) |  |
| css-trans path.wash (fill) | 104 | 150 | 150 | 15450 | ease |  |
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
| css-trans path.glow (opacity) | 36 | 150 | 150 | 5317 | ease |  |
| css-trans path.edge-lit (opacity) | 36 | 150 | 150 | 5317 | ease |  |
| css-trans path.wash (filter) | 53 | 120 | 120 | 4773 | ease |  |
| css-anim g.blink (cult-blink) | 1 | 4700 | 4700 | 4700 | linear | yes |
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

Your turn ends → your next turn painted: p50 9667ms, p95 12161ms, max 12161ms (n 3).
Still moving when your turn came (finite animations running, time left): p50 1033ms, max 1133ms.

### Bot pacing

A bot's state → its move applied: p50 329ms, p95 469ms. Applied → shown on the table: p50 2452ms, p95 4443ms, max 4496ms. Shown → painted p95 428ms. Gap between table steps: p50 658ms, p95 10564ms.
