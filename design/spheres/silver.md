# Silver: the host (built and measured, revised after critic, 2026-10-14)

Built from old v0 silver (Cory likes it): big gains for you, a little for everyone else.
Module: `src/engine/v4/content/silver.js` · tests: `src/test/engine/v4/spheres/silver.test.js` · sims: `scripts/spheres/silver-sim.mjs`, `silver-value.mjs`, `silver-thinker.mjs`.
Tested in place of the green stand-in: gold / red / blue / silver.

## The idea
Silver throws parties: every Silver space pays you more than its ring and hands a crumb to everyone else. The real choice is the crumb itself: when you host, which color you hand out (it lifts everyone's count in that color's contest), and which rival gets your alms.
Gold takes from the table and sits on it; Red grabs many cheap members; Silver grows by feeding the table, and its members pay the host for hosting.

## For Cory (answer by number; cost = silver + any)
1. Scoring: most silver at round end. You can see it on the table; the crumbs keep rivals in the race.
2. Ring I, Toast: +3 silver per round number (3 / 6 / 9), and everyone else +1 silver.
3. Ring I, Gift: +2 silver and +2 of another color; everyone else gets 1 of that color.
4. Ring I, Alms: +4 silver, and a rival you choose gets 2 of a color you choose.
5. Ring II, Silver Tongue: +4 silver, then swap any of your silver into one other color, one for one; everyone else +1 silver.
6. Ring II, Rising Tide: everyone else +1 silver, then gain half the richest rival's silver.
7. Ring III, Jubilee: +1 follower per 2 silver you hold (you keep the silver); everyone else +2 silver.
8. Caterer (1+1): whenever you give something to other players, +1 silver.
9. Steward (1+1): at round start, +1 silver per 3 silver you hold.
10. Retinue (1+1): worth 2 followers. When recruited, everyone else +1 silver.
11. Benefactor (2+1): at round start, +3 silver, and a rival you pick gets 1 silver.
12. Majordomo (2+1): whenever you take a Silver space, +2 silver.
13. Silversmith (2+1): whenever an action gains you silver, +1 more.
14. Feast Hall (2+1): when recruited, +2 silver per round number.
15. Silver Spoon (2+1): when recruited, gain silver equal to the most silver any rival has.
16. Guest (2+2): whenever another player gives you something, +1 more of it.
17. Toastmaster (2+2): whenever you take a Silver space, +1 follower.
18. Gala (2+2): once per game, double your silver, and everyone else +2 silver.
19. Dowager (2+2): worth 3 followers.
20. Heir (3+1): at the start of round III, +1 silver per member you have.
21. Grand Host (4+2): Silver spaces give you twice the silver.
22. Patron Saint (4+2): game end, +1 follower per 2 silver members in play, anyone's.
23. Cut: Feast (flat; Toast replaces it), Banquet (Silver Tongue takes its slot), Hanger-On, Confidant, Socialite, Ambassador, Diplomat, Almoner (overlapped Benefactor).

## Arithmetic per action (4 players; "table" = what the other three get combined)
Anchors: ring I is Joint Venture (3, plus 1 to one rival) or Rush (2 / 4 / 6); ring II is Steal 3 or Windfall (about 4 in round II, 8 in round III); ring III is Strike (doubles about 15 gold, so about 15).

| Action | You, round I/II | You, round III | Table | Measured (incl. members) | Anchor |
|---|---|---|---|---|---|
| Toast | 3 (II: 6) | 9 | 3 | 7.4 | Rush 2/4/6, measured 4.9 |
| Gift | 4 | 4 | 3 | 5.0 | Joint Venture, measured 4.4 |
| Alms | 4 | 4 | 2 to one rival | 5.2 | Joint Venture |
| Silver Tongue | 4 + a free color swap | same | 3 | 5.6 | Steal 3 / Windfall |
| Rising Tide | 3–5 | 6–8 | 3 | 10.4 | Windfall, measured 8.4 |
| Jubilee | — | 6–7 followers (≈12–14), silver kept | 6 | 15.4 | Strike, measured 18.1 |

