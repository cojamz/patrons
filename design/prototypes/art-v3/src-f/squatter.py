import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *
# Party Crasher (colorless; card id squatter): once per game, take a space a rival already took. A grinning
# gatecrasher in somebody else's party hat, perched on a mop of black curls, a party blower unrolled from his lips
# (cheeks round, brows up), suit jacket with a loosened rose tie. Frontal. Template: 1 person.
c = Canvas()
body = torso(c, [(1, 48), (2, 41), (6, 36.5), (15, 34), (32, 34), (40, 36.5), (44, 40), (46, 48)], 19, 40)
shirt = c.poly([(19.5, 34), (28.5, 34), (24, 44)])
c.fill(shirt, 'k'); c.fill(shirt & c.rect(25, 33, 30, 47), 'j')
c.put(22, 35, ['.ww', 'wwv', '.wv', '.wv', 'wwvv', 'wvv.'])                         # the loosened tie, askew
lapL = c.poly([(14, 34.4), (19.6, 34), (24, 44.5), (21, 45), (15.5, 38.5)])
lapR = c.poly([(28.4, 34), (34, 34.4), (32.5, 38.5), (27, 45), (24, 44.5)])
c.fill(lapL, '4'); c.edge(lapL, '1'); c.fill(lapR, '2'); c.edge(lapR, '1')
c.fill(c.rect(20, 28, 27, 34), 'A'); c.fill(c.rect(20, 31, 21, 34), 'B')
# ---- a mop of black curls
hair = c.poly([(12, 25), (11, 20), (12, 15), (11.5, 11), (14, 8), (18, 6.5), (24, 6), (30, 6.5), (34, 9), (35.5, 13),
               (35, 18), (36, 22), (34, 25), (32, 22), (32, 17), (16, 17), (15.5, 22)])
c.fill(hair, 'F'); c.outside(hair, 'E', 21, 11, 13, 9); c.rim(hair, 'G', -1, -1, 1, only='F')
for (x, y) in ((13, 11), (17, 8), (12, 17), (14, 21), (33, 13), (34, 19), (21, 7)):
    c.put(x, y, ['GG', 'GF'])                                                      # curls catching the light
c.put(11, 14, ['E']); c.put(11, 19, ['E']); c.put(35, 16, ['E'])
# ---- face, frontal, brows up, cheeks round on the blower. ruler x 14..33
blk(c, 14, 14, '''
|...BCCCCCCCCCCCB....
|..BCDDDCCCCCCCCBA...
|..BCDEEECCCCEEECBA..
|..CCBBBBCCCCBBBBBA..
|..CCB!zCCCCCB!zCBBA.
|..CCBzzCCDCCBzzBBBA.
|..CDDDCCCDCCCCCCBBA.
|..CDDDCCCDBCCDDCBBA.
|..CDDCCCDDABCDDCBBA.
|..BCCCCCCCCCCCCCBBA.
|..BCCCCCCCCCCCCCBBA.
|..BCCCCCCCCCCCCCBA..
|...BCCCCDDCCCCCBA...
|....BCCCCCCCCBBA....
|.....ABBBBBBBBA.....
''')
c.put(15, 18, ['C', 'D', 'C', 'B']); c.put(33, 18, ['A', 'B', 'A'])
# ---- the party blower, unrolled to our right, its tip still curled
c.put(23, 24, ['.xxwxxwxxwxx',
               'uwvwwvwwvwwvx',
               '.uuuuuuuuuuvw'])
c.put(35, 19, ['.xww.', 'xv..w', 'w.xvw', 'w.vv.', 'xw...'])
c.put(22, 25, ['A']); c.put(21, 24, ['BB']); c.put(22, 27, ['BB'])
# ---- party hat, cocked to our right, stripes and a pompom
hat = c.poly([(17, 8.5), (31.5, 6.2), (30.5, 0.8)])
hat = c.poly([(17.5, 9.5), (32, 7.5), (27.5, 0.4)])
c.fill(hat, 'w')
for i in range(-2, 8):
    c.fill(hat & c.line(18 + 3 * i, 9, 23 + 3 * i, 1), 'k')
c.fill(hat & c.rect(0, 7, 47, 9), 'v', ); c.fill(hat & c.rect(0, 9, 47, 9), 'u')
for x, y in [(p[0], p[1]) for p in hat if c.get(p[0] + 1, p[1]) == '.' and p[1] < 7]:
    c.set(x, y, 'v' if c.get(x, y) == 'w' else 'j')
c.put(26, -1 + 0, ['.xx', 'xxw', 'wwv'])
PORTRAIT = portrait('benders.squatter', 'Party Crasher', c, [{'skin': 'warmtan', 'hair': 'black'}], 'rose')
