# Freeze probe: base-named

2026-10-28T13:00:21.845Z · http://localhost:5292 · 4x CPU · relaxed · seed 20261028 · 9 min · game finished · 2116 presses every 250 ms · CPU profile on

Main thread over the game: busy 385309 ms of 569482 (68%), script 48875, style 41164, layout 7660.

## Input waiting (how long a press or click waited before the page even looked at it)

| round | turn | presses/clicks over 16 ms | over 100 ms | over 250 ms | over 500 ms | worst wait | total wait ms | p95 to paint |
|---|---|---|---|---|---|---|---|---|
| I | yours | 94 | 2 | 0 | 0 | 149 | 962 | 136 |
| I | rivals | 241 | 0 | 0 | 0 | 38 | 1175 | 56 |
| II | yours | 181 | 6 | 1 | 0 | 285 | 3349 | 208 |
| II | rivals | 380 | 0 | 0 | 0 | 71 | 2417 | 64 |
| III | yours | 180 | 4 | 2 | 1 | 3061 | 5719 | 152 |
| III | rivals | 705 | 0 | 0 | 0 | 88 | 6270 | 88 |

## Long animation frames over 50 ms

| round | turn | frames | blocking ms | total ms | style+layout ms | over 200 ms | worst |
|---|---|---|---|---|---|---|---|
| I | yours | 23 | 523 | 1849 | 0 | 1 | 252 |
| I | rivals | 37 | 471 | 2590 | 0 | 0 | 112 |
| II | yours | 75 | 2983 | 7413 | 0 | 5 | 512 |
| II | rivals | 72 | 1260 | 5304 | 0 | 0 | 168 |
| III | yours | 69 | 4997 | 9174 | 0 | 3 | 3131 |
| III | rivals | 206 | 3321 | 15247 | 0 | 1 | 209 |

Totals: long frames 44019 ms (14910 ms blocking), input waited 20119 ms, 12 presses/clicks waited over 100 ms.

## Scripts in long frames (by entry point)

| entry → function @ source | ms | times | forced style+layout ms | worst |
|---|---|---|---|---|
| MessagePort.onmessage → R2 @ index-DxNRkwJi.js:46227 | 18268 | 333 | 7449 | 486 |
| DIV#root.onpointerout → gd @ index-DxNRkwJi.js:82679 | 4958 | 31 | 208 | 3088 |
| DIV#root.onclick → ed @ index-DxNRkwJi.js:82510 | 2488 | 39 | 403 | 1074 |
| TimerHandler:setTimeout → ? @ App-43ogsMzR.js:42141 | 2273 | 44 | 0 | 95 |
| TimerHandler:setTimeout → ? @ App-43ogsMzR.js:272404 | 945 | 41 | 506 | 69 |
| DOMWindow.onpointerdown → down @ CultSeat-Ba6eQc30.js:136962 | 453 | 10 | 307 | 71 |
| FrameRequestCallback → frame @ CultSeat-Ba6eQc30.js:1827 | 98 | 4 | 0 | 61 |
| TimerHandler:setTimeout → tick @ CultSeat-Ba6eQc30.js:91187 | 83 | 5 | 1 | 24 |
| http://localhost:5292/assets/App-43ogsMzR.js → ? @ App-43ogsMzR.js:0 | 82 | 1 | 0 | 82 |
| IdleRequestCallback → ? @ App-43ogsMzR.js:114990 | 80 | 4 | 0 | 33 |
| Worker.onmessage → ? @ Wheel-Df7PFCyN.js:120107 | 64 | 3 | 0 | 47 |
| TimerHandler:setTimeout → ? @ CultSeat-Ba6eQc30.js:164515 | 39 | 3 | 16 | 21 |
| TimerHandler:setTimeout → ? @ App-43ogsMzR.js:31893 | 39 | 1 | 0 | 39 |
| DOMWindow.onkeydown → ? @ Wheel-Df7PFCyN.js:150839 | 31 | 1 | 0 | 31 |
| DIV#root.onpointerdown → ed @ index-DxNRkwJi.js:82510 | 24 | 4 | 18 | 7 |
| TimerHandler:setTimeout → ? @ App-43ogsMzR.js:272868 | 17 | 1 | 5 | 17 |
| ResizeObserverCallback → fit @ CultSeat-Ba6eQc30.js:204295 | 17 | 2 | 15 | 12 |
| TimerHandler:setTimeout → ? @ App-43ogsMzR.js:28993 | 10 | 1 | 0 | 10 |
| TimerHandler:setTimeout → ? @ CultSeat-Ba6eQc30.js:60629 | 8 | 1 | 5 | 8 |
| DIV#root.ontransitionend → fd @ index-DxNRkwJi.js:82848 | 7 | 1 | 0 | 7 |
| DIV#root.onanimationstart → fd @ index-DxNRkwJi.js:82848 | 6 | 1 | 0 | 6 |
| ResizeObserverCallback → ? @ App-43ogsMzR.js:125742 | 6 | 1 | 0 | 6 |
| PerformanceObserverCallback → ? @ :-1 | 6 | 1 | 0 | 6 |

