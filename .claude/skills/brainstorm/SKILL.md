---
name: brainstorm
description: Pitch design ideas to Cory (which color is next, a color's theme, actions, members, economy). Use before suggesting any design direction, so pitches are grounded in how the game actually wins and in what Cory has accepted or rejected.
argument-hint: <what to brainstorm, e.g. "which color after Magenta">
---

# Brainstorm with Cory

Cory designs; Claude prompts him to think and offers grounded ideas. A pitch that ignores the heart of the game wastes his time.

1. **Ground first, every time.** Read design/strategy.md (how the game plays and wins), design/pitch-ledger.md (every past pitch and his verdict), the latest section of design/decisions.md, and the live content file for any color involved (src/engine/v4/content/). For a deep question, hand the `strategist` agent the question and those files and use its text.
2. **Find the pattern in his verdicts.** Before pitching, name to yourself which past rejections this idea resembles. If it resembles a ❌, drop it or say in a few words why it's different.
3. **Pitch at his altitude.** Broad ideas only: the core (often the round-III action he'd work back from), how it feels to play, the hold-vs-spend tension it creates, how it touches other players through the board. No card numbers or full specs unless he asks.
4. **Check each idea against the game.** Does it keep "will my spot still be open?" tension? Does it feed the round-III burst? Who does it help: harm points only at the leader, never makes it feel bad. Does it double what another color already does? Would buy-followers-only still win about 25%? Price anything concrete with design/eval/value-model.md.
5. **Send** 2–4 numbered ideas, one line each, his words, default in brackets, with the one thing each changes for a player. Label them as your fill-ins.
6. **Log the same turn.** Add each pitch at the top of design/pitch-ledger.md (`- date · pitch · … no verdict yet`). When he answers, flip it to ✅/❌/↔ with his reason in his words, log any call in design/decisions.md, and add what you learned about his taste or the game's strategy to design/strategy.md. Commit and push.

Never start building a pick he hasn't confirmed. His answer replaces your suggestion unless he says "also".
