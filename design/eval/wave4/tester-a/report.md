# Wave 4 · tester A (w4a) · laptop 1270×700 newcomer · quiet box

Build: production preview at http://127.0.0.1:5195, driven only through v4-eyes (screenshots and timings). Box load ~1.5, so the numbers are real.
Played: one full game on Classic (Gold/Red/Blue/Green, Normal bots, Steady), lost 45 to P4's 68; then round I of a Random 4 table (Yellow/White/Magenta/Red) with two steals and Robin Hood. About 40 minutes of play.

## Latency, in one paragraph
The designer's bar is "your input answers at once". Almost nothing does. Of ~110 timed actions, fewer than ten painted under 100 ms. Typical: hover a space or card 150–270 ms input→paint, then 400–650 ms to settle (a fade-in); place a minion 24–535 ms to first change, 0.7–1.4 s to settle; recruit click ~200 ms, 2.0–2.6 s to settle; each steal or gift click 110–210 ms, ~0.9 s settle; drag-spin the wheel 264 ms, 1.45 s settle; Start game 544 ms; Esc on the log 160 ms with a 42 ms handler. On a quiet machine this is the app, not the box.

## Findings (blocker / major / polish; "good" lines are what worked and raised the grade)
1. [polish] (13) Setup — table chips "Gold Red Blue Green" open nothing on hover → a newcomer can't learn what each quadrant does before choosing a table. shot: shots/004-click.png
2. [major] (24) Setup → Start: 544 ms input→paint before anything moved (SLOW). shot: shots/008-click.png
3. [polish] (4) Intro — I chose the alien in setup; the intro's leader wears a pizza and the rivals a frog/skull. Reads as "this is someone else's cult". shot: shots/008-click.png
4. [polish] (24) Intro "Begin" → board: 128 ms input→paint. shot: shots/010-click.png
5. [polish] (14) Intro final slide — score numbers (11/17/13/9) don't match the follower marks drawn under each cult (e.g. 17 shows 10 marks + 6 members?). Illustrative, but a counter will notice. shot: shots/009-afterintro.png

## Starting-resource pick
6. [polish] (11) Pick 1 of 2 popup sits on the hub, warm and bright: eye lands on it first. Good CTA. But it covers the whole inner ring and half the middle ring, the very spaces you'd pick toward. shot: shots/010-click.png
7. [major] (24) Hovers are slow: shop card 232 ms, wheel space 264 ms input→paint, settle ~540 ms (fade-in). Bar is "answers at once". shot: shots/011-hover.png, shots/012-hover.png
8. [polish] (4) Space panel says "refresh the shop"; its hover says "sweep the face-up row … back under the deck". Three names (shop / row / deck) where the rulebook says "pile". shot: shots/012-hover.png
9. [polish] (2) Rim "MOST BLUE" — blue resources or blue members? Hover answers (resources: "You'd have 2"), but the rim alone doesn't. shot: shots/012-hover.png
10. [polish] (12) Wheel-space hover opens to the upper right and covers the follower buys and the top of the shop — fine for a wheel space, but it hides the thing you'd buy next. shot: shots/012-hover.png
11. [polish] (4) After my first pick, panel text on unrelated spaces re-laid out ("Free recruit / the cheapest" grew, "+1 to a rival" gained "you pick who") with no action of mine — text that shifts while you read. shot: shots/014-shot.png vs shots/010-click.png
12. [polish] (24) Second pick → board: 144 ms input→paint, then the bots' picks ran ~6 s; readable, with a "P2 took Echo" toast. shot: shots/017-idle-frames.png

