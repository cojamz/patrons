# Action spaces: three directions

Cory's notes: the actions should be "a little better/more visual", "slightly clearer", and renamed to say what they do in the cult's voice. Today each space is a cream medallion with a 24px icon (a coloured dot for plain gains), a tiny name and a tiny effect, so the wheel reads as a crowd of identical bubbles.

All three mocks use the same frozen moment on the real table: Gold, Red, Blue (the market) and Green (the echo choir), round I, your turn. P2's robot is on Restock, P3's frog on Golden Years, and P4's ghost on Chant (the newest move). Each one follows Cory's two later calls. A placed minion stands on the action itself. The rim rule carries its leaders' emojis inline: Gold has one leader (the frog), Green is a tie (the ghost and the cat), and Blue and Red show nothing. The Gold and Red names are the ungraded proposals from `design/eval/action-names-calibration.md`, and they are labelled as proposals. The frame is the real build's screenshot with the old wheel cut out and the corners set to this moment.

Shots: `shots/compare.png` (the three wheels, labelled 1 to 3), plus `shots/option-N-wheel.png` (the 1270×700 frame) and `shots/option-N-quadrant.png` (the Gold quadrant at 2×, a hover card, and steal, copy, discount, free recruit and per-member spaces in the same language). To re-shoot, run `node design/prototypes/actions/shoot.mjs` from the repo root.

## 1. The Spoils
Each space is a shallow tray holding what you'd take, drawn as the game's own pieces. Resource chips come in their resource shapes (three leaves for Hum, three coins for Kickback, one big numbered chip for 4 or more). Members are small cards, a rival is a dark hood, and price tags say "free", "−4" or "½". The marks "/" (per), "×2" and a copy glyph cover the rest. There are no words on the board: the name and full text live in the hover. A minion stands in the middle of its tray, and the pieces it took slide into one row at its feet. Spaces not open yet are dashed outlines with their pieces only sketched in. This is Lords of Waterdeep and Splendor: you count the reward, you don't read it.

**Cost in Wheel.jsx:** about a day. It needs a structured yield spec per action (66 across the 11 spheres, most of them straight from `shorts.js`) and about 10 small SVG glyphs in `Glyphs.jsx`. The tray CSS and the taken layout are small, and no new pixel art is needed.

**Risk:** the clever names drop off the board, and a few verbs can't be shown as objects without a word (Ransom, Overtime, Barter, Jubilee).

## 2. Vignettes
Each space is a little illustrated card laid on the wheel. It has a 16×16 pixel scene of the cult act, shown at 2×: the kickback envelope, rising coin stacks for Golden Years, the velvet rope for Turn Away, the open door, the singing bowl for Hum. The name sits on a ribbon across the card and the yield is a pip ribbon underneath. A minion steps into the picture: the scene fades behind it while the name and the yield stay readable. Cards not open yet lie flat and faded, with a wax seal showing the round they open. This is Everdell and Root charm, and the same card language as the shop's members.

**Cost:** the art is the long pole. 24 scenes are drawn here (`scenes.js`), and the 42 actions on the other spheres need theirs too. In code it's a tile component, the pip ribbon (option 1's glyphs, small) and new ring geometry: radii of 160, 112 and 58px, at ±30° and ±15°. The cards nearly touch at quadrant seams, and the inner-ring cards are cramped at 48px, so their art crops.

**Risk:** this is the busiest of the three at 1270×700, and the names are about 9.5px.

## 3. Engraved
There are no bubbles and no cards: each space is a cell of its ring, printed into the paper. The quadrant's ink washes the open cells, and a lamp glow edges the ones you can take. The picture is today's 24×24 icon as a one-ink stamp. The name is in small capitals, and the yield is inked beneath at 13.5px with the same pips as 1 and 2. Rings not open yet are hatched and their print is faint. A minion stands in its cell, on the stamp, with the name above it and the yield below. It's quiet and board-like, like Tzolk'in's gears or a letterpress map.

**Cost:** about half a day, and the lowest risk. The paper layer already has `arc()`, so it draws one sector per space with a wash, hatch or glow by state. The face becomes name, stamp (a palette remap of the existing icons, no new art) and a yield line. The ring radii change: the hub shrinks to 26px and ring I widens to 63px. Narrow side cells wrap their names, and long names step down a size. The hit targets stay as they are.

## Pick: 3, Engraved
It fixes the crowd of bubbles by removing the bubbles rather than restyling them. It keeps the new cult names readable on the board, prints every yield at 13px or more with the game's own pips, and needs no new art, so it fits Cory's "a little better, slightly clearer" and his "less maximalist" verdict, and it can ship in a day.
