# Rig spread: timer-nf

2026-10-28T12:00:12.843Z · http://localhost:5313 · 3 runs, 1 at a time · --no-frame-loop --out=/tmp/claude-0/rig2

Every run played the same game (48 picks).

Median (min–max) across runs.

| round | clicks p95 ms | choose p95 ms | place p95 ms | dead clicks | hovers p95 ms | show frames p95 ms | hitch % | idle busy % | round busy % |
|---|---|---|---|---|---|---|---|---|---|
| I | 232 (205–294) | – | 93 (48–194) | 2 (1–4) | 101 (78–134) | – | 0 (0–0) | 5 (4–5) | 48 (47–50) |
| II | 343 (319–459) | 319 (268–459) | 154 (125–248) | 6 (3–6) | 65 (60–100) | – | 0 (0–0) | 2 (2–2) | 56 (56–60) |
| III | 384 (379–573) | 384 (379–573) | 132 (116–208) | 6 (5–8) | 157 (152–182) | – | 0 (0–0) | 4 (3–4) | 61 (60–67) |

Leak control (unbroken vs reload): elements 4881 (4881–5969) vs 4350 (4350–4350), heap MB 15.5 (15.5–15.6) vs 7.2 (7.1–7.2).

Per run: rig-timer-nf-1.md, rig-timer-nf-2.md, rig-timer-nf-3.md.
