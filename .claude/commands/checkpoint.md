# Checkpoint - Update Implementation State

Update `.claude/implementation_state.md`, `TODO.md`, and `CHANGELOG.md` with current progress.

## Instructions for Claude

When this command runs:

1. **Review recent work**:
   - Check git log for last 3-5 commits: `git log --oneline -5`
   - Check what files were recently modified
   - Review current TODO.md

2. **Read current files**:
   - implementation_state.md
   - TODO.md
   - CHANGELOG.md (last section only)

3. **Ask the user what to record**:

   "What should I record for this checkpoint?"

   Options:
   - ✅ Completed a feature (which one?)
   - 🔄 Work session progress (what was accomplished?)
   - 🎯 Hit a milestone (describe it)
   - 🚫 Encountered a blocker (what's the issue?)
   - 📝 Other (explain)

4. **Update THREE files**:

   **A) implementation_state.md**:
   - Update "Last Updated" timestamp (current date/time)
   - Add entry to "State Log" section at the TOP (most recent first)
   - Update "Current Task" if changed
   - Update "Active Issues" if relevant
   - Update "Next Steps" if applicable

   **B) TODO.md**:
   - Move completed tasks from "Active" to "Completed" section
   - Add any new tasks discovered during session
   - Update "Last Updated" timestamp

   **C) CHANGELOG.md**:
   - Add session summary to TOP (most recent first)
   - Include date, what was added/changed/fixed
   - Reference commit hashes if applicable

5. **Show the user** what was updated in all three files

## State Log Entry Format

```markdown
**[YYYY-MM-DD HH:MM]** - [Brief description]
- Status: [Completed / In Progress / Blocked]
- Files Modified: [List 2-5 key files, use /* for many files]
- Notes: [Important details, 1-2 sentences max]
- Next: [What's next, if applicable]
```

## Example Entries

**Feature completion:**
```markdown
**[2025-11-15 23:30]** - Implemented shop cost modifier per-player
- Status: Completed
- Files Modified: src/App.jsx, src/state/gameReducer.js
- Notes: Fixed global shop cost bug, now properly per-player. Tests passing.
- Next: Ready for new feature
```

**Work session:**
```markdown
**[2025-11-16 14:20]** - Progress on multiplayer sync refactor
- Status: In Progress
- Files Modified: src/App.jsx, src/firebase-compat.js
- Notes: Implemented debouncing, timestamp deduplication working. Still need to test echo loop prevention.
- Next: Test with 2 clients, then implement lastUpdatedBy check
```

**Blocker:**
```markdown
**[2025-11-16 16:45]** - Blocked on Firebase rules configuration
- Status: Blocked
- Files Modified: None
- Notes: Need to update database rules in Firebase console before multiplayer testing can proceed.
- Next: Update Firebase rules, then resume testing
```

## Keep It Concise

- Entry should be 4-5 lines total
- Notes: 1-2 sentences maximum
- Files: List only the most important ones
- Use /* for archiving many files (e.g., "archive/*")

## Important Notes

- **Add to TOP** of State Log (most recent first)
- Keep entries brief and scannable
- Focus on what was done, not how
- Include blockers so future sessions know what stopped us
- Update "Current Task" section if task changed
