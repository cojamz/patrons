# Answer key: what Cory found in ten minutes (2026-10-15)

Source: design/decisions.md, "2026-10-15 — Cory plays the live build" and the line after it (the action looks rejected as slapdash).
Used to score a critic brief's recall: a finding counts as a hit when it names the same problem on the same element, in any words.
**Never show this file to a tester.** Testers get only the URL, design/rulebook.md and the brief.

Weights: every item counts 1. Items marked (taste) are design-level calls a sharp critic should still raise.

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

Not scored: Cory's idea of a discard pile for released members (an idea, not a defect).
