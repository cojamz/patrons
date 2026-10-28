# Freeze probe: fix1-named

2026-10-28T13:15:41.331Z · http://localhost:5293 · 4x CPU · relaxed · seed 20261028 · 10 min · game finished · 2149 presses every 250 ms · CPU profile on

Main thread over the game: busy 390659 ms of 572105 (68%), script 49276, style 43426, layout 8116.

Table renders: 951 begun, 554 committed (397 thrown away and started over).

## Input waiting (how long a press or click waited before the page even looked at it)

| round | turn | presses/clicks over 16 ms | over 100 ms | over 250 ms | over 500 ms | worst wait | total wait ms | p95 to paint |
|---|---|---|---|---|---|---|---|---|
| I | yours | 95 | 2 | 0 | 0 | 182 | 886 | 112 |
| I | rivals | 247 | 0 | 0 | 0 | 65 | 1322 | 64 |
| II | yours | 181 | 0 | 0 | 0 | 87 | 2112 | 128 |
| II | rivals | 387 | 1 | 0 | 0 | 104 | 2484 | 72 |
| III | yours | 173 | 1 | 0 | 0 | 161 | 2522 | 136 |
| III | rivals | 732 | 0 | 0 | 0 | 87 | 6484 | 80 |

## Long animation frames over 50 ms

| round | turn | frames | blocking ms | total ms | style+layout ms | over 200 ms | worst |
|---|---|---|---|---|---|---|---|
| I | yours | 31 | 586 | 2300 | 0 | 1 | 258 |
| I | rivals | 31 | 526 | 2341 | 0 | 0 | 156 |
| II | yours | 66 | 1839 | 5597 | 0 | 1 | 283 |
| II | rivals | 72 | 1385 | 5521 | 0 | 0 | 200 |
| III | yours | 70 | 1552 | 5639 | 0 | 0 | 186 |
| III | rivals | 192 | 3413 | 14505 | 0 | 0 | 189 |

Totals: long frames 38525 ms (10586 ms blocking), input waited 16150 ms, 5 presses/clicks waited over 100 ms.

## Scripts in long frames (by entry point)

| entry → function @ source | ms | times | forced style+layout ms | worst |
|---|---|---|---|---|
| MessagePort.onmessage → R2 @ index-Czy5UtRu.js:46227 | 17688 | 320 | 8077 | 234 |
| DIV#root.onclick → ed @ index-Czy5UtRu.js:82510 | 2291 | 39 | 400 | 860 |
| DIV#root.onpointerout → gd @ index-Czy5UtRu.js:82679 | 1588 | 39 | 285 | 249 |
| TimerHandler:setTimeout → ? @ App-DehJnZo-.js:42141 | 1448 | 29 | 0 | 84 |
| TimerHandler:setTimeout → ? @ App-DehJnZo-.js:272420 | 946 | 39 | 499 | 87 |
| DOMWindow.onpointerdown → down @ CultSeat-C8SvN1sn.js:136962 | 295 | 7 | 187 | 92 |
| TimerHandler:setTimeout → ? @ App-DehJnZo-.js:272884 | 208 | 5 | 67 | 75 |
| IdleRequestCallback → run @ Wheel-CrBGd-wH.js:187359 | 161 | 3 | 0 | 58 |
| http://localhost:5293/assets/index-Czy5UtRu.js → ? @ index-Czy5UtRu.js:0 | 108 | 1 | 0 | 108 |
| http://localhost:5293/assets/App-DehJnZo-.js → ? @ App-DehJnZo-.js:0 | 107 | 1 | 0 | 107 |
| TimerHandler:setTimeout → tick @ CultSeat-C8SvN1sn.js:91187 | 68 | 3 | 12 | 30 |
| TimerHandler:setTimeout → ? @ CultSeat-C8SvN1sn.js:164515 | 40 | 3 | 12 | 23 |
| DIV#root.onpointerdown → ed @ index-Czy5UtRu.js:82510 | 16 | 2 | 12 | 10 |
| ResizeObserverCallback → fit @ CultSeat-C8SvN1sn.js:204295 | 14 | 2 | 9 | 7 |
| ResizeObserverCallback → ? @ CultSeat-C8SvN1sn.js:253271 | 12 | 1 | 0 | 12 |
| TimerHandler:setTimeout → release @ CultSeat-C8SvN1sn.js:17248 | 11 | 1 | 0 | 11 |
| DIV#root.onfocusin → ed @ index-Czy5UtRu.js:82510 | 5 | 1 | 0 | 5 |

