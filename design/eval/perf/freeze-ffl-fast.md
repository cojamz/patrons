# Freeze probe: ffl-fast

2026-10-28T19:10:19.699Z · http://127.0.0.1:5299/patrons/play · firefox, own speed (no CPU throttle, no main-thread metrics) · relaxed · seed 20261028 · 9 min · game finished · 2166 presses every 250 ms
Freeze bars pass: worst press 27 ms, 0.0% over 100 ms, no ignored clicks.


Main thread over the game: busy 0 ms of 561022 (0%), script 0, style 0, layout 0.

Table renders: 510 begun, 509 committed (1 thrown away and started over).

## Input waiting (how long a press or click waited before the page even looked at it)

| round | turn | presses/clicks over 16 ms | over 100 ms | over 250 ms | over 500 ms | worst wait | total wait ms | p95 to paint |
|---|---|---|---|---|---|---|---|---|
| I | yours | 128 | 0 | 0 | 0 | 24 | 90 | 72 |
| I | rivals | 139 | 0 | 0 | 0 | 5 | 13 | 40 |
| II | yours | 224 | 0 | 0 | 0 | 13 | 102 | 192 |
| II | rivals | 279 | 0 | 0 | 0 | 3 | 19 | 48 |
| III | yours | 397 | 0 | 0 | 0 | 27 | 224 | 136 |
| III | rivals | 345 | 0 | 0 | 0 | 8 | 25 | 48 |

## Long animation frames over 50 ms

| round | turn | frames | blocking ms | total ms | style+layout ms | over 200 ms | worst |
|---|---|---|---|---|---|---|---|

Totals: long frames 0 ms (0 ms blocking), input waited 475 ms, 0 presses/clicks waited over 100 ms. Hovers: 322, a card open after 322.

## Scripts in long frames (by entry point)

| entry → function @ source | ms | times | forced style+layout ms | worst |
|---|---|---|---|---|

## The 12 longest frames


## The person's clicks

27 clicks timed; 0 changed nothing in 1.5 s (0 of them made while the table was still animating).
- round I: 7 answered, p50 75 ms, p95 126 ms, worst 126 ms (as seen from outside the page, polling every 30 ms)
- round II: 9 answered, p50 82 ms, p95 153 ms, worst 153 ms (as seen from outside the page, polling every 30 ms)
- round III: 11 answered, p50 90 ms, p95 158 ms, worst 158 ms (as seen from outside the page, polling every 30 ms)
