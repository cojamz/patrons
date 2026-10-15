# Cults: how the screen speaks (draft grammar, for Cory's reaction)

Plates: `plate.png` (plate 1) and `plate2.png` (plate 2: the doorway, a full quadrant, decompressed), with the place candidates in `plate2-candidates.png`. Shared glyphs and tokens: `kit.js`, `kit.css`. Nothing here is wired into the game.

## Ten rules, taken from the games that read in one glance
1. **A closed alphabet.** Two drawn symbols, the dot and the follower, reused everywhere, never a one-off icon; everything else is a word (Cory, 2026-10-15: simplify). (Race for the Galaxy, Dune: Imperium)
2. **The amount first, and loudest.** "+3●": the number is the biggest thing, the noun follows it. (Slay the Spire's intents, Into the Breach's damage)
3. **Left to right, give → get.** One arrow means "becomes"; what you give is on its left. (Everdell, Lords of Waterdeep, Dune: Imperium)
4. **One mark per idea.** The dot only ever means a resource, the follower only ever means followers; "per", "for" and "becomes" are written out. (Wingspan)
5. **Yours big, the rest small, the name in the hover.** The big line is what you get. One line of fine print appears only when the big line can't say it (where it comes from, how it scales). A place's name lives in its hover. (Lords of Waterdeep)
6. **Light means "you can act here".** One warm-white glow for the one thing under your hand. Color only ever means a resource or its quadrant. (Into the Breach, Balatro)
7. **Silhouette says what kind of thing; pixels say who; glyphs say what.** A disc is a resource, a card is a person, a doorway is a place. Pixel art is identity (members, leaders, minions), and rules are never drawn into it. (Wingspan, Spirit Island, Inscryption)
8. **Fixed anatomy.** Every space and every card keeps each part in the same spot, so the eye learns one map. (Wingspan, Root)
9. **Glyphs for nouns, words for the rest.** Rare verbs and conditions are plain words. The full sentence is always one hover away. (Root digital, Slay the Spire's keywords)
10. **One grid, three sizes, one stroke, one corner, and air.** Polish is consistency plus room: at least 24px between objects. (Balatro, Into the Breach)

## The alphabet (2) (Cory, 2026-10-15: simplify)
Cory: "why are there still symbols here. just simplify visual language everywhere."
Objects: **disc** (resource), **card** (member), **doorway** (place).
Drawn: **● resource dot** (a plain flat disc in its color, no inner mark; the cream/white dot has a hairline edge) · **any** (the same dot split into the table's four colors, each where its quadrant sits) · **follower** (Cory's pixel person, one flat silhouette in the text's color). Nothing else is drawn.
Words for the rest: "member", "rival", "minion", "extra turn", "swap", "per", "for", "becomes", "times". The one arrow left is the follower buy's ("2● → 1👤"). Plus and minus belong to the number ("+3", "−4"); numbers are heavy and sit right against the dot or follower they count.
Retired: the member, minion, rival, arrow, swap and extra-turn marks; the typed "/" and "×" operators; the ring for "any", per-color shapes and coin marks, the badge, every space's pixel icon on its face.

## The three objects
A **disc** is money (the dot). A **card with a person** is a member. A **doorway** is a place, where you send a minion. Each one's silhouette is unique, so the kind of thing reads before anything on it does.

## Composition
- **A place (the doorway, plate 2):** an arch 136×148 with a 68px dome, standing on the wheel's ring, and a 44px door at its foot. The effect is the hero, set at 36px in the dome. At most one line of fine print, only when the big line can't say it. There's no name on it: the name opens with the hover, above the sentence and "You'd get …". The door shows the state: **open** is a dark door; **lit** (yours to take, under your pointer) is the door lit from inside plus a warm glow; **taken** is the minion standing in the door with the arch faded to half; **locked** is an outline arch with the door shut and the round's numeral on it. Each ring's numeral (I, II, III) sits beside its last door. If a place's number depends on the round, the big line shows this round's value and the fine print shows "2 · 4 · 6 by round".
- (Plate 1's flat ring segments with names are superseded by the doorway.)
- **A member:** portrait (top) · name (small caps) · when (a plain clause, at most two lines, sitting right on the effect) · effect (the same big-line grammar as a space) · cost bottom-left · worth bottom-right. The when-clauses form a short set: *When recruited · Each round · When … · Once a game · Once a round · At game end*; nothing at all means always on. Hover: name, cost, worth, the sentence, then one live line tying it to the board ("Golden Years would give you 5● instead of 4●").
- **A cost:** number before dot, colored part first, then any: "2● 2◐". No color names and no "need N". What you can't afford is shown by fading the card, not by text.
- **A rim rule:** "MOST ● +4☺", then the leading player's minion. It's engraved in light type on the dark band, never on paper, so it can't be mistaken for a space.
- **Sentences:** a dot stands in for its color word ("gives you ●"). Numbers are always heavy.

## The 15 hardest actions under it (big line · fine print)
1. Kickback: `+3●` · a rival gets 1●
2. Golden Years: `+4●` · 2 · 4 · 6 by round
3. Intro Offer: `▯−4` · off your next member
4. Collect Debts: `+3●` · up to 3, from rivals
5. Tithe: `+1● / ▯` · per member you have
6. Double Down: `×2 ●` · doubles what you hold
7. Snap Up: `+2● +▯` · recruit one now, pay in any colors
8. Half Price: `▯ ×½` · as your buy, any colors
9. Spree: `buy ×3` · this turn
10. Catch Up: `+1● +2● / ⛤` · per rival with more minions out
11. Overtime: `8● → ↻↻` · can't pay? +3●
12. Even Swap: `+1● ▯⇄▯` · with a rival, equal cost
13. Cheap Seats: `◐ → ☺` · 1 for 1, up to 2 · 4 · 6
14. Hold Court: `+1☺ / 2●` · keep the ●; everyone else +2●
15. Echo: `copy ⛤` · a space a rival took since your turn
Poach, Shake Down and Crunch Time need two clauses; they get the same big line plus a second fine-print line, never a new mark.

## Type, grid, line, color
- **Type:** Alegreya Sans only, lining tabular numerals. Plate 2 sizes: 14px (member names in tracked caps 700; fine print; when-clauses), 18px (sentences, seat numbers, costs), 36px (the big line, your follower total). Plate 1 used 12/16/28 and was too tight. Glyphs are 0.8em of the type they sit in.
- **Grid:** 4px. Paddings 16/20; at least 24px between doors, 32 between cards; 32px from the screen edge. Member cards are 176×240.
- **Line and corner:** glyph strokes are 1/8 of the glyph (2 on its 16 grid), round ends; structure is 1px hairlines; every container has an 8px corner, art boxes 4px, dots are round. Paper sits on the dark table by value alone, with no borders.
- **Color tokens:** table #191310, seat #221a15, board #2b2119; paper #f2e8d2 (lit #fbf6ea, taken #cfc2a6); ink #2b2018 / #6e5c49 / #a39078; cream #f2e8d2 / #b9a98c / #7d6e5a; light #fff3d4 (the one accent); gold #d49b27, red #c4533f, blue #4a80b8, green #3f9467.

## Reading a rival's build at a glance (Cory: "I have no idea what the bots' builds are")
Their seat answers four questions in one row each, the same alphabet throughout: **what they hold** (dots, zeros faded), **who they've recruited** (portraits, grouped by color: the color mix is their lean), **what that makes each round** ("each round +3● +2●", the sum of their round-start members), and **what they just did** ("just took Kickback", kept for one turn). **What they're going for** is on the board: their minion stands on every rim they lead. Hovering their portraits opens each member in the same card grammar.

## Open risks
- The dots differ by color alone (Cory's call, 2026-10-15: plain dots, no inner marks). The White table's cream dot has a hairline edge; every dot still says its color name on hover, and the setup picker prints it beside the dot. Colorblind play is the open risk.
- Long when-clauses ("Whenever the rival with the most followers buys followers") won't fit two lines on a 140px card. They'd need a shorter set of clause words, and that's untested across the 157 members.
