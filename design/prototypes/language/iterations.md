# Language plate: iteration log

Each render is in `renders/<tag>-plate.png` (1×) with 2× crops beside it. Judged at 2× against the 10 rules in grammar.md.

## v1
What works: the wedge reads as a board, the big line on each space is legible at a glance, the follower and dot glyphs sit on the numerals' baseline, the lit space's light ring is the only warm-white thing on screen.

Failures, by rule:
- R10 (one grid, quiet): the three neighbor quadrants are drawn as gray paper at 22%: a heavy muddy mass that fights the gold wedge and looks unfinished.
- R8 (fixed anatomy): the cactus on Intro Offer sits on top of the name; the frog on Kickback is placed by eye. A taken space has no fixed spot for its minion.
- R8: the shop card's "When a space gives ●" wraps into the effect line. The card has no fixed slot for a two-line trigger.
- R9 (words where glyphs fail): fine print mixes a tiny rival glyph with words ("from ⛤ rivals"). At 12px the hood is a blob; the word alone is clearer.
- R6/R7: the hover card says "Gold member", a color name Cory asked to drop (the dot already says it).
- R2 (amount first): the rival seat's resources run together ("3●1●4●0●" reads as 3140).
- R10: the closed center space is a translucent gray smear, not a clear "later" state.
- Rim: the frog that leads the rule crowds "+4☺", with no gap to show it's a different kind of thing.
- The space hover sits at x=24 while every other edge is on 32.

## v2
Fixed: neighbors are now engraved hairlines; a taken space puts its minion where the name was (one fixed spot); fine print is plain words; the hover lost "Gold member"; the shop card has a fixed two-line slot for when it triggers; the rim's leader sits behind a hairline; everything starts on the 32px margin.

Still failing at 2×:
- R8: the rival seat's "EACH ROUND" and "JUST TOOK" wrap into two lines and crowd the member portraits.
- R8: Prospector's trigger breaks as "When a space gives you / ●", a lone dot on its own line.
- R9: sentences still say "gold ●" twice (the word and the dot). A dot is the word, so the sentence should use one or the other: the dot.
- R1: in the alphabet strip, "/" and "×" are set at caption size and look like afterthoughts beside the drawn glyphs.
- The hover's lone "worth" caption under the follower count reads as a stray word.

## v3
Fixed: the rival seat fits on two rows (holdings and followers; members, what they make each round, what they just took); Prospector's trigger breaks on purpose ("When a space / gives you ●"); dots replace color words in sentences; the operators in the alphabet are set at glyph size.

Still failing at 2×:
- R4 (one mark per operator): the rim's radial hairline before the leader's minion slants like "/", the mark that means "per". A separator must never borrow an operator's shape.
- R10: Double Down's name sits 2px under the center ring's top arc; its block is pushed outward by a stray +8.
- The hover sentence wraps to a one-word last line ("more."); sentences need balanced lines.
- Intro Offer: a full word space between the member glyph and "−4" splits one idea into two.
- Shop cards: the one-line triggers leave a 32px hole under the name. The art band can take 8px of it.
