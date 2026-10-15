# Critic calibration results

Answer key: answer-key.md (Cory's 2026-10-15 play notes, 24 items). Build: frozen RC1 (fd4d734, .v4-panel/rc1 on :5191). Each run is a fresh blind tester (claude -p, clean environment, no repo context) with only the URL, the RC1 rulebook, the brief and the checklist. Scoring: a hit names the same problem on the same element; a half names the element and a neighbouring problem. A brief is trusted at ≥80%.

| Round | Instrument | Findings | Hits (of 24) | Recall | Notes |
|---|---|---|---|---|---|
| 0 | RC1 panel (newcomer, strategist, saboteur) + ui-critic round 2: Playwright with DOM access, top 8, grade first | ~45 across 4 reports | 2 (1 + 2 halves) | 8% | baseline; see diagnosis.md |
| 1 | brief-v1 + checklist, v4-eyes only (no DOM), 1 fresh tester, laptop, 38 min, 3 tab crashes (box out of memory) | 115 | 10 full + 8 halves = 14 | 58% | below 80%: brief changed to v2 |

### Round 1 scoring (answer key number → tester-1 finding)
Full: 1 snappy (#4 #14 #32 #49 #64 #104 #115, every one with ms) · 3 docked hovers (#19 "160–946 px from the pointer", #70) · 5 effect not on the card (#17) · 8 hover noise lines (#23 "In the shop") · 10 steal picked from a detached list (#35 #86 #87) · 11 pay sheet (#42 #76 #77) · 14 seats as mostly empty boxes (#31) · 17 round end runs unwatched and can't be narrated (#57 #58 #97 #109) · 19 members with no hover (#67) · 24 "badged" Blue (#16 #85).
Half: 6 cost notation (#101 words vs glyphs; not "the dot is enough") · 9 glyph clashes (#16 #41; not "too many") · 13 score strip ambiguous, not redundant (#30) · 16 deck hover's words, not its pointlessness (#29) · 20 leaders look alike, not members (#63) · 21 motion snaps (#36 #44 #90), not sprite quality · 22 rim marks and sprites overlapping spaces (#24 #47) · 23 crowded, clipped rings (#65 #98), not "no visual grammar".
Missed: 2 wheel spin (never spun it) · 4 setup pick's call to action (it saw the picker covering the wheel instead) · 7 "need N" shouting (it asked to make the chip longer, the opposite) · 12 follower shop hidden · 15 shop unsorted · 18 Redistribute's "more than you" (never read that space).
Instrument audit (tester 1 transcript): 122 Bash commands, every one a v4-eyes call; 181 screenshots read; zero DOM, Playwright, page JavaScript or repo reads.
Pattern: the eyes fixed the bugs-by-DOM problem (docking, latency, round end and the steal list all came from looking), but taste questions nobody forced it to answer (density, prominence, order, glyph count, restraint) stayed unasked. v2 adds a restraint rule and eight audits it must fill in (call to action, card anatomy, glyph census, duplicate census, prominence, order, hover census with every space's text, motion and art).
