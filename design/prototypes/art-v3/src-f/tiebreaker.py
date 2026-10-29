import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *
# Tiebreaker (colorless): ties you're in go to you alone. The referee who settles it: striped ref's shirt with a
# black collar, close-cropped grey hair, brows up and a small sure smile, eyes following the gold coin he has just
# flipped off his thumb (the prop). True 3/4 to our left; very deep skin lit from the top-left. Template: 1 person.
c = Canvas()
body = torso(c, [(1, 48), (2, 41), (6, 36.5), (15, 34), (32, 34), (40, 36.5), (44, 40), (46, 48)], 19, 40)
for x in range(4, 46, 4):                                                          # ref's stripes
    c.fill(body & c.rect(x, 34, x + 1, 47), '1' if x > 22 else '2')
col = c.poly([(17, 31.5), (21, 34), (24, 36), (27, 34), (31, 31.5), (32, 35), (24, 38.6), (16, 35)])
c.fill(col, 'n'); c.fill(col & c.rect(0, 0, 21, 47), 'o'); c.fill(col & c.rect(28, 0, 47, 47), 'm'); c.edge(col, 'm')
c.fill(c.rect(20, 28, 27, 32), 'A'); c.fill(c.rect(20, 30, 21, 32), 'B')
# ---- the raised hand, thumb up, and the coin spinning above it
arm = c.poly([(4, 40), (6, 36), (9.6, 30), (13.6, 31), (11.6, 37), (9, 41)])
c.fill(arm, '3'); c.rim(arm, '4', -1, -1, 1); c.fill(c.line(12, 33, 10, 38), '2'); c.edge(arm, '1')
hand = c.poly([(8, 30.6), (8.4, 27), (11, 25.6), (14.4, 26.4), (14.6, 29.6), (13, 31.6), (9.4, 31.6)])
c.fill(hand, 'C'); c.rim(hand, 'D', -1, -1, 1); c.fill(hand & c.rect(13, 20, 20, 40), 'B')
c.put(9, 24, ['DC', 'CB'])                                                          # thumb
c.edge(hand, 'A')
c.put(6, 13, ['.cdd.', 'bcdcc', '.bbb.'])                                           # the coin, edge-on in the air
c.put(10, 17, ['d', '.', '.d', '..', '.d'])                                         # its arc up from the thumb
c.put(4, 11, ['d'])
# ---- face, 3/4 to our left, eyes up to the coin. ruler x 14..33
blk(c, 14, 14, '''
|.DDDDDDDDDDCCCCBBFE.
|.DDDDDDDDDCCCCCBBFE.
|.GGDDDDGGGGCCBBBBFE.
|.CBBCDCBBBBCCBBBBFA.
|.BzzBDBzzzBCCBBBBBA.
|.DzyBDBzyyBCCBBBBCA.
|.DDDDDBCCCCCCBBBBCA.
|.DDDDDBDDDDCCBBBBBA.
|.DDDDDACCDDCCBBBBBA.
|.CDDDCBCCCCCBBBBBBA.
|.CCAAAABCCCCBBBBBBA.
|.CCCDDDCCCCBBBBBBA..
|..BCDDDCCCCBBBBBA...
|...BCCCCCCBBBBBA....
|....ABBBBBBBBBA.....
''')
c.set(21, 23, 'A')
c.put(31, 18, ['C', 'D', 'C', 'B'])                                                 # ear
hair = c.poly([(14.6, 15), (14.6, 10.6), (17, 8), (22, 6.8), (28, 7), (31.6, 9), (33.4, 13), (33.2, 18), (31.2, 17), (30.6, 13.4),
               (22, 13.4), (16, 14.2)])
c.fill(hair, 'F'); c.outside(hair, 'E', 21, 9.5, 11, 5); c.rim(hair, 'G', -1, -1, 1, only='F')
PORTRAIT = portrait('benders.tiebreaker', 'Tiebreaker', c, [{'skin': 'verydeep', 'hair': 'grey'}], 'red')
