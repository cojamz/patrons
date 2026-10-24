# Yellow: abundance (Claude's build, 2026-10-14, for Cory to answer by number)

Built from the old yellow quadrant ("getting various resources"). Code: `src/engine/v4/content/yellow.js`, tests: `src/test/engine/v4/spheres/yellow.test.js`, sims: `scripts/spheres/yellow-*.mjs`. Not on the default table; it registers itself in its tests and scripts.

## The idea
Yellow gathers every color and keeps them balanced: it scores on full sets (one of each color held), so you're torn between holding your rainbow to round end and breaking it to buy 6 followers, which needs 3 colors.
Gold piles up one color; Red buys many cheap members. Yellow cares about the shape of your pile, not its size, and it hands every color out, so it feeds every other sphere's members and the follower buys.

## The list (answer by number)
1. Scoring: "Most full sets (your smallest color)". A full set is one of each color you hold; you need 1 to score; yellow breaks ties. Visible state: anyone can count it. Rulebook line: Gold is not wild for sets.
Ring I (anchor: Joint Venture +3 for you, Rush 2/4/6)
2. Harvest: +1 yellow, plus 1 per other color you hold. Early: 2 other colors → +3. Late: 3 → +4 (it can't go above 4).
3. Bloom: +1 of each color you have none of. Early: missing 3 → +3, and it always completes a set (the round-I lure). Late: missing 2 → +2.
4. Transmute: swap up to 3 of your resources for other colors, then +1 yellow. Early: about +1 plus a fixed color. Late: +1 and up to 3 fixes, often a whole set. The weak, flexible pick.
Ring II (anchor: Steal 3, Windfall about +5 in round II and +8 in round III)
5. Prism: +1 of each other color per 3 yellow you have (you keep the yellow). Round II: 3 yellow → +3, or 6 banked → +6. Round III: 6 yellow → +6.
6. Gather: each of your members brings you 1 of its color. The same count as Windfall (+5 / +8), spread across colors.
Ring III (anchor: Strike; it doubles gold held, measured +10 median, +12 average, +19 at the 90th percentile)
7. Flourish: +1 of each other color per full set you hold. Measured 3 sets when taken → +9 (+15 at the 90th percentile). Just under Strike.
Members (cost = yellow + any)
8. Gardener (1): at round start, +1 of each color you have none of.
9. Peddler (1+1): at round start, +1 of each other color.
10. Pilgrim (1+1): when recruited, +1 of each color.
11. Late Bloomer (1+1): at round start, if you have the fewest followers (ties count), +1 of each color.
12. Sower (1+1): round start, plant any of your yellow; round end, gain that many of each other color.
13. Admirer (2+1): whenever a rival recruits a member of a color you have none of, +1 of that color.
14. Dyer (2+1): at round end, +1 yellow per color you hold.
15. Farmer (2+1): whenever an action gains you yellow, +1 more.
16. Weaver (2+1): whenever you buy 6 followers, +1 of each color.
17. Rainmaker (2+1): once per game, raise each of your colors to match your yellow.
18. Harmonist (3+1): game end, +1 follower per full set you hold.
19. Go-Between (2+2): whenever you recruit a non-yellow member, +1 of its color.
20. Explorer (2+2): whenever you take a space outside Yellow, +1 yellow.
21. Gleaner (3+2): whenever an action gains you 2+ of another color at once, +1 yellow.
22. Feastmaker (3+2): once per game, +1 of each color per round number.

## Extra ideas (one line each)
Ring I
23. Forage: +1 of each other color (your raw old Forage, made into a set-maker).
24. Share: +2 of a color you choose; every other player +1 of it.
25. Even Out: raise your smallest color to match your second smallest.
Ring II
26. Spectrum: +1 of each color per different color among your members.
27. Barter: give a rival 1 of any color; gain 3 of colors you choose.
28. Abundance: +1 of each color you hold, for you and the player with the fewest followers.
Ring III
29. Cornucopia: raise every color to match your largest (measured: far too strong with Gold piles; would need a cap).
30. Rainbow: +3 of each color you have the least of.
31. Bounty: everyone gains 1 of each color; you gain 1 of each per full set.
Members
32. Painter: your yellow counts as any color when you buy followers (needs a small engine change, below).
33. Matchmaker: whenever a rival completes a full set at round end, +1 yellow.
34. Twins of Dawn: counts as 2 members of 2 colors you choose.
35. Patron Saint: once per round, swap 2 of your resources for any colors.
Scoring alternatives
36. Most different colors held (0–4): simpler, but ties all the time (everyone holding 4 shares the full prize).
37. Most of your smallest color (same as full sets, phrased differently).
38. Fewest gaps: most colors where you hold 3+.

## Critic notes on members, for Cory (members unchanged until you say)
39. Clones of Gold cards: Farmer ≈ Prospector, Go-Between ≈ Coin Purse, Gleaner ≈ Tinker, Dyer ≈ Diversifier, Sower ≈ Investor. Cut or reshape them?
40. Admirer fires for the wrong player (it rewards your gaps, not rival play). Replacement: "Whenever anyone recruits a yellow member, +1 yellow."
41. Gardener does nothing for a Yellow player, who rarely lacks a color. Cut it?
42. Rainmaker overlaps Prism (both turn yellow into other colors). Cut it?
43. Sower is fiddly (plant, then wait for the payout). Cut it?
44. Peddler, Pilgrim, Late Bloomer, Weaver and Feastmaker all say "+1 of each color": samey. Keep two at most?
45. Too many small +1 triggers (Farmer, Explorer, Gleaner, Go-Between, Admirer). Merge them into fewer, bigger cards?
46. Twist worth keeping: Yellow's own members cost yellow, so recruiting from your own sphere breaks your own sets. Every Yellow member has a yellow part of 1–3, which protects that.

## Measurements (greedy bots unless noted; table gold/red/yellow/green vs the current gold/red/blue/green)
- 30 unit tests pass; 200 seeded bot games (2–4 players) finish with every invariant holding.
- 400-game balance after the action redo: seat wins 24/27/27/23%. Avg followers 43.4 (blue table 48), members 11.4 (10.9). Unspent resources at the end 35 (was 42; blue table 25). 6-follower buys 6.8 a game (blue 7.5).
- Action use per game: Harvest and Gather always taken; Bloom always in rounds I–II; Transmute always in round I, about half the time in round II; Flourish 96%; Prism rarely in round II (7%), 66% in round III. Bots don't bank yellow.
- Sets contest: nobody scores in 75% of round I, 42% of round II and 3% of round III. Bloom hands the round-I picker a set, but greedy bots spend it the same turn. A human holding it takes the +2: that's the hold-vs-spend choice working, and bots can't play it.
- Tried "yellow can fill one gap per set" (a looser rule): round I is still 69% unscored with bots. Not worth the extra rule, so I kept the strict rule.
- Member values below were measured before the action redo. Members are unchanged.
- Member value (200 games each, the card handed to a seat at round II start): Feastmaker 6.8, Gleaner 6.1, Go-Between 6.1, Harmonist 5.8, Dyer 5.1, Admirer 5.0, Farmer 4.7, Explorer 4.3, Pilgrim 3.8, Peddler 3.6, Weaver 3.4, Sower 3.3, Rainmaker 2.9, Late Bloomer 2.9, Gardener 2.7. Same table, same method: Banker 4.4, Coin Purse 5.5, Speculator 5.6, Recruiter 7.0, Tycoon 13.6.
- Cut by the numbers earlier: Admirer paying on every rival recruit (18.6), Harmonist at +2 per set (18.3), Rainmaker "match your largest" (17.0).
- Thinking bot (24 games, before the redo): wins 58%, margin +2.3, vs 63%, +7.0 on the blue table. It used Yellow less than greedy bots did.

## What to watch / can't measure
- The round-I and round-II sets contests depend on players choosing to hold. That needs one live test with people.
- Unspent resources are still above the blue table. If it feels like waste, Gather goes to 1 per 2 members next.
- Transmute needs a small swap panel in the UI (up to 3 swaps).
- Engine: Weaver tells the 6-follower buy apart with a bigLeft workaround. The clean fix is onBuyFollowers(ctx, owner, card, buyer, tier). Painter (32) would need a per-player "counts as any color for follower buys" member flag in wildColors. The green stand-in hands out blue, which is dead on a table without Blue.

## Notes for when Yellow reopens
- (Cory, 2026-10-22 playtest) "Peddler and Pilgrim too similar - send that to yellow." Peddler: "Now and at round start: +1 of each color." Pilgrim: "When recruited: +1 of each color." No card change until Yellow reopens.
