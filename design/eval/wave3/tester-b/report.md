# Wave 3, tester B (w3b): strategist sweep, 3 Hard bots, Random 4

Table: Purple, Gold, White, Magenta (Magenta steals). I'm seat P1, playing as "You" against three Hard bots. I played one full game: I came 4th with 34 followers; P4 won with 43 (1 member, 23 followers bought).
Every shot is in `/home/user/patrons/design/eval/wave3/tester-b/shots/` (shot names below are relative to that folder). Running notes are in `/home/user/patrons/design/eval/wave3/tester-b/sweep.md`. The harness blocked me from writing report.md, so please save this text there.
The box was loaded and the other tester shared it, so I give no absolute latency figures; where a number appears, read it as relative only. `v4-eyes stop` has been run.
Harness note: tester w3a's helper script overwrote mine in the shared scratchpad, so one Escape and one click of mine landed in w3a's browser around 08:17. I fixed this with a uniquely named helper. w3a may see one stray click.

## Reading the table as a strategist (what I could and couldn't tell, and where I had to look)
- **Round I.** I could tell everyone's resources from the seat rows (number, then colored dot; zeros dimmed), their members from the sprites, and who leads each contest from the leader emoji on each rim. I could **not** tell what a rival's members do without hovering. The seat body opens nothing; the name row or the follower count opens the seat card (abilities listed: good), and a member sprite opens that card. I also couldn't see the bots' starting picks, because all three bots picked and placed within about 4.5 s after mine.
- **Round II.** From the seats I read P4 as hoarding white (8) with Broker for white-follower bonuses, P3 as purple/gold with no engine, and P2 as gold with Investor/Hustler. The "safe this round" tag under P4's seat (Lie Low) was a good live read. I could not see Hustler's chosen color anywhere except one log line.
- **Round III.** P2 sat on 16 white with Magnate ("game end: +1 follower per 3 white"), so I read it as a Magnate hoard. P2 then spent the white, and Magnate paid +1. P4's "each round +3 white" line under the seat was the clearest engine signal on screen. Nothing warned me that P4 was one turn from buying 6+10 followers (21 → 37), though the resources were visible, so a sharper player could have seen it.
- **Who's ahead and why.** The big follower number on each seat answers "who's ahead". "Why" exists only in the round summaries and the results; no seat element breaks down a follower total.
- **Turn order.** The rail at the left (now / next / in 3 / "twice", with an arrow at the end) always told me who's next, and I always knew when my turn was coming. The snake is legible once you decode "twice". Two things cost me. First, the seats re-sort every round, so "You" moved from top to third and I had to find myself again. Second, the header line went stale during bot turns (see findings).
- **Animation chain.** Placing, recruiting and stealing in rounds I and II travelled from source to destination (lit stack, then chip into my seat; card from shop to seat). The ransom, the poach, the Use of a member and the round-III steals showed **no travel at all**: the numbers just changed. Bot turns ran about 1–2.5 s each with a highlighted space plus a toast. I could follow them, but the toast and the header lagged a turn behind.

## Findings

