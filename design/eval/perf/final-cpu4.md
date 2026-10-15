# Perf run: final-cpu4

2026-10-15T13:21:07.280Z · local (1 person + 3 Normal bots, normal speed) · CPU 4× · seed 20261015 · think 650ms · 548s wall
Load average before 0.78 / 3.22 / 7.14, after 1.42 / 1.74 / 4.61 (box: 4 CPUs). Vite HMR/reloads during the run: not watched.

## P1: 4 placements (1 in round II)

### Input → next paint (Event Timing; rAF fallback below 16ms)

All: n 38, p50 196ms, p95 2088ms, max 2088ms

| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |
|---|---|---|---|---|---|---|
| pointerdown button | 2 | 213 | 2088 | 2088 | 34 | 8 |
| click button | 2 | 224 | 2088 | 2088 | 52 | 1692 |
| click next-round | 1 | 912 | 912 | 912 | 14 | 647 |
| pointerdown next-round | 1 | 838 | 838 | 838 | 5 | – |
| pointerdown option:color | 2 | 197 | 378 | 378 | 19 | 2 |
| click option:color | 2 | 197 | 377 | 377 | 28 | 59 |
| pointerdown rate | 2 | 196 | 364 | 364 | 43 | – |
| click rate | 2 | 196 | 363 | 363 | 47 | 36 |
| click shop-card | 1 | 291 | 291 | 291 | 12 | 139 |
| pointerdown shop-card | 1 | 290 | 290 | 290 | 3 | – |
| keydown key:ArrowRight | 2 | 256 | 256 | 256 | 50 | 15 |
| click space | 4 | 104 | 199 | 199 | 50 | 51 |
| pointerdown space | 4 | 142 | 199 | 199 | 21 | 7 |
| click wheel | 2 | 136 | 192 | 192 | 36 | 1 |
| keydown key:ArrowLeft | 4 | 144 | 177 | 177 | 20 | 4 |
| pointerdown pay | 2 | 115 | 149 | 149 | 24 | – |
| click pay | 2 | 115 | 148 | 148 | 30 | 38 |
| pointerdown wheel | 2 | 120 | 144 | 144 | 29 | 42 |

### Click → new state on screen (harness, wall clock)

| click | n | p50 | max | no change in 4s |
|---|---|---|---|---|
| setup | 2 | 763 | 1228 | 0 |
| place | 4 | 879 | 956 | 0 |
| followers | 2 | 842 | 1211 | 0 |
| pay | 2 | 994 | 1084 | 0 |
| recruit | 1 | 1881 | 1881 | 0 |
| next-round | 1 | 1040 | 1040 | 0 |

Clicks on a live option that changed nothing (tracer, 1.2s): 1 of 11 (card:15).

### Hover open delay (pointer over → card in the DOM; content = "You'd get" filled)

| target | n | p50 | p95 | max | content p95 | pointerover handler p95 |
|---|---|---|---|---|---|---|
| space | 37 | 72 | 146 | 165 | 146 | 1 |
| rim | 7 | 133 | 200 | 200 | 200 | 0 |
| shop-card | 15 | 92 | 141 | 141 | 141 | 1 |

Hovers whose card never showed (moved on first, or no card): 20.

### Long animation frames

LoAF: 382 frames ≥50ms, 120 over 100ms, total blocking 23445ms. Long tasks: 382, 45550ms total, max 1945ms.

| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |
|---|---|---|---|---|
| 2928 | 1972 | 1920 | 24 | DIV#root.onclick · xf · assets/index-DlAqF-QP.js:55911 · 1691 (forced layout 406) |
| 13 | 1774 | 44 | 0 | http://127.0.0.1:5369/assets/index-DlAqF-QP.js · ? · assets/index-DlAqF-QP.js:0 · 85 |
| 61561 | 1085 | 1018 | 231 | MessagePort.onmessage · hn · assets/index-DlAqF-QP.js:29785 · 834 (forced layout 228)<br>TimerHandler:setTimeout · ? · assets/App-CJxN-Cfk.js:103219 · 16 (forced layout 3) |
| 86981 | 735 | 682 | 23 | DIV#root.onclick · xf · assets/index-DlAqF-QP.js:55911 · 647 (forced layout 300) |
| 90395 | 679 | 584 | 46 | MessagePort.onmessage · hn · assets/index-DlAqF-QP.js:29785 · 586 (forced layout 126)<br>TimerHandler:setTimeout · ? · assets/App-CJxN-Cfk.js:103219 · 24 |
| 20468 | 678 | 601 | 77 | MessagePort.onmessage · hn · assets/index-DlAqF-QP.js:29785 · 569 (forced layout 135)<br>TimerHandler:setTimeout · ? · assets/App-CJxN-Cfk.js:103219 · 12 |
| 58064 | 612 | 533 | 73 | MessagePort.onmessage · hn · assets/index-DlAqF-QP.js:29785 · 509 (forced layout 173)<br>TimerHandler:setTimeout · ? · assets/App-CJxN-Cfk.js:103219 · 13 |
| 56863 | 565 | 458 | 97 | MessagePort.onmessage · hn · assets/index-DlAqF-QP.js:29785 · 406 (forced layout 42)<br>TimerHandler:setTimeout · ? · assets/App-CJxN-Cfk.js:12127 · 54 |
| 15617 | 551 | 468 | 114 | MessagePort.onmessage · hn · assets/index-DlAqF-QP.js:29785 · 403 (forced layout 83)<br>TimerHandler:setTimeout · ? · assets/App-CJxN-Cfk.js:103219 · 18 |
| 55821 | 519 | 467 | 91 | MessagePort.onmessage · hn · assets/index-DlAqF-QP.js:29785 · 426 (forced layout 101)<br>FrameRequestCallback · Ht · assets/CultSeat-CFDJPTDT.js:28183 · 34 (forced layout 20)<br>FrameRequestCallback · w · assets/index-DlAqF-QP.js:22787 · 8 |

### React commits per component (dev build actualDuration, inclusive of children)

Commits: 626; whole-tree commit p50 –ms, p95 –ms, max –ms.

| component | renders | p50 | p95 | max |
|---|---|---|---|---|

### Wheel spins (rAF-driven: one React render of the Wheel per frame)

| from° → to° | ms | frames | worst frame gap |
|---|---|---|---|
| 0 → 0 | 0 | 1 | 0 |
| -34 → 0 | 1402 | 17 | 327 |
| 68 → 0 | 1468 | 17 | 338 |
| -17 → 0 | 1578 | 15 | 371 |
| 65 → 0 | 1447 | 18 | 371 |

### Animations and transitions (every one that ran)

