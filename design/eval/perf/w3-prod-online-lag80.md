# Perf run: w3-prod-online-lag80

2026-10-15T09:46:53.667Z · online (RTDB emulator, 2 people + 2 bots, lag 80ms each way) · CPU 4× · seed 20261015 · think 650ms · 556s wall
Load average before 1.15 / 1.37 / 1.76, after 3.84 / 3.56 / 2.76 (box: 4 CPUs). Vite HMR/reloads during the run: not watched.

## host: 4 placements (1 in round II)

### Input → next paint (Event Timing; rAF fallback below 16ms)

All: n 48, p50 464ms, p95 976ms, max 1488ms

| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |
|---|---|---|---|---|---|---|
| click button | 4 | 44 | 1488 | 1488 | 32 | 33 |
| pointerdown wheel | 2 | 177 | 1320 | 1320 | 129 | 18 |
| pointerdown next-round | 1 | 976 | 976 | 976 | 51 | 0 |
| click next-round | 1 | 976 | 976 | 976 | 52 | 565 |
| click space | 4 | 648 | 784 | 784 | 48 | 268 |
| keydown key:ArrowRight | 2 | 488 | 760 | 760 | 35 | 5 |
| keydown key:ArrowLeft | 4 | 528 | 672 | 672 | 134 | 3 |
| click wheel | 2 | 464 | 648 | 648 | 36 | 1 |
| click place-confirm | 4 | 576 | 648 | 648 | 38 | 45 |
| click rate | 3 | 560 | 600 | 600 | 191 | 22 |
| pointerdown pay | 1 | 576 | 576 | 576 | 29 | 0 |
| click pay | 1 | 576 | 576 | 576 | 47 | 23 |
| pointerdown space | 4 | 321 | 358 | 358 | 19 | – |
| pointerdown option:color | 2 | 73 | 320 | 320 | 26 | 1 |
| click option:color | 2 | 200 | 320 | 320 | 34 | 38 |
| pointerdown rate | 3 | 274 | 306 | 306 | 57 | – |
| pointerdown place-confirm | 4 | 214 | 230 | 230 | 17 | – |
| pointerdown button | 4 | 44 | 73 | 73 | 18 | – |

### Click → new state on screen (harness, wall clock)

| click | n | p50 | max | no change in 4s |
|---|---|---|---|---|
| setup | 2 | 1109 | 1467 | 0 |
| place | 4 | 820 | 1045 | 0 |
| place-confirm | 4 | 1810 | 2321 | 0 |
| followers | 3 | 2030 | 2276 | 0 |
| pay | 1 | 1623 | 1623 | 0 |
| next-round | 1 | 1746 | 1746 | 0 |

Clicks on a live option that changed nothing (tracer, 1.2s): 4 of 10 (slot:1-1, slot:2-2, slot:2-0, slot:1-3).

### Hover open delay (pointer over → card in the DOM; content = "You'd get" filled)

| target | n | p50 | p95 | max | content p95 | pointerover handler p95 |
|---|---|---|---|---|---|---|
| rim | 5 | 521 | 783 | 783 | 783 | 1 |
| space | 36 | 327 | 768 | 1131 | 820 | 2 |
| shop-card | 14 | 290 | 706 | 706 | 706 | 0 |
| tip | 3 | 641 | 718 | 718 | 718 | 0 |

Hovers whose card never showed (moved on first, or no card): 23.

### Long animation frames

LoAF: 2246 frames ≥50ms, 1850 over 100ms, total blocking 151287ms. Long tasks: 1333, 231542ms total, max 2393ms.

| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |
|---|---|---|---|---|
| 163598 | 2883 | 2782 | 332 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 2393 (forced layout 1848) |
| 6901 | 1388 | 1285 | 22 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 1228 (forced layout 394) |
| 199625 | 1198 | 1133 | 42 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 1140 (forced layout 776)<br>FrameRequestCallback · w · assets/index-Cwu4GImh.js:22538 · 6 |
| 99547 | 915 | 736 | 678 | FrameRequestCallback · ht · assets/CultSeat-C79IAyZ-.js:23419 · 540 (forced layout 514)<br>MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 27 |
| 61993 | 882 | 576 | 467 | (no script: style/layout/paint) |
| 60673 | 874 | 819 | 34 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 834 (forced layout 474)<br>FrameRequestCallback · w · assets/index-Cwu4GImh.js:22538 · 6 |
| 98646 | 864 | 646 | 32 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 593 (forced layout 275)<br>TimerHandler:setTimeout · ? · :-1 · 7<br>TimerHandler:setTimeout · ? · assets/index-Cwu4GImh.js:15955 · 6 |
| 162115 | 837 | 733 | 668 | FrameRequestCallback · ht · assets/CultSeat-C79IAyZ-.js:23419 · 467 (forced layout 452)<br>TimerHandler:setTimeout · ? · assets/App-tGzvX9QR.js:32826 · 37<br>FrameRequestCallback · w · assets/index-Cwu4GImh.js:22538 · 5 |
| 217725 | 831 | 728 | 41 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 649 (forced layout 318)<br>FrameRequestCallback · ? · :-1 · 10 |
| 154787 | 828 | 719 | 249 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 484 (forced layout 199) |

