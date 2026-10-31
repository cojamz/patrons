# Perf rig: diag-base

2026-10-28T07:09:37.430Z · http://localhost:5301 · 4x CPU · relaxed · seed 20261028 · 1 person + 3 Normal bots · 26 min · game finished

Verdict: FAIL (13)
- round I: clicks p95 421 ms (bar 100)
- round I: idle table busy 11% (bar 10%)
- round II: clicks p95 2617 ms (bar 100)
- round II: hovers p95 127 ms (bar 100)
- round II: idle table busy 13% (bar 10%)
- round III: clicks p95 3847 ms (bar 100)
- round III: hovers p95 242 ms (bar 100)
- round III: idle table busy 43% (bar 10%)
- clicks p95 grows 421 → 3847 ms over the game
- idle busy grows 11% → 43% over the game
- leak: 6589 elements vs 4680 after a reload
- leak: 824 listeners vs 719 after a reload
- leak: heap 16.5 MB vs 7.2 MB after a reload

## Per round

| round | clicks p50/p95 ms | hovers p50/p95 ms | show frames p95 ms | hitch % | worst frame | long frames >100ms | idle busy % | idle style ms/3s | elements | listeners | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| I | 117 / 421 | 49 / 66 | 17 | 1 | 233 | 6 | 11 | 95 | 2024 | 506 | 10 |
| II | 218 / 2617 | 60 / 127 | 33 | 2 | 517 | 23 | 13 | 119 | 3156 | 551 | 15.2 |
| III | 318 / 3847 | 90 / 242 | 33 | 5 | 97979 | 156 | 43 | 295 | 3585 | 604 | 19.8 |

Leak control on the last turn: unbroken game 6589 elements, 824 listeners, 16.5 MB; after a reload 4680, 719, 7.2 MB.

## Round I

Clicks by kind: place 3× p50 95 p95 95 · choose 5× p50 118 p95 421 · recruit 3× p50 114 p95 114 · pay 3× p50 120 p95 189 · next-round 1× p50 82 p95 82 · 3 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| svg.leader:cult-breathe | 2766 | 17 | 233 | 2 |
| g.blink:cult-blink | 2766 | 17 | 233 | 2 |
| b.seat-delta.up:seatdelta | 4898 | 17 | 233 | 1 |
| span.lead:cult-scheme | 1414 | 33 | 233 | 3 |
| span.tc-line:tcline | 1985 | 33 | 183 | 2 |
| i.cs-min:cs-bob-eager | 1040 | 33 | 233 | 3 |
| i.cs-min:cs-bob | 1435 | 33 | 233 | 2 |
| img.sprite:cult-shift | 2747 | 17 | 233 | 1 |
| img.sprite:cult-breathe | 2163 | 17 | 100 | 1 |
| path.wash:fill | 197 | 67 | 183 | 10 |
| span.dots:blink | 161 | 67 | 100 | 11 |
| div.path-inner:js | 1700 | 17 | 117 | 1 |

Longest frames: 261 ms (style/layout/paint) · 177 ms (hn 167) · 124 ms (hn 106) · 113 ms (style/layout/paint) · 112 ms (hn 27, Worker.onmessage 13, Worker.onmessage 62)

## Round II

Clicks by kind: place 4× p50 155 p95 155 · choose 8× p50 297 p95 2617 · recruit 4× p50 235 p95 238 · pay 4× p50 144 p95 155 · next-round 1× p50 84 p95 84 · 3 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| b.seat-delta.up:seatdelta | 6613 | 33 | 517 | 2 |
| svg.leader:cult-breathe | 3118 | 33 | 517 | 3 |
| g.blink:cult-blink | 3118 | 33 | 517 | 3 |
| img.sprite:cult-shift | 3118 | 33 | 517 | 3 |
| img.sprite:cult-breathe | 3118 | 33 | 517 | 3 |
| span.tc-line:tcline | 2683 | 33 | 167 | 3 |
| span.lead:cult-scheme | 1552 | 33 | 517 | 5 |
| i.cs-min:cs-bob | 1773 | 33 | 517 | 4 |
| i.cs-min:cs-bob-eager | 1374 | 33 | 517 | 5 |
| div.path-inner:js | 2365 | 33 | 317 | 2 |
| path.wash:fill | 300 | 67 | 317 | 14 |
| span.base:opacity | 823 | 33 | 317 | 4 |

