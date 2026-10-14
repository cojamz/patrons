# Green: the echo (Claude's build, revised 2026-10-14; reworked after Cory's first play)

Built and measured as `src/engine/v4/content/echo.js` (tests: `src/test/engine/v4/spheres/echo.test.js`, `src/test/engine/v4/cards-echo.test.js`; sims: `scripts/spheres/echo-*.mjs`). On the table it replaces the green stand-in.

## The idea
Green copies the table's best moves instead of making its own. Gold hoards its own money and Red recruits many cheap members; Green waits for a rival to hit big, then takes the same haul. Its question is "will the echo still be open after the big move lands?", and the other side of it: "if I take this juicy space, who gets to echo it?"

The copy rule: every taken space shows a chip, and a copy gives exactly what the chip shows. That's the space's own printed gain for its taker: never what they paid, and never their members' bonuses (Prospector, Underdog). A free member copies as "any face-up member costing no more, free"; when none that cheap is face up, the chip says so ("a member (≤2; none face up)"). A space that took or traded (Steal, Trade) is copied by doing it yourself. Green's one rule, printed once (on the sphere, in the rulebook and in the glossary's "copy") instead of on each card: **copies never reach the center or another copy.**

Every copy target is in plain sight (the 2026-10-14 rework): Echo copies a rival's space taken since your last turn (the spaces in the "Since your turn" line, ringed in their taker's color in UX mock A); Encore copies any space taken this round; Refrain, Eternity and the members copy your own spaces from this round. Nothing asks you to remember last round except Afterimage.

## Reworked after Cory's first play (2026-10-14, Claude under "go with your gut")
Cory: "Green for sure needs some tweaking as a whole." Diagnosis and options: `design/eval/cory-notes-2026-10-14.md`, section 3.

