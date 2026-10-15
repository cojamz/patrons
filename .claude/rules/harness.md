# The Harness

How Claude works on Cults (the repo is still called patrons). Claude owns this file and updates it when something works better.

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
| Design principles (distilled, auto-loaded) | `.claude/rules/design-principles.md` |
| Design decisions + ideas (full log) | `design/decisions.md` |
| Longer write-ups (plans, options) | `design/*.md`, linked from chat, never pasted |
| Lessons learned about working together | bottom of `working-with-cory.md` (changelog) |
| State of the project (start here after a break) | `design/HANDOFF.md` |
| What's running now, with briefs and ports | `design/in-flight.md` |
| The ordered to-do (human playability first) | `design/todo.md` |
| The UI being built (Lamplit Table) | `design/prototypes/vision/build-plan.md` |
| Reviews, ledgers, measurements | `design/eval/` |

## When to use what
- **Do it directly:** small edits, a single file, quick answers.
- **One background agent:** anything that would mean reading lots of files. The agent keeps the noise out of the main conversation, and Claude passes along only the conclusion.
- **Several agents in parallel:** independent jobs, such as exploring 3 design options at once, or reviewing UX, rules and code at the same time.
- **Workflow (many agents):** big fan-outs. Ask Cory once before running one; after that, use it freely.
- **Browser (Playwright):** to see and screenshot the real UI before telling Cory something works.
- **Preview link:** every push to the PR redeploys a playable link. Prefer sending that over describing a change.