## Round I, my turns
13. [good] (5) Squint test passes: open spaces are bright cream with a warm glow, taken ones dim with the minion on them, unopened rings dark. Readable without color.
14. [major] (24/25) Spinning the wheel by drag: 264 ms input→paint, 1452 ms to settle. Text stays upright, but the spin lags the hand. shot: shots/018-drag.png
15. [polish] (4) After a spin, panel text shortens with the angle ("Half-price recruit / as your buy" loses "as your buy"; "Free recruit / cost 4 or less" vs "Free recruit" alone). The same space reads differently depending on where it sits. shot: shots/019-spun.png
16. [good] (2) Decipher: "+2● then recruit in any colors" — I guessed "+2 blue, then recruit paying any colors". Hover (Snap Up) confirmed. "+3● +1 to a rival" — guessed gift; right. "Save 4 on next member" — right. "+1● per recruit by all this round" — right.
17. [polish] (2) Snap Up hover's "YOU'D GET +1 member, +1 follower, −2● your best pick" — the −2 reads as a loss on a gain line; and "+1 member, +1 follower" double-counts the same member. shot: shots/020-hover.png
18. [major] (24) Placing a minion: 535 ms to first change, 1338 ms to settle. Recruit click: 216 ms, settle 2069 ms. Choosing the gift target: 112 ms, settle 930 ms. Placement is the most common move and it lags. shot: shots/021-click.png, shots/023-click.png
19. [polish] (8) "Nothing you can afford. Turn passes." pill appeared while the header says "Your turn again (snake order)". "Turn passes" contradicts "your turn"; and it skipped my release option silently. shot: shots/023-click.png
20. [good] (20) Gift target picked on the board: rival seats glow, one click. Kickback summary toast "P4 +1●" confirms it.
21. [polish] (26) The gift's single gold coin is tiny and fast (~300 ms); I could barely find it between the space and P4's seat. shot: shots/028-frames.png
22. [polish] (16) Faded (unaffordable) shop cards wash their cost dots to near grey; at a glance the colored part of the cost reads as "any". shot: shots/029-zoom.png
23. [major] (15/8) With a discount active, every card hover adds "Your next member costs 4 less." — the same sentence on 10 hovers, while the card face already says "free" with the price struck. shot: shots/hovers-shop-1.png
24. [polish] (22) Tribute Band's discounted cost "4● 4● 12 1👤": the struck "12" butts into the worth divider and the follower 1; reads as "121". shot: shots/056-zoom.png
25. [major] (2) Followers 2→1 hover: "Any colors, any mix, as your one buy. No limit: as many as you like." — "one buy" and "as many as you like" in adjacent lines; can I buy 2→1 three times in one turn or not? shot: shots/030-hover.png
26. [polish] (8) My "You took Kickback" toast stayed up through four bot turns until another toast replaced it. Stale. shot: shots/031-click.png
27. [polish] (14) Front-runner hover: "Colorless here: it counts as a member of no color" — "here" is unexplained jargon. shot: shots/hovers-shop-2.png
28. [good] (13) Every shop card has a hover, anchored beside the card, with one plain sentence and a "You're short 2●" line. Matches the designer's call.

## Round I end
29. [major] (27) Round end came straight off my buy: by the time the screen settled (5 s) the Reckoning was already on quadrant 4 of 4. Each quadrant gets ~1.5 s; the seat chips (0/2/3) are counts with no label. I couldn't narrate "who got what" until the summary. shot: shots/058-shot.png, shots/059-idle-frames.png
30. [good] (27) Round summary is clear: per-quadrant leader with counts for everyone, then a per-player "+4 prizes / +2 from new members · +1 bought / total". "You pick first: fewest followers" tells me why. shot: shots/060-shot.png
31. [polish] (8) Summary's two columns "PRIZES" and "THIS ROUND" — prizes happened this round too; "THIS ROUND" really means "other gains". shot: shots/060-shot.png

