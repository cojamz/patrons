# Perf rig: v091-base

2026-10-28T04:14:03.510Z · http://localhost:5291 · 4x CPU · relaxed · seed 20261028 · 1 person + 3 Normal bots · 10 min · game finished

Verdict: FAIL (13)
- round I: clicks p95 502 ms (bar 100)
- round I: idle table busy 22% (bar 10%)
- round II: clicks p95 2639 ms (bar 100)
- round II: hovers p95 114 ms (bar 100)
- round II: idle table busy 34% (bar 10%)
- round III: clicks p95 3833 ms (bar 100)
- round III: hovers p95 157 ms (bar 100)
- round III: idle table busy 45% (bar 10%)
- clicks p95 grows 502 → 3833 ms over the game
- idle busy grows 22% → 45% over the game
- leak: 6657 elements vs 4834 after a reload
- leak: 836 listeners vs 729 after a reload
- leak: heap 17.6 MB vs 7.2 MB after a reload

## Per round

| round | clicks p50/p95 ms | hovers p50/p95 ms | show frames p95 ms | hitch % | worst frame | long frames >100ms | idle busy % | idle style ms/3s | elements | listeners | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| I | 189 / 502 | 68 / 98 | 17 | 2 | 367 | 7 | 22 | 203 | 2024 | 507 | 9.7 |
| II | 190 / 2639 | 54 / 114 | 33 | 2 | 367 | 16 | 34 | 324 | 3114 | 550 | 14.8 |
| III | 286 / 3833 | 48 / 157 | 33 | 3 | 9483 | 45 | 45 | 403 | 3546 | 594 | 19.2 |

Leak control on the last turn: unbroken game 6657 elements, 836 listeners, 17.6 MB; after a reload 4834, 729, 7.2 MB.

## Round I

Clicks by kind: place 3× p50 93 p95 93 · choose 5× p50 193 p95 502 · recruit 3× p50 230 p95 267 · pay 3× p50 150 p95 189 · next-round 1× p50 150 p95 150 · 1 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 4897 | 17 | 367 | 2 |
| svg.leader:cult-breathe | 2295 | 33 | 367 | 3 |
| g.blink:cult-blink | 2295 | 33 | 367 | 3 |
| img.sprite:cult-shift | 2276 | 33 | 367 | 3 |
| span.tc-line:tcline | 1948 | 33 | 150 | 3 |
| i.cs-min:cs-bob-eager | 860 | 50 | 367 | 6 |
| i.cs-min:cs-bob | 946 | 50 | 367 | 5 |
| span.lead:cult-scheme | 893 | 50 | 367 | 5 |
| img.sprite:cult-breathe | 1895 | 17 | 133 | 2 |
| span.worker-fig:panelland-under | 786 | 33 | 150 | 4 |
| span.dots:blink | 187 | 67 | 100 | 13 |
| span.base:opacity | 549 | 33 | 150 | 4 |

Longest frames: 377 ms (style/layout/paint) · 131 ms (hn 110, I 10) · 120 ms (hn 102) · 117 ms (Pf 83) · 108 ms (style/layout/paint)

## Round II

Clicks by kind: place 4× p50 98 p95 98 · choose 4× p50 261 p95 2639 · recruit 4× p50 251 p95 265 · pay 4× p50 186 p95 190 · next-round 1× p50 84 p95 84 · 4 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 6477 | 33 | 367 | 2 |
| span.tc-line:tcline | 2461 | 33 | 183 | 4 |
| svg.leader:cult-breathe | 3036 | 33 | 367 | 3 |
| g.blink:cult-blink | 3036 | 33 | 367 | 3 |
| img.sprite:cult-shift | 3036 | 33 | 367 | 3 |
| img.sprite:cult-breathe | 3036 | 33 | 367 | 3 |
| i.cs-min:cs-bob | 1705 | 50 | 367 | 5 |
| i.cs-min:cs-bob-eager | 1408 | 50 | 367 | 6 |
| span.lead:cult-scheme | 1480 | 50 | 367 | 5 |
| path.wash:fill | 270 | 83 | 333 | 17 |
| img.sprite:cult-eager | 281 | 67 | 133 | 16 |
| div.path-inner:js | 2241 | 33 | 183 | 2 |

Longest frames: 383 ms (style/layout/paint) · 316 ms (hn 292) · 206 ms (hn 193) · 155 ms (hn 139) · 128 ms (hn 114)

## Round III

Clicks by kind: place 6× p50 176 p95 176 · pick 2× p50 126 p95 126 · choose 14× p50 355 p95 4145 · recruit 5× p50 286 p95 321 · pay 5× p50 234 p95 294 · next-round 1× p50 67 p95 67 · 7 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 8421 | 33 | 850 | 3 |
| svg.leader:cult-breathe | 4511 | 33 | 483 | 5 |
| g.blink:cult-blink | 4511 | 33 | 483 | 5 |
| img.sprite:cult-shift | 4511 | 33 | 483 | 5 |
| img.sprite:cult-breathe | 4511 | 33 | 483 | 5 |
| i.cs-min:cs-bob | 2405 | 50 | 483 | 8 |
| span.tc-line:tcline | 3838 | 50 | 183 | 5 |
| span.lead:cult-scheme | 2342 | 50 | 483 | 8 |
| i.cs-min:cs-bob-eager | 2074 | 50 | 483 | 8 |
| img.sprite:cult-eager | 457 | 100 | 250 | 23 |
| path.wash:fill | 360 | 117 | 9483 | 27 |
| span.dots:blink | 418 | 100 | 183 | 23 |

Longest frames: 9440 ms (hn 9412) · 8445 ms (hn 8418) · 791 ms (hn 507, I 211) · 492 ms (style/layout/paint) · 233 ms (Nf 205)
