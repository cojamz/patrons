# Rig spread: h804-nf

2026-10-28T15:34:43.736Z · http://localhost:5339 · 3 runs, 1 at a time · --no-frame-loop --out=/tmp/claude-0/rig2

Every run played the same game (51 picks).

Median (min–max) across runs.

| round | clicks p95 ms | choose p95 ms | place p95 ms | dead clicks | hovers p95 ms | show frames p95 ms | hitch % | idle busy % | round busy % |
|---|---|---|---|---|---|---|---|---|---|
| I | 302 (186–386) | – | 134 (84–274) | 2 (2–2) | 194 (76–220) | – | 0 (0–0) | 3 (2–9) | 63 (52–65) |
| II | 403 (397–620) | 403 (397–620) | – | 7 (6–8) | 180 (86–181) | – | 0 (0–0) | 3 (3–3) | 68 (56–69) |
| III | 380 (348–464) | 250 (214–377) | 131 (92–211) | 6 (5–10) | 130 (97–134) | – | 0 (0–0) | 10 (7–10) | 60 (60–71) |

Leak control (unbroken vs reload): elements 4905 (4904–4905) vs 4370 (4370–4370), heap MB 15.4 (15.3–15.5) vs 7.2 (7.2–7.2).

Per run: rig-h804-nf-1.md, rig-h804-nf-2.md, rig-h804-nf-3.md.
