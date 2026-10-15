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
