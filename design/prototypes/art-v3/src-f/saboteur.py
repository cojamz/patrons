import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *
# Saboteur (colorless): whenever this joins your cult, -3 followers. A wiry plotter in a charcoal watch cap with a
# rolled cuff, wisps of blonde hair, brows drawn down, eyes on the job, mouth set. Roll-neck sweater. Prop: the
# monkey wrench he means to throw in the works, held up by his shoulder. True 3/4 to our right. Template: 1 person.
c = Canvas()
body = torso(c, [(2, 48), (3, 41), (7, 36.5), (16, 34), (31, 34), (38, 36), (42, 40), (44, 48)], 18, 40)
roll = c.poly([(17, 31), (24, 32.5), (31, 31), (32, 35.6), (24, 37.4), (16, 35.6)])
c.fill(roll, '3'); c.rim(roll, '4', 0, -1, 1); c.fill(roll & c.rect(27, 30, 40, 40), '2'); c.edge(roll, '1')
for x in (19, 22, 25, 28): c.fill(c.rect(x, 33, x, 36) & roll, '2')               # ribbing
c.fill(c.rect(20, 28, 27, 31), 'A')
c.fill(c.line(10, 40, 11, 47), '2')
# ---- face, 3/4 to our right, brows drawn down. ruler x 14..33
blk(c, 14, 15, '''
|.FCCCCCCCCCCCCCCCBA.
|.FCDEECCCCCCCEEBBBA.
|.CCBBEEEECCEEEBBBBA.
|.CBCzzzzBDCBzzzBBBA.
|.CACBz!yBDCBz!BBBBA.
|.CACCCCCCCDBCCCBBBA.
|.CBDDDCCCCDBCCCBBBA.
|..BCDDCCCCDDABCBBBA.
|..BCCCCCCCCBBBCBBBA.
|..BCCCCCCAAAABCBBA..
|..BCCCCCCCBBCCBBBA..
|...BCCCCDDCCCBBBA...
|....BBCCCCCCBBBA....
|.....ABBBBBBBBA.....
''')
c.put(13, 19, ['C', 'D', 'C'])
c.put(14, 14, ['FF', 'GF', 'F.'])                                                 # wisps at the temple
# ---- watch cap: a soft dome and a rolled cuff, pulled low
dome = c.poly([(14.5, 11), (15, 7), (18, 4), (23, 2.6), (28, 3), (32, 5.4), (33.6, 9), (33.8, 11)])
c.fill(dome, 'o'); c.outside(dome, 'n', 22, 6.5, 10.5, 5.5); c.rim(dome, 'p', -1, -1, 1, only='o')
for x in (18, 22, 26, 30): c.fill(c.line(x, 5, x + 1, 10) & dome, 'n')            # knit ribs
cuff = c.poly([(13.6, 10.4), (34.4, 10), (34.4, 14.6), (13.6, 15)])
c.fill(cuff, 'o'); c.fill(cuff & c.rect(0, 10, 47, 10), 'p'); c.fill(cuff & c.rect(29, 11, 47, 15), 'n')
c.fill(cuff & c.rect(0, 14, 47, 15), 'm'); c.edge(cuff, 'm')
# ---- the monkey wrench, held up by his shoulder
c.put(36, 9, ['.ggh....',
              'fghhg...',
              'fgf.....',
              'fgf.....',
              'fgffggh.',
              'fggfgghg',
              '.ffgggf.',
              '..fggf..',
              '..fghf..',
              '..fghf..',
              '..fghf..',
              '..fghf..',
              '..fghf..',
              '..fghf..',
              '..eggf..',
              '..fghf..',
              '..eggf..',
              '..fghf..',
              '..eggf..',
              '..fghf..'])
c.edge(c.mask_of('efgh') & c.rect(36, 0, 47, 30), 'e')
hand = c.poly([(34, 29), (37, 27.4), (42, 28), (43, 31.6), (40, 33.4), (35, 33)])
c.fill(hand, 'C'); c.rim(hand, 'D', 0, -1, 1, only='C'); c.fill(hand & c.rect(40, 26, 47, 40), 'B'); c.edge(hand, 'A')
c.put(37, 30, ['BB.B'])                                                            # knuckles
arm = c.poly([(33, 34), (36, 32), (41, 33), (40.5, 37), (35, 37.5)])
c.fill(arm, '3'); c.fill(arm & c.rect(38, 30, 47, 40), '2'); c.edge(arm, '1')
PORTRAIT = portrait('benders.saboteur', 'Saboteur', c, [{'skin': 'palepink', 'hair': 'blonde'}], 'red')
