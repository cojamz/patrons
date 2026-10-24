# Where we're at (2026-10-15, 14:30 UTC)

## The build
- The final overnight build is **0c1cd51** on `claude/cults-final`. PR #1's branch (`claude/gifted-newton-3lcy3i`, head 8afc4dd) is the same code plus notes: the morning note and the design pod's closing lists.
- The preview (https://deploy-preview-1--cornycolonies.netlify.app) is **stale**. It shows a build from before 10:00 ("Ransom a member", "2 extra turns for 8"). The cause isn't confirmed. The likely one is that about 60 overnight pushes used up Netlify's free deploy credits; a failed build is the other possibility.
- Nobody has graded 0c1cd51. The last blind grades were on 8ea3e24: testers C+ and C+, hobby gamer B−, game-skeptic B−. The bar is now A−.
- The quiet-machine check on 0c1cd51 (`design/eval/perf/quiet-final-0c1cd51.md` on `claude/cults-perf-final`) was read by nobody before the session ended:
  - Every gate failure passed when re-run alone; they were load flakes.
  - At normal laptop speed it's the quickest build yet. Hovers open in 30–40 ms (p95).
  - On a slow machine (4× CPU) it **regressed** against the 8ea3e24 build: the wait for your turn is 12.0 s (was 9.5 s), blocking is 23–24 s (was 8–9 s), and the first click takes 2.1–2.6 s. So the morning note's "9.5 s / 8 s" is out of date.

## Cory's notes from this morning, not yet fixed
1. Hovers feel laggy. The likely cause is that the card opens before its "You'd get" line is ready. Plan: precompute it at turn start, keep the card's size fixed, and gate on "card complete".
2. Pass is hard to find. Plan: "Done, no buy" in the shop column, under the follower buys.
3. The turn-order rail is confusing. Plan: remove it, and show "next" / "your turn in 3" on the seats.
4. The emojis on the wheel are too big and out of line. Plan: smaller, upright, inside the rim band, never covering words.
5. Good Deed's two-step gift is "very bad/confusing". Plan: a small card beside the space, with your colors, then the rivals' faces. The same goes for every gift and steal.
6. Animations are too fast even on Relaxed, and not smooth. Plan: Relaxed about 2× Steady, Steady a little slower, then re-check smoothness on the live build.
7. "The design is still clunky." Plan: a design pass graded to A−, with his notes as the answer key.

## Waiting on Cory
- **Purple** ("no board action should require spending"):
  1. Overtime becomes "Take 1 extra turn right after this one" and Crunch Time "Take 2 extra turns right after this one". [yes]
  2. Trades (Cheap Seats, All In, Sell High, Trade Seeds) don't count as spending. [no change]
  3. Rework Corner-Cutter later. [yes]
- **Catch Up** never pays its bonus, and he got nothing from it. Proposed: "+1 purple, and +1 per rival who's placed more minions than you this round", counted before yours lands, and check that the +1 is granted. [yes]
- **Hosting:** move from Netlify to Cloudflare Pages (500 free builds a month; he connects the repo once). [yes]
- **The morning note's calls 1–10** (`design/morning-note.md`), all unanswered. Call 9 is the biggest: balance pass 3 reprices 25 members.

## Housekeeping from the old session
- Seven leftover check-ins flooded Cory. The new session found no scheduled triggers left, so they appear to be gone.
- The doc refresh he asked for at 14:18 hasn't happened. HANDOFF.md and todo.md date from 10-14, and CLAUDE.md, working-with-cory.md and the answer key are missing this morning's rules and notes.