## The 12 longest frames

- round III your turn place: 3131 ms (style+layout 0, render 23): DIV#root.onpointerout→gd 3088 (forced 13)
- round · rival turn setup: 1118 ms (style+layout 0, render 9): DIV#root.onclick→ed 1074 (forced 254)
- round  rival turn : 520 ms (style+layout 0, render 7): 
- round II your turn choose: 512 ms (style+layout 0, render 19): MessagePort.onmessage→R2 486 (forced 93)
- round III your turn choose: 360 ms (style+layout 0, render 23): MessagePort.onmessage→R2 285 (forced 31)
- round II your turn buy: 337 ms (style+layout 0, render 6): DIV#root.onpointerout→gd 303 (forced 7)
- round II your turn choose: 294 ms (style+layout 0, render 26): MessagePort.onmessage→R2 261 (forced 99)
- round II your turn place: 283 ms (style+layout 0, render 10): DIV#root.onpointerout→gd 241 (forced 8)
- round I your turn place: 252 ms (style+layout 0, render 20): MessagePort.onmessage→R2 216 (forced 87)
- round II your turn place: 248 ms (style+layout 0, render 8): DIV#root.onpointerout→gd 221 (forced 5)
- round III your turn place: 218 ms (style+layout 0, render 11): DIV#root.onpointerout→gd 178 (forced 4)
- round III rival turn buy: 209 ms (style+layout 0, render 11): MessagePort.onmessage→R2 189

## Inside long tasks (CPU profile): 205270 ms in 1510 tasks over 50 ms

### By function, total (inclusive)

- 30759 ms R2 index-DxNRkwJi.js:1109
- 30560 ms J2 index-DxNRkwJi.js:1075
- 29977 ms Gk index-DxNRkwJi.js:6315
- 22311 ms Uk index-DxNRkwJi.js:6697
- 19227 ms Vk index-DxNRkwJi.js:6989
- 15704 ms Pk index-DxNRkwJi.js:6736
- 15693 ms Wk index-DxNRkwJi.js:6745
- 14254 ms Ik index-DxNRkwJi.js:6670
- 14199 ms Tk index-DxNRkwJi.js:6691
- 13734 ms Nh index-DxNRkwJi.js:4054
- 12702 ms cj index-DxNRkwJi.js:4711
- 12673 ms Qj index-DxNRkwJi.js:5649
- 11839 ms hk index-DxNRkwJi.js:6068
- 11837 ms ik index-DxNRkwJi.js:6072
- 11807 ms kk index-DxNRkwJi.js:6092
- 10437 ms jg index-DxNRkwJi.js:3361
- 10425 ms Ek index-DxNRkwJi.js:6454
- 8999 ms applyMove Glyphs-Bb6Vb0i4.js:4395
- 8239 ms Lk index-DxNRkwJi.js:6694
- 6319 ms advance Glyphs-Bb6Vb0i4.js:4690
- 5986 ms accounted Glyphs-Bb6Vb0i4.js:5886
- 4952 ms usePreview Wheel-Df7PFCyN.js:2520
- 4938 ms computeHere Wheel-Df7PFCyN.js:2338
- 4938 ms cachedPreview Wheel-Df7PFCyN.js:2342
- 4880 ms previewSpace Wheel-Df7PFCyN.js:10
- 4826 ms underCause Glyphs-Bb6Vb0i4.js:4163
- 4650 ms ShopTicks CultSeat-Ba6eQc30.js:4449
- 4473 ms eachMemberOf Glyphs-Bb6Vb0i4.js:5475
- 4468 ms walk Wheel-Df7PFCyN.js:42
- 4331 ms step$1 App-43ogsMzR.js:202
- 4175 ms go App-43ogsMzR.js:919
- 4028 ms $i index-DxNRkwJi.js:4663
- 3945 ms sameSeat App-43ogsMzR.js:5298
- 3891 ms sigOf App-43ogsMzR.js:5267
- 3806 ms runTask Glyphs-Bb6Vb0i4.js:4956
- 3360 ms incomeOf App-43ogsMzR.js:5257
- 3349 ms roundStartIncome Wheel-Df7PFCyN.js:182
- 3091 ms eachMember Glyphs-Bb6Vb0i4.js:5512
- 2931 ms playChain CultSeat-Ba6eQc30.js:2395
- 2874 ms Sk index-DxNRkwJi.js:6703
- 2717 ms fd index-DxNRkwJi.js:2368
- 2616 ms bj index-DxNRkwJi.js:4685
- 2608 ms Ej index-DxNRkwJi.js:5165
- 2344 ms hd index-DxNRkwJi.js:2945
- 2341 ms resume Glyphs-Bb6Vb0i4.js:4429

