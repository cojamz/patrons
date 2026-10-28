# Perf run: input-before

2026-10-28T03:08:36.690Z · local (1 person + 3 Normal bots, normal speed) · CPU 4× · seed 20261015 · think 650ms · 234s wall
Load average before 3.74 / 5.57 / 3.59, after 7.25 / 5.89 / 4.12 (box: 4 CPUs). Vite HMR/reloads during the run: not watched.

## P1: 7 placements (2 in round II)

### Input → next paint (Event Timing; rAF fallback below 16ms)

All: n 46, p50 79ms, p95 208ms, max 872ms

| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |
|---|---|---|---|---|---|---|
| click button | 2 | 208 | 872 | 872 | 78 | 765 |
| pointerdown button | 2 | 191 | 851 | 851 | 15 | – |
| pointerdown rate | 5 | 111 | 137 | 137 | 25 | – |
| click space | 4 | 104 | 128 | 128 | 23 | 42 |
| pointerdown wheel | 2 | 56 | 106 | 106 | 15 | 7 |
| pointerdown space | 4 | 93 | 104 | 104 | 13 | – |
| click rate | 5 | 56 | 99 | 99 | 32 | 12 |
| pointerdown next-round | 1 | 98 | 98 | 98 | 4 | 1 |
| click next-round | 1 | 97 | 97 | 97 | 8 | 35 |
| pointerdown pay | 4 | 60 | 85 | 85 | 12 | – |
| click pay | 4 | 72 | 85 | 85 | 17 | 22 |
| click wheel | 2 | 48 | 80 | 80 | 22 | 3 |
| pointerdown option:color | 2 | 75 | 79 | 79 | 9 | – |
| click option:color | 2 | 75 | 79 | 79 | 13 | 22 |
| keydown key:ArrowRight | 2 | 62 | 72 | 72 | 15 | 14 |
| keydown key:ArrowLeft | 4 | 56 | 72 | 72 | 6 | 10 |

### Click → new state on screen (harness, wall clock)

| click | n | p50 | max | no change in 4s |
|---|---|---|---|---|
| setup | 1 | 216 | 216 | 0 |
| place | 4 | 150 | 161 | 0 |
| recruit | 5 | 313 | 320 | 0 |
| pay | 4 | 200 | 223 | 0 |
| choose | 1 | 258 | 258 | 0 |
| next-round | 1 | 154 | 154 | 0 |

Clicks on a live option that changed nothing (tracer, 1.2s): 0 of 15.

### Hover open (from the end of the 0ms hover delay → card on screen; content = "You'd get" filled; complete = its last change landed while it was still the card up; ·swap = a card already up swapping in place, no delay, timed from the arrival)

| target | n | p50 | p95 | max | content p95 | complete p95 | pointerover handler p95 |
|---|---|---|---|---|---|---|---|
| rim | 2 | 40 | 92 | 92 | 92 | 94 | 0 |
| space·swap | 61 | 37 | 92 | 264 | 92 | 491 | 0 |
| rim·swap | 16 | 33 | 80 | 80 | 80 | 83 | 1 |
| shop-card·swap | 29 | 33 | 63 | 99 | 63 | 64 | 1 |
| space | 3 | 54 | 83 | 83 | 83 | 370 | 0 |
| shop-card | 2 | 40 | 117 | 117 | 117 | 119 | 0 |
| tip | 1 | 338 | 338 | 338 | 338 | 339 | 0 |

Hovers whose card never showed (moved on first, or no card): 49.

### Long animation frames

LoAF: 153 frames ≥50ms, 18 over 100ms, total blocking 3019ms. Long tasks: 102, 8135ms total, max 786ms.

| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |
|---|---|---|---|---|
| 1315 | 798 | 747 | 11 | DIV#root.onclick · Pf · assets/index-CvCp1AxQ.js:57177 · 763 (forced layout 159) |
| 31 | 524 | 24 | 16 | http://localhost:5302/assets/index-CvCp1AxQ.js · ? · assets/index-CvCp1AxQ.js:0 · 51 |
| 55266 | 226 | 152 | 13 | DIV#root.onpointerout · Nf · assets/index-CvCp1AxQ.js:57290 · 135 (forced layout 2)<br>MessagePort.onmessage · hn · assets/index-CvCp1AxQ.js:31051 · 18 |
| 646 | 193 | 83 | 30 | MessagePort.onmessage · hn · assets/index-CvCp1AxQ.js:31051 · 103 |
| 63309 | 185 | 135 | 12 | MessagePort.onmessage · hn · assets/index-CvCp1AxQ.js:31051 · 173 (forced layout 25) |
| 983 | 178 | 126 | 3 | DOMWindow.onpointerdown · e · assets/CultSeat-DmE0pF37.js:31269 · 56<br>DIV#root.onclick · Pf · assets/index-CvCp1AxQ.js:57177 · 51 |
| 193041 | 160 | 109 | 76 | MessagePort.onmessage · hn · assets/index-CvCp1AxQ.js:31051 · 83 (forced layout 15) |
| 149012 | 141 | 89 | 19 | MessagePort.onmessage · hn · assets/index-CvCp1AxQ.js:31051 · 119 (forced layout 56) |
| 182993 | 141 | 91 | 10 | DIV#root.onpointerout · Nf · assets/index-CvCp1AxQ.js:57290 · 118 (forced layout 1) |
| 24262 | 127 | 67 | 8 | MessagePort.onmessage · hn · assets/index-CvCp1AxQ.js:31051 · 108 (forced layout 47)<br>TimerHandler:setTimeout · ? · assets/App-CSM3JLWB.js:145957 · 8 (forced layout 2) |

### React commits per component (dev build actualDuration, inclusive of children)

