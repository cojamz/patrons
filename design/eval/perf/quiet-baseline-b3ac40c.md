# Quiet-box perf baseline (b3ac40c, before the perf pod), 2026-10-15 05:02 UTC

The remote quiet box ran with load 1–2.2 before each run, and the tracer saw no HMR reloads. Values are p50/p95 in ms, run 1 → run 2.

- Input→paint, all events: at 4× CPU, 706/1035 → 689/1101. At 1×, 168/273 → 184/360. Online host 232/379, guest 255/400.
- At 4×, per action: space 925–1033 · buy member ~650 · buy followers ~640 · pay ~540 · pass ~670 · next round 790–950 · wheel click 112–144.
- Wheel spin: about 4.6 s and 38 frames at 4× (worst frame gap 371–509), and about 3.5 s at 1×. This was before the motion and perf passes.
- Hover open p95 at 4×: space 215 · shop card ~140 · rim 194–261. "You'd get" filled at ~218.
- Long frames at 4×: about 330 frames of 50 ms or more, about 45 s of blocking per run, longest 1.8 s (the first click). The top ten are React click handlers (660–790) and the scheduler.
- React render p95 at 4×: App ~1000 · GameScreen ~340 · Wheel ~190 · CultSeat ~104 · ShopCards ~100. Whole-tree commits run about 1080 times per run, and the Wheel renders 255 times.
- From the end of your turn to your next turn painted: about 12.5 s p50 at 4×. A bot's move is applied in 513 ms, but shows on the table at 2.5 s p50 and 5.9 s p95, because the animation queue sets the pace.
- Online (80 ms lag): sent→applied about 330 · sent→received about 550 · sent→painted about 1100–1200 p50. Snapshots are 4.7–19 KB of whole state on every move.
- Online also showed 3 dead clicks, the same in both runs: next round (host and guest) and a guest's Swap Sides choice. Routed to QA.

Next: the same harness on the commit after the perf pod's fixes (render-budget.test.jsx) and the motion choreography. Compare row by row.
