# Rig spread: v092-nf

2026-10-28T11:59:32.781Z · http://localhost:5314 · 3 runs, 1 at a time · --no-frame-loop --out=/tmp/claude-0/rig2

Every run played the same game (48 picks).

Median (min–max) across runs.

| round | clicks p95 ms | choose p95 ms | place p95 ms | dead clicks | hovers p95 ms | show frames p95 ms | hitch % | idle busy % | round busy % |
|---|---|---|---|---|---|---|---|---|---|
| I | 370 (347–385) | – | 118 (94–145) | 2 (1–2) | 82 (82–106) | – | 0 (0–0) | 5 (4–6) | 50 (49–52) |
| II | 412 (400–731) | 349 (310–731) | 138 (85–161) | 4 (4–4) | 111 (62–114) | – | 0 (0–0) | 3 (2–11) | 59 (57–63) |
| III | 379 (379–743) | 378 (333–417) | 146 (122–149) | 4 (4–6) | 123 (98–135) | – | 0 (0–0) | 4 (4–5) | 65 (63–70) |

Leak control (unbroken vs reload): elements 5969 (4881–5969) vs 4350 (4350–4350), heap MB 15.5 (15.3–15.7) vs 7.2 (7.2–7.2).

Per run: rig-v092-nf-1.md, rig-v092-nf-2.md, rig-v092-nf-3.md.
