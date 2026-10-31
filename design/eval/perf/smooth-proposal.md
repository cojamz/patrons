# Making the game smooth for good: the proposal

Tonight's three fixes treat the worst symptoms. This page is about the deeper cause, and what it would take to fix it at the root. Nothing here starts until Cory says go.

## What's really going on

Every time anyone does anything, the game does it in this order:

1. It redraws the whole table in its finished state.
2. It covers up the parts that changed.
3. It flies copies of the pieces over the top.
4. When the show ends, it redraws the whole table a second time.

So every single move pays for two full redraws, plus the show itself, all on one screen at the same time.

Three things make this worse as a game goes on:

- **More to redraw.** Every move copies the entire game, so the screen can't tell what actually changed. It redraws seats, members and the wheel even when they look the same. Late in the game there are more members, more minions and a longer log, so each redraw costs more.
- **Measuring mid-show.** The show measures where things are on screen in the middle of its own animation, and each measurement makes the browser stop and recalculate the whole page.
- **Pausing the idle motions.** The breathing and bobbing motions are switched off for every show and back on after it, which restyles the whole table twice per move.

This is also how good web board games differ. Board Game Arena and others keep the table still and animate only the pieces that move, using a list of what changed. The table itself never redraws from scratch. Cults already produces that list of changes (it's what the log and the shows are built from), so most of the hard part exists.

## Options

1. **Tune what's there (about 5 hours).**
   - Make each move reuse the parts of the game that didn't change, so the screen skips them.
   - Keep the idle motions running during shows instead of pausing them.
   - Measure positions once at the start of a show.

   Expected: clicks around 0.25 to 0.4 s late game (at laptop test speed), stutters roughly halved again. Low risk.

2. **Separate the show from the table (about 15 to 20 hours, in three stages).**
   - The table draws once per move, when the move is done.
   - Shows play on their own layer above it, driven by the list of changes, using positions measured ahead of time.

   Expected: clicks around 0.12 to 0.2 s, stutters in single digits per round, and no slowdown from round I to round III. Medium risk: undo, skipping a show and the turn-by-turn browser checks all need re-proving. Each stage ships on its own, so it never sits half done.

3. **Redraw the wheel and pieces as a game canvas (40 to 60 hours).** Smoothest ceiling, but it throws away today's look, hovers and accessibility, and most of the browser checks. Not worth it at this game's size.

## Recommendation

Do 1 next, then 2 in stages, each measured on the rig before and after. Skip 3.

The research behind this is the engineer's read of the code, not yet measured. Each claim comes with a one-run check on the rig before any of it is built.
