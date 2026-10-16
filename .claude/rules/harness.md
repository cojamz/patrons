# The Harness

How Claude works on Cults (the repo is still called patrons). Claude owns this file and updates it when something works better.

## Current operating priorities (Cory, 2026-10-15)
- Own the harness: choose and coordinate resources to shorten delivery while preserving correctness and visual quality. Diagnose bottlenecks; do not equate more agents with more throughput.
- Visual verification is essential, including motion and transitions. Use available authorized browser checks; native screen capture was declined, so do not request it again. Never claim a visual check that did not happen.
- Keep decisions, tasks and handoff current as work lands; remove stale active instructions, record evidence, and clean up temporary processes and outputs. At milestones, review delays and misses and make a concrete process improvement when warranted.
- Current shipping: use the shared v4 branch, ship individually after the required quick checks, then run scripts/v4-play.sh and verify the published build. README.md and the latest working-with-cory.md shipping instruction supersede the historical Netlify/WIP funnel below. A− is the finished-build bar, not a reason to withhold iterations.

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
- **Preview link:** every push to the PR branch redeploys a playable link. Prefer sending that over describing a change, but only once the preview shows that build (see Deploys).

## Deploys (2026-10-15)
- **Checkpoints go to `claude/cults-wip`.** The PR/deploy branch (`claude/gifted-newton-3lcy3i`) gets only gate-green commits. Every push there redeploys the preview and spends deploy credits. About 60 overnight checkpoint pushes likely used up Netlify's free credits and left the preview stale (likely, not confirmed).
- **Host:** moving to Cloudflare Pages (500 free builds a month; Cory connects the repo once) is recommended, pending Cory.
- **Check the build stamp before sending a link.** Open the live preview and confirm it carries that build's stamp. Cory played a stale build on 2026-10-15.
- **The final blind panel runs after the last fix round,** on the exact build Cory will open. A grade on an earlier build doesn't count.

