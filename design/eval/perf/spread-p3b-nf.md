# Rig spread: p3b-nf

2026-10-28T15:34:42.225Z · http://localhost:5340 · 3 runs, 1 at a time · --no-frame-loop --out=/tmp/claude-0/rig2

Every run played the same game (51 picks).

Median (min–max) across runs.

| round | clicks p95 ms | choose p95 ms | place p95 ms | dead clicks | hovers p95 ms | show frames p95 ms | hitch % | idle busy % | round busy % |
|---|---|---|---|---|---|---|---|---|---|
| I | 351 (241–387) | – | 94 (81–122) | 3 (2–5) | 104 (87–166) | – | 0 (0–0) | 3 (2–5) | 61 (51–62) |
| II | 568 (297–720) | 568 (297–720) | 103 (103–364) | 5 (4–7) | 116 (86–191) | – | 0 (0–0) | 3 (2–3) | 68 (55–71) |
| III | 434 (432–729) | 317 (231–729) | 168 (168–198) | 7 (4–10) | 95 (77–127) | – | 0 (0–0) | 8 (7–9) | 62 (59–71) |

Leak control (unbroken vs reload): elements 4901 (4893–4905) vs 4370 (4370–4370), heap MB 15.4 (15.3–15.4) vs 7.2 (7.1–7.2).

Per run: rig-p3b-nf-1.md, rig-p3b-nf-2.md, rig-p3b-nf-3.md.
