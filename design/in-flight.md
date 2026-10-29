# In flight (updated 2026-10-29 10:50am Eastern, backlog tidy-up)

Live: v0.9.854 (main:play/build.json, source f17618b0). The list before this tidy-up: design/archive/in-flight-2026-10-28-to-29.md. Long-term goals live in design/todo.md under "Backlog initiatives".

Running now
- Card polish (thread "Polish member card design and icons"): Header look live, price circle smaller (v0.9.854). Asked Cory: top right shows the member bust and how many members a card counts as, and the four cards that score less than they count (Dabblers, Con Men, Ensemble, Revelers) say "Worth 1 follower." [yes].
- Portraits (thread "Improve all member images"): little scenes confirmed. Five scene styles at finer pixels (design/prototypes/art-v4/ROUND3.md, round3/a-e) being drawn with the same 4 members, then critic, then Cory picks one and every member is redrawn in it. In the redraw, Twins is now Triplets (worth 3, v0.9.855) and needs three people, and Extra Hand gets a fresh picture (Cory: "extra hand art looks real fucking weird"). Old art sources: design/prototypes/art-v3, renderer src/v4/art/portrait3.js.
- Balance round 2 (thread "Run balance tests and suggest 2.0 changes"): Cory answered the Oct 29 report. Logged: Accomplice 3, Tiebreaker 4, Impressionist and Greatest Hits stay; Last Call claim withdrawn. Shipping: Front-runner 2, Extra Hand 9, Agents "Your actions can't be copied", Crowd In +4 purple, Triplets worth 3. Next: whether bots handle skips and member swaps well.
- Expert AI games (thread "Play expert AI board game sessions"): AI players play full games and write them up as stories with table talk; game 6 posted in three parts. Their shared suspects: Last Call, Echo and Greatest Hits copying steals or Last Call; Allowance plus Exchange with Money Changer; Help Yourself with Fence on turn one. The overnight try in another thread was blocked by a safety filter and is closed.

Waiting on Cory (nothing built until he answers)
- Members page review: https://cojamz.github.io/patrons/play/members/ is a color explorer (pick a color, see its deck, artifact and spaces by round; #red etc. in the link). He reviews color by color with the deck rework.
- Table talk: keep or swap the 12 quick lines (Claude's fill-ins).
- Older numbered calls: design/notes/waiting-on-cory-2026-10-24.md, design/notes/rework-list-2026-10-28.md.

Parked
- Squatter on Greatest Hits ("players actions werent copied", v0.9.1 online): not reproduced; gated by cards-echo test and e2e/v4/squat-hits.mjs; reopens when a saved game shows it.
- Wheel in Firefox: smooth at full speed since v0.9.831. Left: one ~180 ms hitch the first time the rim's words flip in a game, and 100-130 ms frames as a spin starts on a slowed Firefox. Reopens if Cory says the wheel still drags.
- Gold, Silver, Yellow redesigns: paused by Cory; last before v1.0.

Closed Oct 29 with nothing owed: Cross-check balance findings (11 price changes signed off, shipped in v0.9.850), Run expert AI games overnight (blocked), Rework members and actions by priority (all calls live in v0.9.836), Decide member and guest balance (guests final at 15), Fix the game freezing mid-play (v0.9.831), Make the members page a color explorer (live), Show every member for review (live), Rework round I actions (v0.9.821).

Branches
- claude/gifted-newton-3lcy3i: the game (PR #1). main: the old game plus play/, rules/ and the harness mirror.
- Every other claude/* branch is an old thread workspace and stale; none are needed.
- Member wording pass (thread "Tighten member card wording", Oct 29): Coach and Bait live in v0.9.860. The other rows of /mnt/project-files/member-words/member-words.md wait for Cory's yes; the edited card files (before the Coach/Bait commit) are in /mnt/project-files/member-words/wording-files-pending/. Re-apply only the text strings on the current branch; Night Owl and Hot Streak are on hold for the extra-turn wording question.
