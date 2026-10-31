import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Fixer (magenta): she can get you anything, for a price. Hair scraped back into a sleek ponytail, a knowing sideways
# look and a one-sided smile, a high-collared jacket, a chunky phone at her ear. 3/4 to our right.
# Template: 1 person.
c = Canvas()
body(c, [(2, 48), (3, 40), (8, 35.5), (17, 34), (30, 34), (39, 35.5), (44, 40), (45, 48)])
col = c.poly([(16, 34.6), (19, 30.6), (24, 32), (29, 30.6), (32, 34.6), (29, 36.2), (24, 35), (19, 36.2)])
c.fill(col, '2'); c.rim(col, '4', -1, -1, 1); c.edge(col, '1')
c.fill(c.line(24, 36, 24, 47), '2')
neck(c, 0, 21, 26, 29, 32)
face(c, 0, 15, 19, 18, 6, 9, view='r', eyes='side', mouth='smirk', jaw='pointed', dk=True)
hr = c.poly([(14, 21), (13.6, 14), (15.6, 10), (20, 7.6), (26, 7.4), (31, 9), (33.6, 12.6), (34, 18), (32.6, 17),
             (32, 14), (26, 12.6), (20, 13), (16.4, 15), (15.4, 21)])
hair(c, hr, 0, 21, 10, 9, 4.5)
c.fill(c.line(17, 11, 24, 9) | c.line(21, 12, 29, 10), 'G')                    # combed-back lines catching the light
tail = c.poly([(31, 10), (35, 8.6), (38, 10.6), (39, 16), (38, 22), (36.4, 25.6), (35.4, 21), (35.4, 15), (33, 12)])
hair(c, tail, 0, 35, 13, 3.6, 7)
c.put(32, 9, ['33', '33'])                                                 # the tie
# a chunky phone at her ear (she's already arranging it), her hand round it, the sleeve down to the shoulder
sl = c.poly([(4, 48), (5, 38), (8, 30.6), (13, 30.6), (14, 38), (13, 48)])
c.fill(sl, '3'); c.rim(sl, '4', -1, 0, 1, only='3'); c.fill(c.rect(12, 32, 14, 48) & sl, '2'); c.edge(sl, '1')
ph = c.rect(10, 13, 13, 26)
c.fill(ph, 'g'); c.fill(c.rect(10, 13, 10, 26), 'h'); c.fill(c.rect(13, 14, 13, 26), 'f'); c.fill(c.rect(11, 15, 12, 17), 'n')
c.edge(ph, 'e')
c.put(9, 23, ['.CDC', 'CCCC', 'BCCB', 'BCCB', 'BCBA', '.BBA', '.BA.', '.BA.'])
PORTRAIT = portrait(c, 'thieves.fixer', 'Fixer', 'magenta', [{'skin': 'coolbrown', 'hair': 'black'}])
