# Lessons: harness (see README.md for the format)

- 2026-10-20 · New threads cloned main and loaded the old game's rules for weeks · a fresh thread's starting files must be the current ones · main mirrors the harness (scripts/harness-sync-main.sh, run by v4-play.sh); bootstrap moves fresh clones to the work branch
- 2026-10-20 · Cory read the first harness pass as minor iterations; research had been two quick reads · a harness change starts with real outside research and says what was considered and dropped · /mnt/project-files/harness/plan.md
- 2026-10-20 · Claude told Cory about the Netlify check three times · infrastructure that can't affect him is never reported · message check bounces it; orientation says so
- 2026-10-20 · "v3"/"v4" meant nothing to Cory · internal labels never reach him · message check bounces them
- 2026-10-20 · Cory called the harness report "total gibberish": numbered moves, file names and mechanisms · tell him what changes for him in everyday words; mechanisms only if he asks · working-with-cory.md "Talking to him"
- 2026-10-26 · The corrections catcher logged nothing all week while ~17 corrections were folded into the rules by hand · test a catcher against the week's real quotes, and count the rules changelog as past corrections
- 2026-10-28 · Rigs, gates and probes were Chrome-only; Cory plays Firefox, and the freeze he feels never showed · measure in the browser the player uses · Firefox in check:v4 --firefox, V4_ENGINE, bootstrap install
- 2026-10-28 · Docs drifted four days behind live (HANDOFF said v0.8.62 at v0.9.8) · the orientation hook warns when HANDOFF or in-flight doesn't name the live version · .claude/hooks/orient.mjs
- 2026-10-28 · Pod work waited on Cory for engineering calls, a repeat of Oct 21 · the message check bounces engineering questions to him · .claude/hooks/message-check.mjs
- 2026-10-29: e2e/v4/peek.mjs starting its own vite hung twice here (>6 min, no output), while the same gate against a vite started by hand passed in about a minute. Fix for now: start vite yourself and pass V4_URL=http://localhost:<port>.
- 2026-10-29: e2e/v4/peek.mjs starting its own vite hung twice here (>6 min, no output), while the same gate against a vite started by hand passed in about a minute. Fix for now: start vite yourself and pass V4_URL=http://localhost:<port>.
