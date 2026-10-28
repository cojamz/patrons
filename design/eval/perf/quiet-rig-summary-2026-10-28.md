# Quiet-box rig summary, 2026-10-28 (4x CPU, Relaxed, 1 person + 3 Normal bots)

Same rig for every row below (the rig at dd0d5d7b; the first v0.9.1 base used an older rig, a392e48a, whose idle reading and leak bars differ, so it is not comparable).

| run | build | seed | stalls >10 s | min | clicks p95 I/II/III | round III choose p95 | round III place | hovers p95 I/II/III | idle busy I/II/III | leak elements / heap |
|---|---|---|---|---|---|---|---|---|---|---|
| base | c0c8a10d v0.9.1 | 20261028 | (no watchdog) | 10 | 406/411/397 | 397 | 277 ms | 90/73/114 | 50/15/20 | 6271 vs 4524 / 15.5 vs 7.1 |
| e3e5 #1 | e3e560d3 | 20261028 | five, 105-115 s | 40 | 450/324/1232 | 1232 | 74 ms | 77/106/238 | 1/9/8 | 6030 vs 4396 / 16.2 vs 7.2 |
| e3e5 #2 | e3e560d3 unminified + profiler | 20261028 | 0 | 10 | 512/441/2549 | | | 109/83/105 | 1/26/5 | 5335 vs 4827 / 16.1 vs 7.6 |
| e3e5 #3 | e3e560d3 | 20261028 | 0 | 11 | 512/311/1335 | | | 97/182/109 | 1/20/6 | 6039 vs 4433 / 16 vs 7.2 |
| dd0 #1 | dd0d5d7b | 20261028 | 0 | 11 | 453/320/2502 | 2502 | no answer (5x) | 96/86/93 | 0/18/7 | 5290 vs 4786 / 16.2 vs 7.4 |
| dd0 #2 | dd0d5d7b | 20261028 | 0 | 10 | 443/2524/3347 | 3692 | no answer (5x) | 106/80/75 | 48/2/4 | 6399 vs 4807 / 16.4 vs 7.3 |
| dd0 #3 | dd0d5d7b | 20261029 | 0 | 10 | 543/454/434 | 434 | no answer (5x) | 96/119/118 | 1/18/6 | 6579 vs 4923 / 16.5 vs 7.4 |

e3e5 #1 ran on the rig at e3e560d3 (same bars as dd0d5d7b's; only the frames-over-2-s note differs). Runs with a watchdog used design/eval/perf/quiet-rig-watchdog.patch, which also CPU-profiles from round II on (2 ms sampling).
