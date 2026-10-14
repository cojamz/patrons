# Core Rules v0.2 (shared by every sphere) — ARCHIVED

> **Archived 2026-10-14.** Don't use this file for rules. The player rules are `design/rulebook.md` (the in-game How to play), every call is in `design/decisions.md`, and the engine (`src/engine/v4/core.js`) is what's built.
> What changed since it was written: the shop shows 10 face up; member costs doubled (plain "worth N" members kept their old price); follower buys take any resources (2→1, 4→3, 8→6 with a stock of 2 per player, 10→10 with a stock of 4, and the last 10→10 is the clock); "Now and at round start" members also pay when recruited; Release is a base rule (colored part back only, never in the round you recruited it); workers are minions.
> Wrong here, right in the code: tied leaders all count as "the leader" (this file says nobody does); taking isn't limited to players ahead of you (most steals hit any rival).
> Still true and not in the rulebook (designer defaults): member, action and rule names are unique across all spheres; a copy gives the space's own printed gain (a space that took or traded is done again by the copier), copies can't be copied, and the center can't be copied (echo.js); nothing drops below 0; followers from a purchase or a member trigger count at once, round-end bonuses only at round end.
>
> The original text follows, for history.

These are defaults, decided so that playtests stop tripping on the same ambiguities. They're marked for Cory to confirm.
Every sphere spec assumes these. Anything a sphere changes, it states explicitly.

## Table
- There are 4 spheres on the wheel, one per player at 4 players. Each sphere has its own resource, named and colored.
- Rings and spaces:
  - Ring I has 3 spaces per sphere.
  - Ring II has 2.
  - Ring III's center has 1 space per sphere, so 4 in total.
  - Spaces stay open in later rounds. Workers return at the end of each round.
- Workers: 3, then 4, then 5.
- Turn order: snake draft, with fewest followers picking first.
  - Ties go to whoever picked later in the previous round.
  - In round I, ties go to reverse seat order.
- "Every round-I space fills" is a target, not a rule. A sphere that lets workers share spaces may leave some empty.

## Followers (the score)
- Everyone starts with 1 follower (yourself).
- Every member is worth 1 follower, plus any extra it prints.
- All follower changes from contests, per-event scoring and spheres are tallied and applied at round end.
- Followers from buying a member or fixture count the moment you buy, since they come from the purchase. Purchases happen during the round, but turn order is only set at round start.
- The word is **followers** everywhere. Never "Favor".

## Members (items)
- Each sphere brings 15 member kinds, one copy each for now (15 cards). All four spheres shuffle into one deck of 60. The market shows 6 face up. Copies mean nobody can monopolize a member.
- The deck is bigger than the game on purpose: ~34 get bought at 4 players, so plenty go unseen in any one game. Variety lives between games, like Dominion.
- A bought member is replaced from the deck at once.
- A member's cost has two parts: a **specific** part, paid in its sphere's own resource, and a **wild** part, payable with any resources. Printed like "2 gold + 1 wild". Some members cost only wild. Cost range: cheapest 1–2, most 2–3, top 5–6. (Cory, 2026-10-12) (A Cory call.)
- After each placement, you may make one buy: any face-up member, or a fixture.
- Members burned or released go to the bottom of their deck.

## Buying followers
- 2 resources for 1 follower. Any resources. Unlimited. (Cory, 2026-10-12)
- 4 resources for 3 followers. At least 2 different resources. Unlimited.
- 6 resources for 6 followers. At least 3 different resources.
- (v0.2: the fixtures crowded out members at 4 of 7 tables, so they're more expensive now. Members stay the main way to buy followers. Fixtures are the late-game bulk path.) There are 2 per player. When the last 6-follower buy is taken, finish the round, then the game ends.

## Ties and leaders
- When the top players are tied on followers, there is no leader. Effects that say "the leader" do nothing.
- "Ahead of you" means strictly more followers.

## Names and echoes
- Member, action and rule names are unique across all spheres.
- "Echo" is a reserved verb. It repeats a space's effect with exactly the yield its original taker got, never recomputed for the player echoing. Echoes can't echo, and the round-III center can't be echoed.
- A member bought in round III that triggers only at round start says so in its text, so nobody buys a dead card by accident.

## Taking
- Taking reaches only "a player ahead of you" by default. Cory's exceptions: Gold's Steal and the bribe member can hit anyone.
- Nothing ever drops below 0.

## Open questions for Cory
- Should fixtures be flatter, so members stay worth buying in round III? Tables 5 and 7 saw fixtures crowd out members.

## Final ties
- Most followers wins. If tied, more members wins (working call, in the rulebook).
