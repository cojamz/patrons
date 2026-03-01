---
name: ship
description: Merge a successful experiment branch back to main after tests pass
user-invocable: true
allowed-tools: Bash, Read
---

# Ship Experiment

Merge the current experiment branch into main after verifying quality gates.

## Process

1. **Verify we're on an experiment branch**:
   - Get current branch: `git branch --show-current`
   - Must start with `experiment/`. If not, stop: "You're not on an experiment branch. Nothing to ship."

2. **Check for uncommitted changes**:
   - Run `git status --porcelain`
   - If dirty, warn: "You have uncommitted changes. Commit them first before shipping."

3. **Run quality gates**:
   - Run `npm run test` in the Patrons project directory
   - If tests fail, stop: "Tests failed. Fix them before shipping, or `/discard` to abandon."
   - Run `npm run build`
   - If build fails, stop: "Build failed. Fix before shipping."

4. **Merge to main**:
   ```bash
   BRANCH=$(git branch --show-current)
   git checkout main
   git merge "$BRANCH" --no-ff -m "Ship experiment: ${BRANCH#experiment/}"
   git branch -d "$BRANCH"
   ```

5. **Confirm**:
   ```
   Shipped! Experiment `<branch-name>` merged to main.
   Tests passed. Build clean. Branch deleted.
   ```

## Rules
- NEVER force merge. If there are conflicts, stop and ask the user.
- NEVER skip the test gate. Tests must pass.
- Always use `--no-ff` for a clean merge commit.
- Delete the experiment branch after successful merge.
