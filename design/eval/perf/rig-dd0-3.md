# Perf rig: dd0-3

2026-10-28T08:05:42.101Z · http://localhost:5302 · 4x CPU · relaxed · seed 20261028 · 1 person + 3 Normal bots · 11 min · game finished

Verdict: FAIL (7)
- round I: clicks p95 310 ms (bar 100)
- round I: hovers p95 107 ms (bar 100)
- round II: clicks p95 401 ms (bar 100)
- round III: clicks p95 428 ms (bar 100)
- round III: hovers p95 165 ms (bar 100)
- leak: 4881 elements vs 4350 after a reload
- leak: heap 15.4 MB vs 7.2 MB after a reload

## Per round

| round | clicks p50/p95 ms | hovers p50/p95 ms | show frames p95 ms | hitch % | worst frame | long frames >100ms | idle busy % | idle style ms/3s | elements | listeners | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| I | 114 / 310 | 52 / 107 | 17 | 2 | 267 | 4 | 4 | 35 | 2023 | 498 | 9.7 |
| II | 265 / 401 | 39 / 100 | 33 | 3 | 550 | 17 | 2 | 4 | 2888 | 548 | 13.9 |
| III | 237 / 428 | 41 / 165 | 33 | 3 | 517 | 31 | 3 | 17 | 3315 | 604 | 16.7 |

Leak control on the last turn: unbroken game 4881 elements, 767 listeners, 15.4 MB; after a reload 4350, 713, 7.2 MB.

## Round I

Clicks by kind: place 3× p50 98 p95 114 · recruit 3× p50 310 p95 310 · pay 3× p50 136 p95 170 · next-round 1× p50 79 p95 79 · 1 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 4452 | 33 | 267 | 2 |
| span.tc-line:tcline | 1796 | 33 | 150 | 3 |
| svg.leader:cult-breathe | 2390 | 33 | 267 | 2 |
| g.blink:cult-blink | 2390 | 33 | 267 | 2 |
| img.sprite:cult-shift | 2381 | 33 | 267 | 2 |
| i.cs-min:cs-bob | 1024 | 33 | 267 | 4 |
| i.cs-min:cs-bob-eager | 978 | 33 | 267 | 4 |
| span.lead:cult-scheme | 906 | 33 | 267 | 4 |
| img.sprite:cult-breathe | 1769 | 33 | 100 | 2 |
| span.worker-fig:panelland-under | 763 | 33 | 150 | 4 |
| path.wash:fill | 182 | 67 | 150 | 15 |
| span.dots:blink | 165 | 67 | 100 | 16 |

Longest frames: 287 ms (style/layout/paint) · 121 ms (hn 107) · 116 ms (hn 98) · 102 ms (TimerHandler:setTimeout 13, hn 84) · 95 ms (hn 78)

## Round II

Clicks by kind: place 4× p50 76 p95 76 · choose 6× p50 297 p95 350 · recruit 4× p50 401 p95 401 · pay 4× p50 286 p95 288 · pick 1× p50 73 p95 73 · next-round 1× p50 89 p95 89 · 5 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 6262 | 33 | 550 | 3 |
| span.tc-line:tcline | 2459 | 50 | 183 | 6 |
| svg.leader:cult-breathe | 3360 | 33 | 550 | 4 |
| g.blink:cult-blink | 3360 | 33 | 550 | 4 |
| img.sprite:cult-shift | 3360 | 33 | 550 | 4 |
| img.sprite:cult-breathe | 3360 | 33 | 550 | 4 |
| span.lead:cult-scheme | 1853 | 50 | 550 | 7 |
| i.cs-min:cs-bob | 2086 | 50 | 550 | 6 |
| i.cs-min:cs-bob-eager | 1951 | 50 | 550 | 6 |
| span.base:opacity | 883 | 67 | 233 | 10 |
| path.wash:fill | 297 | 100 | 233 | 21 |
| img.sprite:cult-eager | 309 | 83 | 183 | 19 |

Longest frames: 568 ms (style/layout/paint) · 254 ms (Lf 219) · 210 ms (hn 196) · 201 ms (Lf 177) · 196 ms (hn 178)

## Round III

Clicks by kind: place 5× p50 127 p95 127 · choose 2× p50 237 p95 237 · recruit 6× p50 393 p95 393 · pay 6× p50 304 p95 428 · next-round 1× p50 65 p95 65 · 8 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 11552 | 33 | 517 | 3 |
| span.tc-line:tcline | 5107 | 50 | 283 | 5 |
| i.cs-min:cs-bob | 2599 | 50 | 517 | 8 |
| svg.leader:cult-breathe | 4903 | 33 | 517 | 4 |
| g.blink:cult-blink | 4903 | 33 | 517 | 4 |
| img.sprite:cult-shift | 4903 | 33 | 517 | 4 |
| img.sprite:cult-breathe | 4903 | 33 | 517 | 4 |
| span.lead:cult-scheme | 2496 | 50 | 517 | 7 |
| i.cs-min:cs-bob-eager | 2389 | 50 | 517 | 7 |
| img.sprite:cult-eager | 588 | 83 | 200 | 22 |
| span.dots:blink | 558 | 83 | 200 | 22 |
| div.path-inner:js | 4042 | 33 | 117 | 3 |

Longest frames: 516 ms (style/layout/paint) · 317 ms (hn 270) · 251 ms (Lf 218) · 245 ms (TimerHandler:setTimeout 222) · 229 ms (hn 201, Q 8)
