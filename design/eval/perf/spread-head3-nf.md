# Rig spread: head3-nf

2026-10-28T12:54:23.381Z · http://localhost:5321 · 3 runs, 1 at a time · --no-frame-loop --out=/tmp/claude-0/rig2

Every run played the same game (48 picks).

Median (min–max) across runs.

| round | clicks p95 ms | choose p95 ms | place p95 ms | dead clicks | hovers p95 ms | show frames p95 ms | hitch % | idle busy % | round busy % |
|---|---|---|---|---|---|---|---|---|---|
| I | 323 (254–329) | – | 76 (75–91) | 1 (1–2) | 101 (85–116) | – | 0 (0–0) | 4 (4–4) | 47 (46–47) |
| II | 371 (347–442) | 371 (347–442) | 159 (117–164) | 5 (3–5) | 72 (65–83) | – | 0 (0–0) | 2 (2–8) | 55 (54–57) |
| III | 531 (489–939) | 354 (318–489) | 120 (112–140) | 7 (5–8) | 140 (93–141) | – | 0 (0–0) | 3 (3–3) | 60 (59–61) |

Leak control (unbroken vs reload): elements 4881 (4881–5969) vs 4350 (4350–4350), heap MB 15.6 (15.4–15.7) vs 7.2 (7.2–7.2).

Per run: rig-head3-nf-1.md, rig-head3-nf-2.md, rig-head3-nf-3.md.