What changed (one line each; the full log is in design/decisions.md):
1. Echo: "Copy a space a rival took since your last turn (not the center)." Was: any outer-ring space taken this round. You can see the targets before you place (the "Since your turn" line), the menu is 1–3 spaces (up to 6 on the snake's double turn, none on its second pick), and your own big pick becomes something the next seat can echo.
2. Refrain replaces Recall: "+2 green, and copy one of your spaces from this round." Recall ("copy any space taken last round") asked you to remember a board that isn't shown, and offered 11–13 chips.
3. Understudy replaces Choirmaster: "When recruited: copy a space a rival took since your last turn." (4+2). Choirmaster paid a rival for your copies (a gift for doing nothing, and Muse's twin).
4. Ensemble replaces Fan: "Game end: +1 follower per green member." (2+2). Fan (green when a rival takes a center space) had nothing to do with copying.
5. Chips are honest: a copied free member whose price nothing face up meets reads "a member (≤2; none face up)", instead of promising a member the copy can't give.
Not changed: Most green (the copy-pile idea is an unspendable pile, which Cory ruled out for Magenta; "+1 green per copy" was measured and dropped, below), Hum, Chant, Encore, Eternity and the other 13 members.

## Design critic follow-ups (2026-10-14, Claude under Cory's "go with your gut")
1. One Green rule, printed once: "Copies never reach the center or another copy." It's on the sphere (`rule` in echo.js), in the rulebook (The board) and in the glossary's "copy" entry. Echo and Encore dropped "(not the center)". The engine already worked this way: Echo, Encore, Refrain, Eternity, Understudy, Afterimage, Hourglass and Déjà Vu all go through `copyable()` (ring < 3, not an echo).
2. Keepsake is cut ("When recruited: copy one of your spaces from this round"): Refrain does the same job on a space.
3. Ensemble (now 4+2, was 2+2): "Whenever you copy a rival's space, +1 follower." The follower counts at once (a won follower, so it's loose). Was "Game end: +1 follower per green member." Not measured yet.
4. Not done: fallbacks for an empty copy (the critic's "if there's none, +2 green" on Echo and "+3 green" on Understudy). Cory: no rescue clauses; taking a space you can't use is on you.

## For Cory (answer by number)
Value math: what a space gave its taker in 300 Normal-bot games (150 each on gold/red/blue/green and magenta/blue-market/yellow/green), resources plus 2.5 per free member, by round. Anchors: Joint Venture 3.0, Rush 2/4/6, Turnout 4.0/5.3/6.8, Windfall 4.9/7.7, Steal 3, Strike 13.3. Costs are green + any.

**Scoring**
1. Most green at round end.

**Ring I**
2. Hum: +3 green. Flat 3.0 = Joint Venture 3.0; the weak, early pick.
3. Chant: +2 green per round number. 2.0/4.1/6.2 = Rush 2/4/6.
4. Echo: copy a space a rival took since your last turn. 2.6/4.0/5.3 (was 2.6/4.3/6.1): Rush's level; a touch under Turnout late.

**Ring II**
5. Encore: copy any space taken this round. 4.0/6.0 against Windfall 4.9/7.7: the generalist.
6. Refrain: +2 green, and copy one of your spaces from this round. 5.9/6.9 against Windfall 4.9/7.7 (Recall was 4.6/4.7).

**Ring III**
7. Eternity: copy every space you took this round. 8.0 against Strike 13.3. A planned burst; the center is the one space, so it can be denied.

**Members** (one copy each; "+N" is followers gained when handed over at round II start; costs are after the ×2)
8. Evergreen (2+2): now and at round start, +3 green.
9. Muse (2+2): whenever a rival copies one of your spaces, +2 green. +0.6 (rival copies are rare among bots; the new Echo makes them likelier with people).
10. Wallflower (2+2): while no one has fewer followers than you, the resources you copy are doubled.
11. Tuning Fork (2+2): whenever you copy a space, also gain 1 of that space's color.
12. Choir (4+2): whenever you copy a space, +1 green.
13. Translator (4+2): what you copy comes as green; switch it off or on when you buy.
14. Ensemble (4+2, reworked): whenever you copy a rival's space, +1 follower (it counts at once). Was "game end, +1 follower per green member" at 2+2 (+1.7). Not measured yet.
15. Understudy (4+2, new): when recruited, copy a space a rival took since your last turn. +3.1.
16. Mirror (4+2): when recruited, gain as much green as the rival with the most green.
17. Afterimage (4+2): now and at round start, copy one of your spaces from last round.
18. Groupie (4+4): whenever anyone recruits a green member, +1 green.
19. Chronicler (4+4): at game end, +1 follower per 2 green.
20. Hourglass (6+4): once per round, copy the space you just took.
21. Déjà Vu (8+4): once per game, copy every space you took this round.
(Keepsake, "when recruited, copy one of your spaces from this round", is cut: Refrain does the same job.)

Watch items: Understudy and Mirror are one-shot "when recruited" cards; since Cory's Release ruling (refund the colored part only) a buy, copy, release costs them the "any" part, so they're no longer free. Chronicler turned 24 unspent green into +12 followers in a hand-played game: it's the only green sink, and copies pile up green faster than one buy a turn can spend.

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
**After the rework (2026-10-14, Cory's first play).** Instrument: Normal bots, 4 seats, 300 games (150 on gold/red/blue/green, 150 on magenta/blue-market/yellow/green), the same seeds for each variant (`node scripts/spheres/echo-share.mjs 150`; PLUS=1 for the variant). Before → after:
- **Wins by round-I pick order:** 23/25/24/28 → 23/24/23/31 (each ±2.6 at this n).
- **Placements on Green spaces:** 28% → 29% (fair share 25%). **Green's share of all followers** (its contest, its members' followers, its game-end bonuses): 11% → 11%; the other spheres on these tables run 5–9% of all followers each (most sit on only half the tables).
- **Most green:** nobody 0% → 0%; shared 30% → 29%; to the follower leader 28% → 27%; to last place 56% → 55%; same winner next round 42% → 42%; winning pile median 4 → 4; won by someone who copied that round 61% → 65%.
- **Variant measured and dropped: +1 green on every copy action.** Echo rises to 3.6 in round I, the contest gets stickier (same winner next round 49%), and copiers win it barely more often (67% vs 65%). It doesn't tie the contest to copying.
- **Member value** (`REF=echo.keepsake,echo.muse node scripts/spheres/echo-value.mjs 80 understudy,ensemble`: handed over free at round II start, or at the seat's first buy of round II for the when-recruited copies; 80 games each; 4 Normal bots; gold/red/blue/green): Understudy +3.1, Ensemble +1.7 (priced 2+2 from this), Muse +0.6, Keepsake +0.0. Win rates for the two mid-turn handovers (Understudy 60%, Keepsake 56%) don't match their follower gains, so read only the follower column. The old scale (pre-doubling run): Banker about +2.8, Host about +2.6.
- **Hand play** (two full games, one seat driven by hand against 3 Normal bots, plus the copy spaces on the frozen UI): see design/eval/cory-notes-2026-10-14.md, section 3.

**Before the rework (Claude's first build).** Greedy bots, 4 seats, gold/red/blue + Green, 400 games. Pitched rules unless noted.
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
