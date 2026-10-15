# Perf run: w3-prod-cpu1-r1

2026-10-15T09:19:26.203Z · local (1 person + 3 Normal bots, normal speed) · CPU 1× · seed 20261015 · think 650ms · 543s wall
Load average before 2.52 / 2.2 / 2.95, after 1.27 / 1.38 / 2.17 (box: 4 CPUs). Vite HMR/reloads during the run: not watched.

## P1: 4 placements (1 in round II)

### Input → next paint (Event Timing; rAF fallback below 16ms)

All: n 38, p50 152ms, p95 648ms, max 648ms

| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |
|---|---|---|---|---|---|---|
| pointerdown button | 2 | 57 | 648 | 648 | 4 | – |
| click button | 2 | 80 | 648 | 648 | 7 | 411 |
| click wheel | 2 | 304 | 480 | 480 | 23 | 0 |
| pointerdown wheel | 2 | 376 | 384 | 384 | 2 | 3 |
| keydown key:ArrowLeft | 4 | 272 | 360 | 360 | 32 | 1 |
| click next-round | 1 | 344 | 344 | 344 | 2 | 164 |
| click rate | 2 | 232 | 296 | 296 | 26 | 4 |
| click pay | 2 | 288 | 296 | 296 | 3 | 6 |
| keydown key:ArrowRight | 2 | 240 | 288 | 288 | 4 | 2 |
| click option:color | 2 | 86 | 272 | 272 | 3 | 8 |
| pointerdown next-round | 1 | 194 | 194 | 194 | 1 | – |
| click shop-card | 1 | 152 | 152 | 152 | 2 | 13 |
| pointerdown space | 4 | 106 | 142 | 142 | 3 | – |
| click space | 4 | 106 | 142 | 142 | 5 | 5 |
| pointerdown rate | 2 | 105 | 141 | 141 | 8 | – |
| pointerdown pay | 2 | 122 | 140 | 140 | 2 | – |
| pointerdown option:color | 2 | 86 | 124 | 124 | 2 | – |
| pointerdown shop-card | 1 | 45 | 45 | 45 | 1 | – |

### Click → new state on screen (harness, wall clock)

| click | n | p50 | max | no change in 4s |
|---|---|---|---|---|
| setup | 2 | 239 | 516 | 0 |
| place | 4 | 419 | 549 | 0 |
| followers | 2 | 384 | 500 | 0 |
| pay | 2 | 430 | 635 | 0 |
| recruit | 1 | 305 | 305 | 0 |
| next-round | 1 | 618 | 618 | 0 |

Clicks on a live option that changed nothing (tracer, 1.2s): 0 of 11.

### Hover open delay (pointer over → card in the DOM; content = "You'd get" filled)

| target | n | p50 | p95 | max | content p95 | pointerover handler p95 |
|---|---|---|---|---|---|---|
| space | 36 | 77 | 159 | 162 | 162 | 0 |
| rim | 5 | 115 | 140 | 140 | 140 | 0 |
| shop-card | 15 | 113 | 165 | 165 | 165 | 0 |
| tip | 1 | 179 | 179 | 179 | 179 | 0 |

Hovers whose card never showed (moved on first, or no card): 14.

### Long animation frames

LoAF: 2591 frames ≥50ms, 530 over 100ms, total blocking 4ms. Long tasks: 141, 11500ms total, max 447ms.

| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |
|---|---|---|---|---|
| 203688 | 233 | 0 | 39 | (no script: style/layout/paint) |
| 240113 | 229 | 0 | 2 | (no script: style/layout/paint) |
| 450360 | 218 | 0 | 22 | (no script: style/layout/paint) |
| 237190 | 215 | 0 | 22 | (no script: style/layout/paint) |
| 369355 | 213 | 0 | 22 | (no script: style/layout/paint) |
| 387360 | 213 | 0 | 20 | (no script: style/layout/paint) |
| 324695 | 210 | 0 | 27 | (no script: style/layout/paint) |
| 465191 | 210 | 0 | 29 | (no script: style/layout/paint) |
| 241041 | 206 | 0 | 1 | (no script: style/layout/paint) |
| 534796 | 205 | 0 | 22 | (no script: style/layout/paint) |

### React commits per component (dev build actualDuration, inclusive of children)

Commits: 668; whole-tree commit p50 –ms, p95 –ms, max –ms.

| component | renders | p50 | p95 | max |
|---|---|---|---|---|

### Wheel spins (rAF-driven: one React render of the Wheel per frame)

| from° → to° | ms | frames | worst frame gap |
|---|---|---|---|
| 0 → 0 | 0 | 1 | 0 |
| 46 → 0 | 4226 | 36 | 581 |
| 25 → 0 | 4064 | 33 | 555 |

### Animations and transitions (every one that ran)

