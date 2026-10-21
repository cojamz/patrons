---
name: rework-panel
description: Run the multi-agent design panel that drafts color or member reworks for Cory (groundwork, two designers per scope, five critics, revisers, a final judge). Use when Cory asks for design recommendations on one or more colors or member decks, not for building an approved call.
argument-hint: <scopes, e.g. "gold silver" or "blue members">
---

# The rework panel

Built Oct 21 (overnight) after Cory said past pitches "felt like you don't understand the game". It produced the neutral and Magenta member picks in about 30 minutes each, and full color picks in about 3 hours. The run that built it: design/eval/rework-panel-2026-10-21/ (every brief, pitch, critique and final file).

Recommendations only. Nothing ships until Cory says yes. No sims, no game runs. Agents are read-only except their own output file.

## 0. Ground (foreman, ~15 min)
- Dump live cards: `node` over content/index.js minus cull (see live-cards.txt for the script output shape).
- Write `brief.md` for the run: scope and out of scope, the economy frame, tonight's verdicts verbatim, members he liked and disliked with his words, every rule from the ledger's ❌ tags. Reuse the last run's brief and update it.

## 1. Groundwork (parallel, ~10 min)
Reuse the last run's files if the economy hasn't moved; otherwise rerun:
- member-shape analyst → member-shape.md (principles from his verdicts; now in design/member-principles.md)
- pricing economist → pricing.md (cost and followers under the current economy)
- deck counter → deck-visibility.md (how much of the deck a game shows)
- strategist → strategy-read.md (how the game wins now, identity map)
- judge calibration → cory-judge.md. **Blind test it**: never put the answers in the prompt (the Oct 21 run leaked them; the clean retest scored 10/18 and its misses became rubric v3).

## 2. Designers (parallel, ~15–20 min)
`generator-brief.md`: go wide privately (10–12 seeds, forced spread), filter on ledger tags, develop two concepts, self-critique, recommend one.
- Action colors get two seats: **anchor** (Cory's method: round III first, work backward) and **outsider** (fresh designer; must develop one concept that isn't the strategist's lean).
- Member scopes get one seat with two decks.
- Tell each seat what Cory said about that color in his words, and which parts are locked.

## 3. Critics (parallel, ~10 min)
`critic-brief.md` plus a collisions list the foreman writes after reading the returns. Five seats: **pricing**, **table feel**, **Cory-judge** (rubric), **skeptic** (abuse lines, checked against live code), **architect** (assigns territories across colors so they don't collide). For a fast single scope, judge + skeptic is enough.

## 4. Revisers (parallel, ~15 min)
`reviser-brief.md`: apply agreed fixes, break the shared deck skeleton, cap relative gains, count member cards not bodies, say how Green copies each space, give 3–5 numbered picks with defaults. Genuine splits go to Cory as a pick with both developed.

## 5. Foreman
Read every final file yourself and check the claims against code before sending (the Oct 21 run caught a critic's false "Crew counts as 1 member"; `printedMembers` is max(f, n)). Send numbered picks per color in the voice rules; depth in a linked file under /mnt/project-files/color-reworks/. Log each pitch in design/pitch-ledger.md the same turn.

## Lessons from the first run
- Every designer given the same brief stressing contests reached for contest timing (three seats independently). Herd risk: name the emphasis in the brief and have the architect police it.
- A member-shape "deck of 10" template made seven decks share one skeleton. Give principles, not slots; allow fewer than 10 cards.
- Claude's own audits (member-feel.md) disagree with Cory (Recluse). Cite only his words.
- The critics caught every broken card the designers shipped (spend-to-zero followers, per-resource Robin Hood, uncapped matches, copy holes). Never skip them.
