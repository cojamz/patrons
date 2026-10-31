# Perf run: w3-prod-cpu1-r2

2026-10-15T09:37:37.473Z · local (1 person + 3 Normal bots, normal speed) · CPU 1× · seed 20261015 · think 650ms · 543s wall
Load average before 2.34 / 2.07 / 2.19, after 1.16 / 1.38 / 1.76 (box: 4 CPUs). Vite HMR/reloads during the run: not watched.

## P1: 4 placements (1 in round II)

### Input → next paint (Event Timing; rAF fallback below 16ms)

All: n 38, p50 216ms, p95 418ms, max 472ms

| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |
|---|---|---|---|---|---|---|
| click button | 2 | 56 | 472 | 472 | 5 | 300 |
| pointerdown button | 2 | 34 | 418 | 418 | 4 | – |
| pointerdown pay | 2 | 272 | 408 | 408 | 3 | 0 |
| click pay | 2 | 272 | 408 | 408 | 4 | 7 |
| pointerdown wheel | 2 | 360 | 392 | 392 | 1 | 3 |
| keydown key:ArrowLeft | 4 | 256 | 368 | 368 | 8 | 1 |
| click wheel | 2 | 216 | 360 | 360 | 6 | 0 |
| click option:color | 2 | 56 | 336 | 336 | 4 | 10 |
| click rate | 2 | 320 | 336 | 336 | 48 | 8 |
| keydown key:ArrowRight | 2 | 296 | 328 | 328 | 2 | 2 |
| pointerdown next-round | 1 | 312 | 312 | 312 | 1 | 0 |
| click next-round | 1 | 312 | 312 | 312 | 2 | 150 |
| click shop-card | 1 | 152 | 152 | 152 | 4 | 13 |
| pointerdown rate | 2 | 135 | 146 | 146 | 10 | – |
| click space | 4 | 104 | 129 | 129 | 5 | 5 |
| pointerdown space | 4 | 104 | 129 | 129 | 2 | – |
| pointerdown option:color | 2 | 56 | 117 | 117 | 2 | – |
| pointerdown shop-card | 1 | 103 | 103 | 103 | 4 | – |

### Click → new state on screen (harness, wall clock)

| click | n | p50 | max | no change in 4s |
|---|---|---|---|---|
| setup | 2 | 174 | 517 | 0 |
| place | 4 | 385 | 507 | 0 |
| followers | 2 | 433 | 576 | 0 |
| pay | 2 | 407 | 516 | 0 |
| recruit | 1 | 302 | 302 | 0 |
| next-round | 1 | 443 | 443 | 0 |

Clicks on a live option that changed nothing (tracer, 1.2s): 0 of 11.

### Hover open delay (pointer over → card in the DOM; content = "You'd get" filled)

| target | n | p50 | p95 | max | content p95 | pointerover handler p95 |
|---|---|---|---|---|---|---|
| space | 36 | 75 | 172 | 212 | 212 | 0 |
| rim | 5 | 119 | 154 | 154 | 154 | 0 |
| shop-card | 15 | 98 | 158 | 158 | 158 | 0 |
| tip | 2 | 165 | 215 | 215 | 215 | 0 |

Hovers whose card never showed (moved on first, or no card): 12.

### Long animation frames

LoAF: 2640 frames ≥50ms, 387 over 100ms, total blocking 26ms. Long tasks: 137, 11045ms total, max 381ms.

| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |
|---|---|---|---|---|
| 304450 | 291 | 0 | 2 | (no script: style/layout/paint) |
| 469104 | 214 | 0 | 1 | (no script: style/layout/paint) |
| 224604 | 210 | 0 | 1 | (no script: style/layout/paint) |
| 397474 | 203 | 0 | 1 | (no script: style/layout/paint) |
| 252078 | 202 | 0 | 2 | (no script: style/layout/paint) |
| 530760 | 200 | 0 | 28 | (no script: style/layout/paint) |
| 198365 | 195 | 0 | 3 | (no script: style/layout/paint) |
| 424784 | 195 | 0 | 34 | (no script: style/layout/paint) |
| 537265 | 195 | 0 | 23 | (no script: style/layout/paint) |
| 407829 | 194 | 0 | 25 | (no script: style/layout/paint) |

### React commits per component (dev build actualDuration, inclusive of children)

