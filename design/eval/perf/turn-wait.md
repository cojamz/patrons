# The wait between your turns, broken down (2026-10-15)

**Setup.** The harness was `scripts/v4-perf.mjs` with 4× CPU, seed 20261015, a local game (you plus three Normal bots) at Steady. It ran on frozen production builds:
- **before:** ee9b0f8
- **after:** 93e0857, plus the chair-reaction change
- **after2:** 957c93d, plus the drawing lead

The box was loaded (load 11–17 on 4 CPUs), so wall times here are inflated. The proportions, the commit counts and the per-step records are what carry over.

A production build has no component names, so render size is counted as fibers visited per commit. The new `?trace=1` pacing record gives the composition: `summary().pace` holds one entry per table step (handed to React, committed, its hold as planned and as retimed, and when its timer fired). The analysis scripts sit beside the runs in the scratchpad; the numbers are copied here.

## What one wait is made of

The wait runs from the end of your turn to your next turn painted. It is a chain of table steps, and each step costs:

> the previous step's **hold** (the director's plan, retimed with the screen's real distances)
> \+ that hold's **timer lateness** (long frames)
> \+ this step's **drawing time** (handed to React → committed: the whole table renders)

The hold is counted from the commit, so drawing time came on top of every hold, in series.

| run | wait p50 | steps | planned holds | retimed holds | drawing (handed → committed) | timers late | commits per step | fibers per step |
|---|---|---|---|---|---|---|---|---|
| before ee9b0f8 | 14.3 s | 17 / 13 | – | – | – | – | 4.5 / 6.4 | 3313 / 4271 |
| after 93e0857 | 13.2 s | 17 / 13 | 7.07 s / 7.30 s | 7.68 s / 7.79 s | **4.33 s / 3.39 s** | 0.46 s / 0.54 s | 3.6 / 4.6 | 3189 / 3782 |
| after2 957c93d (+ lead) | 13.4 s / 12.2 s | 17 / 13 | 6.38 s / 6.19 s | 6.97 s / 6.68 s | 4.60 s / 3.96 s | 150–430 ms a step | 3.2 / 3.6 | 3183 / 3751 |

The two numbers in each cell are the round-I waits: the first includes the bots' setup picks, the second is a pure round-I wait.

In the after run, the wait splits like this:
- **Holds: about 58%.** The director's schedule, plus 8% from retiming.
- **Drawing: about 33%.** 150–670 ms a step here (a production build on a loaded box). On the quiet box's dev build at 4×, GameScreen p95 was about 600 ms.
- **Timer lateness: about 4%.**
- **The last commit to your turn painted: about 0.1–0.4 s.**

## Why the quiet box showed about 3× the plan

The quiet box measured 20 s against a 6.4 s plan. The plan is the holds only. On a dev build at 4×, drawing one step costs about 0.5–0.6 s. Multiplied by 13–17 steps, that adds 7–10 s. Retiming adds about 8% more.

Before this pass, two more things stacked on top:

1. **Rivals' steps were transitions** (from the earlier input fix). Every number ticking on screen (Tick: a React render per frame per count) and every chair reaction interrupted the table's next render and restarted it. So the next step waited for the counts to stop: starvation.
2. **Extra commits mid-chain:**
   - a flash fade 2 s after every placement re-rendered GameScreen and the Wheel
   - each reacting chair rendered twice (on, and off 900 ms later)
   - a Tick rendered on every painted number

## Render-side fixes (landed in the working tree)

1. **Rivals' steps are plain updates.** Only your own click's table update is a transition. A rival step is one uninterrupted render that can't be starved (`useTable.show`, `userMove`).
2. **Tick writes every number between straight to its text node.** React renders only the start and the end.
   - Before: one render per painted number.
   - After: 4 renders for a 3 → 15 count (the new value, the glow on, the end, the glow off).
   - Guard: render-budget "a number counting…".
3. **No flash-fade render.** The landing flash is a one-shot animation, so the space keeps it until the next placement. This removes one whole GameScreen and Wheel render per placement.
4. **Chair reactions toggle classes on the chair's own elements** (CultSeat `useCultReactions(state, pid, rootEl)`). Chair renders on a step inside a turn went from 2 / 0 / 2 / 0 to 1 / 0 / 1 / 0. The step that ends a turn went from 5–6 to 4 (every chair's turn label changes).
5. **The drawing lead** (useTable). The next step is handed to React early by a running average of the recent drawing time, capped at 40% of the hold and 500 ms. Its commit then lands about when the hold ends, so drawing overlaps the hold instead of adding to it. This should take back most of the 33%.
   - The after2 run measures it: see the end of this file.
   - The `pace` records carry `lead` per step.

Commits per step went from 4.5–6.4 to 3.6–4.6. The rest are the Tick start and end, the chain-end bump of AfterChain, and TurnCard's own placement.

## For the motion engineer (timing is yours)

**Holds alone are 7.1–7.3 s planned per round-I wait on this seed, and 7.7–7.8 s retimed.** So H2's 6.5 s can't be reached by the render side alone, even with drawing at zero.

