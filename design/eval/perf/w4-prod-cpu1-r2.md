# Perf run: w4-prod-cpu1-r2

2026-10-15T12:13:38.146Z · local (1 person + 3 Normal bots, normal speed) · CPU 1× · seed 20261015 · think 650ms · 542s wall
Load average before 2.12 / 1.82 / 2.54, after 1 / 1.16 / 1.87 (box: 4 CPUs). Vite HMR/reloads during the run: not watched.

## P1: 4 placements (1 in round II)

### Input → next paint (Event Timing; rAF fallback below 16ms)

All: n 38, p50 104ms, p95 276ms, max 344ms

| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |
|---|---|---|---|---|---|---|
| click button | 2 | 48 | 344 | 344 | 3 | 201 |
| pointerdown button | 2 | 28 | 276 | 276 | 2 | – |
| click rate | 2 | 232 | 264 | 264 | 5 | 3 |
| pointerdown wheel | 2 | 184 | 240 | 240 | 1 | 2 |
| click pay | 2 | 208 | 224 | 224 | 3 | 6 |
| keydown key:ArrowRight | 2 | 192 | 216 | 216 | 3 | 5 |
| pointerdown next-round | 1 | 216 | 216 | 216 | 1 | 0 |
| click next-round | 1 | 216 | 216 | 216 | 1 | 107 |
| click wheel | 2 | 176 | 192 | 192 | 5 | 0 |
| click option:color | 2 | 104 | 184 | 184 | 2 | 7 |
| keydown key:ArrowLeft | 4 | 128 | 176 | 176 | 1 | 1 |
| pointerdown pay | 2 | 88 | 110 | 110 | 1 | – |
| pointerdown rate | 2 | 82 | 92 | 92 | 4 | – |
| pointerdown space | 4 | 83 | 92 | 92 | 2 | 1 |
| click space | 4 | 83 | 91 | 91 | 4 | 6 |
| pointerdown option:color | 2 | 48 | 82 | 82 | 1 | – |
| click shop-card | 1 | 80 | 80 | 80 | 1 | 11 |
| pointerdown shop-card | 1 | 40 | 40 | 40 | 1 | – |

### Click → new state on screen (harness, wall clock)

| click | n | p50 | max | no change in 4s |
|---|---|---|---|---|
| setup | 2 | 145 | 381 | 0 |
| place | 4 | 244 | 268 | 0 |
| followers | 2 | 315 | 340 | 0 |
| pay | 2 | 327 | 419 | 0 |
| recruit | 1 | 135 | 135 | 0 |
| next-round | 1 | 179 | 179 | 0 |

Clicks on a live option that changed nothing (tracer, 1.2s): 0 of 11.

### Hover open delay (pointer over → card in the DOM; content = "You'd get" filled)

| target | n | p50 | p95 | max | content p95 | pointerover handler p95 |
|---|---|---|---|---|---|---|
| space | 38 | 50 | 77 | 81 | 77 | 0 |
| shop-card | 15 | 58 | 78 | 78 | 78 | 1 |
| tip | 2 | 138 | 141 | 141 | 141 | 0 |
| rim | 4 | 50 | 87 | 87 | 87 | 0 |

Hovers whose card never showed (moved on first, or no card): 12.

### Long animation frames

LoAF: 2668 frames ≥50ms, 87 over 100ms, total blocking 78ms. Long tasks: 9, 844ms total, max 226ms.

| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |
|---|---|---|---|---|
| 340172 | 279 | 0 | 3 | (no script: style/layout/paint) |
| 67668 | 248 | 0 | 0 | (no script: style/layout/paint) |
| 50325 | 181 | 0 | 8 | (no script: style/layout/paint) |
| 189668 | 170 | 0 | 2 | (no script: style/layout/paint) |
| 365263 | 151 | 0 | 1 | (no script: style/layout/paint) |
| 530804 | 143 | 0 | 2 | (no script: style/layout/paint) |
| 88156 | 142 | 0 | 1 | (no script: style/layout/paint) |
| 183069 | 141 | 0 | 1 | (no script: style/layout/paint) |
| 186430 | 140 | 0 | 1 | (no script: style/layout/paint) |
| 241877 | 140 | 0 | 1 | (no script: style/layout/paint) |

### React commits per component (dev build actualDuration, inclusive of children)

