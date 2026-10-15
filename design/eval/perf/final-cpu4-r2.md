# Perf run: final-cpu4-r2

2026-10-15T13:39:22.788Z · local (1 person + 3 Normal bots, normal speed) · CPU 4× · seed 20261015 · think 650ms · 547s wall
Load average before 0.54 / 0.57 / 2.69, after 1.26 / 1.22 / 2.08 (box: 4 CPUs). Vite HMR/reloads during the run: not watched.

## P1: 4 placements (1 in round II)

### Input → next paint (Event Timing; rAF fallback below 16ms)

All: n 38, p50 136ms, p95 2608ms, max 2608ms

| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |
|---|---|---|---|---|---|---|
| pointerdown button | 2 | 265 | 2608 | 2608 | 14 | 12 |
| click button | 2 | 272 | 2608 | 2608 | 31 | 2095 |
| pointerdown next-round | 1 | 1056 | 1056 | 1056 | 10 | 2 |
| click next-round | 1 | 1056 | 1056 | 1056 | 18 | 658 |
| pointerdown shop-card | 1 | 279 | 279 | 279 | 9 | – |
| click shop-card | 1 | 279 | 279 | 279 | 21 | 133 |
| pointerdown option:color | 2 | 107 | 201 | 201 | 35 | 2 |
| click option:color | 2 | 107 | 201 | 201 | 48 | 97 |
| pointerdown pay | 2 | 164 | 195 | 195 | 35 | 2 |
| click pay | 2 | 163 | 195 | 195 | 49 | 57 |
| keydown key:ArrowRight | 2 | 176 | 192 | 192 | 27 | 7 |
| click wheel | 2 | 136 | 192 | 192 | 46 | 1 |
| click rate | 2 | 116 | 160 | 160 | 37 | 28 |
| pointerdown rate | 2 | 116 | 151 | 151 | 33 | – |
| keydown key:ArrowLeft | 4 | 112 | 136 | 136 | 8 | 4 |
| pointerdown wheel | 2 | 88 | 104 | 104 | 20 | 24 |
| pointerdown space | 4 | 80 | 99 | 99 | 13 | 11 |
| click space | 4 | 79 | 98 | 98 | 32 | 52 |

### Click → new state on screen (harness, wall clock)

| click | n | p50 | max | no change in 4s |
|---|---|---|---|---|
| setup | 2 | 782 | 1428 | 0 |
| place | 4 | 875 | 1330 | 0 |
| followers | 2 | 909 | 1078 | 0 |
| pay | 2 | 973 | 1327 | 0 |
| recruit | 1 | 1167 | 1167 | 0 |
| next-round | 1 | 1012 | 1012 | 0 |

Clicks on a live option that changed nothing (tracer, 1.2s): 0 of 11.

### Hover open delay (pointer over → card in the DOM; content = "You'd get" filled)

| target | n | p50 | p95 | max | content p95 | pointerover handler p95 |
|---|---|---|---|---|---|---|
| space | 37 | 73 | 157 | 168 | 157 | 1 |
| rim | 7 | 131 | 171 | 171 | 171 | 1 |
| shop-card | 15 | 81 | 126 | 126 | 126 | 1 |

Hovers whose card never showed (moved on first, or no card): 22.

### Long animation frames

LoAF: 367 frames ≥50ms, 113 over 100ms, total blocking 24366ms. Long tasks: 362, 45616ms total, max 2403ms.

| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |
|---|---|---|---|---|
| 1854 | 2444 | 2382 | 29 | DIV#root.onclick · xf · assets/index-DlAqF-QP.js:55911 · 2092 (forced layout 410)<br>FrameRequestCallback · w · assets/index-DlAqF-QP.js:22787 · 6 |
| 60726 | 1013 | 951 | 168 | MessagePort.onmessage · hn · assets/index-DlAqF-QP.js:29785 · 833 (forced layout 336)<br>TimerHandler:setTimeout · ? · assets/App-CJxN-Cfk.js:103219 · 12 |
| 85842 | 755 | 700 | 37 | DIV#root.onclick · xf · assets/index-DlAqF-QP.js:55911 · 655 (forced layout 370) |
| 19829 | 664 | 562 | 63 | MessagePort.onmessage · hn · assets/index-DlAqF-QP.js:29785 · 549 (forced layout 152)<br>TimerHandler:setTimeout · ? · assets/App-CJxN-Cfk.js:103219 · 24<br>FrameRequestCallback · Ht · assets/CultSeat-CFDJPTDT.js:28183 · 17 |
| 13 | 603 | 96 | 15 | http://127.0.0.1:5369/assets/index-DlAqF-QP.js · ? · assets/index-DlAqF-QP.js:0 · 118 |
| 12233 | 586 | 534 | 37 | MessagePort.onmessage · hn · assets/index-DlAqF-QP.js:29785 · 547 (forced layout 182) |
| 86999 | 586 | 522 | 121 | MessagePort.onmessage · hn · assets/index-DlAqF-QP.js:29785 · 451 (forced layout 81) |
| 63787 | 572 | 521 | 58 | MessagePort.onmessage · hn · assets/index-DlAqF-QP.js:29785 · 512 (forced layout 91) |
| 17344 | 554 | 472 | 73 | MessagePort.onmessage · hn · assets/index-DlAqF-QP.js:29785 · 446 (forced layout 122)<br>TimerHandler:setTimeout · ? · assets/App-CJxN-Cfk.js:103219 · 23 |
| 62116 | 550 | 497 | 106 | MessagePort.onmessage · hn · assets/index-DlAqF-QP.js:29785 · 440 (forced layout 111) |

### React commits per component (dev build actualDuration, inclusive of children)