| animation | count | duration p50 | max | total ms | easing | loop |
|---|---|---|---|---|---|---|
| css-anim i.cs-min (cs-bob) | 28 | 4612 | 5299 | 126209 | linear | yes |
| css-anim svg.mark (turn) | 1 | 40000 | 40000 | 40000 | linear | yes |
| waapi ghost.piece-flight.piece-res.path-arc | 76 | 363 | 417 | 27874 | cubic-bezier(.45,0,.2,1) |  |
| waapi div.path-inner | 74 | 351 | 500 | 25247 | ease-out |  |
| css-anim svg.sprite (cult-shift) | 6 | 3353 | 3987 | 19861 | linear | yes |
| waapi button.card.lt-card[uid] | 18 | 883 | 1133 | 15951 | linear |  |
| waapi ghost.piece-flight.piece-fol.path-arc | 44 | 440 | 500 | 15580 | cubic-bezier(.45,0,.2,1) |  |
| css-trans path.wash (fill) | 104 | 150 | 150 | 15450 | ease |  |
| waapi ghost.card.lt-card.paper.dim.lt-deal | 17 | 885 | 1113 | 14786 | cubic-bezier(.3,.7,.4,1) |  |
| css-trans button.card.lt-card[uid] (filter) | 88 | 150 | 150 | 11700 | ease |  |
| css-anim svg.sprite (cult-breathe) | 3 | 3263 | 3736 | 9389 | linear | yes |
| css-anim span.tick.num (bump) | 29 | 260 | 420 | 9360 |  |  |
| waapi ghost.piece-flight.piece-res.pay.path-drop | 21 | 440 | 500 | 9330 | linear |  |
| waapi span.cs-stack | 39 | 180 | 240 | 7620 | cubic-bezier(.3,1.5,.5,1) |  |
| waapi span.cs-member | 14 | 260 | 973 | 7467 | linear |  |
| css-anim span.lead (cult-gesture) | 12 | 550 | 550 | 6600 | linear |  |
| waapi ghost.flight.card-flight | 7 | 883 | 973 | 5647 | linear |  |
| waapi span.worker | 24 | 180 | 310 | 5460 | linear |  |
| css-trans path.glow (opacity) | 36 | 150 | 150 | 4995 | ease |  |
| css-trans path.edge-lit (opacity) | 36 | 150 | 150 | 4995 | ease |  |
| css-anim g.blink (cult-blink) | 1 | 4700 | 4700 | 4700 | linear | yes |
| css-trans path.wash (filter) | 54 | 120 | 120 | 4407 | ease |  |
| css-anim span.worker-fig (panelland) | 14 | 300 | 300 | 4200 | linear |  |
| css-anim span.lead (cult-scheme) | 7 | 600 | 600 | 4200 | linear |  |
| waapi ghost.worker-flight.minion-flight.home | 12 | 340 | 340 | 4080 | cubic-bezier(.25,.6,.3,1) |  |
| css-anim span.reckon-count (rise) | 16 | 250 | 250 | 4000 | linear |  |
| css-anim span.dots (blink) | 3 | 1200 | 1200 | 3600 | linear | yes |
| css-anim span.worker (land) | 14 | 240 | 240 | 3360 | linear |  |
| css-anim span.tick.dip (bump) | 8 | 420 | 420 | 3360 | linear |  |
| css-anim span.tc-line (tcline) | 11 | 300 | 300 | 3300 | linear |  |
| css-trans button.card.lt-card[uid] (transform) | 28 | 120 | 120 | 3240 | ease |  |
| css-anim span.lead (cult-celebrate) | 4 | 800 | 800 | 3200 | linear |  |
| css-anim svg.leader (cult-breathe) | 1 | 3100 | 3100 | 3100 | linear | yes |
| css-trans button.fb.lt-rate (filter) | 24 | 150 | 150 | 3000 | ease |  |
| waapi ghost.worker-flight.minion-flight.path-arc | 10 | 280 | 280 | 2800 | cubic-bezier(.45,0,.2,1) |  |
| waapi ghost.flight.shop-out | 10 | 260 | 385 | 2725 | cubic-bezier(.5,0,.75,0) |  |
| waapi b.bundle-n | 7 | 440 | 440 | 2716 | linear |  |
| waapi span.cs-stack.zero | 12 | 240 | 240 | 2700 | cubic-bezier(.3,1.45,.5,1) |  |
| css-trans span.base (opacity) | 18 | 150 | 150 | 2700 | ease |  |
| css-trans span.face (opacity) | 18 | 150 | 150 | 2700 | ease |  |

### Waiting

Your turn ends → your next turn painted: p50 11936ms, p95 14533ms, max 14533ms (n 3).
Still moving when your turn came (finite animations running, time left): p50 1033ms, max 1133ms.

### Bot pacing

A bot's state → its move applied: p50 452ms, p95 1228ms. Applied → shown on the table: p50 2906ms, p95 4728ms, max 4761ms. Shown → painted p95 835ms. Gap between table steps: p50 763ms, p95 11729ms.
