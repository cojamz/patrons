---
name: discard
description: Discard a failed experiment and return to main cleanly
user-invocable: true
allowed-tools: Bash, Read
---

# Discard Experiment

Abandon the current experiment branch and return to main with no changes.

## Process

1. **Verify we're on an experiment branch**:
   - Get current branch: `git branch --show-current`
   - Must start with `experiment/`. If not, stop: "You're not on an experiment branch. Nothing to discard."

2. **Show what will be lost**:
   - Run `git log main..HEAD --oneline` to show commits on this branch
   - Run `git diff main --stat` to show changed files
   - Present: "This experiment has N commits affecting N files. Discard everything?"

3. **Ask for confirmation**:
   - Use AskUserQuestion: "Discard experiment `<branch>`? This deletes all changes on this branch."
   - Options: "Yes, discard it" / "No, keep working"

4. **If confirmed, discard**:
   ```bash
   BRANCH=$(git branch --show-current)
   git checkout main
   git branch -D "$BRANCH"
   ```

5. **Confirm**:
   ```
   Discarded. Experiment `<branch-name>` deleted.
   Back on main, clean slate.
   ```

## Rules
- ALWAYS show the user what they're about to lose before discarding.
- ALWAYS ask for confirmation. Never auto-discard.
- Use `git branch -D` (force delete) since the branch is intentionally unmerged.
- If the user says no, stay on the experiment branch and continue.
