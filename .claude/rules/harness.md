# The harness

How Claude (and Codex, through AGENTS.md) works on Cults. Claude owns this file: when something works better, change it here and add a line to design/lessons/harness.md with the fix. History before Oct 20: design/archive/harness-history-to-2026-10-20.md.

## What runs by itself, and where
Cory works in project chat threads. **There, none of the hooks below run, and skills and the output style don't load** (checked Oct 31). Only CLAUDE.md and the .claude/rules files without a `paths:` line load, from the branch the thread starts on (main's mirror), once, at start. So in a chat thread:
- First command: `bash .claude/hooks/start.sh` (moves to the game's branch, installs, prints where things stand).
- Before every message to Cory: `node .claude/hooks/presend.mjs` (voice check, card text check, new rules from other threads). It exits 1 when the message isn't ready.
- Skills: read `.claude/skills/<name>/SKILL.md` by path.
- New rules reach running threads through /mnt/project-files/harness/rules-live.md (presend prints new lines) and the coordinator relaying them. A rule change edits the rule file, appends one line to rules-live.md, runs `bash scripts/harness-sync-main.sh`, and messages the coordinator.
The hooks still run in terminal and web sessions, and keep the same checks:
New cloud threads clone `main`, so main carries a mirror of the harness (CLAUDE.md, AGENTS.md, .claude/). `scripts/v4-play.sh` re-mirrors it on every ship; after a harness-only change run `bash scripts/harness-sync-main.sh`.
- SessionStart (`hooks/bootstrap.sh`): a fresh clone moves to `claude/gifted-newton-3lcy3i`, deps install, and `hooks/orient.mjs` prints live version vs branch, the thread board, the current HANDOFF section and the last decisions. After compaction it prints again.
- PreToolUse: `hooks/protect.sh` blocks force-push, `rm -rf`, `reset --hard`, secrets and lockfile edits. `hooks/message-check.mjs` bounces messages to Cory that break the voice rules (length bounces once; resending the same text passes).
- UserPromptSubmit (`hooks/corrections.mjs`): spots Cory correcting how we work, queues the quote in /mnt/project-files/harness/corrections.jsonl (shared by every thread), and flags a repeat of an earlier correction: a repeat must become a check that turn.
- Stop (`hooks/stop-check.mjs`): before a turn ends, asks once for any of: logging a long note of Cory's, a lesson after code work, committing doc/harness edits, posting or refreshing this thread's status line.
- Rules load by need: design-principles.md only when touching engine code or design docs, screen.md (points at taste.md) only when touching screen code.
- PreCompact: refreshes the status line's git fields.
- Weekly review (scheduled, Mondays 8:34am Eastern, in the harness thread): reads the week's corrections, lessons, slow checks and the board, and sends Cory up to 3 numbered changes to how we work. Cory said yes Oct 21.

## Where things go
- Thread status, live: `node scripts/status.mjs set --thread "<title>" --state working|waiting|blocked|done --doing … --next … --eta … [--cory "what he owes"]`. Files in /mnt/project-files/status/ (board.md, board.html; the board on the project tab renders from board.md). Elsewhere: .status/.
- Design calls: design/decisions.md (append, date + one line + why; it wins over code and docs). Pitches and his verdicts: design/pitch-ledger.md. How the game plays and wins: design/strategy.md. Taste and visual calls: design/taste.md.
- State for a fresh thread: design/HANDOFF.md (one current state, no stacked sections), design/in-flight.md (what's running, owner, next step), design/todo.md (one ordered list). Release steps: design/releasing.md. Player changelog: CHANGELOG.md.
- Evidence and reviews: design/eval/<topic>/. Screenshots for Cory: /mnt/project-files/<topic>/ and attach them. Plans and write-ups: design/notes/ or a file linked from chat, never pasted.
- Lessons, by topic: design/lessons/ (README has the format). Skills read the matching file before planning.
- The harness plan and its sources: /mnt/project-files/harness/plan.md.
- Anything superseded moves to design/archive/, never stacked under a "current" heading.

## ChatGPT and Codex
Codex reads AGENTS.md (pointer to these rules) and the skills through `.agents/skills`. ChatGPT chat reads nothing on its own: design/chatgpt-project-instructions.md is the block Cory pastes into its Project once; it ends answers with "To log" lines that any thread commits when Cory pastes them. When pasted "To log" lines arrive, commit them as given.
- Card gate (`hooks/card-gate.mjs`): the first edit to a card file in a thread asks whether it's Cory's logged call or a bug fix; retrying goes through.

## Skills (.claude/skills)
`/note` (Cory's voice notes) · `/brainstorm` (any design pitch) · `/rework-color` (a color's actions, Cory's loop) · `/rework-members` (concepts strong to weak with counters, then sim prices; design/member-process.md) · `/ship-batch` (version, changelog, publish, stamp, go-live note) · `/v4-loop` (build, check, look) · `/eval-quadrant` (judge a color on paper without games) · `/card-words` (finding the words for a member or space, and for its panel, hover and faces, so a table reads it right the first time) · `/review-text` (every space's words beside what the game does and what the wheel prints; after any text change or when Cory says text seems off).

## Agents (.claude/agents)
Read-only critics return text; the foreman saves it. `strategist` grounds brainstorms and keeps its own memory (.claude/agent-memory/strategist/). `design-critic` pressure-tests a mechanic. Blind testers (`ui-critic`, `boardgame-enthusiast`, `game-skeptic`, `playtester`) get only the URL and design/rulebook.md, are fresh every time, and run only when Cory asks for a panel. `art-director` and `detail-designer` are the design pod while the UI is changing. Never pass agent output to Cory unvetted, and an agent's report is never proof.

## Checks
- CI on PR #1 is the game's own checks. The red Netlify check is a retired host failing on its side: ignore it, never report it to Cory as CI, never ask him to act on it (Cory, Oct 20).
- Iterate: `npm run check:v4:quick -- --related <files>` (~2 min; `V4_QUICK_E2E=none|<file>.mjs` skips the hot-seat game). Name explicit test files for shared engine changes; `--related` can balloon to 69 files.
- Verdict: `npm run check:v4 -- --commit <sha>` on a committed snapshot, never the live tree. Each agent sets `V4_OUTDIR=.v4-build-<name>` and `V4_PORT` (5281+).
- The box has 4 CPUs; a full gate overloads it and timing failures are often load. Re-run a failure alone once before calling it real.
- Firefox (Cory plays Firefox on a Mac; every gate was Chrome-only until Oct 28): `npm run check:v4 -- --firefox` runs the browser gates in Firefox, `V4_ENGINE=firefox` any single gate or probe. Gates that need CDP (CPU throttle, heap) are named and skipped unless they fall back on `cdpOk` (e2e/v4/lib/browser.mjs). Bootstrap installs Firefox from /mnt/project-files/harness/browsers/. Any screen, motion or perf change runs its gates in both browsers.
- Freezes are the lag bar (Cory, Oct 28: "the page feels frozen often and you can't click"): `node scripts/v4-freeze.mjs <url> <label>` presses a key every 250 ms through a whole game and exits 1 when the worst press waits over 250 ms, more than 1% wait over 100 ms, or a click on a settled table is ignored. Run it in Chrome at 4x and in Firefox before and after every perf fix. Click p95 alone never proves a lag fix.
- Stalls: every stage of check:v4 has a time limit (e2e: 5x its usual time, at least 6 min); past it the stage is killed and reported STALLED. Screenshot the stuck step, then fix it or list it in known-red.json and ship.
- Perf rig (Cory, Oct 28: "engineering pod needs to get robust harness"): `node scripts/v4-rig.mjs <frozen url> <label>` plays a full game as a person plus 3 Normal bots at 4x CPU and Relaxed, and reports per round clicks and hovers (to the answer painted), show frames per animation, idle-table cost, elements, listeners and heap, plus a reload on the last turn as the leak control. Exit 1 when a bar fails (bars at the top of the script: 100 ms clicks and hovers, 33 ms frames, 5% hitches, 10% idle, no growth over 1.5x round to round, unbroken within 10% of a reload). Chrome only (CDP). Every perf fix runs it before and after, with `--no-frame-loop` for any change to frames, timers or idle work; reports in design/eval/perf/rig-<label>.md. One run can't tell builds apart (a single slow choose moves a round's p95 by seconds): compare builds with `node scripts/v4-rig-spread.mjs <url> <label> --runs=3 --parallel=2`, same --parallel for both, which reports median and range and fails if the runs played different games (the rig acts only on a settled table, so one seed is one game). `scripts/v4-frames.mjs` is the narrower probe (bots only; --phases=idle for idle cost and heap snapshots).
- Freeze and screenshot: `node scripts/v4-peek.mjs freeze <n> [port]`, `node scripts/v4-peek.mjs shots <url> <dir>`. Testers see the game only through `scripts/v4-eyes.mjs`. Perf: `node scripts/v4-perf.mjs` (4x CPU). Playwright needs executablePath '/opt/pw-browsers/chromium' after `npm ci`.
- Sims (`npm run sim:v4 -- 300 4` and friends) only when Cory asks.
- Done = a fresh frozen build seen in a screenshot at about 1270x700, or a gate that proves it. Snappy: clicks and hovers answer in 100 ms measured as "card complete"; the wheel lands in 400 ms; motion 150-350 ms per beat.

## Shipping
Small screen or wording change, already committed: `bash scripts/v4-ship-ui.sh "<changelog line>" <changed files>` runs only their tests plus the build, bumps, pushes and publishes in about 2 minutes, printing each step's time. Then your own screenshot to Cory.
- Browser gates already red on live are listed in e2e/v4/known-red.json: the check prints KNOWN RED and doesn't count them, and says NOW GREEN when one passes. Add one only after seeing it fail on the live commit.
Pull `claude/gifted-newton-3lcy3i`, rebase (never force-push), push the fix the moment it passes the quick check, then `bash scripts/v4-play.sh <sha>` (builds that commit, commits play/, the rules page rules/ and the harness mirror to main, waits for Pages). https://cojamz.github.io/patrons/rules/ is design/rulebook.md plus the glossary, rendered by scripts/v4-rules-page.mjs on every ship; edit the rulebook, never rules/. https://cojamz.github.io/patrons/play/members/ is every member's in-game card by color (src/v4/lab/MembersPage.jsx, from the card files; also ?lab=members on any build), written by v4-play.sh on every ship. Confirm the stamp, then tell Cory with the version, one plain line per change and a screenshot. Stay on v0.8.x until the round I rework ships as v0.9; all colors at 2.0 is v1.0 (Cory, Oct 26). No new PRs; PR #1 is the line of v4 work.

## Parallel threads
One thread per job. Each owns its files, posts its status line, and messages the coordinator, not another thread, unless their work depends on each other. Before editing a shared doc: pull, edit, commit and push in one go, so the last write never silently wins.

## Lessons
In design/lessons/harness.md (one line each, with the fix). Add new ones there, not here.
