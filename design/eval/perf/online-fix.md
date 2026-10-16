# Perf run: online-fix

2026-10-15T10:26:37.558Z · online (RTDB emulator, 2 people + 2 bots, lag 80ms each way) · CPU 4× · seed 20261015 · think 650ms · 562s wall
Load average before 22.78 / 21.27 / 18.76, after 30.45 / 30.83 / 25.01 (box: 4 CPUs). Vite HMR/reloads during the run: not watched.

Errors: guest: place-confirm click changed nothing (Your turn — place a minion on a glowing space) | host: place-confirm click changed nothing (Your turn — recruit or buy) | host: place-confirm click changed nothing (Your turn — recruit or buy)

## host: 3 placements (0 in round II)

### Input → next paint (Event Timing; rAF fallback below 16ms)

All: n 31, p50 1208ms, p95 4072ms, max 4880ms

| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |
|---|---|---|---|---|---|---|
| click shop-card | 2 | 2128 | 4880 | 4880 | 133 | 28 |
| keydown key:ArrowLeft | 2 | 2488 | 4072 | 4072 | 1307 | 8 |
| pointerdown shop-card | 2 | 2128 | 3117 | 3117 | 123 | 0 |
| click wheel | 1 | 3016 | 3016 | 3016 | 560 | 0 |
| click space | 3 | 2552 | 2592 | 2592 | 92 | 1636 |
| pointerdown space | 3 | 833 | 2552 | 2552 | 52 | 14 |
| keydown key:ArrowRight | 1 | 2224 | 2224 | 2224 | 270 | 141 |
| pointerdown button | 4 | 56 | 2120 | 2120 | 18 | 6 |
| click button | 4 | 56 | 2016 | 2016 | 26 | 7 |
| pointerdown wheel | 1 | 1637 | 1637 | 1637 | 30 | – |
| click option:color | 2 | 120 | 1344 | 1344 | 57 | 34 |
| pointerdown place-confirm | 2 | 360 | 793 | 793 | 228 | – |
| click place-confirm | 2 | 360 | 793 | 793 | 360 | – |
| pointerdown option:color | 2 | 56 | 202 | 202 | 39 | – |

### Click → new state on screen (harness, wall clock)

| click | n | p50 | max | no change in 4s |
|---|---|---|---|---|
| setup | 2 | 2369 | 5276 | 0 |
| place | 3 | 3144 | 4585 | 0 |
| place-confirm | 2 | – | – | 2 |
| recruit | 2 | 3881 | 5438 | 0 |

Clicks on a live option that changed nothing (tracer, 1.2s): 0 of 9.

### Hover open delay (pointer over → card in the DOM; content = "You'd get" filled)

| target | n | p50 | p95 | max | content p95 | pointerover handler p95 |
|---|---|---|---|---|---|---|
| space | 19 | 621 | 1772 | 1772 | 1772 | 0 |
| shop-card | 14 | 1012 | 3227 | 3227 | 3227 | 1 |
| rim | 3 | 903 | 3342 | 3342 | 3342 | 7 |

Hovers whose card never showed (moved on first, or no card): 22.

### Long animation frames

LoAF: 632 frames ≥50ms, 606 over 100ms, total blocking 213753ms. Long tasks: 721, 276476ms total, max 5953ms.

| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |
|---|---|---|---|---|
| 311212 | 7210 | 6702 | 47 | MessagePort.onmessage · hn · assets/index-DBvgQSb1.js:29785 · 5953 (forced layout 4101)<br>TimerHandler:setTimeout · ? · assets/index-DBvgQSb1.js:15955 · 707 (forced layout 635)<br>TimerHandler:setTimeout · ? · assets/index-DBvgQSb1.js:15955 · 16 |
| 28161 | 4811 | 3914 | 29 | MessagePort.onmessage · hn · assets/index-DBvgQSb1.js:29785 · 3227 (forced layout 944) |
| 341230 | 4555 | 2004 | 1245 | MessagePort.onmessage · hn · assets/index-DBvgQSb1.js:29785 · 524 (forced layout 291)<br>DIV#root.onpointerover · Pf · assets/index-DBvgQSb1.js:56024 · 153 (forced layout 130)<br>FrameRequestCallback · w · assets/index-DBvgQSb1.js:22787 · 116 |
| 191508 | 4553 | 4460 | 42 | MessagePort.onmessage · hn · assets/index-DBvgQSb1.js:29785 · 4467 (forced layout 1930) |
| 399845 | 4368 | 3665 | 154 | MessagePort.onmessage · hn · assets/index-DBvgQSb1.js:29785 · 3077 (forced layout 1461)<br>FrameRequestCallback · ? · :-1 · 107<br>MessagePort.onmessage · hn · assets/index-DBvgQSb1.js:29785 · 24 |
| 484650 | 3935 | 2284 | 44 | MessagePort.onmessage · hn · assets/index-DBvgQSb1.js:29785 · 1827 (forced layout 661)<br>TimerHandler:setTimeout · ? · :-1 · 104<br>DOMWebSocket.onmessage · ? · assets/index.esm-DH8C4Ikr.js:85947 · 55 |
| 87353 | 3646 | 1495 | 68 | DOMWebSocket.onmessage · ? · assets/index.esm-DH8C4Ikr.js:85947 · 6<br>TimerHandler:setTimeout · ? · :-1 · 5 |
| 435932 | 3615 | 609 | 75 | DIV#root.onanimationiteration · ci · assets/index-DBvgQSb1.js:56137 · 16<br>TimerHandler:setTimeout · ? · assets/index-DBvgQSb1.js:15955 · 12 |
| 165313 | 3506 | 3150 | 138 | MessagePort.onmessage · hn · assets/index-DBvgQSb1.js:29785 · 2578 (forced layout 396)<br>DIV#root.onanimationiteration · ci · assets/index-DBvgQSb1.js:56137 · 80<br>DOMWebSocket.onmessage · ? · assets/index.esm-DH8C4Ikr.js:85947 · 58 |
| 326794 | 3223 | 1298 | 21 | DIV#root.onpointerout · Pf · assets/index-DBvgQSb1.js:56024 · 366 (forced layout 242) |

### React commits per component (dev build actualDuration, inclusive of children)

Commits: 318; whole-tree commit p50 –ms, p95 –ms, max –ms.

| component | renders | p50 | p95 | max |
|---|---|---|---|---|

### Wheel spins (rAF-driven: one React render of the Wheel per frame)

| from° → to° | ms | frames | worst frame gap |
|---|---|---|---|
| 0 → 0 | 0 | 1 | 0 |
| 81 → 90 | 840 | 2 | 840 |
| 90 → 0 | 1706 | 6 | 878 |
| 6 → 6 | 0 | 1 | 0 |
| 12 → 30 | 2225 | 4 | 973 |
| 36 → 36 | 0 | 1 | 0 |
| 42 → 42 | 0 | 1 | 0 |
| 48 → 48 | 0 | 1 | 0 |
| 54 → 0 | 4289 | 10 | 762 |

### Animations and transitions (every one that ran)

