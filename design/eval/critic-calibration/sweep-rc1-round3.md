# RC1 sweep, calibration round 3 (brief v3): the second tester's list

A second fresh blind tester, brief v3 + checklist v3, on the same frozen RC1 build through v4-eyes only (79 commands, 92 screenshots, no DOM). Its working list (72 items) is below, tagged like sweep-rc1.md (**[Cory #N]** = answer-key item N, **[new]** = not in Cory's notes), followed by its ten audits, misreads and grade. Merged with sweep-rc1.md, the two lists reach 82% recall (results.md). Shots were under /tmp/eyes/sweep3/ (temporary).

1. [Cory #1] [major] (24) home→How to play: click 366ms first change, 914ms settle, input→paint 280ms. shot: /tmp/eyes/sweep3/002-click.png
2. [new] [polish] (30) home: logo quadrants rotate between visits (idle spin) while "Play on this device" cream pill is the CTA; fine. "Join with code" button looks disabled-dim. shot 001-home.png
3. [new] [polish] (8) How to play is a wall of text (≈4 screens) before game; Close small at top right. 002-click.png
4. [Cory #1] [major] (24) Play on this device → setup 312ms to paint. 005-click.png
5. [new] [polish] (2) setup: players named "P1..P4" placeholder-looking; Name field empty with bold P1 label; Bots level + Bot speed + Table = 3 rows of jargon-free but long form; Start button is not prominent (same size as Back, below fold after Custom). Custom table needs scroll to reach Start (008-s.png).
6. [new] [major] (5/11) Custom table: 10 quadrant tiles, 4 picks, "Pick 4, in wheel order. 4/4"; to swap you must deselect first, no explanation what each quadrant does except tiny grey one-liner ("Most badged members"); Magenta's steal isn't mentioned. 011-t.png
7. [Cory #1] [major] (24) Start → game 805ms first change, 1547ms settle. 012-click.png
8. [Cory #3] [major] (12) shop card hover (Twins) opened at x928-1248,y128-320 while pointer at x140,y640: 850px away, docked top right. 016-shopcard.png
9. [new] [major] (22) starting-resource dialog covers the lower half of wheel (Open Door, Help cut off) while picking; can't read spaces to pick toward them. 013-g.png
10. [Cory #1] [polish] (24) hover on Red pick: 83ms first change, input→paint 112ms.
11. [Cory #3, 1] [major] (12,24) every hover popover (shop card, wheel space, seat, rim, menu) opens in the same top-right dock (x928-1248,y0-400), 100-930px from pointer; first-change 70-1375ms, settles up to 2276ms on wheel spaces (e.g. Golden Years hover 78ms first change, 1367 settle; wheel hover at 808,330: 946/2276ms). Popover also moves between y12 and y138 depending on card. shot 031-rh.png, 022-h1.png
12. [Cory #1, 19] [major] (13) hover at My cutpurse member (40,508) 485ms/1237ms and at seat names 1375ms: sluggish; hovering the timeline text (290,44) / my resource row opens nothing. 
13. [Cory #1] [major] (1) click on wheel space "Help Yourself" reported NO VISIBLE CHANGE for 1.5s on first run (025-click) and again on New Faces (056-click): placement result (dialog/minion) appears only after harness wait; felt unresponsive. 
14. [Cory #10, 29] [major] (20) steal choice (Help Yourself): detached dialog with 4 text pills ("P2's gold · 2", "P2's red · 1"...) + "Take all 2 from P2's gold"; rival resources are on the board in the corners but you can't click them; dialog covers lower half of wheel. shot 026-p.png
15. [new] [major] (15) toast "You took Help Yourself" persists and accrues lines (from P2 1, from P3 2, recruited Cutpurse paid..., +1) then still says "Help Yourself" after I took New Faces; stale and repeats the log. shot 057-n.png
16. [new] [major] (2) "Extra turn: place one more minion" after recruiting Cutpurse, with "Undo buy": the word "extra" unexplained (snake order? member effect?). shot 038-c.png
17. [Cory #27, 8] [polish] (22) Recruit dialog text wraps "arrives as ◆\n). 1 ♟" - symbol orphaned onto line; cost line "Costs 2 ◆ + 2 ◎" repeated from card. shot 036-r.png
18. [Cory #11] [polish] (14) pay dialog chips under paid row show 0 0 0 0 (what remains after paying) unlabeled; reads like "I have nothing". shot 036-r.png, 067-fo2.png
19. [Cory #11] [polish] (15) pay dialog title "Buy 1 follower / Costs 2 of anything" vs Followers pill "2→1": ok but pill arrow glyph unlabeled; header "Followers for any resources" tiny. 
20. [Cory #1, 11] [major] (24) opening pay dialog 370ms first change/729 settle (scale animation, 6 frames), Confirm → 376ms first change, still moving after 5s (stolen/recruit animation). 
21. [Cory #21] [polish] (23) New Faces replaces whole shop row with a snap; no flight of old cards out. Hard to notice which cards are new. shot 057-n.png
22. [Cory #8] [polish] (8) Volunteer hover: "Free. No effect." and "Costs free" and card says "free": said 3 times. shot 059-v.png
23. [new] [polish] (6) "You'd lead, 2" / "MEMBERS" in hover: lead what? only the small caption tells. shot 063-u.png
24. [new] [polish] (1) seat "last:" tiny icon column shows last space as a glyph only (can't read). shot 038-c.png
25. [new] [polish] (28) bot turns are readable: toast beside the bot seat ("P3 took Bandwagon"), "P3 is shopping…" in title; but P4 steal toast "P4 took 1 blue from you" is a tiny pill over the wheel that fades. (positive/polish) 072-idle-frames.png
26. [Cory #37] [blocker] (13,1) Log hover on member names (Kingpin etc.): popover is dark-on-dark, name and effect text invisible; only cost line readable. Opens ~100px from pointer covering the log. shot /tmp/eyes/sweep3/083-lh.png, 085-lh2.png
27. [new] [blocker] (1,3) Another player's Even Swap silently swapped my Cutpurse for a Prospector; seat icon changed with no toast I saw (only "P4 traded Prospector for your Cutpurse" in the log, buried). I only noticed because my member icon changed colour. shot 073-cur.png, 081-log.png
28. [Cory #37] [major] (13) Log is not chronological (P2 passed/found nothing at top, my follower buy after P2's Golden Years, "Your Cutpurse: took 1 from P2" last) and has no round-separators beyond "ROUND I"; space names (Lie Low, Redistribute) not underlined while member names are → inconsistent. 081-log.png
29. [Cory #19] [major] (12) hovering my own member at bottom-left (40,510): a popover rendered clipped off-screen at bottom-left ("more." visible at y690) before docking top-right; settled 1741ms. shot 075-m.png
30. [new] [polish] (3) menu: How to play / How it works (20s) / The log / Copy game record / Leave; "Leave" sits right under Copy with no confirm known; log opens as a 420px slide panel 349ms, covering the right-side dock. 079-menu.png
31. [Cory #28] [major] (5) round I end of turn: only one open space left (Intro Offer) out of 12; all others greyed with a minion; fine, but greyed text of taken spaces is hard to read and rings "dotted" taken markers are low-contrast (073-cur.png)
32. [Cory #1] [major] (24) buying a free member (Safecracker, discounted by Intro Offer): first change 913ms, settle 2238ms, straight into Round-end summary with no beat to see the purchase land; I never saw my new member arrive. shot 094-pay.png
33. [new] [polish] (16) shop cards still print full cost (2 ◆ + 2 ◎) while Intro Offer makes it free; only the hover says "YOU PAY nothing"; "need N" corner tag was recalculated though. shot 090-mm.png
34. [new] [polish] (30) Round I summary: "+2" chip greyed "no one scored" for blue, tie-break lines "(1 red members)" plural-wrong; contests/other columns right-aligned far from names; my row shows "—" for contests; table label "OTHER" vague. shot 094-pay.png
35. [Cory #17] [major] (27) Round-end summary arrives as one dialog (4 quadrants+table); I did not get to watch Reckoning step by step before it (or it flashed past inside the 2.2s). Verify in round II.
36. [Cory #27, 23] [blocker] (22) Round II wheel: middle-ring circles overlap outer-ring circles and clip text: "Even Swap +1 ● swa", "Name Drop /badged" under Show Off, Open House sits on Even Swap, "ransom a member" cut, Half Price "half-price buy" wraps 3 lines. 9-10px type. shot /tmp/eyes/sweep3/101-zoom.png
37. [new] [major] (11,2) Round II start: prompt "P4 holds your Safecracker to ransom: pay 4 to keep it?" with the sole button "Let Safecracker go"; no way to pay shown (I had 0), header says "choose below" while seat tag shows P4 NOW; I lost a once-per-game member I had never used. The ransom also came with no earlier warning. shot 096-r2.png
38. [Cory #17] [major] (27) Round I→II: I saw no Reckoning scoring animation; frames after Start round II showed nothing; the only record is the summary table. shot 094-pay.png
39. [Cory #26] [major] (2) Kickback face says "+3 ● · gift 1", hover says "+3 ●, and +1 to a player you choose" but YOU GET says "+4 ● (you choose how)" and I ended with 4 and P2 got +1: three versions of the same text. shot 103-k.png, 109-g.png
40. [Cory #29] [major] (20) Kickback gift: detached dialog "Kickback: give 1 gold to… [P2][P3][P4]" with text buttons, not click-the-seat; covers lower wheel. shot 107-kb.png
41. [Cory #1] [major] (24) space hover latency in round II: Swap Sides first 382ms / settled 4105ms; Kickback 920/1910ms; Show first change 1004ms on ransom button hover. shot 105-ss.png
42. [Cory #8] [polish] (7) buying Middleman: 2 clicks (card, Confirm) with auto-payment; dialog title repeats card cost "Costs 2 ◎ + 2 ⊙" and repeats effect text; fine. 111-mp.png
43. [Cory #36] [polish] (21) my seat panel: 4 minions + 2 members + resources + follower count in a 310x150 box; minions are 4 tiny sprites ringing the leader — countable but looks like a pile; P2/P3 seats show members as 16px sprites. 114-a3.png
44. [Cory #10] [major] (20,6) multi-pick steal (Help Yourself, 3): choice pills reflow after each pick (row of 4 becomes 3 with different x positions, button I clicked moved), my resource row and the rivals' counts don't update until the end; no running tally of what I hold. shot 118-s1.png, 123-s3.png
45. [new] [polish] (2) steal converts everything into magenta ("+3 ◆ from P2 1 ■, P3 1 ●, P4 1 ◆"): rule is in the rulebook but nothing on the space says "arrives as magenta" until the hover. 125-s4.png
46. [new] [major] (13) hover on a rival's/my resource row (150,536 / 95,118) opens nothing (zoom 136-zoom.png) while hover on the "last:" icon opens the seat card; two different hit-areas for the same seat. Seat card names me "P1 (you)" but panel says "You": naming inconsistent, and I never named myself. 138-zoom.png
47. [new] [polish] (12) seat card hover (good content: followers, has, members, last moves) anchors beside the seat - the best popover in the game; shop/space/rim popovers all dock top-right instead. 138-zoom.png
48. [Cory #3, 16] [polish] (13) deck back "43" hover: opened docked top-right 930px away, 553ms. 
49. [Cory #3] [polish] (9) rim hover (Most gold) lists standings but "+4 at round end" and "Counts the gold you hold when the round ends" - good; but the top-right dock sits on P3's seat resources. 125-s4.png
50. [Cory #19] [polish] (22) own-member hover clipped at bottom-left (text "ddleman" cut by deck art at x16-320,y624-700) when hovering my member at (70,508). shot 140-own.png
51. [Cory #1] [major] (24) Open Door click: first change 1256ms, settle 2002ms; Swap Sides click 1310ms first change; Pass click 995ms first change / 4512ms settle; Help Yourself 1062ms. Placing/pass blocks ~1-4.5s each in round II. shots 146-od.png, 149-click
52. [Cory #29] [major] (7,20) Swap Sides is 3 clicks across a detached dialog (space, give card, take card), list of rival members overflows (Safecracker/Stylist cut at the bottom, no scrollbar visible), not selectable on the seats where those members sit. Card text in dialog is good. shot 152-sw2.png
53. [Cory #13] [polish] (8) top status row "P3 10 · P2 9 · P4 8 · You 6" under the title is unlabeled: standings or turn order? Followers also shown big beside every seat → duplicate (both places). shot 148-p1.png
54. [Cory #21] [major] (1) Open Door recruited Recluse (cheapest) with no choice and no animation of the card flying from the shop; I only see "recruited Recluse" in a toast; Middleman bonus also appeared in the toast as "+1 ●, P2 +1 ■" with no cause line. shot 146-od.png
55. [new] [polish] (4) Round II hint "Your turn — place a minion on a glowing space" vs round I "Extra turn"/"choose below": three different phrasings for the same state; "choose below" doesn't say what to choose. 150-sw.png
56. [Cory #17] [major] (27) Round II Reckoning (frames 157-idle-frames.png): banner per quadrant ("Most gold: P2 & P3 & P4 tie +4", "Most members: P3 wins +4"...) with a number badge flying to each seat; follower totals jump 9→16→21 in one frame, so who got what is only legible in the final table; "Skip" is a tiny grey tag over the bottom-right of the shop (x~1170,y~975 in sheet). ~6 s total, tie banner is long.
58. [Cory #17] [polish] (23) the Reckoning dims the wheel to flat pastel and the leader tokens' numbers (0,1,4,6) sit on seats without a label of what they count (members/gold). 
59. [new] [major] (5) I am at 6 followers vs 22: summary offers no hint why (no comparison of what leaders hold); "Start round III" is the only CTA.
60. [Cory #27, 23] [blocker] (22,1) Round III inner ring: 4 inner spaces (Spree, Hand-pick, Double Down, Shake/Push) are ~55px circles jammed against the middle ring and the hub; labels clip ("pricies", "ice buy", "cheape", "ransom a member" cut), Half Price/Show Off collide with Spree; text ~9px. shot 161-zoom.png, 160-r3.png
61. [new] [major] (13) Hand-pick hover "YOU GET 0 to +1 ●, 0 to +2 ♦, +1 ♟, +1 member — depends on your choice" is garbled and wraps; the "MEMBERS P3 6 · P4 6 · P2 5" line has no label of what it counts beyond tiny caption. shot 163-hp.png
62. [Cory #29] [major] (20) Hand-pick choice is a detached modal list (10 cards, overflows, cost lines in ghost grey, cut at bottom) although the same 10 cards sit face up in the shop 100px below; should click the shop card directly. shot 165-hp2.png
63. [Cory #33] [major] (18) Once-per-game "Use" button on my Speculator is a ~30px grey pill under a 20px sprite, appears silently, and Use has no confirm/toast: gold 1→2 just ticks, button vanishes, nothing says "used". shot 167-sp.png, 169-use.png
64. [new] [polish] (22) toast "You took Hand-pick" overlaps the top of my seat panel (covers "You" header) in 167-sp.png.
65. [Cory #1] [polish] (24) Hand-pick click: 399ms first change / 2315ms settle. Use click 222/1111ms.
66. [new] [major] (15) Results: standings table (rank, followers, breakdown) is repeated directly below as four big seat rows with the same names, counts and final totals (64/40…). Both on one screen; table kept, rows dropped. shot 203-res.png
67. [new] [polish] (2) Results/round summaries call bots "P3 · bot", me "You", seat card "P1 (you)"; "Yourself" column, "Effects", "Contests", "Other" vs "From members": undefined terms for column names.
68. [Cory #12] [major] (1,5) the bot buys +13/+14 followers and wins 64–12: no hint during play that buying followers is the dominant plan; the 10→10 pill is 120px of grey text. shot 201-end.png
69. [new] [polish] (30) Round III summary clips its end-game line ("End-game bonuses come next: P4 Kingpin +1, Recluse +2" faded behind "More below ↓"); nested scroll. shot 201-end.png
70. [new] [major] (3,24) buttons in the title bar change position between states (Pass at x706, 758, 768 with Release…/Undo placement appearing and disappearing); I clicked Undo placement by accident when I meant Pass. shot 191-now.png
71. [Cory #28] [polish] (9) clicking a taken space (Tithe) does nothing, no message or shake; taken spaces differ from open ones only by fading. shot 173-a.png
72. [Cory #1] [polish] (24) "Start round III"/"See results" click reports NO VISIBLE CHANGE for 1.5s.
## Section E audits

1. **Call to action.**
   - Home: the cream "Play on this device" pill. Right.
   - Setup: the cream selected pills and "Start" at equal weight with Back, below the fold. The eye lands on the toggles, not Start. Wrong.
   - Resource pick: the four coins. Right.
   - Place: glowing spaces plus an italic title. OK.
   - Choice dialogs: the cream panel over the board. OK, but it hides the wheel.
   - Buy: Pass is a tiny outlined pill and the shop cards are dimmed. Weak.
   - Pay: Confirm. Right.
   - Round end: cream "Start round" button. Right.
2. **Card anatomy.** From loudest to quietest: the portrait, then the name, then the cost and corner follower mark, then the "need N" tag in the top right, then the colour tint. The effect text is not on the card at all, so you must hover to learn what it does. That is the wrong order for a buyer. The "need N" tag is useful. The cost glyphs "2 ◆ 2 ◎" duplicate the pay dialog and the hover.
3. **Glyph census.** About 25 marks to learn:
   - Resource and score: four resource colours (● gold, 💧 red, ■ blue, ◆ magenta), any-resource ring ◎, follower person mark.
   - Space and member marks: blue diamond badge on members, quadrant icons on spaces.
   - Seat and turn marks: leader figure, minion sprites, pixel avatars, NOW / NEXT / DONE tags, "last:" glyphs.
   - Controls and state: ↶ undo, ☰ menu, → in "2→1", the "+N" badges, and the three round dots.

   The "last:" glyphs are illegible. The badge diamond and the magenta diamond look alike. The red droplet is drawn one way in the shop and another on seat rows. Followers are a mark in some places and a word in others.
4. **Duplicate census.**
   - Followers appear in the seat count and the status row. Keep the seat count.
   - Costs appear on the card, in the hover and in the pay dialog. Keep the hover.
   - Effects appear in the dialog, the hover and the log.
   - Taken spaces appear as a minion on the wheel, in the seat's "last:", and in the toast.
   - The results table is duplicated as seat rows.
   - Volunteer's text is repeated three times.
5. **Prominence.** Place a minion: the biggest control, glowing, right. Recruit: the shop row, bottom, large, good. Buy followers: four small grey pills on the far right, and it is the winning strategy. Pass: a tiny pill at the top. Release…: a tiny pill that moves. Use: 30px. Menu / log: one icon. Undo: small but present.
6. **Order.**
   - Shop: roughly cost-ascending/mixed, with no visible rule; it refills at the head.
   - Seats: members in recruit order, with no visible grouping by colour.
   - Choice lists: rivals in seat order.
   - Hand-pick: shop order.
   - Swap Sides: by owner (P2 then P4), unlabelled.
   - Log: not chronological.
7. **Hover census.**
   - Shop cards: popover top-right, 250–930px away; useful (effect, you pay, leaves).
   - Wheel spaces: top-right, 90–400px away; useful (full text, you get, standings, unlocks).
   - Rims: top-right, 300px; the best content.
   - Seat name and "last:": next to the seat; good.
   - Deck back: top-right, 930px; adds little.
   - Pass, Release and the round dots: top-right; thin.
   - Resource rows and the "last:" tags of rivals: nothing.
   - Log names: dark-on-dark.
   - Taken spaces: the hover works.

   I did not read every wheel space's text once per ring, but I did read the outer, middle and inner examples above.
8. **Motion and art.**
   - The pay dialog scales in and settles around 700ms.
   - The wheel spins with no visible change to the state (I did not try spinning it).
   - Bot toasts appear at their seats and fade.
   - Reckoning banners and badges fly.
   - The shop snaps on New Faces.
   - Steals and recruits show no flight.

   The pixel art is a consistent set but samey at 16px: several member sprites are hard to tell apart on seats.
9. **Space budget.**
   - Wheel (~420px): dense and over-crowded in Round III.
   - Bot seats (corners): mostly empty, with resources and members in tiny rows.
   - My seat (310×150): cramped.
   - Shop row: wide, and the cards leave little room for text.
   - Dead space: the screen sides left and right of the wheel and the wide gap beside the dialogs.
10. **Decipher test.**

| Label | My guess | Actual |
|---|---|---|
| "/badged" | per badged member | +1 blue per badged member |
| "ransom a member" | take a member | take a rival's member for ransom |
| "Spree buy 3 times" | buy three | take three buys |
| "Double Down double" | doubles | doubles gold |
| "need N" | missing resources | more resources needed |
| "Shake Down" | steal | ransom |
| "gift 1" | give a follower | give a resource |
| "2→1" | trade | 2 for 1 follower |

## Misreads
- I took the Cutpurse in the seat for the Prospector's colour.
- I read "Extra turn" as a bot turn.
- I read "P3 10 · P2 9 · P4 8 · You 6" as turn order.
- I assumed "NOW" and "NEXT" tags were the same as who acts.
- I read the "Skip" tag at the bottom right as belonging to the shop.
- I took the top-right dock for a scoreboard.
- I mistook my own click on Undo placement for Pass.

## Grade
**D+.** Taking the starting grade of D, it goes up for the readable summary and for a recruit/pay flow that works. A B, "a friend could play it tonight without asking", is not met: the wheel clips text in Rounds II and III, the log popovers are unreadable, there are second-long waits, a member was silently swapped away, and the Round I scoring was never shown. The pay dialog, the seat-card hover and the bot-turn toasts are the pieces I'd keep.
