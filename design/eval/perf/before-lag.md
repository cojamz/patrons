# Perf run: before-lag

2026-10-21T11:33:06.304Z · local (1 person + 3 Normal bots, normal speed) · CPU 4× · seed 20261015 · think 650ms · 307s wall
Load average before 2.96 / 1.74 / 0.7, after 3.69 / 2.54 / 1.3 (box: 4 CPUs). Vite HMR/reloads during the run: not watched.

## P1: 7 placements (2 in round II)

### Input → next paint (Event Timing; rAF fallback below 16ms)

All: n 42, p50 92ms, p95 520ms, max 1400ms

| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |
|---|---|---|---|---|---|---|
| click button | 2 | 520 | 1400 | 1400 | 358 | 1202 |
| pointerdown button | 2 | 494 | 1362 | 1362 | 30 | – |
| keydown key:ArrowRight | 2 | 136 | 192 | 192 | 28 | 14 |
| keydown key:ArrowLeft | 4 | 112 | 176 | 176 | 11 | 3 |
| pointerdown rate | 5 | 80 | 170 | 170 | 41 | 4 |
| click rate | 5 | 88 | 169 | 169 | 53 | 27 |
| click wheel | 2 | 136 | 152 | 152 | 38 | 1 |
| pointerdown space | 4 | 74 | 118 | 118 | 11 | 6 |
| pointerdown wheel | 2 | 72 | 112 | 112 | 9 | 15 |
| click pay | 4 | 73 | 104 | 104 | 28 | 17 |
| pointerdown next-round | 1 | 99 | 99 | 99 | 3 | 2 |
| click next-round | 1 | 98 | 98 | 98 | 9 | 35 |
| pointerdown pay | 4 | 73 | 92 | 92 | 19 | – |
| click space | 4 | 64 | 81 | 81 | 27 | 33 |

### Click → new state on screen (harness, wall clock)

| click | n | p50 | max | no change in 4s |
|---|---|---|---|---|
| place | 4 | 291 | 449 | 0 |
| recruit | 5 | 405 | 745 | 0 |
| pay | 4 | 227 | 293 | 0 |
| next-round | 1 | 159 | 159 | 0 |

Clicks on a live option that changed nothing (tracer, 1.2s): 0 of 13.

### Hover open (from the end of the 200ms hover delay → card on screen; content = "You'd get" filled; complete = its last change landed while it was still the card up; ·swap = a card already up swapping in place, no delay, timed from the arrival)

| target | n | p50 | p95 | max | content p95 | complete p95 | pointerover handler p95 |
|---|---|---|---|---|---|---|---|
| space | 11 | 53 | 131 | 131 | 131 | 131 | 1 |
| space·swap | 53 | 56 | 81 | 144 | 81 | 82 | 1 |
| rim·swap | 12 | 50 | 77 | 77 | 77 | 128 | 0 |
| shop-card·swap | 28 | 47 | 84 | 85 | 84 | 86 | 1 |
| shop-card | 5 | 53 | 71 | 71 | 71 | 73 | 0 |
| tip | 10 | 26 | 56 | 56 | 56 | 57 | 1 |

Hovers whose card never showed (moved on first, or no card): 56.

### Long animation frames

LoAF: 232 frames ≥50ms, 42 over 100ms, total blocking 6913ms. Long tasks: 247, 19222ms total, max 1288ms.

| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |
|---|---|---|---|---|
| 2195 | 1316 | 1266 | 28 | DIV#root.onclick · Pf · assets/index-tp5jhEPq.js:57160 · 1201 (forced layout 268) |
| 18 | 528 | 0 | 8 | http://localhost:5311/?trace=1&intro=0 · ? · /:0 · 5 |
| 1570 | 492 | 424 | 1 | DOMWindow.onpointerdown · e · assets/CultSeat-BqbEyZai.js:26692 · 304<br>DIV#root.onclick · Pf · assets/index-tp5jhEPq.js:57160 · 64 (forced layout 1)<br>DIV#root.onpointerover · Nf · assets/index-tp5jhEPq.js:57273 · 5 |
| 1047 | 304 | 176 | 85 | MessagePort.onmessage · hn · assets/index-tp5jhEPq.js:31034 · 137 |
| 190275 | 263 | 212 | 30 | MessagePort.onmessage · hn · assets/index-tp5jhEPq.js:31034 · 231 (forced layout 127) |
| 3925 | 255 | 0 | 2 | (no script: style/layout/paint) |
| 128248 | 245 | 195 | 17 | MessagePort.onmessage · hn · assets/index-tp5jhEPq.js:31034 · 226 (forced layout 49) |
| 196559 | 241 | 190 | 36 | MessagePort.onmessage · hn · assets/index-tp5jhEPq.js:31034 · 204 (forced layout 102) |
| 21719 | 234 | 183 | 33 | MessagePort.onmessage · hn · assets/index-tp5jhEPq.js:31034 · 199 |
| 26775 | 202 | 151 | 14 | MessagePort.onmessage · hn · assets/index-tp5jhEPq.js:31034 · 187 (forced layout 104) |

### React commits per component (dev build actualDuration, inclusive of children)

Commits: 1473; whole-tree commit p50 –ms, p95 –ms, max –ms.

| component | renders | p50 | p95 | max |
|---|---|---|---|---|

### Wheel spins (rAF-driven: one React render of the Wheel per frame)

