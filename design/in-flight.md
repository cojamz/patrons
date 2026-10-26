# In flight (2026-10-24, tidy-up)

Nothing is running. Live: v0.8.62 (main:play/build.json, source 07ec995). Before this: design/archive/in-flight-2026-10-21-to-23.md.

Threads and where each stands
- Snappy pair (Make the game feel snappy): v0.8.84 live (hovers open at once and close after 200 ms, choices light as the last piece lands, rival turns ×0.65 except recruits and buys, compositor-only pulses, round deck shuffle-in). Bot worker and shared clock slices 1-2 live. Left: acknowledgment and frame bars in the snappy gate, cult-hop filter. New gate: e2e/v4/midchain.mjs.
- Member structure: v0.8.71 live (Headhunter, Fixer, Window Shopper, Restocker, Timekeepers, Old Money; Bulk Buyer, Appraiser, Makeover cut). Sort of every color into kinds: /mnt/project-files/member-structure/. Waiting on Cory's read after play; names and prices are Claude's.
- Action text review: v0.8.60 to v0.8.62 shipped. Waiting on Cory's #12 (how the wheel shows "+1" on long spaces). Owner of /review-text.
- Engine start and round I: artifacts live (draft list fix v0.8.83) and round decks live (v0.8.82). Waiting on Cory's next call. Shuffle-in animation is with the snappiness thread.
- Tonight's playtest notes (Oct 22): everything decided is live. Waiting on #6 to #11.
- Purple redesign: shipped v0.8.45, playtest fixes v0.8.57. Waiting on #5 (Sleep In +3).
- Gold, Silver, Yellow redesigns: paused by Cory. Waiting on #20 (which color next).
- Finished: White redesign (spaces, 12 members, prices v0.8.52), Member balance (v0.8.35 prices; the 2x repass is #15), Member design, Rules rewrite (glossary reads the cards, v0.8.53), Bigger shop 6/7/8 (v0.8.59), Wheel spin lag (v0.8.50; #14 asks if it still lags), Hard bot balance runs, Brainstorming skill, Where we are this week.

Branches
- claude/gifted-newton-3lcy3i: the game (PR #1). main: the old game plus play/, rules/ and the harness mirror.
- claude/project-thread-tmeqf2: round decks try build, superseded by the live game.
- Kept as they are: gh-pages (retired, Pages serves main), ux-work-may-1 (old, from May).
- Every other claude/* branch is an old thread workspace (sweeps, benches, panels, member sims, five-six players) and stale: its work is merged into the game branch or recorded in design/eval/. The Oct 24 tidy-up couldn't archive them (pushing tags is refused from this box), so they stay until someone with GitHub access deletes them; none are needed.
