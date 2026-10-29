import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Cutpurse (magenta): a quick-fingered teenager in a newsboy cap, eyes sliding to our left, a crooked little smile, a
# fat gold-clasped purse dangling from two fingers by its string. 3/4 to our left. Template: 1 person.
c = Canvas()
body(c, [(2, 48), (3, 40), (8, 35.5), (17, 34), (30, 34), (39, 35.5), (44, 40), (45, 48)])
col = c.poly([(17, 34.4), (20.5, 33), (24, 37.5), (27.5, 33), (31, 34.4), (29, 37), (24, 40), (19, 37)])
c.fill(col, '2'); c.rim(col, '4', 0, -1, 1); c.fill(c.poly([(20.5, 33), (27.5, 33), (24, 37.5)]), '1')
neck(c, 0, 21, 26, 29, 33)
face(c, 0, 15, 19, 18, 6, 9, view='l', eyes='sideL', mouth='smirkL', jaw='pointed')
hr = c.poly([(13.6, 23), (14, 15), (34, 15), (34, 22), (32.6, 22), (32.4, 17), (16, 17), (15.4, 23)])
hair(c, hr, 0, 20, 15, 8, 3, lit=False)
cap = c.poly([(13, 15.6), (13, 11), (16.5, 7.6), (25, 6.2), (32.5, 7.4), (35.5, 10.6), (35.4, 14.6), (30, 15.6)])
c.fill(cap, 'n'); c.outside(cap, 'm', 22, 9, 10, 4.5); c.rim(cap, 'o', -1, -1, 1, only='n')
c.fill(c.line(17, 8, 24, 13), 'm'); c.fill(c.line(31, 8, 26, 13), 'm')
c.put(24, 6, ['oo'])
peak = c.poly([(10, 15.6), (13, 13.6), (24, 13.6), (26, 15), (24, 16.6), (12, 16.8)])
c.fill(peak, 'm'); c.fill(peak & c.rect(0, 13, 47, 14), 'n')
# the purse, held up by its gathered neck: a round drawstring pouch, fat with coins, a gold clasp
pu = c.ellipse(9, 40.5, 6.2, 5.6)
c.fill(pu, 'r'); c.outside(pu, 'q', 8, 39.4, 5.6, 5); c.rim(pu, 's', -1, -1, 1, only='r')
c.fill(c.line(6, 39, 8, 37) | c.line(12, 41, 13, 39), 'q')                  # folds
c.put(7, 33, ['.q.q', 'qrqr', '.rq.'])                                     # the gathered neck and strings
c.put(8, 43, ['cc', 'bb'])
c.edge(pu, 'q')
c.put(5, 29, ['.CDC.', 'CCCCB', 'BCCBA', '.BBA.'])
PORTRAIT = portrait(c, 'thieves.cutpurse', 'Cutpurse', 'magenta', [{'skin': 'warmtan', 'hair': 'black'}])
