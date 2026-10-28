# Perf rig: branch-head-dd0d5d7-c

2026-10-28T06:30:27.106Z · http://localhost:5293 · 4x CPU · relaxed · seed 20261029 · 1 person + 3 Normal bots · 10 min · game finished

Verdict: FAIL (9)
- round I: clicks p95 543 ms (bar 100)
- round II: clicks p95 454 ms (bar 100)
- round II: hovers p95 119 ms (bar 100)
- round II: idle table busy 18% (bar 10%)
- round III: clicks p95 434 ms (bar 100)
- round III: hovers p95 118 ms (bar 100)
- leak: 6579 elements vs 4923 after a reload
- leak: 862 listeners vs 754 after a reload
- leak: heap 16.5 MB vs 7.4 MB after a reload

## Per round

| round | clicks p50/p95 ms | hovers p50/p95 ms | show frames p95 ms | hitch % | worst frame | long frames >100ms | idle busy % | idle style ms/3s | elements | listeners | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| I | 162 / 543 | 45 / 96 | 17 | 1 | 300 | 11 | 1 | 1 | 2061 | 505 | 9.8 |
| II | 196 / 454 | 48 / 119 | 17 | 2 | 2383 | 18 | 18 | 73 | 3044 | 551 | 14.4 |
| III | 228 / 434 | 49 / 118 | 33 | 3 | 633 | 36 | 6 | 41 | 3511 | 610 | 17.1 |

Leak control on the last turn: unbroken game 6579 elements, 862 listeners, 16.5 MB; after a reload 4923, 754, 7.4 MB.

## Round I

Clicks by kind: place 4× p50 86 p95 98 · choose 3× p50 272 p95 543 · recruit 3× p50 197 p95 197 · pay 3× p50 162 p95 168 · next-round 1× p50 77 p95 77 · 3 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 4422 | 17 | 300 | 2 |
| svg.leader:cult-breathe | 3066 | 17 | 300 | 2 |
| g.blink:cult-blink | 3066 | 17 | 300 | 2 |
| img.sprite:cult-shift | 3048 | 17 | 300 | 2 |
| span.tc-line:tcline | 1767 | 33 | 167 | 3 |
| i.cs-min:cs-bob | 1690 | 33 | 300 | 3 |
| span.lead:cult-scheme | 1624 | 33 | 300 | 3 |
| i.cs-min:cs-bob-eager | 1330 | 33 | 300 | 3 |
| path.wash:fill | 240 | 83 | 150 | 13 |
| span.worker-fig:panelland-under | 748 | 33 | 150 | 4 |
| span.base:opacity | 596 | 50 | 167 | 5 |
| img.sprite:cult-breathe | 2416 | 17 | 167 | 1 |

Longest frames: 325 ms (style/layout/paint) · 199 ms (Lf 175) · 148 ms (style/layout/paint) · 127 ms (Lf 107) · 122 ms (e 78, Nf 16)

## Round II

Clicks by kind: place 4× p50 102 p95 104 · choose 7× p50 196 p95 454 · recruit 4× p50 252 p95 252 · pay 4× p50 207 p95 234 · next-round 1× p50 200 p95 200 · 3 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 6612 | 33 | 2383 | 2 |
| svg.leader:cult-breathe | 3230 | 33 | 2383 | 4 |
| g.blink:cult-blink | 3230 | 33 | 2383 | 4 |
| img.sprite:cult-shift | 3230 | 33 | 2383 | 4 |
| img.sprite:cult-breathe | 3230 | 33 | 2383 | 4 |
| span.tc-line:tcline | 2508 | 33 | 817 | 4 |
| i.cs-min:cs-bob | 1862 | 50 | 2383 | 5 |
| span.lead:cult-scheme | 1808 | 34 | 2383 | 5 |
| i.cs-min:cs-bob-eager | 1472 | 50 | 2383 | 6 |
| img.sprite:cult-eager | 314 | 83 | 150 | 16 |
| path.wash:fill | 279 | 100 | 267 | 17 |
| span.worker-fig:panelland-under | 915 | 33 | 267 | 5 |

Longest frames: 2383 ms (Lf 2357 [DIV#root.onpointerout @ index-zmt0rVN1.js:57290]) · 822 ms (FrameRequestCallback 6) · 428 ms (style/layout/paint) · 251 ms (hn 198) · 238 ms (hn 221)

## Round III

Clicks by kind: place 5× p50 – p95 – · recruit 5× p50 326 p95 326 · pay 8× p50 228 p95 363 · pick 1× p50 150 p95 150 · choose 5× p50 275 p95 434 · next-round 1× p50 65 p95 65 · 8 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 8688 | 33 | 633 | 3 |
| span.tc-line:tcline | 3415 | 50 | 183 | 6 |
| svg.leader:cult-breathe | 4490 | 33 | 633 | 4 |
| g.blink:cult-blink | 4490 | 33 | 633 | 4 |
| img.sprite:cult-shift | 4490 | 33 | 633 | 4 |
| img.sprite:cult-breathe | 4490 | 33 | 633 | 4 |
| i.cs-min:cs-bob | 2474 | 50 | 633 | 7 |
| i.cs-min:cs-bob-eager | 2339 | 50 | 633 | 7 |
| span.lead:cult-scheme | 2422 | 50 | 633 | 6 |
| img.sprite:cult-eager | 448 | 100 | 467 | 23 |
| span.dots:blink | 405 | 100 | 200 | 22 |
| span.worker-fig:panelland-under | 1208 | 50 | 333 | 6 |

Longest frames: 641 ms (style/layout/paint) · 481 ms (style/layout/paint) · 313 ms (hn 299) · 234 ms (Lf 196) · 226 ms (hn 185)

Frames over 2 s, with the screen at the time:
- 2383 ms · place · prompt "Your turn — place a minion on a glowing space" · hover "GatherI:+3II:+4III:+5You’d getYou’d get: +4" · options slot:0-2 slot:1-4 slot:2-0 slot:2-1 slot:2-3 slot:3-4
