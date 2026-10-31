# RC1 sweep: the screen-only critic's full list (calibration round 2, the longest single list)

Fresh blind tester, brief v2 + checklist v1, driving the frozen RC1 build (fd4d734, :5191) through scripts/v4-eyes.mjs only (96 commands, 101 screenshots read, no DOM). 116 findings plus the audits, verbatim. Shots are under /tmp/eyes/sweep2/ (temporary).
Tags: **[Cory #N]** matches item N of answer-key.md (Cory's own play notes); **[new]** is something Cory didn't mention: that's our backlog of low-hanging fruit beyond his list (60 here, 26 more in sweep-rc1-round3.md). Recall for this run: results.md. Some findings may already be fixed on the live branch (RC1 is older); verify on the current build before acting.

## Home / How to play / Setup
1. [new] [polish] (2,30) Home — "v0.2" version stamp sits between title and tagline → developer artifact on the title screen. shot: /tmp/eyes/sweep2/001-home.png
2. [new] [major] (6,10) How to play — wall of prose describing "small colored symbol", "ringed symbol", "little-person mark" with zero pictures of them → the glyphs it asks you to learn are never shown. shot: 002-click.png
3. [new] [polish] (4) Home — rulebook says "type your name and pick your emoji" on home; home has no emoji picker, name only lives under the online box, local play has a separate name field → two name entries. shot: 001
4. [new] [major] (11) Setup — Start is a small cream pill same size as Back; the loudest elements are the 9 cream selected toggles (Person/Bot/Normal/Custom) → eye lands on toggles, not Start. shot: 004-click.png
5. [new] [major] (11,21) Setup Custom — choosing Custom pushes Start below the fold (y≈690 at 700px viewport) → you must scroll to find the only button that matters. shot: 006-click.png
6. [new] [major] (2,10) Setup Custom — quadrant chips state only the scoring rule ("Most gold", "Most Magenta members"); nothing says what the quadrant DOES (Magenta steals) → I had to rely on the rulebook to pick the steal table. Hover on chips opens nothing. shot: 008-custom2.png
7. [new] [polish] (2) Setup — "Blue (plain)", "Green (plain)" read as internal variant ids; "plain" undefined in rulebook. shot: 008
8. [new] [polish] (9) Setup — Blue (plain) greys out when Blue picked, with no reason shown; Start dims to grey at 3/4 with no message near it. shot: 009-click.png
9. [new] [polish] (4,30) Setup — "Most Magenta members" capitalized vs "red members" lowercase on neighbouring chip. shot: 008
10. [new] [polish] (2) Setup — "Pick 4, in wheel order. 4/4": what is "wheel order", and the corner numerals 1-4 on chips are unexplained. shot: 011-cust3.png
11. [new] [polish] (13) Setup — hovering a quadrant chip: NO VISIBLE CHANGE within 1.5 s. shot: 005-hover.png
## Start / starting picks / first turn (round I)
12. [Cory #1] [major] (24) Start → game: first change 441 ms, settle 673 ms. shot: 012-click.png
13. [Cory #5] [blocker] (16,6) Shop — card faces show only portrait, name, cost, follower mark: NO effect text. Deciding what to buy (and what to pick resources toward at setup) needs a hover on each of 10 cards. shot: 014-zoom.png
14. [Cory #3] [major] (12) Shop hover — card popover docks top-right over P3's seat, 344–434 px from the pointer; eye has to jump across the screen for every card. shot: 013-hover.png, 046-hover.png
15. [Cory #3] [major] (12) Wheel hover — every space's popover docks in the same top-right box (98–478 px from pointer); first change 157–223 ms on several (Intro Offer 157, Golden Years 223, Help Yourself 193, Redistribute 186). shot: 022-hover.png
16. [new] [blocker] (1,14) Wheel hovers — the standings lines ("MAGENTA MEMBERS You 0 · P2 0 · P3 0", "GOLD P2 1 · You 0 · P3 0") list only 3 of 4 players; P4 is never mentioned → you misread who leads. The rim hover does list all four. shot: pops1.png (montage of 025–039)
17. [new] [major] (2,8) Snap Up hover "YOU GET 0 to +2 ■, −2 to 0 ◆, 0 to +1 ♟, 0 to +1 member, next member −0–2 · depends on your choice" → unreadable algebra. shot: 033-hover.png
18. [Cory #18, 26] [polish] (2) Space faces use shorthand that the hover expands differently: "+1 ■ /badged" (hover: "per badged face-up member"), "steal 1 each richer" (richer in what? hover: resources), "steal 2" (hover: 2/3/4 by round), "/recruit". "/badged" reads as code. shot: 021-zoom.png
19. [new] [polish] (2) "Unlocks Mole, Desperado", "Sweeps away", "Opens round II" in space hovers — "unlocks" is not a rulebook term. shot: 022-hover.png
20. [Cory #27, 22] [polish] (22) Wheel — text clips the circles: "steal 1 · safe" runs to the edge of Lie Low, "Even Swap +1 ◆ · swap" touches the edge, "Snap Up +2 ■ · / recruit" breaks mid-phrase; rim text "ties: blue members" and "ties: red members" runs under the spaces. shot: 021-zoom.png
21. [new] [polish] (13) Round hub (ROUND I ●○○) — hover opens nothing. shot: 036-hover.png
22. [Cory #1] [major] (25) Wheel hovers keep the screen moving: "still moving after 5 s" on 11 of 15 hovers, settle 2286–4269 ms on others → constant pulsing behind the text you're reading.
23. [Cory #28] [major] (11) First turn — "place a minion on a glowing space": the glow on the 12 outer spaces is barely visible; at a squint the loudest things are the shop cards and the cream Pick panel. shot: 019-setupbots.png
24. [new] [polish] (15,8) Setup — "Pick a starting resource (1 of 2)" said twice: header and panel title. shot: 012-click.png
25. [Cory #14] [major] (21) Starting-pick panel covers the bottom half of the wheel at the moment the rulebook tells you to plan; bot seats are ~300×350 px of empty wood. shot: 012-click.png
26. [Cory #1] [major] (24) Place on Help Yourself: first change 458 ms, settle 989 ms. shot: 040-click.png
27. [Cory #10, 29] [major] (20) Steal choice is a detached list of text buttons ("P2's gold · 1", "Take all 2 from P3's red") under the wheel, not picked on the rival's seat/resources. 3 clicks for steal-2. shot: 040-click.png
28. [Cory #10] [blocker] (5,30) Steal picker reflows after the first pick (shrinks, buttons move up); my second click at the old "P2's red" position landed on nothing (NO VISIBLE CHANGE). shot: 041/042-click.png
29. [new] [major] (3) "Undo placement" disappears as soon as you pick the first stolen resource; no way back from a mis-steal. shot: 042-click.png
30. [new] [polish] (15,8) Steal step says the same thing three times: header "Help Yourself: choose below", toast "You took Help Yourself", panel "0 of 2 taken · Help Yourself: take 1 resource (2 left)" ("0 of 2 taken" and "2 left" are the same count). shot: 040-click.png
31. [Cory #21] [major] (26) Steal resolves with no motion: resources vanish from P2/P3 and appear in my seat (+2 ◆) with no travel; 191 ms first change. shot: 044-frames.png
32. [new] [polish] (22) My minion sprite sits on top of the Help Yourself label, hiding the name of the space I took. shot: 043-click.png
33. [new] [polish] (2,14) Shop "need 2"/"need 4" corner badges on unaffordable cards: need 2 of what? The hover says "2 more (2 blue)". shot: 043-click.png
34. [Cory #8] [polish] (8) Shop header "2 you can afford · hover to see the cost" — the cost is printed on every card already. shot: 043-click.png
35. [new] [polish] (13) Followers buy chip (4→3) hover: NO VISIBLE CHANGE. shot: 045-hover.png
36. [Cory #9] [polish] (4,17) Follower mark drawn two ways: filled person in seats/header ("1 ♟"), hollow outlined person on card footers with no number. shot: 048/049-zoom.png
37. [Cory #1] [major] (24) Confirm recruit: first change 406 ms, settle 1771 ms. shot: 050-click.png
38. [Cory #8] [polish] (8,16) Shop card hover says "In the shop" — of course it is. shot: 013-hover.png
39. [new] [major] (19) Shop refill: after I took Mole, every card shifted one slot left and the new one appeared at the far right end, away from the pile at the head of the row the rulebook describes → the whole row moves under your eye. shot: 050-click.png
40. [Cory #35, 20] [major] (21,23) My recruited member is a ~20 px sprite floating under my leader with no name or cost; my seat box is 310×150 with most of it empty. shot: 050-click.png
41. [new] [polish] (22) A stray P2 ghost sprite floats in empty wood at (238,152) beside the toast, unattached to anything. shot: 050-click.png
## Bots, second/third placement, round I end
42. [Cory #22] [major] (22) Wheel rim — all four leader sprites tied on MOST MEMBERS pile on top of each other on the rim and cover its text ("ties: red ." truncated). shot: 054-zoom.png
43. [Cory #19] [major] (12,22) Hovering my own member opens its popover off the bottom of the screen (y 624–700, clipped; only "from each player with more followers" visible). shot: 055-hover.png
44. [new] [polish] (4,30) Seat member popover is dark with a colored left bar; shop/space popovers are cream cards → same kind of thing, two looks. shot: 056-hover.png
45. [Cory #1] [polish] (24) Member hovers in seats: 244 ms and 343 ms to first change. shot: 055/056
46. [new] [major] (7,8) Redistribute with only one legal target still opens a picker with a single button "P2's red · 1" → a forced click. Its header "take 1 resource (2 left, at least 1 from P2)" promised 2, I got 1, no explanation. shot: 057-click.png
47. [new] [blocker] (1,2) After Redistribute the header reads "Extra turn: place one more minion" with no reason; the rulebook has no extra turns, and no buy step was offered for the Redistribute turn. I can't tell whether it's snake order or a rule. shot: 059-r.png
48. [Cory #1] [major] (24) Placing on New Faces: first change 1050 ms, settle 2637 ms. shot: 060-click.png
49. [new] [major] (1,4) The toast after New Faces still says "You took Redistribute" but lists "+2 ■ +1 ◆", merging two different spaces under the wrong name. shot: 060-click.png
50. [Cory #3] [major] (12,22) Shop hover for Front-runner docks at the top right (y 0–304) and fully covers P3's seat: name, score and resources. shot: 062-hover.png
51. [Cory #8] [polish] (8) The card popover narrates "Click the card to recruit it.", plus "'any' is taken from what you hold most of. You choose when you recruit." → 2 lines of UI instructions inside the card. shot: 062-hover.png
52. [Cory #6] [polish] (2) "Costs 2 ◎ · colorless" — "colorless" isn't a rulebook term. shot: 062-hover.png
53. [Cory #11] [polish] (6) Pay dialog: tapping magenta swapped out the 2nd blue coin; nothing shows which coin will be replaced before you tap. shot: 064-click.png
54. [Cory #11] [major] (21) Pay dialog is a centered modal that dims the whole board, including the resources it's spending. It has an inline-row height of ~290 px and could sit by the shop. shot: 063-click.png
55. [Cory #17] [blocker] (27,1) Round I's Reckoning ran entirely during the bot turns while I waited. Each quadrant banner shows for ~1–1.5 s, seat totals jump before their banner (P2 6→7 during the "Most gold: P3" banner), and the +2 tokens are ~12 px. I couldn't narrate it from the frames. shot: 066-idle-frames.png
56. [new] [polish] (2) The summary column "CONTESTS" isn't a rulebook word (the rulebook says rules/quadrants); "OTHER +2 from members" — the rulebook says members are worth followers, but "other" hides that. shot: 067-t3.png
57. [new] [polish] (15) Round summary repeats the full standings for each contest (e.g. "You 2 (0 red members) P4 2 (0 red members) P3 1") that the rim hovers already give; 4 tiny grey lines per row. shot: 067-t3.png
58. [new] [polish] (2) "Most Magenta members" (capital M) vs "Most members", "Most gold" in the same list. shot: 067-t3.png
## Round II
59. [Cory #27, 23] [major] (22) Middle ring text overflows: "half-price buy", "ransom a member", "swap a member", "steal 3", "/member" spill out of their circles; the Open House icon overlaps Even Swap's "swap"; "· swa" clipped. shot: 070-zoom.png
60. [new] [major] (22,1) Taken spaces: the minion sprite covers the space name ("Swap Sides", "Shake Down", "Crime Wave" unreadable once taken) → can't see what rivals took without hovering. shot: 108-t.png
61. [new] [blocker] (16,1) The 3-player standings bug recurs in round II: Show Off lists "P4 1 · You 0 · P2 0" (P3 missing); Crime Wave lists "You 1 · P2 1 · P3 0" (P4 missing). Hover standings always drop one player. shot: pops2.png
62. [new] [major] (2,8) Shake Down hover "YOU GET 0 to +4 ◆, 0 to +1 ♟, 0 to +1 member · depends on your choice · a rival decides part of it · rivals −4 to 0 ●, −1 to 0 ♟, −1 to 0 member" → 6 lines of ranges, unreadable. shot: pops2.png
63. [new] [polish] (13) No hover on: P2 name, P2 resource counts (35/60,116), header standings line (You 5 / P2 7), follower buy chips (10→10, 8→6), my resource counts. The rulebook says costs/holdings are "one hover away". shot: 081–086, 091
64. [new] [polish] (4) Seat hover calls me "P1 (you)", the seat says "You", the summary says "You" → two names. shot: 088-hover.png
65. [Cory #9] [polish] (4,17) "Any" drawn as a rainbow ring in costs, but as a plain grey circle labelled "Colorless" in the deck popover. shot: deck.png
66. [Cory #3, 16] [major] (12) Deck popover docks 930 px from the deck it describes. shot: 087-hover.png
67. [Cory #19] [major] (12) My seat's member hovers still open below the screen edge (only "Costs 2 ◎ colorless" visible under the deck). shot: mem.png, 090-hover.png
68. [Cory #1] [major] (24) Crime Wave placement: input→paint 624 ms, settle 1113 ms. shot: 093-click.png
69. [Cory #10] [blocker] (5,6) Steal picker reorders its buttons after every pick (P2's red first, then P3's gold first, then P2's red first again) → clicking the same spot takes a different rival's resource. shot: 093/095/097
70. [Cory #10] [major] (1,2) Steal counter is inconsistent: "Crime Wave: take 1 resource (3 left…)" with no tally, then "0 of 1 taken … (1 left)" after 2 picks; rivals' counts don't drop until the end. shot: 097-cw3.png
71. [new] [blocker] (3) The Release… dropdown ignores Esc (stays open after Escape). shot: 102-press.png
72. [new] [major] (20,18) Release lives in a header dropdown "Release…" ("Mole +2 ◆", "Front-runner +2 ◎"), not on the member in my seat; the button is a small grey pill with no hint of what it does. shot: 101-rel.png
73. [new] [polish] (2) Buy-followers dialog: "Costs 4 of anything" (rulebook: "any resources"). shot: 103-click.png
74. [Cory #27] [polish] (22,30) Cutpurse pay dialog wraps "(it arrives as ◆ / ). 1 ♟", leaving the closing paren orphaned on its own line; the follower value is glued onto the effect sentence. shot: 105-click.png
75. [new] [major] (2,1) The back-to-back snake-order turn is announced as "Extra turn: place one more minion", which reads like a bonus. Seen twice. shot: 115-click.png
76. [new] [major] (1) Toast is stale: after I took Golden Years (+4 gold), the toast still reads "You took Help Yourself +3 ◆ from P3 3 paid 4 ◆ +3". shot: 118-gy.png
77. [new] [polish] (11,5) Buy-step header holds three equal small pills, "Release…", "Pass", "Undo placement"; Pass (ends turn) has the same weight as Undo. shot: 118-gy.png
78. [Cory #13] [polish] (1,15) The header standings line reorders by score ("You 10 · P2 9 · P4 6 · P3 4") while the seat badges show turn order (4TH/NEXT/3RD); both use ordinal-looking lists, and neither is labelled. shot: 122-click.png
79. [new] [polish] (11) A stale wheel-space popover (Golden Years) opens during the buy step because the pointer rests on the dimmed wheel. shot: 113-hy2.png
80. [Cory #1] [major] (24) Confirm Treasurer: first change 724 ms, settle 2768 ms; click on a shop card 311 ms. shot: 122-click.png
81. [Cory #20] [polish] (23) Members in seats are ~20 px sprites in a row with no names; with 4 members I can't tell Mole from Cutpurse (both pink hooded) without hovering. shot: 122-click.png
## Round II end / Round III
82. [new] [major] (5) Buy 2→1 followers with gold: no warning that spending gold drops me in Most gold (Treasurer's hover did warn "P3 would lead"), so the warning shows on one buy and not the other. shot: 130-pay.png
83. [Cory #17] [blocker] (27,1) Round II Reckoning: seat totals jump to final (P2 18, P4 17) before the first banner, so the banners then "award" points the seats already show. Banners last ~0.8–1.5 s each, unexplained 0/1/2 counters pop over each leader, and the summary cross-fades in with the wheel showing through it. shot: 133-idle-frames.png
84. [new] [polish] (2,14) Summary "+2 from members" for me although I hold 4 members (it means members recruited this round); "+1 effects" for P4 with no source. shot: 134-sum2.png
85. [Cory #1] [major] (24) "Start round III": NO VISIBLE CHANGE within 1.5 s after the click. shot: 135-click.png
86. [Cory #23, 27] [major] (22) Inner ring collides with the middle ring: Spree covers "half-price buy", Hand-pick hyphenates to "Hand-/pick", "steal a member" spills out of Poach, the Double Down icon cuts into the hub. shot: 137-zoom.png
87. [Cory #9] [polish] (17,22) The badged ◆-blue mark on members floats up and to the right between two sprites, so it isn't clear which member it belongs to. shot: 138-zoom.png
88. [Cory #19] [blocker] (22,12) Rival member hover (P4's Squatter) opens a dark popover BEHIND the Followers chips and shop cards; its text is covered ("Once per round: place a minion on a…"). shot: p4m.png
89. [new] [major] (2,8) Hand-pick hover: "YOU GET 0 to +5 ●, 0 to +2 ◆, 0 to +1 ◆, +1 to +2 ♟, +1 to +2 members · depends on your choice · rivals −1 to 0 ●" → noise. shot: pops3.png
90. [Cory #1] [major] (24) Help Yourself placement in round III: first change 904 ms, settle 2108 ms. shot: 150-h3.png
91. [Cory #29, 10] [major] (20,21) Double Agent swap: a scrolling grid of 11 rival cards in a detached panel over the wheel, cut off at the bottom; needs a scroll to reach P4. Not picked on the rivals' seats. shot: 156-sw.png, 158-sw2.png
92. [Cory #6] [major] (16) In the swap grid the cost line ("Costs 2 magenta + 2 any") is pale yellow on cream, nearly invisible. These cards also prove the effect text fits on a card face, yet the shop omits it. shot: 158-sw2.png
93. [new] [polish] (1) During the buy step (Double Agent choice) the step indicator still lights "● PLACE", not "RECRUIT OR BUY". shot: 156-sw.png
94. [Cory #21] [major] (26) The swap resolves with no motion: Straggler appears in my seat and Double Agent in P4's without travelling; 325 ms to first change. shot: 160-frames.png
95. [Cory #6] [polish] (4,2) The swap/pay text spells costs out in words ("Costs 1 red", "2 magenta + 2 any") where cards and shop use symbols → two notations. shot: 158-sw2.png
## Round III late / results
96. [Cory #1] [major] (24) Round III responses: Open Door placement 1662 ms to first change, Pass 962 ms, Crime Wave 848 ms, Even Swap 2073 ms, Straggler pick 741 ms. shot: 164-od, 168-cw, 187-es, 198-st
97. [new] [blocker] (1,4) The toast names the wrong space: "You took Open Door" lists the Crime Wave steals; later "You took Open House … recruited Kingpin, Pied Piper, Minimalist (paid 2 ◆) · 1 member gone" presents a free swap as a paid recruit. shot: 175-c4.png, 191-es3.png
98. [new] [major] (1) Pied Piper's +2 red fired silently; the toast says "paid 2 ◆" though I paid 2 red + 2 ◆. shot: 185-end.png
99. [new] [polish] (22) Two minions stacked on one space (Golden Years, Collect Debts) hide the space entirely. shot: 162-t5.png
100. [new] [major] (1) P3's seat score went blank (only the follower glyph) during a bot turn. shot: 177-t7.png
101. [new] [major] (6) Even Swap ("get one of theirs of equal cost"): the pick-yours step shows no cost on any member. shot: 187-es.png
102. [new] [polish] (12) A stale wheel popover (Double Down) opens beside the Even Swap picker while I'm choosing. shot: 189-es2.png
103. [Cory #29] [major] (20) Straggler move = two detached text lists ("Open Door (Red)", then "New Faces (Blue)") instead of moving the minion on the wheel; 3 clicks. shot: 196-fin.png, 198-st.png
104. [Cory #17] [blocker] (27) Round III Reckoning never showed: NO VISIBLE CHANGE for 1.5 s after my last move, then the summary was already up. shot: 200/201
105. [new] [polish] (8,21) Round III summary hides the end-game bonuses behind "More below ↓", a scroll inside a modal. shot: 201-st3.png
106. [Cory #1] [major] (24) "See results": NO VISIBLE CHANGE within 1.5 s. shot: 203-res.png
107. [new] [major] (15,21) Results show each score 3 times (table 39, seat card "39 ♟", big "39" at the right); seat cards are 1230 px wide with ~850 px empty. shot: 203/205
108. [new] [polish] (8) Results "Yourself" column is 1 for everyone. shot: 203-res.png
109. [new] [major] (1,4) The game log only appears on the results screen; during play there's none. It calls me "P1" where every screen says "You"; "ROUND III · 87" is an unlabelled number. shot: 205-res2.png
110. [new] [polish] (2) Results headline "mostly from contests (+16; Most Magenta members two rounds of three, +10)" — "contests" isn't a rulebook word. shot: 203-res.png
111. [new] [polish] (21) Results columns spread across 1230 px ("Followers" 160 px from "From members", "Yourself" at the far edge) → hard to read across a row. shot: 203-res.png
112. [new] [polish] (14,17) Seat "last:" shows a ~10 px space icon, unreadable and never explained. shot: 122-click.png
113. [new] [polish] (4) The seat badge slot mixes order (4TH/3RD/NEXT), state (NOW/DONE) and a "bot" label that appears only from round II. shot: 069-r2.png, 124-w.png
114. [Cory #12] [major] (18) Follower buys are 4 small 30 px outline chips at the right end of the shop strip; affordable vs unaffordable differs only by a faint fill; "8 left" is ~8 px text. I used this buy 3 times. shot: 099-cw4.png
115. [Cory #26] [polish] (2) "steal 1 · safe", "/badged", "/recruit", "/member" — "safe" and the slash notation are never defined. shot: 021-zoom.png
116. [Cory #9, 24] [polish] (17) The badged mark (blue ◆) and the magenta resource (◆) are the same diamond in two colors; at 10 px they read as one glyph. shot: 138-zoom.png

# Audits
## 1. Call to action
- Home: Play pill reads first ✔.
- Setup: eye lands on the cream Person/Bot toggles; Start is a small pill, below the fold once Custom is open ✘.
- Starting pick: the cream Pick panel and its colored buttons win ✔ (but they cover the wheel).
- Place: the shop cards win; the glow on legal spaces is faint ✘.
- Steal pick: the panel wins ✔; the buttons shuffle ✘.
- Buy: the affordable card glows ✔; follower chips are invisible ✘; Pass is the same as Undo ✘.
- Pay: the Confirm pill wins ✔.
- Swap/Straggler: the panel wins ✔; cost/meaning missing ✘.
- Round end: Start round II/III pill wins ✔.
- Results: the "P4 wins" headline wins ✔; Play again is fine.
## 2. Card anatomy (Front-runner)
- Face, loudest to quietest: portrait 80 px → name (bold) → cost "2 ◎" (small) → hollow follower mark → "need N" tag. No effect text.
- Hover: name → "1 ♟" → effect sentence → "Costs 2 ◎ · colorless" → "In the shop" → divider → YOU PAY / LEAVES / NEED (red, loud) → "'any' is taken from…" → "Click the card to recruit it."
- Wrong order: the effect should be on the face, under the name, with the cost second. Cut: "In the shop", "Click the card…", the "any" explainer, "colorless", and the duplicate Costs line (YOU PAY already says it).
## 3. Glyph census (26)
- Resources: gold coin ●, red drop, blue square ■, magenta diamond ◆, rainbow ring (any), grey dot (colorless/any in the deck popover).
- Marks: follower filled person ♟, follower hollow outline (two ways), badge blue ◆ (looks like magenta ◆), round pips ●○○, step dots ● PLACE ○ RECRUIT, roman II/III on locked spaces, ROUND hub.
- Badges: NOW/NEXT/4TH/3RD/DONE, "last:" micro icon, "need N" tag, ✓ Paid in full, ↶ undo, ☰ menu.
- Board: deck back with count, glow ring on legal spaces, cyan dashed ring on spaces (meaning never learned), leader robe with emoji, minion emoji, Reckoning +N coins and 0/1/2 counter bubbles, quadrant color dot bullets.
- More than 7 before the first move; can't name: the dashed ring, the counter bubbles, "last:".
## 4. Duplicate census
- Score: seat big number + header standings line + seat hover + summary. Keep the seat.
- Turn order: seat badges + header line (which actually sorts by score, not order). Keep the badges.
- Prompt: header + panel title + toast ("Help Yourself: choose below" / "You took Help Yourself" / "Help Yourself: take 1"). Keep the panel.
- Cost: card face + hover Costs + hover YOU PAY. Keep face + YOU PAY.
- Quadrant leaders: rim emoji + every space hover's standings line + rim hover + summary. Keep the rim.
- Round: hub "ROUND II" + header "ROUND II · 4 MINIONS EACH" + pips. Keep the hub.
- Results score: table + seat card + big number. Keep the table.
## 5. Prominence
- Place a minion (5×/round): spaces are 60–70 px circles, OK, but the glow is faint.
- Recruit (~1/turn): big cards, good.
- Buy followers (used 3×): tiny chips, too quiet.
- Release (0×): small pill, fine.
- Pass (~2×): small pill, equal to Undo, too quiet for a turn-ender, with no confirm.
- Undo (0×): equal to Pass.
- Skip Reckoning: a tiny "Skip" pill bottom right, never reachable for me since it played during bot turns.
## 6. Order
- Shop: refill order, new card appended at the right, not by cost or color, and the order isn't visible. The pile is at the left "head".
- Seats: P2 TL, P3 TR, P4 BR, You BL; the turn order isn't readable from the layout.
- Header standings: by score, unlabelled.
- Seat members: recruit order; badges float.
- Steal choices: by player then color, re-sorted after each pick.
- Swap grid: by player, then in recruit order.
- Straggler lists: no visible order.
- Summary players: by followers ✔.
## 7. Hover census
- Wheel spaces: the popover always docks top-right, 98–480 px from the pointer; it adds the full text, YOU GET, standings (always missing one player) and unlocks. Many settle in 1–4 s.
- Shop cards: dock top-right, 344–830 px away; they add the effect (needed).
- Deck: docks 930 px away; color counts (useful).
- Own members: open off the bottom of the screen.
- Rival members: open under the shop.
- Player icon: dock (followers/has/members, useful).
- Rim: list of all 4 (useful).
- Nothing on: setup chips, hub, player names, resource counts, header standings, follower chips.
## 8. Motion and art
- Steal: snaps, no travel.
- Recruit: the card leaves the shop and the row shifts; the member appears in the seat without travel.
- Swap: snaps.
- Reckoning: a banner per quadrant at ~1 s each, with seat totals already final.
- Wheel spin: NOT TESTED (ran out of time; no affordance hinted it).
- Art: pixel portraits are charming and distinct in the shop at 80 px, but samey at 20 px in seats (Mole vs Cutpurse, Mentor vs Patriarch). Leaders are identical grey robes differing only by a 6 px emoji. Minion emoji are readable.

# Misreads
1. "Extra turn" read as a bonus for Redistribute (it's the snake order).
2. Thought Redistribute would give me 2; it gave 1 with no reason.
3. Thought my second steal click registered; the buttons had moved.
4. Read the space-hover standings as complete (P4 was missing).
5. Read the toast "You took Redistribute +2 ■" as Redistribute giving blue.
6. Read the badge ◆ next to members as magenta.
7. Thought round I scoring hadn't happened yet (it ran during bot turns).
8. Read "need 2" as 2 resources of the card's color.
9. Thought P3's score was 0 when its seat number blanked.
10. Thought Open House would let me choose; it auto-took Kingpin.
11. Read the round II seat totals as pre-scoring, but they were post-scoring.
