# Yellow, final (rework panel, phase 4)

Gate fixes applied (see gate.md).

**All card texts and numbers are Claude's fill-ins, not approved.** Chosen concept: yellow-anchor A ("your members bring their colors"), revised after the five critiques. Nothing here ships until Cory says yes.

## Identity, and what changes at the table

Yellow is the mixed cult. Every Yellow space reads the members you already own and pays you in their colors, so a Yellow player turns up in other colors' contests and can afford other colors' members' colored parts. It counts members the way the whole game does (Cory's rule: a member worth N counts as N members), and every count prints an "at most" cap: Red's Mob (worth 5) brings 5 red on Potluck, and the cap keeps a fat cult from running past the band. A Yellow player wants members in many colors. Nothing counts the colors on the table, so Yellow pays the same at 2 and 4 players (#84), and for the first time it wants members (#96). At the table: you buy members in round I because each body is +2 on Bumper Crop later, and in round II you choose between Potluck (resources in your cult's colors) and Feast (followers for your non-yellow members).

Rules notes (fill-ins):
- A neutral guest has no color: it brings nothing on Potluck or Bumper Crop (live behaviour), and it counts as "not yellow" for Feast.
- Live Potluck already counts bodies (core.js countMembersOfColor uses the worth-N weight); it keeps that and gains a cap. One counting rule in the game, with caps instead of a second rule (gate conflict 2): Mob alone would bring 10 on Bumper Crop, so Bumper Crop prints "at most 10" and Potluck "at most 6".

Assumed members held (from ~12 buys, 6–8 of them members): end of round I 1–2 cards (2–3 bodies), round II 3–4 cards (5–7 bodies), round III 5–6 cards (8–10 bodies). At 2 players a player sees more of the row per turn, so add about 1 card in round III.

## Actions

### Round III: Bumper Crop
"Each of your members brings you 2 of its color (at most 10). +1 yellow."
- Walk-away: round III, 8–10 bodies → **11** (the cap) at 2 and 4 players, spread over your cult's colors (and a likely contest lead in your main color). A thin cult of 3–4 bodies gets 7–9.
- Wanted beyond the specialist: any cult with members takes it, and the trailer picks first. Cap 10 per brief rule 4; it's the top of the band, the anchor's size.
- Green copy: flagged so the copier does it themselves (it reads the taker's cult; a replay would pay the copier the taker's colors).

