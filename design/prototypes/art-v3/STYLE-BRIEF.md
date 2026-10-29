# Member portraits v3: style reset (Cory, 2026-10-29 12:29am: "these pixel arts still look pretty bad")

The 32x32 set (../art-v2/portraits, rendered by src/v4/art/portrait.js) read as clip-art emoji: every face the same
frontal template with 2x2 black-square eyes and a wide toothy grin, flat single-tone skin, props crammed in as pixel
noise, random hair colors from an id hash (grey hair on a kid), multi-person cards with tiny squeezed faces, a soft glow
behind each. Nobody would call it good pixel art. Start over on the look; keep only the idea (a member's head and
shoulders in their color, in a doorway-shaped frame).

## What good pixel portraits do (follow all of it)
- Canvas 48x48 (shown at 48/96px). More room for a real face; still whole pixels.
- Value first: a clear light, mid, shadow structure readable in grayscale. Light from the top-left. Big simple shapes.
- Hue-shifted ramps: shadows shift toward cool/purple, lights toward warm/yellow, not just darker/lighter of one hue.
  4-5 steps per material, no more. Few colors overall per portrait (aim ~16-20).
- Clusters, not noise: no single orphan pixels except deliberate glints; no checker dithering; no "pillow shading".
- Clean lines: pixel-perfect curves (stair steps 1-2-3, no jaggies/doubles), selective outline (sel-out: outline takes
  the darker tone of the shape it bounds, lighter on the lit side), an outer silhouette that reads.
- Faces with character: vary head shape, 3/4 views, eyes that are not 2x2 black squares (a lid line, an iris, a
  highlight), expression carried by brows and mouth shape, not by a giant tooth bar. Vary age, build, hair shapes.
- Restraint: one story prop at most, integrated (hat, collar, tool), large enough to read at 48px. Remove anything that
  doesn't read.
- Consistent family: same framing, head size, frame, lighting and palette logic across all 120 members.
- Multi-person cards (worth 2+ show that many people): fewer, bigger heads overlapping in depth (front person largest,
  others behind and slightly smaller), each with a readable face. Five = a tight crowd with three clear faces in front.

## Color system (you may redesign it; the game must be able to recolor by sphere)
- The member's sphere color must dominate the clothes so a seat reads by color at a glance; spheres: gold #e2962c,
  red #e0645a, magenta #d4508f, green #5fb37c, silver #a3b3c2, white #eef3f8, purple #9a62e6, yellow #d3dd48,
  blue #6aa6dc, colorless #8d9693. Derive a hue-shifted 5-step ramp from the base in code.
- Skin: a hue-shifted 4-step ramp per skin tone; keep the diversity of tones. The artist may pin a tone per portrait.
- Hair: the artist picks the hair ramp per portrait (from a set of named hue-shifted ramps), no more random hair.
- Background: decide (doorway, plain dark frame, a subtle sphere-tinted panel). No glow aura.
Write the system as code in this folder (palette.py) so it can be ported to src/v4/art/portrait.js exactly.
