# Morning note for Cory, 2026-10-15 (draft; final at ~13:50 UTC)

**Link:** https://deploy-preview-1--cornycolonies.netlify.app (the PR's preview, rebuilt from the last push)

## What changed overnight, in your words
- **"Way snappier."** A click shows your minion in about 0.2s. The wheel spins in 0.3s. Hovers no longer redraw the shop, and a rival's move no longer redraws the whole table. Saving happens off the click. On a slow laptop the page used to restyle itself whole on every move; now it restyles only what changed, so the wait for your turn fell from about 22s to 10s and hovers from 1.5s to under 0.4s there (final quiet-machine numbers: TBD).
- **"A little show across the board."** Every move plays as a chain from cause to effect: your minion leaves its column, the space pulses, pieces fly from where they came from to where they land (steals go straight, gains arc, payments drop, four or more fly as one bundle), members hop when they fire, and numbers tick as pieces arrive. The speed setting in ☰ offers Quick, **Steady** (the default) and Relaxed. A click skips ahead. A rival's turn takes about 1.9s, and the wait between your turns about 6.4s (it was 12.5s).
- **"Simplify visual language everywhere."** The only symbols are the colored dot (with a split dot for "any") and the follower mark; everything else is words. Action spaces have no names or pictures: the gain first, then a plain phrase, with the name in the hover. Rims read "MOST BLUE · +2 👤".
- **"Hovers in a strange spot."** Every hover opens next to what you point at. Your own members are always readable.
- **"Those selector screens were awful."** Every choice is made on the board. Steal by clicking the rival's pile; copy by clicking the space; pick members, players and swaps by clicking them; gifts take two clicks (your color, then their seat). Paying is a clean sheet: the cost in dots, the coins that leave lifted. It's skipped when there's only one way to pay.
- **"The follower shop is too hidden" / "too much prime real estate for the log."** The screen is now who | where | what to buy: seats on the left in turn order, the wheel big in the middle, and on the right the follower buys first, then the members.
- **"Players positioned in turn order" / "minions in a column."** The seats sit in snake order with a rail ("now", "next", "twice"), and re-sort at round start. Unplaced minions bob in a column on each seat.
- **"What my members do / how to activate."** Hover a seat to see each member's full ability and state (ready, used, on/off, round start, game end). A member you can use now glows, and its card has "Use: +7 ●".
- **"Hard to tell what other players are doing."** The "since your last turn" strip is built from the engine's own record of every effect, so anything that hit you leads its line ("Raider took 2 of your followers"). Hover a name to light that space on the wheel. Each seat shows "each round +3●".
- **Round end** plays one quadrant at a time; totals climb as each prize lands, then minions walk home. The scoring banner stays still at the wheel's centre.
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

## What the game-feel tester said, checked against the bots
A blind hobby gamer played two full games on a quiet machine and graded it B− ("a lively, readable worker-placement with a gorgeous wheel and real snake-draft tension"). Its worry was that members lose to buying 10→10. The bots disagree on Classic: the top quarter of recruiters win 44% of games, the bottom quarter 16%; on random tables it's flat (design/eval/bench/economy-claims.md). Its other claims (ties at 1 in round I, Rising Tide +10 in round II) were rare in 336 bot games.

## Flags (built, easy to undo)
- White is a pearl: the one lightly shaded dot, because a flat cream dot read as "empty" on tables with white. Silver is steel blue-grey, a zero is a hollow ring in its color, and "any" has a thin diagonal line.
- Rival seats show their emoji face; the Steady timings were trimmed below the motion designer's table; the shortest gap between two players' moves is 400ms.

## Still open
- The Hard bot had weakened after Blue's change (a planning bug, now fixed: back to 43% against three Normal bots). The bench's pooled run on the fixed bots passed its checks; its price list is call 9, and no prices changed overnight.
- Phone stays out of scope. An online "Place here" pause on a slow machine is logged for a quiet-box check.
