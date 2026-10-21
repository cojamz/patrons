---
name: rework-color
description: Rework one color's actions or members with Cory (the loop that shipped Green, Red and Magenta). Use when a thread's job is a color's redesign, from the first idea to the live build.
argument-hint: <color> <actions|members>
---

# Rework a color

The loop that worked for Green (v0.7.0), Red (v0.8.0–v0.8.2) and Magenta actions (v0.8.8). Cory designs every card and number; Claude runs the loop.

1. **Orient.** Read the color's live content file (src/engine/v4/content/), its spec files in design/spheres/, its section of design/strategy.md, and decisions.md entries for it. Note what is live versus what docs claim; live wins.
2. **Start from the core.** Cory usually works backward from the round-III action to find what the color is about. Ask what the round-III should be if it isn't set, then round II, then round I, then members. The economy direction (Oct 20): each action gives 1 of its color and only sometimes more; members cost less and give followers; held resources of the color score its contest; the tension is holding versus spending.
3. **Spec file.** Write design/spheres/<color>-<actions|members>-<date>.md: current cards, his calls so far, open questions. Quote every card's text. Mark your fill-ins.
4. **Picks.** Open questions go to him as a numbered list, one line each, default in brackets, quoting the card text. Use /brainstorm only when he asks for ideas. Log each answer in decisions.md and the spec the same turn.
5. **Build exactly his call.** Engine in content/<color>.js with unit tests in src/test/engine/v4/ (cards-*.test.js); UI wording precise and minimal. Update the old tests that encode replaced rules; never weaken an assertion.
6. **Check.** `npm run check:v4:quick -- --related <files>`, then screenshots of the changed cards and actions at about 1270x700 on a frozen build. No sims unless he asks.
7. **Ship** with /ship-batch. Then update design/strategy.md's section for the color and move the spec's open questions into todo.md.
