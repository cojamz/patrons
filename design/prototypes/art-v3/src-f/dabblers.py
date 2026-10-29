import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *
# Dabblers (colorless, counts as 2): counts as 2 members of every color. Two hobbyists who try everything. In front
# (right): a painter in a tilted violet beret over dark curls, a pleased closed smile, holding up her white palette
# with a dab of every color. Behind (left, 3px lower, a value darker): her friend in a canvas bucket hat, curious and
# smiling. Template: 2 people, mirrored (front on the right).
c = Canvas()
# ---- behind (person 1), left
bodyB = c.poly([(0, 48), (0, 31), (3, 28), (9, 27.4), (18, 28), (23, 32), (25, 48)])
c.fill(bodyB, '2'); c.outside(bodyB, '1', 10, 33, 11, 7)
c.fill(c.rect(10, 21, 16, 28), 'I'); c.fill(c.rect(15, 21, 16, 28), 'J')
blk(c, 6, 11, '''
|..KKKKKKKKKKK..
|.KKKKKKKKKKKJN.
|.KKKKKKKKKKKJN.
|.KNNNKKKNNNKJN.
|.KJJJKKKJJJKJN.
|.KKzzKKKKzzKJJ.
|.KKyzKKKKyzKJJ.
|.KKKKKJKKKKKJJ.
|.KKKKJJKKKKKJ..
|..KKJIIIJKKJJ..
|...JKKKKKKJI...
|....IJJJJJI....
''')
c.put(5, 15, ['K', 'J', 'J'])                                                       # ear
hat = c.poly([(7.5, 11.5), (8, 7.4), (10, 5.6), (17, 5.4), (19.2, 7.4), (19.6, 11.5)])
c.fill(hat, 'k'); c.outside(hat, 'j', 12.5, 7, 6, 3.5)
brim = c.poly([(3.4, 14.4), (5.6, 10.8), (21.4, 10.8), (23.8, 14.4), (21, 14.6), (19, 13.4), (8, 13.4), (6, 14.6)])
c.fill(brim, 'j'); c.fill(brim & c.rect(0, 10, 47, 11), 'k'); c.fill(brim & c.rect(0, 13, 47, 14), 'i'); c.edge(hat, 'i')
c.fill(c.rect(8, 9, 19, 9) & hat, 'i')                                              # band
c.shift(c.mask_of('IJKL'), -1)
c.g = [['.'] * 48 for _ in range(3)] + c.g[:45]
# ---- in front (person 0), right
body = torso(c, [(14, 48), (15, 41), (19, 37), (26, 35), (36, 35), (42, 37), (46, 41), (47, 48)], 30, 40, rx=(15, 19), ry=(10, 13))
col = c.poly([(26, 34.6), (31, 37.6), (36, 34.6), (37.4, 36.4), (31, 39.4), (24.6, 36.4)])
c.fill(col, '3'); c.rim(col, '4', 0, -1, 1); c.fill(col & c.rect(32, 30, 47, 47), '2'); c.edge(col, '1')
c.fill(c.rect(27, 29, 34, 34), 'A'); c.fill(c.rect(27, 32, 28, 34), 'B')
hair = c.poly([(21.5, 22), (21, 16), (22.5, 11), (26, 8.6), (32, 8.4), (37, 10.4), (39.4, 15), (39.6, 21), (38, 24),
               (37, 18), (24, 17), (23.4, 23)])
c.fill(hair, 'F'); c.outside(hair, 'E', 29, 13, 10, 6.5)
for (x, y) in ((22, 14), (21.6, 19), (38.6, 17), (38.4, 21.5)): c.fill(c.ellipse(x, y, 1.6, 1.6), 'F')      # curls
# face, 3/4 to our left (toward her friend). ruler x 22..39
blk(c, 22, 16, '''
|.DDDDDDCCCCCBBBBA.
|.EECDEEEEECBBBBBA.
|.CBBCBBBBBCBBBBBA.
|.BzzBCBzzzBCBBBBA.
|.CzyBDByzzBCBBBCA.
|.CCCCDBCCCCCBBBCA.
|.DDCCDBCDDCCBBBBA.
|CDDDDABCCCCCBBBBA.
|.CBCCBCCCCCBBBBBA.
|.CCAAAACCCCBBBBA..
|.CCCBBCCCCBBBBBA..
|..BCDDCCCBBBBBA...
|...ABBBBBBBBBA....
''')
c.put(37, 20, ['A', 'B', 'A'])
# the beret, tilted to our right, with its little stalk
beret = c.poly([(20.5, 12.6), (23, 9.6), (28, 7.6), (35, 7.2), (40.5, 9), (42.6, 12), (40, 13.8), (31, 12.8), (23, 13.8)])
c.fill(beret, 'w'); c.outside(beret, 'v', 30, 9, 11, 3.6); c.edge(beret, 'u')
c.put(31, 5, ['vw', '.v'])
# ---- the palette held up in front, a dab of every color
pal = c.poly([(12.6, 42), (15, 38.6), (20, 36.6), (26, 36.4), (31.4, 38), (34, 40.6), (33, 43.4), (29, 44.4), (24.6, 43.6),
              (21.4, 45.2), (19.6, 47.8), (15, 47.6), (12.8, 45.4)])
c.fill(pal, 'k'); c.rim(pal, 'j', 1, 1, 1); c.edge(pal, 'i')
c.put(16, 43, ['.i', 'ii'])                                                         # thumb hole
for (x, y, k) in ((16, 39, 'w'), (20, 38, 'B'), (24, 38, 'N'), (28, 38, 'u'), (31, 40, 'v'), (27, 41, '1')):
    c.put(x, y, [k + k, k + '.'])
c.put(24, 42, ['zzzzz', '....zj'])                                                  # a brush laid across it
hand = c.poly([(13, 46), (15, 43.4), (19, 43.6), (19.6, 47.6), (14, 48)])
c.fill(hand, 'C'); c.rim(hand, 'D', 0, -1, 1); c.edge(hand, 'A')
PORTRAIT = portrait('benders.dabblers', 'Dabblers', c, [{'skin': 'coolbrown', 'hair': 'black'}, {'skin': 'golden', 'hair': 'auburn'}], 'violet')
PORTRAIT['mirror'] = True
