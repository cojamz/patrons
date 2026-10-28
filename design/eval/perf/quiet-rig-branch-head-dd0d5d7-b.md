# Perf rig: branch-head-dd0d5d7-b

2026-10-28T06:20:16.790Z · http://localhost:5293 · 4x CPU · relaxed · seed 20261028 · 1 person + 3 Normal bots · 10 min · game finished

Verdict: FAIL (9)
- round I: clicks p95 443 ms (bar 100)
- round I: hovers p95 106 ms (bar 100)
- round I: idle table busy 48% (bar 10%)
- round II: clicks p95 2524 ms (bar 100)
- round III: clicks p95 3347 ms (bar 100)
- clicks p95 grows 443 → 3347 ms over the game
- leak: 6399 elements vs 4807 after a reload
- leak: 835 listeners vs 727 after a reload
- leak: heap 16.4 MB vs 7.3 MB after a reload

## Per round

| round | clicks p50/p95 ms | hovers p50/p95 ms | show frames p95 ms | hitch % | worst frame | long frames >100ms | idle busy % | idle style ms/3s | elements | listeners | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| I | 180 / 443 | 58 / 106 | 17 | 1 | 300 | 10 | 48 | 159 | 2023 | 505 | 9.8 |
| II | 251 / 2524 | 41 / 80 | 33 | 2 | 883 | 23 | 2 | 11 | 2939 | 550 | 14.6 |
| III | 252 / 3347 | 47 / 75 | 33 | 2 | 783 | 35 | 4 | 24 | 3291 | 604 | 17.2 |

Leak control on the last turn: unbroken game 6399 elements, 835 listeners, 16.4 MB; after a reload 4807, 727, 7.3 MB.

## Round I

Clicks by kind: place 3× p50 117 p95 117 · choose 7× p50 227 p95 443 · recruit 3× p50 243 p95 243 · pay 3× p50 165 p95 205 · next-round 1× p50 153 p95 153 · 2 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 4699 | 17 | 300 | 2 |
| span.tc-line:tcline | 1946 | 33 | 167 | 3 |
| svg.leader:cult-breathe | 2664 | 33 | 300 | 2 |
| g.blink:cult-blink | 2664 | 33 | 300 | 2 |
| img.sprite:cult-shift | 2649 | 33 | 300 | 2 |
| i.cs-min:cs-bob | 1320 | 33 | 300 | 4 |
| i.cs-min:cs-bob-eager | 1272 | 33 | 300 | 4 |
| span.lead:cult-scheme | 1248 | 33 | 300 | 4 |
| img.sprite:cult-breathe | 1832 | 17 | 150 | 2 |
| span.dots:blink | 173 | 67 | 100 | 17 |
| span.worker-fig:panelland-under | 725 | 33 | 250 | 4 |
| span.base:opacity | 638 | 33 | 250 | 4 |

Longest frames: 327 ms (style/layout/paint) · 222 ms (Lf 192) · 202 ms (hn 175) · 146 ms (hn 128) · 143 ms (style/layout/paint)

## Round II

Clicks by kind: place 5× p50 152 p95 152 · recruit 4× p50 251 p95 251 · pay 4× p50 287 p95 299 · choose 8× p50 275 p95 2524 · next-round 1× p50 85 p95 85 · 5 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 6001 | 33 | 883 | 3 |
| span.tc-line:tcline | 2622 | 33 | 283 | 4 |
| svg.leader:cult-breathe | 3395 | 33 | 883 | 3 |
| g.blink:cult-blink | 3395 | 33 | 883 | 3 |
| img.sprite:cult-shift | 3395 | 33 | 883 | 3 |
| img.sprite:cult-breathe | 3395 | 33 | 883 | 3 |
| i.cs-min:cs-bob | 2052 | 33 | 883 | 4 |
| span.lead:cult-scheme | 1966 | 33 | 883 | 4 |
| i.cs-min:cs-bob-eager | 1855 | 33 | 883 | 4 |
| span.base:opacity | 778 | 50 | 267 | 7 |
| img.sprite:cult-eager | 315 | 83 | 150 | 16 |
| path.wash:fill | 278 | 100 | 283 | 18 |

Longest frames: 880 ms (FrameRequestCallback 6) · 566 ms (style/layout/paint) · 272 ms (hn 266) · 247 ms (e 172, Nf 28) · 244 ms (hn 217)

## Round III

Clicks by kind: place 5× p50 – p95 – · recruit 5× p50 311 p95 371 · pay 5× p50 223 p95 251 · choose 12× p50 362 p95 3692 · pick 2× p50 122 p95 122 · next-round 1× p50 78 p95 78 · 7 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 9071 | 33 | 733 | 3 |
| svg.leader:cult-breathe | 3810 | 33 | 733 | 5 |
| g.blink:cult-blink | 3810 | 33 | 733 | 5 |
| img.sprite:cult-shift | 3810 | 33 | 733 | 5 |
| img.sprite:cult-breathe | 3810 | 33 | 733 | 5 |
| span.tc-line:tcline | 3214 | 50 | 217 | 5 |
| i.cs-min:cs-bob | 1976 | 50 | 733 | 8 |
| i.cs-min:cs-bob-eager | 1634 | 50 | 733 | 9 |
| span.lead:cult-scheme | 1865 | 50 | 733 | 7 |
| img.sprite:cult-eager | 433 | 83 | 500 | 20 |
| span.base:opacity | 1020 | 50 | 783 | 8 |
| path.wash:fill | 382 | 100 | 783 | 21 |

Longest frames: 761 ms (hn 733) · 724 ms (hn 714) · 626 ms (Lf 605) · 568 ms (style/layout/paint) · 519 ms (style/layout/paint)
