# Silver: the host (built and measured, 2026-10-14)

Built from old v0 silver (Cory likes it): big gains for you, a little for everyone else.
Module: `src/engine/v4/content/silver.js` · tests: `src/test/engine/v4/spheres/silver.test.js` · sims: `scripts/spheres/silver-*.mjs`.
Tested in place of the green stand-in: gold / red / blue / silver.

## The idea
Silver throws parties: every Silver space is bigger than its ring for you, and hands a crumb to everyone else. The real choice is the crumb itself: when you host, which color you hand out (it lifts everyone's count in that color's contest), and which trailing player gets your alms.
Gold takes from the table and sits on it; Red grabs many cheap members; Silver grows by feeding the table, and its members pay off for whoever is at the party, host or guest.

## For Cory (answer by number)
Scoring
1. Most silver at round end takes the ring. (Spills are mostly silver, so the host's crumbs keep rivals in that race.)

Actions
2. Ring I, Feast: +4 silver, and everyone else +1 silver.
3. Ring I, Gift: +2 silver and +2 of another color; everyone else gets 1 of that color.
4. Ring I, Alms: +3 silver, and the rival with the fewest followers gets 2 of a color you choose.
5. Ring II, Banquet: +3 silver and +3 of another color; everyone else gets 1 of that color. (the strong Gift)
6. Ring II, Rising Tide: everyone else +1 silver, then gain half the richest rival's silver.
7. Ring III, Jubilee: +1 follower per 2 silver you hold (you keep the silver); everyone else +2 silver.

Members (cost = silver + any)
8. Guest (1+1): whenever another player gives you something, +1 more of it.
9. Benefactor (1+1): at round start, +3 silver, and a rival you pick gets 1 silver.
10. Caterer (1+1): whenever you give something to other players, +1 silver.
11. Almoner (1+1): at round start, +2 silver per player with more followers than you.
12. Hanger-On (1+1): whenever a rival takes a Silver space, +1 silver.
13. Socialite (1+1): at round start, +1 silver per rival who has any silver.
14. Retinue (1+1): counts as 2 members. When recruited, everyone else +1 silver.
15. Heir (2+1): at the start of round III, +1 silver per member you have.
16. Ambassador (2+1): whenever a rival recruits a silver member, +1 silver.
17. Diplomat (2+1): whenever you take a space outside Silver, +2 silver, and everyone else +1 silver.
18. Toastmaster (2+1): whenever you take a Silver space, +1 follower.
19. Silver Spoon (2+1): when recruited, gain silver equal to the most silver any rival has.
20. Gala (2+1): once per game, double your silver, and everyone else +2 silver.
21. Confidant (2+2): when recruited, pick a rival. Whenever they recruit, +1 silver.
22. Patron Saint (3+2): game end, +1 follower per 2 silver members in play, anyone's.

## Extra ideas (one line each)
Ring I
23. Toast: +2 silver per round number; everyone else +1 silver.
24. Open Table: you and everyone else gain 1 of each color; you gain 2 more silver.
25. Sponsor: +2 silver, and put 2 silver on an empty space; whoever takes it gets them. (needs an engine hook)
Ring II
26. Matchmaker: give a rival 2 of a color; you gain 5 of it.
27. Patronage of the Poor: +4 silver; every player with fewer followers than you gets 1 of a color they choose.
28. Shared Purse: +1 silver per member you have; everyone else +1 silver.
Ring III
29. Grand Feast (old v0): +8 followers; everyone else +3 silver.
30. Golden Age: everyone else +2 of a color you choose; you gain 2 of every color per player at the table.
31. Coronation: double your silver; everyone else +2 silver.
Members
32. Plus-One: whenever you're given silver, also gain 1 of any color.
33. Old Friend: free. When recruited, everyone else +1 silver.
34. Gossip: whenever a rival gains 4+ of one color at once, +1 of it. (needs an engine hook)
35. Silver Tongue: you may pay silver for any member's colored part. (needs an engine change)
36. Chaperone: your gifts to everyone skip the leader.
Scoring (all visible state)
37. Most resources held, all colors counted (the biggest pantry).
38. Most silver, but only up to your member count (a host needs a table).
39. Most silver members.
40. Most colors held at 3 or more.

## Measurements (greedy bots unless noted)
- 1000 games, 4 players: seats win 23 / 26 / 24 / 27% (baseline green table, 400 games: 26 / 29 / 23 / 22%). Average followers 46.8 vs 48.0 baseline; winner 58.
- Every Silver space gets taken every round (Rising Tide 0.8 in round II). Value per take, you / everyone else combined: Feast 4.5 / 3.7, Gift 4.6 / 3.7, Alms 3.5 / 2.4, Banquet 6.8 / 3.8, Rising Tide 8.1 / 3.9, Jubilee 13.9 / 6.9 (followers counted at 2). Same table: Joint Venture 4.4, Rush 4.9, Windfall 8.4, Strike 18.1.
- Spill ratio (everyone else ÷ host) 0.64. Alms went to the eventual winner 22% of the time (25% = neutral): no kingmaking showed up.
- Most-silver contest: nobody scored 0%, shared 19%, one player swept all three rounds 22%. It's about 4.6 of a winner's 58 followers.
- Member value (handed over at round II start vs control, 160 games each; noise about ±1.5): Patron Saint 8.0, Confidant 7.1, Hanger-On 6.2, Heir 5.9, Guest 5.4, Silver Spoon 5.0, Caterer 4.9, Diplomat 4.7, Ambassador 4.6, Benefactor 3.9, Toastmaster 3.7, Gala 3.6, Socialite 3.5, Almoner 2.8, Retinue 2.7. Same harness: Tycoon 11.6, Twins 5.1, Merchant 4.0, Speculator 3.7, Banker 1.2.
- Cut on the first pass: Rising Tide as "match the richest rival" (14.5, over band), Patron Saint at 1 per silver member (13.2), Heir at 2 per member (10.3).
- Thinking bot: see the report line at the bottom.

## What to watch
- Inflation: leftover resources at game end are 64 per player vs 25 on the baseline table. The spills add about 40 resources a game, and with one buy a turn they pile up. Followers don't rise, so it's mostly dead weight, but humans may feel a glut.
- Jubilee plus Gala (double, then 1 follower per 2) is the big combo, like Speculator plus Strike.
- Bots can't judge the crumb choice: which color to hand out and whom to give alms to run on a simple rule, so the main decision isn't measured.
- The blue stand-in's Shoal gives green, which isn't on this table, so blue is slightly weak in these runs.
- Engine: Joint Venture gives gold, but core.js has no gift signal, so Guest doesn't fire on it. Fix: let ctx.gain take `{ from: giver }` and run an onGiven hook. The "space with silver on it" idea also needs a hook when any player takes any space.
