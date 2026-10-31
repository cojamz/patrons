import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Cutpurse (magenta): a quick-fingered teenager with a tousled mop of hair, eyes sliding to our left, a crooked little smile, a
# fat gold-clasped purse dangling from two fingers by its string. 3/4 to our left. Template: 1 person.
c = Canvas()
body(c, [(2, 48), (3, 40), (8, 35.5), (17, 34), (30, 34), (39, 35.5), (44, 40), (45, 48)])
col = c.poly([(17, 34.4), (20.5, 33), (24, 37.5), (27.5, 33), (31, 34.4), (29, 37), (24, 40), (19, 37)])
c.fill(col, '2'); c.rim(col, '4', 0, -1, 1); c.fill(c.poly([(20.5, 33), (27.5, 33), (24, 37.5)]), '1')
neck(c, 0, 21, 26, 29, 33)
face(c, 0, 15, 19, 18, 6, 9, view='l', eyes='sideL', mouth='smirkL', jaw='pointed')
# bare-headed, a tousled mop (final review: no flat cap; Accomplice and Fence keep theirs)
hr = c.poly([(13.4, 23), (13, 15), (14.6, 10.4), (18, 7.4), (23, 6), (28.6, 6.6), (32.6, 9), (34.6, 13), (34.6, 22),
             (33, 22), (32.6, 17.6), (30.6, 15.4), (29, 17), (27.2, 15.2), (25, 17.2), (22.6, 15.2), (20.4, 17.4),
             (18.4, 15.6), (16.4, 17.6), (15.4, 23)])
hair(c, hr, 0, 20, 11, 10, 6)
c.put(16, 4, ['..F.....F', '.FFF..FFG', 'FF.FFFF.'])                     # a few tufts sticking up
c.fill(c.line(19, 9, 23, 12) | c.line(26, 8, 28, 12), 'E')              # strands
c.fill(c.line(17, 11, 21, 8), 'H')
c.edge(hr, None)
# the purse, held up by its gathered neck: a round drawstring pouch, fat with coins, a gold clasp
pu = c.ellipse(9, 40.5, 6.2, 5.6)
c.fill(pu, 'r'); c.outside(pu, 'q', 8, 39.4, 5.6, 5); c.rim(pu, 's', -1, -1, 1, only='r')
c.fill(c.line(6, 39, 8, 37) | c.line(12, 41, 13, 39), 'q')                  # folds
c.put(7, 33, ['.q.q', 'qrqr', '.rq.'])                                     # the gathered neck and strings
c.put(8, 43, ['cc', 'bb'])
c.edge(pu, 'q')
c.put(5, 29, ['.CDC.', 'CCCCB', 'BCCBA', '.BBA.'])
PORTRAIT = portrait(c, 'thieves.cutpurse', 'Cutpurse', 'magenta', [{'skin': 'warmtan', 'hair': 'brown'}])
