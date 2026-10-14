# Cults: what it could be

**North star.** Cults should feel like leaning over a lamplit table with friends: a painted wheel, little hooded figures, cards you want to pick up.
The screen asks one question at a time and shows only what answers it. Everything else sits in the lamp's shadow, one hover away, and every hover tells the truth.
Restraint is the luxury here. If something can be an object on the table, it never needs a label. If it can live in a hover, it never needs to sit on screen.

Cory's verdict on the build: *"SOOOO much info, no clear hierarchy, maximalist."* The current screen gives about 40 things equal volume: rule lists, chips, boxes, captions. The fix isn't a new skin. It's a hierarchy rule that every direction below obeys.

## The hierarchy rule (applies to all three directions)

| Layer | What lives there |
|---|---|
| **Glance**: always on screen, at most 7 groups | 1. Whose turn it is, plus the one question ("place a worker", then "recruit or buy"). 2. The wheel: an icon and a yield on each open space, figures standing where workers are. 3. One leader sigil on each quadrant's rim plaque. 4. The 10 cards: art, name, timing, cost, worth. 5. Your resources as stacks. 6. Your workers as figures, and your members as a small fan. 7. A rail of four seats: name, followers, workers left. |
| **Point**: hover, or long-press on phone; never needs a click | A space shows its full text, exactly what you'd get, how it moves the contest, and which cards it lets you afford. A card shows its full text and what you'd pay, broken down. A rim plaque shows the contest standings, every count straight from the engine's scoring. A seat shows that rival's resources, members and last three moves. A card's name, anywhere it appears, opens the card. A keyword shows its definition. |
| **Open**: one click opens a drawer over the shop | The chronicle (log), a rival's whole table, the rules. |
| **Gone entirely** | The quadrant rule-list panel: the board *is* the rules. "Facing you" and the spin arrows on desktop: icons are upright, so nothing needs to spin. The "Since your turn" line: fresh moves wear a dashed ring on the board, and each seat shows its last space as an icon. The per-space ROUND I/II/III labels: the rings say it. The "you can afford" text: unaffordable cards dim, and a tick says "✓ after Rush". The four boxed follower buttons and Pass: one quiet rate line instead. The header bar, How to play and Leave: one menu glyph. "No members yet", "0 members", "no workers": an empty space says it. Player colour dots: seats become sigils on figures (shape before hue, so players never clash with the resource colours). |

Phase changes move **the lamp, never the furniture**. Placing lights the wheel. Buying lights the shop. Round end lights the rim. Regions never jump.

## Three directions

### 1. The Lamplit Table (recommended)
*You're in your own chair at a real table: a painted paper wheel, hooded figures, a row of cards, and one warm lamp that follows the decision.*
- **Signature interaction:** you pick up a figure from your seat and hold it over a space. Its yield appears as ghost tokens, the rim plaque recounts the contest, and the cards you could then afford tick "✓ after Rush". When you drop it, the tokens hop in an arc onto your stacks.
- **Information architecture:**
  - The wheel sits on the left. It's the hero, at about 45% of the width.
  - The rail runs top right: the scoreboard in snake order, with arrows that flip mid-round.
  - Below it, the shop is a 5×2 row of cards, then the follower rate line.
  - Your table sits bottom right: resource stacks, worker figures, a fan of members.
- **Visual identity:**
  - Materials: a walnut table, with a cream printed board and cards in Wingspan's paper palette.
  - Colour: muted quadrant inks (ochre, pewter, madder, verdigris).
  - Type: Alegreya with Alegreya Sans, one calligraphic superfamily.
  - Motion has weight. Things lift 2px under the cursor, land with a one-frame squash and travel in arcs. Nothing fades without a cause.
