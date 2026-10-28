# Perf rig: v091-base-rig-dd0

2026-10-28T06:40:35.663Z · http://localhost:5291 · 4x CPU · relaxed · seed 20261028 · 1 person + 3 Normal bots · 10 min · game finished

Verdict: FAIL (9)
- round I: clicks p95 406 ms (bar 100)
- round I: idle table busy 50% (bar 10%)
- round II: clicks p95 411 ms (bar 100)
- round II: idle table busy 15% (bar 10%)
- round III: clicks p95 397 ms (bar 100)
- round III: hovers p95 114 ms (bar 100)
- round III: idle table busy 20% (bar 10%)
- leak: 6271 elements vs 4524 after a reload
- leak: 829 listeners vs 723 after a reload

## Per round

| round | clicks p50/p95 ms | hovers p50/p95 ms | show frames p95 ms | hitch % | worst frame | long frames >100ms | idle busy % | idle style ms/3s | elements | listeners | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| I | 161 / 406 | 56 / 90 | 17 | 1 | 267 | 8 | 50 | 162 | 2024 | 508 | 9.8 |
| II | 185 / 411 | 55 / 73 | 17 | 2 | 400 | 13 | 15 | 153 | 3164 | 552 | 15.7 |
| III | 224 / 397 | 68 / 114 | 33 | 3 | 450 | 31 | 20 | 197 | 3408 | 590 | 19.5 |

Leak control on the last turn: unbroken game 6271 elements, 829 listeners, 15.5 MB; after a reload 4524, 723, 7.1 MB.

## Round I

Clicks by kind: place 3× p50 101 p95 101 · choose 7× p50 203 p95 406 · recruit 3× p50 – p95 – · pay 3× p50 161 p95 212 · next-round 1× p50 78 p95 78 · 4 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| i.cs-min:cs-bob | 1751 | 33 | 267 | 4 |
| span.lead:cult-scheme | 1566 | 33 | 267 | 4 |
| svg.leader:cult-breathe | 3107 | 33 | 267 | 2 |
| g.blink:cult-blink | 3107 | 33 | 267 | 2 |
| img.sprite:cult-shift | 3088 | 33 | 267 | 2 |
| i.cs-min:cs-bob-eager | 1458 | 33 | 267 | 4 |
| span.tc-line:tcline | 1927 | 33 | 200 | 3 |
| b.seat-delta.up:seatdelta | 4951 | 17 | 267 | 1 |
| img.sprite:cult-breathe | 2300 | 33 | 200 | 2 |
| span.dots:blink | 187 | 83 | 150 | 16 |
| span.worker-fig:panelland-under | 728 | 33 | 150 | 4 |
| img.sprite:cult-eager | 137 | 83 | 150 | 19 |

Longest frames: 283 ms (style/layout/paint) · 194 ms (Nf 156) · 145 ms (hn 57, TimerHandler:setTimeout 60) · 129 ms (hn 111) · 125 ms (hn 113)

## Round II

Clicks by kind: place 5× p50 95 p95 95 · recruit 4× p50 236 p95 236 · pay 4× p50 216 p95 278 · pick 1× p50 103 p95 103 · choose 1× p50 411 p95 411 · next-round 1× p50 – p95 – · 7 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 6454 | 33 | 400 | 2 |
| svg.leader:cult-breathe | 3815 | 33 | 400 | 3 |
| g.blink:cult-blink | 3815 | 33 | 400 | 3 |
| img.sprite:cult-shift | 3815 | 33 | 400 | 3 |
| img.sprite:cult-breathe | 3815 | 33 | 400 | 3 |
| span.tc-line:tcline | 2488 | 33 | 167 | 4 |
| span.lead:cult-scheme | 2193 | 33 | 400 | 4 |
| i.cs-min:cs-bob-eager | 1921 | 33 | 400 | 4 |
| i.cs-min:cs-bob | 2484 | 33 | 400 | 3 |
| img.sprite:cult-eager | 346 | 67 | 133 | 16 |
| span.dots:blink | 324 | 83 | 133 | 16 |
| path.wash:fill | 251 | 100 | 233 | 16 |

Longest frames: 409 ms (style/layout/paint) · 232 ms (Nf 208) · 203 ms (hn 186) · 157 ms (TimerHandler:setTimeout 8, FrameRequestCallback 7) · 140 ms (hn 67, Nf 34)

## Round III

Clicks by kind: place 5× p50 277 p95 277 · pick 1× p50 98 p95 98 · choose 6× p50 327 p95 397 · recruit 5× p50 302 p95 322 · pay 6× p50 194 p95 256 · next-round 1× p50 79 p95 79 · 5 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 8978 | 33 | 450 | 3 |
| span.tc-line:tcline | 3778 | 50 | 250 | 5 |
| svg.leader:cult-breathe | 4690 | 33 | 367 | 4 |
| g.blink:cult-blink | 4690 | 33 | 367 | 4 |
| img.sprite:cult-shift | 4690 | 33 | 367 | 4 |
| img.sprite:cult-breathe | 4690 | 33 | 367 | 4 |
| i.cs-min:cs-bob | 2417 | 50 | 367 | 7 |
| span.lead:cult-scheme | 2133 | 50 | 367 | 7 |
| i.cs-min:cs-bob-eager | 2204 | 50 | 367 | 6 |
| img.sprite:cult-eager | 475 | 83 | 183 | 24 |
| span.dots:blink | 456 | 83 | 183 | 23 |
| path.wash:fill | 314 | 83 | 450 | 25 |

Longest frames: 432 ms (hn 345) · 415 ms (Nf 398) · 394 ms (Nf 364) · 386 ms (style/layout/paint) · 230 ms (hn 218)
