# In flight — October 18, 12:30am Eastern (backlog thread wound down: Cory low on usage)

- Public: v0.6.2 (source f9a419f, main 15e674c). Pages run confirmed; github.io is unreachable from the cloud box, so the served stamp was read from main's play/build.json (scripts/v4-play.sh falls back to that now).
- Nothing running. All helpers stopped.
- Parked, unfinished (in /mnt/project-files/handoff/backlog-oct18/):
  - minion-press-027b323a.patch: minion on press + wheel spin on the compositor, re-ported onto the 2/3/4-sector wheel. Committed by a helper, NOT checked. Next: apply, quick check, measure on a quiet box.
  - wip-a7db8d30898397796.diff: seven measured price changes for Cory's "cheaper/pricier" notes (Heir 6+2→4+2, Revelers 4+2→3+1, Freelancer 2+2→3+3, Alchemist 5+3→4+2, Squatter 6+2→5+2, Lamplighter 10+2→6+2, Front-runner 2+0→4+0), with decisions lines and bot numbers. Tests NOT run. Next: apply, fix price-pinning tests only, quick check, ship.
- Backlog triage: design/backlog-triage-2026-10-17.md (every open item classed DONE / CLAUDE / CORY / IDEA / PHONE / DEAD, CLAUDE items in priority order). Cory's calls: design/todo.md top.

## Test-fix thread wind-down (2026-10-18, 8:40pm Eastern)
- Shipped v0.6.3 (source ebbe04f, main 2817380d): resumed game takes your first click at once; Redistribute says "from every rival". Quick check: unit + build pass, full game finishes; hotseat flags the 11.7px "back under the deck" note (type scale), seen on v0.6.0 too.
- Green and merged: e2e payflow and steal fixed for the intended rule changes; pay.mjs merged with the backlog thread's version (not re-run after merge).
- Held back: "pay sheet closes when you pay" (d26ad39a, reverted in ebbe04f). With it on v0.6.2 the full game's page jumped 32px between place and buy/choose. Re-apply only with a fix for the jump.
- Dropped unfinished (unpushed worktree branches, lost with this box): fixes for motion.mjs (run at ?speed=steady), info, members, layout; turnstory, turndock, travel, sound, benders. Causes noted in HANDOFF top section; redo from there.
- Open judgment call for Cory: small gift/color cards stay up until the move's animation lands (Oct 17 rule) — tests now expect that.