### Round II: Potluck (kept, recounted)
"Each of your members brings you 1 of its color (at most 6). +1 yellow."
- Walk-away: round II, 5–7 bodies → **6–7**; round III → **7** (the cap). Same at 2 and 4 players. Cap 6 sits it beside Shake Down and Fast Forward in round II.
- Changes what you can buy next (colored parts in your cult's colors) and which contests you're in.
- Green copy: flagged, copier does it.

### Round II: Feast
"+1 follower per member you have that isn't yellow (at most 6). +1 yellow."
- Walk-away: round II, 3–5 non-yellow bodies → **4–6** (followers that need no buy and can't be stolen); round III → **7** (the cap). The cap is a foreman fill-in: under bodies, a Mob alone is 5 followers off the space.
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

### Round I: Harvest (plain, scales by round)
"+1 yellow × round. +1 yellow."
- Walk-away: **2 / 3 / 4** at 2 and 4 players. All yellow: the yellow contest's fuel, the reliable one, like Red's Gather. The per-member Harvest went: it was Tithe in yellow (gate conflict 3), and Yellow already has three members counters.
- Green copy: replays the taker's gain. No flag.

Round I trio: Top Up spreads, Trade Seeds reshapes, Harvest builds yellow. Similar totals, different side effects, all still 4ish in round III. Top Up and Harvest share the "× round" size but differ in where it lands (your fewest color vs yellow).

## Contest
Most yellow held (the default). Yellow comes from the +1s, Harvest, Trade Seeds and your yellow members on Potluck and Bumper Crop. A Yellow cult of yellow members holds the contest; a mixed cult collects Feast and spends its yellow. That's the hold-or-spend split, on the color's own verb.

## The deck (5 cards; 5 slots open for Cory)

What a specialist earns in yellow in a game (guess): about 7 from the +1s on ~7 Yellow spaces, 5–6 more from Harvest, 1 from Trade Seeds, 2–4 from yellow members on Potluck and Bumper Crop: **about 14–17 yellow**. The five colored parts below total 12, so buying three or four of them eats most of what you'd hold for the yellow contest.

| Card | Cost | Worth | Text | Why this price |
|---|---|---|---|---|
| Sprouts | 1+1 | 2 | When recruited: +1 of your fewest color. | Cheap body at Crew's price plus Top Up's kick: 2.6 + 1 for 2 in round I. In this color every body is +2 on Bumper Crop, so the cheap worth-2 card is the specialist's fuel. Open Door's natural pick |
| Convert | 2+1 | 2 | When recruited, pick a color: it's a member of that color. | Fits any build: one more member for a color counter (Mob, Chronicler), a member contest, or Potluck's payout in the color you lack. 2.6 of body + about 1–2 of fit, for 3: 1.2–1.5. Choice made on arrival and kept (a cube on the card); if taken, it keeps its color |
| Go-Between (kept) | 2+2 | 1 | Whenever you recruit a non-yellow member, +1 of its color. | Live card, on your own turn, table-proof. Fires 3–5 times: 1.3 + 4 for 4, about 1.3 |
| Rainmaker (Cory liked; "should cost more") | 3+3 | 2 | Once per game: raise one of your colors to match your yellow. | Round III yellow 6–8, target 0–2: +5–7. 2.6 + 6 for 6, about 1.4, the same at 2 and 4 players. Alternative in pick 3 |
| Chefs (Cory's call) | 4+3 | 3 | When recruited: each of your members brings you 1 of its color. | Potluck on arrival, counts itself (3 bodies). Round II with 6 bodies: 6 + 3.9 for 7 (1.4); round III with 10: 10 + 3.9 (2.0). Flag: under bodies it outruns Potluck's cap of 6 in round III; "(at most 6)" like Potluck would match, but the card is his call, so it's his to cap. Gets better the later you buy it (Treasurer's shape). 7 is cheaper than Feastmaker's 10 |

Ladder 2, 3, 4, 6, 7. Printed followers 10 across 5 cards (3 worth 2+).

Every card stands alone: Yellow's spaces count all your members, any color, so no yellow card needs another yellow card to show up (a committed player owns about 3–5 of a color at 4 players).

Open slots and why: the scorer slot (Cory's own idea, "+2 per color you have a member in", counts table colors and is half as good at 2 players; Melting Pot, "+1 follower per non-yellow member", is the table-proof version but repeats Feast), a top card at 8–10, and a card that plays off rivals. Nothing I found was good enough to fill them.

Cut from the anchor pitch, with the reason:
- Diplomat ("contests you tie pay you in full"): tie card; ties all score (Oct 16).
- Gossip ("+2 of the color the follower leader holds most of"): two lookups, a riddle.
- Granary ("+1 follower per resource in your second-largest color"): can't be tracked while playing, and a trap at 7. Melting Pot considered for the slot; see above.
- Field Hands (plain worth 3 for 3): the fourth such body tonight.
- Fieldworker ("+1 follower when you take a Yellow space"): the template drip three other decks have.
- Orchard (round-start Potluck): a name collision with Green's space, and a slight variation of Chefs.

Cut from live (all count table colors, or are drips on rivals' turns): Peddler, Admirer, Dyer, Late Bloomers' "+1 of each color", Pilgrim, Weaver, Explorer, Feastmaker (becomes Chefs).

Board rules check: no tie card, no out-of-turn buy, no turn-moving source, nothing re-fires income. Red re-firing Chefs's "When recruited" with a swap pays its owner another Potluck (about 6–10 under bodies): that's Red's verb working, flagged only. Overlap: Gold's final dropped Gold Standard, so Rainmaker's "match" verb is Yellow's alone among the spaces and cards here; White direction 1's "tie its leader" is the one Cory may call a variation (gate conflict 6).

## The alternative: Dye (yellow-outsider A)
- What it is: Yellow changes what color a pile is. Fade (round II, "up to 3 of a rival's resources of one color turn yellow; gain that many of that color", obeying "can't be stolen from"), Potluck, and Top Up, Harvest and Trade Seeds in round I.
- Pricing and the skeptic rated it highest: every gain reads your own pile, so it's the same at 2 and 4 players, with the cleanest bands.
- It would go without Pour (it overlaps Cory's Launderer), Dyer (it is Launderer) and Chameleon (one pile in two contests, hard to show), which leaves it needing a new round III burst.
- It ranked second because Cory didn't open up Yellow's identity, Fade is confusing to receive ("did she steal from me?"), and it barely answers "Yellow doesn't want members".

## Picks for Cory
1. Yellow becomes "your members bring their colors": round III "Each of your members brings you 2 of its color (at most 10)", or repainting resources (Dye) [members].
2. Feast, new round II: "+1 follower per member you have that isn't yellow (at most 6)" [yes].
3. Rainmaker: "Raise one of your colors to match your yellow" at 6, or keep "raise each of your colors" at 9 [one color].
4. Convert: "When recruited, pick a color: it's a member of that color" [yes].