### React commits per component (dev build actualDuration, inclusive of children)

Commits: 637; whole-tree commit p50 –ms, p95 –ms, max –ms.

| component | renders | p50 | p95 | max |
|---|---|---|---|---|

### Wheel spins (rAF-driven: one React render of the Wheel per frame)

| from° → to° | ms | frames | worst frame gap |
|---|---|---|---|
| 0 → 0 | 0 | 1 | 0 |
| 88 → 0 | 6614 | 30 | 912 |
| 72 → 0 | 7036 | 29 | 998 |

### Animations and transitions (every one that ran)

| animation | count | duration p50 | max | total ms | easing | loop |
|---|---|---|---|---|---|---|
| css-anim i.cs-min (cs-bob) | 28 | 4612 | 5299 | 126209 | linear | yes |
| css-anim svg.mark (turn) | 1 | 40000 | 40000 | 40000 | linear | yes |
| waapi div.path-inner | 67 | 371 | 483 | 24094 | ease-out |  |
| waapi ghost.piece-flight.piece-res.path-arc | 66 | 360 | 400 | 23102 | cubic-bezier(.45,0,.2,1) |  |
| waapi ghost.piece-flight.piece-fol.path-arc | 42 | 440 | 483 | 18606 | cubic-bezier(.45,0,.2,1) |  |
| waapi ghost.piece-flight.piece-res.pay.path-drop | 26 | 440 | 440 | 11440 | linear |  |
| css-anim svg.sprite (cult-shift) | 3 | 2773 | 3645 | 9167 | linear | yes |
| waapi span.cs-stack | 45 | 180 | 240 | 8820 | cubic-bezier(.3,1.5,.5,1) |  |
| css-anim svg.sprite (cult-breathe) | 3 | 2456 | 3947 | 8792 | linear | yes |
| waapi button.card.lt-card[uid] | 16 | 360 | 680 | 6920 | linear |  |
| waapi ghost.card.lt-card.paper.dim.lt-deal | 16 | 340 | 660 | 6600 | cubic-bezier(.3,.7,.4,1) |  |
| css-anim span.tick.num (bump) | 20 | 260 | 420 | 6480 | linear |  |
| waapi span.worker | 22 | 180 | 310 | 4970 | linear |  |
| css-anim g.blink (cult-blink) | 1 | 4700 | 4700 | 4700 | linear | yes |
| css-anim span.tc-line (tcline) | 22 | 300 | 300 | 4500 |  |  |
| css-anim span.lead (cult-gesture) | 8 | 550 | 550 | 4400 | linear |  |
| waapi ghost.worker-flight.minion-flight.home | 12 | 340 | 340 | 4080 | cubic-bezier(.25,.6,.3,1) |  |
| waapi span.cs-stack.zero | 14 | 240 | 240 | 3360 | cubic-bezier(.3,1.45,.5,1) |  |
| css-anim span.worker (land) | 13 | 240 | 240 | 3120 | linear |  |
| css-anim svg.leader (cult-breathe) | 1 | 3100 | 3100 | 3100 | linear | yes |
| css-anim span.lead (cult-scheme) | 5 | 600 | 600 | 3000 | linear |  |
| waapi ghost.token-flight.reckon | 9 | 343 | 406 | 2970 | cubic-bezier(.25,.6,.3,1) |  |
| waapi ghost.worker-flight.minion-flight.path-arc | 9 | 280 | 280 | 2520 | cubic-bezier(.45,0,.2,1) |  |
| css-anim span.reckon-count (rise) | 12 | 250 | 250 | 2500 |  |  |
| css-anim span.dots (blink) | 2 | 1200 | 1200 | 2400 | linear | yes |
| css-anim span.reckon-count.won (reckonstamp) | 9 | 240 | 240 | 2160 | linear |  |
| css-anim span.worker-fig (panelland) | 13 | 300 | 300 | 1800 | linear |  |
| css-trans div.turn-card.folding (opacity) | 4 | 450 | 450 | 1800 | ease |  |
| css-trans div.turn-card.folding (transform) | 4 | 450 | 450 | 1800 | cubic-bezier(0.5, 0, 0.7, 0.4) |  |
| waapi button.fb.lt-rate | 10 | 180 | 180 | 1800 | cubic-bezier(.3,1.5,.5,1) |  |
| css-trans path.rim.wait (fill-opacity) | 6 | 300 | 300 | 1800 | ease |  |
| css-anim span.tick.re-f (bump) | 4 | 420 | 420 | 1680 | linear |  |
| css-anim section.prompt.choice (cta-pulse) | 1 | 1500 | 1500 | 1500 | linear |  |
| css-trans path.glow (opacity) | 31 | 150 | 150 | 1500 |  |  |
| css-trans path.edge-lit (opacity) | 31 | 150 | 150 | 1500 |  |  |
| waapi span.cs-total.lead | 8 | 180 | 180 | 1440 | cubic-bezier(.3,1.5,.5,1) |  |
| waapi ghost.worker-flight.minion-flight.trail.path-arc | 8 | 180 | 180 | 1440 | cubic-bezier(.45,0,.2,1) |  |
| waapi span.base | 13 | 90 | 140 | 1370 | cubic-bezier(.3,1.4,.5,1) |  |
| waapi b.bundle-n | 3 | 420 | 423 | 1262 | linear |  |
| waapi span.cs-total | 7 | 180 | 180 | 1260 | cubic-bezier(.3,1.5,.5,1) |  |