These are the per-step holds in the after run's pure round-I wait (moves 26–37):

| step | plan | handoff | hold | retimed |
|---|---|---|---|---|
| choose | 470 | 470 | 470 | – |
| place | 935 | 735 | 935 | 1040 |
| buy (recruit) | 865 | 753 | 753 | 799 |
| pay | 0 | 0 | 0 | – |
| place | 1138 | 938 | 1138 | 1313 |
| buy | 805 | 693 | 693 | – |
| place | 0 | 0 | 0 | – |
| buy | 865 | 753 | 753 | 808 |
| place (pass-like) | 0 | 0 | 300 (passHold) | – |
| buy | 865 | 753 | 753 | 755 |
| place | 815 | 615 | 815 | 920 |
| buy | 805 | 693 | 693 | – |

The levers on your side:
- **Retime only ever lengthens** ("never sooner than planned").
  - It added 0.5–0.6 s a wait, and up to +175 ms on a rival placement (1138 → 1313).
  - Letting it shorten as well, or capping it, gives that back.
- **A rival placement that ends its turn holds the whole chain** (`total`, not `handoff`): about 0.8–1.2 s.
- **The 400 ms floor** lifts same-player steps whose handoff is 134–343 ms up to 400 ms: setup picks, and a buy right after a choose.
- **`passHold` (300 ms)** sits on a placement with nothing to show.
- **The pay step plans 0.** The buy before it carries the recruit's chain, which is right.

## after2 (with the drawing lead): it didn't buy time on this box
**Setup:** 957c93d with the lead, the same harness and seed, load 11 → 20.

- **Waits:** 13.4 s and 12.2 s.
- **Holds:** the director's holds changed in that commit: 6.38 / 6.19 s planned, 6.97 / 6.68 s retimed.
- **Commits per step:** down again, to 3.2 / 3.6.
- **Overhead (wait minus retimed holds):** 5.54 s in the pure wait, against 5.29 s in the after run. The lead didn't shrink it.

Why: each step's timer fires 150–430 ms after its planned time, even when the plan is 0. For about 300–400 ms after every commit the main thread is busy with that step's own post-commit work:
- `playChain` reads every source and target, so layout is forced
- the layout effects run
- the small follow-up commits run (the Tick glow, the AfterChain bump at chain end, TurnCard placing itself)
- the long style, layout and paint frames of a big DOM at 4× CPU

So the next step can't start drawing until that's done. The lead only helps when the thread is free during the hold. A quiet box may differ: there, drawing is a larger share than post-commit work.

The lead stays in, behind one number (`lead` in useTable's layout effect). The pace records carry it per step, so the quiet box can judge it; if it does nothing there, set it to 0. Per-step detail of the pure wait (moves 26–38) is in the run's `summary().pace`.

## What's left on the render side, ranked
1. **Post-commit work after each step: about 300–400 ms per step here.**
   - `playChain`'s reads come right after the commit's DOM writes, which forces a full layout of the page each time.
   - Fix: read the step's rects in `beforeShow`, before the DOM changes (they're the same places), or in the next frame's rAF before any write.
   - Fold TurnCard's placement and AfterChain's bump into the step's own commit.
2. **Drawing a step: about 150–350 ms here, about 600 ms dev at 4×.**
   - The whole table renders for every step: about 3200–3800 fibers.
   - The Wheel rebuilds all its sockets when anything in the state changes.
   - Fix: memoise sockets per space on what each one shows (its owner, legality, flash, recent), not on `state`.
3. **The round end:** about 90 commits and about 11 s of the Reckoning. That's its own budget (H10).

**Same harness, at a lower load** (before 6→8, after 8→15; 4× CPU, frozen production builds, seed 20261015):

| | before c5eda4d | after dbfee09 |
|---|---|---|
| input→paint, all clicks (p50 / p95) | 200 / 1411 ms | 234 / 1661 ms |
| click on a space (p50 / p95) | 166 / 339 ms | 100 / 219 ms |
| wait between your turns (p50) | 11.5 s | 10.95 s |
| commit forced layout per step | 191 ms | 180 ms |
| commits per step | 3.5 | 3.8 |
| timer late after the hold (p50) | 175 ms | 138 ms |

So the reads removed this round were not the expensive ones.

**What still costs each step is style, not layout.** I timed every layout-reading call site in the page: a dev server from dbfee09, 4× CPU, about 2 minutes of play. Each `getBoundingClientRect` was split into a forced style pass (`getComputedStyle(el).display`, run first) and the rect read.
- **The commit's first read pays almost everything, and it's style.** That read is director.js `shown()`, called by playChain's `placeEl`. Style before the read: 1.9 s over 36 calls, max 344 ms. The layout after it: about 0.
- **CSS containment on the regions changed nothing:** `contain: layout style` on the chairs, shop, strip, prompt and wheel gave 619 ms against 661 ms.
- **The style recalcs are the step's own invalidations.** The root's `data-phase` changes almost every step, and 27 rules key on it. `data-yours` has 19 rules. Every class a commit changes adds to it.
- **Other sites in the same run:** MemberDeck's deal paid 1.7 s of style in 12 reads (max 596 ms), and the Wheel's local rect 525 ms. The chair column's order-change read is 200–260 ms, once per new order; the ResizeObserver reads are free. The your-move focus calls are 40–80 ms each.

