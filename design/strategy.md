# How Cults is won — a strategy read

Durable. Written 2026-10-20 (Claude) against live v0.8.9 and decisions.md up to the Oct 20 economy entry. Update it when a color's rework changes what wins; a new thread should read this before pitching any design. Facts marked (code) were read from `src/engine/v4/`; everything else is reasoning, marked as Claude's read. Nothing here is a design call; those live in decisions.md.

## The fixed frame (code)

- Score is followers: 1 to start, each member's printed followers, follower buys, contest prizes, member abilities.
- Follower buys are 1-for-1 in any resources, in packs of 1, 5 or 10, unlimited (`TIERS`). So **a resource is a follower at par**, any time, as long as you have a buy to spend.
- **One buy per turn**: a member or one follower pack. Minions 3/4/5, so about 12 buys a game per player, plus extra turns and Spree. A pack tops out at 10.
- Contests pay 2/4/6 to the leader, halved on a tie, zero holdings never win (`RING_VALUE`). That's 12 followers per color per game, about 48 on a four-color table.
- Resources carry over between rounds and are worth nothing at game end unless a member says so.
- Spaces: 3/2/1 per color, rings stay open. At 4 players round I fills exactly (12 spaces, 12 minions); rounds II and III have 4 spare spaces each (20 for 16, 24 for 20). At 2–3 players the same holds per color.
- Shop: 8 face up, refills from the pile, whole row refreshes between rounds. Release is off by default. The 10-per-color cull is on.
- Turn order: random in round I, then fewest followers first; snake, so the ends double up.

## The three economies inside one turn (Claude's read)

Every turn spends three things, and the game is about which one is scarce right now.

1. **The space.** Shared, blocking, snake-drafted. This is the soul: "will my spot still be open?" Ring I spaces stay live all game, so a round III turn chooses among 6 per color.
2. **The buy.** One per turn, and it can't be banked. Early, resources are scarce and the buy is cheap; late, resources pile up and the buy is the bottleneck (a Double Down for 20 gold needs two top packs, i.e. two turns). Anything that grants an extra buy is worth more the later it lands.
3. **The pile.** What you hold at round end wins contests, what you spend becomes members or followers. Holding costs nothing between rounds I and II except tempo; in round III, holding X to win a prize of 6 is right only when X is small and you'll actually lead.

## What has been winning, and why the economy is moving (evidence named)

- Testers and bench said the same thing through v0.6: **recruiting doesn't pay; conversion and rim snipes do.** AI tester (boardgame-enthusiast-w3): a 16-member engine came last; one player won three round III contests holding 2, 2 and 9 after everyone else cashed out. Normal-bot bench: 21–24% of round III prizes go uncontested, and removing them flips the winner in 37–39% of games.
- Why, in the math: a member costing C and worth f is a loss of C−f followers unless its ability earns that back, and it eats the buy that could have turned up to 10 resources into 10 followers. Big flat resource gains (Kickback +3, Golden Years 2/4/6, Toast 3/6/9) make the follower pack the best "member".
- Cory's Oct 20 economy call answers exactly this: actions give 1 of their color and only sometimes more, members get cheaper, members are where followers come from, and held resources score contests so **holding versus spending on members** is the core tension. Green, Red and Magenta already follow it; the other six don't yet.
- What Cory says feels right in members: steady income (Banker, Busker, Host), scorers, rule-benders like Straggler. What feels weak: small "+1 when…" triggers, switches, conditionals.
- Big Money (buy followers only) is the baseline at about 25%. Under the new economy it should drift down as members get cheaper; that's the instrument to watch, not a goal to chase.

## Where the tension lives (Claude's read)

