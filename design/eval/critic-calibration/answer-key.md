# Answer key: what Cory found in ten minutes (2026-10-15)

Source: design/decisions.md, "2026-10-15 — Cory plays the live build" and the line after it (the action looks rejected as slapdash).
Used to score a critic brief's recall: a finding counts as a hit when it names the same problem on the same element, in any words.
**Never show this file to a tester.** Testers get only the URL, design/rulebook.md and the brief.

Weights: every item counts 1. Items marked (taste) are design-level calls a sharp critic should still raise.
Part 2 (items 25–37) is what Cory caught later the same night on newer preview builds (decisions.md after the 03:40 block; his words: the problems "aren't even remotely difficult to spot"). Each item says whether it exists on the frozen RC1 build (fd4d734, :5191) the calibration runs play; an item that isn't on the build under test is scored N/A for that run, and recall is reported over the items present.

1. **Not snappy.** The game as a whole feels sluggish: clicks, transitions and bot turns take too long to answer.
2. **The wheel spins slowly.** Rotating the wheel (or its turn-to-face motion) drags.
3. **Hovers open docked, not where you hover.** Card and space popovers appear in a fixed spot under or over P3, far from the pointer.
4. **Setup's starting-resource pick has no call to action.** Nothing visually says "pick here"; the four coins don't read as the thing to press.
5. **Member card hierarchy is wrong: the effect doesn't read first.** What the member does is plain text and doesn't lead.
6. **Member cost is unclear.** The cost isn't the clear second read, and it spells out color names that the colored dot already implies.
7. **"Need N" shouts.** The red NEED line is the loudest thing on the card.
8. **Card/hover clutter.** Lines like "You pay", "Leaves …", "Members: you'd lead N" and "Click the card to recruit it" are noise.
9. **Too many currency symbols.** Each resource has its own shape, plus a ringed "any" symbol: too many little glyphs to learn.
10. **The steal selector is clumsy.** Picking whom to steal from and what (Help Yourself, Lie Low, Redistribute) goes through a confusing list instead of the rival's seat.
11. **The pay dialog is unintuitive.** Choosing which resources pay a cost needs a clearer design.
12. **The follower shop is hidden.** Buying followers (2→1 … 10→10) is a small strip, far less prominent than the member shop, though it's half of every buy.
13. **The top score row is redundant.** The ranked score line repeats what every seat already shows.
14. **Seats waste space.** Player seats are large, mostly empty boxes; they should be condensed.
15. **The shop isn't sorted.** Ten face-up members in no visible order (cost or color).
16. **The deck's hover is noise.** The face-down pile opens a popover nobody needs.
17. **Round-end scoring is too fast and confusing.** The Reckoning flashes by; you can't follow which quadrant paid whom, and totals don't visibly climb.
18. **Redistribute's text is ambiguous.** "Each player holding more than you" begs "more what?".
19. **Some members have no hover.** At least one shop member (Kingpin) and your own freshly recruited member open no card.
20. **The pixel art isn't distinctive.** Members are look-alike little people; you can't tell them apart at a glance.
21. **The pixel animations are weak.** Sprite and motion quality reads as unfinished.
22. **Action spaces overlap the rim's scoring rules.** The space tokens sit on top of the quadrant's rim text.
23. **The action spaces look slapdash.** (taste) No clear visual language: icons, labels and sums are a jumble rather than one grammar.
24. **Blue doesn't work.** (taste) The blue quadrant, built on "badged" members, is confusing and weak; it needs a rework.

