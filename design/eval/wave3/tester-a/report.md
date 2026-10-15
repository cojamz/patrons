# w3a: blind screen-only sweep (laptop newcomer, 1270×700)

I played one full game on Classic (Gold/Red/Blue/Green, Normal bots), from home through results, then round I of a Random 4 table (Red/Magenta/White/Silver) to steal with magenta. Here is what I covered:
- **Wheel:** spun it by drag and by arrow keys.
- **Choices on the board:** gifted twice (Kickback), stole three times (Collect Debts twice, Redistribute once), swapped once (Swap Sides).
- **Paying:** paid mixed colors for Curator (2 gold, 2 blue) and for 10→10 (7 gold, 2 blue, 1 green).
- **Follower buys:** bought 2→1, 4→3, 8→6 and 10→10.
- **Menu and log:** switched the speed to Relaxed and back to Steady, opened the log and hovered names in it.
- **Round ends:** watched round ends I and III frame by frame.

I could not test "use a member": none of my members had a use, and the shop gives no clue which ones do (see #5). The box was loaded, so I ignore absolute ms.

**Files:**
- Every shot is copied to `/home/user/patrons/design/eval/wave3/tester-a/shots/`, written below as `S/`. Composites are prefixed `x-`.
- My running notes are in `/home/user/patrons/design/eval/wave3/tester-a/sweep.md`.
- The harness blocked me from writing `report.md`, so please save this text there.
- v4-eyes is stopped.

## Findings

1. [blocker] (A1) During bot turns the header says "Choose how to pay ···" right after my one-click 2→1 or 8→6 buy, while P2 or P3 is acting. A stray blue dot also sits on "ROUND III OF". I thought the game was waiting for me → status lies at the hand-off. shot: S/077-click.png, S/224-pay86.png
2. [blocker] (A1, A6) Round summaries say "P3 picks first" in rounds II and III, though P3 had the most followers and the rulebook says the fewest goes first. The reason (P3 owns Front-runner) appears nowhere on screen; I found it in the strip several turns later → turn order looks like a bug. shot: S/x-r1s.png, S/184-r2sum.png, S/087-idle-frames.png
3. [blocker] (B20, A6) In Swap Sides at "pick theirs", hovering a lit rival member opens nothing. I swapped blind, without knowing what I'd get. shot: S/x-vv4.png (bottom), S/157-hover.png
4. [blocker] (A4, A5) The Random 4 table's colors don't read:
   - White is a cream ring that reads as an empty slot or zero.
   - Silver is plain grey.
   - The "any" split dot (red/magenta/white/silver) reads as a magenta blob at 10 px.
   - The MOST WHITE and MOST SILVER rims are both grey.
   - I misread Mole's "2● 2●" as one color, and "+2○" as "+2 nothing".

   shot: S/259-fb2.png, S/260-wheel2.png, S/shop3.png
5. [major] (B18, Cory) You can't find out from the shop which members you "use". Card faces carry no "you use this" mark, the ability lives only in the hover, and none of my members ever glowed. The only member action I found was a small "Release: +1●" pill inside a seat hover. shot: S/x-int.png, S/shophovers.png
6. [major] (A5, A4) Follower buys behave inconsistently. 2→1, 4→3 and 8→6 fire on one click with no pay step: 8 gold was gone and the bots were moving before I saw any undo. 10→10 opens a pay dialog. → the costliest limited buy is the easiest one to misclick. shot: S/223-click.png, S/224-pay86.png, S/216-pay1010.png
7. [major] (A2, B16) The pay picker has no labels:
   - Four coin stacks, each with a number under it. Is that what I keep or what I pay?
   - Faded ghost coins sit above the stacks.
   - Nothing separates the colored part of the cost from the "any" part.
   - The footnote reads "Snap Up: in any colors".
   - Only the Pay button says what leaves ("Pay 2● 2●").

   shot: S/x-vv3.png (top), S/125-pay2.png, S/216-pay1010.png
8. [major] (B12; Cory: hovers open right next to what you point at) Seat hovers dock to the seat's right edge, not to the pointer. Measured distances: P4's seat 488 px, a P3 member sprite 241 px, my Intern 308 px, my own seat 136 px. shot: S/057-hover.png, S/x-s5859.png, S/x-int.png
9. [major] (C26; Cory: a clear, steady chain from source to destination) Steals snap. Each Collect Debts take and the Redistribute take changed one frame, with no coin leaving the rival. The Kickback gift showed no coin at all, just P4's 0 ticking to 1. shot: S/142-idle-frames.png, S/278-frames.png, S/084-idle-frames.png
10. [major] (C26) Stolen resources "arrive as magenta", but the white I took simply appeared in my magenta count. Nothing shows the conversion. shot: S/279-g2steal2.png
11. [major] (A1) Header and rail disagree on bot turns. The header says "P3 is placing a minion" while the rail's "now" stays on P4 for several frames. shot: S/087-idle-frames.png
12. [major] (A2) "P2 6" appears in the round III header ("ROUND III OF 3 · 5 MINIONS EACH · P2 6") and in the round II summary. I read it as P2's score; it probably means 6 minions. shot: S/184-r2sum.png, S/190-r3t1.png
13. [major] (A5, B11) Things look pressable when it isn't my turn. During bot turns the 2→1 tile stays bright cream, the brightest thing on screen, and affordable shop cards stay lit. shot: S/087-idle-frames.png, S/106-idle-frames.png
14. [major] (A7, B11) The Hustler color pick has no clear call to action. The header reads "Hustler · Undo buy" and the instruction is cut off ("Actions there give you +1● per ro…"). Nothing says "click one of your colors"; I guessed from thin rings on my seat's dots. shot: S/x-vv4.png (top), S/147-hustlerhdr.png
15. [major] (A2) The Lie Low hover can't be read: "rivals −1 to 0●, −1 to 0●, −1 to 0● in all". A ")" is orphaned on its own line after "(it arrives as ●". shot: S/286-safehov.png
16. [major] (B21) My seat shows 3 member sprites and then a tiny grey "+1"/"+2", because "each round +3●" takes the row. P2's seat fits 6 sprites in the same width. I can't count my own members without hovering. shot: S/164-myseat2.png, S/x-p19900.png
17. [major] (B13) Several elements open nothing on hover:
    - the deck pile
    - "Redo all your spaces", on the first try
    - member sprites on two seats in round III
    - my "12" follower number
    - the minion columns
    - the result rows
    - swap targets during the choice (see #3)

    shot: S/194-hover.png, S/191-hover.png, S/199-hover.png, S/202-hov-12.png, S/064-hover.png, S/248-reshov.png
18. [major] (E5, A6) Release is a rulebook turn step, but it exists only as a small pill at the bottom of a member's hover. Nothing on the seat says a member can be released. shot: S/x-int.png
19. [major] (B14) Summary wording misleads. After P2 swapped away my Big Family, the summary said "You: −1 from new members". The results say "won by 17, mostly by buying followers (+32), then from the rims' prizes (+32…)", calling two equal +32s "mostly… then". shot: S/244-r3scored.png, S/246-results.png
20. [major] (C26, A1) P2's last-turn swap of my Big Family showed only as a highlighted strip line under the scoring banner. No card moved from my seat to P2's; I found out from the summary. shot: S/242-end1.png
21. [major] (A2) The Snap Up panel "+2● then recruit" hides its biggest perk. Only the hover adds "in any colors", which ignores colored costs. shot: S/062-hover.png, S/hAB2.png
22. [polish] (A4) Panel and hover words differ:
    - The panel says "1 per blue on sale"; the hover says "per blue face-up member".
    - The panel says "and redo a space"; the hover says "copy one of your spaces".
    - The log says "P3 joined P2 on Crescendo" for a copy.

    shot: S/x-nf2.png, S/ring2a.png, S/x-vv5.png
23. [polish] (Cory: a cost's color is implied by its dot) Hovers write "· colorless" beside the cost (Freelancer, Insider, Front-runner, Squatter). shot: S/shophovers.png, S/shop3.png, S/seats3.png
24. [polish] (B13, B15) Shop hovers repeat the cost and worth already printed on the card face. Only the ability sentence and the "You're short…" line are new. shot: S/shophovers.png
25. [polish] (B16) The card's name is its quietest element: ~9 px grey small caps under a sprite that fills 60% of the card. shot: S/018-game-start.png, S/x-early2.png
26. [polish] (D30) Card names break with hyphens across two lines ("DOPPEL-/GANGER", "FRONT-/RUNNER", "BENCH-/WARMER", "CROWD-/PLEASER", "MENTOR & /PROTÉGÉ"), so name blocks vary in height. shot: S/204-hov-blue2.png, S/264-g2t1.png
27. [polish] (A2, E3) The leader's emoji on each rim is about 14 px; I read P4's skull as a die. shot: S/210-hov-6gold.png
28. [polish] (A8) The space hover's rim line ("If you take it: You 2 · P2 2 · P3 1 · P4 0 · you'd lead it (+2⚑)") is a run of middots that took me three reads. shot: S/gAB.png
29. [polish] (A4) The green rim's hover ends with "Copies never reach the center or another copy." That's a copy rule on a scoring rim. shot: S/052-hover.png
30. [polish] (B12) Two popovers can be open at once: P4's seat card stayed up while "Turn order: next, twice" opened. shot: S/061-hover.png
31. [polish] (A4) The rail labels behave differently from each other. "in 5 / twice" beside P4 opened P4's seat card, while "next / twice" beside P2 opened the turn-order explainer, which is the useful one. shot: S/060-hover.png, S/061-hover.png
32. [polish] (A2) "in 5 / twice", stacked on two lines, reads as "in 5 twice". I needed the hover to learn it means "in 5 turns, then twice in a row". shot: S/038-myturn1.png
33. [polish] (B19) The log lists newest first, but the "since your last turn" strip lists oldest first. shot: S/x-vv5.png, S/220-r3t2.png
34. [polish] (A8) The log drawer covers all four seats. Lines like "P2 passed." are noise, and "a member (≤6)" uses a symbol. shot: S/x-vv5.png
35. [polish] (D22) The strip clips its top entry mid-sentence, leaving an orphan "recruited Extra Hand". shot: S/204-hov-blue2.png
36. [polish] (A8, B15) The "You took X" toast lingers about 10 s into bot turns. "Hustler: +3● / +3●" in one toast reads like a duplicated line. shot: S/149-after-hustler.png, S/230-r3steal.png
37. [polish] (A4) There are two speed settings with two vocabularies: setup's "Bot speed: Slow/Normal/Fast" and the menu's "Animations: Quick/Steady/Relaxed". shot: S/006-click.png, S/172-menu.png
38. [polish] (D30) The intro is titled "Cults in twenty seconds" but auto-advanced for about 31 s. shot: S/015-idle-frames.png, S/x-early1.png
39. [polish] (A5) After a game, a large "Last game's results" pill on the home screen pushes "Play on this device" down 66 px. My click on the old spot reopened the results. shot: S/249-click.png
40. [polish] (A8) In the results table, "Yourself" is a column of 1s and "End-game" a column of 0s. The footnote uses "raids", which isn't a rulebook word. Only the "From members" header carries the follower mark. shot: S/246-results.png
41. [polish] (B11; Cory: the starting-resource pick must be an obvious call to action) The pick card glows, but it sits bottom-left under the seats, about 350 px from where the eye lands (the wheel). It's also a row of chips rather than a pick on the board. shot: S/x-early3.png (top)
42. [polish] (A4, E5) "Pass" and "Undo placement" are identical ghost pills side by side, so the most final action and the most forgiving one look the same. shot: S/x-vv1.png
43. [polish] (D22) A placed minion covers its space's label ("Copy a… took"), so taken spaces can't be read without hovering. shot: S/238-r3t5.png
44. [polish] (A5) "Taken since your last turn" (thin dotted outline) and "taken earlier" (solid grey) differ only by a 1 px dotted line; at a squint they look the same. shot: S/038-myturn1.png
45. [polish] (C25, E8) Drag-spin started 618 ms after the drag and coasted for more than 5 s, leaving the whole board unreadable meanwhile. Nothing hints that the wheel can be dragged or turned with arrow keys. shot: S/067-frames.png, S/069-press.png
46. [polish] (C26) On a follower buy, resources vanish and my number counts up in steps (12→13→15→17→22 over about 3 s) while the bots are already moving. No follower mark travels to the seat. shot: S/219-idle-frames.png
47. [polish] (C26) New Faces blanks all 10 shop cards at once, then refills them. I couldn't tell what left. shot: S/087-idle-frames.png (frame 3)
48. [polish] (C27) Round end is legible, but each rule sends the eye to three places up to 900 px apart:
    - count circles beside the seats, far left
    - the banner at the top or bottom, partly covering the rim it scores
    - the "+N" token flying to the winner

    shot: S/103-idle-frames.png, S/243-idle-frames.png
49. [polish] (A8) The round III summary leads with "End-game bonuses: none this game." even when it's empty. shot: S/244-r3scored.png
50. [polish] (D30) The follower pay dialog's "card art" is a follower glyph in a grey box, which reads as a placeholder. A 10-coin ghost stack sits over a lone "2". shot: S/216-pay1010.png
51. [polish] (B16) The ring III labels ("Buy 3 times this turn", "Double your gold") are the smallest type on the board, though they're the round-III burst. shot: S/190-r3t1.png
52. [polish] (A6) "Steal 1 each from richer rivals": richer in what? Only after placing did "1 each from P3" (who had more resources) explain it. shot: S/276-g2steal.png
53. [polish] (B20) The lit rival stacks are about 30 px targets. A click 30 px off did nothing and gave no "pick a lit stack" feedback. shot: S/137-click.png
54. [polish] (A6) The gold "+2●" (Golden Years) reads as a flat +2, but it gives 2/4/6 by round. Its panel shows no "2·4·6"; the green +2 panel does. shot: S/gAB.png, S/x-vv1.png
55. [polish] (B21) In round I, 9 of the 10 shop cards are faded, so the whole shop reads as a disabled panel. The "0 you can afford" label repeats what the fade already says. shot: S/x-vv1.png
56. [polish] (A6) "+2● +2 of a color, others get 1" (Goody Bags): which color? The panel leaves it open. shot: S/260-wheel2.png
57. [polish] (A2) "Ransom a member", "+4● trade silver" and "+1● per loose ⚑" can't be deciphered from the panel. "Loose followers" is a rulebook term a newcomer won't remember. shot: S/260-wheel2.png
58. [polish] (E8, D23) Seat member sprites at about 24 px look alike: I can't tell Curator from Minimalist from Connoisseur without hovering. At shop size (60 px) they're charming and distinct. shot: S/164-myseat2.png

## Audits (checklist E)

### 1. Call to action
- **Home:** the eye lands on the cream "Play on this device" pill. ✓
- **Setup:** Start, plus the cream "Person" toggle. ✓
- **Intro:** Begin. ✓
- **Starting pick:** the eye goes to the wheel first and the glowing pick card second. ✗
- **Placing:** the glowing spaces win. ✓
- **Gift, steal and swap choices:** the wheel still dominates; the lit seats and stacks are thin outlines. ~
- **Hustler color:** thin rings on the seat dots. ✗
- **Pay:** the dark Pay button. ✓
- **Buy step:** the bright 2→1 tile, then the lit cards. ✓ But Pass is the faintest thing on screen.
- **Round summary:** the "Start round II" pill. ✓
- **Results:** the headline, then Play again. ✓

### 2. Card anatomy
Big Family's face, loudest to quietest: sprite (60% of the card), sphere tint, cost dots and numbers in bold, worth "3⚑", then the name in 9 px grey caps. Its hover: bold name, worth, picture, "costs…", ability sentence, "You're short…". For a buying decision the name should beat the tint. The hover's cost and worth lines, and "colorless", could go.

### 3. Glyph census (17)
- resource dot (4 per table, 8 across my two tables)
- split any-dot
- follower mark
- "→" on follower buys
- minion emoji (bee, king, frog, skull)
- robed leader with badge
- hub numeral I/II/III
- cream glow = open
- solid grey = taken
- dotted outline = taken since your last turn
- dark = not yet open
- "+N" member overflow
- rail dots and ▲/▼
- "leads" pill
- deck sigil
- hamburger menu
- numbered count circles at round end

Look-alikes: white dot vs an empty ring; silver vs any; magenta vs any; skull vs a die; dotted vs solid "taken". That's more than 7 to learn before the first move.

### 4. Duplicate census
- **Turn:** the header's "Your turn", the rail's "now" and the seat glow.
- **Round:** header "ROUND I OF 3" and the hub numeral.
- **Minions:** header "3 MINIONS EACH" and the seat columns.
- **My last action:** the toast and the log.
- **Card cost and worth:** the card face and its hover.
- **Affordability:** "N you can afford", the fade and "You're short".
- **8→6 remaining:** the tile and its hover.
- **Scores:** the seat, the rim hover, the space hover and the summary.

Keep the seat number, the fade and the strip. Drop the hover's cost/worth line and the "N you can afford" label.

### 5. Prominence (times I used each)
- **Place:** the wheel, about 560 px. 14×. Right.
- **Recruit:** 10 cards. 5×. Right.
- **Buy followers:** 4 big tiles. 8×, my most-used buy. Right.
- **Release:** hover-only pill. 0×. Too hidden for a rulebook step.
- **Pass:** faint pill. 3×.
- **Undo placement:** the same faint pill. 0×.
- **Spin:** no affordance. 2×.
- **Log:** tiny pill. 1×.

### 6. Order
- **Shop:** by cost, with a visible cost/color toggle. ✓
- **Seats:** in turn order, with the snake rail. ✓
- **Seat members:** recruit order? I couldn't tell.
- **Pick:** fixed color order.
- **Steal targets:** seat order.
- **Log vs strip:** newest first vs oldest first. ✗
- **Summary:** rims in a fixed order, players by score. ✓
- **Results:** by rank. ✓

### 7. Hover census
**Early round I:**
- Shop cards (all 10) anchor beside the card and show the ability and "You're short". ✓
- Ring I spaces (all 12) anchor and show "You'd get / why / if you take it, you'd lead". ✓
- Rims (all 4) anchor and show the standings. ✓ (Green's adds an off-topic copy rule.)
- Seats dock 136–488 px away. ✗
- Names in the strip open the card or space and outline the space on the wheel. ✓
- Rail labels: inconsistent.
- Minion columns and the follower number: nothing.

**Mid round II:**
- Ring II spaces (all 8): anchored and informative. ✓
- "each round +2●" explains where it comes from. ✓
- The seat's "+1" opens the full member list. ✓
- Swap targets during the choice: nothing. ✗

**Round III:**
- Center spaces work, except "Redo all" on the first try.
- Rival seat sprites open their cards. ✓
- The 10→10 tile. ✓
- The deck and my score: nothing.

**Results:** nothing hovers.

### 8. Motion and art
- **Drag-spin:** 618 ms to start, coasts for more than 5 s.
- **Arrow keys:** one notch per press.
- **Recruit:** the card flies from the shop, over the wheel, to my seat. ✓ The best motion in the game.
- **Follower buy:** the count just ticks up.
- **Steal and gift:** a snap, or nothing.
- **Bot placement:** readable at Steady, comfortable at Relaxed.
- **Round end:** "+N" tokens fly from the rim to the seat. I could narrate each rule before it moved on.
- **Art:** shop sprites look finished and distinct. Seat sprites are too small to tell apart.

### 9. Space budget
1. **Wheel**, about 560² px: right, though ring III is dead space through rounds I–II.
2. **Shop**, about 300×520: right, but the names are tiny.
3. **Seats**, about 300×430: bot seats are half empty in round I, yet by round II my own members are cut down to 3 plus "+N".
4. **Strip and toast**, about 300×220: fine.
5. **Follower tiles**, about 280×115: generous, but they're my most-used buy, so that's earned.

### 10. Decipher test (my guess → what the hover said)
**Classic table:**
- "+2● refresh the shop": right.
- "1 per blue on sale": right ("face-up" in the hover).
- "+2● then recruit": wrong; it's any colors.
- "Copy a space a rival just took": right.
- Gold "+2●": wrong; it's 2/4/6 by round.
- "+3●": right.
- "Save 4 on next member": right.
- "+3● +1 to anyone": right.
- "Free recruit the cheapest": right.
- "+1● per recruit by all": right.
- "+1● swap, equal cost": right.
- "+2● and redo a space": right.
- "Copy a space taken this round": right.
- "+1● per member": right.
- "+3● from rivals": right (split as you like).
- "Swap a member with a rival": right (your cost +2 or less).
- "Free recruit cost 4 or less": right.
- "Gain blue half your priciest": right.
- "Half-price recruit": right.
- All four center spaces: right.

**Random 4 table:**
- "Steal 1 each from richer rivals": unclear; "richer" meant resources.
- "Steal 1 then you're safe": I guessed safe from swaps; it's safe from steals only.
- "+2 of a color, others get 1": unclear which color.
- "Ransom a member": no idea.
- "+4 trade silver": no idea.
- "per loose ⚑": needed the rulebook.

**Other labels:**
- "P2 6": I guessed a score; it's probably minions.
- "in 5 / twice": guessed.
- Rim emoji: I guessed a die; it's a skull.
- White dot: I guessed empty; it's white.
- Seat "+1": I guessed a follower; it's one more member.
- Pay-stack numbers: I guessed "paying"; they're what I keep.

## Misreads
- **Rim leader's skull:** I read it as a die.
- **White resource dot:** I read it as empty or zero.
- **Random table's any-dot:** I read it as magenta.
- **"P2 6":** I read it as P2's score.
- **"Choose how to pay ···" during bot turns:** I read it as the game waiting on me.
- **"P3 picks first":** I read it as a turn-order bug; it was Front-runner.
- **Gold "+2●":** I read it as flat; it's 2/4/6.
- **Snap Up:** I read it as a normal recruit; it's any colors.
- **Seat "+1":** I read it as a follower or resource; it's one more member.
- **Pay-stack numbers:** I read them as what I pay; they're what I keep.
- **Dotted outline on a space:** I read it as "selected"; it means taken since your last turn.

## Felt unfair or unfun
1. P2, leading by 20 or more, swapped my Big Family (worth 3) away on the last turn. The leader hit a trailing player, I couldn't answer, and I only learned it from the summary.
2. P3 picked first every round while it had the most followers. The screen never said why, so it felt rigged until I dug through the strip.
3. One click on 8→6 took 8 gold, with no pay step and no undo before the bots moved.
4. The swap was blind: I gave away a member for one I couldn't read.
5. Round III was a spending race. P3's "Buy 3 times this turn" gained 20 followers in one turn, and the game ended 74 to 36. My engine (Curator, Minimalist) made blue that I mostly dumped into 2→1 buys.
6. I won one rim prize all game (+2). Once the bots stacked colors, the rims felt out of reach and dropped out of my decisions.
7. On Random 4 I'd have paid the wrong color, because white, silver and "any" look alike.
8. The toast and header kept talking about my last move while bots played, so I kept looking for something to do.

## Grade
I started from D. What I saw work, in order:
- The wheel reads well, and every Classic space panel decodes on the first or second try.
- Space and shop hovers are rich and anchored next to what you point at.
- Every target choice (steal stacks, gift seats, swap members) is picked on the board.
- The "since your last turn" strip links every name and outlines the space on the wheel.
- Recruited cards fly to your seat.
- Round end can be narrated as it happens, and the summary and results explain every point.

That earns a C+. It isn't a B, because a friend would ask me at least four things tonight: what "P2 6" means, why P3 goes first, what the pay-picker numbers mean, and how to use a member. They would also:
- misread whose turn it is at hand-offs (#1, #11),
- swap blind (#3),
- misread costs on any table with white or silver (#4).

**Grade: C+**