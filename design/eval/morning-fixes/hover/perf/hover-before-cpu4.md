# Perf run: hover-before-cpu4

2026-10-15T15:01:27.845Z · local (1 person + 3 Normal bots, normal speed) · CPU 4× · seed 20261015 · think 650ms · 551s wall
Load average before 2.22 / 1.13 / 0.48, after 5.88 / 5.05 / 2.84 (box: 4 CPUs). Vite HMR/reloads during the run: not watched.

## P1: 4 placements (1 in round II)

### Input → next paint (Event Timing; rAF fallback below 16ms)

All: n 38, p50 144ms, p95 1704ms, max 1704ms

| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |
|---|---|---|---|---|---|---|
| pointerdown button | 2 | 360 | 1704 | 1704 | 47 | 10 |
| click button | 2 | 360 | 1704 | 1704 | 89 | 1226 |
| pointerdown next-round | 1 | 560 | 560 | 560 | 5 | 0 |
| click next-round | 1 | 552 | 552 | 552 | 6 | 338 |
| pointerdown shop-card | 1 | 214 | 214 | 214 | 14 | – |
| pointerdown option:color | 2 | 122 | 214 | 214 | 12 | – |
| click option:color | 2 | 121 | 214 | 214 | 29 | 45 |
| click shop-card | 1 | 214 | 214 | 214 | 16 | 103 |
| pointerdown pay | 2 | 183 | 203 | 203 | 17 | – |
| click pay | 2 | 183 | 203 | 203 | 28 | 26 |
| click wheel | 2 | 160 | 200 | 200 | 36 | 0 |
| keydown key:ArrowRight | 2 | 144 | 192 | 192 | 33 | 10 |
| pointerdown rate | 2 | 133 | 161 | 161 | 19 | – |
| click rate | 2 | 132 | 161 | 161 | 24 | 18 |
| keydown key:ArrowLeft | 4 | 96 | 120 | 120 | 7 | 4 |
| pointerdown space | 4 | 72 | 102 | 102 | 46 | 12 |
| click space | 4 | 72 | 98 | 98 | 63 | 43 |
| pointerdown wheel | 2 | 80 | 88 | 88 | 10 | 17 |

### Click → new state on screen (harness, wall clock)

| click | n | p50 | max | no change in 4s |
|---|---|---|---|---|
| setup | 2 | 508 | 636 | 0 |
| place | 4 | 624 | 733 | 0 |
| followers | 2 | 300 | 344 | 0 |
| pay | 2 | 527 | 536 | 0 |
| recruit | 1 | 1155 | 1155 | 0 |
| next-round | 1 | 520 | 520 | 0 |

Clicks on a live option that changed nothing (tracer, 1.2s): 0 of 11.

### Hover open delay (pointer over → card in the DOM; content = "You'd get" filled)

| target | n | p50 | p95 | max | content p95 | pointerover handler p95 |
|---|---|---|---|---|---|---|
| space | 37 | 62 | 117 | 124 | 117 | 1 |
| rim | 7 | 91 | 157 | 157 | 157 | 1 |
| shop-card | 15 | 49 | 99 | 99 | 99 | 0 |

Hovers whose card never showed (moved on first, or no card): 21.

### Long animation frames

LoAF: 253 frames ≥50ms, 90 over 100ms, total blocking 13594ms. Long tasks: 284, 28927ms total, max 1541ms.

| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |
|---|---|---|---|---|
| 3559 | 1595 | 1541 | 50 | DIV#root.onclick · xf · assets/index-ByMJI7Me.js:55911 · 1224 (forced layout 334)<br>FrameRequestCallback · w · assets/index-ByMJI7Me.js:22787 · 8<br>ResizeObserverCallback · ? · assets/CultSeat-Bvk80Xz3.js:90409 · 5 |
| 691 | 699 | 18 | 14 | http://127.0.0.1:5291/?trace=1&intro=0 · ? · /:0 · 13 |
| 53878 | 485 | 433 | 118 | MessagePort.onmessage · hn · assets/index-ByMJI7Me.js:29785 · 365 (forced layout 170) |
| 11319 | 443 | 382 | 34 | MessagePort.onmessage · hn · assets/index-ByMJI7Me.js:29785 · 397 (forced layout 135) |
| 15959 | 406 | 324 | 60 | MessagePort.onmessage · hn · assets/index-ByMJI7Me.js:29785 · 313 (forced layout 85)<br>FrameRequestCallback · Ht · assets/CultSeat-Bvk80Xz3.js:28183 · 26 (forced layout 12)<br>TimerHandler:setTimeout · ? · assets/App-yf4f60Ux.js:103219 · 15 |
| 78549 | 396 | 309 | 53 | MessagePort.onmessage · hn · assets/index-ByMJI7Me.js:29785 · 305 (forced layout 103)<br>TimerHandler:setTimeout · ? · assets/App-yf4f60Ux.js:103219 · 17 |
| 76202 | 383 | 331 | 15 | DIV#root.onclick · xf · assets/index-ByMJI7Me.js:55911 · 336 (forced layout 165) |
| 18197 | 380 | 294 | 46 | MessagePort.onmessage · hn · assets/index-ByMJI7Me.js:29785 · 298 (forced layout 88)<br>TimerHandler:setTimeout · ? · assets/App-yf4f60Ux.js:103219 · 19 (forced layout 1) |
| 1405 | 369 | 274 | 54 | http://127.0.0.1:5291/assets/index-ByMJI7Me.js · ? · assets/index-ByMJI7Me.js:0 · 225 |
| 2308 | 342 | 275 | 154 | MessagePort.onmessage · hn · assets/index-ByMJI7Me.js:29785 · 170 |