## Part 2: later the same night (newer builds)
25. **The rim shows a dot, not the color word.** "MOST ◯" makes you decode a symbol where the word "BLUE" would do. *RC1: absent* (RC1's rims say "MOST GOLD").
26. **Action panels speak in cryptic shorthand.** "fresh row", "copy yours", "½ richest": invented abbreviations a first-time player can't decipher. *RC1: present* ("new row", "/badged", "/recruit", "steal 1 each richer").
27. **Text clips inside the panels.** Lines like "1 follower or …" and "+1 /leader" run past or are cut by their panel. *RC1: present* (space text clipped by its circle).
28. **You can't tell which spaces are available.** Lit (open) spaces aren't clearly different from taken or not-yet-open ones. *RC1: present* (faint glow).
29. **Combination choices are grids of chips or button lists.** Good Deed showed 12 chips (player × color) instead of a pick on the board. *RC1: present* as button lists (Kickback's gift, the steal lists).
30. **The starting picker uses the old shaped coins** (bell, leaf, ring, hexagon) and a stray arrow, unlike the plain dots elsewhere. *RC1: present* (shaped coins; no arrow seen).
31. **Shop cards carry shorthand ability text** that can't be read; the face should be identity and price, the ability a plain sentence in the hover. *RC1: absent* (RC1 cards show no ability text).
32. **The seat hover repeats Followers and Has** (already on the seat) instead of listing that player's member abilities and which one-use members are used. *RC1: present* (FOLLOWERS / HAS / MEMBERS / LAST MOVES).
33. **No discoverable way to use a member.** Nothing shows a member is usable, how to use it, or that it's been used. *RC1: present* (a small "Use" pill with no hover or hint).
34. **The "since your last turn" strip takes a third of the screen** for two lines; the log gets prime space it doesn't need. *RC1: absent* (no strip; the log is in the menu).
35. **Seat panels are tall and mostly empty.** *RC1: present* (as item 14; scored separately because Cory called it again on the new layout).
36. **Unplaced minions float around the leader.** Noisy, and you can't count how many are left at a glance. *RC1: present.*
37. **Names in the log (and strip) don't open their cards.** Space and member names in the history aren't hoverable like everywhere else. *RC1: present* (space names in the log open nothing).

Not scored: Cory's idea of a discard pile for released members (an idea, not a defect).

## Part 3: Cory's notes, the morning after (2026-10-15, ~14:00 UTC)
Source: this morning's session with Cory (logged in design/decisions.md, 2026-10-15). He played the PR preview, which turned out to be a stale pre-10:00 build ("Ransom a member", "2 extra turns for 8"), so some notes may already be better on 0c1cd51; each is scored on whatever build is under test, N/A where it doesn't show. Testers' recall has not yet been re-checked against these items.

38. **Pass is hard to find.** Ending your turn without buying is a small button in the buy prompt, not where you decide the buy.
39. **The gift's two-step pick is confusing.** Good Deed (and every gift and steal) asks you to click your color stack in the seat corner, then a rival's seat; the only cue is your stacks lighting up and a small line under the header, neither where your eye is. His words: "very bad/confusing".
40. **The turn-order rail is confusing.** The dots stepping down the seats, "in 4 ×2" and the arrow try to say too much with too little.
41. **The wheel's emojis are too big and out of line.** Rim leaders and minions on spaces are oversized, not upright with the rim lettering, and cover the panels' words.
42. **Catch Up never pays its bonus.** Your own minion is counted first, so in a normal snake nobody is ahead of you; he also got nothing at all from it, not even the +1. (taste)
43. **Purple spaces charge you to use them.** "No board action should require spending": Overtime and Crunch Time cost purple to take. (taste)
44. **Hovers feel laggy.** The card opens, then fills in its "You'd get" line; it isn't complete when it appears.
45. **Animations are too fast even on Relaxed, and not smooth.** Relaxed isn't clearly slow; the motion stutters.
46. **"The design is still clunky."** (taste) The screen as a whole still doesn't feel polished.
47. **Catch Up's text can't be decoded.** "what does this mean?" The hover's "+1 ●, and +2 per rival with more minions on the board than you" with a bare "Taken P1" doesn't say what is counted or when. Separate from 42 (it never pays). Source: cor-catches-2026-10-15.md.

Source: Cory's play notes, 2026-10-16 (v0.5 build).

48. **End-game member bonuses are hidden until the final screen.** He won by 1 thinking he'd lost; the bonuses should land with the end-of-round animations.
49. **Round scorecard lags.** The round scorecard screens are slow to fade in.
50. **Members and follower shops are too dim.** Members are dim both tinted and active; the follower shops aren't lit enough.
51. **No way to find how to release a member.** "I can't figure out the UI to release a member."
52. **The snake draft is unclear.** Nothing tells players the turn order is a snake.
53. **Unexplained follower fly-out before round end.** Followers fly from the piles toward every player; not the contest followers, and nothing says what it is.
54. **Peek reads like a free member.** "peek doesnt GIVE you the member from the top right? you have to pay for it" (Cory, Oct 22 playtest). The text says your recruit may be one of the top 4; it doesn't say you still pay.
55. **Copy previous on Open Door gave nothing.** "Copy previous action -> recruit cheapest didnt work" (Cory, Oct 22 playtest). The copy was capped at the first taker's cost and that card was gone.
56. **Copying Open Door kept the first player's cost limit.** "Copying open door seemed to apply the cost restrictions of the first person who did it?" (Cory, Oct 22 playtest). Same cause as 55.
57. **Peek hides the shop.** "with peek, player loses the ability to see the current shop. The UI is rough I think" (Cory, Oct 22 playtest). Ordering the top 4 replaced the shop instead of sitting beside it.
58. **Peeked cards you can't afford vanish.** "player should still be able to see Peek card they cant afford when recruiting" (Cory, Oct 22 playtest). Only the affordable pile cards joined the shop.
59. **Last Call stops skipping.** "P2 took Last Call… and they have not been skipping turns" (Cory, Oct 26 playtest, round III, 4 players). A rival whose turn moved to the end after Last Call (their own Sleep In or Hold Up, Extra Shift's minion) landed behind the caller, so the caller placed before everyone else was out.
60. **The same member shows twice in the shop.** "there are two courier cards in the member shop" (Cory, Oct 26 playtest). Nine cards in a shop of 8: after a pile buy (Peek, Insider), a pile card dealt into the row was drawn twice for a moment and the copy stuck.

Source: blind tester panel, 2026-10-26 (v0.8.86); fixed in v0.8.87 to v0.8.91.

61. **Churn's tap button says "Recruit".** On a phone, Churn's sheet button read "Recruit" and sent the card to the bottom. Now "Send to bottom" (Bury too; Peek says "Put on top").
62. **Spree's "Done, no recruit" ends one recruit of three.** The screen looked the same and the player waited. Done now ends every recruit left, and the header counts them ("2 recruits left").
63. **A steal's card moves under the pointer.** Redistribute's card dropped ~60 px after the first pick, so the second click took from the wrong rival. The card now keeps its place for the whole steal.
64. **Shake Down's question names the wrong owner.** "P4 holds Trendsetter: keep it for 3?" when you hold it and P4 is the thief. Now "P4 is taking your Trendsetter: pay 3 to keep it?".
65. **Spam-clicking Pay opens the deck catalog.** Clicks after the pay sheet closed landed on the deck. The deck ignores clicks right after a payment and double clicks.
66. **Losses to rivals show nowhere on your seat.** A swap, a member taken, or a steal through a chain of copies was only in the log (all four testers). Your seat keeps a line of what rivals took since your last turn.
67. **Promote's picker cuts off the last rival's row.** It overlapped the Shop row. Rows now show whole, and a row that scrolls fades at its edge.
68. **Promote's hover says "COULD SWAP 98 lit pairs".** Now "9 members for 7 shop members".
69. **The space's hover covers the question it opened.** After placing, the hover stayed over the steal and swap rows. It closes when the question opens.
70. **"+6 won" in round summaries counts steals and trades.** It read as contest prizes. Now "gained" or "lost", with sources in its hover.
71. **A member's bubble cuts its rule off.** "Whenever a rival recruits more tha…". The bubble now shows two lines.
72. **The artifact pick isn't in the rulebook.** Setup now explains it.
73. **"1 members" on a seat.** Now "1 member".
74. **Ordering Peek's 4, the shop stays as bright as the 4.** With "affordable" on, every affordable shop member stayed lit beside the peeked cards and it was unclear what to click (Mike, Oct 26; Cory: "definitely confusing"). The shop now steps well back while you order, toggle or not. Gate: peek.mjs k4.
75. **"4 off your next member" doesn't let me buy a 1 color + 2 any member** (Mike, Oct 26). Not reproduced: with 4 off and an empty hand, every such member on the 2.0 colors is offered free at the recruit. Likely a misread (a choice other than a recruit was up); ask the player what was on screen if it comes again.
76. **Squatter onto a rival's Greatest Hits copied none of my actions** (Cory's friend, v0.9.1 online game, Oct 27). Not reproduced yet: joining a rival's Greatest Hits copied every one of the joiner's spaces in the game and on screen, in hand-built rounds and about 10 bot-played round IIIs. Gates: cards-echo "Squatter joining a rival's Greatest Hits", e2e squat-hits.mjs. If it comes again, get the spaces the player had that round and whether "copy which next?" came up.
77. **Doppelganger copying Connector did nothing** (Cory, Oct 27). Becoming a copy skipped the copied On Recruit, and Doppelganger only arrives in round III, so Connector's Round Start never came. Cory (Oct 28): Doppelganger now does the copied member's On Recruit at once. Gate: cards-echo "Doppelganger copying Connector".
78. **Spree gave one recruit, not three** (UI critic, release panel Oct 28). Recruiting a member you can use (Speculator) opened the "use a member, or finish your turn" step, whose Done dropped Spree's other two. That step now waits for the last recruit. Gate: spree-uses.test.js.
79. **Panel's Demote titled "Swap any two equal-cost members"** (UI critic, Oct 28). The picker read only a space's own title; Panel asks in its own name. Gate: trade.test.jsx.
80. **Past games jammed at the home screen's bottom edge, click did nothing** (skeptic, Oct 28). Now a dialog that scrolls through 12 games. Also: home said P1 where the game says You.
81. **Members back in the pile kept Night Owl's round mark** (crash sweep, Oct 28; via Tryout). Gate: the clean-card invariant in the fuzz runners and scripts/v4-crash-sweep.mjs tryout.
82. **Farewell (and Release) left the shop one short when the pile was empty** (crash sweep, Oct 28). Now refills.
83. **Greatest Hits pick: the wheel tile shows today's per-member amount (+14) but the copy pays what its taker got (+10)** (UI critic and skeptic, Oct 28). The engine follows the rulebook ("the amount on its chip"); the tile misleads during a copy pick. Open.
84. **Snob's end-game card showed 5 but paid 7** (playtester, Oct 28). The card counts up to the prize; the shot caught it mid-count. Not a bug; card's double period fixed.
85. **Shake Down "choose a rival": pointing at a member on a rival seat opened nothing** (Cory, Oct 29, mid-playtest). The seat button sat over the members. Fixed: members open their card, a click still picks the seat. Gate: e2e/v4/steal.mjs (s7).
