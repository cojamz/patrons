# How we rework a color's members (Oct 21, Cory's process)

Durable. Every thread that pitches or prices members follows this. It replaces the overnight rework panel (agents designing and grading whole decks, prices from a value model), which Cory judged "not good enough" on Oct 21. History: design/eval/rework-panel-2026-10-21/README.md.

## Cory's calls behind it (Oct 21, decisions.md)
- "my members aren't priced the best right now. maybe we need to just think of the concepts and then run a bunch of balance test simulation games." His own cards set the shape of what he likes, never the price standard.
- "the concepts need to range from strong to weak. each color should also have a few of its own counters." Read (confirm pending): a few members in each color that blunt that color's own plan, so the table can fight whoever leads in it (Bodyguard against thieves, Agents and Bait against copiers, Loyalists against swaps).
- "you can mess around with how many followers/members a member is to also help with cost balances." Followers, bodies and the colored/any split are price levers, not just the total.
- Light reworks he'd recognize, not rebuilds. Interesting but not complicated.

## The loop
1. **Read.** design/member-principles.md (shape: what he liked and cut, in his words), the color's section of design/strategy.md, its live content file, his notes on its cards (decisions.md, grep the card names), the pitch ledger's member lines. Dump the live deck with `node` over content/index.js minus cull.js CUT.
2. **Concepts, light.** Keep every card he praised as written. Change only cards his notes point at, in the direction the note says. Add new cards only to fill a job: a counter, a cheap body, a strong top. One sentence, one moment (on arrival, your turn, round start, game end), nothing anyone has to remember, shows on the card.
3. **Spread on purpose.** Order the concepts strongest to weakest before any price exists. A deck needs a clear top (a card worth building toward), a middle, and weak cheap cards that are still wanted. If two concepts would land at the same power, cut or change one.
4. **Counters.** Two or three per color, at different strengths (a hard stop like Bodyguard, a deterrent like Bait, a weak one).
5. **Send concepts, not prices.** Numbered picks, card text quoted, the strong-to-weak order in one line, default in brackets. Calibrate on one color before fanning out. Log the pitch in pitch-ledger.md.
6. **Build his cut on a side branch** (`claude/members-<color>`), never the live game or PR #1. Starting prices from `node scripts/member-price.mjs` (the arithmetic only gets the sweep's grid in the right place). Each new card needs a bot hint so bots use it sensibly; say which cards bots may misplay.
7. **Sims set the prices.** `node scripts/v4-fair-price.mjs sweep <cards> --seats=N --table=<color>,<three reworked colors> --games=300 --free=0 --deltas=-4,-2,0,2,4 --round=2` at 2, 3 and 4 seats (`--round=1` for cards meant for round I). The test seat is forced to buy a private copy at each price; the fair price is where its follower margin over the same game without the card crosses zero. Seeded and deterministic: box load only changes wall time. Example runner: design/eval/member-sims/run-magenta-live.sh.
8. **Set prices from the sweep.** Target (Cory, Oct 21): at its price a member earns back 1.5× its cost in followers, not break-even. From the sweep's fitted line (net margin = a − b·P), the price is a ÷ (b + 0.5), averaged over 3 and 4 players; where the line is flat or noisy, read the rows and say so. Round halves down, and use the levers when one number won't do: more followers or bodies for a dear card, a lower colored part when the color's players can't earn that much of it by the round it's for, a player-count note when 2 and 4 seats disagree by 3 or more.
9. **Check the table.** `node scripts/v4-big-followers.mjs 300 --level=normal --table=<the 4 colors>` with the new deck: buy-followers-only should win about 25%. Report it with every price.
10. **Report to Cory.** Price per card with its instrument (Normal bots, N seats, games), the strong-to-weak order as measured against the one he approved, anything the bots likely misplay, buy-followers-only win rate. Nothing ships until he says yes.

## Known limits of the instrument
- Normal bots value an unknown ability at a fixed share of its price when deciding to buy (bots.js abilityValue). The forced arm sidesteps that for the card under test, but rivals still buy other members that way.
- Bots play once-per-game and targeted cards by hints; a card that needs judgment (timing, whom to hit) can read weaker than it plays. Flag it, then run Hard bots on that card alone.
- 300 seeds give a margin noise of about ±2 followers per price; the linear fit across five prices is tighter. Don't report a difference of 1 as real.