| animation | count | duration p50 | max | total ms | easing | loop |
|---|---|---|---|---|---|---|
| css-anim i.cs-min (cs-bob) | 10 | 4187 | 5137 | 43283 | linear | yes |
| css-anim svg.mark (turn) | 1 | 40000 | 40000 | 40000 | linear | yes |
| css-anim svg.sprite (cult-shift) | 5 | 2773 | 3947 | 15570 | linear | yes |
| waapi ghost.piece-flight.piece-res.path-arc | 34 | 354 | 392 | 11924 | cubic-bezier(.45,0,.2,1) |  |
| waapi div.path-inner | 28 | 351 | 440 | 9624 | ease-out |  |
| waapi button.card.lt-card[uid] | 15 | 400 | 680 | 6600 | linear |  |
| waapi ghost.piece-flight.piece-res.pay.path-drop | 14 | 440 | 440 | 6160 | linear |  |
| css-anim g.blink (cult-blink) | 1 | 4700 | 4700 | 4700 | linear | yes |
| waapi ghost.piece-flight.piece-fol.path-arc | 10 | 440 | 440 | 4364 | cubic-bezier(.45,0,.2,1) |  |
| css-anim svg.sprite (cult-breathe) | 1 | 3947 | 3947 | 3947 | linear | yes |
| waapi span.cs-stack | 20 | 180 | 240 | 3780 | cubic-bezier(.3,1.5,.5,1) |  |
| waapi ghost.card.lt-card.paper.recede.lt-deal | 7 | 460 | 660 | 3300 | cubic-bezier(.3,.7,.4,1) |  |
| css-anim svg.leader (cult-breathe) | 1 | 3100 | 3100 | 3100 | linear | yes |
| waapi span.cs-stack.zero | 11 | 240 | 240 | 2640 | cubic-bezier(.3,1.45,.5,1) |  |
| css-anim span.dots (blink) | 2 | 1200 | 1200 | 2400 | linear | yes |
| waapi span.worker | 10 | 180 | 310 | 2240 | linear |  |
| css-anim section.prompt.choice (cta-pulse) | 1 | 1500 | 1500 | 1500 | linear |  |
| waapi ghost.card.lt-card.paper.dim.lt-deal | 5 | 300 | 300 | 1500 | cubic-bezier(.3,.7,.4,1) |  |
| waapi ghost.card.lt-card.paper.can.lit.lt-deal | 3 | 580 | 620 | 1500 | cubic-bezier(.3,.7,.4,1) |  |
| css-anim span.worker (land) | 5 | 240 | 240 | 1200 | linear |  |
| waapi ghost.worker-flight.minion-flight.path-arc | 4 | 280 | 280 | 1120 | cubic-bezier(.45,0,.2,1) |  |
| waapi span.cs-total.lead | 4 | 180 | 180 | 720 | cubic-bezier(.3,1.5,.5,1) |  |
| waapi ghost.worker-flight.minion-flight.trail.path-arc | 4 | 180 | 180 | 720 | cubic-bezier(.45,0,.2,1) |  |
| waapi span.base | 6 | 90 | 140 | 640 | cubic-bezier(.3,1.4,.5,1) |  |
| css-trans button.btn (background-color) | 4 | 150 | 150 | 600 | ease |  |
| css-anim section.prompt.choice (rise) | 2 | 250 | 250 | 250 | linear |  |
| css-trans button.btn.pri (transform) | 2 | 70 | 120 | 190 | cubic-bezier(0.2, 0.7, 0.3, 1) |  |
| waapi span.cs-total | 1 | 180 | 180 | 180 | cubic-bezier(.3,1.5,.5,1) |  |
| css-trans button.btn.pri (background-color) | 1 | 150 | 150 | 150 | ease |  |
| css-trans path.rim-hit (fill) | 4 | 150 | 150 | 150 |  |  |
| css-trans button.btn.big (background-color) | 1 | – | – | 0 |  |  |
| css-trans button.btn.big (transform) | 1 | – | – | 0 |  |  |
| css-trans button.btn (transform) | 2 | – | – | 0 |  |  |
| css-trans section.lt-seat.lt-seat-1[slot] (transform) | 2 | – | – | 0 |  |  |
| css-trans section.lt-seat.lt-seat-2[slot] (transform) | 2 | – | – | 0 |  |  |
| css-trans section.lt-seat.lt-seat-3[slot] (transform) | 2 | – | – | 0 |  |  |
| css-trans svg.res-glyph (transform) | 2 | – | – | 0 |  |  |
| css-trans section.lt-seat.lt-seat-0[slot] (background-color) | 3 | – | – | 0 |  |  |
| css-trans section.lt-seat.lt-seat-0[slot] (box-shadow) | 3 | – | – | 0 |  |  |
| css-trans section.lt-seat.lt-seat-1[slot] (background-color) | 5 | – | – | 0 |  |  |

### Waiting

Your turn ends → your next turn painted: p50 173283ms, p95 173283ms, max 173283ms (n 1).
Still moving when your turn came (finite animations running, time left): p50 600ms, max 600ms.

### Bot pacing

A bot's state → its move applied: p50 1363ms, p95 3349ms. Applied → shown on the table: p50 654ms, p95 2312ms, max 2312ms. Shown → painted p95 2300ms. Gap between table steps: p50 2415ms, p95 118255ms.

