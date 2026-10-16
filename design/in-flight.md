# In flight

Updated 2026-10-15, afternoon. Agents never commit; the foreman verifies and checkpoints to `claude/cults-wip`. Each agent runs check:v4 on its own `V4_OUTDIR`/`V4_PORT`. If a thread dies, relaunch from its line below and tell it to read `git log` first. State of the project: `design/HANDOFF.md`. Done items are ticked in `design/todo.md`.

## Current Codex work (2026-10-15, Eastern)
- First v0.5 iteration implemented, being verified: approved Green rules, Late Bloomers, Toast, contest ties, Relaxed default, timing wording, brighter cards/buys, less seat clutter, end-game bonuses in the Reckoning and results without recounting. Existing design preserved.
- Three fix agents completed rule/UI batches; a fresh screen-only reviewer is inspecting a frozen build; UI agent is profiling hover/animation performance for the next small patch.
- Harness adapted from hardcoded Linux Chromium to platform-native browser; publishing now exports one checked commit, bounds polling and verifies the live build stamp/HTML. GitHub access confirmed. Native desktop capture declined; isolated game-browser verification works.
- Initial quick check found stale tests from prior rules plus a genuine hover intercept bug. Fixtures corrected to explicit intended tables and shuffled setup order; informational mouse hovers no longer intercept clicks. Re-run on committed snapshot before publishing.
- No deployment yet. Root owns integration, release and current docs. Next: publish first checked batch, then measured hover/animation performance fixes. Unconfirmed design ideas remain open.

## 2026-10-16 (10:40pm Eastern, Oct 15): Cory's v0.5 play notes, logged only
- Nothing built. Everything is in design/todo.md, top section "Cory's play notes, 2026-10-16"; his clear calls in decisions.md (2026-10-16); catches 48–53 in the answer key.
- Next thread: build his calls (Late Bloomers, Relaxed default, "on recruit"/"at round start", Reprise, Greatest Hits/Encore/copy-previous, no contest tiebreakers, Toast 1/2/3, end-game bonuses in the round-end animation), then the open calls once he answers (follower buys 1/5/10 vs 2/5/10, end-game tiebreaker, member release).
- Nothing running. No check-ins pending.

- **Speed thread** (`claude/project-thread-z7shxv`): stopped at Cory's usage limit. Shipped to the play link at df5eac1: hover delay + whole-on-open, pixel art as paths (7,124 → 1,532 nodes), bot steps as transitions. Open items and the unshipped diffs: design/todo.md "Speed, open". Shared lock for timing runs: /tmp/v4-heavy.lock (builds and correctness checks at nice 19, no lock).

## End of 2026-10-15 (8:25pm Eastern): stopped at Cory's usage limit
- **One line ships everything.** `claude/gifted-newton-3lcy3i` at 8e47530+ is the one branch. Every thread pulls it, pushes its own quick-green work (build + `e2e/v4/hotseat.mjs` on the bundle), then runs `bash scripts/v4-play.sh` to refresh the play link (https://cojamz.github.io/patrons/play/, the play/ folder on main). Live build: bc019a2.
- **Stopped unfinished (relaunch from these briefs):**
  - *Strip room:* the taller seats (MEMBERS count, two figure rows) squeeze the "since your last turn" strip at 1270×700; turnstory t2/t2b fail. Fix without hiding members (one figure row until two are needed, or a tighter header).
  - *Unit suite to the new rules:* rules.test (written for 4 spheres; spheres = players now gives 2 at 2 seats: pass the 4-sphere table), full-board Late Riser (Overtime is gone), night-owl round I (no extra minions in round I), format.test (Kickback, Squatter), boardpick-reach ("+N" fold is gone during a member pick), records.test (refresh).
  - *Stale e2e save:* pay.mjs "dialog-save: never reached P1 on cheap" since the new Cheap Seats.
- Nothing else running. No check-ins pending.

## Earlier (2026-10-15, afternoon)
- **Cory's morning notes, in code** (one thread): hover lag ("card complete" gate), Pass as "Done, no buy" in the shop column, remove the turn-order rail ("next" / "your turn in 3" on the seats), smaller upright wheel emojis, the gift card beside the space, animation pace (Relaxed about 2× Steady, Steady a little slower). Brief: HANDOFF.md section 5.
- **Doc refresh** (this thread): HANDOFF, in-flight and the other docs on this morning's list brought up to today. Docs only, no game code.
- **Tester and design pod upgrade** (thread on `claude/project-thread-rwmsop`): done. Panel v4 calibrated at 82% (90% on Cory's morning catches) on the wave-2 replay; handed to the fix thread for its A− loop. Why the old panel missed: `design/eval/critic-calibration/miss-matrix-2026-10-15.md`.
- **Action theater and motion** (thread on `claude/project-thread-qyxov5`): the action stage at the wheel hub (space card + members fly out and give from there), the Reckoning scoreboard with the winner cheering, the whose-turn fidget, member swaps stopping on the stage, pace 15% slower. Slice 1 at 6fb2622 handed to the fix thread to merge. Next: pixel members told apart (skin and hair per member, picture sent to Cory, waiting on his yes), then scoring waits for open dialogs.
- Nothing else is running. No remote sessions are working.
- No scheduled check-ins pending. The new session found none, so the seven leftovers from the overnight session appear to be gone.

## Next
- Get the current build live (the preview is stale; Cloudflare Pages move if Cory says yes), and confirm its version stamp before any link.
- Purple and Catch Up once Cory answers; the morning note's calls 1–10.
- The 4× CPU regression on 0c1cd51 (`design/eval/perf/quiet-final-0c1cd51.md` on `claude/cults-perf-final`).
- A fresh blind panel (two testers merged + game-skeptic) on quiet remote machines, graded to A−.

## History (short)
- 2026-10-14: about 30 workstreams (UI, multiplayer, hardening, spheres, intro, names, balance, release candidate 1). All done or folded into later work.
- Overnight into 2026-10-15: four waves. Frozen builds w2 (8f93858), w3 (44e22bd), w4 (8ea3e24), final 0c1cd51 on `claude/cults-final`. Design pod, perf, motion, members UX, words, steal and dialogs pods all finished. Quiet remote verdicts on each freeze (`claude/cults-perf-w3`, `-w4`, `-final`). Bench proposed balance pass 3 (not applied, call 9).
- Overnight lessons: checkpoint pushes to the PR branch likely burned the preview's deploy credits; a gate on this box overloads it; nobody read the final quiet verdict before the thread ended.
- The full old roster with briefs and ports is in git history (`git show 8afc4dd:design/in-flight.md`).
