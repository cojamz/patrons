# Frames: leak-before

4x CPU, 1270x700, four Normal bots, relaxed, 30s watched per phase. Gaps in ms (16.7 = smooth 60 fps); hitch = share of frames over 33 ms.

## What the page holds as one game goes on (after a GC)

| moves | round | elements | listeners | heap MB | animations |
|---|---|---|---|---|---|
| 9 | I | 2244 | 521 | 10.8 | 4 |
| 20 | I | 2504 | 570 | 11.6 | 22 |
| 31 | I | 2549 | 533 | 11.9 | 9 |
| 43 | I | 2561 | 531 | 12.2 | 15 |
| 54 | II | 2869 | 584 | 15 | 10 |
| 64 | II | 2933 | 608 | 15.2 | 12 |
| 74 | II | 2865 | 572 | 15.3 | 12 |
| 85 | II | 2970 | 591 | 15.4 | 7 |
| 95 | II | 2973 | 593 | 15.6 | 6 |
| 105 | II | 2907 | 567 | 15.6 | 14 |
| 116 | II | 3018 | 581 | 15.7 | 13 |
| RIII |  | 3874 | 743 | 15.2 | 58 |
| after reload | | 2586 | 580 | 10.3 | |

## late, unbroken game (ended in round III)

Elements 1468 to 1940. Main thread over 30000 ms: task 21925, script 6222, style 2467, layout 1057. Long frames: 54, 3937 ms.

| animating | frames | p50 | p95 | worst | hitch % |
|---|---|---|---|---|---|
| (nothing animating) | 7 | 16.7 | 16.7 | 17 | 0 |
| (all frames) | 1384 | 16.7 | 50 | 167 | 8 |
| b.seat-delta.up:seatdelta | 1037 | 16.7 | 50 | 133 | 9 |
| span.tc-line:tcline | 445 | 16.7 | 66.7 | 133 | 16 |
| span.dots:blink | 221 | 16.7 | 83.3 | 167 | 25 |
| span.lead:cult-scheme | 221 | 16.7 | 83.3 | 167 | 25 |
| svg.leader:cult-breathe | 221 | 16.7 | 83.3 | 167 | 25 |
| g.blink:cult-blink | 221 | 16.7 | 83.3 | 167 | 25 |
| i.cs-min:cs-bob-eager | 221 | 16.7 | 83.3 | 167 | 25 |
| img.sprite:cult-eager | 221 | 16.7 | 83.3 | 167 | 25 |
| i.cs-min:cs-bob | 221 | 16.7 | 83.3 | 167 | 25 |
| img.sprite:cult-shift | 221 | 16.7 | 83.3 | 167 | 25 |
| img.sprite:cult-breathe | 221 | 16.7 | 83.3 | 167 | 25 |
| span.worker-fig:panelland-under | 129 | 16.7 | 66.7 | 133 | 24 |
| path.wash:fill | 81 | 33.3 | 83.4 | 167 | 31 |
| div.piece-flight.piece-res:js | 281 | 16.7 | 49.9 | 83 | 7 |
| div.path-inner:js | 323 | 16.7 | 49.9 | 83 | 6 |
| button.card.lt-card:js | 205 | 16.7 | 50 | 100 | 8 |
| span.tip.fig:cult-hop | 308 | 16.7 | 49.9 | 100 | 5 |
| span.cs-stack:js | 369 | 16.7 | 33.4 | 83 | 4 |
| span.worker:js | 188 | 16.7 | 50 | 100 | 7 |
| span.base:opacity | 64 | 33.3 | 66.6 | 100 | 20 |
| span.tick.dip:bump | 180 | 16.7 | 50 | 100 | 7 |
| span.worker-fig:panelland | 156 | 16.7 | 50 | 100 | 8 |
| span.tick.num:bump | 104 | 16.7 | 66.7 | 117 | 11 |
| div.flight.card-flight:js | 83 | 16.7 | 66.7 | 100 | 12 |
| div.flight.card-ring:js | 83 | 16.7 | 66.7 | 100 | 12 |
| b.bundle-n:js | 140 | 16.7 | 49.9 | 67 | 6 |
| div.as-card:js | 118 | 16.7 | 50 | 100 | 7 |
| span.cs-member:js | 40 | 16.7 | 100 | 100 | 20 |

