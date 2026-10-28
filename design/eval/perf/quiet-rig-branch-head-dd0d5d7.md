# Perf rig: branch-head-dd0d5d7

2026-10-28T06:08:40.365Z · http://localhost:5293 · 4x CPU · relaxed · seed 20261028 · 1 person + 3 Normal bots · 11 min · game finished

Verdict: FAIL (6)
- round I: clicks p95 453 ms (bar 100)
- round II: clicks p95 320 ms (bar 100)
- round II: idle table busy 18% (bar 10%)
- round III: clicks p95 2502 ms (bar 100)
- clicks p95 grows 453 → 2502 ms over the game
- idle busy grows 0% → 7% over the game

## Per round

| round | clicks p50/p95 ms | hovers p50/p95 ms | show frames p95 ms | hitch % | worst frame | long frames >100ms | idle busy % | idle style ms/3s | elements | listeners | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| I | 157 / 453 | 49 / 96 | 17 | 2 | 267 | 11 | 0 | 1 | 2023 | 505 | 9.8 |
| II | 223 / 320 | 63 / 86 | 33 | 2 | 667 | 21 | 18 | 197 | 2889 | 548 | 14.3 |
| III | 285 / 2502 | 63 / 93 | 33 | 3 | 567 | 37 | 7 | 44 | 3404 | 604 | 17.2 |

Leak control on the last turn: unbroken game 5290 elements, 785 listeners, 16.2 MB; after a reload 4786, 730, 7.4 MB.

## Round I

Clicks by kind: place 5× p50 122 p95 142 · choose 5× p50 188 p95 453 · recruit 3× p50 235 p95 235 · pay 3× p50 168 p95 180 · next-round 1× p50 85 p95 85 · 2 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 4835 | 17 | 267 | 2 |
| span.tc-line:tcline | 1965 | 33 | 117 | 3 |
| svg.leader:cult-breathe | 2848 | 33 | 267 | 2 |
| g.blink:cult-blink | 2848 | 33 | 267 | 2 |
| img.sprite:cult-shift | 2834 | 33 | 267 | 2 |
| i.cs-min:cs-bob | 1512 | 33 | 267 | 3 |
| img.sprite:cult-breathe | 2222 | 33 | 133 | 2 |
| i.cs-min:cs-bob-eager | 1376 | 33 | 267 | 3 |
| span.lead:cult-scheme | 1357 | 33 | 267 | 3 |
| path.wash:fill | 219 | 83 | 117 | 12 |
| span.dots:blink | 202 | 67 | 117 | 12 |
| span.worker-fig:panelland-under | 796 | 33 | 133 | 3 |

Longest frames: 282 ms (style/layout/paint) · 175 ms (Lf 151) · 167 ms (style/layout/paint) · 135 ms (Lf 13) · 132 ms (hn 127)

## Round II

Clicks by kind: place 4× p50 112 p95 112 · recruit 5× p50 288 p95 288 · pay 5× p50 223 p95 320 · pick 1× p50 127 p95 127 · choose 3× p50 259 p95 312 · next-round 1× p50 80 p95 80 · 7 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| svg.leader:cult-breathe | 3626 | 33 | 667 | 4 |
| g.blink:cult-blink | 3626 | 33 | 667 | 4 |
| img.sprite:cult-shift | 3626 | 33 | 667 | 4 |
| img.sprite:cult-breathe | 3626 | 33 | 667 | 4 |
| b.seat-delta.up:seatdelta | 6760 | 33 | 667 | 2 |
| span.tc-line:tcline | 2607 | 33 | 667 | 5 |
| i.cs-min:cs-bob | 2280 | 50 | 667 | 5 |
| span.lead:cult-scheme | 2031 | 33 | 667 | 5 |
| i.cs-min:cs-bob-eager | 1936 | 50 | 667 | 5 |
| img.sprite:cult-eager | 373 | 83 | 150 | 15 |
| span.dots:blink | 346 | 83 | 150 | 14 |
| span.base:opacity | 740 | 50 | 217 | 6 |

Longest frames: 658 ms (style/layout/paint) · 383 ms (style/layout/paint) · 236 ms (Lf 209) · 204 ms (hn 189) · 196 ms (TimerHandler:setTimeout 184)

## Round III

Clicks by kind: place 5× p50 – p95 – · choose 8× p50 414 p95 2502 · recruit 5× p50 293 p95 293 · pay 5× p50 255 p95 305 · pick 1× p50 204 p95 204 · next-round 1× p50 141 p95 141 · 8 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 8735 | 33 | 567 | 3 |
| span.tc-line:tcline | 3389 | 50 | 350 | 6 |
| svg.leader:cult-breathe | 4877 | 33 | 567 | 4 |
| g.blink:cult-blink | 4877 | 33 | 567 | 4 |
| img.sprite:cult-shift | 4877 | 33 | 567 | 4 |
| img.sprite:cult-breathe | 4877 | 33 | 567 | 4 |
| i.cs-min:cs-bob | 2395 | 50 | 567 | 7 |
| i.cs-min:cs-bob-eager | 2166 | 50 | 567 | 7 |
| span.lead:cult-scheme | 2263 | 50 | 567 | 6 |
| img.sprite:cult-eager | 485 | 83 | 433 | 19 |
| span.dots:blink | 453 | 83 | 167 | 19 |
| span.worker-fig:panelland-under | 1308 | 50 | 533 | 6 |

Longest frames: 577 ms (Lf 547) · 550 ms (style/layout/paint) · 525 ms (hn 500) · 518 ms (Lf 482) · 439 ms (style/layout/paint)
