# Frames: frames-before

4x CPU, 1270x700, four Normal bots, relaxed, 40s watched per phase. Gaps in ms (16.7 = smooth 60 fps); hitch = share of frames over 33 ms.

## early (ended in round I)

Elements 1066 to 1452. Main thread over 40000 ms: task 17490, script 3059, style 2053, layout 449. Long frames: 15, 1021 ms.

| animating | frames | p50 | p95 | worst | hitch % |
|---|---|---|---|---|---|
| (all frames) | 2288 | 16.7 | 16.8 | 117 | 1 |
| span.dots:blink | 199 | 16.7 | 50 | 83 | 9 |
| svg.leader:cult-breathe | 199 | 16.7 | 50 | 83 | 9 |
| g.blink:cult-blink | 199 | 16.7 | 50 | 83 | 9 |
| span.tc-line:tcline | 880 | 16.7 | 33.3 | 117 | 2 |
| i.cs-min:cs-bob | 117 | 16.7 | 50.1 | 83 | 14 |
| i.cs-min:cs-bob-eager | 117 | 16.7 | 50.1 | 83 | 14 |
| img.sprite:cult-shift | 106 | 16.7 | 50.1 | 83 | 14 |
| b.seat-delta.up:seatdelta | 1477 | 16.7 | 16.8 | 100 | 1 |
| span.base:opacity | 466 | 16.7 | 33.4 | 83 | 3 |
| span.lead:cult-gesture | 54 | 16.7 | 50 | 83 | 19 |
| span.worker-fig:panelland-under | 240 | 16.7 | 33.4 | 83 | 4 |
| span.lead:cult-scheme | 145 | 16.7 | 49.9 | 67 | 6 |
| path.wash:fill | 64 | 16.7 | 50 | 83 | 9 |
| section.lt-seat.lt-seat-3:background-color | 270 | 16.7 | 33.3 | 50 | 2 |
| section.lt-seat.lt-seat-3:box-shadow | 270 | 16.7 | 33.3 | 50 | 2 |
| img.sprite:cult-eager | 50 | 16.7 | 50.1 | 83 | 10 |
| span.tick.num:bump | 235 | 16.7 | 33.3 | 67 | 2 |
| span.tick.dip:bump | 351 | 16.7 | 16.8 | 117 | 1 |
| button.card.lt-card:js | 317 | 16.7 | 16.8 | 117 | 1 |
| section.lt-seat.lt-seat-1:background-color | 135 | 16.7 | 33.3 | 50 | 2 |
| section.lt-seat.lt-seat-1:box-shadow | 135 | 16.7 | 33.3 | 50 | 2 |
| section.lt-seat.lt-seat-0:background-color | 270 | 16.7 | 16.8 | 100 | 1 |
| section.lt-seat.lt-seat-0:box-shadow | 270 | 16.7 | 16.8 | 100 | 1 |
| div.flight.shop-out:js | 130 | 16.7 | 16.8 | 100 | 2 |
| div.flight.pulse-glow:js | 248 | 16.7 | 33.3 | 50 | 1 |
| span.base.chain-point:js | 120 | 16.7 | 16.8 | 50 | 2 |
| img.sprite:cult-breathe | 18 | 16.7 | 50 | 50 | 11 |
| div.as-card:js | 194 | 16.7 | 33.4 | 67 | 1 |
| div.flight.card-flight:js | 145 | 16.7 | 16.7 | 117 | 1 |

Scripts in long frames (ms total):
- hn: 716
- TimerHandler:setTimeout: 60

Worst frames:
- 125 ms (style+layout 1) hn 87
- 83 ms (style+layout 1) hn 55
- 82 ms (style+layout 0) TimerHandler:setTimeout 6, hn 66
- 79 ms (style+layout 1) hn 59
- 71 ms (style+layout 0) hn 36
- 68 ms (style+layout 1) hn 59
- 65 ms (style+layout 3) TimerHandler:setTimeout 7, hn 44
- 63 ms (style+layout 0) TimerHandler:setTimeout 7, hn 46

