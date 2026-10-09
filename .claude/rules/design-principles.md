# Patrons v4 — Design Principles

Distilled from `design/decisions.md`, which stays the full log. Check every suggestion against this list before proposing it. Cory can change any line.

## Shape of the game
- Core loop: snake-draft actions from a shared pool, gain resources, buy one thing. Don't redesign it.
- Board: a spinning wheel of 4 color quadrants (no god names). Outer ring is round I (3 spaces per quadrant), inner ring is round II (2 spaces), center is round III (1 space). Spaces carry over: earlier rings stay open in later rounds.
- Workers per round: 3, then 4, then 5. Every round-I space fills. Whoever is last in Favor picks first each round.
- Setup: each player picks 2 starting resources in one go, first seat to last, while everyone watches. This replaces champions.
- Market: a second, smaller spinning board. Each color's stall holds 2 items, set around the rim. Neutral Favor fixtures sit in the middle, repeatable and Dominion-style (Laurel, Garland, Diadem; Diadems are limited and act as a clock).
- After each placement you buy one thing: an item from the stall of the quadrant you just played (trial rule), or a fixture.
- Everyone's items are public.

## How you win
- The game is about buying lots of items and escalating your resources to buy communal Favor. Ring contests are seasoning, not the meal.
- Each quadrant has exactly one scoring rule, printed on each of its rings, visually distinct from the actions.
- Favor can go down, but only rarely, a little at a time, and only from the leader.
- Favor changes only at round end. Contests, per-event counts, items and fixtures are all tallied and paid out when the round ends, with nothing real-time. Experiments may bend this, but must be flagged.
- Round 3 is the intended burst. Small early choices build the engine that explodes late (the Civ arc). Yields should climb ring by ring.

## How quadrants and actions feel
- No quadrant or action feels weaker than another. Depth comes from how you combine them.
- Each quadrant is unique, yet any one can be swapped out. Interplay must be generic: refer to resources, colors, spaces, items, rivals, the leader. Never refer to another specific quadrant.
- Actions are elemental verbs (gain, trade, sponsor, echo, plant…). Items and later spaces hook into those verbs.
- Round-I actions stay interesting in rounds II and III. They scale with the game rather than going flat.
- Concise and easy to understand. One line per action. Not too strong. Each action contributes or sets up an engine.
- No penalties tied to a space in round I. Every space fills, so a penalty only punishes whoever picks last. Use lures, not tolls.

## Interaction
- No exponential races in silos. Interact through the board, not at people.
- Compete over shared spaces, stall items, ring contests and the Diadem clock.
- Many actions spill a little gain onto others.
- Some items trigger off rivals' moves, so you watch the table.
- Never make it feel BAD. Direct harm stays rare and small, and only ever points at the leader.

## Process
- The tracking burden is the UI's job. Only cut a rule if it can't be shown clearly.
- No simulator until the rules settle.
