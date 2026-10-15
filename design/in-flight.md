# In flight

Updated 2026-10-15, afternoon. Agents never commit; the foreman verifies and checkpoints to `claude/cults-wip`. Each agent runs check:v4 on its own `V4_OUTDIR`/`V4_PORT`. If a thread dies, relaunch from its line below and tell it to read `git log` first. State of the project: `design/HANDOFF.md`. Done items are ticked in `design/todo.md`.

## Now (2026-10-15, afternoon)
- **Cory's morning notes, in code** (one thread): hover lag ("card complete" gate), Pass as "Done, no buy" in the shop column, remove the turn-order rail ("next" / "your turn in 3" on the seats), smaller upright wheel emojis, the gift card beside the space, animation pace (Relaxed about 2× Steady, Steady a little slower). Brief: HANDOFF.md section 5.
- **Doc refresh** (this thread): HANDOFF, in-flight and the other docs on this morning's list brought up to today. Docs only, no game code.
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
