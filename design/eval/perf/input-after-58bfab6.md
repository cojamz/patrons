# Perf run: input-after-58bfab6

2026-10-28T04:38:22.506Z · local (1 person + 3 Normal bots, normal speed) · CPU 4× · seed 20261015 · think 650ms · 544s wall
Load average before 2.89 / 4.33 / 6.87, after 2.59 / 3.04 / 5.08 (box: 4 CPUs). Vite HMR/reloads during the run: not watched.

## P1: 5 placements (0 in round II)

### Input → next paint (Event Timing; rAF fallback below 16ms)

All: n 27, p50 75ms, p95 759ms, max 800ms

| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |
|---|---|---|---|---|---|---|
| click button | 2 | 218 | 800 | 800 | 128 | 673 |
| pointerdown button | 2 | 216 | 759 | 759 | 12 | – |
| click space | 3 | 96 | 104 | 104 | 18 | 27 |
| pointerdown space | 3 | 79 | 96 | 96 | 9 | – |
| pointerdown rate | 2 | 75 | 83 | 83 | 25 | – |
| click rate | 2 | 74 | 83 | 83 | 27 | 11 |
| keydown key:ArrowRight | 1 | 82 | 82 | 82 | 7 | 21 |
| pointerdown option:color | 2 | 45 | 75 | 75 | 10 | – |
| click option:color | 2 | 64 | 75 | 75 | 17 | 18 |
| keydown key:ArrowLeft | 2 | 40 | 64 | 64 | 4 | 23 |
| click pay | 2 | 49 | 64 | 64 | 13 | 10 |
| pointerdown pay | 2 | 49 | 57 | 57 | 8 | 1 |
| click wheel | 1 | 56 | 56 | 56 | 19 | 0 |
| pointerdown wheel | 1 | 48 | 48 | 48 | 6 | 8 |

### Click → new state on screen (harness, wall clock)

| click | n | p50 | max | no change in 4s |
|---|---|---|---|---|
| setup | 1 | 204 | 204 | 0 |
| place | 3 | 138 | 157 | 0 |
| recruit | 2 | 215 | 264 | 0 |
| pay | 2 | 135 | 161 | 0 |
| choose | 1 | 225 | 225 | 0 |

Clicks on a live option that changed nothing (tracer, 1.2s): 0 of 9.

### Hover open (from the end of the 0ms hover delay → card on screen; content = "You'd get" filled; complete = its last change landed while it was still the card up; ·swap = a card already up swapping in place, no delay, timed from the arrival)

| target | n | p50 | p95 | max | content p95 | complete p95 | pointerover handler p95 |
|---|---|---|---|---|---|---|---|
| space·swap | 49 | 32 | 56 | 75 | 56 | 559 | 1 |
| rim·swap | 9 | 33 | 109 | 109 | 109 | 110 | 0 |
| shop-card·swap | 16 | 31 | 51 | 51 | 51 | 52 | 1 |
| space | 1 | 52 | 52 | 52 | 52 | 53 | 0 |

Hovers whose card never showed (moved on first, or no card): 36.

### Long animation frames

LoAF: 48 frames ≥50ms, 6 over 100ms, total blocking 1254ms. Long tasks: 26, 2434ms total, max 690ms.

| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |
|---|---|---|---|---|
| 1381 | 706 | 648 | 8 | DIV#root.onclick · Nf · assets/index-BiRiD1wp.js:57177 · 672 (forced layout 131) |
| 18 | 388 | 0 | 5 | (no script: style/layout/paint) |
| 1044 | 191 | 133 | 3 | DOMWindow.onpointerdown · e · assets/CultSeat-599h8eQ3.js:31277 · 108<br>DIV#root.onclick · Nf · assets/index-BiRiD1wp.js:57177 · 37 (forced layout 1) |
| 699 | 170 | 76 | 49 | MessagePort.onmessage · hn · assets/index-BiRiD1wp.js:31051 · 77 |
| 69032 | 108 | 34 | 6 | TimerHandler:setTimeout · ? · assets/CultSeat-599h8eQ3.js:99882 · 78 (forced layout 5)<br>DIV#root.onpointerout · Lf · assets/index-BiRiD1wp.js:57290 · 12 (forced layout 5) |
| 34443 | 106 | 47 | 5 | TimerHandler:setTimeout · ? · assets/CultSeat-599h8eQ3.js:99882 · 92 (forced layout 2) |
| 487 | 97 | 0 | 12 | (no script: style/layout/paint) |
| 604 | 94 | 43 | 0 | http://localhost:5302/assets/App-gPWuwZbS.js · ? · assets/App-gPWuwZbS.js:0 · 89 |
| 106829 | 92 | 40 | 4 | DIV#root.onpointerout · Lf · assets/index-BiRiD1wp.js:57290 · 79 (forced layout 5) |
| 61572 | 77 | 27 | 16 | MessagePort.onmessage · hn · assets/index-BiRiD1wp.js:31051 · 60 (forced layout 28) |

### React commits per component (dev build actualDuration, inclusive of children)

Commits: 824; whole-tree commit p50 –ms, p95 –ms, max –ms.

| component | renders | p50 | p95 | max |
|---|---|---|---|---|

### Wheel spins (rAF-driven: one React render of the Wheel per frame)

