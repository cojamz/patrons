# Balance pass 1 (2026-10-15)

The first reprice from measurement. Instrument: the balance bench's first full run (claude/cults-bench, design/eval/bench/latest.md, commit 669f85e): paired forced recruit and forced placement, Normal bots and Hard-20 bots (Hard at 20 simulated moves a decision), 38 random four-sphere tables, every anchor in range. "Fair price" = the cost at which recruiting the card nets 0 followers of margin. Prices are colored part + any.

Rules for this pass (Claude, under Cory's go-with-your-gut): reprice only where both bots agree (bench section 2), never a plain "Worth N" member (those keep Cory's old price), and never where the bots plainly misplay the card. New price = the midpoint of the two fair prices, rounded to the even cost grid, moved at most ×2 or ÷2 in one pass. The colored part keeps its share of the price, rounded to even (the bench report's split rule).

## What changed (9)

| card | sphere | text | old | new | Normal fair [90%] | Hard-20 fair [90%] |
|---|---|---|---|---|---|---|
| Banker | Gold | Now and at round start, +3 gold. | 4 (2+2) | **8 (4+4)** | 7.7 [6.5–9.2] | 9.0 [4.8–12.9] |
| Busker | Green | Now and at round start, +3 green. | 4 (2+2) | **8 (4+4)** | 8.8 [6.3–11.7] | 7.4 [5.2–10.7] |
| Peddler | Yellow | Now and at round start, +1 of each other color. | 4 (2+2) | **8 (4+4)** | 8.1 [5.9–10.7] | 6.7 [4.2–9.7] |
| Extortionist | Magenta | Whenever a rival buys 6 or more followers, take 2 resources from them. | 6 (4+2) | **10 (8+2)** | 11.0 [8.8–13.6] | 9.0 [6.2–12.4] |
| Tycoon | Gold | Game end: +1 follower per 3 gold. | 12 (8+4) | **6 (4+2)** | 4.9 [3.3–6.4] | 7.5 [3.2–11.7] |
| Patron Saint | Silver | Game end: +1 follower per 2 silver members in play, anyone's. | 12 (8+4) | **6 (4+2)** ¹ | 3.7 [1.6–5.8] | 4.6 [1.6–7.4] |
| Toastmaster | Silver | Whenever you take a Silver space, +1 follower. | 8 (4+4) | **4 (2+2)** | 4.6 [2.8–6.7] | 5.3 [3.3–7.5] |
| Magnate | White | Game end: +1 follower per 3 white. | 8 (4+4) | **4 (2+2)** | 3.6 [1.7–5.5] | 3.6 [−0.1–6.7] |
| Corner-Cutter | Purple | Extra turns you pay purple for cost you half (rounded up). | 6 (4+2) | **4 (4+0)** ¹ | 2.3 [0.4–4.2] | −0.2 [−4.4–3.6] |

¹ Held by the one-pass limit (midpoints 4.2 and 1.1): the next bench run says whether they go lower.

The three "now and at round start" cards got their "now" on 2026-10-14 with prices left for the fair-price screen to check; this is that check (the dead-window audit had already read Banker at 9 gold for 4 when recruited in round I). The three "game end: +1 per 3" cards and Patron Saint only pay on what one buy a turn can't absorb, since the 10-follower buy is unlimited at 1 for 1.

## Flagged, not changed

- **Investor** (Gold, 6, "Round start: set aside any of your gold. Round end: it comes back doubled."): 1.9 / 1.6. Both bots set aside exactly half every round (the choice's default), and a person who sets aside everything doubles it. A bot reading, not the card; judge it in play.
- **Midas** (Gold, 8, "Gains from actions come as gold instead. You can switch it off or on when you buy."): 1.1 / 3.0. Neither bot ever switches it off (the switch isn't among either bot's options), so every gain stays gold for the rest of the game, including the colors its owner's members and contests need (net −17 followers when recruited in round I, Normal). The bots misuse it; a person flips it.
- **Green Pillar** (stand-in Green, 6 = 3+3, "Worth 5 followers."): 2.8 / 1.4, too dear. A plain member, so it keeps Cory's old price, and Green is a stand-in sphere.
- **Tax Collector** and **Upstart**: both bots read them at more than twice their price, so a price can't fix them in one pass; rewordings below.
- Corner-Cutter's split came out 4+0, so a Release hands back all 4 purple (as Treasurer's 4+0 does).
- Extortionist's 8 magenta is now the biggest magenta part in the game, and magenta comes only from steals: watch whether anyone can pay it (the bench probed it at 7+3).
- The bench's anchors include Banker (4) and Tycoon (12). Their ranges are absolute, so the next run stays valid, but the anchor notes in scripts/v4-bench.mjs and the bench README quote the old prices, and Tycoon is no longer "known weak". Update on claude/cults-bench.
- Banker (Gold) and Busker (Green) are on the friends' default table (Classic).
- Not acted on: the 6 cards and 6 space-rounds that only Normal flags while Hard-20 confidently doesn't (likely Normal's blind spots), and Normal's long tail where Hard-20 was too thin to say.