## Round II
32. [good] (20) Steal (Collect Debts): rivals' gold stacks light up in their seats, click a stack once per coin, "−2" badge on the stack, header counts "3 left". On the board, no chip grid. Matches the designer's call. shot: shots/065-click.png, shots/068-shot.png
33. [polish] (3) Undo placement vanishes after the first stolen coin; a misclick on the wrong rival can't be taken back. shot: shots/068-shot.png
34. [major] (24) Each steal click: 208 / 190 ms to first change, ~850 ms to settle; the coins don't reach my seat until the last pick (my count stays 3 until then). shot: shots/066-click.png
35. [major] (2/9) Swap Sides hover said "YOU'D GET nothing right now", yet taking the space offered me five members to give and two of P2's to take, and the swap went through. The preview lies. shot: shots/064-hover.png, shots/118-shot.png
36. [major] (12/13) Hovering a member in my own seat opens a popover that covers the member next to it; I could not hover Stylist after Treasurer without leaving the seat. shot: shots/073-hover.png
37. [polish] (8/15) My member's hover ends with "👽 Yours" — it's in my seat. Noise. shot: shots/072-hover.png
38. [major] (7/10) Release lives only inside a member's hover ("Release: +4●"); you have to hover, then travel into the popover to click it. The header's "or release a member" doesn't say where. No confirm on an irreversible move. shot: shots/072-hover.png, shots/126-shot.png
39. [polish] (5) Pay picker: "Faded coins pay. The number under each stack is what you keep." — faded usually means "unavailable"; here it means "spent". Needed the sentence to read it. Swapping a coin in works with one click (240–300 ms). shot: shots/078-shot.png, shots/080-shot.png
40. [polish] (20) The pay picker is a modal over the wheel, not on my seat's resources where the coins are. shot: shots/078-shot.png
41. [polish] (3) Snap Up's pay picker has no Cancel (the shop pay picker does); header says "Snap Up: choose one" — choose one what? shot: shots/133-shot.png
42. [major] (14) Half Price active: shop cards still show full list prices (Doppelganger 4●2●), and hovers don't say what I'd pay. The rulebook promises "each card shows what you'd pay" while a discount is yours; it did for Save 4, not for Half Price. shot: shots/103-shot.png, shots/hovers-halfprice.png
43. [good] (13/20) Echo / Understudy: the copyable spaces glow, hover lists "CAN COPY …" and "WHY Stylist +1● · Treasurer…". Copy chain (Echo → Half Price → Understudy → Half Price) worked in 2 clicks per step.
44. [polish] (4) Panel "Copy a space a rival just took" vs hover "a rival took since your last turn". Different promise. shot: shots/hovers-r2-c.png
45. [major] (13) Rim hover on "MOST MEMBERS" at its label opened nothing the first time (no visible change, 204 px region elsewhere); worked when pointed a bit left. Small hit target on the most important rim. shot: shots/hovers-r2-a.png
46. [polish] (12) Rim hovers open on the inside of the wheel, covering the spaces; Most Blue's opens over the shop. shot: shots/hovers-r2-a.png
47. [polish] (8) Most Green rim hover carries "Green's own rule: Copies never reach the center or another copy." — a rule about copying, not about scoring, on the scoring rim. shot: shots/hovers-r2-a.png
48. [good] (14) Follower number hover: "You 1 · Members +3 · Bought +1 · Round-end prizes +2 = 7". Every number explains itself. Seat hover for a bot: "NORMAL BOT · Holding 5● · could buy about 3👤 now" + members with "pays at round start". shot: shots/hovers-r2-b.png
49. [polish] (13) Hovering a player name in the "since your last turn" strip pops the old "P2 took Crescendo" toast on top of the strip itself, hiding the line you're reading. shot: shots/hovers-r2-b.png
50. [good] (13) Space names in the strip (Crescendo, Show Off) open the space's card and outline the space on the wheel.
51. [polish] (21/22) P3's seat shows "EACH ROUND +3●" in tiny caps in the middle of the seat, and "+1" after the members (overflow?) — I couldn't tell what "+1" counted. P4's 7 members are a single dense row, hard to count at a glance. shot: shots/129-zoom.png, shots/128-shot.png
52. [polish] (23) Understudy's sprite in my seat is a green slab/curtain that reads as a bar chart, not a person. shot: shots/109-shot.png
53. [polish] (8) The buy step auto-skipped twice when I had nothing (once with a "Turn passes" pill, once silently). Inconsistent. 
54. [major] (27) Round II Reckoning: ~0.5 s between quadrant cards; the Most Gold card was gone before the screen settled. The seat numbers tick 16→19→20→24 while the card text says "+4" — the ticks don't line up with the card. shot: shots/137-idle-frames.png
55. [polish] (2) Round II summary "Round III · 5 minions each · P3 picks first: Front-runner" — fewest followers was P2; the name of a member as the reason is terse; "Front-runner" doesn't open its card. shot: shots/138-shot.png
56. [polish] (8) Summary row for me: "+4 from new members · −1 from members that left · +4 bought" wraps to two lines; P2's "−1 from members that left" after a 1-for-1 swap reads as a loss. shot: shots/138-shot.png

