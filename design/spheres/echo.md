# Green: the echo (Claude's build, revised 2026-10-14)

Built and measured as `src/engine/v4/content/echo.js` (tests: `src/test/engine/v4/spheres/echo.test.js`; sims: `scripts/spheres/echo-*.mjs`). On the table it replaces the green stand-in.

## The idea
Green copies the table's best moves instead of making its own. Gold hoards its own money and Red recruits many cheap members; Green waits for someone to hit big, then takes the same haul, so its question is "will the echo still be open after the big move lands?"

The copy rule: every taken space shows a chip, and a copy gives exactly what the chip shows. That's the space's own printed gain for its taker: never what they paid, and never their members' bonuses (Prospector, Underdog). A free member copies as "any face-up member costing no more, free". A space that took or traded (Steal, Trade) is copied by doing it yourself. Echoes can't be echoed, and the center can't be echoed. Last round's chips stay on the board for Recall.

## For Cory (answer by number)
Value math is from 400 greedy-bot games on the same table: resources, plus 2.5 per free member, by round. Anchors: Joint Venture 3.0, Rush 2/4/6, Turnout 4.0/5.3/6.8, Windfall 4.9/7.7, Steal 3, Strike 13.3. Costs are green + any.

**Scoring**
1. Most green at round end.
2. Recommended no: +1 green on every copy action (idea 29). Measured: the same winner holds it two rounds running 52% instead of 55%, the winning pile is still a median of 4 green, and Echo in round I goes to 4.0, above band.

**Ring I**
3. Hum: +3 green. Flat 3.0 = Joint Venture 3.0; the weak, early pick.
4. Chant: +2 green per round number. 2/4/6 = Rush 2/4/6.
5. Echo: copy any outer-ring space taken this round. 3.1/5.6/7.4 against Turnout 4.0/5.3/6.8: in band, +0.6 in round III.

**Ring II**
6. Encore: copy any space taken this round (not the center). 5.3/8.1 against Windfall 4.9/7.7: +0.4.
7. Recall: copy any space taken last round. 4.2/5.9 against Windfall 4.9/7.7: the weak version.

**Ring III**
8. Eternity: copy every space you took this round. 8.2 against Strike 13.3. It's a planned burst: about 20 if it's your 5th worker.

**Members** (one copy each; "+N" is followers gained when handed over at round II start)
9. Evergreen (1+1): at round start, +3 green. +2.0.
10. Muse (1+1): whenever a rival copies one of your spaces, +2 green. +4.2.
11. Wallflower (1+1): while no one has fewer followers than you, the resources you copy are doubled. +3.9.
12. Choir (2+1): whenever you copy a space, +1 green. +4.7.
13. Translator (2+1): what you copy comes as green; switch it off or on when you buy. +4.1.
14. Keepsake (2+1): when recruited, copy one of your spaces from this round. +4.4.
15. Mirror (2+1): when recruited, gain as much green as the rival with the most green. +4.1.
16. Groupie (2+2, raised from 3): whenever anyone recruits a green member, +1 green. +5.9.
17. Chronicler (2+2): at game end, +1 follower per 2 green. +4.8.
18. Hourglass (3+2): once per round, copy the space you just took. +6.7.
19. Déjà Vu (4+2): once per game, copy every space you took this round. +9.8.
20. Recommended cut, Choirmaster (2+1): whenever a rival copies a space, +1 green. It overlaps Muse; +5.7 (old rules).
21. Recommended cut, Tuning Fork (1+1): whenever you copy a space, +1 of that space's color. +2.7 (old rules).
22. Recommended cut, Fan (1+1): whenever a rival takes a center space, +2 green. +2.2 (old rules).
23. Recommended cut, Afterimage (2+1): at round start, copy one of your spaces from last round. +3.4.

If 20–23 go, the deck has 4 open Green slots (11 cards) until they're refilled. Reference cards on this table: Tycoon +11.5 (cost 6), Speculator +4.0 (4), Banker +2.8 (2), Host +2.6 (3).

## Extra ideas (one line each)
**Ring I**
24. Overhear: copy the last space a rival took.
25. Duet: copy an outer-ring space; its taker gains 1 green.
26. Trim for Echo: pay 2 of anything to copy.

**Ring II**
27. Chorus: copy a rival's space; they gain 2 green.
28. Refrain: copy one of your spaces from last round, +2 green.

**Ring III**
29. Grand Echo: copy every space one rival took this round.
30. Crescendo: copy the best space taken this round, three times.
31. Eternity, capped: copy your 3 best spaces.

**Members** (open slots)
32. Impostor: becomes a copy of a rival's member.
33. Memory: your copies can also reach last round's spaces.
34. Encore Artist: at game end, +1 follower per green member.

**Other scoring rules** (all visible)
35. Echo pile: what you copy goes in a pile in front of you; the biggest pile wins, and it joins your supply next round. This one ties the scoring to copying.
36. Most green members.

## Measurements
Greedy bots, 4 seats, gold/red/blue + Green, 400 games. Pitched rules unless noted.
- **Seats:** 25 / 23 / 24 / 29. By round-I pick order: 25 / 25 / 20 / 30, against 22 / 20 / 24 / 35 on the stand-in table.
- **Followers:** 44.2 against 48.0, and the first-to-last gap is 20.8 against 18.8. Resources left at game end are 43 against 25: copies outrun the one-buy-per-turn limit.
- **Echo and the last picker in round I:** Echo's worth (the best outer space so far) is 3.0 at pick 2 and climbs to 4.0 from pick 7. That's a +1 premium for waiting. Turnout's own climb is bigger. Greedy bots take Echo at picks 2–4, for an average yield of 3.1.
- **The Most green contest:** nobody scores 8% of the time; it's shared 12%. It goes to the follower leader 22% and to last place 38%. The same winner takes it two rounds running 55% of the time, and the winning pile has a median of 4 green. It's cheap to hold, so green-trickle members are priced up. With idea 29 the numbers are 6% / 13% / 26% / 37% / 52%, median 4.
- **Every Green space** is taken about once per round it's open. Hum is about 0.95 in rounds II and III.
- **Thinking bot:** this hasn't been rerun since the revision. Under the earlier rules it won 88% over 24 games and used Green sparingly. It's worth rerunning before playtests.
- **Can't measure:** whether people read the chips well, the Translator switch (bots never toggle it), or how often humans copy (Muse).

## Engine changes this needs (not made; echo.js shims them with `install()`)
1. A per-space yield record in core.js. Give the `act` task a context that tags gains and free recruits with the space, and keep this round's and last round's records on the state for the chips. Mark a space "redo" when anyone's resources or members went down during it. The shim does this by wrapping every action and handler.
2. Pay a member's colored part from `quadrant(def.quadrant).resource`. thieves.js needs the same fix.
3. UI: a chip on each taken space showing exactly what a copy gives ("+4 gold", "a member ≤2", "do Steal yourself"), plus last round's chips for Recall.
