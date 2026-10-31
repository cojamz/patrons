import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *
# Coach (colorless; was Second Wind). A stocky older coach mid-blast on a steel whistle, cheeks puffed, brows down:
# red ball cap with the bill toward the light, grey sideburns, track jacket with a stand collar, a zip and pale
# shoulder stripes; the whistle's red cord runs down to the collar. True 3/4 to our left. Template: 1 person.
c = Canvas()
# ---- body: track jacket
body = torso(c, [(1, 48), (1, 41), (4, 37), (9, 35), (17, 33.5), (30, 33.5), (38, 35), (43, 37), (46, 41), (46, 48)], 18, 39)
for side in (0, 1):  # pale shoulder stripes running down the sleeves
    pts = [(9, 35.2), (17, 33.8), (17, 35.4), (10, 36.8), (5.2, 40), (3.8, 46), (2.4, 46), (3.4, 38.8)] if side == 0 else \
          [(30, 33.8), (38, 35.2), (43.6, 38.8), (44.6, 46), (43.2, 46), (41.8, 40), (37, 36.8), (30, 35.4)]
    c.fill(c.poly(pts), '5' if side == 0 else '4')
c.fill(c.line(24, 36, 24, 47), '1'); c.fill(c.line(23, 37, 23, 47), '4')          # zip with a lit edge
c.put(23, 40, ['55', '41'])                                                        # zip pull
c.fill(c.line(12, 41, 13, 47), '2')                                                # one fold
# ---- neck, stand collar
c.fill(c.rect(19, 28, 28, 33), 'A'); c.fill(c.rect(19, 31, 20, 33), 'B')
col = c.poly([(17, 31.5), (20, 33), (24, 34), (28, 33), (31, 31.5), (31.5, 35), (27, 36.5), (21, 36.5), (16.5, 35)])
c.fill(col, '3'); c.rim(col, '4', 0, -1, 1); c.fill(col & c.rect(26, 30, 40, 40), '2'); c.edge(col, '1')
# ---- face, true 3/4 to our left: far eye small, nose near the far contour, ear and jaw on the shadow side
blk(c, 14, 14, '''
|.AAAAAAAAAAAAAAAAEE.
|.BBBBBBBBBBBBBBBAEE.
|.EEDDCCCEEEEECBBBEE.
|.CEEEBEEEEBBBCBBBEA.
|.BzzBCBzzzzBCBBBBBA.
|.CzyBDBz!yBCCBBBBCA.
|.CCCCDBCCCCCCBBBBCA.
|.DDDCDBCDDDCCBBBBBA.
|CDDDDDACDDDCCBBBBBA.
|CDDDCCBCCDDCCBBBBBA.
|CCCAAACCCCDCCBBBBBA.
|.CCCBCCCCCCCBBBBBBA.
|.BCCCDDCCCCCBBBBBBA.
|..BCCCCCCCCBBBBBBA..
|...ABBBBBBBBBBBBA...
''')
c.put(21, 25, ['BBB']); c.put(14, 22, ['B']); c.put(14, 25, ['B'])   # the puffed cheeks' undersides
c.put(13, 22, ['.C', 'DD', 'DC', '.C'])                                              # the far cheek puffed out, lit
# ---- steel whistle at the lips, its red cord hanging down to the collar
c.put(9, 22, ['.ggg',
              'fggfgggg',
              'fggfffff',
              '.fff'])
c.fill(c.line(11, 26, 13, 30) | c.line(14, 31, 17, 33), 'v')
# ---- cap: crown and seam, bill toward the light
crown = c.poly([(14.5, 14), (14.8, 9), (17, 5.6), (21.5, 3.6), (27, 3.8), (31, 5.6), (33.4, 9), (33.6, 14)])
c.fill(crown, 'w'); c.outside(crown, 'v', 22, 8.5, 10, 7); c.rim(crown, 'x', -1, -1, 1, only='w')
c.put(22, 3, ['vv'])
c.fill(c.line(22, 5, 21, 13) & crown, 'v')                                        # front seam
bill = c.poly([(4.5, 15.6), (6.5, 13.4), (12, 12.2), (22, 12.4), (26, 13.6), (24, 15.6), (12, 15.8)])
c.fill(bill, 'w'); c.fill(bill & c.rect(0, 12, 47, 12), 'x'); c.fill(bill & c.rect(0, 15, 47, 16), 'v')
c.edge(bill, 'v')
PORTRAIT = portrait('benders.secondwind', 'Coach', c, [{'skin': 'fair', 'hair': 'ash'}], 'red')
