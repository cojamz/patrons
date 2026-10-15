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
| 10-15 | Verdict plays half of each 200-game sphere block (100) and 85 of the bot fuzz's 170 per seat; the full counts run in `check:v4:full` (nightly/remote). Strength stated in budget.js. | ~1,480 s unit CPU | ~1,080 s | per-game CPU × games |
| 10-15 | Unit tests at nice 10 for every vitest run (vitest.config.js), all cores in the gate; browsers keep priority (Chromium renderers run at nice −8) | 3 workers, nice 0 | 4 workers, nice 10 | `ps -o nice` |
| 10-15 | E2E start as soon as the build is served, not after the unit tests; a machine-wide e2e token pool (4) across all gates replaces 3-per-gate; info and motion take every token (alone on the box), memory joins the parallel set (it reads the heap after a forced GC) | e2e solo phase waited for the unit tests | e2e overlap the unit tests | gate log |
| 10-15 | Check slots 2 → 3, FIFO with an ETA from the run history | "2 of 2 in use", no ETA | "ETA ~4m10s (from recent run times)" | slots.mjs |
| 10-15 | `check:v4:quick` (fast slices minus the coverage gates, build, hotseat) | `--fast` had no e2e | quick pre-check | gate log |
| 10-15 | Per-stage output captured and printed whole; a run record per gate (runs.jsonl); `scripts/v4-retro.mjs` | interleaved logs, no history | retro rows below | — |
