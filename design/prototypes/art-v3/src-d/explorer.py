import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Explorer (yellow): always somewhere else. A leather flying cap with goggles pushed up, a red scarf, a brass
# spyglass in hand, eyes bright and looking off to our right, brows up. 3/4 to our right. Template: 1 person.
c = Canvas()
body = torso(c, 2, 45, 33)
scarf = c.poly([(14, 31), (33, 31), (34, 36), (28, 38), (19, 38), (13, 36)])
c.fill(scarf, 'v'); c.outside(scarf, 'u', 21, 32, 10, 4); c.fill(scarf & c.rect(14, 31, 33, 31), 'v')
tail = c.poly([(15, 36), (21, 37), (19, 47), (13, 46)])
c.fill(tail, 'v'); c.fill(c.line(18, 38, 16, 46), 'u'); c.edge(tail, 'u')
c.edge(scarf, 'u')
neck(c, 20, 26, 28, 31)
face(c, 15, 31, 13, 28, 19, 25, [(18, 'i4r'), (27, 'i3r')], (22, ['A..A', '.AA.']), jaw='pointed', hair='F',
     brows=[(18, -3, ['AAAA']), (27, -3, ['AAA'])], ear=None, mouth_y=24, lit=2)
cap = c.poly([(13, 26), (13, 14), (14.5, 9.5), (18, 6.6), (24, 5.6), (30, 6.6), (33, 10), (33.6, 16), (33, 26), (31, 24),
              (31.2, 16), (16, 15.4), (15.2, 24)])
c.fill(cap, 'r'); c.outside(cap, 'q', 21, 11, 11, 9); c.fill(cap & c.ellipse(18, 9, 3.4, 2), 's')
c.edge(cap, 'q')
gog = [(15, 10), (24, 10)]
c.fill(c.rect(14, 11, 33, 12) & cap, 'q')
for x, y in gog:
    c.put(x, y, ['.ee.', 'e!ff', 'efff', '.ff.'])
c.put(19, 11, ['eeeee'])
# brass spyglass, held up on our right
sp = c.poly([(33.5, 47.5), (35.5, 40), (37.5, 40.4), (36.5, 47.8)]) | c.poly([(36, 40), (39, 33), (41, 33.6), (38, 40.6)]) | c.poly([(39.5, 33), (42, 27.5), (43.6, 28.2), (41.4, 33.8)])
c.fill(sp, 'c'); c.rim(sp, 'd', -1, 0, 1); c.rim(sp, 'b', 1, 0, 1)
for x, y in ((35, 40), (38, 33)): c.put(x, y, ['aaa', 'aaa'])
c.put(40, 26, ['.aaa', 'a!za', 'azza', '.aa.'], keep='.')                                  # lens rim, glass, glint
c.edge(sp, 'a')
c.put(36, 38, ['.CCD', 'CCCC', 'BCCB', '.BB.'])
c.fill(c.mask_of('2'), '1')
PORTRAIT = {'id': 'yellow.explorer', 'name': 'Explorer', 'kind': 'member', 'sphere': 'yellow',
            'people': [{'skin': 'coolbrown', 'hair': 'darkbrown'}], 'accent': 'red', 'px': c.rows()}
