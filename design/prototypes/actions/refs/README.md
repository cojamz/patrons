# Action spaces: reference board

Why this exists: Cory turned down every look we've drawn for the wheel's action spaces: the medallions, the engraved cells, and the Spoils, Vignettes and Engraved mocks. Before anyone draws again, we pick real games he can point at.

**`board.png` isn't built yet.** On 2026-10-15 this session's network policy blocked every image host: Steam and its CDNs, BoardGameGeek and geekdo-images, Wikimedia, the press sites and imgur. GitHub was reachable, but the fan repos there hold only their own UI icons, not the boards. Nothing was downloaded, and nothing was faked to stand in.

Once those hosts are allowed:
1. Take one mid-game image per reference from the pages below.
2. Crop it to the action spaces.
3. Compose a 1600px sheet, numbered as below, and add each image URL next to its source.

## The references

Numbers are the ones the board will use. Each entry gives what the game does well, then the source and what to crop.

1. **Tzolk'in** (board game). The workers sit in the cups of a turning gear, and the action printed beside each cup is what you get when you pick the worker up. Every turn of the gear carries it to a better action, so the wheel itself shows that yields climb.
   Source: https://boardgamegeek.com/boardgame/126163/tzolkin-the-mayan-calendar/images. Crop: one gear with workers seated.
2. **Lords of Waterdeep** (Playdek digital). Each building shows its reward as the actual pieces, such as four orange cubes or two gold, so you count it rather than read it. An agent covers the building it's on, and the owner's cut is printed in the corner.
   Source: https://store.steampowered.com/app/644390/. Crop: a row of buildings, some taken.
3. **Dune: Imperium** (Dire Wolf digital). Every space reads left to right the same way: the badge you need, then the cost, then the effect. When you hold a card, only the spaces it can reach light up.
   Source: https://store.steampowered.com/app/1689500/. Crop: the faction column and two city spaces with an agent on one.
4. **Wingspan** (Monster Couch digital). Each habitat row prints a bigger reward in every column. The action cube sits on the first empty slot, so how much you'd get is plain from where the cube rests.
   Source: https://store.steampowered.com/app/1054490/. Crop: one habitat row with the cube on it.
5. **Stone Age** (board game). The painting is the action: put people in the forest and you get wood. The huts in the village show exactly how many people fit.
   Source: https://boardgamegeek.com/boardgame/34635/stone-age/images. Crop: the forest and the village huts.
6. **Viticulture** (board game). An empty spot is a printed silhouette of a worker, so open and taken read at a glance. The first spot on each action carries a small bonus, which makes picking early count.
   Source: https://boardgamegeek.com/boardgame/183394/viticulture-essential-edition/images. Crop: two summer actions.
7. **Agricola** (Playdek digital). Some action cards gather goods each round, so you see the pile grow on the card. A new action card is revealed each round, so the board grows in front of you.
   Source: https://store.steampowered.com/app/1005580/. Crop: three cards, one with a big pile.
8. **Everdell** (Dire Wolf digital). Each location is a little woodland spot with its resources drawn on it. Critters stand in for workers. The spot's marker, not any text, says whether one worker or many can go there.
   Source: https://store.steampowered.com/app/1722840/. Crop: the basic locations with a critter on one.
9. **Lost Ruins of Arnak** (board game). The travel cost (boots, car, ship, plane) is printed on the site itself. Sites farther out stay empty until someone explores them and a new site is laid there.
   Source: https://boardgamegeek.com/boardgame/312484/lost-ruins-of-arnak/images. Crop: a level I and a level II site.
10. **Root** (Dire Wolf digital). Each clearing is a round place with its suit icon and empty square slots. A filled slot shows the building itself, and warriors crowd the clearing they hold.
    Source: https://store.steampowered.com/app/965580/. Crop: three clearings.
11. **Kingdom Two Crowns** (pixel art). When you walk up to something you can build, a row of empty coin outlines floats above it. You drop coins in until they're full, then it builds, with no words at all.
    Source: https://store.steampowered.com/app/701160/. Crop: a coin row above a build spot.
12. **Cultist Simulator** (digital). Each action is one square token with one big icon. Dropping a card on it opens empty slots that say what fits, and a ring of time runs around it while the card sits inside.
    Source: https://store.steampowered.com/app/718670/. Crop: two verb tokens, one running.

These were looked at and left off:
- Spirit Island (https://store.steampowered.com/app/1236720/): lifting a piece off its track reveals a bigger number, a nice idea but already covered by 4.
- Caverna and Raiders of the North Sea: their space look is the same as 7 and 3.
- Underwater Cities: its colour-matching cards don't map onto our wheel.
- Cascadia: it has no worker spaces.

## Three directions for the wheel

### 1. Landmarks (borrows 5, 8, 10, 11)
Each quadrant becomes a small painted pixel place, and each action is one landmark in it: a well, a door, a stall, a shrine. Each landmark is a bold 24 to 32px silhouette with a flat standing pad in front.
- An open action is an empty pad with a soft lamp glow. A taken one has the minion standing on the pad, so who's where reads from across the room.
- What you get floats above the landmark as the game's own pieces in outline, the way Kingdom shows a price as empty coin rings. When you take it, the outlines fill and hop to your stacks.
- Names leave the board for the hover.
- Rings that aren't open yet sit in shadow, because the lamp hasn't reached them.
- The risk is size: 24 landmarks on a 400px wheel is tight. The wheel has to grow, or the landmarks have to be silhouettes rather than scenes. The Vignettes mock was cramped for the same reason.

### 2. Printed plates (borrows 2, 3, 4, 6)
Every action is a plate that reads the same way, left to right: a minion-shaped socket (Viticulture's printed silhouette), then any cost, an arrow, and what you get, drawn as countable pieces (Waterdeep's cubes).
- An action's ring II plate is visibly bigger than its ring I plate, the way Wingspan's rows pay more as they go, so you can see that yields climb.
- On your turn, only the plates you can use light up and the rest dim, as on Dune's digital board.
- A minion fills its socket exactly.
- It's the most legible and the least romantic: a well-printed eurogame board. It's also the closest to the Spoils mock, so it only beats that mock on rigour and size.

### 3. The mechanism (borrows 1, 7, 9, 12)
The wheel is a device, a brass-and-walnut dial. Each action is a cup cut into its ring, with one large glyph stamped beside it (Cultist Simulator's one-icon tokens). A minion drops into the cup, the way Tzolk'in's workers sit in the gear.
- A ring opening is a physical event: shutters slide back and new cups appear, like Agricola's new card each round or a new site in Arnak.
- Taken reads as a filled cup, open as an empty lit one.
- It makes the wheel the toy. But it's the nearest to the Engraved look Cory turned down, so it only works if the glyphs are big and the motion is good.

## Pick: 1, Landmarks
It's the only one where "the minion sits on the action" is the natural picture rather than a token on a button. It's also what our pixel art does best, and it answers "more visual" head on.

One rule comes along from 2: what you get is always drawn as the pieces themselves, never as words. Before drawing all 24, calibrate with Cory on one quadrant: three landmarks, plus its ring II and ring III spaces.
