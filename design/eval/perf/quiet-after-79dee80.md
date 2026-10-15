# Quiet-box perf after the motion director (79dee80), 2026-10-15 07:35 UTC

The same harness as the baseline (local dev build, 4× CPU, seed 20261015, two runs within about 10% of each other).

| | before (b3ac40c) | after (79dee80) |
|---|---|---|
| Your turn's end → your next turn painted, p50 | 12.5s | **20.1s** (plan: 6.4s) |
| Input→paint, all events, p50 | ~700ms | **~150ms** |
| Space click, p95 | ~1000ms | 176–453ms |
| Hover open, p95 (space) | 215ms | 224–229ms |
| GameScreen render p95 | ~340ms | 558–604ms |
| Wheel render p95 | ~190ms | 352–396ms |
| Long frames (≥50ms), blocking | ~330, 45s | ~725, 29s |

Clicks and input got much faster. The wait between turns got much slower: the motion chain plus render costs during chains add up to about 3× the plan. Top priority: the perf pod is breaking down the turn wait (design/eval/perf/turn-wait.md) and the motion engineer is trimming the director's timing. The target is ≤6.5s p50.

The gate on 79dee80 also failed: 1 unit test (wording drift, since fixed), hotseat (undo then place; 1–3px jitter), memory (results DOM), spaces s9 (since fixed), members m2, three stray qa-probe files (now excluded), turnstory (since fixed), layout at 900px (card footer overflow), info (d) hovers, and snappy (spin 458ms, since fixed).
