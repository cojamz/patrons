# Intro 2 storyboard (Cory's script, 2026-10-14)

Four beats, about 27 s, ONE continuous shot: one pixel world under one camera that glides from framing to framing.
No cuts: all four beats are mounted at once on one clock; each beat's things show during its own beat and the next
beat picks up exactly where it left off; only the caption changes, dissolving group by group. Bar (Cory): thoughtful,
clear, simple, elegant. Code: `src/v4/Intro.jsx` (shell) + `src/v4/intro/shared.jsx` (kit) + `src/v4/intro/Beat1–4.jsx`.
Look at a beat alone: `/?lab=intro&beat=N` (loops), frozen at a moment: `&at=MS`.

## Restraint rules (they beat every detail below)
1. One thing moves at a time. Hand-offs may overlap by ≤150 ms. The eye is led to exactly one place.
2. The lamp follows that one thing (camera shots carry a lamp point). Generous dark space around the light.
3. Slow, eased motion; after each action a 300–600 ms pause so the line lands.
4. Nothing moves that the line isn't about. No loops except the minions' 1 px bob in beat 2 (it stops when they fly).
   No particles for their own sake, no sparkles, no shake.
5. What's done dims (the wheel to .22 once its work is done; rivals to .5 when they aren't the subject).
6. No cuts (Cory): what carries over (leader, minions, glow, crowd, pile) sits at the same world spot, in the same
   pose and opacity, at a beat's end and the next beat's start. Anything a beat is done with fades out INSIDE that
   beat (beat 3 clears the wheel, its minions and the violet pool in its last second). Checked frame by frame at
   each hand-off (±300 ms) on the frozen build.
7. Pixel art only at whole scales: world units are art pixels; zooms are 2, 4/3, 1, 2/3 only.
8. Every beat's line is on screen ≥ 3.5 s. Skip always visible; Esc/tap skip after beat 1; arrows step.
9. The still storyboard (reduced motion) is each beat's rest (its last frame), or a chosen `stillT` / `stillAs`.

## The shared coordinate system (world units = art pixels; origin = YOUR leader's centre)
- Stage: 176 × 100 units. Camera `[cx, cy, z]` puts world (cx, cy) at the stage centre:
  stage = (88 + z(wx − cx), 50 + z(wy − cy)). Lamp: a warm pool (w × h stage units) on a world point.
