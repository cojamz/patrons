# In flight

Updated 2026-10-16, Eastern. Current assignments and release evidence are below; older sections are historical. Source branch: `claude/gifted-newton-3lcy3i`. Codex coordinates agents, integrates, checks and publishes. State of the project: `design/HANDOFF.md`.

## Current Codex work (2026-10-16, Eastern)
- Verified live source `eecddbae08ebd4e747eaec053d7c630f2846e683`, main/play `be2c240`; public root redirects correctly. Exact manifest/HTML and real public browser load verified.
- Shipped: bright shop/target outline and spacing, deck gallery by color/price, Cost/Color toggle, readable free-member cards, precise wheel wording/formulas, visible Release entry, snake/ring guidance, Undo-retake correction, compositor wheel motion and smoother scoring effects.
- Checks: full base suite 1,174 passed / 1 skipped, build and full game; wording follow-up 286 related checks plus build/full game. Public deck selection, Escape and focus return pass with zero resource/runtime errors. Laptop/phone gallery screenshots inspected.
- Performance: quiet normal/4× profile clean (worst frame 17.7ms), frozen interaction gate passed. **Open:** first laptop spin had a 450ms cold stall before a smooth retry. Suspect uncached panel layout; trace before fixing. Do not call performance finished.
- Phone touch setup, placement and purchase pass publicly at 390/412px (emulation).
- Performance, wording and verification agents finished. No scheduled check-ins. Codex owns release records and project board checkpoint refreshes.
- Original 59-item feedback audit remains the scope record. Board data: `design/project-status.json`; generator: `scripts/v4-status-board.mjs`.
- Next: cold first-spin fix, opponents’ engine/points clarity, member wording, first-play comprehension, then open balance/design items. “Precise and minimal” is the language standard.
- Historical sections below are context, not current assignments or deployment instructions.

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
- Trace the cold first-spin layout hitch, cache repeated geometry if confirmed, and require first-spin performance independently of retries.
- Opponent-engine/points clarity and endgame polish; remaining member-language compression; newcomer ring/snake comprehension.
- Then the explicitly open balance/replacement designs in the audit. Preserve the current design; no blanket redesign or claim the whole feedback list is done.

## History (short)
- 2026-10-14: about 30 workstreams (UI, multiplayer, hardening, spheres, intro, names, balance, release candidate 1). All done or folded into later work.
- Overnight into 2026-10-15: four waves. Frozen builds w2 (8f93858), w3 (44e22bd), w4 (8ea3e24), final 0c1cd51 on `claude/cults-final`. Design pod, perf, motion, members UX, words, steal and dialogs pods all finished. Quiet remote verdicts on each freeze (`claude/cults-perf-w3`, `-w4`, `-final`). Bench proposed balance pass 3 (not applied, call 9).
- Overnight lessons: checkpoint pushes to the PR branch likely burned the preview's deploy credits; a gate on this box overloads it; nobody read the final quiet verdict before the thread ended.
- The full old roster with briefs and ports is in git history (`git show 8afc4dd:design/in-flight.md`).