| from° → to° | ms | frames | worst frame gap |
|---|---|---|---|
| 0 → 0 | 0 | 1 | 0 |
| 90 → 0 | 764 | 4 | 764 |
| 90 → 0 | 976 | 4 | 976 |
| 90 → 0 | 829 | 4 | 829 |
| 90 → 90 | 0 | 2 | 0 |
| 0 → 0 | 0 | 2 | 0 |

### Animations and transitions (every one that ran)

| animation | count | duration p50 | max | total ms | easing | loop |
|---|---|---|---|---|---|---|
| css-anim i.cs-min (cs-bob) | 312 | 4612 | 5299 | 1397819 | linear | yes |
| css-anim g.blink (cult-blink) | 199 | 4700 | 4700 | 935300 | linear | yes |
| css-anim svg.leader (cult-breathe) | 192 | 3100 | 3100 | 595200 | linear | yes |
| css-anim svg.sprite (cult-breathe) | 65 | 2667 | 4160 | 212472 | linear | yes |
| css-anim svg.sprite (cult-shift) | 70 | 3368 | 3368 | 209549 | linear | yes |
| css-anim b.seat-delta.up (seatdelta) | 17 | 9750 | 9750 | 165750 | linear |  |
| css-anim i.cs-min (cs-bob-eager) | 98 | 1100 | 1100 | 107800 | linear | yes |
| waapi ghost.piece-flight.piece-res.path-arc | 102 | 881 | 1055 | 90750 | cubic-bezier(.4,0,.6,1) |  |
| waapi div.path-inner | 93 | 924 | 1575 | 84784 | ease-out |  |
| css-anim span.lead (cult-scheme) | 50 | 1600 | 1600 | 80000 | linear | yes |
| css-anim span.tc-line (tcline) | 51 | 1125 | 1125 | 57375 | linear |  |
| waapi span.cs-stack | 64 | 675 | 900 | 46013 | cubic-bezier(.3,1.5,.5,1) |  |
| waapi ghost.worker-flight.minion-flight.home | 24 | 1840 | 2518 | 45516 | linear |  |
| css-anim span.dots (blink) | 36 | 1200 | 1200 | 43200 | linear | yes |
| css-anim span.tick.num (bump) | 36 | 975 | 1575 | 42300 | linear |  |
| css-anim svg.mark (turn) | 1 | 40000 | 40000 | 40000 | linear | yes |
| css-anim svg.sprite (cult-eager) | 35 | 1181 | 1390 | 39780 | linear | yes |
| css-anim span.rc.in (reckoncheer) | 7 | 5250 | 5250 | 36750 | linear |  |
| waapi button.card.lt-card[uid] | 23 | 1145 | 2721 | 34979 | linear |  |
| waapi span.cs-member | 14 | 3102 | 3228 | 33837 | linear |  |
| waapi i.cs-min | 16 | 2031 | 2619 | 33088 | linear |  |
| waapi ghost.piece-flight.piece-fol.path-arc | 36 | 750 | 1045 | 30726 | cubic-bezier(.4,0,.6,1) |  |
| waapi ghost.flight.card-flight | 24 | 1198 | 1281 | 29196 | linear |  |
| waapi span.worker | 32 | 675 | 1080 | 26670 | cubic-bezier(.3,1.5,.5,1) |  |
| waapi div.as-card | 32 | 675 | 900 | 25200 | cubic-bezier(.2,.9,.25,1.15) |  |
| waapi ghost.flight.shop-out | 9 | 4040 | 4416 | 24834 | cubic-bezier(.45,0,.4,1) |  |
| waapi ghost.card.lt-card.paper.lt-deal | 15 | 1125 | 2701 | 23705 | cubic-bezier(.3,.7,.4,1) |  |
| waapi ghost.piece-flight.piece-res.pay.path-drop | 25 | 881 | 1073 | 22279 | linear |  |
| waapi span.lead | 7 | 3000 | 3000 | 21000 | steps(5,end) |  |
| css-anim span.worker-fig (panelland-under) | 18 | 1125 | 1125 | 20250 | linear |  |
| css-anim span.worker-fig (panelland) | 17 | 1125 | 1125 | 19125 | linear |  |
| waapi ghost.token-flight.reckon | 14 | 1240 | 1306 | 17520 | linear |  |
| css-trans path.wash (fill) | 114 | 150 | 150 | 16800 | ease |  |
| css-anim span.worker (land) | 18 | 900 | 900 | 16200 | linear |  |
| waapi ghost.worker-flight.minion-flight.path-arc | 14 | 1050 | 1050 | 14700 | cubic-bezier(.4,0,.6,1) |  |
| css-trans span.base (opacity) | 26 | 563 | 563 | 14625 | ease |  |
| css-anim span.rc.in (reckonstampcol) | 16 | 900 | 900 | 14400 | linear |  |
| waapi span.tip.fig | 6 | 2138 | 2400 | 13614 | steps(5,end) |  |
| css-anim span.tick.dip (bump) | 8 | 1575 | 1575 | 12600 | linear |  |
| waapi div.as-member.at-hub | 16 | 498 | 873 | 10444 | cubic-bezier(.2,.9,.25,1.15) |  |

### Waiting

Your turn ends → your next turn painted: p50 53615ms, p95 70266ms, max 70266ms (n 3).
Still moving when your turn came (finite animations running, time left): p50 9050ms, max 9233ms.

### Bot pacing

A bot's state → its move applied: p50 423ms, p95 504ms. Applied → shown on the table: p50 17643ms, p95 41014ms, max 43807ms. Shown → painted p95 87ms. Gap between table steps: p50 2189ms, p95 14976ms.
