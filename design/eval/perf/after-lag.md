# Perf run: after-lag

2026-10-21T12:38:33.306Z · local (1 person + 3 Normal bots, normal speed) · CPU 4× · seed 20261015 · think 650ms · 317s wall
Load average before 10 / 8.15 / 6.65, after 9.89 / 10.27 / 8.08 (box: 4 CPUs). Vite HMR/reloads during the run: not watched.

## P1: 7 placements (2 in round II)

### Input → next paint (Event Timing; rAF fallback below 16ms)

All: n 42, p50 145ms, p95 564ms, max 1088ms

| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |
|---|---|---|---|---|---|---|
| click button | 2 | 376 | 1088 | 1088 | 185 | 764 |
| pointerdown button | 2 | 376 | 950 | 950 | 15 | 162 |
| keydown key:ArrowRight | 2 | 264 | 564 | 564 | 13 | 197 |
| keydown key:ArrowLeft | 4 | 192 | 472 | 472 | 18 | 28 |
| click wheel | 2 | 216 | 360 | 360 | 38 | 1 |
| pointerdown rate | 5 | 145 | 314 | 314 | 76 | 1 |
| click rate | 5 | 112 | 313 | 313 | 93 | 67 |
| click space | 4 | 208 | 296 | 296 | 47 | 61 |
| pointerdown space | 4 | 118 | 255 | 255 | 14 | 24 |
| pointerdown wheel | 2 | 120 | 144 | 144 | 11 | 14 |
| pointerdown pay | 4 | 115 | 122 | 122 | 26 | 2 |
| click pay | 4 | 120 | 122 | 122 | 34 | 24 |
| pointerdown next-round | 1 | 120 | 120 | 120 | 6 | 0 |
| click next-round | 1 | 120 | 120 | 120 | 11 | 58 |

### Click → new state on screen (harness, wall clock)

| click | n | p50 | max | no change in 4s |
|---|---|---|---|---|
| place | 4 | 261 | 330 | 0 |
| recruit | 5 | 540 | 716 | 0 |
| pay | 4 | 311 | 459 | 0 |
| next-round | 1 | 193 | 193 | 0 |

Clicks on a live option that changed nothing (tracer, 1.2s): 0 of 13.

### Hover open (from the end of the 200ms hover delay → card on screen; content = "You'd get" filled; complete = its last change landed while it was still the card up; ·swap = a card already up swapping in place, no delay, timed from the arrival)

| target | n | p50 | p95 | max | content p95 | complete p95 | pointerover handler p95 |
|---|---|---|---|---|---|---|---|
| space | 12 | 50 | 250 | 250 | 250 | 251 | 1 |
| space·swap | 51 | 62 | 132 | 228 | 132 | 133 | 0 |
| rim·swap | 12 | 57 | 81 | 81 | 81 | 131 | 0 |
| shop-card·swap | 28 | 42 | 79 | 85 | 79 | 80 | 0 |
| shop-card | 5 | 69 | 91 | 91 | 91 | 94 | 0 |
| tip | 11 | 32 | 281 | 281 | 281 | 346 | 4 |

Hovers whose card never showed (moved on first, or no card): 58.

### Long animation frames

LoAF: 389 frames ≥50ms, 83 over 100ms, total blocking 11247ms. Long tasks: 399, 34103ms total, max 857ms.

| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |
|---|---|---|---|---|
| 2302 | 886 | 834 | 26 | DIV#root.onclick · Pf · assets/index-CalF5SKu.js:57160 · 764 (forced layout 94) |
| 14754 | 681 | 621 | 651 | MessagePort.onmessage · hn · assets/index-CalF5SKu.js:31034 · 20<br>DIV#root.ontransitionend · ci · assets/index-CalF5SKu.js:57386 · 5 |
| 57 | 606 | 69 | 2 | http://localhost:5311/assets/index-CalF5SKu.js · ? · assets/index-CalF5SKu.js:0 · 102 |
| 15722 | 376 | 313 | 361 | (no script: style/layout/paint) |
| 1647 | 337 | 223 | 3 | DOMWindow.onpointerdown · e · assets/CultSeat-Cp0-duzN.js:26990 · 142<br>DIV#root.onclick · Pf · assets/index-CalF5SKu.js:57160 · 82 (forced layout 1) |
| 86295 | 296 | 246 | 21 | MessagePort.onmessage · hn · assets/index-CalF5SKu.js:31034 · 274 (forced layout 148) |
| 195422 | 281 | 230 | 42 | MessagePort.onmessage · hn · assets/index-CalF5SKu.js:31034 · 237 (forced layout 157) |
| 15446 | 268 | 185 | 230 | (no script: style/layout/paint) |
| 106131 | 266 | 216 | 34 | MessagePort.onmessage · hn · assets/index-CalF5SKu.js:31034 · 231 (forced layout 64) |
| 22929 | 264 | 198 | 50 | DOMWindow.onkeydown · u · assets/Wheel-wwWNkY4I.js:91605 · 195 |

### React commits per component (dev build actualDuration, inclusive of children)

Commits: 1472; whole-tree commit p50 –ms, p95 –ms, max –ms.

| component | renders | p50 | p95 | max |
|---|---|---|---|---|

### Wheel spins (rAF-driven: one React render of the Wheel per frame)