### Online round trips (this person's moves)

States received: 50. Sent → host applied p50 252ms, p95 519ms; → received p50 647ms, p95 1088ms, max 1088ms; → painted p50 2963ms, p95 7596ms.
State snapshot size: 4716–8371 bytes (the whole game state as JSON, every move).

## guest: 3 placements (0 in round II)

### Input → next paint (Event Timing; rAF fallback below 16ms)

All: n 23, p50 1583ms, p95 3600ms, max 3816ms

| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |
|---|---|---|---|---|---|---|
| click option:color | 2 | 2232 | 3816 | 3816 | 99 | 30 |
| keydown key:ArrowLeft | 2 | 2184 | 3600 | 3600 | 221 | 76 |
| click place-confirm | 2 | 3392 | 3408 | 3408 | 521 | 154 |
| keydown key:ArrowRight | 1 | 3112 | 3112 | 3112 | 7 | 2 |
| pointerdown place-confirm | 2 | 704 | 2824 | 2824 | 504 | – |
| click shop-card | 1 | 2616 | 2616 | 2616 | 291 | 177 |
| click space | 2 | 1284 | 2584 | 2584 | 102 | 384 |
| pointerdown wheel | 1 | 2001 | 2001 | 2001 | 15 | – |
| pointerdown option:color | 2 | 873 | 1583 | 1583 | 86 | – |
| click other | 1 | 1552 | 1552 | 1552 | 16 | 0 |
| pointerdown space | 2 | 281 | 1284 | 1284 | 92 | 1 |
| click wheel | 1 | 1144 | 1144 | 1144 | 30 | 0 |
| pointerdown other | 1 | 779 | 779 | 779 | 13 | – |
| pointerdown shop-card | 1 | 590 | 590 | 590 | 262 | – |
| click button | 1 | 248 | 248 | 248 | 87 | 71 |
| pointerdown button | 1 | 219 | 219 | 219 | 34 | – |

### Click → new state on screen (harness, wall clock)

| click | n | p50 | max | no change in 4s |
|---|---|---|---|---|
| setup | 2 | 3175 | 3890 | 0 |
| place | 3 | 1572 | 3489 | 0 |
| place-confirm | 2 | 4339 | 4339 | 1 |
| recruit | 1 | 3936 | 3936 | 0 |

Clicks on a live option that changed nothing (tracer, 1.2s): 0 of 7.

### Hover open delay (pointer over → card in the DOM; content = "You'd get" filled)

| target | n | p50 | p95 | max | content p95 | pointerover handler p95 |
|---|---|---|---|---|---|---|
| space | 25 | 832 | 2517 | 4121 | 2517 | 0 |
| shop-card | 10 | 1606 | 2816 | 2816 | 2816 | 1 |
| rim | 1 | 1700 | 1700 | 1700 | 1700 | 0 |

Hovers whose card never showed (moved on first, or no card): 21.

### Long animation frames

LoAF: 682 frames ≥50ms, 645 over 100ms, total blocking 202486ms. Long tasks: 738, 270685ms total, max 3627ms.

| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |
|---|---|---|---|---|
| 307513 | 4763 | 3935 | 22 | MessagePort.onmessage · hn · assets/index-DBvgQSb1.js:29785 · 3627 (forced layout 2921)<br>TimerHandler:setTimeout · ? · assets/index-DBvgQSb1.js:15955 · 326 (forced layout 323)<br>DOMWebSocket.onmessage · ? · assets/index.esm-DH8C4Ikr.js:85947 · 7 |
| 283101 | 3835 | 206 | 3 | TimerHandler:setInterval · ? · assets/index-DBvgQSb1.js:27121 · 19 |
| 63614 | 3799 | 2322 | 373 | DIV#root.onpointerout · Pf · assets/index-DBvgQSb1.js:56024 · 1179 (forced layout 1080)<br>BODY.onmouseout · Pf · assets/index-DBvgQSb1.js:56024 · 144<br>ResizeObserverCallback · ? · assets/CultSeat-BpViMxIj.js:52417 · 121 |
| 414338 | 3400 | 1575 | 19 | MessagePort.onmessage · hn · assets/index-DBvgQSb1.js:29785 · 374<br>DIV#root.onanimationiteration · ci · assets/index-DBvgQSb1.js:56137 · 6 |
| 186791 | 3330 | 3230 | 49 | MessagePort.onmessage · hn · assets/index-DBvgQSb1.js:29785 · 3230 (forced layout 1985)<br>TimerHandler:setTimeout · ? · assets/index-DBvgQSb1.js:15955 · 18 (forced layout 7)<br>TimerHandler:setTimeout · ? · assets/index-DBvgQSb1.js:15955 · 10 |
| 398269 | 3038 | 675 | 19 | (no script: style/layout/paint) |
| 322452 | 2942 | 1285 | 4 | TimerHandler:setInterval · ? · assets/index-DBvgQSb1.js:27121 · 139 |
| 344955 | 2908 | 1156 | 21 | TimerHandler:setInterval · ? · assets/index-DBvgQSb1.js:27121 · 108 |
| 422684 | 2869 | 1770 | 948 | DIV#root.onpointerout · Pf · assets/index-DBvgQSb1.js:56024 · 477 (forced layout 414)<br>MessagePort.onmessage · hn · assets/index-DBvgQSb1.js:29785 · 104<br>MessagePort.onmessage · hn · assets/index-DBvgQSb1.js:29785 · 53 |
| 171171 | 2817 | 117 | 2 | DOMWebSocket.onmessage · ? · assets/index.esm-DH8C4Ikr.js:85947 · 8 |

### React commits per component (dev build actualDuration, inclusive of children)

Commits: 306; whole-tree commit p50 –ms, p95 –ms, max –ms.

| component | renders | p50 | p95 | max |
|---|---|---|---|---|

### Wheel spins (rAF-driven: one React render of the Wheel per frame)

| from° → to° | ms | frames | worst frame gap |
|---|---|---|---|
| 0 → 0 | 0 | 1 | 0 |
| 860 → 860 | 0 | 1 | 0 |
| -90 → -90 | 254 | 3 | 254 |
| -84 → -84 | 0 | 1 | 0 |
| -78 → -78 | 0 | 1 | 0 |
| -72 → -60 | 1202 | 3 | 693 |
| -54 → -54 | 0 | 1 | 0 |
| -48 → -48 | 0 | 1 | 0 |
| -42 → -42 | 0 | 1 | 0 |
| -36 → 0 | 1540 | 4 | 620 |
| 0 → 0 | 0 | 2 | 0 |
| -90 → -90 | 0 | 1 | 0 |
| -90 → -90 | 0 | 2 | 0 |

### Animations and transitions (every one that ran)

