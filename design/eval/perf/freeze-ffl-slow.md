# Freeze probe: ffl-slow

2026-10-28T19:13:41.258Z · http://127.0.0.1:5299/patrons/play · firefox, own speed (no CPU throttle, no main-thread metrics) · relaxed · seed 20261028 · 13 min · game finished · 2149 presses every 250 ms
Freeze bars pass: worst press 87 ms, 0.0% over 100 ms, no ignored clicks.


Main thread over the game: busy 0 ms of 754175 (0%), script 0, style 0, layout 0.

Table renders: 552 begun, 509 committed (43 thrown away and started over).

## Input waiting (how long a press or click waited before the page even looked at it)

| round | turn | presses/clicks over 16 ms | over 100 ms | over 250 ms | over 500 ms | worst wait | total wait ms | p95 to paint |
|---|---|---|---|---|---|---|---|---|
| I | yours | 231 | 0 | 0 | 0 | 70 | 310 | 248 |
| I | rivals | 207 | 0 | 0 | 0 | 19 | 55 | 200 |
| II | yours | 342 | 0 | 0 | 0 | 42 | 390 | 280 |
| II | rivals | 346 | 0 | 0 | 0 | 16 | 55 | 208 |
| III | yours | 589 | 0 | 0 | 0 | 87 | 852 | 296 |
| III | rivals | 380 | 0 | 0 | 0 | 29 | 109 | 232 |

## Long animation frames over 50 ms

| round | turn | frames | blocking ms | total ms | style+layout ms | over 200 ms | worst |
|---|---|---|---|---|---|---|---|

Totals: long frames 0 ms (0 ms blocking), input waited 1793 ms, 0 presses/clicks waited over 100 ms. Hovers: 322, a card open after 322.

## Scripts in long frames (by entry point)

| entry → function @ source | ms | times | forced style+layout ms | worst |
|---|---|---|---|---|

## The 12 longest frames


## The person's clicks

27 clicks timed; 0 changed nothing in 1.5 s (0 of them made while the table was still animating).
- round I: 7 answered, p50 368 ms, p95 821 ms, worst 821 ms (as seen from outside the page, polling every 30 ms)
- round II: 9 answered, p50 360 ms, p95 599 ms, worst 599 ms (as seen from outside the page, polling every 30 ms)
- round III: 11 answered, p50 448 ms, p95 656 ms, worst 656 ms (as seen from outside the page, polling every 30 ms)
