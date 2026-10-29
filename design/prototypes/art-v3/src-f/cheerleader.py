import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *
# Cheerleader (colorless): +1 follower whenever you win a contest. Mid-cheer, eyes squeezed shut with delight and
# a small open-mouthed whoop (no teeth), black hair in a high ponytail with a red bow, one red pom-pom thrown up to
# the light. Sleeveless uniform with a red chevron and V trim. Frontal. Template: 1 person.
c = Canvas()
# ---- body: sleeveless shell top
body = torso(c, [(4, 48), (5, 41), (9, 36.5), (17, 34), (30, 34), (38, 36.5), (42, 41), (43, 48)], 19, 40)
vee = c.poly([(19.5, 34), (28.5, 34), (24, 39.5)])
c.fill(vee, 'A'); c.fill(vee & c.rect(19, 34, 22, 36), 'B')
c.fill(c.poly([(18.6, 34), (19.8, 34), (24, 39), (28.2, 34), (29.4, 34), (24, 40.8)]), 'v')    # V trim
chev = c.poly([(7, 42), (24, 46.2), (41, 42), (41.5, 44), (24, 48.2), (6.5, 44)])
c.fill(chev & body, 'v'); c.fill(chev & body & c.rect(0, 0, 23, 44), 'w')
# far arm hangs at her side (shadow side)
armR = c.poly([(38, 37), (42, 38.5), (44.5, 48), (40.5, 48)])
c.fill(armR, 'B'); c.rim(armR, 'C', -1, 0, 1); c.edge(armR, '1')
# ---- neck
c.fill(c.rect(20, 28, 27, 34), 'A'); c.fill(c.rect(20, 31, 21, 34), 'B')
# ---- hair, pulled back, and a high ponytail swinging to the right
hair = c.poly([(15.5, 19), (15, 12), (17.5, 8), (22.5, 6), (28, 6.4), (31.5, 8.6), (33, 13), (32.8, 19)])
c.fill(hair, 'F'); c.outside(hair, 'E', 22, 10, 10, 6.5); c.rim(hair, 'G', -1, -1, 1, only='F')
c.fill(c.line(19, 8, 23, 7), 'H')
tail = c.poly([(30, 7.5), (34, 4.5), (39, 4.8), (42, 8.5), (43, 14), (41.5, 21), (39.5, 18), (38.5, 12), (35.5, 8.5)])
c.fill(tail, 'F'); c.outside(tail, 'E', 37, 8, 5, 5); c.rim(tail, 'G', 0, -1, 1, only='F')
c.fill(c.line(36, 6, 40, 9) | c.line(40, 10, 41, 15), 'G')
c.edge(tail, 'E')
c.put(29, 4, ['.ww..ww', 'wxvwvwv', 'vvuuvvu', '.uu..u.'])                        # the bow
# ---- face. ruler x 14..33
blk(c, 14, 14, '''
|....BCCCCCCCCCCB....
|...BCDDDCCCCCCCCB...
|..BCDEECCCCCEECCBA..
|..CCEBBCCCCCBBECBA..
|..CCzzzCCCCCzzzCBBA.
|..CCz!yCCDCCz!yBBBA.
|..CDDDCCCDCCCCCCBBA.
|..CDDDCCCDBCCDDCBBA.
|..CCDCCCDDABCCCCBBA.
|..BCCCBCCCCCCBCCBBA.
|..BCCCCAzzzzACCCBBA.
|..BCCCCCAAAACCCCBA..
|...BCCCCDDCCCCCBA...
|....BCCCCCCCCBBA....
|.....ABBBBBBBBA.....
''')
c.put(15, 18, ['C', 'D', 'C', 'B']); c.put(33, 18, ['A', 'B', 'A'])               # ears
# ---- the raised arm and the pom-pom
arm = c.poly([(6, 37), (11, 35.5), (10.5, 29), (9, 23), (5.5, 23), (5.6, 30)])
c.fill(arm, 'C'); c.rim(arm, 'D', -1, 0, 1); c.rim(arm, 'B', 1, 0, 1); c.edge(arm, 'A')
import math
cx, cy = 8.0, 16.5
pom = c.ellipse(cx, cy, 6.2, 6.4)
c.shade(pom, 'uvw', cx, cy, 6.2, 6.4, [0.05, 0.6])
for i in range(28):                       # streamers radiating from the handle, tips past the ball's edge
    t = 2 * math.pi * i / 28; r = 8.2 if i % 2 else 7.0
    tip = (round(cx - .5 + r * math.cos(t)), round(cy - .5 + r * math.sin(t)))
    ln = c.line(round(cx - .5 + 2.5 * math.cos(t)), round(cy - .5 + 2.5 * math.sin(t)), *tip)
    lit = -math.cos(t) * 0.6 - math.sin(t) * 0.8
    k = ('x' if lit > 0.3 else 'w' if lit > -0.35 else 'v') if i % 2 else ('w' if lit > 0.3 else 'v' if lit > -0.35 else 'u')
    c.fill(ln, k); pom |= ln
c.edge(pom, 'u')
PORTRAIT = portrait('benders.cheerleader', 'Cheerleader', c, [{'skin': 'deep', 'hair': 'black'}], 'red')
