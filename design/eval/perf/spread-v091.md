# Rig spread: v091

2026-10-28T08:15:45.484Z · http://localhost:5301 · 3 runs, 1 at a time · --out=/tmp/claude-0/rig2

Runs played different games: first split at pick 31: 145 color:blue / 144 space:now:2-1 / 144 space:now:2-1.

Median (min–max) across runs.

| round | clicks p95 ms | choose p95 ms | place p95 ms | dead clicks | hovers p95 ms | show frames p95 ms | hitch % | idle busy % |
|---|---|---|---|---|---|---|---|---|
| I | 265 (261–360) | – | 91 (68–111) | 2 (2–2) | 123 (78–145) | 16.8 (16.8–16.8) | 1 (1–1) | 10 (8–11) |
| II | 293 (255–306) | 290 (232–306) | 103 (90–139) | 4 (4–4) | 100 (93–100) | 33.2 (16.8–33.3) | 2 (2–2) | 14 (14–14) |
| III | 511 (398–551) | 573 (404–747) | 104 (100–131) | 9 (5–9) | 124 (104–129) | 33.4 (33.3–33.4) | 3 (3–4) | 30 (25–36) |

Leak control (unbroken vs reload): elements 6408 (6408–6568) vs 4632 (4632–4632), heap MB 15.8 (15.6–15.9) vs 7.2 (7.2–7.2).

Per run: rig-v091-1.md, rig-v091-2.md, rig-v091-3.md.