Commits: 1461; whole-tree commit p50 –ms, p95 –ms, max –ms.

| component | renders | p50 | p95 | max |
|---|---|---|---|---|

### Wheel spins (rAF-driven: one React render of the Wheel per frame)

| from° → to° | ms | frames | worst frame gap |
|---|---|---|---|
| 0 → 0 | 0 | 1 | 0 |
| 90 → 90 | 1747 | 6 | 885 |
| 0 → 0 | 0 | 2 | 0 |
| 90 → 0 | 907 | 4 | 907 |
| 90 → 90 | 0 | 2 | 0 |
| 0 → 0 | 0 | 2 | 0 |

### Animations and transitions (every one that ran)

| animation | count | duration p50 | max | total ms | easing | loop |
|---|---|---|---|---|---|---|
| css-anim i.cs-min (cs-bob) | 316 | 4612 | 5299 | 1416388 | linear | yes |
| css-anim g.blink (cult-blink) | 232 | 4700 | 4700 | 1090400 | linear | yes |
| css-anim svg.leader (cult-breathe) | 212 | 3100 | 3100 | 657200 | linear | yes |
| css-anim img.sprite (cult-shift) | 132 | 2944 | 4118 | 424505 | linear | yes |
| css-anim img.sprite (cult-breathe) | 107 | 3051 | 4012 | 331230 | linear | yes |
| css-anim b.seat-delta.up (seatdelta) | 22 | 9750 | 9750 | 214500 | linear |  |
| css-anim i.cs-min (cs-bob-eager) | 94 | 1100 | 1100 | 103400 | linear | yes |
| css-anim img.sprite (cult-eager) | 89 | 990 | 1379 | 93966 | linear | yes |
| waapi ghost.piece-flight.piece-res.path-arc | 156 | 579 | 918 | 90926 | cubic-bezier(.4,0,.6,1) |  |
| waapi div.path-inner | 115 | 633 | 1050 | 72864 | ease-out |  |
| waapi span.cs-stack | 88 | 675 | 900 | 65700 | cubic-bezier(.3,1.5,.5,1) |  |
| css-anim span.tc-line (tcline) | 57 | 1125 | 1125 | 64125 | linear |  |
| css-anim span.lead (cult-scheme) | 44 | 1600 | 1600 | 62400 | linear | yes |
| waapi button.card.lt-card[uid] | 37 | 1145 | 2721 | 50045 | linear |  |
| waapi ghost.worker-flight.minion-flight.home | 24 | 1840 | 2518 | 45516 | linear |  |
| css-anim span.dots (blink) | 36 | 1200 | 1200 | 43200 | linear | yes |
| css-anim svg.mark (turn) | 1 | 40000 | 40000 | 40000 | linear | yes |
| css-anim span.tick.num (bump) | 31 | 975 | 1575 | 36825 | linear |  |
| waapi ghost.piece-flight.piece-res.pay.path-drop | 50 | 672 | 974 | 35957 | linear |  |
| waapi span.cs-member | 10 | 3902 | 3962 | 35896 | linear |  |
| waapi ghost.card.lt-card.paper.lt-deal | 26 | 1125 | 2701 | 35104 | cubic-bezier(.3,.7,.4,1) |  |
| waapi ghost.flight.shop-out | 19 | 994 | 4416 | 34586 | cubic-bezier(.45,0,.4,1) |  |
| waapi div.slot.r1[slot] | 96 | 300 | 300 | 28800 | linear |  |
| waapi i.cs-min | 16 | 1750 | 2337 | 28230 | linear |  |
| waapi span.tip.fig | 11 | 2400 | 2925 | 26928 | steps(5,end) |  |
| css-anim span.rc.in (reckoncheer) | 6 | 5250 | 5250 | 26250 | linear |  |
| waapi ghost.piece-flight.piece-fol.path-arc | 32 | 750 | 1050 | 26068 | cubic-bezier(.4,0,.6,1) |  |
| waapi ghost.flight.deck-join | 5 | 5050 | 5290 | 25250 | cubic-bezier(.3,.7,.4,1) |  |
| css-trans path.wash (fill) | 164 | 150 | 150 | 23647 | ease |  |
| css-anim span.worker-fig (panelland-under) | 21 | 1125 | 1125 | 23625 | linear |  |
| css-trans span.base (opacity) | 52 | 563 | 563 | 21375 | ease |  |
| waapi ghost.flight.card-flight | 18 | 1206 | 1218 | 21246 | linear |  |
| waapi ghost.flight.card-ring | 18 | 1206 | 1218 | 21246 | linear |  |
| waapi span.worker | 30 | 675 | 713 | 20144 | linear |  |
| waapi div.slot.r2[slot] | 64 | 300 | 300 | 19200 | linear |  |
| css-anim span.tick.dip (bump) | 12 | 1575 | 1575 | 18900 | linear |  |
| css-anim span.worker-fig (panelland) | 16 | 1125 | 1125 | 18000 | linear |  |
| css-anim span.worker (land) | 17 | 900 | 900 | 15300 | linear |  |
| waapi span.lead | 5 | 3000 | 3000 | 15000 | steps(5,end) |  |
| css-anim span.rc.in (reckonstampcol) | 16 | 900 | 900 | 14400 | linear |  |

### Waiting

Your turn ends → your next turn painted: p50 21950ms, p95 59521ms, max 59521ms (n 5).
Still moving when your turn came (finite animations running, time left): p50 9750ms, max 9750ms.

### Bot pacing

A bot's state → its move applied: p50 412ms, p95 476ms. Applied → shown on the table: p50 8241ms, p95 14907ms, max 18966ms. Shown → painted p95 65ms. Gap between table steps: p50 2121ms, p95 9339ms.
