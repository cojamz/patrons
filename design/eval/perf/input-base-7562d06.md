# Perf run: input-base-7562d06

2026-10-28T04:29:18.428Z · local (1 person + 3 Normal bots, normal speed) · CPU 4× · seed 20261015 · think 650ms · 544s wall
Load average before 1.89 / 4.86 / 8.28, after 2.8 / 4.34 / 6.89 (box: 4 CPUs). Vite HMR/reloads during the run: not watched.

## P1: 5 placements (0 in round II)

### Input → next paint (Event Timing; rAF fallback below 16ms)

All: n 27, p50 98ms, p95 848ms, max 888ms

| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |
|---|---|---|---|---|---|---|
| click button | 2 | 208 | 888 | 888 | 62 | 762 |
| pointerdown button | 2 | 208 | 848 | 848 | 8 | 50 |
| click pay | 2 | 48 | 320 | 320 | 26 | 21 |
| pointerdown pay | 2 | 48 | 315 | 315 | 19 | – |
| keydown key:ArrowRight | 1 | 134 | 134 | 134 | 5 | 22 |
| pointerdown rate | 2 | 59 | 130 | 130 | 17 | – |
| click rate | 2 | 59 | 130 | 130 | 25 | 17 |
| pointerdown space | 3 | 116 | 128 | 128 | 10 | 4 |
| click space | 3 | 120 | 128 | 128 | 16 | 43 |
| pointerdown option:color | 2 | 45 | 98 | 98 | 13 | – |
| click option:color | 2 | 45 | 98 | 98 | 21 | 17 |
| keydown key:ArrowLeft | 2 | 64 | 88 | 88 | 2 | 12 |
| click wheel | 1 | 80 | 80 | 80 | 22 | 1 |
| pointerdown wheel | 1 | 64 | 64 | 64 | 4 | 7 |

### Click → new state on screen (harness, wall clock)

| click | n | p50 | max | no change in 4s |
|---|---|---|---|---|
| setup | 1 | 194 | 194 | 0 |
| place | 3 | 197 | 260 | 0 |
| recruit | 2 | 312 | 386 | 0 |
| pay | 2 | 187 | 488 | 0 |
| choose | 1 | 354 | 354 | 0 |

Clicks on a live option that changed nothing (tracer, 1.2s): 0 of 9.

### Hover open (from the end of the 0ms hover delay → card on screen; content = "You'd get" filled; complete = its last change landed while it was still the card up; ·swap = a card already up swapping in place, no delay, timed from the arrival)

| target | n | p50 | p95 | max | content p95 | complete p95 | pointerover handler p95 |
|---|---|---|---|---|---|---|---|
| space·swap | 44 | 44 | 87 | 294 | 87 | 87 | 0 |
| rim·swap | 9 | 46 | 84 | 84 | 84 | 84 | 1 |
| shop-card·swap | 15 | 33 | 57 | 57 | 57 | 57 | 0 |
| space | 4 | 81 | 97 | 97 | 97 | 730 | 1 |
| shop-card | 1 | 61 | 61 | 61 | 61 | 62 | 0 |

Hovers whose card never showed (moved on first, or no card): 41.

### Long animation frames

LoAF: 105 frames ≥50ms, 24 over 100ms, total blocking 3642ms. Long tasks: 104, 9331ms total, max 781ms.

| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |
|---|---|---|---|---|
| 1192 | 797 | 745 | 14 | DIV#root.onclick · Nf · assets/index-DMdD3d8m.js:57177 · 760 (forced layout 173) |
| 29 | 417 | 0 | 5 | (no script: style/layout/paint) |
| 64978 | 265 | 213 | 16 | MessagePort.onmessage · hn · assets/index-DMdD3d8m.js:31051 · 247 (forced layout 46) |
| 72840 | 253 | 192 | 2 | DIV#root.onpointerout · Lf · assets/index-DMdD3d8m.js:57290 · 231 (forced layout 2) |
| 113201 | 224 | 164 | 17 | DIV#root.onpointerout · Lf · assets/index-DMdD3d8m.js:57290 · 191 (forced layout 3) |
| 45926 | 218 | 168 | 52 | MessagePort.onmessage · hn · assets/index-DMdD3d8m.js:31051 · 166 (forced layout 133)<br>ResizeObserverCallback · ? · assets/App-LfMsYytP.js:174320 · 13 |
| 104959 | 206 | 149 | 7 | (no script: style/layout/paint) |
| 112543 | 203 | 153 | 20 | MessagePort.onmessage · hn · assets/index-DMdD3d8m.js:31051 · 183 (forced layout 60)<br>ResizeObserverCallback · I · assets/CultSeat-BsE7p535.js:120885 · 8 (forced layout 8) |
| 110448 | 189 | 139 | 1 | MessagePort.onmessage · hn · assets/index-DMdD3d8m.js:31051 · 188 |
| 74966 | 181 | 110 | 160 | (no script: style/layout/paint) |

