# Docs refresh, 2026-10-15 (commit e2ef62b on claude/project-thread-9gnl9s)

- design/HANDOFF.md: rewritten for today and about 40% shorter. It covers the game as built (checked against the code), the harness, the stale preview, the A− bar, the quiet-machine numbers, your seven notes with a plan for each, and what's waiting on you.
- design/in-flight.md: "Now" lists the code fixes running and this refresh, with no check-ins pending; the overnight history is down to four lines.
- design/todo.md: this morning's list is on top in order, then the 4× slowdown, hosting and the A− panel. Items are ticked only where code or a gate proves them, and the design pod's leftovers are merged in worst first.
- design/decisions.md: this morning's calls are logged and dated. The A− bar and "no board action should require spending" are yours; every proposal of mine is marked pending you.
- design/eval/critic-calibration/answer-key.md: your nine notes from this morning are now items 38–46. Testers' recall against them isn't measured yet.
- design/morning-note.md: kept as the record and marked superseded once you answer calls 1–10. The 9.5 s turn wait is replaced by 12.0 s at 4× CPU, and the link line now says the preview was stale.
- design/taste.md: six of your calls added, covering choices beside the space, no charge to use a space, Pass by the buy, small upright emojis, Relaxed clearly slow, and hovers opening complete.
- .claude/rules/working-with-cory.md: new rules, plus today's changelog. Nothing reaches you below A−, I check the preview's stamp before sending a link, your catches become gates, a new way of choosing is shown as a picture first, and only one check-in is pending at a time.
- .claude/rules/harness.md: checkpoints go to cults-wip and only gate-green builds go to the PR branch, so the preview stops burning credits. The Cloudflare move is pending, and load flakes are re-run alone.
- .claude/rules/design-principles.md: "No simulator until the rules settle" is replaced by "price by measurement and name the bot", plus your no-spending rule.
- .claude/output-styles/foreman.md: when blocked, say what's blocking and the one thing you can do. Decisions come as a numbered list with my default in brackets.
- CLAUDE.md: the branch map now has cults-wip, cults-final, the freeze branches and the deploy rule. The read-first list adds taste.md and the voice guide.

Not done: main's CLAUDE.md still describes v3. It is replaced when PR #1 merges, so I left main alone.
