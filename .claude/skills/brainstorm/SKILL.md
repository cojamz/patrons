---
name: brainstorm
description: Pitch design ideas to Cory (which color is next, a color's theme, actions, members, economy). Use before suggesting any design direction, so pitches are grounded in how the game actually wins and in what Cory has accepted or rejected.
argument-hint: <what to brainstorm, e.g. "which color after Magenta">
---

# Brainstorm with Cory

Cory designs; Claude prompts him to think and offers grounded ideas. A pitch that ignores the heart of the game wastes his time. Models converge on the same few ideas unless forced apart, so this skill forces breadth, then filters hard.

1. **Ground.** Read design/strategy.md, design/pitch-ledger.md (with its tags), design/lessons/design.md, .claude/rules/design-principles.md, the latest section of design/decisions.md, and the live content file for any color involved (src/engine/v4/content/). For a deep question, hand the `strategist` agent the question; it keeps its own memory of how the game wins.
2. **Go wide on purpose.** Privately write about 12 seeds, at least one per direction: tempo (when you place), space (which spots, blocking), the shop and members, information (what rivals can see), interaction (who you touch, only the leader?), holding versus spending, and "remove one mechanic and see what breaks". Start from what the round-III action could be; Cory works backward from it.
3. **Filter against his taste.** Drop any seed that shares a tag with past ❌ verdicts in the ledger unless you can say in a few words why it's different. Drop near-duplicates. Keep the 2–4 that are furthest apart.
4. **Critique each survivor on paper.** Rule → how a round plays (which spaces get fought over, what you hold or spend, how the round-III burst lands) → how it feels for the leader, the trailer and a newcomer. Check: keeps "will my spot still be open?", harm only at the leader, doesn't copy another color, buy-followers-only still near 25%. Price anything concrete with design/eval/value-model.md. No game runs.
5. **Send** the 2–4 as a numbered list, one line each, in his words, default in brackets, each with the one thing it changes for a player. Label them as your fill-ins. Broad ideas only; no card numbers unless he asks.
6. **Log the same turn.** Add each pitch at the top of design/pitch-ledger.md (`- date · pitch · … no verdict yet · tags: …`). When he answers, flip it to ✅/❌/↔ with his reason in his words, log any call in design/decisions.md, add what you learned to design/strategy.md, and add a lesson to design/lessons/design.md if the verdict surprised you. Commit and push.

Never start building a pick he hasn't confirmed. His answer replaces your suggestion unless he says "also".
