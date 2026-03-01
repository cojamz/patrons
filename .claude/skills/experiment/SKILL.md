---
name: experiment
description: Start a new game mechanic experiment on an isolated git branch
argument-hint: <experiment-name>
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob
---

# Start Experiment

Create an isolated git branch for experimenting with a game mechanic change.

## Process

1. **Validate argument**: Require an experiment name via `$ARGUMENTS`. If missing, ask: "What are we experimenting with? Give it a short name (e.g., `blocking-reward`, `fewer-colors`, `comeback-mechanic`)."

2. **Check preconditions**:
   - Verify we're on `main` branch. If not, warn: "You're on branch `X`. Switch to main first, or discard/ship your current experiment."
   - Verify working tree is clean (`git status --porcelain`). If dirty, warn: "You have uncommitted changes. Commit or stash them first."

3. **Create experiment branch**:
   ```bash
   git checkout -b experiment/$ARGUMENTS
   ```

4. **Confirm ready**:
   ```
   Experiment `experiment/$ARGUMENTS` is live.

   You're on an isolated branch — main is untouched.
   Make your changes, then:
   - `/ship` to merge if it works
   - `/discard` to roll back if it doesn't
   ```

## Rules
- Branch name format is always `experiment/<name>`
- Never create nested experiments (check we're on main first)
- Don't make any code changes — just set up the branch
