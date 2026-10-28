# Perf rig: release-head-2

2026-10-28T05:44:24.007Z · http://localhost:5292 · 4x CPU · relaxed · seed 20261028 · 1 person + 3 Normal bots · 10 min · game finished

Verdict: FAIL (7)
- round I: clicks p95 512 ms (bar 100)
- round I: hovers p95 109 ms (bar 100)
- round II: clicks p95 441 ms (bar 100)
- round II: idle table busy 26% (bar 10%)
- round III: clicks p95 2549 ms (bar 100)
- round III: hovers p95 105 ms (bar 100)
- clicks p95 grows 512 → 2549 ms over the game

## Per round

| round | clicks p50/p95 ms | hovers p50/p95 ms | show frames p95 ms | hitch % | worst frame | long frames >100ms | idle busy % | idle style ms/3s | elements | listeners | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| I | 157 / 512 | 57 / 109 | 17 | 1 | 250 | 4 | 1 | 1 | 2023 | 506 | 9.8 |
| II | 181 / 441 | 51 / 83 | 17 | 2 | 1017 | 12 | 26 | 246 | 2889 | 548 | 14.5 |
| III | 229 / 2549 | 62 / 105 | 33 | 2 | 517 | 12 | 5 | 39 | 3418 | 604 | 21.1 |

Leak control on the last turn: unbroken game 5335 elements, 791 listeners, 16.1 MB; after a reload 4827, 736, 7.6 MB.

## Round I

Clicks by kind: place 4× p50 107 p95 274 · choose 5× p50 222 p95 512 · recruit 3× p50 197 p95 254 · pay 3× p50 144 p95 157 · next-round 1× p50 110 p95 110

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 4867 | 33 | 250 | 1 |
| svg.leader:cult-breathe | 2298 | 33 | 250 | 2 |
| g.blink:cult-blink | 2298 | 33 | 250 | 2 |
| span.tc-line:tcline | 1928 | 33 | 117 | 2 |
| div.path-inner:js | 1708 | 33 | 117 | 2 |
| i.cs-min:cs-bob | 964 | 33 | 250 | 3 |
| span.lead:cult-scheme | 869 | 33 | 250 | 3 |
| i.cs-min:cs-bob-eager | 799 | 33 | 250 | 3 |
| img.sprite:cult-shift | 2289 | 33 | 250 | 1 |
| span.base:opacity | 530 | 33 | 133 | 4 |
| img.sprite:cult-breathe | 1923 | 17 | 100 | 1 |
| path.wash:fill | 209 | 67 | 133 | 9 |

Longest frames: 270 ms (style/layout/paint) · 201 ms (gd 178) · 113 ms (R2 83) · 110 ms (R2 90) · 90 ms (style/layout/paint)

## Round II

Clicks by kind: place 4× p50 92 p95 92 · recruit 4× p50 320 p95 320 · pay 6× p50 181 p95 211 · pick 1× p50 99 p95 99 · choose 3× p50 206 p95 441 · next-round 1× p50 86 p95 86 · 6 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 6807 | 33 | 1017 | 2 |
| span.tc-line:tcline | 2637 | 33 | 267 | 4 |
| svg.leader:cult-breathe | 3380 | 33 | 1017 | 3 |
| g.blink:cult-blink | 3380 | 33 | 1017 | 3 |
| img.sprite:cult-shift | 3380 | 33 | 1017 | 3 |
| img.sprite:cult-breathe | 3380 | 33 | 1017 | 3 |
| i.cs-min:cs-bob | 2035 | 33 | 1017 | 4 |
| span.lead:cult-scheme | 1925 | 33 | 1017 | 4 |
| i.cs-min:cs-bob-eager | 1669 | 33 | 1017 | 4 |
| div.path-inner:js | 2541 | 17 | 117 | 2 |
| span.base:opacity | 766 | 33 | 150 | 5 |
| img.sprite:cult-eager | 310 | 67 | 100 | 11 |

Longest frames: 997 ms (style/layout/paint) · 518 ms (style/layout/paint) · 391 ms (gd 361) · 243 ms (TimerHandler:setTimeout 232) · 141 ms (gd 72, down 30)

## Round III

Clicks by kind: place 5× p50 – p95 – · choose 7× p50 252 p95 2549 · pay 6× p50 221 p95 256 · recruit 6× p50 282 p95 346 · pick 1× p50 120 p95 120 · next-round 1× p50 72 p95 72 · 7 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 8485 | 33 | 517 | 2 |
| span.tc-line:tcline | 3384 | 33 | 183 | 4 |
| i.cs-min:cs-bob | 2117 | 33 | 517 | 5 |
| span.lead:cult-scheme | 2000 | 33 | 517 | 5 |
| i.cs-min:cs-bob-eager | 1898 | 33 | 517 | 5 |
| svg.leader:cult-breathe | 4655 | 33 | 517 | 2 |
| g.blink:cult-blink | 4655 | 33 | 517 | 2 |
| img.sprite:cult-shift | 4655 | 33 | 517 | 2 |
| img.sprite:cult-breathe | 4655 | 33 | 517 | 2 |
| div.path-inner:js | 3443 | 33 | 133 | 2 |
| span.base:opacity | 1057 | 50 | 250 | 6 |
| span.cs-stack:js | 2845 | 17 | 167 | 2 |

Longest frames: 529 ms (style/layout/paint) · 382 ms (style/layout/paint) · 232 ms (TimerHandler:setTimeout 216) · 206 ms (R2 177) · 142 ms (gd 62, down 39)