| from° → to° | ms | frames | worst frame gap |
|---|---|---|---|
| 0 → 0 | 0 | 1 | 0 |
| 90 → 0 | 825 | 4 | 825 |
| 90 → 90 | 0 | 2 | 0 |
| 0 → 0 | 0 | 2 | 0 |
| 90 → 0 | 907 | 4 | 907 |
| 90 → 90 | 0 | 2 | 0 |
| 0 → 0 | 0 | 2 | 0 |

### Animations and transitions (every one that ran)

| animation | count | duration p50 | max | total ms | easing | loop |
|---|---|---|---|---|---|---|
| css-anim i.cs-min (cs-bob) | 304 | 4612 | 5299 | 1361311 | linear | yes |
| css-anim g.blink (cult-blink) | 195 | 4700 | 4700 | 916500 | linear | yes |
| css-anim svg.leader (cult-breathe) | 188 | 3100 | 3100 | 582800 | linear | yes |
| css-anim svg.sprite (cult-breathe) | 63 | 2667 | 4160 | 207203 | linear | yes |
| css-anim svg.sprite (cult-shift) | 68 | 3368 | 3368 | 203643 | linear | yes |
| css-anim b.seat-delta.up (seatdelta) | 17 | 9750 | 9750 | 165750 | linear |  |
| css-anim i.cs-min (cs-bob-eager) | 96 | 1100 | 1100 | 105600 | linear | yes |
| waapi ghost.piece-flight.piece-res.path-arc | 102 | 881 | 1055 | 90722 | cubic-bezier(.4,0,.6,1) |  |
| waapi div.path-inner | 93 | 924 | 1575 | 84770 | ease-out |  |
| css-anim span.lead (cult-scheme) | 49 | 1600 | 1600 | 78400 | linear | yes |
| css-anim span.tc-line (tcline) | 51 | 1125 | 1125 | 57375 | linear |  |
| waapi span.cs-stack | 64 | 675 | 900 | 46013 | cubic-bezier(.3,1.5,.5,1) |  |
| waapi ghost.worker-flight.minion-flight.home | 24 | 1840 | 2518 | 45516 | linear |  |
| css-anim span.dots (blink) | 37 | 1200 | 1200 | 44400 | linear | yes |
| css-anim span.tick.num (bump) | 36 | 975 | 1575 | 42300 | linear |  |
| css-anim svg.mark (turn) | 1 | 40000 | 40000 | 40000 | linear | yes |
| css-anim span.rc.in (reckoncheer) | 7 | 5250 | 5250 | 36750 | linear |  |
| css-anim svg.sprite (cult-eager) | 32 | 997 | 1390 | 36112 | linear | yes |
| waapi button.card.lt-card[uid] | 23 | 1145 | 2721 | 34979 | linear |  |
| waapi span.cs-member | 14 | 3102 | 3228 | 33837 | linear |  |
| waapi ghost.piece-flight.piece-fol.path-arc | 36 | 750 | 1045 | 30726 | cubic-bezier(.4,0,.6,1) |  |
| waapi ghost.flight.card-flight | 24 | 1198 | 1281 | 29196 | linear |  |
| waapi div.slot.r1[slot] | 96 | 300 | 300 | 28800 | linear |  |
| waapi span.worker | 32 | 675 | 1080 | 26670 | cubic-bezier(.3,1.5,.5,1) |  |
| waapi i.cs-min | 16 | 1616 | 2203 | 26439 | linear |  |
| waapi div.as-card | 32 | 675 | 900 | 25200 | cubic-bezier(.2,.9,.25,1.15) |  |
| waapi ghost.flight.shop-out | 9 | 4040 | 4416 | 24834 | cubic-bezier(.45,0,.4,1) |  |
| waapi ghost.card.lt-card.paper.lt-deal | 15 | 1125 | 2701 | 23705 | cubic-bezier(.3,.7,.4,1) |  |
| css-anim span.worker-fig (panelland-under) | 21 | 1125 | 1125 | 23625 | linear |  |
| waapi ghost.piece-flight.piece-res.pay.path-drop | 25 | 881 | 1073 | 22279 | linear |  |
| waapi span.lead | 7 | 3000 | 3000 | 21000 | steps(5,end) |  |
| waapi div.slot.r2[slot] | 64 | 300 | 300 | 19200 | linear |  |
| css-anim span.worker-fig (panelland) | 17 | 1125 | 1125 | 19125 | linear |  |
| waapi ghost.token-flight.reckon | 14 | 1240 | 1306 | 17520 | linear |  |
| css-trans path.wash (fill) | 119 | 150 | 150 | 17238 | ease |  |
| css-anim span.worker (land) | 18 | 900 | 900 | 16200 | linear |  |
| waapi ghost.worker-flight.minion-flight.path-arc | 14 | 1050 | 1050 | 14700 | cubic-bezier(.4,0,.6,1) |  |
| css-trans span.base (opacity) | 26 | 563 | 563 | 14625 | ease |  |
| css-anim span.rc.in (reckonstampcol) | 16 | 900 | 900 | 14400 | linear |  |
| waapi span.tip.fig | 6 | 2138 | 2400 | 13614 | steps(5,end) |  |

### Waiting

Your turn ends → your next turn painted: p50 55357ms, p95 70152ms, max 70152ms (n 3).
Still moving when your turn came (finite animations running, time left): p50 9000ms, max 9250ms.

### Bot pacing

A bot's state → its move applied: p50 427ms, p95 507ms. Applied → shown on the table: p50 17711ms, p95 42307ms, max 44732ms. Shown → painted p95 100ms. Gap between table steps: p50 2485ms, p95 15397ms.
