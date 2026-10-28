# Perf rig: after-fix1-3

2026-10-28T04:40:09.273Z · http://localhost:5292 · 4x CPU · relaxed · seed 20261028 · 1 person + 3 Normal bots · 10 min · game finished

Verdict: FAIL (9)
- round I: clicks p95 447 ms (bar 100)
- round I: idle table busy 18% (bar 10%)
- round II: clicks p95 206 ms (bar 100)
- round II: idle table busy 28% (bar 10%)
- round III: clicks p95 302 ms (bar 100)
- round III: idle table busy 29% (bar 10%)
- idle busy grows 18% → 29% over the game
- leak: 5054 elements vs 4539 after a reload
- leak: heap 15.4 MB vs 7.3 MB after a reload

## Per round

| round | clicks p50/p95 ms | hovers p50/p95 ms | show frames p95 ms | hitch % | worst frame | long frames >100ms | idle busy % | idle style ms/3s | elements | listeners | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| I | 135 / 447 | 44 / 70 | 17 | 1 | 250 | 4 | 18 | 153 | 2023 | 506 | 9.8 |
| II | 152 / 206 | 35 / 86 | 17 | 1 | 350 | 11 | 28 | 206 | 2889 | 548 | 14 |
| III | 192 / 302 | 33 / 72 | 33 | 2 | 700 | 20 | 29 | 282 | 3337 | 595 | 16.5 |

Leak control on the last turn: unbroken game 5054 elements, 787 listeners, 15.4 MB; after a reload 4539, 733, 7.3 MB.

## Round I

Clicks by kind: place 4× p50 108 p95 115 · choose 5× p50 156 p95 447 · recruit 3× p50 204 p95 224 · pay 3× p50 145 p95 147 · next-round 1× p50 74 p95 74

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 4919 | 17 | 250 | 1 |
| svg.leader:cult-breathe | 2314 | 33 | 250 | 2 |
| g.blink:cult-blink | 2314 | 33 | 250 | 2 |
| img.sprite:cult-shift | 2300 | 33 | 250 | 2 |
| span.tc-line:tcline | 2016 | 33 | 117 | 2 |
| i.cs-min:cs-bob | 968 | 33 | 250 | 4 |
| i.cs-min:cs-bob-eager | 846 | 33 | 250 | 4 |
| span.lead:cult-scheme | 868 | 33 | 250 | 3 |
| span.worker-fig:panelland-under | 828 | 33 | 133 | 3 |
| path.wash:fill | 218 | 67 | 133 | 11 |
| img.sprite:cult-breathe | 1922 | 17 | 100 | 1 |
| span.worker:land | 634 | 33 | 100 | 3 |

Longest frames: 276 ms (style/layout/paint) · 252 ms (Lf 221) · 122 ms (hn 103) · 107 ms (hn 6, hn 70) · 88 ms (TimerHandler:setTimeout 7, hn 61)

## Round II

Clicks by kind: place 4× p50 118 p95 118 · recruit 5× p50 204 p95 204 · pay 5× p50 178 p95 206 · choose 3× p50 152 p95 195 · next-round 1× p50 72 p95 72 · 5 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 7362 | 17 | 350 | 2 |
| i.cs-min:cs-bob | 2115 | 33 | 350 | 4 |
| span.tc-line:tcline | 2787 | 33 | 217 | 3 |
| i.cs-min:cs-bob-eager | 2011 | 33 | 350 | 4 |
| span.lead:cult-scheme | 1934 | 33 | 350 | 4 |
| svg.leader:cult-breathe | 3454 | 33 | 350 | 2 |
| g.blink:cult-blink | 3454 | 33 | 350 | 2 |
| img.sprite:cult-shift | 3454 | 33 | 350 | 2 |
| img.sprite:cult-breathe | 3454 | 33 | 350 | 2 |
| img.sprite:cult-eager | 312 | 67 | 100 | 14 |
| path.wash:fill | 289 | 67 | 217 | 15 |
| span.dots:blink | 295 | 67 | 100 | 14 |

Longest frames: 359 ms (style/layout/paint) · 225 ms (Lf 198) · 216 ms (hn 177) · 133 ms (hn 114) · 132 ms (hn 120)

## Round III

Clicks by kind: place 5× p50 99 p95 116 · recruit 7× p50 270 p95 285 · pay 7× p50 170 p95 232 · choose 5× p50 243 p95 302 · next-round 1× p50 75 p95 75 · 5 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 9570 | 33 | 700 | 3 |
| span.tc-line:tcline | 3568 | 33 | 267 | 4 |
| svg.leader:cult-breathe | 4714 | 33 | 700 | 3 |
| g.blink:cult-blink | 4714 | 33 | 700 | 3 |
| img.sprite:cult-shift | 4714 | 33 | 700 | 3 |
| img.sprite:cult-breathe | 4714 | 33 | 700 | 3 |
| i.cs-min:cs-bob | 2227 | 50 | 700 | 6 |
| i.cs-min:cs-bob-eager | 1851 | 50 | 700 | 6 |
| span.lead:cult-scheme | 2125 | 50 | 700 | 5 |
| img.sprite:cult-eager | 368 | 83 | 183 | 21 |
| span.dots:blink | 334 | 83 | 133 | 21 |
| div.path-inner:js | 3260 | 33 | 400 | 2 |

Longest frames: 721 ms (style/layout/paint) · 552 ms (hn 449) · 374 ms (hn 356) · 242 ms (Lf 54, e 121) · 238 ms (Lf 208)
