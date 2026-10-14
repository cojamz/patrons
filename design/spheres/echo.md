# Green: the echo (Claude's build, 2026-10-14)

Built and measured as `src/engine/v4/content/echo.js` (tests: `src/test/engine/v4/spheres/echo.test.js`; sims: `scripts/spheres/echo-*.mjs`). On the table it replaces the green stand-in.

## The idea
Green copies the table's best moves: a rival's space, your own space again, last round's space, or every space you took. Gold makes its own money and Red recruits many cheap members; Green makes almost nothing of its own. It waits for someone else to hit big, then takes the same haul, so its draft question is "will that echo still be open after the big move lands?"

How an echo works (core rule): you get exactly what the original taker got from that space: same resources, same discount. A free member copies as "any face-up member costing no more, free". Echoes can't be echoed, and the center can't be echoed. Each taken space shows a chip with what it gave, so you can see what's on offer.

## For Cory (answer by number)
Costs are green + any.

**Scoring**
1. Most green at round end. Green comes from Hum and members; Translator turns copies into green.

**Ring I**
2. Hum: +3 green.
3. Echo: copy what a rival got from an outer-ring space this round.
4. Relive: copy what you got from one of your outer-ring spaces this round.

**Ring II**
5. Encore: copy what anyone got from any space this round (not the center).
6. Recall: copy what anyone got from any space last round.

**Ring III**
7. Eternity: copy every space you took this round.

**Members** (one copy each; costs set from the member-value sim)
8. Muse (1+0): whenever a rival copies one of your spaces, +2 green.
9. Evergreen (1+1): at round start, +3 green.
10. Choir (1+1): whenever you copy a space, +1 green.
11. Fan (1+1): whenever a rival takes a center space, +2 green.
12. Tuning Fork (1+1): whenever you copy a space, also gain 1 of that space's color.
13. Wallflower (1+1): while no one has fewer followers than you, the resources you copy are doubled.
14. Choirmaster (2+1): whenever a rival copies a space, +1 green.
15. Groupie (2+1): whenever anyone recruits a green member, +1 green.
16. Translator (2+1): what you copy comes as green. Switch it off or on when you buy.
17. Keepsake (2+1): when recruited, copy one of your spaces from this round.
18. Mirror (2+1): when recruited, gain as much green as the rival with the most green.
19. Afterimage (2+1): at round start, copy one of your spaces from last round.
20. Chronicler (2+1): at game end, +1 follower per 2 green.
21. Hourglass (3+2): once per round, copy the space you just took.
22. Déjà Vu (3+2): once per game, copy every space you took this round.

## Value math against the anchors
Yields are measured over 400 greedy-bot games: resources, plus 2.5 per free member. Anchors on the same table: Joint Venture 3.0 / 3.3 / 3.5, Rush 2 / 4.4 / 6.7, Turnout 4.0 / 5.4 / 7.2, Windfall 5.4 / 8.7, Steal 3.3, Strike 15.6.
- Hum: a flat 3, the same as Joint Venture. It goes flat in rounds II and III (3.4), so it's the consolation pick.
- Echo: worth the best outer-ring space a rival has taken so far, 3.1 / 6.2 / 9.0. That's in band in round I, but about +1 over Turnout in round II and +2 over it in round III. **Above band late.**
- Relive: the same shape, 3.1 / 6.1 / 9.2. **Above band late.**
- Encore: 5.8 / 10.3 against Windfall's 5.4 / 8.7, so about +1.5 in round III. **Slightly above.**
- Recall: 4.4 / 7.7, under Windfall. In band.
- Eternity: 10.4 against Strike's 15.6. A burst, and under the anchor.
- Why it's less than it looks: copies add raw resources, and you only get one buy per turn. Players hold 45 resources at game end on this table, against 25 on the stand-in table. The thinking bot put only 14% of its workers on Green (greedy bots put 33%), and it won 88% of its games. Greedy bots chase echo yields they can't spend.

## Extra ideas (one line each)
**Ring I**
23. Hum, scaling: +2 green per round number.
24. Overhear: copy the last space a rival took. (Measured: as strong as Echo; no choice to make.)
25. Duet: copy a rival's outer-ring space; they gain 1 green too.
26. Trim for Echo and Relive: pay 2 of anything to copy. This brings round III back to about Rush.

