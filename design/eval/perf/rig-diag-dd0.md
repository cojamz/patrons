# Perf rig: diag-dd0

2026-10-28T06:53:49.512Z · http://localhost:5302 · 4x CPU · relaxed · seed 20261028 · 1 person + 3 Normal bots · 10 min · game finished

Verdict: FAIL (8)
- round I: clicks p95 420 ms (bar 100)
- round II: clicks p95 266 ms (bar 100)
- round III: clicks p95 418 ms (bar 100)
- round III: idle table busy 17% (bar 10%)
- idle busy grows 1% → 17% over the game
- leak: 6180 elements vs 4657 after a reload
- leak: 839 listeners vs 732 after a reload
- leak: heap 16.2 MB vs 7.3 MB after a reload

## Per round

| round | clicks p50/p95 ms | hovers p50/p95 ms | show frames p95 ms | hitch % | worst frame | long frames >100ms | idle busy % | idle style ms/3s | elements | listeners | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| I | 130 / 420 | 48 / 69 | 17 | 1 | 300 | 4 | 1 | 1 | 2023 | 504 | 9.9 |
| II | 156 / 266 | 43 / 80 | 17 | 2 | 383 | 16 | 1 | 4 | 2889 | 546 | 14.4 |
| III | 217 / 418 | 37 / 90 | 33 | 3 | 617 | 54 | 17 | 96 | 3218 | 588 | 17.1 |

Leak control on the last turn: unbroken game 6180 elements, 839 listeners, 16.2 MB; after a reload 4657, 732, 7.3 MB.

## Round I

Clicks by kind: place 4× p50 122 p95 127 · choose 5× p50 119 p95 420 · recruit 3× p50 217 p95 220 · pay 3× p50 130 p95 166 · next-round 1× p50 74 p95 74

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 4861 | 17 | 300 | 1 |
| i.cs-min:cs-bob | 951 | 33 | 300 | 3 |
| span.lead:cult-scheme | 842 | 33 | 300 | 3 |
| i.cs-min:cs-bob-eager | 837 | 33 | 300 | 3 |
| span.worker-fig:panelland-under | 806 | 33 | 183 | 3 |
| svg.leader:cult-breathe | 2287 | 33 | 300 | 1 |
| g.blink:cult-blink | 2287 | 33 | 300 | 1 |
| img.sprite:cult-shift | 2273 | 33 | 300 | 1 |
| span.tc-line:tcline | 1977 | 33 | 100 | 1 |
| img.sprite:cult-breathe | 1904 | 17 | 100 | 1 |
| div.path-inner:js | 1729 | 17 | 117 | 1 |
| path.wash:fill | 214 | 67 | 183 | 8 |

Longest frames: 325 ms (style/layout/paint) · 173 ms (hn 156) · 158 ms (Lf 134) · 108 ms (TimerHandler:setTimeout 8, hn 88) · 89 ms (Nf 5, Nf 65)

## Round II

Clicks by kind: place 4× p50 101 p95 101 · recruit 5× p50 226 p95 232 · pay 5× p50 156 p95 211 · pick 2× p50 128 p95 128 · choose 2× p50 266 p95 266 · next-round 1× p50 88 p95 88 · 4 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 6913 | 33 | 383 | 2 |
| svg.leader:cult-breathe | 3164 | 33 | 383 | 3 |
| g.blink:cult-blink | 3164 | 33 | 383 | 3 |
| img.sprite:cult-shift | 3164 | 33 | 383 | 3 |
| img.sprite:cult-breathe | 3164 | 33 | 383 | 3 |
| span.tc-line:tcline | 2821 | 33 | 133 | 3 |
| i.cs-min:cs-bob | 1816 | 33 | 383 | 4 |
| span.lead:cult-scheme | 1717 | 33 | 383 | 4 |
| i.cs-min:cs-bob-eager | 1611 | 33 | 383 | 4 |
| span.worker-fig:panelland-under | 1056 | 33 | 183 | 4 |
| path.wash:fill | 271 | 67 | 183 | 15 |
| span.base:opacity | 759 | 50 | 183 | 5 |

Longest frames: 407 ms (style/layout/paint) · 213 ms (TimerHandler:setTimeout 203) · 167 ms (hn 150, Lf 7) · 150 ms (TimerHandler:setTimeout 144) · 141 ms (hn 130)

## Round III

Clicks by kind: place 6× p50 122 p95 418 · choose 4× p50 264 p95 332 · recruit 5× p50 269 p95 269 · pay 5× p50 217 p95 369 · pick 1× p50 83 p95 83 · next-round 1× p50 70 p95 70 · 4 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 8720 | 33 | 617 | 4 |
| span.tc-line:tcline | 3630 | 50 | 383 | 6 |
| svg.leader:cult-breathe | 4584 | 33 | 617 | 4 |
| g.blink:cult-blink | 4584 | 33 | 617 | 4 |
| img.sprite:cult-shift | 4584 | 33 | 617 | 4 |
| img.sprite:cult-breathe | 4584 | 33 | 617 | 4 |
| i.cs-min:cs-bob | 2314 | 50 | 617 | 7 |
| i.cs-min:cs-bob-eager | 2112 | 50 | 617 | 7 |
| span.lead:cult-scheme | 2105 | 50 | 617 | 6 |
| div.path-inner:js | 3399 | 33 | 300 | 3 |
| img.sprite:cult-eager | 422 | 83 | 250 | 23 |
| span.base:opacity | 945 | 50 | 433 | 10 |

Longest frames: 629 ms (style/layout/paint) · 412 ms (Lf 388) · 347 ms (e 317) · 276 ms (TimerHandler:setTimeout 262) · 270 ms (hn 206)
