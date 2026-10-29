import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *
import math
# Con Men (colorless, counts as 2): On Recruit, steal 5 resources. A pair of grinning card sharps, side by side as
# equals. Left: the lead crook in a bowler with a solid moustache, fanning three cards (find the lady). Right, the
# same size beside him: his partner in a red flat cap and a dark scarf, grinning along, eyes on the mark. Template: 2 people, but
# by the critic's call (round 1) the partner stands level beside him, not behind; tones per lessons (the lead-crook
# costume on the light tone, the darker man a friendly equal).
c = Canvas()
# ---- partner (person 1), right, level with him
bodyB = torso(c, [(22, 48), (23, 40), (27, 36), (33, 34.6), (41, 34.6), (45, 36.4), (47, 39), (47, 48)], 36, 40,
              rx=(12, 15), ry=(9, 12), lite=None)
c.fill(bodyB & c.rect(22, 34, 47, 47), '2', only='3'); c.rim(bodyB, '3', 0, -1, 1, only='2')
scarf = c.poly([(31, 34), (36, 36.4), (42, 34), (43, 36), (36, 38.6), (30, 36)])
c.fill(scarf, 'n'); c.rim(scarf, 'o', 0, -1, 1); c.edge(scarf, 'm')
c.fill(c.rect(32, 28, 39, 34), 'I'); c.fill(c.rect(32, 31, 33, 34), 'J')
blk(c, 28, 14, '''
|..KKKKKKKKKKKK..
|.KLLLLKKKKKKKJJ.
|.IIIIKKKKIIIKJJ.
|.KJJJKKKKJJJKJJI
|.KyzzKKKKyzzKJJI
|.KKKKKLKKKKKKJJI
|.LLLLKLJKKKKKJJ.
|.LLKKLLIKKKKJJJ.
|.KKKKKKKKKKKKJJ.
|.JKKKKKKKKKJKJ..
|.KJIIIIIIIJKJJ..
|..KKKLLLLKKJJ...
|...JKKKKKKKJ....
|....IJJJJJJI....
''')
c.put(43, 17, ['K', 'J', 'J', 'I'])                                                  # ear
cap = c.poly([(29, 15.4), (29.4, 12.2), (32, 10.2), (37, 9.6), (42, 10.2), (44.8, 12.4), (45, 16), (43.6, 17)])
c.fill(cap, 'w'); c.outside(cap, 'v', 35.5, 11.6, 8.5, 3); c.rim(cap, 'x', -1, -1, 1, only='w'); c.put(36, 9, ['vv'])
peak = c.poly([(24.4, 16.2), (27, 14), (35, 13.8), (36.6, 15.2), (35, 16.8), (26.6, 17)])
c.fill(peak, 'v'); c.fill(peak & c.rect(0, 14, 47, 14), 'w'); c.fill(peak & c.rect(0, 16, 47, 17), 'u'); c.edge(cap | peak, 'u')
# ---- lead crook (person 0), left
body = torso(c, [(0, 48), (0, 40), (3, 37), (9, 35), (24, 35), (30, 37), (33, 41), (34, 48)], 14, 40, rx=(17, 21), ry=(10, 13))
shirt = c.poly([(12.5, 35), (20.5, 35), (16.5, 45)])
c.fill(shirt, 'k'); c.fill(shirt & c.rect(17, 34, 22, 47), 'i')
lapL = c.poly([(7, 35.6), (12.6, 35), (16.6, 45.5), (13.6, 46), (8.6, 39.4)])
lapR = c.poly([(20.4, 35), (26, 35.6), (24.6, 39.4), (19.4, 46), (16.4, 45.5)])
c.fill(lapL, '4'); c.edge(lapL, '1'); c.fill(lapR, '2'); c.edge(lapR, '1')
c.put(15, 36, ['ww', 'wv', '.w', '.v'])                                             # red bow at the throat, angled
c.fill(c.rect(13, 29, 20, 34), 'A'); c.fill(c.rect(13, 32, 14, 34), 'B')
c.edge(body, '1')
# face: 3/4 to our right, grinning under a solid moustache. ruler x 8..25
blk(c, 8, 16, '''
|.ECCCCCCCCCCCCCBA.
|.ECEEEEDCCEEEBBBA.
|.CCDCCCCCCCCBBBBA.
|.CCCyzzBDCyzzBBBA.
|.CCCCCCBDCCCBBBBA.
|.CCDDDCCDBCCCBBBA.
|.CCDDDCCCDBCCBBBA.
|..CCDCCCDDABCBBBA.
|..BCCEEEEEECBCBA..
|..BCBAAAAAABBBBA..
|...BCCCDDCCCBBA...
|....BBCCCCCBBA....
|.....ABBBBBBA.....
''')
c.put(8, 20, ['C', 'D', 'C'])
dome = c.poly([(10, 13.5), (10.4, 9), (13, 6), (17, 5), (21, 5.6), (24, 8), (25, 13.5)])
c.fill(dome, 'n'); c.outside(dome, 'm', 16, 8, 8, 5); c.rim(dome, 'o', -1, -1, 1, only='n')
c.fill(dome & c.rect(0, 12, 47, 13), 'm')
brim = c.poly([(6.4, 14), (8, 13), (27, 13), (28.6, 14), (27, 15.6), (8, 15.6)])
c.fill(brim, 'n'); c.fill(brim & c.rect(0, 13, 47, 13), 'o'); c.fill(brim & c.rect(0, 15, 47, 15), 'm')
# ---- three cards fanned in his hand: find the lady
px, py = 19, 46
for i, ang in enumerate((-26, 0, 26)):
    a = math.radians(ang); ux, uy = math.sin(a), -math.cos(a); vx, vy = math.cos(a), math.sin(a)
    pts = [(px + ux * 4 + vx * s * 3.2, py + uy * 4 + vy * s * 3.2) for s in (-1, 1)] + \
          [(px + ux * 13 + vx * s * 3.2, py + uy * 13 + vy * s * 3.2) for s in (1, -1)]
    card = c.poly(pts); c.fill(card, 'k'); c.rim(card, 'j', 1, 1, 1); c.edge(card, 'i')
    mx, my = px + ux * 10, py + uy * 10
    if i == 1: c.fill(c.ellipse(mx, my, 1.3, 1.5) & card, 'w')
    else: c.fill(c.line(round(mx - .5), round(my - 1.5), round(mx - .5), round(my - .5)) & card, 'z')
fist(c, 16, 41, cuff='4')
PORTRAIT = portrait('benders.conmen', 'Con Men', c, [{'skin': 'porcelain', 'hair': 'darkbrown'}, {'skin': 'brown', 'hair': 'black'}], 'red')
