# Rig spread: dd0

2026-10-28T08:05:42.194Z · http://localhost:5302 · 3 runs, 1 at a time · --out=/tmp/claude-0/rig2

Every run played the same game (48 picks).

Median (min–max) across runs.

| round | clicks p95 ms | choose p95 ms | place p95 ms | dead clicks | hovers p95 ms | show frames p95 ms | hitch % | idle busy % |
|---|---|---|---|---|---|---|---|---|
| I | 238 (224–310) | – | 114 (110–119) | 1 (0–2) | 91 (77–107) | 16.8 (16.8–16.8) | 2 (1–2) | 4 (4–8) |
| II | 343 (326–401) | 343 (326–350) | 121 (76–139) | 5 (3–6) | 96 (61–100) | 33.3 (33.2–33.3) | 2 (2–3) | 2 (2–2) |
| III | 428 (285–538) | 258 (237–263) | 121 (108–127) | 8 (5–8) | 140 (76–165) | 33.3 (33.3–33.3) | 3 (2–3) | 3 (3–4) |

Leak control (unbroken vs reload): elements 4881 (4881–5969) vs 4350 (4350–4350), heap MB 15.4 (15.3–15.6) vs 7.2 (7.2–7.2).

Per run: rig-dd0-1.md, rig-dd0-2.md, rig-dd0-3.md.
