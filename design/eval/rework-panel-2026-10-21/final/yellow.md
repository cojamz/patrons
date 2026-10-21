# Yellow, final (rework panel, phase 4)

**All card texts and numbers are Claude's fill-ins, not approved.** Chosen concept: yellow-anchor A ("your members bring their colors"), revised after the five critiques. Nothing here ships until Cory says yes.

## Identity, and what changes at the table

Yellow is the mixed cult. Every Yellow space reads the members you already own and pays you in their colors, so a Yellow player turns up in other colors' contests and can afford other colors' members' colored parts. It counts **member cards, not bodies**: Red's Mob (worth 5) brings 1 red, a cheap 1-follower card brings 1 too. That is the identity in one line, and it makes Yellow Mob's opposite: Red wants a few fat red cards, Yellow wants many cards in many colors. Nothing counts the colors on the table, so Yellow pays the same at 2 and 4 players (#84), and for the first time it wants members (#96). At the table: you buy two cheap members in round I because each one is +2 on Bumper Crop later, and in round II you choose between Potluck (resources in your cult's colors) and Feast (followers for your non-yellow members).

Rules notes (fill-ins):
- A neutral guest has no color: it brings nothing on Potluck or Bumper Crop (live behaviour), and it counts as "not yellow" for Feast.
- This changes live Potluck, which counts bodies today (core.js countMembersOfColor uses the worth-N weight). Cory's rule "a member worth N counts as N members" stays everywhere else; Yellow's spaces are the one place that counts cards. Why: bodies multiply under counters (Mob alone would bring 10 on Bumper Crop), and "card" is what a player counts by looking.

Assumed member cards held (from ~12 buys, 6–8 of them members): end of round I 1–2, round II 3–4, round III 5–6. At 2 players a player sees more of the row per turn, so add about 1 card in round III.

## Actions

### Round III: Bumper Crop
"Each of your member cards brings you 2 of its color. +1 yellow."
- Walk-away: round III, 5–6 cards → **11–13** at 4 players, 11–15 at 2 players, spread over your cult's colors (and a likely contest lead in your main color).
- Wanted beyond the specialist: any cult with many cards takes it, and the trailer picks first. Uncapped because it counts cards; if it runs hot the fix is "(at most 12)", not bodies.
- Green copy: flagged so the copier does it themselves (it reads the taker's cult; a replay would pay the copier the taker's colors).

