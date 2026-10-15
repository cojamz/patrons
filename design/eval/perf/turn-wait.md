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

## Round 2: post-commit work and the Wheel (after3, 44e22bd + working tree; load 21–23, so wall times are noise)
**The Wheel now redraws only the spaces that changed.** Each space's element is kept with a signature of what it shows: owner, minions and their emojis, lit/option, taken, fresh ring and newest, flash, panel layout, pick note, position, round and look. A `WheelSpace` memo skips the space when the element is the same.
- Per rival step, 24 spaces redrew before. Now: place 1–2, buy 0, pay 0.
- Components per rival step: 200 / 190 / 267 / 219 / 206 / 287 → 127 / 111 / 175 / 150 / 125 / 208.
- Guard: render-budget "a rival's step…" asserts at most 2 spaces per step.

**TurnCard has no state.** Its place and its fit-on-screen lift are written to its style in one layout effect. Before, `setPos` and `setLift` each cost a commit of their own.
- Small follow-up commits in the pure round-I wait: 33 → 26.
- Commits per step: 3.6 → 3.1.

**Flights read cached rects.** playChain's pieces and member chips use each place's rect once (`rectOf`), not a `getBoundingClientRect` per piece.

**Tried and set aside: `measureChain`**, which measures the chain's geometry before the commit.
- It moved the reads into the useTable timer, from 0.15 s to 0.76 s of forced layout there.
- It didn't lower the forced layout in the commit task (3.4 s against 2.6 s, at higher load).
- The reason: mid-chain the layout is never clean. The previous chain's tail writes every frame (held stacks, ghosts), so a read before the commit pays a layout too.
- The function stays in director.js, not called.

**Where the commit's forced layout comes from now.** It is about 250–320 ms a step at 4× on this box, and it isn't playChain. The first layout effect to read after the DOM changes forces the whole-page layout, and every later read after a write forces another:
1. SinceStrip runs `getComputedStyle(sec).maxHeight` and `scrollHeight` on every new entry, which is every step, and may then call `setDrop`, a second commit.
2. TurnCard reads the dock and the rates' rect.
3. The focus effect runs `focus()` on every state when nothing has focus.
4. The seat-order animation reads every seat's top at each turn change.

Next: make SinceStrip's overflow check a ResizeObserver callback only, out of the commit. Read TurnCard's dock once per layout change, not per step.

## Round 3: the layout reads in each step's commit (c5eda4d → 68749e6 and the working tree)
**Changes:**
- **SinceStrip:** overflow is checked from a ResizeObserver on the list and its lines. Reads made inside that callback are free, because the layout has settled. The art director's whole-line fold logic now runs inside that callback.
- **Focus:** the status line takes focus only when the step's kind changes and focus is really lost.
- **Chair column:** laid out when the seat order changes, and from a ResizeObserver on the rail and the chairs. The chairs move by transform, which never resizes them, so the observer can't loop.
- **TurnCard dock:** cached, and recomputed on a window resize, when the column or the strip mounts, or, in the layout that seats the card by its chair, when the chair changes.
- **measureChain:** deleted.

**Deterministic counts.** These are the jsdom calls that force layout or style, per rival step, counted by the render-budget guard "a rival step reads the layout only where it must". The shop snapshot taken before a card leaves is left out: it runs before the commit, while the layout is clean.

| step | before c5eda4d | after |
|---|---|---|
| placement (a new turn card) | 10: dock 3, lift 1, card height 1, column 1, director 4 | 8: dock 3, lift 1, director 4 |
| buy | 1: column | 0 |
| pay (turn ends) | 13: strip 3, dock 3, lift 1, card height 1, column 1, director 5 | 6: lift 1, director 5 |

In a real browser the column's read is 6 (the rail, 4 chairs and a computed style), and jsdom shows it as 1. What's left in the commit is the director's own measuring (`placeEl`'s visibility check and its rects, 4–6 a step), plus the card's lift in the chair-seated layout.

**Harness, 4× CPU, frozen production builds, at load 25–30 on 4 CPUs:**

| | pure round-I wait | commits per step | forced layout in the React task |
|---|---|---|---|
| before | 14.5 s | 2.9 | 333 ms/step |
| after | 21.3 s | 3.4 | 422 ms/step |

At this load the CPU is sliced among about 7 runnable processes per core, so these times are noise. One example: React-task script time per step rose too, 563 → 847 ms, with the same code doing less. Judge this round by the counts above. The quiet box should confirm the wall time.