## Building v4 (code)
- Architecture lives in `design/architecture.md`: pure engine → sessions (local / online host-authoritative) → React UI. Rules live only in the engine.
- The loop is the `/v4-loop` skill: change → `npm run check:v4` → look at screenshots → review agents → fix → commit/push.
- **A verdict comes only from a commit:** `npm run check:v4 -- --commit <sha|HEAD>` exports that commit to `.v4-wt/check-<sha>-<pid>` (git archive, node_modules symlinked), runs tests, build and e2e there, and removes it. The plain live-tree `check:v4` is for iterating; it says so on every run, because others' uncommitted edits land mid-run (a content change between the build and an e2e's engine import fails the resume e2e). At most 2 `check:v4` run on the box at once (`V4_CHECK_SLOTS`, slots in `/tmp/v4-check-slots`, a dead run's slot is reclaimed); later runs queue in arrival order and say who holds the slots. Its processes (vitest, build, e2e, the in-process preview) can't outlive it.
- **Ports and build dirs:** every agent that runs `check:v4` sets its own `V4_OUTDIR=.v4-build-<name>` and `V4_PORT=<unique, 5281+>`. check:v4 refuses a busy port before it starts (it names who listens there) and confirms the preview answering is its own build before any e2e. Frozen builds for reviewers are served from `.v4-panel/<n>` on 5190+. Nobody is ever pointed at a build dir someone else is rebuilding.
- **Freeze from a commit, never the live tree:** commit, `git worktree add .v4-wt/<sha> <sha>`, symlink node_modules, build there into `.v4-panel/<n>`. `node scripts/v4-peek.mjs freeze <n> [port]` builds and serves (the server lives inside that process: kill it and the server is gone); `node scripts/v4-peek.mjs shots <url> <dir> [query]` plays a full game at laptop and iPhone 13 and screenshots it. A UI fix counts only when a gate fails without it or Claude has seen it on a fresh frozen build.
- Agents never commit; the foreman verifies and checkpoints (WIP checkpoint commits).
- **Fresh eyes at every milestone (Cory, 2026-10-14):** on a frozen build, three new blind reviewers in parallel (ui-critic, boardgame-enthusiast, engineer), each saved to `design/eval/<role>-round<N>.md`. Then one synthesis agent reads the three together (plus Cory's latest notes and the panel's "felt unfair or unfun") and writes `design/eval/meta-round<N>.md`: themes, agreements, root causes, one ranked list. Act on each report and on the meta list; the meta list sets priority. Verify single-reviewer claims before fixing.
- **Blind panels** before a verdict: three fresh testers (laptop newcomer, phone by touch, saboteur), each with only the URL and design/rulebook.md, each listing "felt unfair or unfun"; then `game-skeptic` as the final gate. Details in the `/v4-loop` skill.
- **The balance bench** (`npm run bench:v4 [-- --quick]`, design/eval/bench/README.md) is the standing balance reading: anchors, card fair prices, space worth, archetypes, fairness and health, each read by Normal and Hard-20, flagged only when both agree, with a diff against the last run. Quote it before any one-off sim; `-- --records=<dir>` compares friends' games line by line.
- `npm run sim:v4 -- 300 4` gives a quick bot-vs-bot balance read. It's a reading, not a design verdict; name the instrument (Easy/Normal/Hard bot, 4-thinker tables, AI tester) with every number.
- **This box has 4 CPUs.** Throttle heavy sims here (at most 2 sim workers at once, nothing heavy while e2e gates run). Big sweeps (fair-price screen, bot levels, 4-thinker tables) go to remote sessions on their own machines, each on its own branch; the foreman reviews before merging, and design changes still go to Cory.
- **Motion work in parallel** (the intro, 2026-10-14): one lead owns a shared kit (`src/v4/intro/shared.jsx`: world, camera, timeline primitives) and a storyboard with each piece's start/end state; builders take one beat or moment each in its own file against that contract, preview it alone on a shared HMR dev server (`?lab=intro&beat=N`), and show it as a GIF (`node scripts/v4-gif.mjs <url> <out.gif> <ms>`); the lead integrates. Show Cory GIFs, not descriptions.
- **Usage limits kill agents mid-work** (four times on 2026-10-14). Keep `design/in-flight.md` current (who's running, their brief, their port) and arm a `send_later` check-in that resumes each paused agent with SendMessage, or relaunches it from its brief.

## Self-improvement
- When Cory corrects how Claude works, fix the rule file in the same turn and add a changelog line. Don't wait to be asked.
- If the same kind of correction comes up twice, make it stronger: turn it into a hook, a skill, or a hard rule.
- At the end of a meaty session, add one line to the changelog with what to do differently.
- Keep these files short. When something gets stale, delete it rather than piling on.

## Built-in Claude Code pieces we use (don't reinvent)
- **Output style** (`.claude/output-styles/`, set as `outputStyle` in settings): reply tone and length. Takes effect from the next session.
- **Memory**: `CLAUDE.md` plus every file in `.claude/rules/` loads automatically each session. Cloud containers get wiped, so durable memory lives in repo files, not in auto memory.
- **Skills** (`.claude/skills/<name>/SKILL.md`): repeatable routines, e.g. `/note`.
- **Subagents** (`.claude/agents/*.md`). Run them in parallel and pass on only their conclusions; never show Cory agent output unvetted. Add more when a role keeps coming up.
  - `ui-critic`: blind, super-picky designer and information architect; plays laptop + phone by sight; grades "one glance or one tap"; ends with a Vision section (what it COULD be).
  - `boardgame-enthusiast`: blind hobby gamer; judges the game itself (decisions, tension, arc, balance feel, fun), two full games.
  - `game-skeptic`: blind adversarial final grader; SHIP needs A- or better.
  - `design-critic`: read-only rules/mechanics expert; have it return text, then save it yourself. Every agent-designed sphere passes it before Cory sees it.
  - `playtester`, `ux-reviewer`: quick checks while iterating.
  - The engineering reviewer has no agent file: a fresh general agent with repo access and no prior context (design/eval/engineering-review.md is round 1).
  - Blind means: only a URL and the player rulebook, never the repo; new instances every time.
  - Time-box blind reviewers: about 30 minutes of play, then write up (Cory waited over an hour for round 2 on an overloaded box). Say the time box in the prompt.
  - Ask testers for "a move log with a short note on why", never "write your reasoning": that wording tripped the API's safeguards and killed a tester (2026-10-14).
- **Hooks** (`.claude/settings.json`): only for things that must happen no matter what. Session start installs deps; a safety hook blocks force-push, `rm -rf` and edits to secrets.
- **Workflows** (`.claude/workflows/*.js`, run by name): `quadrant-forge` is the evaluator team. It runs inventors, then per sphere a lint/value check, 2 lens judges, a mind-play tester holding a ledger, a red team and a synthesizer (revise up to twice or kill), then combo-table playtests and a meta-critic that proposes rubric changes. Edit it as the process evolves. Speed: this container has 4 CPUs, so each workflow runs only 2 agents at once. For throughput, run several workflows in parallel over slices (args: pool, from, to, stage:'forge'). Pass a light pool whose spec fields point to per-sphere files in design/eval/runs/<batch>/. A single agent can't echo back a 60KB pool.
- **/doctor**: audits rules, skills and agents for conflicts. Run it when the setup feels off.
- When unsure about a Claude Code feature, check the official docs (code.claude.com/docs) before building anything.