Commits: 656; whole-tree commit p50 –ms, p95 –ms, max –ms.

| component | renders | p50 | p95 | max |
|---|---|---|---|---|

### Wheel spins (rAF-driven: one React render of the Wheel per frame)

| from° → to° | ms | frames | worst frame gap |
|---|---|---|---|
| 0 → 0 | 0 | 1 | 0 |
| 46 → 0 | 1138 | 18 | 409 |
| 73 → 0 | 1214 | 15 | 560 |
| 29 → 0 | 1135 | 18 | 453 |
| 73 → 0 | 1272 | 16 | 558 |

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
| css-anim svg.sprite (cult-breathe) | 3 | 3263 | 3736 | 9389 | linear | yes |
| css-anim span.tick.num (bump) | 28 | 260 | 420 | 9360 | linear |  |
| waapi ghost.piece-flight.piece-res.pay.path-drop | 21 | 440 | 500 | 9330 | linear |  |
| waapi span.cs-stack | 39 | 180 | 240 | 7620 | cubic-bezier(.3,1.5,.5,1) |  |
| waapi span.cs-member | 14 | 260 | 973 | 7467 | linear |  |
| css-anim span.lead (cult-gesture) | 13 | 550 | 550 | 7150 | linear |  |
| waapi ghost.flight.card-flight | 7 | 883 | 973 | 5647 | linear |  |
| waapi span.worker | 24 | 180 | 310 | 5460 | linear |  |
| css-trans path.glow (opacity) | 38 | 150 | 150 | 5336 | ease |  |
| css-trans path.edge-lit (opacity) | 38 | 150 | 150 | 5336 | ease |  |
| css-trans path.wash (filter) | 56 | 120 | 120 | 4729 | ease |  |
| css-anim g.blink (cult-blink) | 1 | 4700 | 4700 | 4700 | linear | yes |
| css-anim span.worker-fig (panelland) | 14 | 300 | 300 | 4200 | linear |  |
| css-anim span.lead (cult-scheme) | 7 | 600 | 600 | 4200 | linear |  |
| waapi ghost.worker-flight.minion-flight.home | 12 | 340 | 340 | 4080 | cubic-bezier(.25,.6,.3,1) |  |
| css-anim span.reckon-count (rise) | 16 | 250 | 250 | 4000 | linear |  |
| css-anim span.dots (blink) | 3 | 1200 | 1200 | 3600 | linear | yes |
| css-trans button.fb.lt-rate (filter) | 24 | 150 | 150 | 3600 | ease |  |
| css-anim span.worker (land) | 14 | 240 | 240 | 3360 | linear |  |
| css-trans button.card.lt-card[uid] (transform) | 28 | 120 | 120 | 3240 | ease |  |
| css-anim span.lead (cult-celebrate) | 4 | 800 | 800 | 3200 | linear |  |
| css-anim svg.leader (cult-breathe) | 1 | 3100 | 3100 | 3100 | linear | yes |
| css-anim span.tc-line (tcline) | 10 | 300 | 300 | 3000 | linear |  |
| css-anim span.tick.dip (bump) | 7 | 420 | 420 | 2940 | linear |  |
| waapi ghost.worker-flight.minion-flight.path-arc | 10 | 280 | 280 | 2800 | cubic-bezier(.45,0,.2,1) |  |
| waapi ghost.flight.shop-out | 10 | 260 | 385 | 2725 | cubic-bezier(.5,0,.75,0) |  |
| waapi b.bundle-n | 7 | 440 | 440 | 2716 | linear |  |
| waapi span.cs-stack.zero | 12 | 240 | 240 | 2700 | cubic-bezier(.3,1.45,.5,1) |  |
| css-trans span.base (opacity) | 18 | 150 | 150 | 2700 | ease |  |
| css-trans span.face (opacity) | 18 | 150 | 150 | 2700 | ease |  |

### Waiting

Your turn ends → your next turn painted: p50 8873ms, p95 9990ms, max 9990ms (n 3).
Still moving when your turn came (finite animations running, time left): p50 1033ms, max 1133ms.

### Bot pacing

A bot's state → its move applied: p50 254ms, p95 297ms. Applied → shown on the table: p50 2622ms, p95 4655ms, max 4753ms. Shown → painted p95 80ms. Gap between table steps: p50 665ms, p95 8891ms.