## Round III, menu, log, results
57. [good] (3) Menu (☰) opens beside its button with How to play, a 20 s explainer, the log, Speed (Quick/Steady/Relaxed, Steady selected), Copy game record, Leave. Speed toggle: 216 ms. shot: shots/141-shot.png
58. [polish] (24) Opening the log: 192 ms; it slides over the seats from the left and covers my own seat. Esc closed it but took 160 ms with a 42 ms handler. shot: shots/144-shot.png
59. [good] (13) Every card name in the log opens its card beside the line ("Lottery Winner · USE · Once per game … · P2's · used"). Matches the designer's call. shot: shots/hovers-log.png
60. [polish] (13) Round headers and player names in the log ("P2 took …") open nothing. shot: shots/hovers-log.png
61. [blocker] (1/20) Seats reorder each round (I was top in II, third in III). In round III I aimed a Kickback gift at "P4's row" from round I and hit my own seat; the click opened my seat hover instead of a no-op or a warning. Your own seat moving between rounds breaks muscle memory and nothing marks the move. shot: shots/167-shot.png
62. [major] (1) In round III P2's followers dropped 26→24 between my turns. Nothing in the strip says why (I believe P4's Swap Sides took a member). "Since your last turn" only says "P4 Swap Sides … bought 10" — not from whom, not what. shot: shots/164-shot.png
63. [good] (2) Center spaces read well: "Double your gold", "Buy 3 times this turn", "Copy all your spaces". Greatest Hits hover told me exactly what I'd get (+6●). Doubling 7→14 gold felt like the burst the rulebook promises.
64. [polish] (16) In round III every shop card was faded for me with 11 resources in hand (all colored parts I lacked). Fine by rule, but the faded wall reads as "the shop is closed". shot: shots/161-shot.png
65. [major] (27) Round III Reckoning: by the time 15 s had passed only the last card (4 of 4) and the summary were left; frames show ~0.3–0.5 s per quadrant. Too fast to narrate at Steady. shot: shots/175-idle-frames.png
66. [polish] (4/15) Summary "This round" uses "+2 from swaps" for P4 but "−1 from members that left" for P2 in round II — the same event, two names. shot: shots/176-shot.png, shots/138-shot.png
67. [polish] (8) Round III summary says "End-game bonuses, still to add to these totals: You Recluse +4" in a banner, then shows 41 for me; the results screen then shows 45. Two totals for the same moment. shot: shots/176-shot.png, shots/178-shot.png
68. [good] (14) Results: "P4 won by 13, mostly by buying followers (+36), then from the rims' prizes (+22; Most green all three rounds, +12)". Every number opens what it's made of ("Your follower buys: 31 … (the 2→1, 4→3, 8→6, 10→10 trades)"). Clear and honest. shot: shots/hovers-results.png
69. [polish] (21) Results seat cards: P2 shows "+3" overflow after 6 sprites, but has 9 members; P4 "7 members" shows 8 sprites. Counting test fails. shot: shots/178-shot.png
70. [polish] (8) Results: the "You Recluse +4" line under the table repeats the End-game column's +4. shot: shots/178-shot.png
71. [major] (feel) Big Followers baseline: I won 26 followers in round III by doubling gold and buying 10→10 twice; the bots all ended 51–68 by buying followers too (P4: +36 bought). The member engine I built (6 members) scored 8. Felt like the shop was a side dish.

