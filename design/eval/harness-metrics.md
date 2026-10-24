# Harness metrics

What the gate costs, measured, so every change to the harness has a before and an after. Wall times are on this box
(4 vCPUs, 15 GB) unless noted; "loaded" means other agents' work was running too, which was the norm on 2026-10-14/15
(load average 8–37).

## Profile (2026-10-15)

**Before:** a full verdict took 37–60 min (rc1 fd4d734: 37.6 min; 8f4d76e: 60.3 min; 1f26810: 58.8 min, each with touch's
~10 min) and agents waited 23–31 min for one of 2 slots, up to 72 min seen. Three causes, measured:

1. **Unit tests are CPU, not waiting.** ~1,480 s of CPU per run (summed per file, one at a time, `time`): the bots cost
   0.35–0.7 s of CPU per seeded game (Echo's table 0.72 s, Market 0.38 s), and the suite plays ~2,200 of them. Top:
   7 sphere blocks of 200 games (~650 s), bot fuzz 510 games (~170 s), fire audit (134 s), contest truth 4×50 games,
   stale-choice fuzz (40 s), random fuzz (23 s), fuzz tables (23 s), bot levels (23 s), RoundEnd in jsdom (18 s).
   In the bots, 24% of the time is `lightClone`/`copy` of the whole state per option scored and 12% GC
   (`node --cpu-prof`, src/engine/v4/bots.js:181-188): the biggest lever left, and it is game code.
2. **E2E are waiting, not CPU.** Each script uses 7–20% of one core (CPU vs wall, alone): benders 6.7 s of 49 s,
   hotseat 13 s of 73 s, info 7 s of 45 s, layout 4 of 12, memory 5 of 69, motion 6 of 65, online 16 s of 193 s
   (loaded). Running them 3 at a time was leaving the box idle; they queue on animations, bot pacing and polling.
3. **The box was oversubscribed by runs nobody counted.** Besides 2 gates, agents ran full `npx vitest run` suites
   outside the slots (two at once, 13 min each, at 03:15), at the same priority as the timing e2e: hover p95 and
   count-up gates failed from load (motion failed on rc1).

## Changes (before → after)

| date | change | before | after | how measured |
|---|---|---|---|---|
| 10-15 | Verdict plays half of five 200-game sphere blocks (100) and 85 of the bot fuzz's 170 per seat; Market and Silver keep 200 (their blocks assert a rate); the full counts run in `check:v4:full` (nightly/remote). Strength stated in budget.js; harness.test.js fails if a slice shrinks. | ~1,480 s unit CPU | ~1,170 s | per-game CPU × games |
| 10-15 | Unit tests at nice 10 for every vitest run (vitest.config.js), all cores in the gate; browsers keep priority (Chromium renderers run at nice −8) | 3 workers, nice 0 | 4 workers, nice 10 | `ps -o nice` |
| 10-15 | E2E start as soon as the build is served, not after the unit tests; a machine-wide e2e token pool (4) across all gates replaces 3-per-gate; info and motion take every token (alone on the box), memory joins the parallel set (it reads the heap after a forced GC) | e2e solo phase waited for the unit tests | e2e overlap the unit tests | gate log |
| 10-15 | Check slots in units: a full gate 2, quick/fast 1, capacity 3 (one full gate at a time beside one quick: CPU-bound gates finish sooner in a row than shared); a quick may pass a waiting gate unless it has waited 10 min; ETA from the run history | 2 runs, "2 of 2 in use", no ETA | "ETA ~4m10s (from recent run times)" | scratch pool runs |
| 10-15 | Agents' bare whole-suite `vitest run` takes a check slot (vitest globalSetup) and every agent vitest run uses 2 workers, not 3 | 6 unslotted suites, 33 workers on 4 CPUs (03:33) | counted and capped | `ps`, lock dir |
| 10-15 | `check:v4:quick -- --related <files>` / `npm run test:v4:related -- <files>`: only the tests that import what you touched | 80 files | Wheel.jsx → 10 files | vitest related |
| 10-15 | online.mjs reads every option in 2 round trips, not one `getAttribute` per option per page per poll | ~N+3 CDP calls a poll | 3 | code |
| 10-15 | `check:v4:quick` (fast slices minus the coverage gates, build, hotseat) | `--fast` had no e2e | quick pre-check | gate log |
| 10-15 | Per-stage output captured and printed whole; a run record per gate (runs.jsonl); `scripts/v4-retro.mjs` | interleaved logs, no history | retro rows below | — |

**After, on a quiet box: not measured yet.** This box sat at load 30–46 the whole session (eleven agents running suites
and browsers), so any wall time taken here was the load's, not the gate's. Estimate from the CPU profile: unit tests
~1,170 s of CPU at the verdict slice on ~3.7 free cores ≈ 5.3 min, overlapping the e2e (build 10 s + parallel set ~130 s
bounded by online + info 45 s + motion 65 s ≈ 4.2 min), so a verdict ≈ 5–6 min and `--quick` ≈ 1.5 min. To measure on
a quiet machine (4 CPUs; `taskset -c 0-3` on a bigger one), from a commit with these changes:
`npm ci && taskset -c 0-3 npm run check:v4 -- --commit HEAD` and `taskset -c 0-3 npm run check:v4:quick`, then
`node scripts/v4-retro.mjs` here with the two logs, or paste their summaries into the table above.

## Retro (one row per milestone: `node scripts/v4-retro.mjs`)
Verdicts (`check:v4 -- --commit`): median wall (worst) and how many were green; unit tests' wall; e2e done (seconds from the start); green `--quick` median; waits for a check slot over all runs; failed stages over all runs; slowest unit files.

| date (UTC) | runs | verdict p50 (max) | unit | e2e done | quick p50 | slot wait p50 (max) | failures | slowest unit files |
|---|---|---|---|---|---|---|---|---|
| 2026-10-15 04:07 | baseline, old gate (saved logs, touch included): 3 verdict, 1 live | 58.8m (60.3m), 0/3 green | 12.1m | – | – | 23.1m (31.1m) | touch.mjs ×4, hotseat.mjs ×2, info.mjs ×2, motion.mjs ×2, spaces.mjs ×1, engine + spheres + session + ui tests ×1, layout.mjs ×1, tables.mjs ×1 | – |
| 2026-10-16 16:15 | 6 quick; box load at start p50 4.2 | – (–), 0/0 green | – | – | 2.2m | 0s (0s) | unit tests ×3, hotseat.mjs ×1 | – |

## Quiet-box measurements (remote, 4 CPUs, 2026-10-15 ~04:30 UTC)
- ce03bc3: `check:v4:quick` 146s; full `check:v4 --commit` 1103s (18.4 min). During the gate the load averaged 8.5 and peaked at 25 on 4 CPUs, so the gate saturates even an idle box. The 5–6 min estimate was too low.
- b7a2b76: full verdict 1117s.
- The old serial gate on the loaded local box took 37–60 min. So the parallel gate is about 2–3× faster, but the e2e set still dominates. Next lever: e2e jobs bounded by CPU (not 3 + 4 slots), and the motion/snappy timing gates run alone after everything else.
<!-- retro-through: 2026-10-16T16:12:21.580Z -->

2026-10-16 local shipping lesson: the complete original-note audit caught scope omissions (shop size / follower tiers) that a green code gate cannot detect. Keep the verbatim note and 59-item mapping beside release status. Fixed deploy-script single-branch main tracking and Unicode variable parsing; final publish verified full SHA and byte-identical HTML, then public browser checked actual UI. Frozen quick check c8dd8a9 took 132s; full unit set 1163 passed / 1 skipped, build and hotseat passed.