Longest frames: 531 ms (style/layout/paint) · 276 ms (hn 257) · 239 ms (hn 211) · 217 ms (hn 208) · 158 ms (hn 124)

## Round III

Clicks by kind: place 6× p50 92 p95 92 · choose 21× p50 335 p95 3847 · recruit 5× p50 353 p95 353 · pay 6× p50 269 p95 319 · next-round 1× p50 63 p95 63 · 9 changed nothing in 4 s

| animating | frames | p95 | worst | hitch % |
|---|---|---|---|---|
| svg.leader:cult-breathe | 4988 | 50 | 97979 | 6 |
| g.blink:cult-blink | 4988 | 50 | 97979 | 6 |
| img.sprite:cult-shift | 4988 | 50 | 97979 | 6 |
| img.sprite:cult-breathe | 4988 | 50 | 97979 | 6 |
| b.seat-delta.up:seatdelta | 5926 | 33 | 5917 | 5 |
| span.lead:cult-scheme | 2364 | 83 | 97979 | 12 |
| i.cs-min:cs-bob | 2520 | 83 | 97979 | 11 |
| i.cs-min:cs-bob-eager | 2150 | 83 | 97979 | 11 |
| span.tc-line:tcline | 2825 | 67 | 31182 | 8 |
| img.sprite:cult-eager | 1064 | 133 | 97979 | 21 |
| div.path-inner:js | 2714 | 33 | 32865 | 5 |
| span.dots:blink | 353 | 150 | 97979 | 29 |

Longest frames: 97970 ms (e 97820 [IdleRequestCallback @ Wheel-B3Z4lCk4.js:71108]) · 89219 ms (e 89186 [IdleRequestCallback @ Wheel-B3Z4lCk4.js:71108]) · 62016 ms (e 61886 [IdleRequestCallback @ Wheel-B3Z4lCk4.js:71108]) · 57127 ms (e 57122 [IdleRequestCallback @ Wheel-B3Z4lCk4.js:71108]) · 35996 ms (e 35988 [IdleRequestCallback @ Wheel-B3Z4lCk4.js:71108])

