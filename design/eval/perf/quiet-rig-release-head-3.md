# Perf rig: release-head-3

2026-10-28T05:57:21.479Z · http://localhost:5292 · 4x CPU · relaxed · seed 20261028 · 1 person + 3 Normal bots · 11 min · game finished

Verdict: FAIL (10)
- round I: clicks p95 512 ms (bar 100)
- round II: clicks p95 311 ms (bar 100)
- round II: hovers p95 182 ms (bar 100)
- round II: idle table busy 20% (bar 10%)
- round III: clicks p95 1335 ms (bar 100)
- round III: hovers p95 109 ms (bar 100)
- clicks p95 grows 512 → 1335 ms over the game
- leak: 6039 elements vs 4433 after a reload
- leak: 810 listeners vs 702 after a reload
- leak: heap 16 MB vs 7.2 MB after a reload

## Per round

| round | clicks p50/p95 ms | hovers p50/p95 ms | show frames p95 ms | hitch % | worst frame | long frames >100ms | idle busy % | idle style ms/3s | elements | listeners | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| I | 128 / 512 | 48 / 97 | 17 | 1 | 267 | 5 | 1 | 1 | 2023 | 505 | 9.6 |
| II | 162 / 311 | 39 / 182 | 17 | 2 | 717 | 7 | 20 | 61 | 2889 | 548 | 14.2 |
| III | 191 / 1335 | 56 / 109 | 33 | 2 | 567 | 14 | 6 | 42 | 3318 | 589 | 20.6 |

Leak control on the last turn: unbroken game 6039 elements, 810 listeners, 16 MB; after a reload 4433, 702, 7.2 MB.

## Round I

Clicks by kind: place 4× p50 61 p95 73 · choose 5× p50 138 p95 512 · recruit 3× p50 299 p95 299 · pay 3× p50 128 p95 169 · next-round 1× p50 85 p95 85 · 2 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| svg.leader:cult-breathe | 2778 | 17 | 267 | 2 |
| g.blink:cult-blink | 2778 | 17 | 267 | 2 |
| b.seat-delta.up:seatdelta | 4873 | 17 | 267 | 1 |
| span.tc-line:tcline | 1929 | 33 | 133 | 2 |
| i.cs-min:cs-bob-eager | 1058 | 33 | 267 | 3 |
| i.cs-min:cs-bob | 1445 | 33 | 267 | 2 |
| img.sprite:cult-shift | 2763 | 17 | 267 | 1 |
| span.lead:cult-scheme | 1333 | 33 | 267 | 2 |
| img.sprite:cult-breathe | 2158 | 17 | 117 | 1 |
| div.path-inner:js | 1766 | 17 | 133 | 1 |
| button.card.lt-card:js | 831 | 17 | 133 | 2 |
| span.base:opacity | 550 | 33 | 100 | 3 |

Longest frames: 294 ms (style/layout/paint) · 193 ms (Lf 173) · 106 ms (Lf 79) · 105 ms (hn 76) · 105 ms (hn 56)

## Round II

Clicks by kind: place 4× p50 82 p95 82 · recruit 5× p50 207 p95 207 · pay 5× p50 180 p95 232 · choose 2× p50 311 p95 311 · pick 1× p50 151 p95 151 · next-round 1× p50 102 p95 102 · 5 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 6989 | 33 | 717 | 2 |
| i.cs-min:cs-bob | 2074 | 33 | 717 | 4 |
| span.tc-line:tcline | 2717 | 33 | 617 | 3 |
| span.lead:cult-scheme | 1853 | 33 | 717 | 4 |
| svg.leader:cult-breathe | 3440 | 33 | 717 | 2 |
| g.blink:cult-blink | 3440 | 33 | 717 | 2 |
| img.sprite:cult-shift | 3440 | 33 | 717 | 2 |
| img.sprite:cult-breathe | 3440 | 33 | 717 | 2 |
| i.cs-min:cs-bob-eager | 1636 | 33 | 717 | 4 |
| span.base:opacity | 756 | 33 | 150 | 5 |
| button.card.lt-card:js | 1868 | 17 | 150 | 2 |
| img.sprite:cult-eager | 292 | 50 | 100 | 12 |

Longest frames: 730 ms (style/layout/paint) · 613 ms (style/layout/paint) · 227 ms (Lf 204) · 125 ms (hn 104) · 120 ms (hn 102)

## Round III

Clicks by kind: place 5× p50 80 p95 80 · choose 7× p50 246 p95 1335 · recruit 6× p50 306 p95 306 · pay 6× p50 191 p95 258 · next-round 1× p50 65 p95 65 · 9 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 11085 | 33 | 567 | 2 |
| span.tc-line:tcline | 4485 | 33 | 183 | 4 |
| svg.leader:cult-breathe | 5383 | 33 | 567 | 3 |
| g.blink:cult-blink | 5383 | 33 | 567 | 3 |
| img.sprite:cult-shift | 5383 | 33 | 567 | 3 |
| img.sprite:cult-breathe | 5383 | 33 | 567 | 3 |
| i.cs-min:cs-bob | 2882 | 33 | 567 | 5 |
| i.cs-min:cs-bob-eager | 2486 | 33 | 567 | 5 |
| span.lead:cult-scheme | 2665 | 33 | 567 | 4 |
| div.path-inner:js | 3938 | 33 | 150 | 2 |
| span.base:opacity | 981 | 50 | 133 | 7 |
| img.sprite:cult-eager | 486 | 67 | 383 | 14 |

Longest frames: 569 ms (style/layout/paint) · 404 ms (style/layout/paint) · 152 ms (style/layout/paint) · 142 ms (Lf 108) · 141 ms (hn 27)
