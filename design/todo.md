# v4 to-do

Cory's rule (2026-10-14): anything that makes the game playable by humans comes first. Bots and agent tooling only as far as they serve that; no rabbit holes.

## 1. Playable by humans (always first)
- [ ] Show the six members for sale during setup (Cory: key to the starting pick) (UI agent, top)
- [ ] Reload near game end erases a hot-seat game (UI agent, priority bug)
- [ ] Undo pill stuck on "Placement undone" (UI agent)
- [ ] Panel 7 fixes: choice panel over the buy row, shop text while placing, bot pacing, phone motion (UI agent)
- [ ] Phone setup: hover card pops on tap, resource tray below the fold, page scrolls sideways (UI agent)
- [ ] Table picker: any 4 spheres, `?table=` (UI agent)
- [ ] Buttons for Release, Straggler, Squatter, Insider's pile buys (UI agent)
- [ ] Every card does what its text says, and every number traces to a log line (card checkers)
- [ ] New follower costs in the rulebook; colors named for any table (cost agent)
- [ ] Blind panel on mixed tables with "felt unfair or unfun" notes, then fixes
- [ ] A link where Cory picks any 4 spheres and plays

- [ ] Design pod: research best design skills/references, write a ui-critic agent; blind expert UI critic round 1 on the frozen build
- [ ] Engineering expert review (blind): what saves headaches long-term

- [ ] Hardening: saves never crash-loop across deploys, error screen, "copy game record" + replay, bot errors never stall, a gate that runs every sphere test fast, CI (hardening agent)
- [ ] Later (engineering review): structured events instead of log parsing; shared verbs for copies; online auth rules and bot takeover for dropped players; type checking

## 2. Balance (serves play)
- [ ] Big followers at ~25% with the final bots; members ~6–7 a player (cost agent)
- [ ] Fair-price test: screen every card, then a careful check on outliers
- [ ] 4-thinking-bot tables as the standard balance reading
- [ ] Watch: White's 1-for-1 follower trades vs the new costs

## 3. Bots (only as far as they serve 1 and 2)
- [ ] Easy / Normal / Hard, chosen in setup (bots agent)
- [ ] No hoarding, no recruiting everything (bots agent)
- [ ] Improve the thinking bot: better rollouts and card valuation, fast enough for 4 at a table
- [ ] Later, only if bot prices keep disagreeing with Cory's feel in play: a bot that learns from its own games

## Waiting on Cory
- [ ] Board sketch: A, B, or B with A on phone?
- [ ] Green: what bugs you most (copy spaces, members, scoring)?
- [ ] What followers can be sold (Pawn, Sell High…)? Today only bought or contest-won ones, so Pawn is dead in round I. [any follower, down to 1]
- [ ] Watchdog ("Rivals can't take your members"): does it stop Red's Trade? [yes]
- [ ] Stolen loot stays magenta (Midas/Underdog don't touch it)? [yes]
- [ ] Use-then-release / buy-then-release in the same turn? [yes]
- [ ] Release on by default? [yes]
- [ ] Late Riser as the new name for Purple's old Straggler? [yes]
- [ ] Card discounts doubled with costs (Discount 4 off, Trade +2…)? [yes]
- [ ] Which opponents define the ~25% big-followers target? Normal bots read ~10%, easy ~80%. [an in-between bot level, then a check with people]
- [ ] Make the 10→10 buy the game-end clock instead of 8→6 (8→6 almost never sells out)? [yes]
- [ ] Swap space: any two members at the table, or one of yours? [one of yours] And +1 red in round I? [yes]
- [ ] Investor moved by Ransom or Trade: set-aside gold stays with the old owner, like Heist (Claude's extension of your ruling)? [yes]
