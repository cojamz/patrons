# Rig spread: p2-nf

2026-10-28T12:54:33.558Z · http://localhost:5319 · 3 runs, 1 at a time · --no-frame-loop --out=/tmp/claude-0/rig2

Every run played the same game (48 picks).

Median (min–max) across runs.

| round | clicks p95 ms | choose p95 ms | place p95 ms | dead clicks | hovers p95 ms | show frames p95 ms | hitch % | idle busy % | round busy % |
|---|---|---|---|---|---|---|---|---|---|
| I | 241 (214–278) | – | 106 (98–111) | 2 (2–3) | 88 (86–94) | – | 0 (0–0) | 4 (4–10) | 46 (46–47) |
| II | 322 (309–411) | 322 (260–411) | 160 (160–251) | 5 (5–5) | 84 (64–95) | – | 0 (0–0) | 2 (2–2) | 55 (54–56) |
| III | 390 (355–525) | 305 (295–349) | 170 (148–182) | 7 (4–8) | 99 (95–114) | – | 0 (0–0) | 4 (3–4) | 61 (58–63) |

Leak control (unbroken vs reload): elements 4881 (4881–5969) vs 4350 (4350–4350), heap MB 15.7 (15.4–15.8) vs 7.2 (7.2–7.2).

Per run: rig-p2-nf-1.md, rig-p2-nf-2.md, rig-p2-nf-3.md.