## The 12 longest frames

- round · rival turn setup: 888 ms (style+layout 0, render 8): DIV#root.onclick→ed 860 (forced 217)
- round  rival turn : 480 ms (style+layout 0, render 9): 
- round II your turn place: 283 ms (style+layout 0, render 12): DIV#root.onpointerout→gd 249 (forced 4)
- round I your turn place: 258 ms (style+layout 0, render 13): MessagePort.onmessage→R2 234 (forced 101)
- round  rival turn over: 208 ms (style+layout 0, render 172): MessagePort.onmessage→R2 37 (forced 3)
- round  rival turn : 201 ms (style+layout 0, render 13): http://localhost:5293/assets/index-Czy5UtRu.js→? 108
- round II rival turn wait (animating): 200 ms (style+layout 0, render 27): MessagePort.onmessage→R2 164 (forced 103)
- round III rival turn choose: 189 ms (style+layout 0, render 19): TimerHandler:setTimeout→? 87, MessagePort.onmessage→R2 77 (forced 37)
- round III your turn buy: 186 ms (style+layout 0, render 22): MessagePort.onmessage→R2 108 (forced 26)
- round  rival turn : 179 ms (style+layout 0, render 48): MessagePort.onmessage→R2 88
- round II your turn place: 177 ms (style+layout 0, render 6): DIV#root.onpointerout→gd 164 (forced 4)
- round III your turn place (animating): 176 ms (style+layout 0, render 0): MessagePort.onmessage→R2 176

## Inside long tasks (CPU profile): 211029 ms in 1587 tasks over 50 ms

### By function, total (inclusive)

- 32227 ms R2 index-Czy5UtRu.js:1109
- 31959 ms J2 index-Czy5UtRu.js:1075
- 31302 ms Gk index-Czy5UtRu.js:6315
- 19173 ms Uk index-Czy5UtRu.js:6697
- 16466 ms Pk index-Czy5UtRu.js:6736
- 16443 ms Wk index-Czy5UtRu.js:6745
- 15735 ms Vk index-Czy5UtRu.js:6989
- 13520 ms Qj index-Czy5UtRu.js:5649
- 12565 ms hk index-Czy5UtRu.js:6068
- 12561 ms ik index-Czy5UtRu.js:6072
- 12541 ms kk index-Czy5UtRu.js:6092
- 10851 ms Nh index-Czy5UtRu.js:4054
- 10120 ms cj index-Czy5UtRu.js:4711
- 9973 ms Lk index-Czy5UtRu.js:6694
- 9364 ms Ik index-Czy5UtRu.js:6670
- 9315 ms Tk index-Czy5UtRu.js:6691
- 6984 ms jg index-Czy5UtRu.js:3361
- 6976 ms Ek index-Czy5UtRu.js:6454
- 4838 ms accounted Glyphs-X1q0g5Xs.js:5890
- 4745 ms applyMove Glyphs-X1q0g5Xs.js:4395
- 4042 ms underCause Glyphs-X1q0g5Xs.js:4163
- 3854 ms eachMemberOf Glyphs-X1q0g5Xs.js:5479
- 3619 ms step$1 App-DehJnZo-.js:202
- 3422 ms advance Glyphs-X1q0g5Xs.js:4694
- 3401 ms go App-DehJnZo-.js:919
- 3253 ms playChain CultSeat-C8SvN1sn.js:2395
- 3209 ms $i index-Czy5UtRu.js:4663
- 3140 ms Sk index-Czy5UtRu.js:6703
- 3132 ms sameSeat App-DehJnZo-.js:5298
- 3086 ms sigOf App-DehJnZo-.js:5267
- 3067 ms bj index-Czy5UtRu.js:4685
- 2889 ms runTask Glyphs-X1q0g5Xs.js:4960
- 2806 ms Ej index-Czy5UtRu.js:5165
- 2707 ms eachMember Glyphs-X1q0g5Xs.js:5516
- 2650 ms fd index-Czy5UtRu.js:2368
- 2565 ms GameScreen App-DehJnZo-.js:6073
- 2437 ms incomeOf App-DehJnZo-.js:5257
- 2422 ms roundStartIncome Wheel-CrBGd-wH.js:187
- 2270 ms Wheel Wheel-CrBGd-wH.js:3156
- 2263 ms hd index-Czy5UtRu.js:2945
- 2161 ms Jb index-Czy5UtRu.js:1874
- 2144 ms Qk index-Czy5UtRu.js:6472
- 1888 ms planChain CultSeat-C8SvN1sn.js:1518
- 1737 ms resume Glyphs-X1q0g5Xs.js:4429
- 1647 ms gain Glyphs-X1q0g5Xs.js:5653

