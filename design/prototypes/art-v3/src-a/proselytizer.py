import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Proselytizer (red, counts as 2): street preachers for the cult. In front (on the right this time), a woman with close-
# cropped hair and gold hoops, mid-pitch, holding up a pamphlet. Behind her (lower, darker), her partner with glasses
# and a stack of pamphlets under his arm, smiling. Template: 2 people, mirrored (front right).
c = Canvas()
# ---- behind (person 1), left
body(c, [(0, 48), (0, 34), (4, 31), (11, 30), (18, 31), (22, 34), (23, 48)], front=False)
neck(c, 1, 11, 16, 26, 30)
face(c, 1, 8, 20, 13, 4, 5, view='r', eyes='smile', mouth='smile', jaw='oval', look='dot')
hb = c.poly([(6.6, 19), (6.6, 14), (8.5, 11), (13, 10), (18, 10.6), (21, 13), (21.4, 19), (20, 18), (19.6, 15), (16, 14.6),
             (12, 15), (9, 15.6), (8, 19)])
hair(c, hb, 1, 13, 12, 6, 3, lit=False)
behind(c, 1)
c.put(1, 37, ['iiiiii', 'kkkkkk', 'jjjjjj', 'kkkkkk', 'jjjjjj'])     # his stack of pamphlets
c.edge(c.rect(1, 37, 6, 41), 'i')
# ---- in front (person 0), right
s0 = snap(c)
body(c, [(14, 48), (15, 41), (18, 37.5), (24, 35.5), (38, 35.5), (44, 37.5), (47, 41), (47, 48)])
neck(c, 0, 27, 33, 29, 35)
c.fill(c.poly([(26, 35.4), (34, 35.4), (30, 39)]), 'C')
hr = c.ellipse(31, 16.5, 9.4, 7.6)
hair(c, hr, 0, 29, 14, 8, 6, lit=False)
face(c, 0, 23, 20, 16, 6, 8, view='l', eyes='calm', mouth='o', jaw='oval', dk=True)
c.fill(c.poly([(22.5, 16.4), (24, 13.2), (30, 12.6), (37, 13.2), (39.5, 16.4), (37, 15), (30, 14.6), (25, 15)]), 'F')
c.put(38, 23, ['c', 'd', 'c'][0:0]); c.put(38, 22, ['.c.', 'c.c', '.c.'])          # a gold hoop
# the pamphlet held up
arm = c.poly([(38, 48), (38.5, 40), (39.5, 34), (44, 33.5), (45, 41), (45, 48)])
c.fill(arm, '3'); c.rim(arm, '4', -1, 0, 1, only='3'); c.fill(c.rect(43, 34, 45, 48) & arm, '2'); c.edge(arm, '1')
pm = c.poly([(37.5, 21), (45.5, 20.5), (46, 31), (38, 31.5)])
c.fill(pm, 'k'); c.fill(c.rect(37, 20, 46, 21) & pm, 'k'); c.fill(c.poly([(42.5, 20.7), (45.5, 20.5), (46, 31), (42.5, 31.2)]), 'j')
c.put(39, 23, ['3.3', '333', '.3.']); c.fill(c.rect(39, 26, 43, 26) | c.rect(39, 28, 42, 28), 'j')
c.edge(pm, 'i')
hand(c, 39, 30, 0, 'grip')
front = changed(c, s0)
c.edge(front, None)
c.fill(c.mask_of('K'), 'J')
PORTRAIT = portrait(c, 'red.proselytizer', 'Proselytizer', 'red', [{'skin': 'deep', 'hair': 'black'}, {'skin': 'fair', 'hair': 'brown'}])
PORTRAIT['mirror'] = True
