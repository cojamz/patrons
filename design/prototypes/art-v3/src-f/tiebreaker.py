import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *
# Tiebreaker (colorless): ties you're in go to you alone. The referee who settles it: striped ref's shirt with a
# black collar, close-cropped grey hair, brows up and a small sure smile, warm brown eyes following the gold coin (one disc, one spin arc) he has just
# flipped off his thumb (the prop). True 3/4 to our left; very deep skin lit from the top-left. Template: 1 person.
c = Canvas()
body = torso(c, [(1, 48), (2, 41), (6, 36.5), (15, 34), (32, 34), (40, 36.5), (44, 40), (46, 48)], 19, 40, mid='4', dark='3', deep='2', lite=None)
for x in range(4, 46, 4):                                                          # ref's stripes
    c.fill(body & c.rect(x, 34, x + 1, 47), '1')
col = c.poly([(17, 31.5), (21, 34), (24, 36), (27, 34), (31, 31.5), (32, 35), (24, 38.6), (16, 35)])
c.fill(col, 'n'); c.fill(col & c.rect(0, 0, 21, 47), 'o'); c.fill(col & c.rect(28, 0, 47, 47), 'm'); c.edge(col, 'm')
c.fill(c.rect(20, 28, 27, 32), 'A'); c.fill(c.rect(20, 30, 21, 32), 'B')
# ---- the raised hand, thumb up, and the coin spinning above it
arm = c.poly([(4, 40), (6, 36), (9.2, 28.6), (13.6, 29), (11.6, 37), (9, 41)])
c.fill(arm, '3'); c.rim(arm, '4', -1, -1, 1); c.fill(c.line(12, 33, 10, 38), '2'); c.edge(arm, '1')
c.put(8, 22, ['..D....',
              '..DC...',
              '.DDCCCA',
              'CBCBCBA',
              'CCCCCBA',
              '.BBBBA.',
              '.33333.'])                                                          # hand, thumb up: lit tip, knuckle row, cuff
c.put(8, 12, ['ydc.', 'dccb', 'ccbb', '.bb.'])                                      # the coin: one gold disc, one glint
c.put(6, 11, ['.4', '4.', '4.'])                                                    # one pale spin arc
# ---- face, 3/4 to our left, eyes up to the coin. ruler x 14..33
blk(c, 14, 14, '''
|.CCCCCCCCCCCCCCBBFE.
|.CDDDDDDCCCCCCCBBFE.
|.GGDDDDGGGGCCBBBBFE.
|.CBBCDCBBBBCCBBBBFA.
|.BzzBDBzzzBCCBBBBBA.
|.CyrBDByrzBCCBBBBCA.
|.DDDCDBCCCCCCBBBBCA.
|.DDDDDBCDDDCCBBBBBA.
|.CDDDDACCDDCCBBBBBA.
|.CACCCCACCCCBBBBBBA.
|.CCAAAACCCCCBBBBBBA.
|.CCCrrCCCCCBBBBBBA..
|..BCDDDCCCCBBBBBA...
|...BCCCCCCBBBBBA....
|....ABBBBBBBBBA.....
''')
c.put(31, 18, ['C', 'D', 'C', 'B'])                                                 # ear
hair = c.poly([(14.6, 15), (14.6, 10.6), (17, 8), (22, 6.8), (28, 7), (31.6, 9), (33.4, 13), (33.2, 18), (31.2, 17), (30.6, 13.4),
               (22, 13.4), (16, 14.2)])
c.fill(hair, 'F'); c.outside(hair, 'E', 21, 9.5, 11, 5); c.rim(hair, 'G', -1, -1, 1, only='F')
# Lighting pass for 1x (very deep skin): a D rim down the lit front contour, the upper lip and both cheeks beside the
# grin lit so the lower face is not a dark mass, the side of the head stepped up to C (B only at the back), and the
# chin plane kept to two pixels under the lip.
for (x, y) in ((15, 15), (15, 17), (15, 22), (15, 23), (15, 24), (16, 24), (15, 25), (16, 25),
               (17, 23), (18, 23), (19, 23), (20, 23), (21, 22), (22, 22), (22, 23), (23, 23), (22, 24)):
    if c.get(x, y) in 'BC': c.set(x, y, 'D')
for y in range(16, 26):
    for x in (27, 28):
        if c.get(x, y) == 'B': c.set(x, y, 'C')
c.set(20, 26, 'C')
PORTRAIT = portrait('benders.tiebreaker', 'Tiebreaker', c, [{'skin': 'verydeep', 'hair': 'grey'}], 'red')