**Next levers (style recalc per step at 4×):**
1. Keep phase styling off the root. Put `data-phase` and `data-yours` on the few regions that use them, so a step invalidates those, not the page.
2. Trace one step's style recalc (CDP `UpdateLayoutTree` element counts) and cut the widest invalidations.
3. Make MemberDeck's deal read its rects before the commit's writes, or from the shop snapshot.

The targets of no long frame over 200 ms at 4× and hover p95 under 150 ms at 4× aren't met yet.

## Round 4: the style recalculation (ec064fe → ec064fe + these changes; trace at 4× CPU, then the harness)
**The trace.** I recorded one stretch of rival steps (about 25 s) with DevTools style-invalidation tracking (`ScheduleStyleInvalidationTracking`, `StyleInvalidatorInvalidationTracking`, `UpdateLayoutTree`):
- **18 whole-page style recalculations,** each about 4,600–5,100 elements and up to 223 ms at 4×.
- **What caused them:** Chrome's `:has()` invalidation on `<body>` (76 schedules) and on the table root (53), which became "invalidates subtree on BODY / .app.game.lt: ALL-DESCENDANTS". On top of that, inline custom-property writes on the table root (`--turn-h`, `--seats-end`): inherited, so every descendant re-styled.
- **Not a cause:** `data-phase` and `data-yours` on the root. Chrome targets those invalidations (2 small schedules in the window), so I didn't move them.

**The changes** (no CSS values touched):
- `.app.game.lt:has(> .turn-card) > .lt-since` (layout.css twice) became `.app.game.lt[data-turn-card] > .lt-since`. TurnCard holds the attribute while it's mounted.
- `body:has(.lt-drawer-back) …` (since.css) became `body[data-drawer] …`, held by Chronicle.
- `body:has(.tip-body [data-since-card]) …` (since.css) became `body[data-since-tip][data-since-tip] …`, held by StoryCard inside a tip. The doubled attribute keeps the old specificity.
- `--turn-h` and `--seats-end` are written on `.lt-since`, their only reader. SinceStrip's room watch reads them there.
- MemberDeck's deal reads every rect before it writes.
- `src/v4/game/bodyFlag.js` sets a counted data attribute while something is mounted.

**The same window, traced again:**

| | before | :has() replaced | + custom properties on the strip |
|---|---|---|---|
| elements re-styled | 88,064 | 13,838 | 1,486 |
| style time | 2,371 ms | 1,019 ms | 387 ms |
| whole-page recalcs | 18 | 2 | 0 |
| worst recalc | 223 ms | 216 ms | 52 ms |

**No visual change.** I took the same seeded game on both builds with reduced motion, at 1270×700: setup, place, choose, buy, a turn card up, and the log drawer open.
- Every shot is pixel-identical within a 24/765 color tolerance.
- At zero tolerance, at most about 1,300 px of sub-threshold noise, all on looping animations.
- At every shot, each flag matched exactly what its `:has()` looked for.

**Harness, 4× CPU, seed 20261015, frozen production builds, both at load 22–33 on 4 CPUs (busier than the quiet box):**

| | before ec064fe | after | quiet box, 44e22bd (load 1–2.5) |
|---|---|---|---|
| input→paint, all (p50/p95) | 942/4400 | **544/1776** | 292–352/2357–2667 |
| click on a space (p50/p95) | 236/3648 | 168/660 | – |
| hover on a space (p50/p95) | 522/1498 | **127/372** | 272–287/546–704 |
| hover on a shop card (p50/p95) | 758/2863 | 165/312 | 270–390/551–616 |
| wait between your turns (p50) | 22.1 s | **10.4 s** (pure round-I wait 9.1 s) | 18.3–20.2 s |
| forced layout in the React task (pure wait) | 297 ms/step | 43 ms/step | – |
| timer late after the hold (p50) | 459 ms | 10 ms | – |
| long tasks | 288 s total, max 3.0 s | 54 s, max 0.94 s | – |
| total blocking | 205 s | 25 s | – |

Long frames of 200 ms or more: 803 → 841, but at load 22–33 every frame is slow. The quiet box will judge the 200 ms target.

**Guards:**
- `src/test/v4/ui/css-has.test.js` fails on a `:has()` whose subject is body, html, `.app` or the table root (`.lt`, `.game`). The setup screen's `.app.narrow` is allowed. Run against the old stylesheets, it lists all 5 of the old rules.
- render-budget "no effect writes a custom property on the table root during a step" stubs a laptop-sized page and a reporting ResizeObserver, so the writing paths run. It asserts nothing lands on the root while `--turn-h` is written on the strip.