| animation | count | duration p50 | max | total ms | easing | loop |
|---|---|---|---|---|---|---|
| css-anim i.cs-min (cs-bob) | 28 | 4612 | 5299 | 126209 | linear | yes |
| css-anim svg.mark (turn) | 1 | 40000 | 40000 | 40000 | linear | yes |
| waapi ghost.piece-flight.piece-res.path-arc | 76 | 377 | 417 | 28038 | cubic-bezier(.45,0,.2,1) |  |
| waapi div.path-inner | 74 | 367 | 500 | 25327 | ease-out |  |
| css-anim svg.sprite (cult-shift) | 6 | 3353 | 3987 | 19861 | linear | yes |
| waapi ghost.piece-flight.piece-fol.path-arc | 44 | 439 | 500 | 15576 | cubic-bezier(.45,0,.2,1) |  |
| css-trans path.wash (fill) | 104 | 150 | 150 | 14100 | ease |  |
| waapi button.card.lt-card[uid] | 18 | 600 | 1133 | 12101 | linear |  |
| css-trans button.card.lt-card[uid] (filter) | 92 | 150 | 150 | 11978 | ease |  |
| waapi ghost.card.lt-card.paper.dim.lt-deal | 17 | 620 | 1113 | 11321 | cubic-bezier(.3,.7,.4,1) |  |
| css-anim g.blink (cult-blink) | 2 | 4700 | 4700 | 9400 | linear | yes |
| css-anim svg.sprite (cult-breathe) | 3 | 3263 | 3736 | 9389 | linear | yes |
| css-anim span.tick.num (bump) | 28 | 260 | 420 | 9360 | linear |  |
| waapi ghost.piece-flight.piece-res.pay.path-drop | 21 | 440 | 500 | 9330 | linear |  |
| waapi span.cs-stack | 39 | 180 | 240 | 7620 | cubic-bezier(.3,1.5,.5,1) |  |
| waapi span.cs-member | 14 | 260 | 973 | 7467 | linear |  |
| css-anim span.lead (cult-gesture) | 13 | 550 | 550 | 7150 | linear |  |
| waapi ghost.flight.card-flight | 7 | 883 | 973 | 5647 | linear |  |
| waapi span.worker | 24 | 180 | 310 | 5460 | linear |  |
| css-anim span.worker-fig (panelland) | 14 | 300 | 300 | 4200 | linear |  |
| css-anim span.lead (cult-scheme) | 7 | 600 | 600 | 4200 | linear |  |
| css-trans path.glow (opacity) | 32 | 150 | 150 | 4200 |  |  |
| css-trans path.edge-lit (opacity) | 32 | 150 | 150 | 4200 |  |  |
| waapi ghost.worker-flight.minion-flight.home | 12 | 340 | 340 | 4080 | cubic-bezier(.25,.6,.3,1) |  |
| css-anim span.reckon-count (rise) | 16 | 250 | 250 | 4000 | linear |  |
| css-trans path.wash (filter) | 56 | 120 | 120 | 3960 | ease |  |
| css-anim span.dots (blink) | 3 | 1200 | 1200 | 3600 | linear | yes |
| css-anim span.worker (land) | 14 | 240 | 240 | 3360 | linear |  |
| css-trans button.card.lt-card[uid] (transform) | 28 | 120 | 120 | 3240 | ease |  |
| css-anim span.lead (cult-celebrate) | 4 | 800 | 800 | 3200 | linear |  |
| css-anim svg.leader (cult-breathe) | 1 | 3100 | 3100 | 3100 | linear | yes |
| css-anim span.tc-line (tcline) | 10 | 300 | 300 | 3000 | linear |  |
| css-trans button.fb.lt-rate (filter) | 24 | 150 | 150 | 3000 | ease |  |
| css-anim span.tick.dip (bump) | 7 | 420 | 420 | 2940 | linear |  |
| waapi ghost.worker-flight.minion-flight.path-arc | 10 | 280 | 280 | 2800 | cubic-bezier(.45,0,.2,1) |  |
| waapi b.bundle-n | 7 | 440 | 440 | 2716 | linear |  |
| waapi span.cs-stack.zero | 12 | 240 | 240 | 2700 | cubic-bezier(.3,1.45,.5,1) |  |
| css-trans span.base (opacity) | 18 | 150 | 150 | 2700 | ease |  |
| css-trans span.face (opacity) | 18 | 150 | 150 | 2700 | ease |  |
| css-trans section.lt-shop (filter) | 11 | 200 | 300 | 2300 | ease |  |

### Waiting

Your turn ends → your next turn painted: p50 7711ms, p95 11153ms, max 11153ms (n 3).
Still moving when your turn came (finite animations running, time left): p50 1033ms, max 1133ms.

### Bot pacing

A bot's state → its move applied: p50 256ms, p95 484ms. Applied → shown on the table: p50 1566ms, p95 4125ms, max 4403ms. Shown → painted p95 191ms. Gap between table steps: p50 568ms, p95 9835ms.