Commits: 671; whole-tree commit p50 –ms, p95 –ms, max –ms.

| component | renders | p50 | p95 | max |
|---|---|---|---|---|

### Wheel spins (rAF-driven: one React render of the Wheel per frame)

| from° → to° | ms | frames | worst frame gap |
|---|---|---|---|
| 0 → 0 | 0 | 1 | 0 |
| 41 → 0 | 4184 | 38 | 581 |
| 49 → 0 | 4022 | 35 | 533 |

### Animations and transitions (every one that ran)

| animation | count | duration p50 | max | total ms | easing | loop |
|---|---|---|---|---|---|---|
| css-anim i.cs-min (cs-bob) | 28 | 4612 | 5299 | 126209 | linear | yes |
| css-anim svg.mark (turn) | 1 | 40000 | 40000 | 40000 | linear | yes |
| waapi ghost.piece-flight.piece-res.path-arc | 76 | 377 | 417 | 27996 | cubic-bezier(.45,0,.2,1) |  |
| waapi div.path-inner | 74 | 367 | 500 | 25306 | ease-out |  |
| css-anim svg.sprite (cult-shift) | 6 | 3353 | 3987 | 19861 | linear | yes |
| waapi ghost.piece-flight.piece-fol.path-arc | 44 | 439 | 500 | 15576 | cubic-bezier(.45,0,.2,1) |  |
| css-trans button.card.lt-card[uid] (filter) | 92 | 150 | 150 | 13649 | ease |  |
| waapi button.card.lt-card[uid] | 18 | 600 | 1133 | 12101 | linear |  |
| css-trans path.wash (fill) | 104 | 150 | 150 | 11400 | ease |  |
| waapi ghost.card.lt-card.paper.dim.lt-deal | 17 | 620 | 1113 | 11321 | cubic-bezier(.3,.7,.4,1) |  |
| css-anim g.blink (cult-blink) | 2 | 4700 | 4700 | 9400 | linear | yes |
| css-anim svg.sprite (cult-breathe) | 3 | 3263 | 3736 | 9389 | linear | yes |
| waapi ghost.piece-flight.piece-res.pay.path-drop | 21 | 440 | 500 | 9330 | linear |  |
| css-anim span.tick.num (bump) | 28 | 260 | 420 | 9200 | linear |  |
| waapi span.cs-stack | 39 | 180 | 240 | 7620 | cubic-bezier(.3,1.5,.5,1) |  |
| waapi span.cs-member | 14 | 260 | 973 | 7467 | linear |  |
| css-anim span.lead (cult-gesture) | 13 | 550 | 550 | 7150 | linear |  |
| waapi ghost.flight.card-flight | 7 | 883 | 973 | 5647 | linear |  |
| waapi span.worker | 24 | 180 | 310 | 5460 | linear |  |
| css-trans path.glow (opacity) | 35 | 150 | 150 | 4589 | ease |  |
| css-trans path.edge-lit (opacity) | 35 | 150 | 150 | 4589 | ease |  |
| css-anim span.worker-fig (panelland) | 14 | 300 | 300 | 4200 | linear |  |
| css-anim span.lead (cult-scheme) | 7 | 600 | 600 | 4200 | linear |  |
| css-trans path.wash (filter) | 56 | 120 | 120 | 4178 | ease |  |
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
| waapi b.bundle-n | 7 | 440 | 440 | 2716 | linear |  |
| waapi span.cs-stack.zero | 12 | 240 | 240 | 2700 | cubic-bezier(.3,1.45,.5,1) |  |
| css-trans span.base (opacity) | 18 | 150 | 150 | 2700 | ease |  |
| css-trans span.face (opacity) | 18 | 150 | 150 | 2700 | ease |  |
| waapi ghost.token-flight.reckon | 6 | 320 | 405 | 2036 | cubic-bezier(.25,.6,.3,1) |  |

### Waiting

Your turn ends → your next turn painted: p50 7756ms, p95 10917ms, max 10917ms (n 3).
Still moving when your turn came (finite animations running, time left): p50 1033ms, max 1133ms.

### Bot pacing

A bot's state → its move applied: p50 255ms, p95 433ms. Applied → shown on the table: p50 1571ms, p95 4139ms, max 4406ms. Shown → painted p95 228ms. Gap between table steps: p50 598ms, p95 9434ms.