| from° → to° | ms | frames | worst frame gap |
|---|---|---|---|
| 0 → 0 | 0 | 1 | 0 |
| 90 → 90 | 1837 | 6 | 996 |
| 0 → 0 | 0 | 2 | 0 |

### Animations and transitions (every one that ran)

| animation | count | duration p50 | max | total ms | easing | loop |
|---|---|---|---|---|---|---|
| css-anim i.cs-min (cs-bob) | 134 | 4612 | 5299 | 597528 | linear | yes |
| css-anim g.blink (cult-blink) | 124 | 4700 | 4700 | 582800 | linear | yes |
| css-anim svg.leader (cult-breathe) | 112 | 3100 | 3100 | 347200 | linear | yes |
| css-anim img.sprite (cult-shift) | 53 | 2642 | 4118 | 165446 | linear | yes |
| css-anim b.seat-delta.up (seatdelta) | 11 | 9750 | 9750 | 107250 | linear |  |
| css-anim img.sprite (cult-breathe) | 21 | 3051 | 3051 | 63528 | linear | yes |
| waapi ghost.piece-flight.piece-res.path-arc | 72 | 625 | 920 | 44512 | cubic-bezier(.4,0,.6,1) |  |
| css-anim i.cs-min (cs-bob-eager) | 38 | 1100 | 1100 | 41800 | linear | yes |
| css-anim svg.mark (turn) | 1 | 40000 | 40000 | 40000 | linear | yes |
| css-anim span.lead (cult-scheme) | 25 | 1600 | 1600 | 36000 | linear | yes |
| waapi span.cs-stack | 49 | 675 | 900 | 36000 | cubic-bezier(.3,1.5,.5,1) |  |
| waapi div.path-inner | 54 | 634 | 1050 | 35887 | ease-out |  |
| css-anim span.tc-line (tcline) | 28 | 1125 | 1125 | 31500 | linear |  |
| css-anim img.sprite (cult-eager) | 26 | 1070 | 1379 | 27551 | linear | yes |
| css-anim span.dots (blink) | 19 | 1200 | 1200 | 22800 | linear | yes |
| css-trans span.base (opacity) | 31 | 563 | 563 | 16313 | ease |  |
| css-anim span.worker-fig (panelland-under) | 14 | 1125 | 1125 | 15750 | linear |  |
| waapi span.cs-member | 4 | 3922 | 3957 | 15704 | linear |  |
| waapi div.slot.r1[slot] | 48 | 300 | 300 | 14400 | linear |  |
| waapi button.card.lt-card[uid] | 11 | 1145 | 1595 | 13945 | linear |  |
| waapi span.worker | 19 | 675 | 713 | 12679 | linear |  |
| waapi ghost.piece-flight.piece-res.pay.path-drop | 17 | 672 | 974 | 12488 | linear |  |
| waapi ghost.piece-flight.piece-fol.path-arc | 14 | 996 | 1050 | 12284 | cubic-bezier(.4,0,.6,1) |  |
| css-anim span.worker-fig (panelland) | 10 | 1125 | 1125 | 11250 | linear |  |
| css-anim span.worker (land) | 11 | 900 | 900 | 9900 | linear |  |
| css-trans path.wash (fill) | 67 | 150 | 150 | 9756 | ease |  |
| waapi div.slot.r2[slot] | 32 | 300 | 300 | 9600 | linear |  |
| waapi ghost.flight.card-flight | 8 | 1218 | 1218 | 9574 | linear |  |
| waapi ghost.flight.card-ring | 8 | 1218 | 1218 | 9574 | linear |  |
| css-anim span.tick.dip (bump) | 6 | 1575 | 1575 | 9450 | linear |  |
| waapi ghost.flight.pulse-glow | 17 | 525 | 960 | 8367 | cubic-bezier(.3,1.4,.5,1) |  |
| waapi ghost.card.lt-card.paper.lt-deal | 7 | 1125 | 1425 | 8325 | cubic-bezier(.3,.7,.4,1) |  |
| waapi div.as-card | 13 | 439 | 900 | 7562 | cubic-bezier(.2,.9,.25,1.15) |  |
| css-trans span.face (opacity) | 15 | 563 | 563 | 7313 |  |  |
| waapi ghost.flight.shop-out | 7 | 994 | 1182 | 7146 | cubic-bezier(.45,0,.4,1) |  |
| css-anim span.tick.num (bump) | 7 | 975 | 975 | 6825 | linear |  |
| css-trans path.edge-lit (opacity) | 47 | 150 | 150 | 6300 | ease |  |
| css-trans path.glow (opacity) | 47 | 150 | 150 | 6300 | ease |  |
| css-trans section.lt-seat.lt-seat-1[slot] (box-shadow) | 8 | 750 | 750 | 6000 | ease |  |
| css-trans section.lt-seat.lt-seat-1[slot] (background-color) | 8 | 750 | 750 | 6000 | ease |  |

### Waiting

Your turn ends → your next turn painted: p50 16594ms, p95 23919ms, max 23919ms (n 3).
Still moving when your turn came (finite animations running, time left): p50 9733ms, max 9733ms.

### Bot pacing

A bot's state → its move applied: p50 408ms, p95 422ms. Applied → shown on the table: p50 7655ms, p95 17143ms, max 17367ms. Shown → painted p95 53ms. Gap between table steps: p50 2205ms, p95 10566ms.
