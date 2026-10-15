# Morning note for Cory, 2026-10-15

**Link:** https://deploy-preview-1--cornycolonies.netlify.app (the PR's preview, built from the final commit 0c1cd51)

Three pictures of the final build at 1270×700: [the starting pick](morning/1-start.png) · [a round III turn](morning/2-round-three.png) · [the results](morning/3-results.png)

## Where it stands
Four fresh blind players graded the 11:20 build: two screen-only testers gave C+ each, a hobby gamer B−, and the final skeptic B− ("a friend would play it tonight… it isn't a product yet: too slow to the touch, and a few screens tell small lies"). Their lists were fixed by 12:40: input lag (the wheel's shadow was redrawn every frame; now 60fps, hovers ~0.05s), copy choices picked on the board, the turn card naming every action, forecasts that no longer overpromise, a still-pace round end, and seat hovers that always open. The final build passed every test locally (1,031 unit tests and a full game); a quiet-machine verdict on it is in design/eval/perf/quiet-final-0c1cd51.md. It hasn't been re-graded by a fresh panel since those fixes.

## What changed overnight, in your words
- **"Way snappier."** Measured on a quiet machine, production build, slowed to a mid laptop (4× CPU), last night's build vs this morning's: the wait for your turn went from 18–20s to 9.5s; a hover on a space opens in about 0.06s (0.09–0.12s at worst; it was 0.55–0.7s); the main thread was blocked 182s over a game, now 8s. On a normal laptop hovers answer in under 0.1s and the wheel runs at 60 frames a second. What did it: the page no longer restyles itself whole on every move, a rival's move redraws only what changed, and the wheel's shadow stopped being redrawn every frame.
- **"A little show across the board."** Every move plays as a chain from cause to effect: your minion leaves its column, the space pulses, pieces fly from where they came from to where they land (steals go straight, gains arc, payments drop, four or more fly as one bundle), members hop when they fire, and numbers tick as pieces arrive. The speed setting in ☰ offers Quick, **Steady** (the default) and Relaxed. A click skips ahead. A rival's turn takes about 1.9s, and the wait between your turns about 6.4s (it was 12.5s).
- **"Simplify visual language everywhere."** The only symbols are the colored dot (with a split dot for "any") and the follower mark; everything else is words. Action spaces have no names or pictures: the gain first, then a plain phrase, with the name in the hover. Rims read "MOST BLUE · +2 👤".
- **"Hovers in a strange spot."** Every hover opens next to what you point at, one at a time, and an open card never swallows a click. Your follower number opens where your followers came from.
- **"Those selector screens were awful."** Every choice is made on the board. Steal by clicking the rival's pile; copy by clicking the space; pick members, players and swaps by clicking them; gifts take two clicks (your color, then their seat). Paying is a clean sheet: the cost in dots, the coins that leave lifted. It's skipped when there's only one way to pay.
- **"The follower shop is too hidden" / "too much prime real estate for the log."** The screen is now who | where | what to buy: seats on the left in turn order, the wheel big in the middle, and on the right the follower buys first, then the members.
- **"Players positioned in turn order" / "minions in a column."** The seats sit in snake order with a rail ("now", "next", "twice"), and re-sort at round start. Unplaced minions bob in a column on each seat.
- **"What my members do / how to activate."** Hover a seat to see each member's full ability and state (ready, used, on/off, round start, game end). A member you can use now glows, and its card has "Use: +7 ●".
- **"Hard to tell what other players are doing."** The "since your last turn" strip is built from the engine's own record of every effect, so anything that hit you leads its line ("Raider took 2 of your followers"). Hover a name to light that space on the wheel. Each seat shows "each round +3●", and a rival's card says what they could buy right now ("Holding 23● · could buy about 20 👤"). A rival's big round-III buy lands with weight.
- **Round end** waits for the last move to land, says "Round II ends", then plays one quadrant at a time at a steady pace; totals climb as each prize lands, then minions walk home. Skip sits on the scoring card.
- **"Starting pick not highlighted."** The starting pick now sits in the middle of the wheel, the one lit row on screen.
- **Quality of life.** One Speed setting (Quick / Steady / Relaxed) in setup and the menu. A card's face shows the price you'd actually pay when a discount applies. Colors read on every table (white, silver and "any" no longer look alike or empty). In rivals' turns the shop dims, so only what you can act on is bright. The "since your last turn" strip only ever shows whole lines. Space texts were rewritten wherever a newcomer misread them.

## How the harness changed (so you don't need your keen eye)
- **Testers judge by sight alone.** They see only screenshots and pointer positions. The old panel caught 8% of what you caught; two of the new testers, with their findings merged, catch 82%. Your notes are their answer key.
- **A standing design pod with authority to fix.** An art director owns composition, and a detail designer sweeps every screen on several tables for obvious problems and fixes them at the root, with guards (e.g. a check that fails the build if a retired symbol comes back).
- **Written standards.** design/taste.md holds the ten rules, a slop list, and "Cory's own calls". design/prototypes/motion/grammar.md is the motion language.
- **Quiet machines.** Verdicts and speed numbers come from separate cloud machines, not the overloaded one.

## Your calls (answer by number; my default in brackets)
1. Hold the ×1.25 member price rise: it would make members feel weaker. [yes]
2. Turn the "+1 when…" members into relative payoffs, starting with Reseller ("Whenever you recruit, gain blue equal to half its cost", 12 → 8) and Groupie ("rival recruits green: gain green equal to half its cost", stays 8). [yes]
3. Blue's direction: its spaces give blue plus a bargain together, round III is the big shopping day, and its rim scores the priciest member. The bench agrees Blue's spaces and its Snob, Reseller and Patroness read weak. [yes]
4. Hustler (2 → 8, the bench reads it at about 7) and Lender (keeps its debt when released). [yes]
5. Pure follower buying wins only about 10% of games (your band is 15–30%), so members beat it comfortably. Leave it, or nudge buying up? [leave it]
6. Resources are color-only dots now. Add faint inner marks for colorblind players? [no, unless a friend needs them]
7. Round-III rims decide the winner in about a third of games, and a quarter of them are won uncontested while everyone else spends out (bots, 336 games). Leave the hoard-or-spend tension as it is? [yes]
8. Members look alike at seat size (both blind testers couldn't tell Curator from Minimalist, or the yellow men with props apart). A pixel pass to give each a distinct silhouette or prop, keeping the style? [yes]
9. Balance pass 3, from the bench with both bots agreeing: lower 20 members that read too dear (Midas 8→4, Snob 10→5, Patroness 8→4, Extra Hand 10→6…), raise 5 too cheap (Tinker 6→10, Kingpin 2→4…), at most ×2 or ÷2 each, prices only. It's the most direct price lever on "members feel weak". Full list: design/eval/balance-pass-3.md. Apply it? [yes]
10. Seats re-sort into turn order each round (your call). Two blind testers lost track of their own seat and misclicked a gift onto themselves. Keep your seat pinned at the top and only the rivals below it in turn order? [no: keep pure turn order; the re-sort now plays as its own visible beat]

## What the game-feel tester said, checked against the bots
A blind hobby gamer played two full games on a quiet machine and graded it B− ("a lively, readable worker-placement with a gorgeous wheel and real snake-draft tension"). Its worry was that members lose to buying 10→10. The bots disagree on Classic: the top quarter of recruiters win 44% of games, the bottom quarter 16%; on random tables it's flat (design/eval/bench/economy-claims.md). Its other claims (ties at 1 in round I, Rising Tide +10 in round II) were rare in 336 bot games.

## Flags (built, easy to undo)
- White is a pearl: the one lightly shaded dot, because a flat cream dot read as "empty" on tables with white. Silver is steel blue-grey, a zero is a hollow ring in its color, and "any" has a thin diagonal line.
- Rival seats show their emoji face; the Steady timings were trimmed below the motion designer's table; the shortest gap between two players' moves is 400ms.

## Still open
- The Hard bot had weakened after Blue's change (a planning bug, now fixed: back to 43% against three Normal bots). The bench's pooled run on the fixed bots passed its checks; its price list is call 9, and no prices changed overnight.
- Online: a board pick (Sleepwalker's copy) stalled a game online; fixed, with guards. The online test passes.
- Phone stays out of scope tonight; the design pod's phone notes are in design/eval/design-pod/queue.md.
- Everything the panels said, and who fixed what: design/eval/overnight-wave3.md, the wave 4 reports in design/eval/wave4/ and design/eval/game-skeptic-w4.md.
