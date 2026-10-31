# Perf rig: dd0-2

2026-10-28T07:54:53.502Z · http://localhost:5302 · 4x CPU · relaxed · seed 20261028 · 1 person + 3 Normal bots · 11 min · game finished

Verdict: FAIL (6)
- round I: clicks p95 238 ms (bar 100)
- round II: clicks p95 343 ms (bar 100)
- round III: clicks p95 538 ms (bar 100)
- clicks p95 grows 238 → 538 ms over the game
- leak: 4881 elements vs 4350 after a reload
- leak: heap 15.3 MB vs 7.2 MB after a reload

## Per round

| round | clicks p50/p95 ms | hovers p50/p95 ms | show frames p95 ms | hitch % | worst frame | long frames >100ms | idle busy % | idle style ms/3s | elements | listeners | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| I | 125 / 238 | 53 / 91 | 17 | 2 | 283 | 3 | 8 | 32 | 2023 | 498 | 9.7 |
| II | 179 / 343 | 41 / 61 | 33 | 2 | 333 | 9 | 2 | 9 | 2888 | 548 | 14 |
| III | 214 / 538 | 52 / 76 | 33 | 2 | 517 | 23 | 3 | 19 | 3315 | 604 | 16.7 |

Leak control on the last turn: unbroken game 4881 elements, 767 listeners, 15.3 MB; after a reload 4350, 713, 7.2 MB.

## Round I

Clicks by kind: place 3× p50 114 p95 119 · recruit 3× p50 236 p95 238 · pay 3× p50 177 p95 194 · next-round 1× p50 94 p95 94

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 4484 | 17 | 283 | 2 |
| span.tc-line:tcline | 1822 | 33 | 167 | 3 |
| i.cs-min:cs-bob | 816 | 50 | 283 | 6 |
| svg.leader:cult-breathe | 2183 | 33 | 283 | 2 |
| g.blink:cult-blink | 2183 | 33 | 283 | 2 |
| img.sprite:cult-shift | 2166 | 33 | 283 | 2 |
| i.cs-min:cs-bob-eager | 766 | 50 | 283 | 5 |
| img.sprite:cult-breathe | 1776 | 17 | 117 | 2 |
| span.lead:cult-scheme | 706 | 50 | 283 | 5 |
| span.worker-fig:panelland-under | 794 | 33 | 167 | 4 |
| span.base:opacity | 523 | 50 | 100 | 5 |
| span.dots:blink | 181 | 50 | 100 | 14 |

Longest frames: 296 ms (style/layout/paint) · 143 ms (hn 122) · 107 ms (hn 92) · 98 ms (hn 51) · 95 ms (Nf 63)

## Round II

Clicks by kind: place 4× p50 121 p95 121 · choose 6× p50 313 p95 343 · recruit 4× p50 – p95 – · pay 4× p50 179 p95 181 · pick 1× p50 75 p95 75 · next-round 1× p50 74 p95 74 · 6 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 6500 | 33 | 333 | 2 |
| svg.leader:cult-breathe | 3779 | 33 | 333 | 3 |
| g.blink:cult-blink | 3779 | 33 | 333 | 3 |
| img.sprite:cult-shift | 3779 | 33 | 333 | 3 |
| img.sprite:cult-breathe | 3779 | 33 | 333 | 3 |
| i.cs-min:cs-bob-eager | 2160 | 33 | 333 | 4 |
| span.tc-line:tcline | 2581 | 33 | 117 | 3 |
| i.cs-min:cs-bob | 2455 | 33 | 333 | 3 |
| span.lead:cult-scheme | 2230 | 33 | 333 | 3 |
| span.base:opacity | 953 | 50 | 267 | 7 |
| path.wash:fill | 306 | 83 | 267 | 18 |
| span.worker-fig:panelland-under | 1043 | 33 | 267 | 5 |

Longest frames: 348 ms (style/layout/paint) · 244 ms (hn 226) · 237 ms (Lf 208) · 193 ms (hn 183) · 190 ms (Lf 159)

## Round III

Clicks by kind: place 5× p50 91 p95 121 · choose 2× p50 263 p95 263 · recruit 6× p50 538 p95 538 · pay 6× p50 245 p95 401 · next-round 1× p50 76 p95 76 · 5 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 11709 | 33 | 517 | 3 |
| span.tc-line:tcline | 5108 | 33 | 167 | 5 |
| i.cs-min:cs-bob | 2324 | 50 | 517 | 8 |
| svg.leader:cult-breathe | 4631 | 33 | 517 | 4 |
| g.blink:cult-blink | 4631 | 33 | 517 | 4 |
| img.sprite:cult-shift | 4631 | 33 | 517 | 4 |
| img.sprite:cult-breathe | 4631 | 33 | 517 | 4 |
| i.cs-min:cs-bob-eager | 2002 | 50 | 517 | 8 |
| span.lead:cult-scheme | 2102 | 50 | 517 | 7 |
| img.sprite:cult-eager | 573 | 83 | 183 | 20 |
| span.dots:blink | 529 | 83 | 150 | 19 |
| span.base:opacity | 916 | 50 | 283 | 9 |

Longest frames: 531 ms (style/layout/paint) · 287 ms (hn 257) · 200 ms (hn 182, Q 6) · 192 ms (Lf 167) · 179 ms (hn 5, hn 146, FrameRequestCallback 18)