### React commits per component (dev build actualDuration, inclusive of children)

Commits: 829; whole-tree commit p50 –ms, p95 –ms, max –ms.

| component | renders | p50 | p95 | max |
|---|---|---|---|---|

### Wheel spins (rAF-driven: one React render of the Wheel per frame)

| from° → to° | ms | frames | worst frame gap |
|---|---|---|---|
| 0 → 0 | 0 | 1 | 0 |
| 90 → 90 | 1771 | 6 | 920 |
| 0 → 0 | 0 | 2 | 0 |

### Animations and transitions (every one that ran)

| animation | count | duration p50 | max | total ms | easing | loop |
|---|---|---|---|---|---|---|
| css-anim g.blink (cult-blink) | 125 | 4700 | 4700 | 587500 | linear | yes |
| css-anim i.cs-min (cs-bob) | 125 | 4612 | 5299 | 557197 | linear | yes |
| css-anim svg.leader (cult-breathe) | 112 | 3100 | 3100 | 347200 | linear | yes |
| css-anim img.sprite (cult-shift) | 52 | 2642 | 4118 | 163121 | linear | yes |
| css-anim b.seat-delta.up (seatdelta) | 11 | 9750 | 9750 | 107250 | linear |  |
| css-anim img.sprite (cult-breathe) | 20 | 3051 | 3051 | 60478 | linear | yes |
| waapi ghost.piece-flight.piece-res.path-arc | 72 | 625 | 920 | 44512 | cubic-bezier(.4,0,.6,1) |  |
| css-anim i.cs-min (cs-bob-eager) | 38 | 1100 | 1100 | 41800 | linear | yes |
| css-anim svg.mark (turn) | 1 | 40000 | 40000 | 40000 | linear | yes |
| css-anim span.lead (cult-scheme) | 25 | 1600 | 1600 | 36000 | linear | yes |
| waapi span.cs-stack | 49 | 675 | 900 | 36000 | cubic-bezier(.3,1.5,.5,1) |  |
| waapi div.path-inner | 54 | 634 | 1050 | 35887 | ease-out |  |
| css-anim span.tc-line (tcline) | 28 | 1125 | 1125 | 31500 | linear |  |
| css-anim span.dots (blink) | 18 | 1200 | 1200 | 21600 | linear | yes |
| css-anim img.sprite (cult-eager) | 20 | 1070 | 1379 | 21550 | linear | yes |
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
| css-trans path.wash (fill) | 67 | 150 | 150 | 9773 | ease |  |
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
| css-trans path.glow (opacity) | 48 | 150 | 150 | 6449 | ease |  |
| css-trans path.edge-lit (opacity) | 48 | 150 | 150 | 6449 | ease |  |
| css-trans path.wash (filter) | 68 | 120 | 120 | 6205 | ease |  |
| css-trans section.lt-seat.lt-seat-1[slot] (box-shadow) | 8 | 750 | 750 | 6000 | ease |  |

### Waiting

Your turn ends → your next turn painted: p50 16876ms, p95 24747ms, max 24747ms (n 3).
Still moving when your turn came (finite animations running, time left): p50 9750ms, max 9750ms.

### Bot pacing

A bot's state → its move applied: p50 414ms, p95 494ms. Applied → shown on the table: p50 8111ms, p95 17749ms, max 18054ms. Shown → painted p95 72ms. Gap between table steps: p50 2294ms, p95 11607ms.