### By function, self

- 139832 ms (program) :0
- 9100 ms query :5287
- 6723 ms getBoundingClientRect :0
- 3855 ms querySelectorAll :0
- 3764 ms (garbage collector) :0
- 3319 ms (anon) App-DehJnZo-.js:5925
- 2945 ms (anon) :0
- 1274 ms applyMove Glyphs-X1q0g5Xs.js:4395
- 1038 ms (anon) :5285
- 1031 ms Ej index-Czy5UtRu.js:5165
- 1021 ms (anon) CultSeat-C8SvN1sn.js:5022
- 949 ms setAttribute :0
- 891 ms querySelector :0
- 795 ms q index-Czy5UtRu.js:382
- 780 ms roundStartIncome Wheel-CrBGd-wH.js:187
- 758 ms Nh index-Czy5UtRu.js:4054
- 727 ms (anon) :1
- 586 ms Bj index-Czy5UtRu.js:5092
- 557 ms animate :0
- 442 ms removeChild :0
- 428 ms (anon) Glyphs-X1q0g5Xs.js:5499
- 421 ms focus :0
- 417 ms Wheel Wheel-CrBGd-wH.js:3156
- 415 ms flush Glyphs-X1q0g5Xs.js:4209
- 397 ms GameScreen App-DehJnZo-.js:6073
- 392 ms requestAnimationFrame :0
- 320 ms (anon) :11
- 315 ms worker.onmessage Wheel-CrBGd-wH.js:2480
- 308 ms (anon) index-Czy5UtRu.js:2973
- 297 ms Sk index-Czy5UtRu.js:6703

### The 10 longest tasks

- 1020 ms: (anon) :0 815 · (program) :0 112 · innerSerialize :170 40 · isTypedArray :62 27
- 788 ms: (program) :0 387 · applyMove Glyphs-X1q0g5Xs.js:4395 134 · getBoundingClientRect :0 26 · setAttribute :0 21
- 781 ms: (program) :0 513 · getBoundingClientRect :0 50 · query :5287 25 · (anon) App-DehJnZo-.js:5925 22
- 741 ms: (program) :0 396 · (anon) CultSeat-C8SvN1sn.js:5022 41 · getBoundingClientRect :0 30 · query :5287 30
- 675 ms: (program) :0 417 · (anon) App-DehJnZo-.js:5925 46 · getBoundingClientRect :0 25 · query :5287 16
- 649 ms: (program) :0 454 · (garbage collector) :0 45 · query :5287 32 · applyMove Glyphs-X1q0g5Xs.js:4395 13
- 647 ms: (program) :0 522 · (garbage collector) :0 52 · query :5287 16 · write App-DehJnZo-.js:2731 9
- 631 ms: (program) :0 385 · getBoundingClientRect :0 23 · query :5287 18 · defById Glyphs-X1q0g5Xs.js:3991 13
- 580 ms: (program) :0 349 · (garbage collector) :0 58 · querySelectorAll :0 12 · query :5287 10
- 578 ms: (program) :0 369 · (garbage collector) :0 48 · (anon) App-DehJnZo-.js:5925 32 · query :5287 31

## The person's clicks

28 clicks timed; 0 changed nothing in 1.5 s (0 of them made while the table was still animating).
- round I: 7 answered, p50 145 ms, p95 214 ms, worst 214 ms (as seen from outside the page, polling every 30 ms)
- round II: 9 answered, p50 144 ms, p95 321 ms, worst 321 ms (as seen from outside the page, polling every 30 ms)
- round III: 12 answered, p50 176 ms, p95 439 ms, worst 439 ms (as seen from outside the page, polling every 30 ms)