**Ring II**
27. Chorus: copy a rival's space; they gain 2 green.
28. Refrain: copy one of your spaces from last round, +2 green.
29. +1 green on every copy action. (Built and measured: about +1 on every echo yield. No dead echo spaces, and echoing feeds the contest.)

**Ring III**
30. Grand Echo: copy every space one rival took this round.
31. Crescendo: copy the best space taken this round, three times.
32. Eternity, capped: copy your 3 best spaces this round.

**Members**
33. Impostor: becomes a copy of a rival's member.
34. Straggler: at round start, +2 green per player with more followers. (Built and cut: it measured +0.1.)
35. Memory: your copies can also reach last round's spaces.
36. Encore Artist: at game end, +1 follower per green member.

**Other scoring rules** (all measure what players hold)
37. Echo pile: what you copy goes in a pile in front of you; the biggest pile wins, and it joins your supply next round.
38. Most green members.
39. Your deepest stack (most of any one color). Risk: the gold hoarder wins it too.

## Measurements
Greedy bots, 4 seats, gold/red/blue + Green.
- **Seat balance (400 games):** 24 / 25 / 23 / 28 by seat, and 26 / 22 / 22 / 31 by round-I pick order. The stand-in table is 22 / 20 / 24 / 35. Followers average 44.7 against 48.0, and the first-to-last gap is 20.8 against 18.8.
- **Most green contest:** nobody scored 16% of the time; it was shared 12%. It went to the follower leader 21% and to last place 34%. The same player won it in back-to-back rounds 61% of the time, and the game winner won it at least once in 63% of games. It doesn't feed the leader, but it is sticky: about 3 green is enough to hold it.
- **Action use:** every Green space is taken about once per round it's open, except Hum, which is about 0.96 in rounds II and III.
- **Member value** (+followers when handed over at round II start, 120 games each, same table): Déjà Vu 8.3, Hourglass 7.3, Groupie 5.8, Choirmaster 5.7, Keepsake 4.0 (handed over mid-round), Chronicler 3.6, Translator 3.3, Choir 3.2, Tuning Fork 2.7, Mirror 2.6, Afterimage 2.4, Wallflower 2.3–4.0, Muse 2.3, Fan 1.9–2.2, Evergreen 1.6–2.2. References: Tycoon 11.5 (cost 6), Speculator 4.0 (4), Banker 2.8 (2), Host 2.6 (3). Fan was first "a rival's space gives them 5+": that measured 8.0, so it now triggers on center spaces.
- **Thinking bot (24 games):** won 88% (the stand-in table was 56% in an earlier 16-game run), with a margin of +14.5. It plays Green sparingly and late, mostly Echo in round I and Recall/Relive in round III. Planning pays a lot here. Part of that is greedy bots over-taking echoes.
- **Can't measure:** whether people enjoy reading the chips; Translator's switch (bots never toggle it); Afterimage fires only once in the round-II hand-over test, so it's under-measured; Muse and Choirmaster depend on how often rivals copy, and bots copy every round.

## Watch
- Echo, Relive and Encore run about 1.5–2 over their ring in round III. Trim 26 is the cheap fix if Cory wants it.
- Resources pile up unspent. That's an echo table's signature, but it may feel like "my copies did nothing".
- The contest is cheap to hold, so green trickle cards (Groupie, Choirmaster) are worth more than they look. They're priced at 3.

## Engine changes this needs (not made; content shims for now)
1. A yield ledger in core.js. In the `act` task, snapshot the taker (resources, discount, member list). When that player's `buy` task starts, store the difference on `state.yields[slot] = { p, ring, res, discount, members:[costs], echo }`. Keep last round's ledger too. echo.js fakes this today by wrapping every action's `resolve` and every handler (`install()`).
2. The same one-liner thieves.js needs: pay a member's colored part from `quadrant(def.quadrant).resource`, not `p.res[def.quadrant]`. echo.js relabels its members' quadrant as 'green'.
3. The UI shows each taken space's yield as a chip, plus last round's chips for Recall and Afterimage.
