# Perf rig: before-v090

2026-10-28T03:36:34.598Z · http://localhost:5290 · 4x CPU · relaxed · seed 20261028 · 1 person + 3 Normal bots · 11 min · game finished

Verdict: FAIL (14)
- round I: clicks p95 472 ms (bar 100)
- round I: idle table busy 21% (bar 10%)
- round II: clicks p95 960 ms (bar 100)
- round II: hovers p95 137 ms (bar 100)
- round II: idle table busy 37% (bar 10%)
- round III: clicks p95 636 ms (bar 100)
- round III: hovers p95 125 ms (bar 100)
- round III: show frames p95 50 ms (bar 33.4)
- round III: 7% of show frames hitch (bar 5%)
- round III: idle table busy 56% (bar 10%)
- idle busy grows 21% → 56% over the game
- leak: 6431 elements vs 4676 after a reload
- leak: 836 listeners vs 730 after a reload
- leak: heap 17.6 MB vs 7.2 MB after a reload

## Per round

| round | clicks p50/p95 ms | hovers p50/p95 ms | show frames p95 ms | hitch % | worst frame | long frames >100ms | idle busy % | idle style ms/3s | elements | listeners | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| I | 178 / 472 | 48 / 74 | 33 | 2 | 300 | 16 | 21 | 160 | 1849 | 485 | 8.6 |
| II | 317 / 960 | 58 / 137 | 33 | 4 | 450 | 36 | 37 | 238 | 3130 | 546 | 14.7 |
| III | 270 / 636 | 60 / 125 | 50 | 7 | 1017 | 110 | 56 | 308 | 3570 | 592 | 20.3 |

Leak control on the last turn: unbroken game 6431 elements, 836 listeners, 17.6 MB; after a reload 4676, 730, 7.2 MB.

## Round I

Clicks by kind: place 3× p50 192 p95 192 · choose 10× p50 178 p95 472 · recruit 3× p50 217 p95 299 · pay 3× p50 167 p95 243 · next-round 1× p50 71 p95 71 · 1 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 3912 | 33 | 300 | 3 |
| svg.leader:cult-breathe | 2361 | 33 | 183 | 3 |
| g.blink:cult-blink | 2361 | 33 | 183 | 3 |
| span.tc-line:tcline | 1535 | 33 | 267 | 4 |
| i.cs-min:cs-bob | 1030 | 33 | 183 | 5 |
| span.lead:cult-scheme | 984 | 33 | 183 | 5 |
| div.path-inner:js | 1612 | 33 | 267 | 3 |
| span.base:opacity | 592 | 50 | 300 | 7 |
| i.cs-min:cs-bob-eager | 824 | 50 | 183 | 5 |
| img.sprite:cult-shift | 2020 | 33 | 150 | 2 |
| img.sprite:cult-breathe | 1987 | 33 | 150 | 2 |
| path.wash:fill | 203 | 83 | 300 | 19 |

Longest frames: 282 ms (hn 229, I 35) · 237 ms (hn 34, hn 5, hn 8) · 206 ms (hn 204) · 200 ms (hn 168) · 200 ms (hn 157, I 9)

## Round II

Clicks by kind: place 4× p50 109 p95 109 · choose 7× p50 317 p95 960 · recruit 4× p50 331 p95 331 · pay 4× p50 333 p95 439 · pick 1× p50 124 p95 124 · next-round 1× p50 – p95 – · 7 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 6317 | 33 | 450 | 5 |
| span.tc-line:tcline | 2747 | 50 | 450 | 7 |
| svg.leader:cult-breathe | 3331 | 33 | 450 | 5 |
| g.blink:cult-blink | 3331 | 33 | 450 | 5 |
| img.sprite:cult-shift | 3331 | 33 | 450 | 5 |
| img.sprite:cult-breathe | 3331 | 33 | 450 | 5 |
| i.cs-min:cs-bob | 2029 | 50 | 450 | 7 |
| i.cs-min:cs-bob-eager | 1624 | 50 | 450 | 8 |
| span.lead:cult-scheme | 1940 | 50 | 450 | 6 |
| div.path-inner:js | 2438 | 33 | 367 | 4 |
| span.base:opacity | 631 | 67 | 333 | 13 |
| span.worker-fig:panelland-under | 913 | 50 | 450 | 8 |

Longest frames: 462 ms (style/layout/paint) · 367 ms (Worker.onmessage 53) · 341 ms (style/layout/paint) · 319 ms (Nf 36, e 182, FrameRequestCallback 12) · 318 ms (hn 242)

## Round III

Clicks by kind: place 5× p50 636 p95 636 · pick 1× p50 107 p95 107 · choose 6× p50 348 p95 542 · recruit 6× p50 253 p95 253 · pay 6× p50 297 p95 412 · next-round 1× p50 – p95 – · 8 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 6808 | 67 | 1017 | 9 |
| svg.leader:cult-breathe | 4834 | 50 | 1017 | 7 |
| g.blink:cult-blink | 4834 | 50 | 1017 | 7 |
| img.sprite:cult-shift | 4834 | 50 | 1017 | 7 |
| img.sprite:cult-breathe | 4834 | 50 | 1017 | 7 |
| span.tc-line:tcline | 2474 | 83 | 1017 | 13 |
| i.cs-min:cs-bob | 2635 | 67 | 1017 | 10 |
| i.cs-min:cs-bob-eager | 2425 | 67 | 1017 | 10 |
| span.lead:cult-scheme | 2623 | 67 | 867 | 9 |
| div.path-inner:js | 2514 | 50 | 667 | 8 |
| div.piece-flight.piece-res:js | 2420 | 50 | 417 | 8 |
| span.cs-stack:js | 2228 | 50 | 450 | 7 |

Longest frames: 1022 ms (hn 899) · 863 ms (Nf 841) · 823 ms (style/layout/paint) · 436 ms (style/layout/paint) · 420 ms (hn 363, FrameRequestCallback 6)