## For Cory (answer by number; my default in brackets)

Rewordings for the two cards a price can't fix, then the four spaces both bots flag. Card values are fair prices in cost points; space values are the bench's scaled units (u) against the value model's ring bands (round I 2–3u, II 3–5u, III 5–9u). Gold and Red are your designs; these are only proposals.

1. **Tax Collector** (Gold, 4: "Whenever a rival buys followers, +1 gold."), 8.7 on both bots: "Whenever **the rival with the most followers** buys followers, +1 gold." One rival in three pays it, so about a third of its 7.5 of ability is left (2.5), plus its follower: about 4, its price. [yes]
2. **Upstart** (Silver, 6: "When recruited, gain silver equal to the most silver any rival has."), 12.1 / 12.9, almost all of it from a round-III recruit (+13.9 followers net, Normal) that ties the silver leader for the +6: "When recruited, gain **half** the silver of the richest rival (rounded up)." (Rising Tide's rule). About 5.5 of ability plus its follower: about 6.5, its price. [yes]
3. **Shake Down** (Magenta, ring II: "Pick a rival's member costing 6 or less. They pay you its cost to keep it, or it's yours."), 10.4u / 12.0u in round II against 3–5: "costing **4** or less." Bots let a 6-cost member go (a member worth about 7.5u to the thief) and pay to keep a 4-cost one, so the haul drops to about 4 magenta: about 5u. Both bots answer the ransom with the same rule, so part of today's reading may be the bots. [yes]
4. **Plan Ahead** (Purple, ring II: "+2 purple per minion you have left to place this round."), 20.3u / 19.0u in round III against 5–9 (round II 8.2u / 13.0u against 3–5): "**+1** purple per minion you have left to place this round." Roughly halves it: about 10u in round III, 4–6u in round II. [yes]
5. **Crunch Time** (Purple, center: "Spend all your purple: 1 extra turn right after this one per 4 spent, plus 1 (up to 3). With less than 4, +4 purple."), 19.7u / 22.9u against 5–9: "(up to **2**)". Overtime (8 purple for 2 extra turns) reads 12.8u / 11.1u in round III and isn't flagged, so this lands near 12u: still the strongest center, no longer double the band. [yes]
6. **Open House** (Red, ring II: "+2 red, and recruit the cheapest face-up member, free."), 8.4u / 10.0u in round II against 3–5 and 14.6u / 13.9u in round III against 5–9. It's your own "too strong" anchor, an extra recruit plus +2. Open Door, the same free recruit without the +2, reads 6.1u in round II and 8.7u in round III, unflagged: drop the +2 red and let it choose, "Recruit **a face-up member costing 4 or less**, free." About Open Door's level plus a pick. [yes]

## Tests

- Engine suite (npx vitest run src/test/engine/v4) on the live tree, before this pass: 716 of 717, the one failure the fire audit's silent members (Corner-Cutter, Admirer, Rainmaker recruited but never named), already there at b782ac3. After: see the report.