Scripts in long frames (ms total):
- hn: 2131
- TimerHandler:setTimeout: 762
- Worker.onmessage: 108
- FrameRequestCallback: 11

Worst frames:
- 154 ms (style+layout 0) hn 116
- 122 ms (style+layout 0) hn 100
- 121 ms (style+layout 1) hn 89, Worker.onmessage 13
- 117 ms (style+layout 1) hn 88
- 112 ms (style+layout 0) hn 102
- 110 ms (style+layout 8) TimerHandler:setTimeout 85
- 108 ms (style+layout 1) TimerHandler:setTimeout 105
- 99 ms (style+layout 1) 

## late, after a reload (ended in round )

Elements 1553 to 2713. Main thread over 30000 ms: task 4351, script 747, style 614, layout 232. Long frames: 3, 315 ms.

| animating | frames | p50 | p95 | worst | hitch % |
|---|---|---|---|---|---|
| (all frames) | 324 | 16.7 | 33.2 | 133 | 2 |
| svg.leader:cult-breathe | 324 | 16.7 | 33.2 | 133 | 2 |
| g.blink:cult-blink | 324 | 16.7 | 33.2 | 133 | 2 |
| img.sprite:cult-shift | 324 | 16.7 | 33.2 | 133 | 2 |
| img.sprite:cult-breathe | 324 | 16.7 | 33.2 | 133 | 2 |
| span.tip.fig:js | 313 | 16.7 | 33.2 | 117 | 1 |
| span.lead:js | 299 | 16.7 | 33.2 | 117 | 1 |
| b.reckon-verdict:color | 75 | 16.7 | 33.3 | 117 | 3 |
| span.tick.num:bump | 212 | 16.7 | 33.3 | 117 | 1 |
| path.rim.wait:fill-opacity | 22 | 16.7 | 33.5 | 117 | 9 |
| path.rim.lit:fill-opacity | 22 | 16.7 | 33.5 | 117 | 9 |
| span.rc.in:reckonstampcol | 64 | 16.7 | 33.3 | 117 | 3 |
| span.lead:cult-scheme | 8 | 16.7 | 133.3 | 133 | 13 |
| img.sprite:cult-eager | 8 | 16.7 | 133.3 | 133 | 13 |
| span.rc.in:background-color | 146 | 16.7 | 16.8 | 33 | 0 |
| b.reckon-verdict.on:color | 116 | 16.7 | 16.8 | 33 | 0 |
| span.rc.in:reckoncheer | 210 | 16.7 | 16.8 | 83 | 0 |
| b.reckon-verdict.on:rise | 137 | 16.7 | 16.7 | 33 | 0 |
| g.rim-emoji.lit:js | 21 | 16.7 | 16.7 | 17 | 0 |
| div.token-flight.reckon:js | 69 | 16.7 | 16.7 | 33 | 0 |
| b.reckon-rule:fade | 52 | 16.7 | 33.3 | 33 | 0 |
| span.reckon-counts:fade | 52 | 16.7 | 33.3 | 33 | 0 |
| path.rim:fill-opacity | 19 | 16.7 | 33.3 | 33 | 0 |
| g.rim-emoji:js | 33 | 16.7 | 33.3 | 33 | 0 |
| div.dialog.roundend:settle | 7 | 16.7 | 33.3 | 33 | 0 |

Scripts in long frames (ms total):
- hn: 67

Worst frames:
- 123 ms (style+layout 2) hn 31
- 114 ms (style+layout 1) 
- 78 ms (style+layout 30) hn 36