### Round II: Potluck (kept, recounted)
"Each of your member cards brings you 1 of its color. +1 yellow."
- Walk-away: round II, 3–4 cards → **4–5**; round III, 5–6 → **6–7**. Same at 2 and 4 players (+1 at 2 in round III).
- Changes what you can buy next (colored parts in your cult's colors) and which contests you're in.
- Green copy: flagged, copier does it.

### Round II: Feast
"+1 follower per member card you have that isn't yellow. +1 yellow."
- Walk-away: round II, 2–3 non-yellow cards → **3–4** (followers that need no buy and can't be stolen); round III, 4–5 → **5–6**.
- Changes what you own directly. It pulls against Potluck and Bumper Crop: yellow members feed the yellow contest there, non-yellow members feed Feast. Mono or mixed is a real choice.
- Green copy: flagged, copier does it.

### Round I: Top Up (Cory's call: scales by round)
"Gain 1 × round, one at a time, each to your fewest color. +1 yellow."
- Walk-away: **2 / 3 / 4** at 2 and 4 players. Side effect: access (it fills the gap blocking a colored part). Ties: you pick, so it never pays per color.
- Green copy: flagged, copier does it (reads the copier's own fewest).

### Round I: Trade Seeds (kept, swaps scale)
"+2 yellow, then swap up to 2 × round of your resources for other colors."
- Walk-away: **2** raw, plus 2 / 4 / 6 swaps. Side effect: reshape (the late contest snipe; 6 swaps just before round III contests). Keeps the one-at-a-time picker Cory praised.
- Green copy: flagged, copier swaps their own pile.

### Round I: Harvest (new text)
"+1 yellow per member card you have (at most 3). +1 yellow."
- Walk-away: round I 1–2 cards → **2–3**; round II **4**; round III **4**. All yellow: the yellow contest's fuel, and it tells a new player "recruit first".
- Green copy: flagged, copier counts their own cards.

Round I trio: Top Up spreads, Trade Seeds reshapes, Harvest builds yellow. Similar totals, different side effects, all still 4ish in round III.

## Contest
Most yellow held (the default). Yellow comes from the +1s, Harvest, Trade Seeds and your yellow member cards on Potluck and Bumper Crop. A Yellow cult of yellow members holds the contest; a mixed cult collects Feast and spends its yellow. That's the hold-or-spend split, on the color's own verb.

## The deck (5 cards; 5 slots open for Cory)

What a specialist earns in yellow in a game (guess): about 7 from the +1s on ~7 Yellow spaces, 4–6 more from Harvest, 1 from Trade Seeds, 2–4 from yellow member cards on Potluck and Bumper Crop: **about 14–17 yellow**. The five colored parts below total 12, so buying three or four of them eats most of what you'd hold for the yellow contest.

| Card | Cost | Worth | Text | Why this price |
|---|---|---|---|---|
| Sprouts | 1+1 | 2 | When recruited: +1 of your fewest color. | Cheap body at Crew's price plus Top Up's kick: 2.6 + 1 for 2 in round I. In this color every card is +2 on Bumper Crop, so the cheap card is the specialist's fuel. Open Door's natural pick |
| Convert | 2+1 | 2 | When recruited, pick a color: it's a member of that color. | Fits any build: one more member for a color counter (Mob, Chronicler), a member contest, or Potluck's payout in the color you lack. 2.6 of body + about 1–2 of fit, for 3: 1.2–1.5. Choice made on arrival and kept (a cube on the card); if taken, it keeps its color |
| Go-Between (kept) | 2+2 | 1 | Whenever you recruit a non-yellow member, +1 of its color. | Live card, on your own turn, table-proof. Fires 3–5 times: 1.3 + 4 for 4, about 1.3 |
| Rainmaker (Cory liked; "should cost more") | 3+3 | 2 | Once per game: raise one of your colors to match your yellow. | Round III yellow 6–8, target 0–2: +5–7. 2.6 + 6 for 6, about 1.4, the same at 2 and 4 players. Alternative in pick 3 |
| Chefs (Cory's call) | 4+3 | 3 | When recruited: each of your member cards brings you 1 of its color. | Potluck on arrival, counts itself. Worth 3, so "at least 2 members" for everything that counts bodies. Round II with 4 cards: 4 + 3.9 for 7 (1.1); round III with 6: 6 + 3.9 (1.4). Gets better the later you buy it (Treasurer's shape). 7 is cheaper than Feastmaker's 10 |

Ladder 2, 3, 4, 6, 7. Printed followers 10 across 5 cards (3 worth 2+).

Every card stands alone: Yellow's spaces count all your members, any color, so no yellow card needs another yellow card to show up (a committed player owns about 3–5 of a color at 4 players).

Open slots and why: the scorer slot (Cory's own idea, "+2 per color you have a member in", counts table colors and is half as good at 2 players; Melting Pot, "+1 follower per non-yellow member", is the table-proof version but repeats Feast), a top card at 8–10, and a card that plays off rivals. Nothing I found was good enough to fill them.

Cut from the anchor pitch, with the reason:
- Diplomat ("contests you tie pay you in full"): tie card; ties all score (Oct 16).
- Gossip ("+2 of the color the follower leader holds most of"): two lookups, a riddle.
- Granary ("+1 follower per resource in your second-largest color"): can't be tracked while playing, and a trap at 7. Melting Pot considered for the slot; see above.
- Field Hands (plain worth 3 for 3): the fourth such body tonight, and under card-counting a fat body does nothing for Yellow.
- Fieldworker ("+1 follower when you take a Yellow space"): the template drip three other decks have.
- Orchard (round-start Potluck): a name collision with Green's space, and a slight variation of Chefs.

Cut from live (all count table colors, or are drips on rivals' turns): Peddler, Admirer, Dyer, Late Bloomers' "+1 of each color", Pilgrim, Weaver, Explorer, Feastmaker (becomes Chefs).

Board rules check: no tie card, no out-of-turn buy, no turn-moving source, nothing re-fires income. Red re-firing Chefs's "When recruited" with a swap pays its owner another Potluck (about 5–6): that's Red's verb working, flagged only. Overlap to watch: gold-anchor's Gold Standard ("raise one of your colors to match your gold") is Rainmaker's verb in gold; if Rainmaker keeps a "match your yellow" text, Gold should drop Gold Standard.

## The alternative: Dye (yellow-outsider A)
- What it is: Yellow changes what color a pile is. Fade (round II, "up to 3 of a rival's resources of one color turn yellow; gain that many of that color", obeying "can't be stolen from"), Potluck, and Top Up, Harvest and Trade Seeds in round I.
- Pricing and the skeptic rated it highest: every gain reads your own pile, so it's the same at 2 and 4 players, with the cleanest bands.
- It would go without Pour (it overlaps Cory's Launderer), Dyer (it is Launderer) and Chameleon (one pile in two contests, hard to show), which leaves it needing a new round III burst.
- It ranked second because Cory didn't open up Yellow's identity, Fade is confusing to receive ("did she steal from me?"), and it barely answers "Yellow doesn't want members".

## Picks for Cory
1. Yellow's direction: "your members bring their colors" (Bumper Crop: "each of your member cards brings you 2 of its color"), or repainting resources (Dye) [members].
2. Yellow's spaces count member cards, not bodies, Potluck included, so Mob brings 1 red, not 5 [cards].
3. Rainmaker: "raise one of your colors to match your yellow" at 6, same at 2 and 4 players, or keep "raise each of your colors" at 9 (+5 at 2 players, +12–15 at 4) [one color at 6].
4. Chefs: worth 3, cost 7, "When recruited: each of your member cards brings you 1 of its color" [yes].
5. Convert, new: "When recruited, pick a color: it's a member of that color" [yes].