1. [major] (2, 4) Setup — The table picker names quadrants ("Purple", "Magenta"…) with no hover and no line about what each does. The Custom tiles show only the scoring rule, so "which quadrant steals" can only be learned from the rulebook. shot: 013-hover.png, 014-click.png, 015-hover.png
2. [polish] (4) Setup — "Bot speed: Slow/Normal/Fast" at setup vs "Animations: Quick/Steady/Relaxed" in the menu: two speed controls in two vocabularies. Cory's word is "Steady". shot: 010-click.png, 342-menu.png
3. [polish] (2) Setup/Seats — The name I typed ("Vera") never appears; my seat, the log and the results all say "You", and bots are bare "P2/P3/P4". shot: 039-click.png, 336-results.png
4. [polish] (2) Intro — The copy says "to gain influence and followers", but "influence" isn't a game word. The intro's first frame also flashes the finished board before the intro plays. shot: 037-idle-frames.png
5. [major] (11, E1) Starting pick — The pick panel glows, but it sits bottom-left under the seats, far from where the eye lands (wheel center). On first squint my eye went to the wheel, not the panel. Cory wants this pick to be an obvious call to action. shot: 039-click.png
6. [polish] (15) Starting pick — "(1 of 2)" in the header and "Pick 1 of 2" in the panel say the same thing twice. shot: 039-click.png
7. [major] (28, 26) Starting pick → first bot moves — After my second pick, three bot picks and three bot placements played in about 4.5 s. I never saw what the bots picked, though the rulebook says "everyone can see what you pick". shot: 066-click.png, 068-idle-frames.png
8. [major] (1) Bot turns — The toast "P2 took Sob Story" stays up while P4 and P3 are already moving. The header "P4 is placing a minion ···" persisted through P3's and P2's turns, and "Choose how to pay ···" persisted through P3/P2's round-III turns. The seat rail moved on but the header didn't, so the header's status was wrong. shot: 068-idle-frames.png, 208-idle-frames.png, 320-idle-frames.png
9. [major] (1, 2) Bot pay step — The header says "Choose how to pay ···" during a bot's pay step without naming the bot. It reads as an instruction to me. shot: 117-payRH.png
10. [major] (2, E10) Kickback hover — "MOST GOLD If you take it: You 4 · P2 3" silently assumes the "+1 to anyone" goes to P2, before I've chosen who gets it. shot: 071-sp-gold3.png
11. [polish] (8, 15) Space hovers — Intro Offer / Cheap Seats hovers show a MOST GOLD / MOST WHITE projection line for spaces that don't change that count. The line is noise there. shot: 073-sp-save4.png, 077-sp-trade.png
12. [major] (2, 15) Your Call — The panel shows the scaled amount ("+2 ☗ or +4 ○" in II, "+3 ☗ or +6 ○" in III), while the hover says "Per round number: +1 ☗ or +2 ○". That's two descriptions of one thing, and "per round number" is jargon. shot: 075-sp-white1.png, 309-usedLW.png
13. [polish] (4) Cheap Seats / Gold +N — Small print appears and disappears: "1 for 1, up to 2/4/6" and "2 · 4 · 6 by round" under the big number. The by-round line duplicates the big number it sits under. shot: 077-sp-trade.png, 231-r3a.png
14. [major] (2, E10) Lie Low hover — Wording is broken: "(it arrives as ●" wraps, leaving ")." orphaned on the next line. In round I its projection read "rivals −1 to 0●, −1 to 0●, −1 to 0○ in all", which can't be read. shot: 079-sp-steal1.png, 223-logHov2.png
15. [major] (2) Crime Wave / Redistribute hovers — "about +3●, +2 followers / rivals −2 to 0●, −3 to 0●, −2 to 0○, −2 to 0● in all" is range notation a player can't parse. shot: 105-redist2.png, 136-m-mag3.png
16. [major] (2, E10) Panels "per minion out" vs "per minion left" — Roll Call and Plan Ahead sit side by side in purple and differ by one word. I swapped them twice while planning. shot: 140-m-minleft.png, 170-r2t2.png
17. [major] (2, E10) "2 extra turns for 8●" (Overtime) — Before hovering I read it as 8 purple per extra turn. shot: 132-r2start.png
18. [major] (2, E10) "Extra turns for all purple" (Crunch Time, hub) — Undecipherable: I guessed "everyone with purple gets extra turns". The hover says "Spend all your ●: 1 extra turn per 4 spent, plus 1 (up to 2). With less than 4, +4●." The panel and the rule share almost no words. shot: 281-h-extraall.png
19. [major] (2, E10) "Ransom a member" (Shake Down) — I read it as "pay to get a member back". It's the opposite: the rival pays you or loses it. shot: 132-r2start.png, 182-ransom2.png
20. [polish] (13) Shake Down / Poach / Sell High / All In hovers — "YOU'D GET it depends on your pick / a rival decides part of it" is honest but empty; it gives no range, no example and no best case. shot: 233-i-take.png, 283-h-allfor.png
21. [polish] (4) Space hovers — The MOST-X tail is inconsistent: some end "you'd lead it (+4 ☗)" and others (Sell High, Double Down) just list numbers. shot: 148-m-sell.png, 237-i-double.png
22. [major] (20, E1) Gift choice (Kickback) — Rival seats get only a thin outline, and the header says "Click a rival's cult". It's a weak call to action. Gifting played as a one-frame change with no visible travel. shot: 088-click.png, 093-frames.png, 094-idle-frames.png
23. [major] (5, 3) Space click — Twice (Shake Down, Poach), my first click on an open space only highlighted it and the second click entered the choice. Both times a seat popover had been open just before. A common move silently takes 2 clicks. shot: 180-ransom1.png, 182-ransom2.png, 245-poach1.png, 247-poach2.png
24. [major] (4, 5) Recruit flow — Recruiting is inconsistent. Big Spender, Lottery Winner and 8→6 opened a pay dialog; Robin Hood, Crew, Middleman and Foreman recruited on one click and auto-spent (Middleman took 3● + 1● without asking). You can't predict whether a click commits. "Undo buy" softens this, but it disappears after you use a member. shot: 117-payRH.png, 165-crew2.png, 206-payMid.png, 276-buyForeman.png, 313-usedLW2.png
25. [major] (2, 16, E10) Pay dialog — Four coin columns, with numbers under them and no labels. The numbers are "left after paying", but I first read them as "cost per color". Ghost vs solid coins swap meaning after a tap. Columns for colors you hold none of show "0" with no dot, so you can't tell which color they are. The confirm button ("Pay 3● 7●") is the clearest thing in the dialog. shot: 098-payzoom.png, 299-payLW.png, 301-payLW2.png
26. [major] (12, 20) Pay dialog placement — A centered modal over the wheel: your coins sit in your seat, but you pay in a box in the middle. It's not picked on the board. shot: 097-pay1.png, 317-pay86.png
27. [major] (2, E10) Foreman hover when affordable — "Pays 6●" reads as "this member pays you 6 purple". The unaffordable version says "You're short…", and the two don't read as a pair. shot: 258-c-foreman2.png
28. [polish] (16, E2) Shop card face — The worth "1 ☗" sits at the end of the cost row ("4● 2◐ 1☗"), and at a glance it reads as part of the price. The name is small gray caps at low contrast, so the portrait is by far the loudest element. shot: 132-r2start.png
29. [polish] (17, 22) "Any" dot — At card size the split "any" dot is about 8 px and reads as a muddy brown dot. I needed zoom to see that it's split. shot: 098-payzoom.png, 260-c-late2.png
30. [polish] (22) Taken spaces — The minion sprite sits on top of the space text and half-covers it ("Steal 1 each", "Take a rival's member"). The hub minions are tiny. shot: 125-press.png, 286-innerzoom.png
31. [polish] (2, 17) Dotted outlines on taken spaces — Some taken spaces get a dotted colored border. I couldn't work out what it means (taken since your last turn? by whom?), and it has no hover. shot: 170-r2t2.png, 289-r3t4.png
32. [major] (20) Shake Down choice — Rival members light up, but hovering a lit member opens nothing (it does outside the choice). You ransom blind, without the member's name, cost or ability. shot: 185-hovP3mem2.png
33. [major] (26) Shake Down / Poach / Use resolve with no motion — "nothing moved after the last action". The resources or member just appear. The ransom toast never names the member; the poach toast lists the rival's free recruit only as a toast line. shot: 187-ransom3.png, 249-poach3.png, 313-usedLW2.png
34. [major] (26) Round-III steals — Three clicks on lit stacks each showed no visible change within 1.5 s and no travel in frames; the totals were simply updated afterwards. The round-I steals did travel. shot: 327-lastSteal2.png
35. [polish] (1) Collect Debts pending state — The rival stack keeps its old count ("3") with a red "−2" badge while the take is pending, so for a moment it shows both the old and the new number. shot: 196-cd2.png
36. [major] (6, 20) Robin Hood + steal targets — The hover promised "+2 ☗ (Robin Hood)", but the target seats don't mark which rival is the follower leader. I took from P3 (not the leader) and got 0. In round III a tie at the top paid +2, which surprised me. shot: 193-cd1.png, 202-hovRH2.png, 327-lastSteal2.png
37. [major] (3, 9) End-of-round ransom — P4 Shake Downs my Middleman. I get "P4 holds your Middleman to ransom: pay 4 to keep it?" with only "Let Middleman go" and no line saying why there's no Pay button (I had 1). The header reads "Your turn — …" during P4's turn. It also replaced the confirmation of the 2→1 buy I had just made. shot: 329-lastbuy.png
38. [polish] (1, 21) Seat overflow — At 7 members my seat shows six sprites and "+1". The counting test fails, and the seventh member is only reachable via the seat card. shot: 304-afterLW.png
39. [major] (13) Seat body hover — Hovering the seat's empty body or its resource row opens nothing; only the name row, the count or a sprite does. The follower number opens the same seat card as the name, with no breakdown of where the followers came from. shot: 172-hovSeatP4.png, 178-hovP4score.png
40. [polish] (21, E9) Seat rows — Resource numbers are small (about 11 px) beside the dots. Zero-count dots dim to a gray that's close to the white-resource dot, so "0 white" and "3 white" read alike at a squint. shot: 069-seats1.png
41. [polish] (4, 30) Player colors — In the log and summaries the names are tinted (P2 cyan, P3 pink, P4 lavender). Those tints don't match the players' emoji (green frog, green caterpillar) and overlap the resource colors: P3 pink ≈ magenta, P4 lavender ≈ purple. "P3 Help Yourself" reads like a magenta effect. shot: 209-botmid.png, 229-r2sum.png
42. [polish] (2) Turn rail — "in 3 / twice" and "next / twice" take a decode. "twice" alone doesn't say "you'll go twice in a row (snake)". shot: 132-r2start.png, 253-r3t2.png
43. [polish] (6) Seats re-sort every round by turn order, so "You" moves (top in II, third in III) and the eye has to find you again each round. This follows Cory's call, but it still costs. shot: 132-r2start.png, 231-r3a.png
44. [major] (8, 22) "Since your last turn" strip — The oldest entry is clipped mid-sentence at the top ("Apprentice for 2●", "−2 ☗ · bought 3 ☗", half a "Dividend" line). It reads as broken text. shot: 209-botmid.png, 217-st4.png, 250-stripclip.png
45. [polish] (15, E4) Toast vs strip vs log — The same move appears in the bottom-left toast, the strip and the log. The toast even says "+2 more: hover the line in the strip", which is narration that points elsewhere. shot: 165-crew2.png
46. [polish] (22) Header subline — It truncates mid-word when a member can be used ("…or use Lottery Wi…"), and in one buy state ("release a mem…"). shot: 304-afterLW.png, 276-buyForeman.png
47. [major] (3, 12) Use member — The member glows and its hover has a clear "Use: +8●" button (good, as Cory asked). But the popover closes if the pointer leaves the sprite by the wrong route; I lost it on the first try and had to re-hover and travel through the arrow. shot: 306-hovLW.png, 309-usedLW.png, 311-preuse.png
48. [polish] (18, E5) Release — Release exists only as a chip inside a member's hover ("Release: +2●"). Nothing on the seat says it's possible, and the header subline mentions it every turn. shot: 167-hovBS.png, 202-hovRH2.png
49. [polish] (4, 13) Log — It's newest-first, so effects appear above their causes ("You stole 2…" above "You took Redistribute"). Hustler's log line says "+1● each time P2 takes a Gold space" while its card says "per round number", which are two wordings. Names in the log do open cards and light up the space on the wheel, which is excellent. shot: 219-log1.png, 221-logHov.png, 223-logHov2.png
50. [polish] (2) Round summaries — The per-contest counts jam digits against names: "P3 3 P4 3 P2 2 You 0" reads as "P33 P43 P22". shot: 130-r1sumzoom.png, 229-r2sum.png
51. [polish] (27) Reckoning — The scoring banner jumps between the top and bottom of the wheel by quadrant (purple/gold on top, white/magenta below), so the eye chases it. The count badges at the seats and the +N chips are good. I could narrate who got what in about 10 s at Steady. shot: 128-idle-frames.png, 228-idle-frames.png, 332-idle-frames.png
52. [polish] (14) Results table — No number has a hover. The "Yourself" column is 1 for everyone, a dead column. The header "From members ☗" is the only one with a glyph. shot: 336-results.png, 340-resHov2.png
53. [polish] (17) Results seat sprites — Some members carry an unexplained gray halo (used? recruited this round?). It has no legend; the hover says "Yours · used" for one of them. shot: 336-results.png, 338-resHov.png
54. [polish] (23, E8) Member art — Hustler, Investor, Middleman, Big Spender, Speculator and Lottery Winner are all yellow men with a prop, and Broker and Rich Uncle are two white old men. At seat size (about 24 px) they don't tell apart. Minion emoji (ninja, frog, caterpillar, ghost) do. shot: 304-afterLW.png
55. [polish] (25, E8) Spin — Dragging the rim spins with momentum and coasts about 4 s before it settles. Arrow keys turn 90° in about 1 s. Text stays upright (good), but the coast is long for a "look at the other side" gesture. shot: 122-drag.png, 123-frames.png, 125-press.png
56. [polish] (21, E9) Space budget — The bottom-left strip is often empty ("No moves since yours yet.") while member sprites in the seats are tiny. The deck tile ("53") takes a full card slot in the shop grid. shot: 132-r2start.png
57. [major] (1) Round I last pick — The last seat had 0 resources and the only space left was Cheap Seats ("nothing right now"), so it was a dead turn. Nothing on screen warns about this earlier. shot: 121-trade-hov.png
58. [polish] (4) Big Spender "buy again" — The header ("Your turn — buy again (Big Spender)") is clear. But after the second Pass the header doesn't say the turn is over; the next frame is already a bot's. shot: 165-crew2.png, 191-r2t3.png
59. [polish] (16) Wheel panel hierarchy — Type size varies a lot between panels ("Trade for followers" and "Save 4" are huge, "Ransom a member" and "Sell followers" tiny), and several lead with a verb phrase rather than the main gain Cory asked for ("+2 ●" first). shot: 132-r2start.png
60. [polish] (13) Follower-buy tiles — The 8→6 hover is good ("7 left at this table (2 per player at the start)"). But "8 left / 7 left" under the tile is the only limited-buy hint, and the 10→10 tile gives no sign that it's unlimited. shot: 315-h-86.png

