# Cults (repo: patrons): playbook for Codex and other agents

Claude and Codex work from one playbook. This file only points at it; don't fork the rules here.

1. Work on branch `claude/gifted-newton-3lcy3i` (the v4 game). `main` is the frozen v3 game plus `play/` (the live build) and a mirror of the harness. Never merge v4 source into main.
2. Start: `node .claude/hooks/orient.mjs` prints the live version vs the branch, the other threads' status, the current handoff and the last decisions. Claude gets this automatically through hooks; Codex runs it by hand.
3. Read `CLAUDE.md`, then `.claude/rules/working-with-cory.md`, `.claude/rules/harness.md`, `.claude/rules/design-principles.md` and `.claude/output-styles/foreman.md` (the voice for every message to Cory). They are the rules; this file adds nothing to them.
4. While working: post your line on the thread board with `node scripts/status.mjs set --thread "Codex: <job>" --state working --doing … --next … --eta …`, and set `--state done` at the end.
5. Before you stop (Claude's Stop hook does this; you do it by hand):
   - design calls Cory made → `design/decisions.md` (date, one line, why); pitches and his verdicts → `design/pitch-ledger.md`; strategy learnings → `design/strategy.md`;
   - `design/HANDOFF.md`, `design/in-flight.md`, `design/todo.md` true for the next agent (one current state, no stacked sections);
   - commit and push (rebase, never force-push).
6. Checks: `npm run check:v4:quick -- --related <files>` while iterating; the verdict is `npm run check:v4 -- --commit <sha>`. Ship with `bash scripts/v4-play.sh <sha>` and confirm the stamp. No sims or batches of test games unless Cory asks.

7. Skills: `.agents/skills` links to `.claude/skills` (same SKILL.md format). ChatGPT chat reads nothing by itself; Cory pastes design/chatgpt-project-instructions.md into its Project once, and pastes its "To log" lines into a Claude thread.
