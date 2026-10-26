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
- Freeze and screenshot: `node scripts/v4-peek.mjs freeze <n> [port]`, `node scripts/v4-peek.mjs shots <url> <dir>`. Testers see the game only through `scripts/v4-eyes.mjs`. Perf: `node scripts/v4-perf.mjs` (4x CPU). Playwright needs executablePath '/opt/pw-browsers/chromium' after `npm ci`.
- Sims (`npm run sim:v4 -- 300 4` and friends) only when Cory asks.
- Done = a fresh frozen build seen in a screenshot at about 1270x700, or a gate that proves it. Snappy: clicks and hovers answer in 100 ms measured as "card complete"; the wheel lands in 400 ms; motion 150-350 ms per beat.

## Shipping
Small screen or wording change, already committed: `bash scripts/v4-ship-ui.sh "<changelog line>" <changed files>` runs only their tests plus the build, bumps, pushes and publishes in about 2 minutes, printing each step's time. Then your own screenshot to Cory.
- Browser gates already red on live are listed in e2e/v4/known-red.json: the check prints KNOWN RED and doesn't count them, and says NOW GREEN when one passes. Add one only after seeing it fail on the live commit.
Pull `claude/gifted-newton-3lcy3i`, rebase (never force-push), push the fix the moment it passes the quick check, then `bash scripts/v4-play.sh <sha>` (builds that commit, commits play/, the rules page rules/ and the harness mirror to main, waits for Pages). https://cojamz.github.io/patrons/rules/ is design/rulebook.md plus the glossary, rendered by scripts/v4-rules-page.mjs on every ship; edit the rulebook, never rules/. Confirm the stamp, then tell Cory with the version, one plain line per change and a screenshot. Stay on v0.8.x. No new PRs; PR #1 is the line of v4 work.

## Parallel threads
One thread per job. Each owns its files, posts its status line, and messages the coordinator, not another thread, unless their work depends on each other. Before editing a shared doc: pull, edit, commit and push in one go, so the last write never silently wins.

## Lessons (newest last; one line each, with the fix)
- 2026-10-19: A single legal payment plan doesn't guarantee auto-confirm in browser purchase checks; confirm a visible pay sheet, keep exact ownership assertions.
- 2026-10-19: Dismiss the local handoff before settled screenshots, or overlays hide the wheel.
- 2026-10-20: New threads loaded main's v3 CLAUDE.md and v3 game rules for weeks, so every thread started wrong. Fix: main mirrors the harness, and bootstrap moves fresh clones onto the v4 branch.
- 2026-10-20: e2e/v4/layout.mjs is already red on the live build (follower-tile overflow, a 1100px setup wait), so running it on a CSS tweak cost ~10 min and proved nothing. Fix: CSS-only tweaks ship on the related unit tests plus Claude's own screenshot; layout.mjs needs repair before it's used as a gate.
- 2026-10-21: Detached sims (setsid nohup) died in two container restarts overnight, and a "remote" runner agent landed on this same box, where its `npm ci` in a worktree emptied the shared node_modules through a symlink. Fix: run sims as tracked background commands that commit each batch as it finishes (design/eval/member-sims/chain.sh skips finished ones); give worktrees their own `npm ci`, never a symlinked node_modules.
- 2026-10-21: A member-price ship ran only the changed color's card tests and left three other tests red (deck count, a pay warning built on Kingpin's old text, missing portraits for new cards) plus a stale sample game. Fix: any card-file ship runs `npm run check:v4:quick` without --related first; new members need a portrait (reuse a cut card's in a pinch) and `npm run records:refresh`.
- 2026-10-21: Pages skipped the deploy for main 2ee26a8 (v0.8.32): no workflow run started, so v4-play.sh timed out. Fix: check the Pages run list for main's sha; if none started, a new main commit re-triggers it (needs Cory's OK; the auto classifier blocks a bare re-trigger push).
- 2026-10-21: Three "remote" Agent runners for member sweeps landed on the calling box again, in the same working tree, and swapped HEAD under a running sweep. Fix: never use Agent isolation "remote" for sims; ask the coordinator for quiet-box runner threads (one per job, own box), and give each its own result branch.
- 2026-10-22: v4-play.sh died silently (exit 1, no message) when this clone's origin/main had diverged from main, so its plain fetch was refused as non-fast-forward. Fix: the script fetches main with a forced refspec. Also: the in-game log now logs any unexplained change itself (core.js accounted/settle); scripts/v4-log-audit.mjs and log-audit.test.js check it.
- 2026-10-22: Cory, mid-playtest: "we can't ship updates until over because it prevents players". A publish interrupts a live game. Fix: while Cory says a game is running, push to the branch only and publish when he says it's over.
- 2026-10-23: A space's words live in five places (rule, hover round lines, wheel panel, short faces, prompts and log) and Cory's mid-playtest changes moved only the rule, so panels kept old words (Sweet Talk's "others get 2", Help Yourself's bank follower). Fix: /review-text puts all five beside an engine probe and the wheel's real print.
- 2026-10-25: "+4 next round" on growing panels read as a promise to whoever takes the space (Cory, Oct 24), the second misread of that line in two days. Fix: /card-words drafts several wordings, runs each through a list of known misreads and checks it on the wheel before shipping; growing spaces now print their schedule (I +2 · II +3 · III +4).
- 2026-10-26: First weekly review found the shared corrections list empty after a week of ~17 corrections (its cue words missed lines like "you aren't doing a very good job keeping me updated"), and "what's my decision?" came twice. Fix: wider cues, repeats also checked against the rules changelog, and the message check bounces an update of 3+ lines that doesn't end with his decision, a question or "Nothing needed from you."
- 2026-10-26: All four blind testers were blocked: this box's network refuses cojamz.github.io, so the live URL never loads here. Fix: serve main's play/ and rules/ locally (`git archive origin/main play rules | tar -x -C <dir>/patrons`, then `python3 -m http.server <port>` in <dir>) and hand testers http://localhost:<port>/patrons/play/.