## Random table (Yellow, White, Magenta, Red)
72. [major] (4/17) White resource is a filled cream disc; "none of this color" is an empty ring in the same cream. "0○ 3●" on P4's seat: the white 3 and the empty rings read alike at a glance. Yellow vs the classic table's gold are near the same hue. shot: shots/200-shot.png
73. [polish] (2) Decipher miss: "+1👤 or +2○" — I read the small follower mark as a resource ("+1 any or +2 white"); hover (Your Call) says +1 follower in round I, +2 in II, +3 in III, or 2 white. The panel hides the round scaling entirely. shot: shots/hovers-random.png
74. [polish] (2) "+1 each other color per 3●" (center) — couldn't parse it at all before hovering. shot: shots/190-shot.png
75. [good] (2) Rim "MOST FULL SETS · ties: yellow · +2👤" — guessed "one of each color" and the hover confirmed it, with a count per player.
76. [good] (26) Help Yourself steal: rivals' stacks light; each stolen coin flies from the rival's seat into mine and turns magenta on arrival, exactly as the rulebook says. Readable in frames (~2.3 s settle). shot: shots/203-frames.png
77. [good] (6) Redistribute lit only the rivals I could steal from, the header named them ("1 each from P2, P4"), and P4's seat previewed "ROBIN HOOD +1👤" before I clicked. The best moment in the session. shot: shots/210-shot.png
78. [polish] (5) Recruiting Robin Hood with exactly-right magenta skipped the pay step and showed "Undo buy" — good, but the shop gave no sign it would skip; first time it feels like a misclick. shot: shots/hovers-robin.png
79. [polish] (13) Setup: the Random 4 chips (Yellow, White, Magenta, Red) open nothing on hover; I picked "a table with steals" by guessing magenta from the rulebook's one line. shot: shots/187-zoom.png
80. [polish] (4) The name I typed (Ana) shows in setup but the game seat says "You" and the home name field is empty again. shot: shots/182-shot.png
81. [polish] (25) Speed I set in game (Quick) carried into the next setup without saying so. shot: shots/184-shot.png

## The ten audits

1. Call to action. Setup start: "Start" button, bright, eye lands there: yes. Starting-resource pick: warm popup on the hub, eye lands first: yes (but it covers the inner rings). Place: open spaces glow cream, taken ones dim: yes, strongest screen. Choice steps (gift, steal, copy, swap): lit seats/stacks/spaces plus an italic header: yes, though the header is small italic and the eye goes to the wheel first. Buy step: follower buys light up top right, Pass is a small pill in the header; affordable cards brighten: mostly. Pay picker: dark "Pay" button: yes. Round end: "Start round II/III" / "See results": yes. Release: no CTA anywhere outside a member hover: fails.
2. Card anatomy (shop card Tax Collector, then hover). Face, loudest to quietest: sprite → name in caps → cost dots (2● 2◐) → follower worth (1👤) → color tint. Hover: sprite+name → ability sentence → (nothing else). Right order for buying would put the ability first; on the face it's absent by design (designer's call). The worth "1👤" sits flush against the cost and once read as "121" (finding 24). The hover could drop the repeated sprite.
3. Glyph census (Classic): resource dot ×4 colors; split "any" dot; empty ring (none of a color); follower mark; minion emoji (one per player); leader robed figure; Roman numeral hub (I/II/III); deck back eye; "+N" seat badges; "−2" red steal badge; "EACH ROUND +3●" seat label; "+1/+2/+3" overflow counts after member rows; ☰ menu; "leads" pill in rim hovers; ticked rim edge. 15. Look-alikes: empty ring vs white resource (Random table); faded cost dot vs "any" dot on unaffordable cards; "+3" overflow badge vs "+3" gain. Drawn two ways: follower mark is a person on panels and a bigger person in the 10-followers pay picker (fine).
4. Duplicate census: my follower count (seat number, results, summary) fine; "Your next member costs 4 less" on every hover while faces already show the discount (finding 23); "👽 Yours" in my own member hover; Round III summary banner + Results line both state Recluse +4 (67, 70); toast "You took X" repeats the strip once the bots move; the header's step tabs (PLACE / RECRUIT OR BUY) duplicate the header sentence. Keep the face and the seat; drop the rest.
5. Prominence. Place (most used): the wheel, huge, right. Recruit (often): shop strip, big, right. Buy followers (every turn late): four big tiles top right, right. Pass (often): small pill in the header, a bit hidden. Release (once a round, rulebook says): buried in a hover — far too small. Undo placement: tiny underlined text, ok. Spin wheel: no affordance at all; I found drag by trying.
6. Order. Shop: "sort: cost / color" toggle visible, sorted by cost — clear. Seats: turn order with now/next/"in 4 again" labels — clear, but the order changes each round and my seat moves (finding 61). Seat members: order of recruit, not color — couldn't tell. Log: newest round first — clear with headers. Rim hover standings: by count — clear.
7. Hover census (three sweeps). Spaces: name + full text + YOU'D GET + scoring impact, anchored beside, 150–270 ms; Swap Sides' preview wrong (35). Rims: standings, open inward over spaces; Most Members hit target small (45). Shop cards: one sentence + "You're short", anchored, good. Seats: list of members with state ("pays at round start", "used"), bot level, "could buy about 3👤 now" — good. My follower number: full breakdown — great. Seat member sprites: card with Release button, covers neighbours (36). Strip names: open the card and outline the space — great; player names pop a stale toast (49). Log card names: open the card — great; headers/players open nothing (60). Follower tiles: rules text with a contradiction (25). Results numbers: each opens its sum — great. Setup table chips: nothing (1, 79).
8. Motion and art. Wheel drag: 264 ms to respond, 1.45 s to settle, text stays upright — usable but laggy. Coins: steals fly seat-to-seat and recolor on arrival (good); a single gift coin is tiny and fast (21). Bot turns: ~1 s each with toast + strip line, followable. Reckoning: too fast to narrate at Steady (29, 54, 65). Sprites: distinct, charming pixel people with color tints; Understudy reads as a bar chart (52); emoji minions on spaces are clear.
9. Space budget. (1) Wheel ~45% of width: right for placing; during buy and choice steps it's dimmed dead space. (2) Shop strip ~22%: right. (3) Seats column ~25%: four seats fit, but members crowd into one row and overflow as "+N". (4) "Since your last turn" strip: small, as asked. (5) Toast bottom-left: often stale (26), covers the strip's lower half. Follower tiles top right: big for four buttons, fine.
10. Decipher test. "+2● then recruit in any colors" → right. "+3● +1 to a rival" → right (gift). "Save 4 on next member" → right. "+1● per recruit by all this round" → right. "swap, equal cost" → guessed "swap a resource"; it's a member swap? (didn't verify). "Copy a space a rival just took" → hover says "since your last turn" (44). "Free recruit the cheapest" → right. "Double your gold" / "Buy 3 times this turn" / "Copy all your spaces" → right. "MOST BLUE" → resources or members? hover: resources (9). "+1👤 or +2○" → wrong (73). "+1 each other color per 3●" → unreadable (74). "MOST FULL SETS" → right. "EACH ROUND +3●" on a seat → right after a beat. "+1"/"+3" after a seat's members → unclear (51).

