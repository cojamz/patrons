# Critic calibration results

Answer key: answer-key.md (Cory's 2026-10-15 play notes, 24 items). Build: frozen RC1 (fd4d734, .v4-panel/rc1 on :5191). Each run is a fresh blind tester (claude -p, clean environment, no repo context) with only the URL, the RC1 rulebook, the brief and the checklist. Scoring: a hit names the same problem on the same element; a half names the element and a neighbouring problem. A brief is trusted at ≥80%.

| Round | Instrument | Findings | Hits (of 24) | Recall | Notes |
|---|---|---|---|---|---|
| 0 | RC1 panel (newcomer, strategist, saboteur) + ui-critic round 2: Playwright with DOM access, top 8, grade first | ~45 across 4 reports | 2 (1 + 2 halves) | 8% | baseline; see diagnosis.md |
