# Freeze probe: ff-live

2026-10-28T14:32:42.210Z · http://127.0.0.1:5297 · 4x CPU · relaxed · seed 20261028 · 9 min · game finished · 2045 presses every 250 ms

Main thread over the game: busy 0 ms of 544409 (0%), script 0, style 0, layout 0.

Table renders: 980 begun, 597 committed (383 thrown away and started over).

## Input waiting (how long a press or click waited before the page even looked at it)

| round | turn | presses/clicks over 16 ms | over 100 ms | over 250 ms | over 500 ms | worst wait | total wait ms | p95 to paint |
|---|---|---|---|---|---|---|---|---|
| I | yours | 92 | 0 | 0 | 0 | 12 | 74 | 128 |
| I | rivals | 195 | 0 | 0 | 0 | 2 | 10 | 72 |
| II | yours | 168 | 0 | 0 | 0 | 21 | 218 | 136 |
| II | rivals | 345 | 0 | 0 | 0 | 3 | 24 | 64 |
| III | yours | 241 | 0 | 0 | 0 | 56 | 515 | 144 |
| III | rivals | 652 | 0 | 0 | 0 | 5 | 55 | 72 |

## Long animation frames over 50 ms

| round | turn | frames | blocking ms | total ms | style+layout ms | over 200 ms | worst |
|---|---|---|---|---|---|---|---|
| I | yours | 112 | 4103 | 9703 | 0 | 1 | 233 |
| I | rivals | 130 | 3181 | 9681 | 0 | 0 | 199 |
| II | yours | 221 | 8884 | 19934 | 0 | 1 | 217 |
| II | rivals | 220 | 4932 | 15932 | 0 | 0 | 167 |
| III | yours | 318 | 15290 | 31190 | 0 | 7 | 301 |
| III | rivals | 509 | 13760 | 39210 | 0 | 3 | 384 |

Totals: long frames 128251 ms (51701 ms blocking), input waited 907 ms, 0 presses/clicks waited over 100 ms.

## Scripts in long frames (by entry point)

| entry → function @ source | ms | times | forced style+layout ms | worst |
|---|---|---|---|---|

## The 12 longest frames

- round · rival turn setup: 550 ms (style+layout 0, render 0): 
- round III rival turn choose (animating): 384 ms (style+layout 0, render 0): 
- round · rival turn setup: 334 ms (style+layout 0, render 0): 
- round III your turn pay: 301 ms (style+layout 0, render 0): 
- round III rival turn choose (animating): 272 ms (style+layout 0, render 0): 
- round III your turn buy: 234 ms (style+layout 0, render 0): 
- round III your turn pay: 234 ms (style+layout 0, render 0): 
- round I your turn place (animating): 233 ms (style+layout 0, render 0): 
- round III your turn place (animating): 233 ms (style+layout 0, render 0): 
- round III your turn place (animating): 233 ms (style+layout 0, render 0): 
- round III your turn place: 228 ms (style+layout 0, render 0): 
- round II your turn choose: 217 ms (style+layout 0, render 0): 

## The person's clicks

29 clicks timed; 0 changed nothing in 1.5 s (0 of them made while the table was still animating).
- round I: 7 answered, p50 144 ms, p95 220 ms, worst 220 ms (as seen from outside the page, polling every 30 ms)
- round II: 9 answered, p50 157 ms, p95 266 ms, worst 266 ms (as seen from outside the page, polling every 30 ms)
- round III: 13 answered, p50 189 ms, p95 608 ms, worst 608 ms (as seen from outside the page, polling every 30 ms)