- **Blocking.** The draft is the heart. Snake double turns at the ends, Ring I spaces staying open, and catch-up turn order (fewest followers first) are the only comeback engine the base game has.
- **Contest reading.** Prizes are visible state: you can see who leads each rim. Round I and II contests are cheap for whoever isn't buying; round III is a cliff (spend everything or sit on a small pile).
- **Piles as targets.** Magenta's half-a-stack theft and Gold's Collect Debts are the only checks on a hoard. A big pile is both a contest lead and a theft target, which is good tension.
- **Members as targets.** Since Red and Magenta, members move: equal-cost swaps, promote/demote through the shop, Shake Down, Poach. Bodyguard and Loyalists are the defense. A member is no longer safe once bought, so cheap bodies and protection matter.
- **The shop as a shared board.** 8 face up, bought out before your turn comes back (Cory, Oct 14: "a member you like is usually bought before your turn comes back"). Today nothing lets you claim or plan around it except speed and Red's free recruits.

## What each color brings today

Reworked (new economy):
- **Red, members on the move.** Free recruits (Open Door, Recruit a Member), swaps with the shop and across cults (Even Swap, Promote, Demote). Quantity and turnover. Contest: held red.
- **Green, copying.** Echo/Encore/Reprise/Greatest Hits read where minions sit, so you care what rivals took. Chains pay +1 green per step. Contest: held green.
- **Magenta, theft.** Resources and members, aimed by choice; the check on hoards. Lie Low and Bodyguard defend. R3 Poach takes a member outright. Contest: held magenta. Members still the old deck.

Not reworked:
- **Gold, the hoard.** Most gold held, gold counts as any color in follower buys, Double Down in R3. Cory's own design and the reference for spend-or-sit. Out of step with the new economy: large flat gains, +1 gold per member, and Intro Offer is a cost reduction (all of which Cory dropped for rework). Flat spot: Double Down is a no-brainer for the gold leader and dead for everyone else.
- **Blue, the shop** (`market.js`). Snap Up, New Faces, Name Drop, Half Price, Show Off, Spree (buy 3 times). Contest: most blue members, so a shopping color is paid for buying its own color's cards. Cory: "needs a complete rework", "a lot of the blue quadrant was pretty bad". Many members hinge on blue cards happening to show up in the row; several are price cuts.
- **Purple, timing.** Extra turns and Crunch Time (take your next 2 turns right away, Cory: keep as is). At 4 players round I has no spare space, so its extra-turn members do nothing there; round I is three ways to gain purple. Cory: no board action should charge you. Contest: most purple members.
- **Silver, giving.** Toast/Goody Bags/Good Deed hand rivals a little; Rising Tide is the one that bites and swings hard. Cory asked for new Hold Court, Sweet Talk, Goody Bags. Contest: held silver, and gifts of silver feed rivals' contest, a tension nobody plays on purpose yet.
- **Yellow, variety.** Spaces top up colors; contest is full sets, which nobody chases and nobody can read at a glance.
- **White, follower trading.** Sell and buy followers; it competes with the core follower buy instead of bending it. Contest: most white members.

## What the reworks changed for the colors still waiting (Claude's read)

- With fewer resources per action, **every resource is louder**: theft, gifts, color conversion and doubling all hit harder per unit. Big-gain colors (Gold, Silver's Toast, Purple's Clock In) now read as outliers.
- With cheaper members and followers coming from members, **the shop is the main stage** and the buy is the scarce thing late. Whoever controls access to the row and the number of buys holds the biggest lever left unclaimed.
- Three of three reworked colors interact *at* rivals' stuff (take, swap, copy). The table has no color yet that rewards helping, and none that bends **when** you place beyond the snake.
- Stolen resources keep their colors, and five contests are on held color. So **which colors you hold** matters more than it did; color conversion (Yellow) quietly gained value.

## Checks for any pitch (from Cory's principles)

Before pitching a color: does every action feel good and distinct to take; does the R3 action feel like the burst the engine builds toward; does Round I stay worth taking in round III; is the harm mild except in R3; is it playable on a real table (nothing remembers last round); does it avoid naming another color; does it give members that make radically different cults. Pitch themes and play, never cards or numbers.
