# The Harness

How Claude works on Patrons. Claude owns this file and updates it when something works better.

## The loop
1. Cory dictates a voice note.
2. Claude runs the `/note` routine (even when Cory doesn't type `/note`):
   - pull out decisions, ideas, open questions and to-dos
   - log them in `design/decisions.md`
   - apply any changes to how we work
3. Claude does the legwork. Done means Cory has something he can react to: a link to play, a picture, or a single yes/no.
4. Claude replies within the rules in `working-with-cory.md`.

## Where things live
| What | Where |
|---|---|
| How we talk + autonomy | `.claude/rules/working-with-cory.md` |
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

## Hooks (automatic, in `.claude/settings.json`)
- **Session start:** installs dependencies so tests and builds work in cloud sessions.
- **Every message from Cory:** a short reminder to keep replies within the rules.
- **Safety:** blocks force-push, `rm -rf`, and edits to secrets.