## Building v4 (code)
- **Standing design pod (Cory, 2026-10-15: "build a robust design pod, and enable them"):** whenever the UI is changing, an art director (composition, layout, hierarchy) and a detail designer (obvious slop at every state, on several tables) run as a loop on their own dev servers. They critique against design/taste.md and Cory's notes, fix directly, log in design/eval/design-pod/, and guard what they fix. Cory should never be the one catching obvious problems. **Since 2026-10-15 afternoon** (Cory: "when i jump into the game i immediately find a million things to fix"): the pod's briefs are `.claude/agents/art-director.md` and `detail-designer.md`. They read the whole answer key, play one live game per pass through v4-eyes on a rotating table (stills only to re-check), run the feel camera (hover complete, speed ladder), keep an outcome ledger, try moving or deleting before restyling, and never build a blind tester's request that contradicts one of Cory's written calls (it goes to the foreman as a question).
- **Judge motion with the filmstrip, not real-time video, on a loaded box:** design/prototypes/motion/film.mjs drives a fake clock, so every frame is exact. The motion language is design/prototypes/motion/grammar.md (targets H1–H14), and its review is review.md.
- **Taste (Cory, 2026-10-15):** every agent that touches the screen reads design/taste.md first. Its ten rules, way of working and slop list go into every screen prompt, and the visual language in design/prototypes/language/ is the look.
- Architecture lives in `design/architecture.md`: pure engine → sessions (local / online host-authoritative) → React UI. Rules live only in the engine.
- The loop is the `/v4-loop` skill: change → `npm run check:v4` → look at screenshots → review agents → fix → commit/push.
- **A verdict comes only from a commit:** `npm run check:v4 -- --commit <sha|HEAD>` exports that commit to `.v4-wt/check-<sha>-<pid>` (git archive, node_modules symlinked), runs tests, build and e2e there, and removes it. The plain live-tree `check:v4` is for iterating; it says so on every run, because others' uncommitted edits land mid-run (a content change between the build and an e2e's engine import fails the resume e2e). At most 3 `check:v4` run on the box at once (`V4_CHECK_SLOTS`, slots in `/tmp/v4-check-slots`, a dead run's slot is reclaimed); later runs queue in arrival order with an ETA from recent run times. Unit tests run at nice 10 (every vitest run does), browser e2e share 4 machine-wide tokens across all gates, and the timing e2e (info, motion) take all 4, alone on the box. Its processes (vitest, build, e2e, the in-process preview) can't outlive it. While iterating use `npm run check:v4:quick` (~2 min; `-- --related <files>` for just the tests that import what you touched); a bare whole-suite `vitest run` takes a slot too, and agents' vitest runs use 2 workers; the verdict plays half of the biggest seeded blocks and `npm run check:v4:full` (nightly/remote) plays them all. Numbers: design/eval/harness-metrics.md.
- **Ports and build dirs:** every agent that runs `check:v4` sets its own `V4_OUTDIR=.v4-build-<name>` and `V4_PORT=<unique, 5281+>`. check:v4 refuses a busy port before it starts (it names who listens there) and confirms the preview answering is its own build before any e2e. Frozen builds for reviewers are served from `.v4-panel/<n>` on 5190+. Nobody is ever pointed at a build dir someone else is rebuilding.
- **When many agents are editing, run e2e on a frozen build, never on a dev server.** Hot reloads from other agents' edits close sessions and stall games mid-test, and fake "stalls" cost an hour on 2026-10-15. Dev servers are for quick looks only.
- **Freeze from a commit, never the live tree:** commit, `git worktree add .v4-wt/<sha> <sha>`, symlink node_modules, build there into `.v4-panel/<n>`. `node scripts/v4-peek.mjs freeze <n> [port]` builds and serves (the server lives inside that process: kill it and the server is gone); `node scripts/v4-peek.mjs shots <url> <dir> [query]` plays a full game at laptop and iPhone 13 and screenshots it. A UI fix counts only when a gate fails without it or Claude has seen it on a fresh frozen build.
- Agents never commit; the foreman verifies and checkpoints (WIP checkpoint commits, to `claude/cults-wip`).
- **Fresh eyes at every milestone (Cory, 2026-10-14):** on a frozen build, three new blind reviewers in parallel (ui-critic, boardgame-enthusiast, engineer), each saved to `design/eval/<role>-round<N>.md`. Then one synthesis agent reads the three together (plus Cory's latest notes and the panel's "felt unfair or unfun") and writes `design/eval/meta-round<N>.md`: themes, agreements, root causes, one ranked list. Act on each report and on the meta list; the meta list sets priority. Verify single-reviewer claims before fixing.
- **Blind panels** before a verdict: three fresh testers (laptop newcomer, phone by touch, saboteur), each with only the URL and design/rulebook.md, each listing "felt unfair or unfun"; then `game-skeptic` as the final gate. Details in the `/v4-loop` skill.
- **Critics see only the screen, and are calibrated (Cory, 2026-10-15).** Every critic and tester drives the build through `scripts/v4-eyes.mjs` (screenshots, coordinates and timings; never the DOM, never their own Playwright), keeps speed settings at default, walks design/eval/critic-calibration/checklist.md at every screen state, and lists everything (40+) before any grade. **A new or changed critic brief is trusted only after it hits ≥80% recall on the latest answer key** (design/eval/critic-calibration/answer-key.md: Cory's own play notes, never shown to a tester), scored on the merged list of the panel we actually run; log each run in critic-calibration/results.md. Status 2026-10-15: brief v3 alone 72%, two fresh testers merged 82%, so a screen sweep is always **two fresh testers, lists merged**. Whenever Cory plays and finds what the critics missed, his notes become the next answer key and the briefs re-calibrate. Why: the RC1 panel drove the DOM at agent speed, wrote "top 8", and caught 2 of Cory's 24 ten-minute findings (critic-calibration/diagnosis.md). **Brief v4 (2026-10-15):** the v3 panels scored 39–44% on Cory's morning catches (critic-calibration/miss-matrix-2026-10-15.md), so speed is no longer fixed at default: every run does the speed ladder, hover-complete reads, an outcome ledger, eye distance, and plays an assigned table from brief.md's coverage table (A: non-Classic with purple and the stealing color; B: Classic). Testers get taste.md's "Cory's own calls" as `{HOUSE_STYLE}` (as of the commit under test). Timings above load 2 are re-measured, never dropped.
- `npm run sim:v4 -- 300 4` gives a quick bot-vs-bot balance read. It's a reading, not a design verdict; name the instrument (Easy/Normal/Hard bot, 4-thinker tables, AI tester) with every number.
- Act on the bench's pooled list (trend.md), never on one run's flags.
- **Blind reviewers can play on a quiet machine (2026-10-15):** a remote session checked out at a freeze branch serves its own production build and drives it with v4-eyes, reading only its agent brief and design/rulebook.md. Use it when the local box is above load ~8, so timings are real and the design pod keeps the CPUs. Remote sessions take a branch name, not a bare sha (a pushed sha that no branch points at fails with ref_not_found): push `claude/cults-freeze-<wave>` first.
- **Quiet remote machines** are sessions titled "Cults: <job> (<sha>)". Each measures, writes `design/eval/perf/quiet-*.md` to its own branch (e.g. `claude/cults-perf-final`), and opens no PR. The foreman reads the report and merges it.
- **This box has 4 CPUs, and a full gate overloads it** (load ~27 at peak). Its timing failures are often load: re-run a failing file alone once before calling it real. On 0c1cd51 all 6 gate failures were load flakes (design/eval/perf/quiet-final-0c1cd51.md). Throttle heavy sims here (at most 2 sim workers at once, nothing heavy while e2e gates run). Big sweeps (fair-price screen, bot levels, 4-thinker tables) and quiet-box verdicts or perf baselines (`create_session` with the FULL 40-char sha; a short sha fails with ref_not_found) go to remote sessions on their own machines, each on its own branch; the foreman reviews before merging, and design changes still go to Cory.
- **Motion work in parallel** (the intro, 2026-10-14): one lead owns a shared kit (`src/v4/intro/shared.jsx`: world, camera, timeline primitives) and a storyboard with each piece's start/end state; builders take one beat or moment each in its own file against that contract, preview it alone on a shared HMR dev server (`?lab=intro&beat=N`), and show it as a GIF (`node scripts/v4-gif.mjs <url> <out.gif> <ms>`); the lead integrates. Show Cory GIFs, not descriptions.
- **Usage limits kill agents mid-work** (four times on 2026-10-14). Keep `design/in-flight.md` current (who's running, their brief, their port) and arm a `send_later` check-in that resumes each paused agent with SendMessage, or relaunches it from its brief.
- **Check-in hygiene:** at most one check-in pending at a time; delete it when the work ends. Seven leftovers flooded Cory on 2026-10-15.

## Self-improvement
- **Retro at every milestone (Cory, 2026-10-15):** a fresh engineer audits the build system (gate wall time, slot waits, agent idle time, failed or stale processes, Cory's corrections) and lands fixes with before/after numbers in design/eval/harness-metrics.md. The expert engineer reviews the build system as well as the code.
- When Cory corrects how Claude works, fix the rule file in the same turn and add a changelog line. Don't wait to be asked.
- If the same kind of correction comes up twice, make it stronger: turn it into a hook, a skill, or a hard rule.
- At the end of a meaty session, add one line to the changelog with what to do differently.
- Keep these files short. When something gets stale, delete it rather than piling on.

## Built-in Claude Code pieces we use (don't reinvent)
- **Output style** (`.claude/output-styles/`, set as `outputStyle` in settings): reply tone and length. Takes effect from the next session.
- **Memory**: `CLAUDE.md` plus every file in `.claude/rules/` loads automatically each session. Cloud containers get wiped, so durable memory lives in repo files, not in auto memory.
- **Skills** (`.claude/skills/<name>/SKILL.md`): repeatable routines, e.g. `/note`.
- **Subagents** (`.claude/agents/*.md`). Run them in parallel and pass on only their conclusions; never show Cory agent output unvetted. Add more when a role keeps coming up.
  - `ui-critic`: blind, super-picky designer; plays laptop + phone through v4-eyes; walks every screen state against the checklist; lists 40+ tagged findings before a harsh grade; ends with a Vision section (what it COULD be).
  - `boardgame-enthusiast`: blind hobby gamer; judges the game itself (decisions, tension, arc, balance feel, fun), two full games.
  - `game-skeptic`: blind adversarial final grader; SHIP needs A- or better.
  - `design-critic`: read-only rules/mechanics expert; have it return text, then save it yourself. Every agent-designed sphere passes it before Cory sees it.
  - `playtester`, `ux-reviewer`: quick checks while iterating.
  - The engineering reviewer has no agent file: a fresh general agent with repo access and no prior context (design/eval/engineering-review.md is round 1).
  - Blind means: only a URL and the player rulebook, never the repo; new instances every time.
  - **Blind testers return their report as text**, because the harness blocks subagent writes of report files. The foreman saves it to design/eval/<wave>/<tester>/report.md, and the testers keep their notes and shots in their own folder.
- Time-box blind reviewers: about 30 minutes of play, then write up (Cory waited over an hour for round 2 on an overloaded box). Say the time box in the prompt.
  - Ask testers for "a move log with a short note on why", never "write your reasoning": that wording tripped the API's safeguards and killed a tester (2026-10-14).
- **Hooks** (`.claude/settings.json`): only for things that must happen no matter what. Session start installs deps; a safety hook blocks force-push, `rm -rf` and edits to secrets.
- **Workflows** (`.claude/workflows/*.js`, run by name): `quadrant-forge` is the evaluator team. It runs inventors, then per sphere a lint/value check, 2 lens judges, a mind-play tester holding a ledger, a red team and a synthesizer (revise up to twice or kill), then combo-table playtests and a meta-critic that proposes rubric changes. Edit it as the process evolves. Speed: this container has 4 CPUs, so each workflow runs only 2 agents at once. For throughput, run several workflows in parallel over slices (args: pool, from, to, stage:'forge'). Pass a light pool whose spec fields point to per-sphere files in design/eval/runs/<batch>/. A single agent can't echo back a 60KB pool.
- **/doctor**: audits rules, skills and agents for conflicts. Run it when the setup feels off.
- When unsure about a Claude Code feature, check the official docs (code.claude.com/docs) before building anything.
