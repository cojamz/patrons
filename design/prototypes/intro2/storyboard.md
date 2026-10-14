# Intro 2 storyboard (Cory's script, 2026-10-14)

Four beats, about 24 s, one pixel world under one camera that pulls back beat by beat. Bar (Cory): thoughtful, clear,
simple, elegant. Code: `src/v4/Intro.jsx` (shell) + `src/v4/intro/shared.jsx` (kit) + `src/v4/intro/Beat1–4.jsx`.
Look at a beat alone: `/?lab=intro&beat=N` (loops), frozen at a moment: `&at=MS`.

## Restraint rules (they beat every detail below)
1. One thing moves at a time. Hand-offs may overlap by ≤150 ms. The eye is led to exactly one place.
2. The lamp follows that one thing (camera shots carry a lamp point). Generous dark space around the light.
3. Slow, eased motion; after each action a 300–600 ms pause so the line lands.
4. Nothing moves that the line isn't about. No loops except the minions' 1 px bob in beat 2 (it stops when they fly).
   No particles for their own sake, no sparkles, no shake.
5. What's done dims (the wheel to .22 once its work is done; rivals to .5 when they aren't the subject).
6. No layout jump between beats: what carries over (leader, minions, crowd) sits at the same world spot at a beat's
   end and the next beat's start. The shell crossfades scenes (380 ms); identical things don't flicker.
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
| 3 | 0 | [−44, 10, 1] (wheel left, cult right) | 1100 | [−46, 10, 240, 160] |
| 3 | 3000 | [4, 11, 4/3] (the cult) | 1000 | [6, 6, 200, 150] |
| 4 | 0 | [31, 13, 2/3] (four cults) | 1300 | [31, 14, 260, 150] |
Camera ease: cubic-bezier(.45, .05, .25, 1). Beat 3's storyboard still uses the first shot.

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
powerful."** (9.3 s) — Actions: the wheel rises in at the left (0–700). Minions hop to spaces, one at a time (900 /
1150 / 1400, 650 ms, arcs 10–16): left → green (0), top → blue (+1), right → gold (−1). Each landing: the space
glows softly and pays 2 glyphs that hop to the pile (600 ms, 110 ms apart): green, blue, gold. Recruit: at 3000 the
wheel dims to .22 and the camera moves to the cult. The member card (back: the cult mark) rises at CARD (3100) and
flips (3500, 360 ms) to gold.prospector; the two gold glyphs arc from the pile into it (3700). The leader beckons
(4300–4800, beckonA/B). The member steps off the card into a small ring of arcane light at INIT_RING (4550, 520 ms);
bows to the leader (5100, bow1 → bow2 → bow1); the cult's mark (your emoji, small) blooms above its head (5450, back
ease, violet glow); it walks to MSLOT(0) as the followers step back to row 34 (5900, 500 ms) and "+1 [follower]"
rises by it (6400). Buy followers: the four other glyphs rise from the pile into the arcane glow at SWIRL, circle once
and dissolve (6650–7550); three follower marks appear there and hop to FSLOT(3–5, 1) (7500–7950); "+3 [follower]"
(8000). Power: the leader's warm aura brightens and it rises 2 units to LEAD_UP (8100–8700).
End state: minions on the three spaces, the leader at LEAD_UP with its aura, member 0, 6 followers, empty pile.

**4 · "After three rounds, the cult with the most followers (including members!) wins!"** (open; Begin at 6.3 s) —
The camera pulls back to all four cults; the rivals fade in at .5 holding their round-I crowds. Round marks I II III
along the top (world y ≈ −58): I lit at 200; II at 1300: two members drop into your MSLOT(1, 2) through quick
arcane rings (400 ms), two followers pop in, rivals' new ones fade in; III at 2400: three members into row two, the
followers step back to row 46, two more followers. Tally at 3600: rivals to full; every figure blinks as it's counted
(leader, members, followers; 55 ms each) and each cult's number counts up above its leader; yours counts last (17).
Crown drops onto your leader (4700, lands with a squash); rivals dim; your leader laughs again (5000–6100). Begin.

## Look
- Walnut table, one warm lamp (255,206,140); cream text #f3e6c8; Alegreya for the line and numbers, Alegreya Sans for UI.
- Arcane ("mysterious powers"): violet rgb(170,140,255), soft and low (≤ .45 alpha), never a hard line.
- The real art: Leader (one warm-gray robe for every leader, emoji medallion), Minion (the emoji), Sprite (members in
  their own sphere colors), Follower mark, ResourceGlyph. Leader poses: steeple, scheme, rubA/B, laughA/B, beckonA/B.
- Easing: moves `io` (cubic in-out), arrivals `out`, departures `in`, drifts and glows `sine`, pops `back`
  (small overshoot). Hops: arcs 8–16 units, 450–700 ms. Pixel frames step, 110–130 ms.
- Type in the world (numbers, "+1"): Alegreya 700, cream, sized in world units (6–12).
