# Hard bots that plan and learn (Oct 30)

All numbers are **Hard bots** (AI players), 4 seats, random tables of the 2.0 colors, every 5th game one seat only buys followers. Code: `src/engine/v4/mind.js`; runner `scripts/v4-hard-learn.mjs`; per-window detail in `series.md`.

## What changed in how Hard plays
- **A plan.** At its artifact pick Hard chooses two colors and a style: build members, hold contests, or buy followers early. It takes its first color's artifact, leans placements and recruits toward its colors, and rethinks at the start of each round (about 1.5 changes a game, mostly swapping its second color once a rival crowds in).
- **Notes across games.** After every game each seat's opening plan, colors, artifact, members and spaces are scored by followers over the table average, every seat counted, so a bot learns from what worked for its rivals. Older games fade (3% a game).

## How play changed over the 100 games (table talk, AI players)
- **Everyone settled on building members.** Early games tried contests and follower rushes. Holding contests won its share (about a third) but finished 8 followers under the table on average, so the notes dropped it after game 40; by game 60 every bot opened building members. The 6 follower-rush openers after game 20 won 2 of 6, so the notes may have shut that door too fast.
- **Colors rotated.** Purple and Blue were the first picks early; Green had a run in games 61-80 (Echo, Reprise, Build Up the busiest spaces); by the end Red and Magenta led. The notes rate the Red artifact best (+4 followers over the table) and White's worst (-2).
- **Members the notes liked:** Mentor & Protégés, Mob, Proselytizer, Grifter, HR, Muse, Patriarch. **Disliked:** Front-runner, Scout, Launderers, Volunteer, Cheerleader, which were still among the most recruited. Dabblers stayed the most recruited card all series and was in a winner's cult most often.
- **Spaces the notes liked:** Greatest Hits, Poach, Walk-In, Promote, Last Call. **Disliked:** Demote, Shake Down, Spree, Exchange, Bury, Stash.
- Winners finished around 70-79 followers; seats recruited 9-12 members and bought about 47 followers each.

## Did it make Hard stronger?
- Plan, no notes, vs today's Hard (24 games, 2 seats each): **31% vs 30%** of seats won, 59.4 vs 58.1 followers. Even.
- Plan with the 100 games of notes vs today's Hard (24 games): **25% vs 27%**, 57.2 vs 59.3. Even (24 games can't tell 2 points apart).
- So the plan makes Hard play with a visible purpose at no cost, and the notes didn't add strength. Likely why: a member "in winners' cults" is mostly a member a strong position could afford, so the notes reward being ahead rather than the card.

## Buy-followers-only seat
**0 of 20 games** (target about 25%); it finished on average 25 followers behind the winner. Hard bots, so it's a bot read: Hard recruits well enough that a pure follower buyer never keeps up.
