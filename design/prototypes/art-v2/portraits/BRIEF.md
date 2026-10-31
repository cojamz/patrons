# Portrait redraw brief (Cory approved the Launderer as the model, 2026-10-28)

You are a pixel artist redrawing the member portraits (and the color artifacts) for Cults, a board game for friends.
Cory's words: bigger portraits, more detail, "not a big object overlaid on them, just accessorize them in the portrait
naturally if it calls for it". His verdict on the Launderer below: "perfect". Match it.

## Look at the model first
- `portraits/reference.json`: the Launderer (member) and the Prospector (artifact), in the final key format.
- `portraits/example_launderer.py`: how the Launderer was drawn (layered with G.put from ../pix.py: put `import sys; sys.path.insert(0, "<abs path to design/prototypes/art-v2>")` first; the doorway and
  shoulders are generated, the head is hand-typed rows). Copy its approach. Its old keys T/B/U/X/Y/Z/Q/e were renamed
  in reference.json (T→W, B→U, U→V, X→x, Y→y, Z→z, Q→n, e→i): use the reference.json keys.
- Render it: `python3 kit.py sheet portraits/reference.json /tmp/<you>/ref.png` (run from design/prototypes/art-v2)
  and Read the PNG. Each cell shows the portrait on a shop card at 64px, and at 32px (seat size) in its color and in gray.

## Format
A JSON list: `{"id", "name", "kind": "member"|"artifact", "sphere", "px": [32 strings of 32 keys]}`. `.` is empty.
Keys (colors in kit.py; the game recolors by sphere and gives each member its own skin and hair from its id):
- Sphere color ramp `1` darkest, `2` shade, `3` base, `4` light. Clothes are mostly this, so the color reads at a glance.
- Doorway behind a member: `b` fill, `c` rim (sphere-tinted dark). `i` a pale tint of `b` (inside a bubble, a window).
- Skin `S` base, `s` shade, `t` deep shade (nose, mouth, under-chin), `a` cheek blush. Hair `H` dark, `h` base, `j` light.
  Don't pick skin or hair colors yourself; use these keys. For hair that must be a specific color (white-haired elder,
  bald, a dyed punk) use fixed keys: W/V cream-white, M/N grays, Y yellow, R red...
- Fixed: `K` near-black (eyes, ink), `w` white glint, `W` cream cloth, `V` cream shade, `L` `M` `N` metal light/mid/dark,
  `D` dark glass, `G` `g` gold light/dark, `R` `r` `q` red cloth base/shade/light, `U` `u` blue cloth, `E` `e` green
  cloth, `P` `p` purple cloth, `O` `o` wood/leather, `Y` yellow, `x` `y` `z` `n` the table's red/blue/green/gold dots.
- Never draw an outer outline: the renderer adds a 1px dark outline in each shape's own deep tone. Leave a 1px gap of `.`
  where two things should separate (e.g. a bubble off the doorway is fine on `b`, it's inside the doorway).

## Members: anatomy (keep it, so a seat of 12 reads as one family)
- The doorway: the same arch as the Launderer (dome over rows 1–15, full width 28 below), `c` rim, `b` fill.
- Head and shoulders filling the doorway: head about 16 wide (cols 8–23), top around row 3, chin around row 21;
  shoulders from row 22 to the bottom edge, wide to the doorway's sides. Light from the top-left: `4`/`S` on the left
  edges, `2`/`1`/`s`/`t` on the right and undersides.
- Face: 2×2 `K` eyes with a `w` glint (top-left) unless glasses or a mask cover them, a `t` nose shadow, a mouth that
  carries the personality (smile, smirk, frown, open, gold tooth), `a` cheeks when warm. Ears as one `s`/`t` column.
- Who they are comes from what they wear and how they look: headwear, hair, glasses, jewelry, collar, apron, badge,
  a tool tucked in a pocket or behind an ear, a pin. Small things around the head inside the doorway are fine when they
  explain the card (the Launderer's soap bubbles). Never a big object held up over the body.
- Read the name and the card text; draw the person the name says (a Cashier looks like a cashier, Twins are two people,
  a group card like Crew can be two or three heads squeezed in the doorway).
- Every member of a batch must look different from its neighbors: vary headwear, hair shape, expression, collar, build.

## Artifacts
An object, no doorway, filling about 60–75% of the 32×32 frame, silhouette readable at 32px, at least a third of its
filled cells in the sphere ramp `1234` (the Prospector's gold nuggets), lit from the top-left, glints with `w`.

## Your loop (iterate; the first pass is never good enough)
1. Draw each portrait (a small python script per portrait in `portraits/src/<batch>/` using ../pix.py's G, like the
   example, is easiest). Write your batch's JSON to `portraits/out-<batch>.json`.
2. `python3 kit.py check portraits/out-<batch>.json` must print ok.
3. `python3 kit.py sheet portraits/out-<batch>.json /tmp/<you>/sheet.png` and Read it. For each portrait ask: could a
   stranger name what this person is from the 32px picture? Does it look as finished as the Launderer? Is the face
   friendly and clear, the color obvious, the silhouette distinct from its neighbors?
4. Fix and re-render at least twice. Also Read a 4× close-up of anything you're unsure of (render with scale 4 via
   kit.render).

## Rules
- Write only inside `design/prototypes/art-v2/portraits/` (your out-<batch>.json and src/<batch>/). No git commands.
  Don't touch other batches' files. Scratch images go in /tmp/<your batch name>/.
- Final answer: one line per portrait (id: what you drew), then any you're unsure of and why.
