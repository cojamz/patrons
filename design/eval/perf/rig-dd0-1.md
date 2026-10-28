# Perf rig: dd0-1

2026-10-28T07:44:17.973Z · http://localhost:5302 · 4x CPU · relaxed · seed 20261028 · 1 person + 3 Normal bots · 11 min · game finished

Verdict: FAIL (7)
- round I: clicks p95 224 ms (bar 100)
- round II: clicks p95 326 ms (bar 100)
- round III: clicks p95 285 ms (bar 100)
- round III: hovers p95 140 ms (bar 100)
- leak: 5969 elements vs 4350 after a reload
- leak: 821 listeners vs 713 after a reload
- leak: heap 15.6 MB vs 7.2 MB after a reload

## Per round

| round | clicks p50/p95 ms | hovers p50/p95 ms | show frames p95 ms | hitch % | worst frame | long frames >100ms | idle busy % | idle style ms/3s | elements | listeners | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| I | 120 / 224 | 54 / 77 | 17 | 1 | 250 | 4 | 4 | 33 | 2023 | 498 | 9.7 |
| II | 192 / 326 | 35 / 96 | 33 | 2 | 550 | 12 | 2 | 7 | 2888 | 548 | 14 |
| III | 220 / 285 | 44 / 140 | 33 | 3 | 517 | 26 | 4 | 23 | 3315 | 604 | 16.8 |

Leak control on the last turn: unbroken game 5969 elements, 821 listeners, 15.6 MB; after a reload 4350, 713, 7.2 MB.

## Round I

Clicks by kind: place 3× p50 86 p95 110 · recruit 3× p50 224 p95 224 · pay 3× p50 160 p95 220 · next-round 1× p50 87 p95 87 · 2 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| svg.leader:cult-breathe | 2637 | 33 | 250 | 2 |
| g.blink:cult-blink | 2637 | 33 | 250 | 2 |
| img.sprite:cult-shift | 2619 | 17 | 250 | 2 |
| b.seat-delta.up:seatdelta | 4505 | 17 | 250 | 1 |
| span.lead:cult-scheme | 1049 | 33 | 250 | 4 |
| i.cs-min:cs-bob-eager | 1003 | 33 | 250 | 4 |
| i.cs-min:cs-bob | 1288 | 33 | 250 | 3 |
| span.tc-line:tcline | 1841 | 33 | 133 | 2 |
| span.worker-fig:panelland-under | 797 | 33 | 117 | 3 |
| span.dots:blink | 162 | 67 | 133 | 14 |
| path.wash:fill | 202 | 67 | 117 | 10 |
| img.sprite:cult-breathe | 1991 | 17 | 117 | 1 |

Longest frames: 264 ms (style/layout/paint) · 133 ms (style/layout/paint) · 128 ms (TimerHandler:setTimeout 6, hn 97) · 116 ms (Lf 5, Nf 11, Nf 43) · 93 ms (style/layout/paint)

## Round II

Clicks by kind: place 4× p50 139 p95 139 · choose 6× p50 230 p95 326 · recruit 4× p50 257 p95 268 · pay 4× p50 169 p95 192 · pick 1× p50 81 p95 81 · next-round 1× p50 123 p95 123 · 3 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 6397 | 33 | 550 | 3 |
| span.tc-line:tcline | 2491 | 33 | 200 | 5 |
| svg.leader:cult-breathe | 2895 | 33 | 550 | 4 |
| g.blink:cult-blink | 2895 | 33 | 550 | 4 |
| img.sprite:cult-shift | 2895 | 33 | 550 | 4 |
| img.sprite:cult-breathe | 2895 | 33 | 550 | 4 |
| i.cs-min:cs-bob | 1567 | 50 | 550 | 6 |
| i.cs-min:cs-bob-eager | 1494 | 50 | 550 | 6 |
| span.lead:cult-scheme | 1362 | 50 | 550 | 6 |
| span.base:opacity | 941 | 50 | 300 | 7 |
| path.wash:fill | 294 | 100 | 183 | 19 |
| span.worker-fig:panelland-under | 1050 | 33 | 183 | 5 |

Longest frames: 572 ms (style/layout/paint) · 279 ms (Lf 248, FrameRequestCallback 5) · 177 ms (Lf 159) · 167 ms (e 109, Nf 18, FrameRequestCallback 6) · 152 ms (hn 137)

## Round III

Clicks by kind: place 5× p50 98 p95 108 · choose 2× p50 258 p95 258 · recruit 6× p50 – p95 – · pay 6× p50 264 p95 285 · next-round 1× p50 86 p95 86 · 8 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 11632 | 33 | 517 | 3 |
| span.tc-line:tcline | 5115 | 33 | 217 | 5 |
| svg.leader:cult-breathe | 5163 | 33 | 517 | 4 |
| g.blink:cult-blink | 5163 | 33 | 517 | 4 |
| img.sprite:cult-shift | 5163 | 33 | 517 | 4 |
| img.sprite:cult-breathe | 5163 | 33 | 517 | 4 |
| i.cs-min:cs-bob | 2864 | 50 | 517 | 6 |
| span.lead:cult-scheme | 2687 | 50 | 517 | 6 |
| i.cs-min:cs-bob-eager | 2436 | 50 | 517 | 6 |
| img.sprite:cult-eager | 582 | 83 | 200 | 21 |
| span.dots:blink | 548 | 83 | 200 | 20 |
| div.path-inner:js | 4011 | 33 | 217 | 2 |

Longest frames: 523 ms (style/layout/paint) · 287 ms (hn 237) · 224 ms (hn 182) · 204 ms (hn 188) · 178 ms (hn 92)
