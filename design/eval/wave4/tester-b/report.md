# Wave 4 · tester B (w4b) · strategist, laptop 1270×700

Build: production preview at http://127.0.0.1:5195 on a quiet machine (load 1.3 on 4 CPUs). Seen only through v4-eyes. One full game against three Hard bots, Speed Steady, Random 4 table **Yellow · Magenta · Green · White** (Magenta is the stealing quadrant). I finished 3rd: P2 49, P3 43, me 43 (lost the tiebreak on members), P4 38. About 45 minutes of play. Shots are in `design/eval/wave4/tester-b/shots/` (paths below are relative to it; `m*.png` are hover contact sheets).

## Findings

1. [major] (C24) everywhere: **almost no input answers within 100 ms.** Wheel-space hovers took 220–480 ms to first change and 530–960 ms to settle. Shop-card hovers took 150–300 ms (settle 370–660). Placing a minion took 200–480 ms, with Help Yourself settling at 3.7 s. Taking from a stack took 150–440 ms, settling in about 1 s. Buys took 90–430 ms, settling 2.3 s and more. The only things that answered at once were Esc on How to play (17 ms), ArrowRight on the wheel (90 ms) and hovers on the results screen (30 ms). The bar is "your input answers at once". shot: m2.png, m5.png
2. [major] (B13, Cory's call) Round II: **hovering a seat opens nothing**, on both my seat and P3's ("NO VISIBLE CHANGE"). Cory wants a seat hover that lists the player's members with their state. To read a rival's plan I had to hover each 30 px portrait one at a time. shot: 117-v-myseat.png, 119-v-p3seat.png
3. [major] (C26/C28) After my second starting pick, the three bots picked and then **placed three minions in about 5 s** before I got control. During that run the seats re-sorted under me: I jumped from the top row to the bottom. I couldn't follow who took what without reading the log afterwards. shot: 054-frames.png
4. [major] (B20, Cory's call) Your Call ("+3 👤 or +6○") opens **a detached grid of four chips** in the middle of the wheel (+3👤 / +2👤+2○ / +1👤+4○ / +6○). Cory's rule is that choices are made on the board, never from a chip grid. shot: 233-yc.png
5. [major] (A2) The **Shake Down panel "A rival's member or its cost" misled me.** I read it as "I choose the member or its cost". The hover says the rival chooses whether to pay, and only for members costing 4 or less. A strategist planning on it gets it wrong. shot: 129-r2-rivalmember.png
6. [major] (A1) The round-end Reckoning **started while I wasn't looking.** After my last buy the bots finished and the scoring ran with no pause and no call to action. By the time I looked, the round II summary was already up. I only saw the scoring on the idle filmstrip. shot: 186-idle-frames.png
7. [major] (B21) **Turn order moves rivals between rows each round.** Rows follow that round's order, so P2 and P4 swap places. I misclicked a steal twice because I aimed by memory of last round's rows. Over a three-round game, row position is a stronger cue than the little emoji. shot: 173-rd2.png
8. [major] (B12) "Already gave theirs" errors pop up **at the screen edge, not at the pointer.** One was clipped at the top edge (y≈0, the text cut off). Another was clipped at the left (x≈40) and covered the next seat. shot: 079-frames.png, 173-rd2.png
9. [major] (A1/E5) **I never met a pay step.** Every buy auto-paid in one click (Kingpin, Safecracker, Grifter, Crew, followers), even costs with an "any" part. I couldn't test paying with a mix of colors, because the steals only ever gave me magenta. Nothing told me which coins would go before I clicked. One click is good, but with a mixed hand the first sign of what I paid is the seat dropping afterwards. shot: 085-buyK.png
10. [major] (B13) The **round summary has no hovers.** "P3 picks first: Front-runner", the prize chips and the "+2 from new members" text open nothing. On the results screen every number opens, so the two screens behave differently. shot: 104-re1.png
11. [major] (A2) **Inner-ring panel "+1 each per full set"** drops a word: the hover (Bumper Crop) says "+1 of each **other** color per full set". shot: m7.png
12. [major] (E7) **Forecast lines in the hovers are hard to parse.** Shake Down shows "+4 likely / +1 member, +1 👤 at best". Sell High shows "+6○, −2👤 your best pick … You'd have 0 to 6, and could lead it (+4👤): it depends on your pick". Redistribute shows "about +3" for a rule with a fixed outcome. They read like an engine dump. shot: m5.png, 064-s-steal1each.png
13. [major] (C25) Bots dumped their whole economy into **10→10 followers in round III**. In about 10 s of bot turns the scores jumped from P3 13 to 25 to 45. Each "bought 10👤" is one line in the log strip, and nothing big happens on screen (no follower flight I could see on the bot side). I went from comfortably leading to third without feeling it happen. shot: 221-r3m.png, 245-frames.png
14. [major] (E9) **Seat members are small (≈30 px)** and only identifiable by hover, but they are the main readout of a rival's plan. Meanwhile the "You took X" toast is the biggest type in the left column. shot: 166-r2c.png
15. [polish] (A4) **The intro shows a pizza emoji leader, but setup gave me the caterpillar.** The intro's wheel also writes space names on panels ("KICKBACK", "HUM"), which the game itself never does (Cory's call: names live in the hover). shot: 026-idle-frames.png
16. [polish] (A2) The **rail labels "now again" and "in 4 again"** read like a typo before you work out the snake. The rail's hover explains it in a run-on: "Places in 4 turns after you twice, P2, P4, then again right after (snake order: …)". shot: 127-v-rail.png
17. [polish] (A8) **Prompts say the count twice:** "Redistribute: take 3 · 3 left", "Help Yourself: take 4 · 4 left". shot: 077-afterSteal.png
18. [polish] (B22) **The Trade Seeds title is truncated with an ellipsis** ("Trade Seeds: 1 ● for 1 of..."), and the "Swap nothing" button sits inside the title line. shot: 097-ts.png
19. [polish] (A8/B15) **The "You took X" toast duplicates the log strip** right above it, and it stays up through the whole next bot sequence (about 10 s, stale). shot: 093-frames.png
20. [polish] (A8) **The Safecracker hover offered a "Use: +0" button** next to "Nothing to gain now…". A button that does nothing shouldn't be there. shot: 113-v-safec.png
21. [polish] (A2) **The Trade Seeds panel order is reversed.** It says "+1● swap up to 3", but the hover says swap first, then +1. shot: 070-s-swap.png
22. [polish] (A2) **Echo: the panel says "Copy a space a rival just took"**, but the hover says "since your last turn". shot: 058-s-copy.png
23. [polish] (B12) **The Echo hover opens about 300 px up**, over the green rim and its leader emoji. The Help Yourself hover covers the "Copy a space" panel. Hovering Go-Between on P3's seat covers P3's name and score. shot: 058-s-copy.png, 147-sdh.png
24. [polish] (B13) **Hovering the deck (56) opens nothing**, so there's no "56 left in the pile" explanation. Hovering the color chips at setup opens nothing either, so there's no way to learn what Yellow or Magenta do before starting. shot: 050-h-deck.png, 011-hov-chip.png
25. [polish] (A4/B17) **Random 4 can roll Yellow and Gold on the same table** (one roll was Yellow · Red · Magenta · Gold). The two dots are nearly the same hue. shot: 009-r4.png (reroll log in sweep.md)
26. [polish] (A2) **The Front-runner hover uses the term "Colorless here: it counts as a member of no color"**, an italic term the rulebook never defines. shot: 036-h-frontrunner.png
27. [polish] (B13) In the end-game log, **member names are underlined and open their card, but space names don't** ("You took Shake Down (Magenta)"). shot: 257-hist.png
28. [polish] (A2) **Log verbs are flavor, not rules:** "P2 flourishes: +1 of each other color", "P3 transmuted 2 green → magenta". shot: 257-hist.png
29. [polish] (A8) **Tipster triggers spam the log** ("P3's Tipster: +1 white" after every single move in round III). shot: 257-hist.png
30. [polish] (B22) **Round summary column "THIS ROUND" wraps to three lines** ("+2 from new members · −1 from members that left · +30 bought · +1 during play"), which makes the table ragged. shot: 247-end1.png
31. [polish] (C26) **Follower "+4 / +5" marks fly up and clip at the top edge** during the Reckoning. shot: 186-idle-frames.png frame 2
32. [polish] (D29) **A layout shift between the first two frames of setup:** the "Copy a space" and "Steal 1 each" panel text reflowed (bigger, one line) about 1 s after load. shot: 028-game0.png vs 052-pick1.png
33. [polish] (A2) **The rim hover says "Green's own rule: Copies never reach the center or another copy"**, but the rulebook gives that as a general rule. It also stayed open and travelled with the wheel during a drag-spin. shot: 266-frames.png
34. [polish] (C25) **Drag-spin settles in 1.8 s** after release, and ArrowRight in 740 ms. Smooth, and the text stays upright. After the arrow key, the bottom (green) rim keeps a gold outline (focus ring?) that looks like a highlight. shot: 270-spun2.png
35. [polish] (B21) **P2's seat grew an "EACH ROUND +1● +1● +1● +1○" strip** mid-round with no cue. The hover explains it (Gardener), but it pushes against the member row. shot: 162-eachround.png
36. [polish] (B19) **The shop sort ("cost") isn't visible in the cards:** Desperado (2●2◐) sits next to Robin Hood (2●2◐), and Extortionist (8●) is last, but cost-equal cards follow no visible order. shot: 264-pa.png
37. [polish] (D30) **"Play again" restarts on the same table with no option to reroll**, and setup is skipped. That's fine, but unannounced.
38. [polish] (C24) **The release flow takes three moves:** hover the member, slide into the popover, click "Release: +4●". The popover lies along the path so it held, but it's fragile. shot: 225-grel.png
39. [polish] (B16) **On the shop card faces, the worth (1👤) sits as loud as the cost.** For Crew (worth 2👤) that's the point, but on the 12 cards worth 1 it's noise. shot: m1.png

What worked: the "Pick 1 of 2" card in the wheel centre is an unmistakable call to action. Open spaces glow cream, taken ones go dark with the minion on them, and you can tell them apart instantly at a squint. Steals and Shake Down are picked on the seats (direct manipulation), with red "−1" chips on the robbed stack. Stolen dots fly from the rival's seat to mine and I could follow them. The rim leader emojis told me who led every contest at a glance. The Reckoning takes one quadrant at a time, with count chips beside each seat, and I could narrate it when I watched it. Every number on the results screen opens a clear breakdown, anchored to it. Echo and Encore outline the spaces they could copy. Safecracker gets a gold ring plus "…or use Safecracker first" when it's useful.

## The ten audits (short)
1. **Call to action.** Pick: the centre card, which is right. Place: the glowing cream spaces, which is right. Steal/Shake Down: the lit stacks or members on the seats, which is right, though the eye goes to the header first. Buy: the "Pass" pill and the lit follower tiles compete, and affordable shop cards brighten. Fine. Round end: the summary's "Start round" button, which is right. Reckoning start: nothing (finding 6).
2. **Card anatomy** (shop card, from loudest to quietest): portrait, then name in caps, then cost dots, then the worth mark. In the hover: name, then ability, then "You're short…". For buying, cost and ability matter most. The worth line could go quiet when it's 1.
3. **Glyph census** (9): color dot (4 colors), split "any" dot, follower mark, minion emoji, leader robe, ring numeral (I/II/III), "−1" taken chip, gold usable ring, USE tag. Yellow vs gold are near twins. The "USE" tag and "Use:" button say the same thing twice.
4. **Duplicate census:** "You took X" toast vs log strip. Prompt count "take 3 · 3 left". The score in the seat vs the round summary (fine). Turn order in the rail vs the header ("Your turn again (snake order)"). Keep the rail.
5. **Prominence:** place is big (the wheel). Buy followers: 4 tiles top-right, good, used 7 times. Recruit: 10 cards, good. Release: hidden in a hover, which is right for once a round. Use: gold ring, good.
6. **Order:** shop "sort: cost" with no visible tiers. Seats in this round's turn order (finding 7). Members in a seat in recruit order. Chip grid with no order logic.
7. **Hover census:** see m1, m2, m3, m5, m7. Wheel hovers anchor beside the panel but often cover neighbours. Seat: none. Seat members: anchored. Rim: anchored, with standings. Summary: none. Results numbers: anchored and good.
8. **Motion and art:** drag-spin 1.8 s, ArrowRight 0.74 s, upright text. Steal flights are readable. Bot placements are 0.6–0.8 s a step. The sprites are distinct and finished, but the portraits at 30 px in seats are only told apart by color.
9. **Space budget:** the wheel (≈560 px, right), the shop (≈300 px column, right), seats (≈300 px, under-used: members tiny, empty bottoms in round I), the log strip (small, right), the toast (too big).
10. **Decipher test:** "now again" (a typo? → a double turn). "+2● from rivals" (a steal ✓). "A rival's member or its cost" (I choose ✗ → the rival chooses). "+1 each per full set" (✗ it's "other" colors). "+1● swap up to 3" (✓, order reversed). "8 left" on 8→6 (✓). "EACH ROUND +1●" (a member's income ✓ after hovering).

## Misreads
- I thought I'd go first in round I because my seat was on top during the picks. Round I's order is random and I was last.
- I thought Shake Down let me pick between the member and its cost.
- Aiming at P2's stack by memory, I clicked P4's (twice).
- I took the Safecracker dot to mean the color I choose. It's magenta only.

## Reading the table (strategist notes)
- After round I I could name every leader instantly from the rim emojis (P3 green and white, P2 sets, me magenta). Rivals' engines took one hover per portrait: P3 = Lender + Front-runner (white/green), P2 = Gardener (yellow sets), P4 = follower trades plus Lie Low.
- In round II, the log strip told me P3 released Front-runner and P2 grew the Gardener strip. I couldn't tell how many resources a rival would have next round without doing the sums myself.
- In round III I could not see the 10→10 spree coming. The bots held 10–13 of a color and converted them, and nothing on screen says "this is 10 followers waiting to happen". P2's win came from three rims (+18) that flipped in the last turns, and I didn't see that until the summary.
- Turn order: the rail plus "now / next / again" always told me who was next. I learned "now again" means a double turn by round II.

## Felt unfair or unfun
- The bots playing three moves before my first decision, while the seats re-sorted under me.
- Round III's 10→10 spree: 20-follower swings in seconds, and nothing on screen felt like a turn.
- Losing a tie at 43 on member count. That's fair by the rules, but my Grifter release (the right move for 10→10) is exactly what cost me the tiebreak, and nothing warned me that members break ties.
- Waiting about 0.3 s for every hover while I was trying to plan. It made reading the board feel sticky.
- The Your Call chip grid, which felt like a form, not a board.

## Grade
Starting from D: the core loop is legible (glowing spaces, rim leaders, steals on seats, a narratable Reckoning, results that explain themselves), which lifts it a lot. The input latency all over the board, the missing seat hover, the Reckoning starting unwatched and the round III bot spree with no on-screen weight keep it from feeling crafted. **C+**. A friend could play it tonight, but they would ask "wait, what just happened?" at least twice a round.