Commits: 622; whole-tree commit p50 –ms, p95 –ms, max –ms.

| component | renders | p50 | p95 | max |
|---|---|---|---|---|

### Wheel spins (rAF-driven: one React render of the Wheel per frame)

| from° → to° | ms | frames | worst frame gap |
|---|---|---|---|
| 0 → 0 | 0 | 1 | 0 |
| -22 → 0 | 1517 | 19 | 371 |
| 67 → 0 | 1390 | 18 | 374 |
| -17 → 0 | 1387 | 18 | 373 |
| 73 → 0 | 1385 | 15 | 357 |

### Animations and transitions (every one that ran)

| animation | count | duration p50 | max | total ms | easing | loop |
|---|---|---|---|---|---|---|
| css-anim i.cs-min (cs-bob) | 27 | 4612 | 5299 | 121597 | linear | yes |
| css-anim svg.mark (turn) | 1 | 40000 | 40000 | 40000 | linear | yes |
| waapi ghost.piece-flight.piece-res.path-arc | 76 | 363 | 417 | 27874 | cubic-bezier(.45,0,.2,1) |  |
| waapi div.path-inner | 74 | 351 | 500 | 25247 | ease-out |  |
| css-anim svg.sprite (cult-shift) | 6 | 3353 | 3987 | 19861 | linear | yes |
| waapi button.card.lt-card[uid] | 18 | 883 | 1133 | 15951 | linear |  |
| waapi ghost.piece-flight.piece-fol.path-arc | 44 | 440 | 500 | 15580 | cubic-bezier(.45,0,.2,1) |  |
| css-trans path.wash (fill) | 104 | 150 | 150 | 15300 | ease |  |
| waapi ghost.card.lt-card.paper.dim.lt-deal | 17 | 885 | 1113 | 14786 | cubic-bezier(.3,.7,.4,1) |  |
| css-trans button.card.lt-card[uid] (filter) | 88 | 150 | 150 | 10200 | ease |  |
| css-anim svg.sprite (cult-breathe) | 3 | 3263 | 3736 | 9389 | linear | yes |
| waapi ghost.piece-flight.piece-res.pay.path-drop | 21 | 440 | 500 | 9330 | linear |  |
| css-anim span.tick.num (bump) | 29 | 260 | 420 | 9200 | linear |  |
| waapi span.cs-stack | 39 | 180 | 240 | 7620 | cubic-bezier(.3,1.5,.5,1) |  |
| waapi span.cs-member | 14 | 260 | 973 | 7467 | linear |  |
| css-anim span.lead (cult-gesture) | 13 | 550 | 550 | 7150 | linear |  |
| waapi ghost.flight.card-flight | 7 | 883 | 973 | 5647 | linear |  |
| waapi span.worker | 24 | 180 | 310 | 5460 | linear |  |
| css-trans path.glow (opacity) | 36 | 150 | 150 | 4989 | ease |  |
| css-trans path.edge-lit (opacity) | 36 | 150 | 150 | 4989 | ease |  |
| css-anim g.blink (cult-blink) | 1 | 4700 | 4700 | 4700 | linear | yes |
| css-trans path.wash (filter) | 53 | 120 | 120 | 4269 | ease |  |
| css-anim span.worker-fig (panelland) | 14 | 300 | 300 | 4200 | linear |  |
| css-anim span.lead (cult-scheme) | 7 | 600 | 600 | 4200 | linear |  |
| waapi ghost.worker-flight.minion-flight.home | 12 | 340 | 340 | 4080 | cubic-bezier(.25,.6,.3,1) |  |
| css-anim span.reckon-count (rise) | 16 | 250 | 250 | 4000 | linear |  |
| css-anim span.dots (blink) | 3 | 1200 | 1200 | 3600 | linear | yes |
| css-anim span.worker (land) | 14 | 240 | 240 | 3360 | linear |  |
| css-anim span.tick.dip (bump) | 8 | 420 | 420 | 3360 | linear |  |
| css-trans button.card.lt-card[uid] (transform) | 28 | 120 | 120 | 3240 | ease |  |
| css-anim span.lead (cult-celebrate) | 4 | 800 | 800 | 3200 | linear |  |
| css-anim svg.leader (cult-breathe) | 1 | 3100 | 3100 | 3100 | linear | yes |
| waapi ghost.worker-flight.minion-flight.path-arc | 10 | 280 | 280 | 2800 | cubic-bezier(.45,0,.2,1) |  |
| waapi ghost.flight.shop-out | 10 | 260 | 385 | 2725 | cubic-bezier(.5,0,.75,0) |  |
| waapi b.bundle-n | 7 | 440 | 440 | 2716 | linear |  |
| waapi span.cs-stack.zero | 12 | 240 | 240 | 2700 | cubic-bezier(.3,1.45,.5,1) |  |
| css-anim span.tc-line (tcline) | 11 | 300 | 300 | 2700 | linear |  |
| css-trans button.fb.lt-rate (filter) | 24 | 150 | 150 | 2400 | ease |  |
| css-trans div.turn-card.folding (opacity) | 5 | 450 | 450 | 2250 | ease |  |
| css-trans div.turn-card.folding (transform) | 5 | 450 | 450 | 2250 | cubic-bezier(0.5, 0, 0.7, 0.4) |  |

### Waiting

Your turn ends → your next turn painted: p50 12022ms, p95 14592ms, max 14592ms (n 3).
Still moving when your turn came (finite animations running, time left): p50 1033ms, max 1133ms.

### Bot pacing

A bot's state → its move applied: p50 435ms, p95 969ms. Applied → shown on the table: p50 2516ms, p95 4791ms, max 4952ms. Shown → painted p95 695ms. Gap between table steps: p50 822ms, p95 11750ms.