- Your leader: 32×32 at top-left `LEAD` (−16, −16); after beat 3 it has risen to `LEAD_UP` (−16, −18).
- Minions (16×16) wait around it, centres `RING`: (−27, 2), (0, −27), (27, 2) (as CultSeat's LeaderRing).
- Members (24×24 busts) stand in rows of three under the leader: `MSLOT(i)` top-left, centre first, then left,
  right: x −12, −30, 6; y 12 + 12·row. Followers (10×10 marks) stand in rows of six in front, centre-out:
  `FSLOT(j, memberRows)`: x −10, 0, −20, 10, −30, 20; top y 14 (no members), 34 (one row), 46 (two rows), +10 per row.
- Resource pile beside the leader (left): `PILE(i)` centres (−24, 8), (−34, 8), (−44, 8), (−24, −2), (−34, −2), (−44, −2); 9-unit glyphs.
- Wheel (beat 3): centre (−90, 10), r 40. Quadrants: blue top (270°), green right (0°), gold bottom (90°), red left
  (180°); round-I spaces at ±27.5°, `space(q, k)` centres at 0.748 r; a minion ON a space: `onSpace()` top-left.
- Beat 3: member card top-left `CARD` (30, −24), 26×36; initiation ring floor centre `INIT_RING` (44, 33); follower
  swirl `SWIRL` (−34, −16).
- Beat 4: four cults side by side, origins x `COLS`: A −62, you 0, B 62, C 124 (each crowd within ±30).

## Camera per beat (`shots` exported by each beat file)
| beat | t (ms) | cam [cx, cy, z] | ease ms | lamp [wx, wy, w, h] |
|---|---|---|---|---|
| 1 | 0 | [0, 2, 2] | 900 | [0, −2, 190, 140] |
| 2 | 0 | [0, −4, 4/3] | 1200 | [0, −2, 210, 150] |
| 3 | 0 | CAM.wheelAndCult [−44, 10, 1] (wheel left, cult right) | 1500 | [−46, 10, 240, 160] |
| 3 | 4600 | CAM.cult [4, 11, 4/3] | 1100 | [6, 6, 200, 150] |
| 4 | 0 | [33, 13, 2/3] (four cults) | 1300 | [33, 14, 260, 150] |
Camera ease: cubic-bezier(.45, .05, .25, 1), on the intro's clock (Web Animations, sub-pixel). Beat starts on the one
timeline: 0, 3.8, 9.0, 20.3 s; Begin at 26.8 s. Beat 3's storyboard still uses CAM.wheelAndCult.

## The beats (times in ms from the beat's start)
**1 · "You are a cult leader."** (3.8 s) — The lamp comes up; the leader rises into it (250–1250, out). Hands come
together (1250 steeple), eyes narrow (1550 scheme), the hands rub (1900–2560, 110 ms frames), a silent laugh: eyes shut,
mouth open, shoulders drop a pixel and back (2650–3560, 130 ms frames), then the sly look holds. Still: `scheme`.

**2 · "You and your minions have learned to tap into mysterious powers to gain influence and followers."** (5.2 s) —
The camera pulls back. Three minions pop out from behind the leader to their RING spots, one by one (300 / 480 / 660,
450 ms, back ease) and start a 1 px bob (each its own period). The arcane glow rises around them (1300: a violet floor
ellipse fades in, a soft violet column rises behind, 1200 ms). Three followers walk in from the dark edges to
FSLOT(0–2, 0) (2300 / 2550 / 2800, 1400 ms, little hops). Hold.
End state: leader idle at LEAD, minions at RING, 3 followers, the arcane floor glow.

**3 · "Take actions granted by the mysterious powers to add to your resources, recruit new members, and become more
powerful."** (11.3 s; Cory found the first cut unclear, so the actions are told twice, slowly) — Actions: the wheel
rises in at the left as the camera frames wheel and cult. ONE minion floats onto ONE space (Kickback, gold, 400 ms),
the space lights and says what it gives, big: "+3 [gold]"; exactly those three glyphs lift off one after another
into the cult's pile, which counts up. A second minion does it again, faster, on a green space (Hum, 3000 ms).
Recruit (4600): the wheel dims, the camera moves to the cult, and the initiation plays (Initiation.jsx, from 4700:
card rises and flips, two gold pay, beckon, step into the ring of arcane light, bow, the cult's mark blooms, walk to
MSLOT(0) as the followers step back a row, "+1"). Followers (8500): the four other glyphs rise into the glow at SWIRL,
circle once and dissolve; three followers appear and hop into the crowd; "+3". Power (10150): a warm aura blooms and
the leader rises two units to LEAD_UP. Clear (10350): the wheel, its minions, the violet pool and the floor shadow
fade out, so beat 4 opens on the cult alone.
End state: the leader at LEAD_UP with its aura, member 0, 6 followers; nothing else.

**4 · "After three rounds, the cult with the most followers (including members!) wins!"** (6.5 s, then Begin) —
The camera pulls back to all four cults; the rivals fade in at .5 holding their round-I crowds. Round marks I II III
along the top (world y ≈ −58): I lit at 200; II at 1300: two members drop into your MSLOT(1, 2) through quick
arcane rings (400 ms), two followers pop in, rivals' new ones fade in; III at 2400: three members into row two, the
followers step back to row 46, two more followers. Tally at 3700 (rivals to full at 3450): a race, every figure counted
in turn (65 ms each) and each cult's number counting up above its leader; yours counts last (17). Crown drops onto your
leader (4950, lands at 5370); rivals dim (5050); your leader laughs again (to 6330). Begin.

## Look
- Walnut table, one warm lamp (255,206,140); cream text #f3e6c8; Alegreya for the line and numbers, Alegreya Sans for UI.
- Arcane ("mysterious powers"): violet rgb(170,140,255), soft and low (≤ .45 alpha), never a hard line.
- The real art: Leader (one warm-gray robe for every leader, emoji medallion), Minion (the emoji), Sprite (members in
  their own sphere colors), Follower mark, ResourceGlyph. Leader poses: steeple, scheme, rubA/B, laughA/B, beckonA/B.
- Easing: moves `io` (cubic in-out), arrivals `out`, departures `in`, drifts and glows `sine`, pops `back`
  (small overshoot). Hops: arcs 8–16 units, 450–700 ms. Pixel frames step, 110–130 ms.
- Type in the world (numbers, "+1"): Alegreya 700, cream, sized in world units (6–12).
