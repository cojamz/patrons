---
name: note
description: Process a voice-dictated note from Cory. Use for any rambling/dictated message with design thoughts, feedback on how Claude works, or instructions — even without /note.
argument-hint: <dictated text>
user-invocable: true
---

# Process a voice note

1. **Sort the note** into four groups. Skip any group that's empty.
   - **Decisions:** things Cory has settled.
   - **Ideas:** maybes, "what if…".
   - **Open questions:** things Cory is unsure about.
   - **How-we-work feedback:** anything about how Claude talks or works.
2. **Log design content.** Append decisions, ideas and questions to `design/decisions.md` under today's date: ✅ decision · 💡 idea · ❓ open. One line each, in Cory's own words where possible.
3. **Apply how-we-work feedback now.** Edit `.claude/rules/working-with-cory.md` or `.claude/rules/harness.md`, and add a changelog line.
4. **Act on instructions.** If the note asks for work, do it, following the autonomy rules.
5. **Reply in 8 lines or fewer.**
   - Say what you logged or changed in one line.
   - Read back only the parts that were ambiguous.
   - End with at most 2 questions, each with a default Cory can say yes to.
6. Commit and push the log and rule changes.