### Waiting

Your turn ends → your next turn painted: p50 48675ms, p95 74752ms, max 74752ms (n 3).
Still moving when your turn came (finite animations running, time left): p50 600ms, max 600ms.

### Bot pacing

A bot's state → its move applied: p50 1234ms, p95 2128ms. Applied → shown on the table: p50 366ms, p95 718ms, max 2461ms. Shown → painted p95 525ms. Gap between table steps: p50 1656ms, p95 25898ms.

### Online round trips (this person's moves)

States received: 90. Sent → host applied p50 257ms, p95 578ms; → received p50 553ms, p95 935ms, max 935ms; → painted p50 1315ms, p95 1965ms.
State snapshot size: 4716–14703 bytes (the whole game state as JSON, every move).

## guest: 3 placements (0 in round II)

### Input → next paint (Event Timing; rAF fallback below 16ms)

All: n 31, p50 528ms, p95 944ms, max 960ms

| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |
|---|---|---|---|---|---|---|
| click rate | 1 | 960 | 960 | 960 | 173 | 22 |
| keydown key:ArrowRight | 1 | 944 | 944 | 944 | 47 | 43 |
| pointerdown wheel | 1 | 920 | 920 | 920 | 14 | 14 |
| click next-round | 1 | 776 | 776 | 776 | 56 | 467 |
| click wheel | 1 | 760 | 760 | 760 | 21 | 0 |
| click shop-card | 2 | 488 | 760 | 760 | 36 | 36 |
| click space | 3 | 696 | 744 | 744 | 44 | 290 |
| pointerdown space | 3 | 600 | 696 | 696 | 19 | 6 |
| click place-confirm | 3 | 504 | 632 | 632 | 41 | 38 |
| keydown key:ArrowLeft | 2 | 568 | 624 | 624 | 87 | 13 |
| pointerdown next-round | 1 | 596 | 596 | 596 | 47 | – |
| click option:color | 2 | 72 | 528 | 528 | 28 | 24 |
| pointerdown place-confirm | 3 | 307 | 488 | 488 | 18 | 2 |
| pointerdown rate | 1 | 402 | 402 | 402 | 43 | – |
| pointerdown shop-card | 2 | 208 | 286 | 286 | 20 | – |
| pointerdown button | 1 | 96 | 96 | 96 | 15 | – |
| click button | 1 | 96 | 96 | 96 | 27 | 28 |
| pointerdown option:color | 2 | 72 | 78 | 78 | 15 | – |

### Click → new state on screen (harness, wall clock)

| click | n | p50 | max | no change in 4s |
|---|---|---|---|---|
| setup | 2 | 1167 | 1247 | 0 |
| place | 3 | 788 | 793 | 0 |
| place-confirm | 3 | 1780 | 2262 | 0 |
| recruit | 2 | 1659 | 3046 | 0 |
| followers | 1 | 1882 | 1882 | 0 |
| next-round | 1 | 1654 | 1654 | 0 |

Clicks on a live option that changed nothing (tracer, 1.2s): 3 of 8 (slot:1-0, slot:3-0, slot:0-2).

