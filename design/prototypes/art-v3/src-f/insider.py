import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *
# Insider (colorless): you may also recruit from the top 3 of the pile. A young office insider with a neat side
# part, head turned to our left but eyes sliding back to us (a sly side-glance, a small closed smile). Sweater vest
# over shirt and tie; prop: the staff ID badge on a navy lanyard. True 3/4 to our left. Template: 1 person.
c = Canvas()
body = torso(c, [(2, 48), (3, 41), (7, 36.5), (16, 34), (31, 34), (39, 36.5), (43, 41), (45, 48)], 19, 40)
vee = c.poly([(18.5, 34), (29.5, 34), (24, 45)])
c.fill(vee, 'k'); c.fill(vee & c.rect(25, 30, 35, 47), 'j')
c.put(23, 35, ['vv', 'wv', 'wv', 'wv', 'wv', 'vu', '.u'])                              # tie
c.fill(c.line(18, 34, 23, 45) | c.line(30, 34, 25, 45), '1')                        # vest's V edge
c.fill(c.rect(20, 28, 27, 34), 'A'); c.fill(c.rect(20, 31, 21, 34), 'B')
# lanyard from the collar to the badge clip, the badge on his chest
c.fill(c.line(18, 34, 15, 39) | c.line(21, 36, 17, 39), 'u')
badge = c.rect(12, 40, 19, 47)
c.fill(badge, 'l'); c.fill(c.rect(18, 40, 19, 47), 'k'); c.edge(badge, 'j')
c.put(12, 40, ['vvvvvvvv', 'lFFlllll', 'lCClzzzk', 'lBBlllll', 'lllllllk', 'lzzzzzlk', 'llllllkk', 'llllllkk'])
c.put(15, 39, ['zz'])                                                               # clip
# ---- face, true 3/4 to our left, eyes sliding back to the right. ruler x 14..33
blk(c, 14, 15, '''
|.CCDDCCCCCCCCCBBBFE.
|.EECCCEEEEECBBBBBFE.
|.CBBCCBBBBBCCBBBBBA.
|.BzzBCBzzzzBCBBBBBA.
|.CyzBDByy!zBCBBBBCA.
|.CCCCDBCCCCCCBBBBCA.
|.DDCCDBCDDCCCBBBBBA.
|.CDDDDACCCCCCBBBBBA.
|.CCCCCBCCCCCBBBBBBA.
|.CCAAAAACCCCBBBBBBA.
|.CCCBBBCCCCBBBBBBA..
|..BCCDDCCCCBBBBBA...
|...BCCCCCCBBBBBA....
|....ABBBBBBBBBA.....
''')
c.set(22, 23, 'A')                                                                  # the smile's near corner
# ---- side-parted hair, swept to our left
hair = c.poly([(14, 16.5), (14.4, 10), (17, 6.6), (22, 5.2), (28, 5.6), (32, 8), (33.6, 13), (33.4, 18.5), (31.4, 18.5),
               (31, 14.5), (27, 12.4), (20, 13.4), (15.6, 16)])
c.fill(hair, 'F'); c.outside(hair, 'E', 21, 9.5, 11, 6); c.rim(hair, 'G', -1, -1, 1, only='F')
c.fill(c.line(27, 6, 28, 9), 'E')                                                   # the part
c.fill(c.line(18, 9, 25, 7) | c.line(17, 11, 22, 10), 'G')                          # combed sheen
PORTRAIT = portrait('benders.insider', 'Insider', c, [{'skin': 'olive', 'hair': 'darkbrown'}], 'navy')
