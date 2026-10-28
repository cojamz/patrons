# Perf rig: after-all

2026-10-28T04:57:45.754Z · http://localhost:5293 · 4x CPU · relaxed · seed 20261028 · 1 person + 3 Normal bots · 10 min · game finished

Verdict: FAIL (7)
- round I: clicks p95 402 ms (bar 100)
- round II: clicks p95 239 ms (bar 100)
- round III: clicks p95 321 ms (bar 100)
- round III: hovers p95 188 ms (bar 100)
- idle busy grows 1% → 10% over the game
- leak: 6118 elements vs 4521 after a reload
- leak: 839 listeners vs 731 after a reload

## Per round

| round | clicks p50/p95 ms | hovers p50/p95 ms | show frames p95 ms | hitch % | worst frame | long frames >100ms | idle busy % | idle style ms/3s | elements | listeners | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| I | 129 / 402 | 36 / 67 | 17 | 1 | 317 | 2 | 1 | 1 | 2023 | 506 | 9.6 |
| II | 157 / 239 | 36 / 63 | 17 | 1 | 367 | 5 | 10 | 56 | 2889 | 548 | 14 |
| III | 185 / 321 | 35 / 188 | 17 | 1 | 417 | 10 | 10 | 57 | 3328 | 595 | 20.4 |

Leak control on the last turn: unbroken game 6118 elements, 839 listeners, 15.5 MB; after a reload 4521, 731, 7.3 MB.

## Round I

Clicks by kind: place 4× p50 85 p95 131 · choose 5× p50 142 p95 402 · recruit 3× p50 197 p95 201 · pay 3× p50 120 p95 129 · next-round 1× p50 70 p95 70

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 4958 | 17 | 317 | 1 |
| svg.leader:cult-breathe | 2278 | 17 | 317 | 1 |
| g.blink:cult-blink | 2278 | 17 | 317 | 1 |
| img.sprite:cult-shift | 2262 | 17 | 317 | 1 |
| span.tc-line:tcline | 1987 | 17 | 100 | 1 |
| img.sprite:cult-breathe | 1898 | 17 | 67 | 1 |
| i.cs-min:cs-bob | 933 | 33 | 317 | 2 |
| div.path-inner:js | 1776 | 17 | 83 | 1 |
| span.lead:cult-scheme | 825 | 33 | 317 | 2 |
| i.cs-min:cs-bob-eager | 807 | 33 | 317 | 2 |
| span.worker:land | 650 | 33 | 83 | 2 |
| path.wash:fill | 222 | 33 | 67 | 5 |

Longest frames: 340 ms (style/layout/paint) · 146 ms (Lf 119) · 87 ms (hn 68) · 84 ms (hn 64) · 79 ms (hn 8, hn 63)

## Round II

Clicks by kind: place 4× p50 69 p95 104 · recruit 5× p50 182 p95 228 · pay 5× p50 157 p95 239 · choose 3× p50 165 p95 185 · next-round 1× p50 83 p95 83 · 1 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 7194 | 17 | 367 | 1 |
| span.tc-line:tcline | 2803 | 33 | 283 | 2 |
| svg.leader:cult-breathe | 2475 | 33 | 367 | 2 |
| g.blink:cult-blink | 2475 | 33 | 367 | 2 |
| img.sprite:cult-shift | 2475 | 33 | 367 | 2 |
| img.sprite:cult-breathe | 2475 | 33 | 367 | 2 |
| i.cs-min:cs-bob | 1137 | 33 | 367 | 4 |
| span.lead:cult-scheme | 1079 | 33 | 367 | 4 |
| i.cs-min:cs-bob-eager | 1032 | 33 | 367 | 4 |
| path.wash:fill | 306 | 67 | 133 | 9 |
| div.path-inner:js | 2657 | 17 | 100 | 1 |
| img.sprite:cult-eager | 244 | 50 | 67 | 9 |

Longest frames: 386 ms (FrameRequestCallback 6) · 293 ms (Lf 261) · 123 ms (style/layout/paint) · 112 ms (Lf 67, e 22) · 107 ms (hn 76)

## Round III

Clicks by kind: place 6× p50 89 p95 94 · recruit 7× p50 236 p95 238 · pay 7× p50 154 p95 249 · pick 2× p50 104 p95 104 · choose 3× p50 321 p95 389 · next-round 1× p50 69 p95 69 · 4 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 9136 | 17 | 417 | 2 |
| span.tc-line:tcline | 3610 | 33 | 150 | 3 |
| svg.leader:cult-breathe | 4755 | 33 | 417 | 2 |
| g.blink:cult-blink | 4755 | 33 | 417 | 2 |
| img.sprite:cult-shift | 4755 | 33 | 417 | 2 |
| img.sprite:cult-breathe | 4755 | 33 | 417 | 2 |
| i.cs-min:cs-bob | 2221 | 33 | 417 | 4 |
| i.cs-min:cs-bob-eager | 2035 | 33 | 417 | 4 |
| span.lead:cult-scheme | 2028 | 33 | 417 | 4 |
| span.base:opacity | 925 | 50 | 317 | 6 |
| img.sprite:cult-eager | 338 | 67 | 133 | 16 |
| span.dots:blink | 313 | 67 | 100 | 16 |

Longest frames: 429 ms (style/layout/paint) · 312 ms (Lf 285) · 225 ms (Lf 187) · 189 ms (Lf 12) · 134 ms (hn 5, hn 106)
