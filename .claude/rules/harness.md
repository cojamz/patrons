# The harness

How Claude (and Codex, through AGENTS.md) works on Cults. Claude owns this file: when something works better, change it here and add a line to "Lessons" with the fix. History before Oct 20: design/archive/harness-history-to-2026-10-20.md.

## What runs by itself (.claude/settings.json)
New cloud threads clone `main`, so main carries a mirror of the harness (CLAUDE.md, AGENTS.md, .claude/). `scripts/v4-play.sh` re-mirrors it on every ship; after a harness-only change run `bash scripts/harness-sync-main.sh`.
- SessionStart (`hooks/bootstrap.sh`): a fresh clone moves to `claude/gifted-newton-3lcy3i`, deps install, and `hooks/orient.mjs` prints live version vs branch, the thread board, the current HANDOFF section and the last decisions. After compaction it prints again.
- PreToolUse: `hooks/protect.sh` blocks force-push, `rm -rf`, `reset --hard`, secrets and lockfile edits. `hooks/message-check.mjs` bounces messages to Cory that break the voice rules (length bounces once; resending the same text passes).
- UserPromptSubmit (`hooks/corrections.mjs`): spots Cory correcting how we work, queues the quote in /mnt/project-files/harness/corrections.jsonl (shared by every thread), and flags a repeat of an earlier correction: a repeat must become a check that turn.
- Stop (`hooks/stop-check.mjs`): before a turn ends, asks once for any of: logging a long note of Cory's, a lesson after code work, committing doc/harness edits, posting or refreshing this thread's status line.
- Rules load by need: design-principles.md only when touching engine code or design docs, screen.md (points at taste.md) only when touching screen code.
- PreCompact: refreshes the status line's git fields.

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
`/note` (Cory's voice notes) · `/brainstorm` (any design pitch) · `/rework-color` (a color's actions or members, Cory's loop) · `/ship-batch` (version, changelog, publish, stamp, go-live note) · `/v4-loop` (build, check, look) · `/eval-quadrant` (judge a color on paper without games).

## Agents (.claude/agents)
Read-only critics return text; the foreman saves it. `strategist` grounds brainstorms and keeps its own memory (.claude/agent-memory/strategist/). `design-critic` pressure-tests a mechanic. Blind testers (`ui-critic`, `boardgame-enthusiast`, `game-skeptic`, `playtester`) get only the URL and design/rulebook.md, are fresh every time, and run only when Cory asks for a panel. `art-director` and `detail-designer` are the design pod while the UI is changing. Never pass agent output to Cory unvetted, and an agent's report is never proof.

## Checks
- CI on PR #1 is the game's own checks. The red Netlify check is a retired host failing on its side: ignore it, never report it to Cory as CI, never ask him to act on it (Cory, Oct 20).
- Iterate: `npm run check:v4:quick -- --related <files>` (~2 min; `V4_QUICK_E2E=none|<file>.mjs` skips the hot-seat game). Name explicit test files for shared engine changes; `--related` can balloon to 69 files.
- Verdict: `npm run check:v4 -- --commit <sha>` on a committed snapshot, never the live tree. Each agent sets `V4_OUTDIR=.v4-build-<name>` and `V4_PORT` (5281+).
- The box has 4 CPUs; a full gate overloads it and timing failures are often load. Re-run a failure alone once before calling it real.
- Freeze and screenshot: `node scripts/v4-peek.mjs freeze <n> [port]`, `node scripts/v4-peek.mjs shots <url> <dir>`. Testers see the game only through `scripts/v4-eyes.mjs`. Perf: `node scripts/v4-perf.mjs` (4x CPU). Playwright needs executablePath '/opt/pw-browsers/chromium' after `npm ci`.
- Sims (`npm run sim:v4 -- 300 4` and friends) only when Cory asks.
- Done = a fresh frozen build seen in a screenshot at about 1270x700, or a gate that proves it. Snappy: clicks and hovers answer in 100 ms measured as "card complete"; the wheel lands in 400 ms; motion 150-350 ms per beat.

## Shipping
Pull `claude/gifted-newton-3lcy3i`, rebase (never force-push), push the fix the moment it passes the quick check, then `bash scripts/v4-play.sh <sha>` (builds that commit, commits play/ and the harness mirror to main, waits for Pages). Confirm the stamp, then tell Cory with the version, one plain line per change and a screenshot. Stay on v0.8.x. No new PRs; PR #1 is the line of v4 work.

## Parallel threads
One thread per job. Each owns its files, posts its status line, and messages the coordinator, not another thread, unless their work depends on each other. Before editing a shared doc: pull, edit, commit and push in one go, so the last write never silently wins.

## Lessons (newest last; one line each, with the fix)
- 2026-10-19: A single legal payment plan doesn't guarantee auto-confirm in browser purchase checks; confirm a visible pay sheet, keep exact ownership assertions.
- 2026-10-19: Dismiss the local handoff before settled screenshots, or overlays hide the wheel.
- 2026-10-20: New threads loaded main's v3 CLAUDE.md and v3 game rules for weeks, so every thread started wrong. Fix: main mirrors the harness, and bootstrap moves fresh clones onto the v4 branch.
- 2026-10-20: e2e/v4/layout.mjs is already red on the live build (follower-tile overflow, a 1100px setup wait), so running it on a CSS tweak cost ~10 min and proved nothing. Fix: CSS-only tweaks ship on the related unit tests plus Claude's own screenshot; layout.mjs needs repair before it's used as a gate.
