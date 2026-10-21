---
name: ship-batch
description: Ship checked work live to the play link (version bump, changelog, publish, stamp check, go-live note with screenshot). Use whenever a fix or batch has passed its quick check and should reach Cory.
---

# Ship a batch

1. Pull and rebase on `claude/gifted-newton-3lcy3i` (never force-push). Group 5–10 related backlog items when there are several; a single fix ships alone.
2. `npm run version:v4 -- patch "<plain summary>"` (stay on v0.8.x). Fill the new CHANGELOG.md section with one plain player-facing line per change.
3. Commit, then `npm run check:v4:quick -- --related <files>` on the change. The verdict for a big batch is `npm run check:v4 -- --commit <sha>`.
4. Push, then `bash scripts/v4-play.sh <sha>`. It builds that commit, commits play/ and the harness mirror to main, and waits for Pages. If it says the stamp was verified, it's live.
5. Screenshot the changed thing on the live or frozen build at about 1270x700, save it under /mnt/project-files/<topic>/.
6. Tell Cory in three lines or fewer: the version, one plain line per change (or the top two and "and 4 smaller fixes"), and attach the screenshot.
7. Update design/HANDOFF.md's current section (version, sha, what's next), tick todo.md, set your status line, commit and push.