## Extra ideas (one line each)
Ring I
24. Feast (cut above): +4 silver, everyone else +1 silver.
25. Open Table: you and everyone else gain 1 of each color; you gain 2 more silver.
26. Sponsor: +2 silver, and put 2 silver on an empty space; whoever takes it gets them. (needs an engine hook)
Ring II
27. Banquet (cut above): +3 silver and +3 of another color; everyone else gets 1 of it.
28. Matchmaker: give a rival 2 of a color; you gain 5 of it.
29. Shared Purse: +1 silver per member you have; everyone else +1 silver.
Ring III
30. Grand Feast (old v0): +8 followers; everyone else +3 silver.
31. Coronation: double your silver; everyone else +2 silver.
Members
32. Silver Tongue as a member: you may pay silver for any member's colored part. (needs a one-line engine change; the ring-II action is the stand-in)
33. Plus-One: whenever you're given silver, also gain 1 of any color.
34. Chaperone: your gifts to everyone skip the leader.
Scoring (all visible state)
35. Most resources held, all colors counted (the biggest pantry).
36. Most silver, but only up to your member count (a host needs a table).
37. Most silver members.

## Measurements (greedy bots unless noted)
- 1000 games, 4 players: seats win 25 / 25 / 26 / 25%. Average followers 47.2 (baseline 48.0), winner 58.5.
- Silver spaces are taken every round (Rising Tide 0.8 in round II). The player who took the most Silver spaces won 35% of games (was 27% before the revision; 25% = neutral).
- Spill ratio (everyone else ÷ host) 0.46, down from 0.64. Alms went to the eventual winner 21% of the time (25% = neutral), so the free "whom" choice shows no kingmaking with bots.
- Most-silver contest: nobody scored 1%, shared 18%, one player swept all three rounds 18%. It's about 4.5 of a winner's 58 followers.
- Glut: stock at game end is 58 per player (64 before, 25 baseline). Silver itself fell from 18.6 to 13.8. Most of the rest is gold (about 33 per player): bots pay "any" costs with other colors first and hold gold for the Crown, so Silver's crumbs end up paying bills while gold piles up. The outlet isn't missing; the one-buy-a-turn limit is the cap. A human table may feel it less, but Silver adds resources to the table.
- Member value (handed over at round II start, 160 games each, noise about ±1.5): Grand Host 9.3, Patron Saint 8.4, Heir 7.2, Toastmaster 6.8, Majordomo 6.4, Guest 6.3, Feast Hall 6.0, Dowager 5.8, Gala 5.5, Silver Spoon 4.9, Silversmith 4.8, Benefactor 4.4, Caterer 4.4, Steward 4.0, Retinue 3.6. Same harness: Tycoon 11.6 (cost 6), Big Family 5.5 (4), Merchant 4.0 (3), Speculator 3.7 (4), Banker 1.2 (2). Prices above follow these.
- Thinking bot (1 thinker vs 3 greedy, 24 games, 4 rollouts): the thinker won 21 of 24 (88%), by about 15 followers on average, and put 21.5% of its workers on Silver (14% before the revision; greedy bots 31%). Control on the green table, same harness (12 games): it won 6 of 12 (50%) and put 15% on the stand-in quadrant. So hosting is no longer a sucker's play for the planner, but planning pays far more on a Silver table than on the baseline, and the bots can't show why. My guess: greedy bots hand out crumbs without reading the contests, and a planner reads them.

## What to watch
- A planner beats greedy bots 88% of the time on this table vs 50% on the baseline. Before Cory's playtest, check that it isn't one degenerate line (for example, sit as a guest and take Jubilee).
- Toast pays 9 in round III, more than Rush's 6. That's on purpose, to lift the host's share, but it's the first thing to trim (3 / 5 / 7) if the host runs away.
- Jubilee plus Gala (double, then 1 follower per 2) and Grand Host plus Toast (18 silver in round III) are the big combos.
- Bots can't judge the crumb choice: which color to hand out and whom to give alms to run on a simple rule, so the sphere's core decision isn't measured.
- The blue stand-in's Shoal gives green, which isn't on this table, so blue is slightly weak in these runs.
- Engine changes I'd want: (a) let members pay a colored part in silver (Silver Tongue as a member, idea 32): in paymentPlan and memberPayOk, let a flagged color stand in for the card's color. (b) A gift signal on ctx.gain (`{ from: giver }` plus an onGiven hook), so Guest also fires on Joint Venture. (c) A hook when any player takes any space (idea 26).
