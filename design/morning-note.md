# Morning note for Cory, 2026-10-15 (draft; final at ~08:45 UTC)

**Link:** https://deploy-preview-1--cornycolonies.netlify.app (the PR's preview, rebuilt from the last push)

## What changed overnight, in your words
- **"Way snappier."** A click shows your minion in about 0.2s. The wheel spins in 0.3s. Hovers no longer redraw the shop, and a rival's move no longer redraws the whole table. Saving happens off the click. (Quiet-machine before/after numbers: TBD from the 79dee80 run.)
- **"A little show across the board."** Every move plays as a chain from cause to effect: your minion leaves its column, the space pulses, pieces fly from where they came from to where they land (steals go straight, gains arc, payments drop, four or more fly as one bundle), members hop when they fire, and numbers tick as pieces arrive. The speed setting in ☰ offers Quick, **Steady** (the default) and Relaxed. A click skips ahead. A rival's turn takes about 1.9s, and the wait between your turns about 6.4s (it was 12.5s).
- **"Simplify visual language everywhere."** The only symbols are the colored dot (with a split dot for "any") and the follower mark; everything else is words. Action spaces have no names or pictures: the gain first, then a plain phrase, with the name in the hover. Rims read "MOST BLUE · +2 👤".
- **"Hovers in a strange spot."** Every hover opens next to what you point at. Your own members are always readable.
- **"Those selector screens were awful."** Every choice is made on the board. Steal by clicking the rival's pile; copy by clicking the space; pick members, players and swaps by clicking them; gifts take two clicks (your color, then their seat). Paying is a clean sheet: the cost in dots, the coins that leave lifted. It's skipped when there's only one way to pay.
- **"The follower shop is too hidden" / "too much prime real estate for the log."** The screen is now who | where | what to buy: seats on the left in turn order, the wheel big in the middle, and on the right the follower buys first, then the members.
- **"Players positioned in turn order" / "minions in a column."** The seats sit in snake order with a rail ("now", "next", "twice"), and re-sort at round start. Unplaced minions bob in a column on each seat.
- **"What my members do / how to activate."** Hover a seat to see each member's full ability and state (ready, used, on/off, round start, game end). A member you can use now glows, and its card has "Use: +7 ●".
- **"Hard to tell what other players are doing."** The "since your last turn" strip is built from the engine's own record of every effect, so anything that hit you leads its line ("Raider took 2 of your followers"). Hover a name to light that space on the wheel. Each seat shows "each round +3●".
- **Round end** plays one quadrant at a time; totals climb as each prize lands, then minions walk home.

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

## Still open
- The bench's second bot (Hard-20) got weaker after the "use members any time" change, so last night's balance readings are provisional. The bench session is fixing the bot and rerunning.
- Phone stays out of scope. An online "Place here" pause on a slow machine is logged for a quiet-box check.
