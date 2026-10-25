# Cults — handoff (current state; update in place, don't stack sections)

Last updated 2026-10-24 by the tidy-up thread. Before this: design/archive/handoff-2026-10-21-to-23.md.
- Live: https://cojamz.github.io/patrons/play/ is v0.8.62 (source 07ec995, Oct 23 12:39pm Eastern). Branch claude/gifted-newton-3lcy3i (PR #1) is the game plus docs; every CHANGELOG.md section through v0.8.62 names its source and main commit.
- Nothing is running. Cory asked for a clean start on Oct 23, 9:04pm Eastern.
- Every open question for Cory is in one numbered list: design/notes/waiting-on-cory-2026-10-24.md (copy in /mnt/project-files/tidy-up/). Build nothing from it until he answers by number.
- Artifacts are live (v0.8.72-73): each color has one, picked at the start with 1 of its color, drawn as an object on a plate on the player card; the draft lists them on the wheel. Two shops are shelved. Open call: round decks (try build at https://cojamz.github.io/patrons/try/round-decks/, branch claude/project-thread-tmeqf2: members join by round, cost 3 or less round I, 4-5 round II, 6+ round III; setup switch folds III into II; deck screen greys members not joined). If he says yes: port core.js waiting/joinsRound, the setup switch and the deck greying onto the game branch, quick check, ship.
- Our own open work, no call needed: design/todo.md ("Ours").
- Ship freeze rule: while Cory says a game is running, push to the branch only; publish when he says it's over.

## The game now
- Redesigned and live (2.0 on the Custom table picker): Red, Green, Magenta, Purple, Blue, White. Not redesigned (1.0): Gold, Silver (High Tide is live in round III), Yellow. Their redesigns are paused by Cory; state in design/spheres/gold-redesign-2026-10-22.md, silver-redesign-2026-10-22.md and design/pitch-ledger.md (Yellow).
- Core principle (Cory, Oct 22): the game is about synergy and engine building, not value in a vacuum. Strength baselines live in the /brainstorm skill.
- Members: 12 per redesigned color (Magenta has 13; one to cut), 10 in the old colors, 9 colorless guests. Target: a member returns about 2x its cost in followers (Cory, Oct 22; was 1.5x). Live prices predate the 2x target. Pricing levers: total cost, colored vs any in the cost, followers printed (1 to 4, rarely 5).
- Shop: 6, 7 and 8 members face up in rounds I, II and III (v0.8.59). Round decks (try build) would change what's in the deck each round, not the count.
- Cory's playtest of Oct 22 drove v0.8.46 to v0.8.62: copies do the whole action, Red's swaps can be skipped, Help Yourself steals followers, Peek +2/+4/+6, Lie Low just blocks steals, Top Up's flat +1 with growing yellow, the glossary reads the cards, rejoin across versions (last 3 releases kept at play/v/<version>/).
- Text review skill (/review-text): run after any card text change; it compares the card, hover, wheel panel, short face, prompts and log.

## Known not-green
- Steady pacing check: the longest wait for your turn is 22.7s against a 21.06s cap on seeded bot games (round III recruit runs). Fix is a motion trim, a feel call (Cory's list, #13). Never raise the cap.
- Known-red browser list (e2e/v4/known-red.json) is empty.
- Box load: parallel checks starve each other. Re-run a failure alone once before calling it real.

## How to work
- Ship: quick check on the exact commit, push to the game branch (rebase, never force), bash scripts/v4-play.sh <sha>, confirm the stamp, go-live note with a screenshot.
- Token-conscious: no sims or game batches unless Cory asks; open the game only for UI checks.
- About 50 old thread branches (Oct 14 to 23) are stale; this box can't push tags or delete branches, so they stay. List: design/in-flight.md.
