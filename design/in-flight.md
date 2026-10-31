# In flight (updated 2026-10-29 10:50am Eastern, backlog tidy-up)

Live: v0.9.854 (main:play/build.json, source f17618b0). The list before this tidy-up: design/archive/in-flight-2026-10-28-to-29.md. Long-term goals live in design/todo.md under "Backlog initiatives".

Running now
- Card polish (thread "Polish member card design and icons"): Header look live, price circle smaller (v0.9.854). Asked Cory: top right shows the member bust and how many members a card counts as, and the four cards that score less than they count (Dabblers, Con Men, Ensemble, Revelers) say "Worth 1 follower." [yes].
- Portraits (thread "Improve all member images"): live v0.9.862, every member a 64px little scene (style F, design/prototypes/scenes: STYLE.md, BRIEF.md, b1-b6 sources, build.py N, then node scripts/v4-portrait4-import.mjs). Next: Cory's playtest notes on the pictures.
- Balance round 2 (thread "Run balance tests and suggest 2.0 changes"): Cory answered the Oct 29 report. Logged: Accomplice 3, Tiebreaker 4, Impressionist and Greatest Hits stay; Last Call claim withdrawn. Shipping: Front-runner 2, Extra Hand 9, Agents "Your actions can't be copied", Crowd In +4 purple, Triplets worth 3. Next: whether bots handle skips and member swaps well.
- Expert AI games (thread "Play expert AI board game sessions"): AI players play full games and write them up as stories with table talk; game 6 posted in three parts. Their shared suspects: Last Call, Echo and Greatest Hits copying steals or Last Call; Allowance plus Exchange with Money Changer; Help Yourself with Fence on turn one. The overnight try in another thread was blocked by a safety filter and is closed.

- Bots (thread "Make the bots play better"): done Oct 29. Swaps and steals rated for every player (v0.9.857), Hard looks ahead on them (v0.9.870); write-up design/eval/bot-swaps/README.md. Cory: no card-by-card bot rules.
- Hard bots that learn (thread "Teach Hard bots to learn across games"): done Oct 31. Plans, tested lessons and a learned position value all tied Hard (sims only, opts.mind); looking 3x further ahead beat it, shipped as the Very Hard level (v0.9.892). Reports: design/eval/hard-learn, hard-value (README), hard-search, hard-value-yellow. Runners: scripts/v4-hard-learn.mjs, v4-hard-tune.mjs, v4-hard-value.mjs.

Waiting on Cory (nothing built until he answers)
- Members page review: https://cojamz.github.io/patrons/play/members/ is a color explorer (pick a color, see its deck, artifact and spaces by round; #red etc. in the link). He reviews color by color with the deck rework.
- Table talk: keep or swap the 12 quick lines (Claude's fill-ins).
- Older numbered calls: design/notes/waiting-on-cory-2026-10-24.md, design/notes/rework-list-2026-10-28.md.

Parked
- Squatter on Greatest Hits ("players actions werent copied", v0.9.1 online): not reproduced; gated by cards-echo test and e2e/v4/squat-hits.mjs; reopens when a saved game shows it.
- Wheel in Firefox: smooth at full speed since v0.9.831. Left: one ~180 ms hitch the first time the rim's words flip in a game, and 100-130 ms frames as a spin starts on a slowed Firefox. Reopens if Cory says the wheel still drags.
- Yellow 2.0: built and bot-read Oct 31 (design/eval/balance-yellow-oct31). Branch only, not published. Next: Cory's calls on the reads (artifact, Makeover), an on-screen check of the new picks, then Gold.
- Fuel spaces with flavor (thread "Give fuel spaces their color's flavor"): Gather tied to the recruit is live v0.9.891 (+2/3/4 red, +1/2/3 followers if you recruit a member this turn). Next: Savings, Allowance, Build Up, Stash in the same direction, one at a time after Cory says go. Harvest is the Yellow thread's.

Closed Oct 29 with nothing owed: Cross-check balance findings (11 price changes signed off, shipped in v0.9.850), Run expert AI games overnight (blocked), Rework members and actions by priority (all calls live in v0.9.836), Decide member and guest balance (guests final at 15), Fix the game freezing mid-play (v0.9.831), Make the members page a color explorer (live), Show every member for review (live), Rework round I actions (v0.9.821).

Branches
- claude/gifted-newton-3lcy3i: the game (PR #1). main: the old game plus play/, rules/ and the harness mirror.
- Every other claude/* branch is an old thread workspace and stale; none are needed.
- Purple members (thread "Rework purple members"): shipped Clockmaker, Courier, "+1 minion"/"in a row" wording, copied Right Away fix, Help Yourself no magenta, Loyalists vs Double Agent (v0.9.881), Launderers any-mix card (v0.9.882). The rest of the purple list waits: Cory reworks members himself. Gold rework later: gold.tinker and the guest are both named Alchemist; check with the wording thread before renaming (/mnt/project-files/member-rework/purple.md).
