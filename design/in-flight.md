# Active Green batch — v0.7.0 candidate

- Engine lane: green_engine, serialized fresh-choice copy chains and twelve-member deck.
- Pressure lane: green_pressure_tests, chain/recruit/save/member regressions and obsolete Green contracts.
- UI lane: green_ui, deck cull, copy targeting, concise summaries, glossary and artwork mappings.
- Root: integration, independent review, browser nested-copy/reload checks, version/changelog/docs and immutable deployment.
- Last known public: v0.6.5. Candidate is NOT LIVE until exact source stamp and desktop/phone checks are verified.
- Scope: design/spheres/green-redesign-2026-10-18.md. No unrelated backlog completion claim.

# In flight — October 18, 12:30am Eastern (backlog thread wound down: Cory low on usage)

## Top-10 thread, wound down 9:45pm Eastern, Oct 17 (Cory out of credits)
- Shipped v0.6.4: the seven price nudges. Shipped v0.6.5: idle animations stop while a move plays (lamp-b.css, keyed on .app.game[data-chain]). Proof: 4× CPU CDP trace over 25s of play, main-thread work 19.3s → 5.9s, long tasks 64 → 22.
- Known red: pacing.test (a rival's turn is ~0.4s over its cap since the prices). It's on todo.md; trim the pace, never the cap.
- Everything else Cory decided tonight is unbuilt and listed under "Build queue from his answers" in todo.md, with his calls in decisions.md.
- Tooling: `V4_QUICK_E2E=none|file.mjs` makes check:v4:quick skip its full hot-seat game (Cory: test only what changed). After `npm ci`, Playwright's bundled headless shell is missing; scripts must pass executablePath '/opt/pw-browsers/chromium' (the e2e scripts already do).

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