### React commits per component (dev build actualDuration, inclusive of children)

Commits: 634; whole-tree commit p50 –ms, p95 –ms, max –ms.

| component | renders | p50 | p95 | max |
|---|---|---|---|---|

### Wheel spins (rAF-driven: one React render of the Wheel per frame)

| from° → to° | ms | frames | worst frame gap |
|---|---|---|---|
| 0 → 0 | 0 | 1 | 0 |
| -18 → 0 | 1319 | 21 | 385 |
| 66 → 0 | 1391 | 21 | 540 |
| -24 → 0 | 1337 | 20 | 314 |
| 54 → 0 | 1354 | 15 | 399 |

### Animations and transitions (every one that ran)

| animation | count | duration p50 | max | total ms | easing | loop |
|---|---|---|---|---|---|---|
| css-anim i.cs-min (cs-bob) | 28 | 4612 | 5299 | 126209 | linear | yes |
| css-anim svg.mark (turn) | 1 | 40000 | 40000 | 40000 | linear | yes |
| waapi ghost.piece-flight.piece-res.path-arc | 76 | 363 | 417 | 27868 | cubic-bezier(.45,0,.2,1) |  |
| waapi div.path-inner | 74 | 351 | 500 | 25244 | ease-out |  |
| css-anim svg.sprite (cult-shift) | 6 | 3353 | 3987 | 19861 | linear | yes |
| waapi button.card.lt-card[uid] | 18 | 883 | 1133 | 15951 | linear |  |
| waapi ghost.piece-flight.piece-fol.path-arc | 44 | 440 | 500 | 15580 | cubic-bezier(.45,0,.2,1) |  |
| waapi ghost.card.lt-card.paper.dim.lt-deal | 17 | 885 | 1113 | 14786 | cubic-bezier(.3,.7,.4,1) |  |
| css-trans path.wash (fill) | 104 | 150 | 150 | 13050 | ease |  |
| css-trans button.card.lt-card[uid] (filter) | 88 | 150 | 150 | 10200 | ease |  |
| css-anim span.tick.num (bump) | 29 | 260 | 420 | 9620 | linear |  |
| css-anim svg.sprite (cult-breathe) | 3 | 3263 | 3736 | 9389 | linear | yes |
| waapi ghost.piece-flight.piece-res.pay.path-drop | 21 | 440 | 500 | 9330 | linear |  |
| waapi span.cs-stack | 39 | 180 | 240 | 7620 | cubic-bezier(.3,1.5,.5,1) |  |
| waapi span.cs-member | 14 | 260 | 973 | 7467 | linear |  |
| css-anim span.lead (cult-gesture) | 13 | 550 | 550 | 7150 | linear |  |
| waapi ghost.flight.card-flight | 7 | 883 | 973 | 5647 | linear |  |
| waapi span.worker | 24 | 180 | 310 | 5460 | linear |  |
| css-trans path.glow (opacity) | 36 | 150 | 150 | 4839 | ease |  |
| css-trans path.edge-lit (opacity) | 36 | 150 | 150 | 4839 | ease |  |
| css-anim g.blink (cult-blink) | 1 | 4700 | 4700 | 4700 | linear | yes |
| css-anim span.worker-fig (panelland) | 14 | 300 | 300 | 4200 | linear |  |
| css-anim span.lead (cult-scheme) | 7 | 600 | 600 | 4200 | linear |  |
| css-trans path.wash (filter) | 55 | 120 | 120 | 4138 | ease |  |
| waapi ghost.worker-flight.minion-flight.home | 12 | 340 | 340 | 4080 | cubic-bezier(.25,.6,.3,1) |  |
| css-anim span.reckon-count (rise) | 16 | 250 | 250 | 4000 | linear |  |
| css-anim span.dots (blink) | 3 | 1200 | 1200 | 3600 | linear | yes |
| css-anim span.worker (land) | 14 | 240 | 240 | 3360 | linear |  |
| css-anim span.tick.dip (bump) | 8 | 420 | 420 | 3360 | linear |  |
| css-trans button.card.lt-card[uid] (transform) | 28 | 120 | 120 | 3240 | ease |  |
| css-anim span.lead (cult-celebrate) | 4 | 800 | 800 | 3200 | linear |  |
| css-anim svg.leader (cult-breathe) | 1 | 3100 | 3100 | 3100 | linear | yes |
| css-anim span.tc-line (tcline) | 11 | 300 | 300 | 3000 | linear |  |
| waapi ghost.worker-flight.minion-flight.path-arc | 10 | 280 | 280 | 2800 | cubic-bezier(.45,0,.2,1) |  |
| waapi ghost.flight.shop-out | 10 | 260 | 385 | 2725 | cubic-bezier(.5,0,.75,0) |  |
| waapi b.bundle-n | 7 | 440 | 440 | 2716 | linear |  |
| waapi span.cs-stack.zero | 12 | 240 | 240 | 2700 | cubic-bezier(.3,1.45,.5,1) |  |
| css-trans button.fb.lt-rate (filter) | 24 | 150 | 150 | 2700 |  |  |
| css-trans span.base (opacity) | 18 | 150 | 150 | 2700 | ease |  |
| css-trans span.face (opacity) | 18 | 150 | 150 | 2700 | ease |  |

### Waiting

Your turn ends → your next turn painted: p50 10481ms, p95 12702ms, max 12702ms (n 3).
Still moving when your turn came (finite animations running, time left): p50 1033ms, max 1133ms.

### Bot pacing

A bot's state → its move applied: p50 318ms, p95 740ms. Applied → shown on the table: p50 2656ms, p95 4502ms, max 4514ms. Shown → painted p95 495ms. Gap between table steps: p50 666ms, p95 10778ms.