- **Pixel art:**
  - Sprites are 16×16, shown at integer scale, from one palette, with a 1px ink outline. Each sits in a paper window, like a woodcut on a printed card.
  - A member is a hooded acolyte in its quadrant's robe, holding its prop: Banker's coin, Cutpurse's dagger, Muse's lyre.
  - Spaces are objects (goblets, a door, a pouch).
  - Each resource colour has its own shape: coin, crescent, gem, leaf. Any resource is a rainbow ring.
  - Timing gets a tint, the way Wingspan colours its bird powers ([BGA help](https://en.doc.boardgamearena.com/Gamehelpwingspan)).
- **Phone:** your seat is in your hand, in a bottom dock. The wheel is a half-disc you spin with your thumb, the shop is a row you swipe, and a long-press does what hover does.
- **References:**
  - [Wingspan, by Monster Couch](https://pcgamer.com/wingspan-review): it serves the screen rather than copying the tabletop, and its cream paper and warmth are the right register.
  - [Everdell, by Dire Wolf](https://www.meeplemountain.com/reviews/everdell-digital/): a crafted woodland table, and characters standing in for meeples.
  - [Inscryption's cabin table (DiGRA paper)](https://dl.digra.org/index.php/dl/article/download/2474/2467/2503): a diegetic table where you drag cards rather than click them, and the objects carry the rules.

### 2. The Chronicle
*The cult's own book: an illuminated two-page spread. The wheel is a volvelle, a turning paper chart, on the left page. The right page writes each turn as a sentence.*
- **Signature interaction:** every move is inked into the margin, stroke by stroke, in that player's hand. The prompt is a sentence with blanks: "Send a hand to ___, and take ___." Hover any inked word for its footnote.
- **Information architecture:**
  - The left page holds the volvelle.
  - The right page holds the question, then the shop as 10 illuminated entries with miniatures in the margin.
  - Rivals are portraits at the page corners.
  - The log is the book itself: to see earlier turns, you turn back a page.
- **Visual identity:** vellum and iron-gall ink, with red rubrication for keywords. A blackletter display face over a humanist text face. Motion is ink drawing itself in, and a page turns at round end.
- **Pixel art:** illuminated miniatures in gilt frames, with marginal drolleries (little doodle creatures) that react to steals and recruits.
- **Phone:** one page at a time. You swipe from the volvelle to the ledger, and it reads like a book.
- **References:**
  - [Pentiment: Lettermatic's fonts](https://lettermatic.com/custom/pentiment) and [Sawyer on dead fonts](https://www.gamebanshee.com/96xr8).
  - [Cultist Simulator's card table](https://www.thumbsticks.com/interview-unseen-arts-behind-cultist-simulator/).
  - [Volvelles](https://en.wikipedia.org/wiki/Volvelle).
- **Risk:** it leads with text. It would be gorgeous, but scanning it is slow, which is the opposite of "less info".

### 3. The Séance
*A black room and one ring of candles. The wheel floats in the dark, and only what's live is lit. It's theatre: every turn is a cue, and every round end is a reveal.*
- **Signature interaction:** the Reckoning. At round end the room goes dark and each quadrant's candle flares in turn. Each rival's count rises as a flame, and the winner's figure steps forward while their followers count up, one cause at a time.
- **Information architecture:**
  - The wheel is centred.
  - Rivals are faces at the edge of the light, sitting around the wheel.
  - The shop rises from below like a tarot hand when it's time to buy.
  - Your belongings sit in a low arc at the bottom.
- **Visual identity:** near-black with saturated inks. One condensed display face in the cut-paper style of Persona 5's menus. Hard light, and staged motion with snap.
- **Pixel art:** large sprites lit like candles, with a two-frame flicker while idle.
- **Phone:** the best of the three, because a portrait screen suits the stage. The wheel sits centre and everything else slides in.
- **References:**
  - [Balatro's sequential, attributed scoring](https://blakecrosley.com/guides/design/balatro).
  - [Persona 5's menus](https://mechanicsofmagic.com/2022/04/23/visual-design-of-games-persona-5/).
  - [Marvel Snap's reveal tension](https://www.gamedeveloper.com/game-platforms/designers-don-t-sleep-on-marvel-snap-s-simultaneous-turns).
- **Risk:** drama wears people out over a 40-minute game, and dark-and-saturated fights the eurogame brief.

## Recommendation: the Lamplit Table, with one theft from each sibling
- **It's Cory's brief, taken literally:** tactile, crafted, eurogame warmth with a competitive edge (hostile moves stay marked on the board).
- **It delivers hierarchy through light, not removal.** Nothing is hidden, only dimmed. You can still read the shop while you place.
- **Objects replace labels.** Stacks, figures and sigils replace the counts, chips and coloured dots, and that is where most of the current 40 elements go.
- **It fixes several critic issues by construction:**
  - Furniture never moves (#7).
  - Sigils separate players from resource colours (#4).
  - Every hover previews the outcome (#3).
  - Contests live on the rim (#1 and #2).
- **The thefts:**
  - From the Séance, *the Reckoning*, used only at round end. Spend the boldness in one place.
  - From the Chronicle, *the ink*: the log drawer reads like a book, and its names open the cards.

## Key frames (Lamplit Table)
`shots/f1-place.png`: your turn, placing a worker, with Rush hovered.
