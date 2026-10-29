import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Volunteer (red): "me! pick me!" A freckled teenager with blonde pigtails, hand shot up high, mouth open, a red
# volunteer's vest over a white tee with a HELLO name tag. 3/4 to our right. Template: 1 person.
c = Canvas()
body(c, [(2, 48), (3, 40), (8, 35.5), (17, 34), (30, 34), (39, 35.5), (44, 40), (45, 48)])
tee = c.poly([(18, 33.5), (29, 33.5), (27, 48), (20, 48)])
c.fill(tee, 'k'); c.fill(c.rect(25, 34, 28, 48) & tee, 'j'); c.fill(c.rect(19, 34, 28, 34) & tee, 'l')
c.edge(tee, '1')
tag = c.rect(10, 38, 16, 42)
c.fill(tag, 'l'); c.fill(c.rect(10, 38, 16, 39), '3'); c.fill(c.rect(11, 41, 15, 41), 'j'); c.edge(tag, '1')
neck(c, 0, 21, 26, 29, 33)
face(c, 0, 15, 19, 18, 6, 9, view='r', eyes='surprised', mouth='smile', jaw='round', look='dot')
for x, y in ((18, 22), (29, 22)):
    if c.get(x, y) in 'CD': c.set(x, y, 'B')                         # freckles, a few, in pairs
hr = c.poly([(14, 21), (13.5, 14), (16, 9.5), (21, 7), (27, 7), (31.5, 9.5), (34, 14), (34, 20), (32.5, 18), (32, 14),
             (28, 13), (25, 14.6), (22, 13.2), (18, 14.4), (16, 17), (15.6, 21)])
hair(c, hr, 0, 23, 10, 10, 5)
c.fill(c.line(24, 7, 25, 13), 'E')                                    # the parting
for cx, cy in ((11.5, 20), (36.5, 20)):                              # pigtails, tied with red bands
    t = c.poly([(cx - 2, cy - 4), (cx + 2, cy - 4), (cx + 2.6, cy + 2), (cx + 1, cy + 6.5), (cx - 1.4, cy + 6.5), (cx - 2.6, cy + 2)])
    hair(c, t, 0, cx - 1, cy, 2.4, 5)
    c.fill(c.rect(int(cx) - 1, int(cy) - 4, int(cx) + 1, int(cy) - 3), '3')
# the hand, up high
arm = c.poly([(38, 34), (39.5, 22), (41, 12), (44.5, 12.5), (43.5, 24), (42.5, 35)])
c.fill(arm, 'C'); c.rim(arm, 'D', -1, 0, 1); c.outside(arm, 'B', 40, 20, 3, 14); c.edge(arm, 'A')
c.fill(c.poly([(37, 36), (38, 27), (43.5, 27), (44, 37)]), '3'); c.rim(c.poly([(37, 36), (38, 27), (43.5, 27), (44, 37)]), '4', -1, 0, 1)
c.put(40, 5, ['.C.C.', 'CCDCC', 'CDCCB', 'CCCCB', 'BCCB.', '.BCB.', '.BCB.'])
PORTRAIT = portrait(c, 'red.volunteer', 'Volunteer', 'red', [{'skin': 'freckled', 'hair': 'blonde'}])