Frames over 2 s, with the screen at the time:
- 62016 ms · pay · prompt "Your turn — choose how to pay" · hover "" · options back pay:0-0-1-0
- 89219 ms · pay · prompt "Your turn — choose how to pay" · hover "" · options back pay:0-0-1-0
- 57127 ms · place · prompt "P3 is placing a minion ···" · hover "" · options 
- 97970 ms · place · prompt "P3 is placing a minion ···" · hover "" · options 
- 7636 ms · choose · prompt "P3 is choosing ···" · hover "" · options 
- 18119 ms · choose · prompt "P3 is choosing ···" · hover "" · options 
- 8974 ms · buy · prompt "P3 is shopping ···" · hover "" · options 
- 18174 ms · buy · prompt "P3 is shopping ···" · hover "" · options 
- 7352 ms · place · prompt "P4 is placing a minion ···" · hover "" · options 
- 4789 ms · buy · prompt "P4 is shopping ···" · hover "" · options 
- 11753 ms · pay · prompt "P4 is paying ···" · hover "" · options 
- 5527 ms · place · prompt "P4 again (snake order) ···" · hover "" · options 
- 5914 ms · buy · prompt "P4 is shopping ···" · hover "" · options 
- 16056 ms · buy · prompt "P4 is shopping ···" · hover "" · options 
- 5511 ms · buy · prompt "P3 is shopping ···" · hover "" · options 
- 13160 ms · pay · prompt "P3 is paying ···" · hover "" · options 
- 5333 ms · place · prompt "Your turn — place a minion on a glowing space" · hover "" · options slot:0-0 slot:0-1 slot:0-2 slot:1-0 slot:1-4 slot:2-0 slot:2-1 slot:2-4 slot:3-4 slot:3-5
- 5337 ms · place · prompt "Your turn — place a minion on a glowing space" · hover "" · options slot:0-0 slot:0-1 slot:0-2 slot:1-0 slot:1-4 slot:2-0 slot:2-1 slot:2-4 slot:3-4 slot:3-5
- 12391 ms · place · prompt "Your turn — place a minion on a glowing space" · hover "" · options slot:0-0 slot:0-1 slot:0-2 slot:1-0 slot:1-4 slot:2-0 slot:2-1 slot:2-4 slot:3-4 slot:3-5
- 11493 ms · buy · prompt "Your turn — recruit a member or followers" · hover "SavingsI:+3II:+4III:+5TakenYou" · options tier:small tier:mid tier:top pass card:3 card:44 card:50 card:5 card:4 card:26 card:46
- 31036 ms · buy · prompt "Your turn — recruit a member or followers" · hover "SavingsI:+3II:+4III:+5TakenYou" · options tier:small tier:mid tier:top pass card:3 card:44 card:50 card:5 card:4 card:26 card:46
- 11870 ms · pay · prompt "Your turn — choose how to pay" · hover "" · options back pay:0-0-1-0
- 30183 ms · pay · prompt "Your turn — choose how to pay" · hover "" · options back pay:0-0-1-0
- 11076 ms · place · prompt "P2 is placing a minion ···" · hover "" · options 
- 29326 ms · place · prompt "P2 is placing a minion ···" · hover "" · options 
- 10997 ms · pay · prompt "P2 is paying ···" · hover "" · options 
- 31057 ms · pay · prompt "P2 is paying ···" · hover "" · options 
- 11484 ms · place · prompt "P2 again (snake order) ···" · hover "" · options 
- 32831 ms · choose · prompt "P2 is choosing ···" · hover "" · options 
- 31156 ms · choose · prompt "P2 is choosing ···" · hover "" · options 
- 30568 ms · buy · prompt "P2 is shopping ···" · hover "" · options 
- 33799 ms · place · prompt "Your turn — place a minion on a glowing space" · hover "" · options slot:0-0 slot:0-1 slot:0-2 slot:2-1 slot:2-4 slot:3-4 slot:3-5
- 33063 ms · place · prompt "Your turn — place a minion on a glowing space" · hover "" · options slot:0-0 slot:0-1 slot:0-2 slot:2-1 slot:2-4 slot:3-4 slot:3-5
- 35996 ms · place · prompt "Your turn — place a minion on a glowing space" · hover "Out of StyleSend every shop member of one color to the bottom of the pile, then refill. +2.You’d getYou’d get: +2rivals " · options slot:0-0 slot:0-1 slot:0-2 slot:2-1 slot:2-4 slot:3-4 slot:3-5
- 34573 ms · place · prompt "Your turn — place a minion on a glowing space" · hover "Out of StyleSend every shop member of one color to the bottom of the pile, then refill. +2.You’d getYou’d get: +2rivals " · options slot:0-0 slot:0-1 slot:0-2 slot:2-1 slot:2-4 slot:3-4 slot:3-5
- 32844 ms · place · prompt "Your turn — place a minion on a glowing space" · hover "Greatest HitsCopy every action with your minion. +1.CopiesPeek, Collect Debts, Encore, Savings, Greatest HitsYou’d getYo" · options slot:0-0 slot:0-1 slot:0-2 slot:2-1 slot:2-4 slot:3-4 slot:3-5
- 33589 ms · choose · prompt "" · hover "Greatest HitsCopy every action with your minion. +1.TakenYou" · options space:order:0-3 space:order:2-0 space:order:2-2 space:order:3-3
- 9655 ms · choose · prompt "" · hover "" · options space:order:0-3 space:order:2-0 space:order:2-2 space:order:3-3
