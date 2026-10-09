# The Harness

How Claude works on Patrons. Claude owns this file and updates it when something works better.

## The loop
1. Cory dictates a voice note.
2. Claude runs the `/note` routine (even when Cory doesn't type `/note`):
   - pull out decisions, ideas, open questions and to-dos
   - log them in `design/decisions.md`
   - apply any changes to how we work
3. Claude does the legwork. Done means Cory has something he can react to: a link to play, a picture, or a single yes/no.
4. Claude replies in the Foreman output style.

## Where things live
| What | Where |
|---|---|
| How Claude replies | `.claude/output-styles/foreman.md` (project default output style) |
| Roles + autonomy | `.claude/rules/working-with-cory.md` |
| This process | `.claude/rules/harness.md` |
| Design decisions + ideas | `design/decisions.md` |
| Longer write-ups (plans, options) | `design/*.md`, linked from chat, never pasted |
| Lessons learned about working together | bottom of `working-with-cory.md` (changelog) |

## When to use what
- **Do it directly:** small edits, a single file, quick answers.
- **One background agent:** anything that would mean reading lots of files. The agent keeps the noise out of the main conversation, and Claude passes along only the conclusion.
- **Several agents in parallel:** independent jobs, such as exploring 3 design options at once, or reviewing UX, rules and code at the same time.
- **Workflow (many agents):** big fan-outs. Ask Cory once before running one; after that, use it freely.
- **Browser (Playwright):** to see and screenshot the real UI before telling Cory something works.
- **Preview link:** every push to the PR redeploys a playable link. Prefer sending that over describing a change.

## Self-improvement
- When Cory corrects how Claude works, fix the rule file in the same turn and add a changelog line. Don't wait to be asked.
- If the same kind of correction comes up twice, make it stronger: turn it into a hook, a skill, or a hard rule.
- At the end of a meaty session, add one line to the changelog with what to do differently.
- Keep these files short. When something gets stale, delete it rather than piling on.

## Built-in Claude Code pieces we use (don't reinvent)
- **Output style** (`.claude/output-styles/`, set as `outputStyle` in settings): reply tone and length. Takes effect from the next session.
- **Memory**: `CLAUDE.md` plus every file in `.claude/rules/` loads automatically each session. Cloud containers get wiped, so durable memory lives in repo files, not in auto memory.
- **Skills** (`.claude/skills/<name>/SKILL.md`): repeatable routines, e.g. `/note`.
- **Subagents** (`.claude/agents/*.md`): `design-critic`, `playtester`, `ux-reviewer`. Run them in parallel and pass on only their conclusions. Add more when a role keeps coming up.
- **Hooks** (`.claude/settings.json`): only for things that must happen no matter what. Session start installs deps; a safety hook blocks force-push, `rm -rf` and edits to secrets.
- **/doctor**: audits rules, skills and agents for conflicts. Run it when the setup feels off.
- When unsure about a Claude Code feature, check the official docs (code.claude.com/docs) before building anything.