### By function, self

- 133602 ms (program) :0
- 8500 ms query :5287
- 6363 ms getBoundingClientRect :0
- 3327 ms (garbage collector) :0
- 3233 ms (anon) App-43ogsMzR.js:5925
- 3160 ms querySelectorAll :0
- 3087 ms (anon) :0
- 2949 ms applyMove Glyphs-Bb6Vb0i4.js:4395
- 1147 ms roundStartIncome Wheel-Df7PFCyN.js:182
- 1028 ms Ej index-DxNRkwJi.js:5165
- 929 ms (anon) :5285
- 891 ms (anon) CultSeat-Ba6eQc30.js:5022
- 860 ms setAttribute :0
- 730 ms q index-DxNRkwJi.js:382
- 689 ms Nh index-DxNRkwJi.js:4054
- 682 ms querySelector :0
- 628 ms (anon) Glyphs-Bb6Vb0i4.js:5495
- 617 ms (anon) :1
- 524 ms Bj index-DxNRkwJi.js:5092
- 496 ms animate :0
- 438 ms flush Glyphs-Bb6Vb0i4.js:4209
- 432 ms (anon) Glyphs-Bb6Vb0i4.js:5938
- 416 ms removeChild :0
- 407 ms worker.onmessage Wheel-Df7PFCyN.js:2471
- 389 ms focus :0
- 376 ms settle$1 Glyphs-Bb6Vb0i4.js:5900
- 362 ms defById Glyphs-Bb6Vb0i4.js:3991
- 355 ms Wheel Wheel-Df7PFCyN.js:3146
- 335 ms setItem :0
- 333 ms requestAnimationFrame :0

### The 10 longest tasks

- 3394 ms: applyMove Glyphs-Bb6Vb0i4.js:4395 1185 · (program) :0 259 · orderChoices Glyphs-Bb6Vb0i4.js:4639 200 · (anon) Glyphs-Bb6Vb0i4.js:4608 115
- 1061 ms: (anon) :0 836 · (program) :0 121 · innerSerialize :170 34 · isTypedArray :62 34
- 943 ms: (program) :0 309 · ResourceGlyph Glyphs-Bb6Vb0i4.js:8985 187 · (anon) App-43ogsMzR.js:5925 45 · (anon) App-43ogsMzR.js:5008 33
- 771 ms: (program) :0 427 · (garbage collector) :0 46 · (anon) CultSeat-Ba6eQc30.js:5022 46 · query :5287 33
- 752 ms: (program) :0 393 · getBoundingClientRect :0 32 · setItem :0 26 · (anon) Glyphs-Bb6Vb0i4.js:4237 22
- 693 ms: (program) :0 626 · query :5287 36 · querySelectorAll :0 8 · (anon) :5285 5
- 636 ms: (program) :0 367 · (anon) App-43ogsMzR.js:5925 53 · getBoundingClientRect :0 47 · xb index-DxNRkwJi.js:1844 12
- 621 ms: (program) :0 404 · getBoundingClientRect :0 36 · setAttribute :0 24 · applyMove Glyphs-Bb6Vb0i4.js:4395 17
- 610 ms: (program) :0 420 · (anon) App-43ogsMzR.js:5925 53 · query :5287 22 · (anon) Wheel-Df7PFCyN.js:3754 11
- 607 ms: (program) :0 403 · (anon) App-43ogsMzR.js:5925 50 · query :5287 20 · (anon) :0 15
