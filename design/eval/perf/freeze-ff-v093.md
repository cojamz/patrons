# Freeze probe: ff-v093

2026-10-28T14:32:24.829Z · http://127.0.0.1:5291 · 4x CPU · relaxed · seed 20261028 · 9 min · game finished · 1980 presses every 250 ms

Main thread over the game: busy 0 ms of 527813 (0%), script 0, style 0, layout 0.

## Input waiting (how long a press or click waited before the page even looked at it)

| round | turn | presses/clicks over 16 ms | over 100 ms | over 250 ms | over 500 ms | worst wait | total wait ms | p95 to paint |
|---|---|---|---|---|---|---|---|---|
| I | yours | 90 | 0 | 0 | 0 | 14 | 113 | 120 |
| I | rivals | 216 | 0 | 0 | 0 | 8 | 27 | 72 |
| II | yours | 164 | 0 | 0 | 0 | 25 | 276 | 128 |
| II | rivals | 339 | 0 | 0 | 0 | 7 | 30 | 72 |
| III | yours | 183 | 0 | 0 | 0 | 44 | 458 | 168 |
| III | rivals | 653 | 0 | 0 | 0 | 10 | 69 | 80 |

## Long animation frames over 50 ms

| round | turn | frames | blocking ms | total ms | style+layout ms | over 200 ms | worst |
|---|---|---|---|---|---|---|---|
| I | yours | 101 | 4000 | 9050 | 0 | 1 | 216 |
| I | rivals | 140 | 3564 | 10564 | 0 | 1 | 216 |
| II | yours | 201 | 8426 | 18476 | 0 | 4 | 217 |
| II | rivals | 235 | 5023 | 16773 | 0 | 0 | 167 |
| III | yours | 255 | 14007 | 26757 | 0 | 9 | 383 |
| III | rivals | 515 | 13687 | 39437 | 0 | 7 | 333 |

Totals: long frames 123507 ms (50257 ms blocking), input waited 976 ms, 0 presses/clicks waited over 100 ms.

## Scripts in long frames (by entry point)

| entry → function @ source | ms | times | forced style+layout ms | worst |
|---|---|---|---|---|

## The 12 longest frames

- round · rival turn setup: 583 ms (style+layout 0, render 0): 
- round III your turn place (animating): 383 ms (style+layout 0, render 0): 
- round · rival turn setup: 367 ms (style+layout 0, render 0): 
- round III rival turn place (animating): 333 ms (style+layout 0, render 0): 
- round III rival turn place (animating): 267 ms (style+layout 0, render 0): 
- round III your turn pay: 266 ms (style+layout 0, render 0): 
- round III your turn place (animating): 249 ms (style+layout 0, render 0): 
- round III your turn place (animating): 234 ms (style+layout 0, render 0): 
- round III rival turn place (animating): 233 ms (style+layout 0, render 0): 
- round II your turn pay: 217 ms (style+layout 0, render 0): 
- round III rival turn place (animating): 217 ms (style+layout 0, render 0): 
- round III rival turn place (animating): 217 ms (style+layout 0, render 0): 

## The person's clicks

28 clicks timed; 0 changed nothing in 1.5 s (0 of them made while the table was still animating).
- round I: 7 answered, p50 105 ms, p95 166 ms, worst 166 ms (as seen from outside the page, polling every 30 ms)
- round II: 9 answered, p50 135 ms, p95 196 ms, worst 196 ms (as seen from outside the page, polling every 30 ms)
- round III: 12 answered, p50 189 ms, p95 280 ms, worst 280 ms (as seen from outside the page, polling every 30 ms)