## Misreads
- Read the follower mark on "+1👤 or +2○" as a resource.
- Thought Swap Sides would give me nothing (its hover said so); it worked.
- Read Tribute Band's discounted cost "12 1👤" as "121".
- Thought "Turn passes" meant my whole turn was skipped; only the buy was.
- Read the Reckoning's seat chips (0/2/3) as followers; they were the measured counts.
- After the round III reorder, aimed a gift at the row where P4 used to be and hit my own seat.
- Thought faded cost dots on unaffordable cards meant "any".

## Felt unfair or unfun
- Following the Reckoning: by the time I looked up it was on quadrant 4 of 4. I never saw who won Most Gold in round II.
- My seat moving rows between rounds; I gifted into my own hover.
- Building six members (a Stylist, a Recluse, copy chains) scored me 8 followers; one Double Down + two 10→10 buys scored 26. The shop felt like seasoning; buying followers was the meal.
- P2 lost 2 followers between my turns and nothing told me why.
- Every hover and click has a small lag; the table never feels like it's in my hand.

## Table talk (how it felt)
"Oh nice, I steal and the coins actually fly over and turn pink." · "Wait, where did the Most Gold result go?" · "Double your gold in the last round is filthy." · "Why is my seat in the middle now?" · "How do I release? …oh, it's in the hover." · "The copy chain is fun — Echo into Half Price into Understudy into another Half Price."

## Grade
Start at D. Raised for: a wheel whose open/taken/unopened spaces pass the squint test; choices made on the board (steal stacks, gift seats, copy spaces) exactly as the designer asked; hovers on nearly everything, anchored, with honest "you'd get" previews and number breakdowns; card names that open their cards in the strip and the log; a results screen that explains itself; steals that animate source to destination. Held down by: nothing answering under 100 ms (hovers ~200 ms, placements up to 535 ms, settles of 1–2.6 s), a Reckoning too fast to read at Steady, the round-to-round seat reshuffle, release hidden in a hover, a wrong Swap Sides preview and Half Price not showing prices.

**C+** — a friend could play it tonight, but would ask "where did my seat go?" and "how do I release?", and would never feel the input is instant.
