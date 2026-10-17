# Wheel motion under animation load — 2026-10-17

Candidate: immutable `6c1e97e`, 1270×700 Chromium, normal and 4× CPU slowdown. Real Silver Toast action with owned Majordomo and Toastmaster supplies the resource/member chain. Scoring uses the final-round fixture. No other agents' browser/build/unit work overlapped the quiet capture.

## Observed

| Situation | Normal CPU | 4× CPU slowdown |
|---|---|---|
| First idle spin | 330ms; max frame17.7ms | 319ms; max frame32.8ms |
| Spin during resource/member chain | 326ms; one66.5ms frame | 318ms; one50ms frame;56ms long task |
| Spin during scoring | 332ms; max frame17.6ms | 321ms; max frame33.3ms |
| Same-build original filter restored, chain | 332ms; one49.2ms frame | 326ms; max frame33.4ms |

The original-filter comparison did not establish a repeatable filter regression. Removing the filter is a simpler compositor path, but cannot be presented as the proven sole cause of the live lag.

The current candidate's first idle spins meet the400ms landing budget at both CPU rates. The independent cold-spin gate is now required; a clean retry cannot cover a first-spin failure.

## Bottleneck evidence

CPU sampling identifies `fitHalfWidth`'s point-radius/edge predicate and repeated rectangle sampling as the hottest user code. They appear as `y`, `w` and `Zo` in the frozen Wheel chunk; `tl` is `layPanel`. The chain4× trace contains a56ms main-thread long task. Individual paint events were≤2.7ms and layout events≤6.7ms.

A257ms React Scheduler function occurs during chain setup before the key-observer measurement, but profiler startup overlaps that period. Treat its magnitude cautiously; do not attribute all257ms to the game from this capture alone. Measuring from DOM keydown also excludes input queueing before event dispatch, which can matter to perceived responsiveness.

The scoped height memo removes duplicate searches within one `layPanel` call. A useful next small change is sharing geometry results across layout calls by angle/ring/scale/height: resource changes alter panel text and miss the text-dependent layout cache even when the geometric fit problem is unchanged. Preserve width and chosen centre together, preserve zero-width centre semantics, bound the cache, and verify exact rendered geometry before/after.

## Reproduce / evidence

```
V4_URL=http://localhost:5298 V4_TRACE=1 V4_PERF_SHOTS=/tmp/patrons-contention-current node e2e/v4/wheel-contention.mjs
V4_URL=http://localhost:5298 V4_MODES=chain V4_FILTER_ORIGINAL=1 V4_TRACE=1 V4_PERF_SHOTS=/tmp/patrons-contention-oldfilter node e2e/v4/wheel-contention.mjs
```

Raw rows: `/tmp/patrons-contention-current.log`, `/tmp/patrons-contention-oldfilter.log`. Timeline files live in the corresponding output directories. One prematurely started old-filter comparison was immediately stopped; the reported original-filter rows are the later completed sequential run. Its brief startup may have overlapped the tail of the first4× scoring capture, so that particular scoring row is supporting evidence rather than the controlled filter comparison.

These are lab measurements, not physical-phone testing or proof that all live-device animation load is solved.
