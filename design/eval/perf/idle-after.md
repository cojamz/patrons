# Idle cost through one game: idle-after

On P1's turns, the table waiting; 4x CPU, 3 s each.

| moves | round | busy % | script | style | layout | running animations | elements | listeners | heap MB |
|---|---|---|---|---|---|---|---|---|---|
| 12 | I | 14 | 1 | 31 | 0 | 22 | 2234 | 502 | 10.9 |
| 13 | I | 53 | 0 | 288 | 0 | 24 | 2341 | 512 | 11.5 |
| 25 | I | 0 | 0 | 0 | 0 | 23 | 2683 | 529 | 12.8 |
| 26 | I | 0 | 0 | 0 | 0 | 22 | 2545 | 520 | 13 |
| 40 | I | 16 | 44 | 46 | 3 | 21 | 2715 | 537 | 13.9 |
| 45 | II | 6 | 2 | 33 | 0 | 37 | 2684 | 537 | 13.5 |
| 46 | II | 52 | 0 | 279 | 0 | 39 | 2670 | 541 | 14 |
| 73 | II | 1 | 0 | 0 | 0 | 37 | 3019 | 574 | 17.1 |
| 74 | II | 1 | 1 | 0 | 0 | 36 | 2797 | 555 | 17.3 |
| 76 | II | 1 | 0 | 0 | 0 | 37 | 2948 | 565 | 17.4 |
| 108 | II | 1 | 0 | 0 | 0 | 37 | 3311 | 604 | 20.7 |
| 120 | III | 7 | 0 | 60 | 0 | 57 | 3086 | 596 | 18.7 |
| reload | III | 1 | 0 | 0 | 0 | 57 | 2305 | 533 | 8 |
| no infinite idle loops | III | 0 | 0 | 0 | 0 | 0 | 2308 | 535 | 8 |
| no animations at all | III | 0 | 0 | 0 | 0 | 0 | 2311 | 537 | 8 |
## Why the idle loops cost main-thread time (2026-10-28)

None of the idle loops was main-thread by itself: each one alone (the others off) costs ~0-1% except the member
sprites and minions, and making those explicitly main-thread (top/left, or a custom property in the keyframes) made
them 3-5x worse, so they were already on the compositor. The cost came from React 18 registering an
`animationiteration` listener at its root and at document.body (portals). While any node listens for that event,
Chromium wakes the main thread at every iteration boundary of every running CSS animation to dispatch it, and each
wake restyles every animated element. ~60 short-period loops by round III meant a wake every few frames.
Fix: src/v4/quietIdle.js mutes that one event on the root and body before React mounts (nothing uses
onAnimationIteration). Same CSS, same motion. With it, a page with all 57-62 loops running costs ~1% at 4x.

Also: the recorder's rAF loop (used by the early/late phases) turns every frame into a main frame, which restyles all
animated elements each frame; it no longer runs in the idle phase. Before and after below are both without it
(idle-before-unwatched.md is the old build, same script). The high single rows (a round's first turn, 50%+) are the
round-start show still running after the 2.5 s settle, not the loops; they appear in both runs.