## The ten audits

**E1 Call to action**
- Home: "Play on this device" is first and clear.
- Setup: the Start button is clear; the table reroll is a small pill.
- Starting pick: the glowing panel, but bottom-left. My eye landed on the wheel first.
- Place: the glowing open spaces (good; the squint test passes: open is bright, taken is gray with a sprite, unopened rings are dark).
- Choice (steal/gift/ransom/poach): lit stacks and lit members (good) for steals. Gift targets are only outlined (weak).
- Pay: the dark "Pay" button (good).
- Buy step: affordable cards and tiles light up, with Pass in the header (good).
- Use member: the glow ring (good).
- Round end: "Start round II/III" and "See results" buttons (good).

**E2 Card anatomy** (shop face, Investor), loudest to quietest: portrait (about 60% of the card), cost row "4● 2◐ 1☗", name (small gray caps). In the hover: name (bold), portrait, worth "1☗", "costs …", one ability sentence, then the quiet "You're short …". For a buying decision the face lacks what it does (by Cory's design). The worth sitting in the cost row could move under the name.

**E3 Glyph census** (about 16):
- the four resource dots;
- the split "any" dot;
- the follower mark;
- each player's minion emoji;
- the leader robe;
- roman numerals in the hub;
- "+N" chips;
- lit-stack pills;
- the red "−2" badge;
- the glow ring (usable member);
- the gray halo (results);
- dotted space outlines;
- rail dots and arrow;
- the deck-back eye;
- the hamburger menu;
- the sort chips.

Look-alikes: purple vs magenta dots at small size; zero-dimmed dots vs the white dot. Drawn two ways: player identity (emoji vs tinted name). Stand-ins for words: the dotted outline and the halo.

**E4 Duplicate census**
- The pick count, in the header and the panel. Keep the panel.
- Moves in the toast, the strip and the log. Keep the strip and the log; drop the toast detail.
- The gold space's big number and its "2·4·6 by round" line. Keep the big number.
- Your Call: the panel's scaled number and the hover's base number. Keep the scaled one.
- "0 you can afford" and the faded cards. Keep the fading.
- The header's "4 minions each" and the seat minion column. Keep the column.

**E5 Prominence**
- Place: huge, glowing, used 12 times. Right.
- Recruit: shop cards, large, lit when affordable, used 7 times. Right.
- Buy followers: four big tiles, lit, used 4 times. Right.
- Pass: a small pill, used about 6 times. Fine.
- Release: hidden in a hover chip, used 0 times. Too hidden for a per-turn option.
- Use member: glow plus a hover button, used once. Right, but fragile (finding 47).
- Spin: no visible handle. Fine.

**E6 Order**
- Shop: by cost with a visible cost/color toggle. Good.
- My members: by color (purple, gold, white, magenta). The order is visible but unlabeled.
- Seats: by turn order, with a rail.
- Log: newest first.
- Round summary players: by followers.
- Results: by rank.
- Pay columns: fixed color order with no labels.

**E7 Hover census** (three sweeps):
- Every wheel space opens an adjacent card: name, rule, YOU'D GET, MOST-X projection. I read every space's full text once per ring.
- Shop cards: adjacent, with ability and short-by.
- Seat name and count: the seat card. Seat body: nothing. Seat sprite: the card. A lit member during Shake Down: nothing.
- Rim: standings with a "leads" chip (the best hover).
- Follower tiles: an explanation.
- Log names: the card, plus the space lights on the wheel.
- Results sprites: the card with "used". Results numbers: nothing.
- Popovers are anchored next to their target throughout (no docked popovers seen).

**E8 Motion and art**
- Spin by drag: about 4 s coast. Arrow keys: 90° per press.
- Recruit: card travels to the seat.
- Round-I/II steal: the chip travels.
- Gift: no travel.
- Ransom, poach, use, round-III steals: no travel.
- Reckoning: badges and +N chips, about 10 s per round.
- Art: minion emoji are distinct; member sprites are charming but samey per color.

**E9 Space budget** (largest first):
1. The wheel, about 560×560. Right: it's the board.
2. The shop, 300×520. Right.
3. The seat column, 300×430. Too tight for 7 members.
4. The bottom-left strip and toast, 300×200. Often empty or showing stale text.
5. The follower tiles, 280×110. Right.

**E10 Decipher test** (guess → actual)
- "Ransom a member" → guessed paying to recover; it's the rival who pays you.
- "2 extra turns for 8●" → guessed 8 each; it's 8 total.
- "Extra turns for all purple" → guessed a group effect; it's "spend all your purple, turns per 4, else +4".
- "per minion out" / "per minion left" → swapped them.
- "Steal 1 then you're safe" → right.
- "+3● +1 to anyone" → right.
- "+2○ +1 per higher score" → roughly right (per rival ahead).
- "All for followers 1 for 1" → right.
- "Take a rival's member" → half right (they get a free recruit).
- "Pays 6●" → guessed the member pays me; it's my cost.
- "in 3 twice" → roughly right.
- Dotted outline → unknown.
- Gray halo → unknown.

## Misreads
1. "Ransom a member": I thought I'd pay to recover a member.
2. "2 extra turns for 8●": I thought it was 8 per turn.
3. "Extra turns for all purple": I thought it affects everyone.
4. Roll Call vs Plan Ahead: I swapped "out" and "left".
5. Shop cost row: I read the worth "1☗" as part of the price.
6. "Pays 6●": I read it as income.
7. Pay dialog numbers: I read them as cost per color, not as what's left.
8. "Choose how to pay ···" during a bot's turn: I thought it was asking me.
9. Collect Debts' "+2 ☗ Robin Hood": I assumed any rival target would trigger it.
10. Steal from tied leaders: I expected +1, got +2.
11. Kickback projection: I thought it meant P2 was already chosen.

## Felt unfair or unfun
- I built a 6-member engine (Big Spender, Robin Hood, Middleman, Foreman, Lottery Winner, Crew, Broker) and finished last. P4 won with 1 member by buying followers (23) and taking rim prizes (18), and P3 came second with 0 members. The members felt like small change against 10→10.
- My last action of the game was answering a ransom I couldn't afford. P4 Shake Downed my Middleman when I held 1 resource, and my only button was "Let it go".
- Round I's last placement was dead: 0 resources and only Cheap Seats left. "Nothing right now".
- Robin Hood's +1 depends on hitting the follower leader, but the steal targets don't show who that is, so I wasted a Collect Debts on the wrong seat.
- The bots' starting picks and first placements went by too fast to read. The game started without me.
- Shake Down and Poach resolved with no motion, so stealing a member felt like a number change rather than taking something.

## Grade
I started from D. I raised it for what I saw work:
- A full game runs end to end, and the turn rail answers "who's next" every time.
- Space and card hovers sit next to their targets and give a "you'd get" line.
- The rim hover's standings are excellent.
- Steals are picked on the board from lit stacks.
- A member that can be used glows and has a clear Use button.
- Names in the log open the card and light the space.
- The round summaries and the results add up and say why the winner won.

It stays below a B for several reasons:
- The header shows stale turn text.
- Clicks get eaten on spaces.
- Recruiting sometimes commits on one click and sometimes asks.
- Member steals have no motion.
- Five or more panel labels failed my decipher test.
- The strip clips.

A friend could finish a game tonight but would ask what three of the spaces do.

**Grade: C+**