# Style F: diorama, closer (the member portrait style)

Cory picked this on Oct 29: "middle zoom is good, but the art looks rough still". These rules come from a pro pixel critique of the rough version. Every member redraw follows them. The code that enforces most of them is `kit.py`, and `art.py` holds the four reference scenes: Kingpin, Mob, Tiebreaker and Launderers.

## Frame
- The grid is 64x64 on the card colour #e9dcc4, with at most 24 colours.
- People stand about 36-40px tall from head to feet, or to the knees behind a desk, and fill about half the frame.
- A clear room or place surrounds them, with only a little floor and sky.
- Check every pass at 96px and at 32px.

## 1. Outlines
- Each person gets one ink outline (#2a1e26) around the whole silhouette, together with the props they hold. Don't outline each pasted piece separately: build the figure on its own layer, then call `outline_once`.
- Inside a figure, a separation (an arm over the torso, a head over the collar, a hand over a prop) uses the local dark tone of what's underneath, never ink. `over(layer, piece, darkmap)` does this.
- Never outline anything thinner than 2px: poles, tines, pegs, cigars, flag poles, clothes lines. Give it a light column and a dark column instead. Lay thin held props in after the outline with `under()`, so the hand covers them.
- Shoes get their own dark brown or grey, never ink.
- No 2-3px ink seams where pieces touch.

## 2. Shapes are drawn by hand, not boxed
- Heads are round, with 3-2-1-1 corner steps top and bottom (`HEADS` templates).
- Shoulders slope 1-2px down from the neck (`torso`).
- A raised or reaching arm always has an elbow, so it's two segments (`thick` with three points). A reaching arm drops its elbow below the hand.
- Hands are about 3x3, with a thumb notch and a knuckle row (`HANDS`: grip, fist, flat, thumb).
  - A held pole passes between the thumb and the fingers.
  - A raised hand either holds something or is a clear clenched fist.
- No clone bodies: vary shoulder width, height, stance and arm angle from person to person.

## 3. Colour and shading
- Each material gets two tones. Put the shadow as a shaped cluster where the form turns:
  - under a hat brim;
  - chin onto the neck;
  - under the arms, as a wedge rather than a strip;
  - the jaw on the far side (in the head template).
- No 1px shade strips running the full length of a shape.
- No lit bars: no forehead bars, no cheek pixels, nothing that reads as a hairband or a bruise. This holds on deep skin too: a deep face reads by its outline, its hair and its eye glints, never a stepped lit plane (the old 48px lesson is retired here).
- No alternating-row banding on cash, bills or heaps. A bill is flat green with one dark centre mark. A bundle has a single paper band.

## 4. Faces: one hand-made template per head size (14 and 16 wide)
- From top to bottom: hair, brow, a 1px skin gap, then 2x2 eyes with one glint pixel. Next comes a 1-2px nose in the shade tone, then the mouth, then 2 chin rows.
- Ears are 2px, one of them a shade pixel.
- Mouths:
  - Closed mouths are ink: smile, grin, flat, smirk, frown.
  - An open mouth is dark warm red, wider at the top, never a solid ink block.
  - At most one big open mouth per scene.
  - Deep and very deep faces stay closed.
- Brows are angry, stern, soft or none. Soft brows use the hair colour.
- Hair is drawn on its own layer and pasted over the head.
  - A rounded crown sits one row proud of the head.
  - Hairlines are natural and uneven.
  - An afro is lighter than ink, with 3-4 curl bumps on the rim.
  - A bun is a small 4x4 placed to one side.
  - No thin bands on heads.

## 5. Background: quiet, so the people pop
- Use two close values (about 8-10% luminance apart) at half the detail density of the people.
- Ink outlines go only on people and on the props they hold. Background props (a safe, desk, washer, goal or shirt on the line) get a dark edge in their own colour (`edged`).
- Use flat or sparse fills. No dense wallpaper stripes, tile grids, checker floors or diagonal net lattices.
- Light sources (a lamp, a window, a torch) are small and are the only bright spots behind the people.

## Carried over from ROUND3.md and the earlier lessons
- Use a wide range of skin tones, and nothing insensitive.
  - No tooth pixels.
  - No open lips on deep faces.
  - No light band under a dark nose.
  - No bulging eye-whites on deep skin.
  - No crosses or plus shapes.
- On a crowd card with a loaded name, the lead face is light or mid. The darkest face is never the angriest.
- Every pixel cluster is a thing you could name.

## Process
- Draw, then build and render: `OUT=round3-f python3 build.py round3 f && OUT=round3-f python3 render.py round3`.
- Look at the 8x zoom and at the 32px size, fix whatever reads wrong, and repeat. Do three passes at minimum.
- Visual work goes past the picky design critic before Cory sees it.
