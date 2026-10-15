I played one full Classic game and all of round I on a Random 4 table with Magenta and Silver: 53 findings, 0 blocker, 19 major, 34 polish. Grade **C+**.

**report.md was not written.** The harness refused the Write ("subagents should return findings as text"), so the full report is below and I didn't work around the block. The running notes are in `/home/user/patrons/design/eval/wave2/tester-a/sweep.md`, and all 334 screenshots are in `/home/user/patrons/design/eval/wave2/tester-a/shots/`. v4-eyes is stopped.

**Coverage:**
- Game 1: Classic table (Gold, Red, Blue, Green) against 3 Normal bots, played to the end. Final: P2 61, P3 60, P4 42, me 24.
- Game 2: Random 4 (Magenta, Silver, Red, White), round I.
- Done: spun the wheel by drag and by arrow key, guessed every panel before hovering it, did hover sweeps in rounds I, II and III, paid for members with mixed resources, released a member, stole three ways, gave a gift, copied a space, swapped a member, used a once-per-game member, and watched every round end and the results.
- Speed: the box ran at load 19–28 on 4 CPUs, so I only cite animation lengths and waits, not response times.

## Top 10
1. **Safecracker's "Use now" wastes the ability.** It spent the once-per-game ability with no warning while every rival held 0 magenta, and showed no result. The header still said "…or use Safecracker" afterwards. (329, 330, 331)
2. **Open Door result hidden.** After I placed on Open Door, the turn auto-passed ("Nothing you can afford") and round-end scoring started at once. I never saw what I got. (113, 114, 115)
3. **Extra Hand is a dead buy in round III.** Its card says "+1 minion in round III". Bought during round III it gave no minion, and nothing warned me. (217, 225, 260)
4. **Default payment threw away a rim lead.** The suggested payment for the 8-for-6 buy spent 4 of my 5 blue while I led Most blue. I lost the +6 with no warning. (258, 261)
5. **Big Spender fires by itself.** Nothing shows that I have a second buy or that it was spent. (159, 225)
6. **Random-table panels say less than their hovers.** Lie Low's panel leaves out "no one can steal from you this round". Cheap Seats says "up to 2" (it's 2 per round number). Toast says +3 (it's 3/6/9). Goody Bags leaves out that rivals get 1. (284, 286, 278, 282)
7. **Instant buy or pay dialog, unpredictably.** The same kind of click sometimes buys at once and sometimes opens a pay dialog. After an instant buy, the next card slid under my pointer and its hover opened, which invites a double buy. (143, 168, 239)
8. **Release uses a list, not the board.** It opens a header dropdown of chips, then color chips, which goes against "every choice is picked on the board". (146, 148)
9. **Some hovers open far from the pointer.** Examples: my own member (328 px away), a name in the "since your last turn" strip (341 px), the turn-order rail (296 px). (103, 183, 159)
10. **Round-III seats are crowded.** Member rows overflow and the "each round +3" label prints over the icons. A rival's seat hover runs off the bottom of the screen. Rival leaders look like padlocks. (231, 249, 250, 017)

## Full report

### Findings
1. [major] (5, 9) Game 2, buy step: Safecracker "Use now" spends its once-per-game ability with no warning when every rival holds 0 magenta. It shows no result toast; the member just greys to "used". The space hovers say "you'd get nothing" in the same situation; this button doesn't. shot: 329-sc-hover2.png, 330-click.png
2. [major] (1) Game 2: after the use, the header still says "…or use Safecracker". It offers an action I no longer have. shot: 331-sc-used.png
3. [major] (1, 9) Game 1, round I: I placed on Open Door (using Squatter) and the turn auto-passed ("Nothing you can afford. Turn passes."). Round-end scoring began at once and I never saw my result. The buy step was skipped without me choosing. shot: 113-click.png, 114-after-opendoor.png, 115-idle-frames.png
4. [major] (5, 10) Round III: Extra Hand ("+1 minion in round III.") recruited during round III gave no extra minion. I still placed only 5. A 10-cost dead buy with no warning. shot: 217-hover.png, 225-after-eh.png, 260-r3-t6.png
5. [major] (5) Round III, 8-for-6 buy: the default payment took 4 of my 5 blue while I led Most blue 5–4. P2 took the +6 and nothing warned me. shot: 258-pay86b.png, 261-results.png
6. [major] (1, 9) Big Spender ("Once per round: buy twice in one turn") fires by itself. In round II the seat hover showed "used this round" though I never chose to use it. In round III, after recruiting Extra Hand the header showed no "buy again" cue, and the log later said "You use Big Spender". shot: 159-hover.png, 225-after-eh.png, 268-final-scroll.png
7. [major] (2) Lie Low's panel says "+1● from a rival". It hides the main effect, "then no one can steal resources from you this round". shot: 284-hover.png
8. [major] (2) Cheap Seats' panel says "Buy followers 1 each, up to 2". The hover says up to 2 per round number. shot: 286-hover.png
9. [major] (2) Toast's panel says "+3● others get 1". The hover says 3/6/9 by round. Other spaces do print "2·4·6 by round" (Golden Years). shot: 278-hover.png, 212-hover.png
10. [major] (2) Goody Bags' panel says "+2● +2 of a color". It leaves out "everyone else gets 1 of that color". shot: 282-hover.png
11. [major] (4, 7) Buy commit is inconsistent:
    - These bought on one click: 2-for-1 follower, Big Spender, Penny Pincher, Tax Collector, Volunteer.
    - These opened a pay dialog: Squatter, Impressionist, Extra Hand, 8-for-6.
    - I couldn't tell beforehand which would happen. shot: 069-click.png, 143-click.png, 098-click.png, 239-buy86.png
12. [major] (5, 26) After the instant Tax Collector buy, the refilled card (Middleman) slid under my pointer and its hover opened. A second click would buy a different card. shot: 168-click.png
13. [major] (20) Release uses detached lists. It opens a header chip dropdown ("Squatter +6 any", "Intern +1 red"), then header color chips or one seat stack at a time. That took 4+ clicks and isn't picked on the board. shot: 146-click.png, 148-after-release.png, 150-after-one-gold.png
14. [major] (12) Some hovers open far from the pointer:
    - my seat member Squatter: 328 px, over the wheel
    - a name in the "since your last turn" strip: 341 px
    - the turn-order rail: 296 px (it opened my seat list)
    - Tax Collector in my seat: also opened a region 559 px away
    - shots: 103-hover.png, 183-hover.png, 159-hover.png, 171-hover.png
15. [major] (21, 22) Round-III seats hold 10+ member icons at about 16 px each, wrapping or truncating. The "each round +3●" label prints over the icons. I couldn't count a seat in 2 s. shot: 231-zoom.png, 249-zoom.png
16. [major] (12, 22) A rival's seat hover with 12+ members runs off the bottom of the screen (cut at "Onlooker"). shot: 250-hover.png
17. [major] (23, 2) Rival cult leaders read as grey padlocks at seat size. shot: 017-zoom.png, 249-zoom.png
18. [major] (2, 4) The pay dialog says "Colorless here: its 6 magenta is paid in any colors (magenta isn't on this table)" for Squatter, and "its 6 purple…" for Extra Hand. "Purple" isn't a rulebook term, and the card face shows only "8" or "10" any. shot: 098-click.png, 221-extrahand.png
19. [major] (25, 28) One round-II cycle of bot turns at the default speed took about 52 s of watching (frames run from +348 to +51,752 ms). Each move is readable, but it's a long wait. shot: 156-idle-frames.png
20. [polish] (16, 2) Redistribute: clicking a stack that's already used prints a full-sentence error in the header subline, which runs under the Followers panel. A stray tooltip clips off the top-left. shot: 314-click.png
21. [polish] (22) During a steal, the enlarged lit stacks on rival seats cover their follower counts. shot: 296-zoom.png, 299-zoom.png
22. [polish] (1) A stolen-from stack keeps the old number ("5○") with a "-1" badge until the steal resolves. shot: 299-zoom.png
23. [polish] (8, 1) Snake turns show "Your turn again (snake order)…" plus an italic line explaining snake order every time. It collides with "ROUND III OF 3" under my emoji. shot: 170-zoom.png, 241-after86.png, 254-r3-t5.png
24. [polish] (15) The header title repeats the step tab ("recruit a member or buy followers" and "RECRUIT OR BUY"). shot: 216-r3-gy.png
25. [polish] (15, 8) The last action appears three times: toast card, strip and log. The toast sits bottom-left, far from the wheel. shot: 216-r3-gy.png, 237-gh.png
26. [polish] (13) Hovering a past space in the log shows its current "You'd get", not what it gave then. shot: 123-hover.png
27. [polish] (19) The log order is mixed: newest first in the current round, oldest at the bottom in earlier rounds. shot: 122-click.png
28. [polish] (2) The rail labels "now / next / in 3 ×2" have no hover of their own; pointing at the rail opens my seat list. shot: 159-hover.png, 232-r3-next.png
29. [polish] (2, 13) The "each round +3●" label on seats opens nothing. shot: 233-hover.png
30. [polish] (2) Dotted colored outlines on spaces mean "taken since your last turn" but aren't explained. I first read them as selectable. shot: 230-after-2for1b.png, 248-r3-t4.png
31. [polish] (14, 27) Round end puts unlabeled number bubbles beside the seats; only the banner at the bottom explains them. Round I's Reckoning took about 23 s and round II's about 15 s; it is legible and skippable. shot: 260-r3-t6.png, 115-idle-frames.png
32. [polish] (14) The round summary counts Cheap Seats' followers (a space) as "+2 from abilities". The results legend defines abilities as members' abilities only. shot: 334-zoom.png
33. [polish] (27) The summary's follower totals count up, so they're briefly wrong (2/1/1/1 before 11/8/6/6). shot: 333-r1end-b.png, 334-zoom.png
34. [polish] (14) The results columns don't add up to the total: P2's sum to 60 against 61, mine to 23 against 24. The starting 1 follower isn't shown. shot: 264-final.png
35. [polish] (15, 30) Results cards show the total twice ("61 ☗" and "61"), and the winner card has a box nested inside a box. Only one column header carries ☗. shot: 264-final.png, 268-final-scroll.png
36. [polish] (13) Hovers on members with no ability (Twins, Intern) show only header and cost. Volunteer says "Free. No effect." shot: 081-zoom.png, 087-zoom.png, 319-hover.png
37. [polish] (8, 13) "after Bandwagon" style badges cover the shop portraits while you hover a space. The card already brightens when you can afford it, so the badge could go. shot: 073-hover.png, 235-hover.png
38. [polish] (17) With Penny Pincher, the pay dialog interleaves "×2" tokens with the gold coins. I first read them as extra cost. shot: 223-zoom.png
39. [polish] (15) The pay dialog shows the payment three times: coin row, piles and the Pay button text. shot: 221-extrahand.png
40. [polish] (5) After a one-click 2-for-1 buy, its hover stayed open while the bots played. shot: 069-click.png
41. [polish] (24) Clicking a space that asks a follow-up showed no pressed state for 1.5 s, four times. It may be the load; check on a quiet machine. shot: 049-click.png, 113-click.png, 162-click.png, 186-click.png
42. [polish] (25, 18) Nothing on screen says the wheel can spin. A drag coasted for more than 6 s; ArrowRight takes about 1.6 s per step. shot: 044-drag.png, 045-frames.png, 046-press.png
43. [polish] (11, Cory's call) The starting-pick panel glows in the bottom-left corner, and the eye lands on the wheel first. The pick isn't made on the board, though hovering an option lights its quadrant. shot: 016-click.png, 276-start2.png
44. [polish] (11) A usable member is cued only by a faint glow on a 16 px icon plus small italic header text. It meets Cory's call but is easy to miss. shot: 308-zoom.png
45. [polish] (12) The "Use now" hover covers my own seat. shot: 307-hover.png
46. [polish] (2) "+3● pick who gets 1" is ambiguous, and "+1● +1 per blue on sale" prints +1 twice. shot: 048-zoom.png, 212-hover.png
47. [polish] (2, Cory's call) The shop hover footer "You're short 2 blue" spells the color name beside a cost. shot: 053-hover.png
48. [polish] (30) Setup: the name field holds "P1" as a real value, so typing gave "P1Wren". A typed name looks like a placeholder, and the "4/14" counter is noise. shot: 009-type.png, 012-zoom.png
49. [polish] (22) Setup: the Start/Back footer overlaps the P4 row while the emoji picker is open. shot: 006-click.png
50. [polish] (13) Setup: the table color chips have no hover. shot: 005-hover.png
51. [polish] (25) The first game opens with about 23 s of intro before Begin. It was skipped on the second game. shot: 014-idle-frames.png
52. [polish] (22, 30) The leader sprites at the rim ends overlap the dividers and lettering. Hovering one adds nothing. shot: 212-hover.png, 214-hover.png
53. [polish] (17) On Random 4, the split "any" dot at card size reads as magenta. shot: 276-start2.png, 303-hover.png

**What worked:**
- The header always says whose turn it is and which step.
- Open spaces are unmistakable at a squint.
- Steals, Even Swap, Echo, Kickback and Cheap Seats are all picked on the board, and the coins fly to my seat.
- Space hovers are excellent: "You'd get", "Why" and the standings.
- Rim hovers show full standings.
- Seat hovers show each member's state.
- Round summaries are clear, and the results narrative tells the story ("won by 1, mostly by buying followers").
- "Use now" is a clear button.

### The ten audits

**E1. Call to action**
- Home: Play button. Right.
- Setup: Start. Fine.
- Starting pick: the eye lands on the wheel before the corner panel. Weak.
- Place: glowing spaces. Right.
- Choices: lit stacks. Right, though the italic prompt is small.
- Buy: lit cards and follower tiles. Right.
- Pay: the Pay button. Right.
- Release: header chips. Weak.
- Use: faint glow. Weak.
- Round end: Start round. Right.
- Results: Play again. Right.

**E2. Card anatomy**
- Shop face, loudest to quietest: portrait on a pastel field, then the name in small caps, then the cost (about 11 px), then the worth. The cost should rank second.
- Hover: name, portrait, worth, the ability sentence, then the grey cost. The hover's cost repeats the face and could go.

**E3. Glyph census: 17.** Resource dots, the "any" dot, ☗, player emoji, the leader (reads as a padlock), minions, ×2 coin, ×2 on the rail, rail dots and arrow, the -1 badge, dotted outlines, the "leads" pill, the "after X" badge, round-end bubbles, the hub numeral, the deck emblem, and the menu.
- Lookalikes: the two "×2" marks; the "any" dot vs magenta; the leader vs a padlock.
- Over budget before the first move.

**E4. Duplicate census**
- Last action: toast, strip and log. Keep the strip.
- Step: header title and step tab. Keep the tab.
- Payment: coin row, piles and button text. Keep the piles and the button.
- Results total: shown twice per card. Keep one.
- Card cost: on the face and in the hover. Drop it from the hover.

**E5. Prominence**
- Place (the wheel, about 530 px, 12 uses), recruit (the shop column, 9 uses) and buy followers (4 tiles, 5 uses): all right.
- Pass, Release, Undo and Log are small pills, which fits how rarely they're used.
- Using a member is a 16 px glow, too small for a once-per-game choice.
- Spinning the wheel has no affordance at all.

**E6. Order**
- Seats: turn order, and the rail shows it.
- Shop: sorted by cost, with a visible toggle.
- Seat member rows: no visible order.
- Seat hover: grouped by state.
- Release chips: no visible order.
- Log: mixed.

**E7. Hover census**
- Spaces: anchored 16–23 px away. They earn their place.
- Shop cards: anchored on the left. Members with no ability add nothing.
- Follower tiles: anchored.
- Rims: open near the top edge, with full standings.
- Rim sprites: nothing extra.
- Rival seats: anchored, but overflow the screen.
- Seat members: sometimes anchored, sometimes 328 px away.
- Seat follower numbers and the "each round" label: nothing.
- Rail: opens 296 px away.
- Log and strip names: open the card, sometimes 341 px away.
- Summary and results names: anchored.
- Setup chips: nothing.

**E8. Motion and art**
- Timings: a wheel drag coasts more than 6 s; an arrow step settles in about 1.6 s; steal coins fly in about 1.5 s; a buy slides out in about 1.1 s; a bot cycle takes about 52 s; the Reckoning takes 15–23 s.
- Art: the shop sprites are charming and distinct. At seat size they blur, and the leaders read as padlocks.

**E9. Space budget**
- Wheel (about 530²): right.
- Shop (about 300×700): right.
- Seats (about 300×400): too tight in round III.
- "Since your last turn" strip plus toast (about 300×250): oversized.
- Header (about 500×60): crowded on snake turns.
- Dead wood around the wheel's corners.

**E10. Decipher test**
- "pick who gets 1": a rival you pick gets +1, from the bank.
- "+1 per blue on sale": roughly right.
- "Redo every space": copies every space you took this round.
- "up to 2": per round number.
- "others get 1": the +3 scales 3/6/9.
- Lie Low: also makes you unstealable this round.
- "Cash in": All In.
- "per loose ☗": unclear without the rulebook.
- "in 3 ×2": a snake double turn, three turns away.
- "each round +3": seat income at round start.
- Dotted outline: taken since your last turn.
- Round-end bubbles: the counted measure for that quadrant.
- "×2" coin: gold counts double.
- "after X": what you could afford after that space.

### Misreads
- Rival leaders as padlocks.
- "in 3 ×2" as a multiplier.
- "each round +3" as text belonging to a member.
- Dotted outlines as selectable spaces.
- Round-end bubbles as ranks.
- "others get 1" and "up to 2" as flat amounts.
- Missed Lie Low's protection.
- Thought Extra Hand would act in the current round III.
- Thought I would choose when Big Spender fires.
- Read "×2" coins as extra cost.
- Read the "after Bandwagon" badge as a card ability.
- Read "pick who gets 1" as giving away part of my gain.

### Grade: C+
It starts at D. It rises for:
- clear turn status and unmistakable open spaces
- on-board choices with motion that reads
- excellent space and rim hovers
- seat hovers with member state
- a legible, skippable Reckoning
- a results screen that tells the story

It's held down by:
- silent automatic effects (Big Spender, the auto-pass that hid my result, the wasted "Use now")
- random-table panels that leave out what their hovers say
- a default payment that throws a rim lead
- a dead Extra Hand buy
- docked hovers, the chip-based Release, and crowded seats in round III

A friend could finish a Classic game tonight, but would ask why their turn ended, where their extra minion went, and what the padlocks mean.
