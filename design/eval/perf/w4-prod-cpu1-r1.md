# Perf run: w4-prod-cpu1-r1

2026-10-15T11:55:30.529Z · local (1 person + 3 Normal bots, normal speed) · CPU 1× · seed 20261015 · think 650ms · 542s wall
Load average before 2.14 / 2.63 / 4.69, after 1.07 / 1.34 / 3.08 (box: 4 CPUs). Vite HMR/reloads during the run: not watched.

## P1: 4 placements (1 in round II)

### Input → next paint (Event Timing; rAF fallback below 16ms)

All: n 38, p50 144ms, p95 312ms, max 312ms

| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |
|---|---|---|---|---|---|---|
| pointerdown button | 2 | 48 | 312 | 312 | 2 | 1 |
| click button | 2 | 48 | 312 | 312 | 3 | 188 |
| pointerdown next-round | 1 | 256 | 256 | 256 | 1 | 0 |
| click next-round | 1 | 256 | 256 | 256 | 1 | 104 |
| pointerdown option:color | 2 | 44 | 240 | 240 | 1 | 0 |
| click option:color | 2 | 104 | 240 | 240 | 2 | 7 |
| pointerdown rate | 2 | 33 | 200 | 200 | 5 | 0 |
| click rate | 2 | 152 | 200 | 200 | 6 | 4 |
| click pay | 2 | 112 | 200 | 200 | 3 | 5 |
| keydown key:ArrowRight | 2 | 160 | 192 | 192 | 2 | 1 |
| pointerdown wheel | 2 | 152 | 192 | 192 | 1 | 3 |
| click wheel | 2 | 184 | 192 | 192 | 5 | 0 |
| keydown key:ArrowLeft | 4 | 152 | 176 | 176 | 1 | 1 |
| pointerdown pay | 2 | 80 | 81 | 81 | 2 | – |
| click shop-card | 1 | 72 | 72 | 72 | 1 | 10 |
| pointerdown space | 4 | 57 | 71 | 71 | 1 | 1 |
| click space | 4 | 57 | 71 | 71 | 2 | 5 |
| pointerdown shop-card | 1 | 38 | 38 | 38 | 1 | – |

### Click → new state on screen (harness, wall clock)

| click | n | p50 | max | no change in 4s |
|---|---|---|---|---|
| setup | 2 | 154 | 281 | 0 |
| place | 4 | 250 | 283 | 0 |
| followers | 2 | 224 | 263 | 0 |
| pay | 2 | 180 | 272 | 0 |
| recruit | 1 | 120 | 120 | 0 |
| next-round | 1 | 299 | 299 | 0 |

Clicks on a live option that changed nothing (tracer, 1.2s): 0 of 11.

### Hover open delay (pointer over → card in the DOM; content = "You'd get" filled)

| target | n | p50 | p95 | max | content p95 | pointerover handler p95 |
|---|---|---|---|---|---|---|
| space | 38 | 48 | 92 | 99 | 92 | 0 |
| shop-card | 15 | 58 | 103 | 103 | 103 | 0 |
| rim | 4 | 47 | 72 | 72 | 72 | 0 |
| tip | 1 | 135 | 135 | 135 | 135 | 0 |

Hovers whose card never showed (moved on first, or no card): 13.

### Long animation frames

LoAF: 1783 frames ≥50ms, 59 over 100ms, total blocking 369ms. Long tasks: 7, 659ms total, max 212ms.

| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |
|---|---|---|---|---|
| 10 | 488 | 0 | 0 | http://127.0.0.1:5368/assets/index-MksUv53I.js · ? · assets/index-MksUv53I.js:0 · 11 |
| 742 | 216 | 165 | 2 | DIV#root.onclick · xf · assets/index-MksUv53I.js:55911 · 187 (forced layout 54) |
| 223738 | 153 | 0 | 1 | (no script: style/layout/paint) |
| 48860 | 151 | 0 | 6 | (no script: style/layout/paint) |
| 301087 | 142 | 0 | 1 | (no script: style/layout/paint) |
| 312747 | 134 | 33 | 83 | (no script: style/layout/paint) |
| 31486 | 133 | 0 | 1 | (no script: style/layout/paint) |
| 402924 | 132 | 0 | 3 | (no script: style/layout/paint) |
| 99405 | 128 | 0 | 1 | (no script: style/layout/paint) |
| 62423 | 127 | 0 | 3 | (no script: style/layout/paint) |

### React commits per component (dev build actualDuration, inclusive of children)

Commits: 652; whole-tree commit p50 –ms, p95 –ms, max –ms.

| component | renders | p50 | p95 | max |
|---|---|---|---|---|

### Wheel spins (rAF-driven: one React render of the Wheel per frame)

| from° → to° | ms | frames | worst frame gap |
|---|---|---|---|
| 0 → 0 | 0 | 1 | 0 |
| 29 → 0 | 1111 | 17 | 495 |
| 78 → 0 | 1204 | 17 | 557 |
| 30 → 0 | 1139 | 17 | 491 |
| 70 → 0 | 1225 | 17 | 553 |

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
| css-trans path.glow (opacity) | 36 | 150 | 150 | 5334 | ease |  |
| css-trans path.edge-lit (opacity) | 36 | 150 | 150 | 5334 | ease |  |
| css-trans path.wash (filter) | 55 | 120 | 120 | 4775 | ease |  |
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

Your turn ends → your next turn painted: p50 8897ms, p95 9953ms, max 9953ms (n 3).
Still moving when your turn came (finite animations running, time left): p50 1033ms, max 1133ms.

### Bot pacing

A bot's state → its move applied: p50 253ms, p95 285ms. Applied → shown on the table: p50 2607ms, p95 4693ms, max 4791ms. Shown → painted p95 73ms. Gap between table steps: p50 669ms, p95 8874ms.