| animation | count | duration p50 | max | total ms | easing | loop |
|---|---|---|---|---|---|---|
| css-anim i.cs-min (cs-bob) | 12 | 4450 | 5299 | 53618 | linear | yes |
| css-anim svg.mark (turn) | 1 | 40000 | 40000 | 40000 | linear | yes |
| css-anim svg.sprite (cult-shift) | 5 | 2773 | 3947 | 15570 | linear | yes |
| waapi ghost.piece-flight.piece-res.path-arc | 34 | 351 | 379 | 11672 | cubic-bezier(.45,0,.2,1) |  |
| waapi div.path-inner | 28 | 348 | 440 | 9498 | ease-out |  |
| waapi button.card.lt-card[uid] | 15 | 400 | 680 | 6600 | linear |  |
| waapi ghost.card.lt-card.paper.dim.lt-deal | 15 | 380 | 660 | 6300 | cubic-bezier(.3,.7,.4,1) |  |
| waapi ghost.piece-flight.piece-res.pay.path-drop | 14 | 440 | 440 | 6160 | linear |  |
| css-anim g.blink (cult-blink) | 1 | 4700 | 4700 | 4700 | linear | yes |
| waapi ghost.piece-flight.piece-fol.path-arc | 10 | 440 | 440 | 4364 | cubic-bezier(.45,0,.2,1) |  |
| css-anim svg.sprite (cult-breathe) | 1 | 3947 | 3947 | 3947 | linear | yes |
| waapi span.cs-stack | 20 | 180 | 240 | 3780 | cubic-bezier(.3,1.5,.5,1) |  |
| css-anim span.dots (blink) | 3 | 1200 | 1200 | 3600 | linear | yes |
| css-anim svg.leader (cult-breathe) | 1 | 3100 | 3100 | 3100 | linear | yes |
| waapi span.cs-stack.zero | 11 | 240 | 240 | 2640 | cubic-bezier(.3,1.45,.5,1) |  |
| waapi span.worker | 10 | 180 | 310 | 2240 | linear |  |
| css-anim section.prompt.choice (cta-pulse) | 1 | 1500 | 1500 | 1500 | linear |  |
| css-anim span.worker (land) | 5 | 240 | 240 | 1200 | linear |  |
| waapi ghost.worker-flight.minion-flight.path-arc | 4 | 280 | 280 | 1120 | cubic-bezier(.45,0,.2,1) |  |
| waapi span.cs-total.lead | 4 | 180 | 180 | 720 | cubic-bezier(.3,1.5,.5,1) |  |
| waapi ghost.worker-flight.minion-flight.trail.path-arc | 4 | 180 | 180 | 720 | cubic-bezier(.45,0,.2,1) |  |
| waapi span.base | 6 | 90 | 140 | 640 | cubic-bezier(.3,1.4,.5,1) |  |
| css-anim section.prompt.choice (rise) | 2 | 250 | 250 | 250 | linear |  |
| waapi span.cs-total | 1 | 180 | 180 | 180 | cubic-bezier(.3,1.5,.5,1) |  |
| css-trans button.btn (transform) | 1 | – | – | 0 |  |  |
| css-trans button.btn (background-color) | 1 | – | – | 0 |  |  |
| css-trans section.lt-seat.lt-seat-0[slot] (transform) | 2 | – | – | 0 |  |  |
| css-trans section.lt-seat.lt-seat-1[slot] (transform) | 2 | – | – | 0 |  |  |
| css-trans section.lt-seat.lt-seat-2[slot] (transform) | 2 | – | – | 0 |  |  |
| css-trans section.lt-seat.lt-seat-0[slot] (background-color) | 5 | – | – | 0 |  |  |
| css-trans section.lt-seat.lt-seat-0[slot] (box-shadow) | 5 | – | – | 0 |  |  |
| css-trans section.lt-seat.lt-seat-3[slot] (background-color) | 3 | – | – | 0 |  |  |
| css-trans section.lt-seat.lt-seat-3[slot] (box-shadow) | 3 | – | – | 0 |  |  |
| css-trans section.lt-shop (filter) | 6 | – | – | 0 |  |  |
| css-trans div.lt-hover.popover (opacity) | 10 | – | – | 0 |  |  |
| css-trans svg.res-glyph (transform) | 3 | – | – | 0 |  |  |
| css-trans section.lt-seat.lt-seat-1[slot] (background-color) | 4 | – | – | 0 |  |  |
| css-trans section.lt-seat.lt-seat-1[slot] (box-shadow) | 4 | – | – | 0 |  |  |
| css-trans section.lt-seat.lt-seat-2[slot] (background-color) | 2 | – | – | 0 |  |  |
| css-trans section.lt-seat.lt-seat-2[slot] (box-shadow) | 2 | – | – | 0 |  |  |

### Waiting

Your turn ends → your next turn painted: p50 17054ms, p95 231606ms, max 231606ms (n 2).
Still moving when your turn came (finite animations running, time left): p50 600ms, max 600ms.

### Bot pacing

A bot's state → its move applied: p50 1537ms, p95 3623ms. Applied → shown on the table: p50 459ms, p95 1976ms, max 1976ms. Shown → painted p95 1937ms. Gap between table steps: p50 3746ms, p95 115158ms.

### Online round trips (this person's moves)

States received: 25. Sent → host applied p50 612ms, p95 3430ms; → received p50 962ms, p95 4360ms, max 4360ms; → painted p50 2369ms, p95 5632ms.
State snapshot size: 4744–9009 bytes (the whole game state as JSON, every move).
