# Releasing Cults

Current rules (Oct 28). The old v0.8.x lock and its history: design/archive/releasing-to-2026-10-28.md.

1. Versions (Cory, Oct 28): a small publish is a sub-step: v0.9.8, then v0.9.801, v0.9.802… (`npm run version:v4 -- patch "<player-facing line>"`, which v4-ship-ui.sh runs). `point` moves to the next whole step (v0.9.9) only for a release worth naming; `minor` is the next series. All colors at 2.0 is v1.0. VERSION in src/v4/version.js is the player's version; saves and rooms match on the rules-content hash, never on it.
2. CHANGELOG.md is player-facing: one plain line per change, in game words.
3. Check the exact commit: `npm run check:v4:quick` (or `bash scripts/v4-ship-ui.sh` for a small screen or wording change), the full `npm run check:v4 -- --commit <sha>` for a release worth naming. Screen, motion and perf changes also run their gates in Firefox (`-- --firefox`). A check that hangs is stopped and reported STALLED: screenshot the stuck step, fix or list it as known red, and ship; one stuck check never holds a release overnight.
4. Publish `bash scripts/v4-play.sh <sha>`: builds that commit, refuses a reused version number, keeps the last 3 releases for rejoins, commits play/, rules/ and the harness mirror to main, and waits for Pages. If no Pages run starts for main's sha, a new main commit re-triggers it.
5. Confirm the stamp (main's play/build.json), look at the game yourself, then tell Cory: the version, one plain line per change, a screenshot.
6. While Cory says a game is running, push to the branch only and publish when he says it's over.
7. Update HANDOFF.md's Live line and in-flight.md in the same turn (the orientation hook warns when they don't name the live version).