## late (ended in round III)

Elements 1408 to 1993. Main thread over 40000 ms: task 21448, script 3723, style 3460, layout 641. Long frames: 22, 2113 ms.

| animating | frames | p50 | p95 | worst | hitch % |
|---|---|---|---|---|---|
| (all frames) | 2197 | 16.7 | 16.8 | 250 | 2 |
| b.seat-delta.up:seatdelta | 540 | 16.7 | 33.4 | 233 | 4 |
| svg.leader:cult-breathe | 1180 | 16.7 | 16.8 | 233 | 1 |
| g.blink:cult-blink | 1180 | 16.7 | 16.8 | 233 | 1 |
| img.sprite:cult-shift | 1180 | 16.7 | 16.8 | 233 | 1 |
| img.sprite:cult-breathe | 1180 | 16.7 | 16.8 | 233 | 1 |
| span.dots:blink | 79 | 16.7 | 100 | 233 | 13 |
| i.cs-min:cs-bob-eager | 79 | 16.7 | 100 | 233 | 13 |
| img.sprite:cult-eager | 79 | 16.7 | 100 | 233 | 13 |
| i.cs-min:cs-bob | 79 | 16.7 | 100 | 233 | 13 |
| span.tc-line:tcline | 204 | 16.7 | 49.9 | 233 | 5 |
| span.lead:cult-scheme | 70 | 16.7 | 100 | 233 | 13 |
| span.tick.num:bump | 811 | 16.7 | 16.8 | 233 | 1 |
| button.card.lt-card:js | 756 | 16.7 | 16.8 | 250 | 1 |
| div.worker-flight.minion-flight:js | 208 | 16.7 | 33.3 | 250 | 3 |
| span.tip.fig:js | 592 | 16.7 | 16.8 | 133 | 1 |
| div.path-inner:js | 296 | 16.7 | 16.8 | 117 | 2 |
| div.piece-flight.piece-res:js | 273 | 16.7 | 16.8 | 117 | 2 |
| section.lt-seat.lt-seat-0:background-color | 52 | 16.7 | 100.1 | 167 | 10 |
| section.lt-seat.lt-seat-0:box-shadow | 52 | 16.7 | 100.1 | 167 | 10 |
| span.tick.dip:bump | 253 | 16.7 | 16.8 | 250 | 2 |
| span.cs-member:js | 241 | 16.7 | 16.8 | 83 | 2 |
| div.flight.shop-out:js | 424 | 16.7 | 16.8 | 250 | 1 |
| span.worker:js | 82 | 16.7 | 33.4 | 83 | 5 |
| span.tip.fig:cult-hop | 64 | 16.7 | 49.9 | 250 | 6 |
| span.rc.in:reckonstampcol | 379 | 16.7 | 16.8 | 67 | 1 |
| span.rc.in:background-color | 325 | 16.7 | 16.7 | 67 | 1 |
| section.lt-shop:opacity | 44 | 16.7 | 49.9 | 250 | 7 |
| i.cs-min:js | 153 | 16.7 | 16.8 | 250 | 2 |
| span.base:opacity | 60 | 16.7 | 50 | 83 | 5 |

Scripts in long frames (ms total):
- hn: 931
- TimerHandler:setTimeout: 498
- Pf: 50
- Nf: 33
- VoidFunction: 30

Worst frames:
- 217 ms (style+layout 1) TimerHandler:setTimeout 15, hn 179
- 174 ms (style+layout 0) hn 161
- 147 ms (style+layout 0) hn 124
- 144 ms (style+layout 8) Pf 50, VoidFunction 30, Nf 33
- 142 ms (style+layout 1) TimerHandler:setTimeout 135
- 140 ms (style+layout 2) 
- 116 ms (style+layout 2) TimerHandler:setTimeout 110
- 98 ms (style+layout 2) TimerHandler:setTimeout 85
