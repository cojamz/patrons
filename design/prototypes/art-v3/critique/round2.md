# Critic, round 2: Launderers 4.5, Kingpin 7, Night Owl 5.5, HR 5, Doorman 6, Pilgrim 6. Not ready for 120; one more round.
Per portrait:
- Launderers: steam puffs read as clouds/bones; open toothy grin = banned tooth notch (closed/small smile); back head is a
  pasted block (build it, drop 2px); linen in 2-3 folded layers; ~20 colors.
- Kingpin: tie with a crossbar reads as a crucifix (knot + taper); wrinkles as dark lines read dirty (shadow planes);
  smoke as 2 soft clusters; C-shaped ear.
- Night Owl: companion must drop 3px and go a value darker (bodies merge at 24-30,32-47); freckles read as rash (2 px or
  none); hair as 3-4 big tufts with a lit edge; front face needs planes.
- HR: 33 colors; glasses = goggle bar (two lenses, bridge, highlight); nose column noise; right figure darkest, deepest
  in shadow and sourest (sensitivity).
- Doorman: arm is an unjointed sausage (elbow, cuff, shaped glove); squint+brow reads as smug wink (one expression).
- Pilgrim: shell reads as a molar (7x7 ribbed fan, own ramp); cloak pillow-shaded (one diagonal fold, dark under the
  right arm); yellow brim hat + cloak reads as a sou'wester fisherman (narrow brim or hood; gourd on the staff).
SENSITIVITY (main finding): the darkest-skinned people are all in service roles or at the back: Launderers = dark-skinned
woman in a red head-wrap grinning over a laundry basket (washerwoman/"mammy" image); Doorman = older Black man in a
bellhop uniform saluting (Pullman-porter image); HR's very dark woman at the back, in shadow, scowling. Boss, holy man
and HR front are light/medium. Fix by role-tone mapping across the set, not by whitening service roles.
Set-wide: (1) color budget enforced in build.py, fail over 22; (2) face recipe on every front-facing head (brow shadow
row, side-of-nose shadow, cheek plane, chin shadow on the neck), one in three a true 3/4; (3) multi-person depth: back
person 3px lower, one value darker, sel-out edge against the front; (4) allowed-expressions list per card: no toothy
grin, no half-lid smirk, no mixed wink; (5) props as clusters of 3+ px that read at 1x.
Lock now: 48 canvas, top-left light, no doorway, sel-out; palette.py ramps and skin list; single-person head standard
(Kingpin, Doorman); count rule; a tone-to-role audit sheet (role, tone, front/back, expression) checked every batch.
