# Perf run: lean-v064

2026-10-18T01:29:39.064Z · local (1 person + 3 Normal bots, normal speed) · CPU 4× · seed 20261015 · think 650ms · 554s wall
Load average before 1.23 / 1.55 / 2.23, after 0.97 / 1.3 / 1.83 (box: 4 CPUs). Vite HMR/reloads during the run: not watched.

## P1: 0 placements (0 in round II)

### Input → next paint (Event Timing; rAF fallback below 16ms)

All: n 4, p50 1376ms, p95 1440ms, max 1440ms

| event · target | n | p50 | p95 | max | input delay p95 | handlers p95 |
|---|---|---|---|---|---|---|
| click button | 2 | 1376 | 1440 | 1440 | 1053 | 1154 |
| pointerdown button | 2 | 1325 | 1440 | 1440 | 142 | – |

### Click → new state on screen (harness, wall clock)

| click | n | p50 | max | no change in 4s |
|---|---|---|---|---|

Clicks on a live option that changed nothing (tracer, 1.2s): 0 of 0.

### Hover open (from the end of the 200ms hover delay → card on screen; content = "You'd get" filled; complete = its last change landed while it was still the card up; ·swap = a card already up swapping in place, no delay, timed from the arrival)

| target | n | p50 | p95 | max | content p95 | complete p95 | pointerover handler p95 |
|---|---|---|---|---|---|---|---|

Hovers whose card never showed (moved on first, or no card): 1.

### Long animation frames

LoAF: 203 frames ≥50ms, 57 over 100ms, total blocking 9289ms. Long tasks: 203, 22403ms total, max 1364ms.

| at (ms) | duration | blocking | render+layout | top scripts (invoker · fn · source · ms) |
|---|---|---|---|---|
| 6302 | 1374 | 1320 | 5 | DOMWindow.onpointerdown · e · assets/CultSeat-C4BseuiA.js:25775 · 844<br>DIV#root.onclick · Pf · assets/index-BJIJ5s-6.js:57160 · 178 (forced layout 2)<br>DOMWindow.onpointerover · ? · assets/index-BJIJ5s-6.js:23556 · 13 |
| 143 | 1277 | 35 | 30 | http://localhost:5291/?trace=1&intro=0 · ? · /:0 · 23 |
| 8085 | 1240 | 1190 | 22 | DIV#root.onclick · Pf · assets/index-BJIJ5s-6.js:57160 · 1153 (forced layout 311) |
| 4631 | 895 | 844 | 301 | MessagePort.onmessage · hn · assets/index-BJIJ5s-6.js:31034 · 586 |
| 3661 | 820 | 52 | 96 | (no script: style/layout/paint) |
| 2742 | 712 | 609 | 42 | http://localhost:5291/assets/App-CGkDm-KU.js · ? · assets/App-CGkDm-KU.js:0 · 503<br>import.then · ? · assets/index-BJIJ5s-6.js:-1 · 75 |
| 17141 | 695 | 597 | 121 | MessagePort.onmessage · hn · assets/index-BJIJ5s-6.js:31034 · 512 (forced layout 320)<br>ResizeObserverCallback · ? · assets/App-CGkDm-KU.js:147621 · 17<br>ResizeObserverCallback · ? · assets/CultSeat-C4BseuiA.js:115084 · 5 |
| 1449 | 621 | 554 | 23 | http://localhost:5291/assets/index-BJIJ5s-6.js · ? · assets/index-BJIJ5s-6.js:0 · 541 |
| 195240 | 487 | 102 | 108 | TimerHandler:setInterval · ? · assets/index-BJIJ5s-6.js:28370 · 34 |
| 17941 | 266 | 150 | 154 | MessagePort.onmessage · hn · assets/index-BJIJ5s-6.js:31034 · 42 |

### React commits per component (dev build actualDuration, inclusive of children)

Commits: 17; whole-tree commit p50 –ms, p95 –ms, max –ms.

| component | renders | p50 | p95 | max |
|---|---|---|---|---|

### Wheel spins (rAF-driven: one React render of the Wheel per frame)

| from° → to° | ms | frames | worst frame gap |
|---|---|---|---|
| 0 → 0 | 0 | 1 | 0 |

### Animations and transitions (every one that ran)

| animation | count | duration p50 | max | total ms | easing | loop |
|---|---|---|---|---|---|---|
| css-anim svg.mark (turn) | 1 | 40000 | 40000 | 40000 | linear | yes |
| css-anim g.blink (cult-blink) | 4 | 4700 | 4700 | 18800 | linear | yes |
| css-anim svg.leader (cult-breathe) | 4 | 3100 | 3100 | 12400 | linear | yes |
| css-anim span.lead (cult-scheme) | 3 | 1600 | 1600 | 4800 | linear | yes |
| waapi ghost.piece-flight.piece-res.path-arc | 4 | 854 | 1001 | 3710 | cubic-bezier(.4,0,.6,1) |  |
| waapi div.path-inner | 2 | 854 | 1001 | 1855 | ease-out |  |
| css-trans section.lt-seat.lt-seat-1[slot] (background-color) | 2 | 750 | 750 | 1500 | ease |  |
| css-trans section.lt-seat.lt-seat-1[slot] (box-shadow) | 2 | 750 | 750 | 1500 | ease |  |
| waapi span.cs-stack | 2 | 675 | 675 | 1350 | cubic-bezier(.3,1.5,.5,1) |  |
| css-trans section.lt-seat.lt-seat-1[slot] (transform) | 1 | 1313 | 1313 | 1313 | cubic-bezier(0.3, 0.7, 0.4, 1) |  |
| css-trans section.lt-seat.lt-seat-2[slot] (transform) | 1 | 1313 | 1313 | 1313 | cubic-bezier(0.3, 0.7, 0.4, 1) |  |
| css-anim span.dots (blink) | 1 | 1200 | 1200 | 1200 | linear | yes |
| waapi span.base | 2 | 600 | 600 | 1200 | cubic-bezier(.3,1.4,.5,1) |  |
| css-trans section.lt-seat.lt-seat-2[slot] (background-color) | 1 | 750 | 750 | 750 | ease |  |
| css-trans section.lt-seat.lt-seat-2[slot] (box-shadow) | 1 | 750 | 750 | 750 | ease |  |
| css-trans section.lt-seat.lt-seat-0[slot] (background-color) | 1 | 750 | 750 | 750 | ease |  |
| css-trans button.card.lt-card[uid] (transform) | 1 | 120 | 120 | 120 | ease |  |

### Waiting

Your turn ends → your next turn painted: p50 –ms, p95 –ms, max –ms (n 0).
Still moving when your turn came (finite animations running, time left): p50 –ms, max –ms.

### Bot pacing

A bot's state → its move applied: p50 285ms, p95 406ms. Applied → shown on the table: p50 2821ms, p95 5014ms, max 5014ms. Shown → painted p95 59ms. Gap between table steps: p50 2600ms, p95 2600ms.
