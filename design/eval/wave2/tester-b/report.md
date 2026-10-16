I played one full game but couldn't save `report.md`: the harness blocked the write ("subagents should return findings as text"). Please save the full report below to `/home/user/patrons/design/eval/wave2/tester-b/report.md`.

What did get saved:
- My notes from during play: `/home/user/patrons/design/eval/wave2/tester-b/sweep.md`.
- All 250 screenshots: `/home/user/patrons/design/eval/wave2/tester-b/shots/`.
- The browser is stopped.

The game was Random 4 (Yellow, Blue, White, Magenta) against three Hard bots. I spun the wheel by hand and read every action panel before hovering it. I used members (Talent Scout, Double Agent, a Release attempt, Safecracker's Use button), paid with mixed colors, and made six steals plus a poach and a swap. I watched all three round ends and the results. P2 won with 51; I came 3rd with 37.

Play ran 05:51–06:48 UTC, longer than the 40-minute box because the loaded machine stretched every wait. As told, I didn't grade absolute latency.

**Counts:** 1 blocker, 28 major, 25 polish (54 in all). **Grade: C+.**

**Top 10**
1. **[blocker]** In round II, P2's Raider bought 3 of my followers (16 → 13). The "since your last turn" strip left it out; only the log showed it. My score just dropped with no reason given.
2. **[major]** Wheel panels leave out the condition that decides the gain:
   - "Gain each color" is really per full set held. I placed there and got nothing.
   - Lie Low hides its steal protection.
   - Your Call, Cheap Seats and Help Yourself hide "per round number".
   - Harvest says "per color" but means "per other color".
3. **[major]** Toasts, the strip and the log name spaces by names the board never shows ("Crime Wave", "Redistribute", "Cheap Seats", "Your Call"). Following a bot's move means hovering panel after panel.
4. **[major]** When you pick a steal, the glowing resource pills on rival seats cover their follower counts. That's exactly when you're choosing whom to hit by score.
5. **[major]** Four choices are made from text chips instead of on the board, against Cory's calls:
   - Snap Up's payment ("2 yellow / 1 yellow, 1 blue…").
   - Talent Scout shows 1 of the top 5, with no picture.
   - Your Call's three options.
   - Release is a dropdown under a header button.
6. **[major]** Steal limits are unstated and inconsistent. Redistribute says "1 from each rival" but let me take 2 from P2. Crime Wave allowed 4 from one rival in round II and capped at 1 per rival in round III.
7. **[major]** Things overlap:
   - Member sprites cover the seat's "each round" income line.
   - The header's snake-order subline runs under the menu button and into my seat.
   - A bot's toast runs off the bottom of the screen.
8. **[major]** The results columns add to one less than the total in every row (the starting follower has no column). My "Abilities" column says 0 although Robin Hood gave +2 and Raider took 3.
9. **[major]** One click bought Double Agent in Half Price, with no pay step. Its forced swap had no skip or undo, and the swap animation flashes a big white rectangle.
10. **[major]** Two hovers mislead. A space's "Most X: You 2" line shows standings after you'd take it, unlabeled, so it reads as the current state. And "…or use Safecracker first" plus a big "Use now" button invite a use that gives 0.

**Reading the rivals:** resources, followers, unplaced minions and round-start income read at a glance. Avatar hovers give each rival's full member list with abilities, which is the best planning tool in the game. I couldn't tell:
- who a rival's members are without hovering (sprites are about 16 px);
- loaded threats (P2's Raider had no mark on the seat);
- steal protection, until a steal dimmed the seat;
- that P2 was going all-in on bought followers (31 bought, 3 members). The results screen told me; play never did.

---

# Full report (for report.md)

# Cults, wave 2, tester b (w2b): strategist sweep

Build: http://127.0.0.1:5195, laptop 1270×700, via v4-eyes on port 5522. Table: Random 4 (Yellow, Blue, White, Magenta), three Hard bots, normal bot speed. I played one full game from 05:51 to 06:48 UTC. That ran over the 40-minute box because the loaded machine stretched every wait. I finished 3rd of 4 with 37 followers; P2 won with 51.

Shots are in `/home/user/patrons/design/eval/wave2/tester-b/shots/` (written `shots/NNN-*.png` below). Notes kept during play are in `sweep.md`.

The machine was loaded, so I don't grade absolute latency. For the record, placements often took 300–1400 ms to first change (Snap Up 771 ms, Cheap Seats 1396, Poach 1236, Crime Wave R3 1349), and hovers in round II took 340–660 ms. Animation pacing and cause and effect are judged below.

## Findings

1. [blocker] (A1, 13) Round II, between my turns. P2's Raider bought 3 of my followers: I went 16 → 13 and gained 3 white. The "since your last turn" strip listed five other bot moves but not this one. Only the Chronicle said "P2's Raider bought 3 followers from you for 3 white". On the main screen my score simply dropped with no reason given, and this was the only harmful thing done to me all game. shot: shots/136-r2t2.png, shots/142-loghover2.png
2. [major] (A2) Wheel panels leave out the condition that decides the gain:
   - "Gain each color" is really "+1 of each other color per full set you hold". I placed on it in round III holding 0 full sets and got nothing.
   - Lie Low's "+1 from a rival" hides "then no one can steal from you this round".
   - Your Call, Cheap Seats and Help Yourself hide "per round number".
   - Harvest says "+1 per color held", but its hover says "per other color".

   shot: shots/192-hover.png, shots/234-bc.png, shots/031-hover.png, shots/033-hover.png, shots/037-zoom.png
3. [major] (A2, A4) Toasts, the strip and the log name spaces by names the board never shows. "Crime Wave" is "+3 from rivals", "Redistribute" is "Steal 1 each", "Cheap Seats" is "Buy followers", "Your Call" is "+2 followers or +4 white". To follow "P4 Top Up · P2 Sob Story · P3 Lie Low" I had to hover panel after panel. shot: shots/173-r2t4.png, shots/121-crime.png
4. [major] (A2) A space's hover line "Most X: You 2 · P2 0…" shows the counts after you'd take the space, with no label saying so. It reads as the current standings: Sob Story and Top Up showed "You 1" or "You 2" while I held 0. shot: shots/032-hover.png, shots/039-hover.png
5. [major] (B22, B21) When you pick what to steal, the lit resource pills on rival seats cover the follower count. In round I P3's score was fully hidden. In round III the pills turned "45" into "0 45" and pushed "26" behind a pill, at exactly the moment I was choosing whom to hit by their score (Robin Hood). shot: shots/089-zoom.png, shots/222-sd3.png, shots/239-last.png
6. [major] (A1, A9) Redistribute says "Take 1 resource from each rival holding more than you". In round II only 2 rivals could be stolen from, yet the header said "take 3 · 3 left", and my third pick came from P2 again. Nothing explained the −1 white I lost or the "P3 +1 magenta" in the toast; the hover's "about −1 white" was the only hint. shot: shots/177-steal2.png, shots/182-steal2c.png, shots/175-zoom.png
7. [major] (A1) Crime Wave's per-rival limit is never stated. In round II ("take 6") it let me take 4 from P4. In round III ("take 3") it stopped me at 1 per rival, and I found that out only when the seat went dim after one click. shot: shots/125-mid-crime.png, shots/226-sd3done.png
8. [major] (B20, Cory's calls) Snap Up's way to pay is a row of word chips in a bottom sheet: "2 yellow / 1 yellow, 1 blue / 2 blue". That puts color names in words and uses a chip grid; Cory has ruled out both. shot: shots/076-click.png
9. [major] (B20, Cory) Talent Scout asks "recruit which of the top 5?" in a bottom sheet with one text chip (Desperado) and no picture. The other 4 cards are never shown, and the header says "pick on the board" while the choice sits in the sheet. shot: shots/098-scout.png, shots/099-hover.png
10. [major] (B20, Cory) Your Call is three text chips in a bottom sheet: "+2 followers / +1 follower, +2 white / +4 white". Color names are in words, and nothing is picked on the board. shot: shots/161-orchoice.png
11. [major] (B20, Cory) Release is a dropdown of text chips ("Gardener +2", "Desperado +2", "Cutpurse +2") under a small header button, away from the seat where those members sit. shot: shots/165-release.png
12. [major] (A5) In Half Price, one click on Double Agent bought it at once with no pay step. Its forced "swap it for any rival's member" then fired with no skip and no undo, so I handed my new member to P3 before I'd fully read it. shot: shots/153-paydouble.png, shots/155-dahover.png
13. [major] (B26, D30) The Double Agent swap animation flashes a large white rectangle into P3's seat. shot: shots/157-frames.png
14. [major] (B22) The seat's "each round +1 +1 …" income line is overlapped by member sprites ("e●●round"). It gets worse as members pile up, and by round III my own seat's "each round" was mostly hidden. shot: shots/102-desp.png, shots/190-r3.png, shots/230-r3t4.png
15. [major] (B22) The header subline "Snake order: whoever ends a pass starts the next, so you place twice in a row" runs under the menu button, and "ROUND II OF 3" collides with my seat's minion column. shot: shots/159-zoom.png, shots/207-r3t2.png
16. [major] (B22) A bot's toast runs off the bottom of the screen. The last line of P3 Help Yourself ("Sommelier: next member costs 2 less") is cut and the card has no bottom edge. shot: shots/219-r3t3.png
17. [major] (A4, B14) P3's Cheap Seats is told three ways that don't agree. The toast lists "traded 1 blue for 1 follower" three times under a blank line, the strip says "−6 blue · traded 1 blue for 1 follower", and P3's score went 19 → 26. shot: shots/236-r3t5.png, shots/237-r3t5b.png
18. [major] (B14) On the results screen the columns add to one less than the total in every row: me 8+16+0+12+0 = 36 vs 37, P2 50 vs 51, P4 43 vs 44, P3 35 vs 36. The starting follower has no column. My Abilities column says 0 although Robin Hood gave me +2 and Raider took 3. shot: shots/246-results.png
19. [major] (B11, A9) In round III the header says "…or use Safecracker first" and the hover shows a big "Use now" button. Using it would have given 0 (half of 1 magenta, rounded down), and nothing says "you'd get 0" the way the space hovers do. The call to action points at a dead move. shot: shots/230-r3t4.png, shots/232-sc.png
20. [major] (B12) Hovering a rival's avatar opens a popover docked at a fixed spot 228–494 px from the pointer. It covers the wheel's left third and the next seats, and Cory wants hovers next to what you point at. shot: shots/147-p3hover.png, shots/149-p2hover.png, shots/051-hover.png
21. [major] (A6) Strategist view: you can't see rival threats coming. P2's unused Raider, which aims at the leader, has no mark on P2's seat. A rival's steal protection (Lie Low) shows only once a steal dims their seat. shot: shots/136-r2t2.png, shots/177-steal2.png
22. [major] (B21) Rival members are tiny sprites, about 16 px, packed 6–11 to a row. I could read their color but never who they are, so reading a plan meant hovering each avatar. shot: shots/190-r3.png
23. [major] (C27) My last round-I placement had nothing affordable. The toast "Nothing you can afford. Turn passes." appeared at the same instant the round scoring began, with no beat between your turn ending and the scoring. shot: shots/105-click.png
24. [major] (A2, decipher) I read the inner-ring panel "Take a member" as a free member from the shop. Its hover is "Poach: take any rival's member; they recruit a face-up member costing up to the same, free". The panel leaves out the rival, which is the whole point. shot: shots/191-hover.png
25. [major] (B11, Cory's calls) The starting-resource pick sits in the lower-left corner. At a squint the eye lands on the wheel, not the pick. Color names are written as words beside "+1", and "Magenta +1" wraps onto two lines. shot: shots/027-click.png
26. [major] (A4) On setup, the Gold and Yellow table chips are nearly the same color, and so are White and Silver. A strategist rerolling for a table can't tell them apart. shot: shots/009-zoom.png, shots/016-zoom.png
27. [major] (A10, B13) Setup's table chips and Custom tiles have no hover. A quadrant can't be learned before you commit to it, and Custom shows only its scoring line. shot: shots/008-hover.png, shots/012-hover.png
28. [major] (A2) During Snap Up (recruit in any colors), the lit cards' hovers still say "You're short 2 to recruit it". shot: shots/071-zoom.png, shots/073-zoom.png
29. [major] (A4) In the intro, the leader wears a pizza slice rather than my chosen dino, and a "+3 HUM" chip appears with no explanation. shot: shots/025-idle-frames.png
30. [polish] (A8) The home screen says "name" three times: the "Your name" label, the "Name" placeholder and the helper "Enter your name to host or join." shot: shots/002-home.png
31. [polish] (A10) How to play is the rulebook as a wall of text with no pictures. Esc took 387 ms to first change. shot: shots/003-click.png, shots/004-press.png
32. [polish] (A2, D30) Custom tiles say "Blue (plain)" and "Green (plain)", which is developer phrasing. Capitals are inconsistent ("Most Magenta members" next to "Most purple"). Back and Start overlap the tile grid until you scroll. shot: shots/010-click.png, shots/011-scroll.png
33. [polish] (D29) The Reroll button moves after each reroll because the chips change width, so repeated clicks miss it. shot: shots/016-zoom.png, shots/020-zoom.png
34. [polish] (A3) Switching Classic → Custom → Random 4 silently rerolls the table you had. shot: shots/014-r4.png
35. [polish] (B16) Panel hierarchy is inconsistent. "Buy followers", "Steal 1 each" and "Top up" lead with a bold word; every other panel leads with "+N" and a dot. shot: shots/027-click.png
36. [polish] (A2) "Most full sets" isn't defined in the rulebook; only the scoring card defines it, at round end. "Per player ahead" is ambiguous: ahead in turn order, or in followers? shot: shots/027-click.png, shots/105-click.png
37. [polish] (A2) The steal preview reads "rivals −2 to 0, −3 to −1" and "about +3". The range notation is cryptic. shot: shots/087-zoom.png, shots/175-zoom.png
38. [polish] (A9) A round-I steal error said "You've already picked all of P3's magenta". The real limit is 1 per rival, so the message gives the wrong reason. shot: shots/090-click.png
39. [polish] (A4) The white resource dot on cream cards and popovers reads as an empty ring (Magnate's cost "2○"). shot: shots/073-zoom.png, shots/168-zoom.png
40. [polish] (B19) The shop re-sorts by cost after every recruit, so cards jump to new places under the pointer. shot: shots/078-frames.png, shots/172-payshop.png
41. [polish] (C26) The starting-pick coin flies out of the wheel hub, not from the button you pressed. shot: shots/062-frames.png
42. [polish] (C25, E8) Spinning the wheel by drag took 3065 ms to settle, showed a ghost popover mid-spin, and ended by opening a rim popover under the pointer. Each arrow-key step took about 900 ms. shot: shots/058-frames.png, shots/059-press.png
43. [polish] (B13, B14) Seat numbers (resources, follower count) and the deck count "57" open nothing on hover, so no number says where it came from. shot: shots/050-hover.png, shots/054-hover.png, shots/056-hover.png
44. [polish] (A2) The snake-rail labels "in 3 ×2", "now", "next" and the ▼▲ arrows took decoding. shot: shots/066-zoom.png
45. [polish] (A8, B15) The round summary repeats the tiebreak note "(0 yellow)" under every player in Most full sets. Round III adds "P3 0 (2 yellow)", a tiebreak note for someone with no sets. shot: shots/108-roundend2.png, shots/244-end.png
46. [polish] (B15) Toasts say things twice. "You took Snap Up … recruited Gardener (paid 2)" repeats the payment, and Robin Hood shows "Robin Hood: +1 follower" followed by another "+1 follower" line. shot: shots/079-buystep.png, shots/214-st3done.png, shots/241-lastbuy.png
47. [polish] (A1) The 10→10 hover stays open after the buy and flips to "You hold 0: 10 short." shot: shots/134-buyf.png
48. [polish] (Cory: the log is small) The Chronicle opens as a big right-hand panel covering a third of the board, and Esc took 3.7 s to settle. Names in it do open their cards, and those cards are anchored. shot: shots/138-log.png, shots/142-loghover2.png
49. [polish] (A1) Bumper Crop's toast says only "You took Bumper Crop" when it gave nothing. There's no "+0 (no full sets)". shot: shots/234-bc.png
50. [polish] (B15, B12) Every results card shows the score twice ("51 followers" and "51"). Hovering "Recluse +6" opened Lender's card, above the line, covering the bonus list. shot: shots/246-results.png, shots/248-reshover.png
51. [polish] (B23, B17) At seat size the cult leader reads as a padlock with an emoji in it, not a robed figure. shot: shots/027-click.png
52. [polish] (A4) The wheel panel "Buy followers, 1 each, up to N" shares its name with the follower-buy tiles (2→1, 4→3…), but the rates differ. shot: shots/027-click.png, shots/131-buy2.png
53. [polish] (A1) Instant recruits (Shopkeeper, Robin Hood) skip the pay step when there's only one way to pay. That's fast, but the toast is the only sign of what was spent. shot: shots/172-payshop.png, shots/186-payrh.png
54. [polish] (B16, Cory's calls) In the Talent Scout sheet, Desperado's cost is faint small print written in words ("Costs 2 magenta + 2 any"), not dots. shot: shots/100-zoom.png

Counts: 1 blocker, 28 major, 25 polish (54 in all).

## Reading the rivals (strategist brief)
What I could tell from the screen:
- Each rival's resources by color, their followers and their unplaced minions, all at a glance in the seat.
- Their round-start income from the "each round +3 white" line (when it wasn't overlapped).
- Their color lean from sprite colors: P3 stacked blue, P4 stacked yellow.
- Who leads each rim, from the emoji on the rim; the rim hover gives full standings.
- Hovering an avatar lists every member with its ability and state ("used", "pays at round start", "HARD BOT"). That's the best planning tool in the game.

What I couldn't tell:
- Who a rival's members are without a hover (sprites are too small).
- Loaded once-per-game threats. P2's Raider aimed at the leader and hit me for 3 with no warning on the seat.
- Steal protection, until a steal dimmed the seat.
- That P2 was going all-in on buying followers. P2 had 3 members and 31 bought followers, and the only clue was score jumps. I read it from the results narrative ("won mostly by buying followers (+31)"), never during play.

## The ten audits
1. **Call to action.**
   - Setup: Start is a cream pill at the bottom right, and the eye lands on it. Good.
   - Starting pick: the eye lands on the wheel. The glowing pick panel in the lower left comes second.
   - Placing: the lit panels pop against the greyed ones, and the eye lands on the lit spaces. Good.
   - Choosing a steal: the glowing pills on the seats are clear.
   - Buying: the cream follower tiles and the lit cards are clear; Pass is small, as it should be.
   - Talent Scout, Your Call, Snap Up pay: the eye lands on the sheet at the bottom, not on the board.
   - Round end: the scoring card at the bottom plus the number circles by each seat are clear; Skip sits bottom right.
   - Summary: the "Start round II" pill is clear.
   - Using a member: the header line is the only call to action. The seat sprite's glow is barely visible.
2. **Card anatomy** (shop face, Reinvestor), loudest to quietest:
   - the pixel portrait (about 60% of the card);
   - the name in small caps;
   - the cost row (2 white dots, 2 split "any" dots);
   - the worth (1 and the follower mark).

   Hover, loudest to quietest: the name in bold, then the ability sentence (largest text), then the small portrait, the "costs" line and the worth. The ability coming second in the hover is right. On the face, the picture is louder than the cost a buyer needs. That's acceptable per Cory's call (picture, name, cost, worth). The tiny "costs" label could go: the dots already say it.
3. **Glyph census** (19 before round II; too many):
   1. yellow dot
   2. blue dot
   3. white dot (reads as an empty ring on cream)
   4. magenta dot
   5. the split "any" dot
   6. the follower mark
   7. player emoji minions (dino, cat, alien, crab)
   8. the leader icon (reads as a padlock)
   9. hub numerals I, II, III
   10. the deck back with an eye
   11. the dotted player-colored outline on a space just taken
   12. the glowing border on an open space
   13. the red "−1" badge on a stolen stack
   14. lit pills on stealable stacks
   15. white number circles by the seats during scoring
   16. the flying "+2" token
   17. the snake-rail dots and ▼▲ arrows
   18. "×2"
   19. faded cards (unaffordable) vs cream cards (affordable)

   Look-alikes: the white dot vs an empty ring; the Gold and Yellow chips at setup. Drawn two ways: the "+1 follower" mark appears both as text "+1 follower" and as a glyph.
4. **Duplicate census.**
   - The score is in the seat and in the results card twice (keep one).
   - Turn order is in the snake rail, the seat order and the header ("Your turn again (snake order)" plus the subline): keep the rail and the seat order, drop the subline.
   - Payment appears twice in toasts (Snap Up).
   - Robin Hood's +1 follower appears twice in one toast.
   - The tiebreak note "(0 yellow)" repeats under every player.
   - The seat popover header repeats the avatar and name already on the seat.
5. **Prominence.**
   - Place (used every turn): the wheel is the largest element. Right.
   - Recruit (most turns): the shop's 10 large cards. Right.
   - Buy followers (often in rounds II–III): 4 cream tiles at the top right, appropriately big.
   - Pass (rare): a small header pill. Right.
   - Release (once): a ghost "Release…" pill in the header. Fine in size, wrong in place (it should sit on the seat).
   - Use a member (rare): a header subline plus a hover button. It's discoverable, but it's invited even when worthless.
   - Steal (frequent with Magenta): pills on the seats, prominent. Good.
6. **Order.**
   - Shop: sorted by cost, with a sort toggle (cost / color) shown. The order is visible, but it re-sorts after every buy.
   - Seats: in turn order, with the snake rail; they reshuffle between rounds, so my seat moved from top to bottom.
   - A seat's members: in recruit order, not grouped by color. I couldn't tell any order.
   - Release list: recruit order.
   - Talent Scout list: showed 1 of 5, so the order is unknowable.
   - Round summary: rims in the wheel's order, players sorted by score. The order is clear.
7. **Hover census.**
   - Wheel spaces: anchored next to the space (0–30 px away). They give the name, the full text, "You'd get" and the rim standings. First change was 45–125 ms in round I and 340–660 ms in round II (loaded machine). They add a lot.
   - Shop cards: anchored, with the ability sentence and a shortfall line. The shortfall line is wrong during Snap Up.
   - Follower tiles: anchored, with rule plus status.
   - Rims: open the standings.
   - Rival avatars: docked 228–494 px away, listing members.
   - Own seat members (Talent Scout, Double Agent, Safecracker): anchored beside the seat, with a "Use" button.
   - Seat numbers and the deck count: nothing.
   - Names in the Chronicle: anchored card.
   - Results bonus names: open a card, possibly the wrong one, and it covers the list.
   - Every wheel space's full text was read once per ring: 12 in round I, 8 more in round II, 4 in round III.
8. **Motion and art.**
   - Drag spin: 3065 ms to settle. Arrow keys: about 900 ms per step.
   - Recruiting: the card flies from the shop to the seat in about 2.7 s, readable.
   - Steal: the resource leaves the pill with a −1 badge and flies to me, readable.
   - Swap: a white rectangle flash.
   - Round end: about 3.5 s per rim, with count circles by each seat, then the summary tally counts up. I could narrate it.
   - Bot turns: dotted outline on the space, a toast, then the strip. Followable, but at Normal speed each toast replaces the last within about 2 s.
   - Sprites: the shop portraits are distinct and finished. Seat sprites are too small to tell apart. The minion emojis are charming and distinct.
9. **Space budget.**
   - Wheel, about 530×530: right for placing. It's dead weight during buy steps, but it holds the context.
   - Shop column, 300×520: right.
   - Seats column, 300×400: too cramped for what a strategist needs (members at 16 px).
   - Strip plus toast, 300×250: often empty ("No moves since yours yet") while seats are cramped.
   - Follower tiles, 280×130: right.
   - The header is a single line that overflows into the seats when it says more.
10. **Decipher test.**
    - "Steal 1 each from richer rivals": guessed right.
    - "+1 from a rival": guessed "take 1 from a rival". It also gives protection, which the panel doesn't say.
    - "+2 or +4": guessed right.
    - "+1 per player ahead": guessed "per player with more followers". Unclear.
    - "Gain each color": guessed unconditional +1 each. Wrong: it's per full set.
    - "Take a member": guessed from the shop. Wrong: from a rival.
    - "Cash in": guessed "sell resources for followers". Right.
    - "Buy 3 times this turn": right.
    - "Gain blue, half your priciest": guessed "blue equal to half your costliest member's cost". Not verified.
    - "Sell followers 3 white each": right.
    - "in 3 ×2": guessed "your turn in 3, twice". Right after some thought.
    - "+3 HUM": couldn't read it.
    - "Most full sets": guessed "most complete one-of-each sets". The scoring card confirmed it.

## Misreads
- I took the hover's "Most X: You 2" for current standings; it's projected.
- I took "Take a member" for a free shop recruit; it takes a rival's member.
- I took "Gain each color" for an unconditional +1 each. I placed there and got nothing.
- My 16 → 13 score drop looked like a bug until I opened the log (Raider).
- I took the leader icon for a padlock.
- I thought Redistribute would stop at one per rival; it let me take a second from P2.
- I thought Crime Wave took any mix, since round II allowed 4 from P4; round III capped it at 1 per rival.

## Grade
I start from D and raise it for what worked:
- A full 3-round game against Hard bots ran start to finish with no crash.
- Wheel and shop hovers are rich, anchored and honest ("You'd get"), and they're where the game is learned.
- Steals, poach and swap are picked on the board, on the seats.
- Round-end scoring can be narrated, and the results narrative tells you why the winner won.
- Members match Cory's calls: card faces show who and what it costs, the ability is in the hover, and the member "Use now" button is clear.

It stays below B because a friend would have to ask:
- "Why did my score drop?" (Raider, not in the strip).
- "Why did Gain each color give me nothing?" (the panels drop conditions).
- "Which space is Crime Wave?" (toasts and log use names the board never shows).

On top of that come overlaps (the seat income line, the header subline, toast overflow), four choices made from text sheets instead of on the board, and results columns that don't add up.

**Grade: C+**