### Hover open delay (pointer over → card in the DOM; content = "You'd get" filled)

| target | n | p50 | p95 | max | content p95 | pointerover handler p95 |
|---|---|---|---|---|---|---|
| rim | 3 | 454 | 546 | 546 | 546 | 0 |
| space | 42 | 312 | 603 | 749 | 603 | 0 |
| shop-card | 15 | 376 | 865 | 865 | 865 | 3 |
| tip | 3 | 537 | 637 | 637 | 637 | 1 |

Hovers whose card never showed (moved on first, or no card): 15.

### Long animation frames

LoAF: 2337 frames ≥50ms, 1897 over 100ms, total blocking 144531ms. Long tasks: 1307, 222394ms total, max 2339ms.

| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |
|---|---|---|---|---|
| 160988 | 2535 | 2429 | 34 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 2338 (forced layout 1981)<br>FrameRequestCallback · w · assets/index-Cwu4GImh.js:22538 · 6 |
| 3988 | 1449 | 1345 | 15 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 1334 (forced layout 512) |
| 196707 | 1138 | 1064 | 66 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 1048 (forced layout 742)<br>TimerHandler:setTimeout · ? · assets/index-Cwu4GImh.js:15955 · 15<br>FrameRequestCallback · ? · :-1 · 10 |
| 159725 | 1075 | 874 | 796 | FrameRequestCallback · ht · assets/CultSeat-C79IAyZ-.js:23419 · 652 (forced layout 626)<br>FrameRequestCallback · w · assets/index-Cwu4GImh.js:22538 · 6 |
| 188310 | 1035 | 892 | 56 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 759 (forced layout 297)<br>FrameRequestCallback · ? · :-1 · 11<br>TimerHandler:setTimeout · ? · assets/index-Cwu4GImh.js:15955 · 6 |
| 57741 | 992 | 914 | 22 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 942 (forced layout 603)<br>TimerHandler:setTimeout · ? · assets/index-Cwu4GImh.js:15955 · 19 (forced layout 2)<br>FrameRequestCallback · w · assets/index-Cwu4GImh.js:22538 · 5 |
| 59084 | 901 | 595 | 523 | (no script: style/layout/paint) |
| 158812 | 836 | 735 | 37 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 622 (forced layout 327)<br>FrameRequestCallback · w · assets/index-Cwu4GImh.js:22538 · 10 |
| 181123 | 836 | 594 | 238 | DIV#root.onpointerout · Pf · assets/index-Cwu4GImh.js:55775 · 218 (forced layout 196)<br>FrameRequestCallback · w · assets/index-Cwu4GImh.js:22538 · 8 |
| 85109 | 807 | 602 | 5 | MessagePort.onmessage · hn · assets/index-Cwu4GImh.js:29536 · 614 (forced layout 206)<br>DOMWebSocket.onmessage · ? · assets/index.esm-DH8C4Ikr.js:85947 · 5 |

### React commits per component (dev build actualDuration, inclusive of children)

Commits: 578; whole-tree commit p50 –ms, p95 –ms, max –ms.

| component | renders | p50 | p95 | max |
|---|---|---|---|---|

### Wheel spins (rAF-driven: one React render of the Wheel per frame)

| from° → to° | ms | frames | worst frame gap |
|---|---|---|---|
| 0 → 0 | 0 | 1 | 0 |
| 90 → 0 | 6295 | 29 | 858 |

### Animations and transitions (every one that ran)

