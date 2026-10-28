# Perf rig: release-head

2026-10-28T05:29:01.802Z · http://localhost:5292 · 4x CPU · relaxed · seed 20261028 · 1 person + 3 Normal bots · 40 min · game finished

Verdict: FAIL (10)
- round I: clicks p95 450 ms (bar 100)
- round II: clicks p95 324 ms (bar 100)
- round II: hovers p95 106 ms (bar 100)
- round III: clicks p95 1232 ms (bar 100)
- round III: hovers p95 238 ms (bar 100)
- clicks p95 grows 450 → 1232 ms over the game
- idle busy grows 1% → 8% over the game
- leak: 6030 elements vs 4396 after a reload
- leak: 819 listeners vs 712 after a reload
- leak: heap 16.2 MB vs 7.2 MB after a reload

## Per round

| round | clicks p50/p95 ms | hovers p50/p95 ms | show frames p95 ms | hitch % | worst frame | long frames >100ms | idle busy % | idle style ms/3s | elements | listeners | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| I | 140 / 450 | 44 / 77 | 17 | 1 | 333 | 2 | 1 | 1 | 2023 | 506 | 9.6 |
| II | 169 / 324 | 40 / 106 | 17 | 2 | 283 | 8 | 9 | 6 | 2889 | 548 | 14 |
| III | 248 / 1232 | 67 / 238 | 33 | 3 | 107746 | 63 | 8 | 61 | 3222 | 590 | 20.4 |

Leak control on the last turn: unbroken game 6030 elements, 819 listeners, 16.2 MB; after a reload 4396, 712, 7.2 MB.

## Round I

Clicks by kind: place 5× p50 77 p95 120 · choose 5× p50 135 p95 450 · recruit 3× p50 194 p95 218 · pay 3× p50 147 p95 150 · next-round 1× p50 81 p95 81 · 1 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 4927 | 17 | 333 | 1 |
| span.tc-line:tcline | 1963 | 33 | 117 | 2 |
| svg.leader:cult-breathe | 2574 | 17 | 333 | 1 |
| g.blink:cult-blink | 2574 | 17 | 333 | 1 |
| img.sprite:cult-shift | 2561 | 17 | 333 | 1 |
| i.cs-min:cs-bob | 1233 | 33 | 333 | 2 |
| img.sprite:cult-breathe | 2192 | 17 | 117 | 1 |
| span.lead:cult-scheme | 1087 | 33 | 333 | 2 |
| i.cs-min:cs-bob-eager | 1084 | 33 | 333 | 2 |
| div.path-inner:js | 1758 | 17 | 83 | 1 |
| span.worker-fig:panelland | 802 | 33 | 83 | 2 |
| div.worker-flight.minion-flight:js | 508 | 33 | 83 | 3 |

Longest frames: 358 ms (style/layout/paint) · 171 ms (Lf 144, ResizeObserverCallback 6) · 98 ms (e 50, Nf 17) · 86 ms (hn 48) · 82 ms (hn 69)

## Round II

Clicks by kind: place 4× p50 87 p95 87 · recruit 4× p50 272 p95 276 · pay 5× p50 149 p95 207 · pick 2× p50 95 p95 95 · choose 3× p50 286 p95 324 · next-round 1× p50 169 p95 169 · 3 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 6750 | 17 | 283 | 2 |
| svg.leader:cult-breathe | 2979 | 33 | 283 | 3 |
| g.blink:cult-blink | 2979 | 33 | 283 | 3 |
| img.sprite:cult-shift | 2979 | 33 | 283 | 3 |
| img.sprite:cult-breathe | 2979 | 33 | 283 | 3 |
| span.tc-line:tcline | 2760 | 33 | 133 | 3 |
| i.cs-min:cs-bob | 1646 | 33 | 283 | 4 |
| span.lead:cult-scheme | 1541 | 33 | 283 | 4 |
| i.cs-min:cs-bob-eager | 1431 | 33 | 283 | 4 |
| path.wash:fill | 301 | 67 | 133 | 11 |
| span.base:opacity | 775 | 33 | 133 | 4 |
| img.sprite:cult-eager | 283 | 50 | 83 | 10 |

Longest frames: 301 ms (style/layout/paint) · 142 ms (TimerHandler:setTimeout 138) · 139 ms (hn 113, Lf 7) · 125 ms (Nf 90) · 109 ms (hn 90)

## Round III

Clicks by kind: place 6× p50 74 p95 74 · choose 26× p50 316 p95 1232 · recruit 5× p50 246 p95 248 · pay 5× p50 187 p95 194 · pick 2× p50 106 p95 106 · next-round 1× p50 60 p95 60 · 7 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 7697 | 33 | 417 | 3 |
| span.tc-line:tcline | 3753 | 33 | 102779 | 5 |
| svg.leader:cult-breathe | 4648 | 33 | 107746 | 4 |
| g.blink:cult-blink | 4648 | 33 | 107746 | 4 |
| img.sprite:cult-shift | 4648 | 33 | 107746 | 4 |
| img.sprite:cult-breathe | 4648 | 33 | 107746 | 4 |
| i.cs-min:cs-bob | 2376 | 50 | 107746 | 7 |
| span.lead:cult-scheme | 2166 | 50 | 107746 | 7 |
| i.cs-min:cs-bob-eager | 2007 | 50 | 107746 | 6 |
| img.sprite:cult-eager | 366 | 117 | 102779 | 21 |
| span.dots:blink | 353 | 117 | 102779 | 21 |
| div.path-inner:js | 3581 | 33 | 102629 | 2 |

Longest frames: 115503 ms (e 115497) · 110719 ms (e 110711) · 107728 ms (Lf 107709) · 107545 ms (e 107538) · 104808 ms (e 104797)