| animation | count | duration p50 | max | total ms | easing | loop |
|---|---|---|---|---|---|---|
| css-anim i.cs-min (cs-bob) | 28 | 4612 | 5299 | 126209 | linear | yes |
| css-anim svg.mark (turn) | 1 | 40000 | 40000 | 40000 | linear | yes |
| waapi div.path-inner | 67 | 371 | 485 | 24168 | ease-out |  |
| waapi ghost.piece-flight.piece-res.path-arc | 66 | 361 | 400 | 23028 | cubic-bezier(.45,0,.2,1) |  |
| waapi ghost.piece-flight.piece-fol.path-arc | 42 | 440 | 485 | 18628 | cubic-bezier(.45,0,.2,1) |  |
| waapi ghost.piece-flight.piece-res.pay.path-drop | 26 | 440 | 440 | 11440 | linear |  |
| css-anim svg.sprite (cult-shift) | 3 | 2773 | 3645 | 9167 | linear | yes |
| waapi span.cs-stack | 45 | 180 | 240 | 8820 | cubic-bezier(.3,1.5,.5,1) |  |
| css-anim svg.sprite (cult-breathe) | 3 | 2456 | 3947 | 8792 | linear | yes |
| css-anim span.dots (blink) | 6 | 1200 | 1200 | 7200 | linear | yes |
| waapi button.card.lt-card[uid] | 16 | 360 | 680 | 6920 | linear |  |
| waapi ghost.card.lt-card.paper.dim.lt-deal | 16 | 340 | 660 | 6600 | cubic-bezier(.3,.7,.4,1) |  |
| css-anim span.lead (cult-gesture) | 11 | 550 | 550 | 6050 | linear |  |
| waapi span.worker | 23 | 180 | 310 | 5320 | linear |  |
| css-anim span.tc-line (tcline) | 22 | 300 | 300 | 4800 |  |  |
| css-anim g.blink (cult-blink) | 1 | 4700 | 4700 | 4700 | linear | yes |
| waapi ghost.worker-flight.minion-flight.home | 12 | 340 | 340 | 4080 | cubic-bezier(.25,.6,.3,1) |  |
| css-anim span.tick.num (bump) | 13 | 260 | 420 | 3600 | linear |  |
| waapi span.cs-stack.zero | 14 | 240 | 240 | 3360 | cubic-bezier(.3,1.45,.5,1) |  |
| css-anim span.worker (land) | 13 | 240 | 240 | 3120 | linear |  |
| css-anim svg.leader (cult-breathe) | 1 | 3100 | 3100 | 3100 | linear | yes |
| waapi ghost.token-flight.reckon | 9 | 346 | 406 | 2976 | cubic-bezier(.25,.6,.3,1) |  |
| waapi ghost.worker-flight.minion-flight.path-arc | 10 | 280 | 280 | 2800 | cubic-bezier(.45,0,.2,1) |  |
| css-anim span.lead (cult-scheme) | 4 | 600 | 600 | 2400 | linear |  |
| css-anim span.lead (cult-celebrate) | 3 | 800 | 800 | 2400 | linear |  |
| css-anim span.reckon-count.won (reckonstamp) | 9 | 240 | 240 | 2160 | linear |  |
| css-anim span.worker-fig (panelland) | 13 | 300 | 300 | 2100 | linear |  |
| waapi button.fb.lt-rate | 10 | 180 | 180 | 1800 | cubic-bezier(.3,1.5,.5,1) |  |
| css-anim span.reckon-count (rise) | 9 | 250 | 250 | 1750 |  |  |
| css-anim span.tick.re-f (bump) | 4 | 420 | 420 | 1680 | linear |  |
| css-anim section.prompt.choice (cta-pulse) | 1 | 1500 | 1500 | 1500 | linear |  |
| waapi span.cs-total.lead | 8 | 180 | 180 | 1440 | cubic-bezier(.3,1.5,.5,1) |  |
| waapi span.base | 13 | 90 | 140 | 1320 | cubic-bezier(.3,1.4,.5,1) |  |
| waapi b.bundle-n | 3 | 420 | 425 | 1264 | linear |  |
| waapi span.cs-total | 7 | 180 | 180 | 1260 | cubic-bezier(.3,1.5,.5,1) |  |
| waapi ghost.worker-flight.minion-flight.trail.path-arc | 6 | 180 | 180 | 1080 | cubic-bezier(.45,0,.2,1) |  |
| waapi g.rim-emoji.wait | 6 | 180 | 180 | 1080 | cubic-bezier(.3,1.4,.5,1) |  |
| css-trans section.lt-shop (filter) | 10 | 200 | 300 | 900 |  |  |
| css-trans div.turn-card.folding (opacity) | 2 | 450 | 450 | 900 | ease |  |
| css-trans div.turn-card.folding (transform) | 2 | 450 | 450 | 900 | cubic-bezier(0.5, 0, 0.7, 0.4) |  |

### Waiting

Your turn ends → your next turn painted: p50 20047ms, p95 64827ms, max 64827ms (n 3).
Still moving when your turn came (finite animations running, time left): p50 440ms, max 600ms.

### Bot pacing

A bot's state → its move applied: p50 1320ms, p95 2208ms. Applied → shown on the table: p50 407ms, p95 807ms, max 2339ms. Shown → painted p95 314ms. Gap between table steps: p50 1687ms, p95 25387ms.

### Online round trips (this person's moves)

States received: 45. Sent → host applied p50 288ms, p95 387ms; → received p50 512ms, p95 942ms, max 942ms; → painted p50 1135ms, p95 2190ms.
State snapshot size: 4744–11154 bytes (the whole game state as JSON, every move).
