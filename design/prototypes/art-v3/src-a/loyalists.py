import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Loyalists (red, counts as 2): two who'd never be swapped out. In front, a woman with short natural hair, proud, her
# hand on her heart; behind (lower, a value darker), an old man with white hair and a warm smile, his hand on her
# shoulder. Matching gold pins. Template: 2 people, front left.
c = Canvas()
# ---- behind (person 1), right
body(c, [(24, 48), (25, 34), (29, 31), (36, 30), (43, 31), (47, 34), (47, 48)], front=False)
neck(c, 1, 31, 36, 26, 30)
face(c, 1, 27, 20, 13, 4, 5, view='l', eyes='smile', mouth='smile', jaw='round', hp=1, look='dot')
hb = c.poly([(26, 19), (26, 14), (28, 11.5), (33, 10.5), (38, 11.4), (40.5, 14), (40.6, 20), (39.4, 20), (39, 16), (36, 14.8),
             (30, 15), (27.6, 16.4), (27.4, 19)])
hair(c, hb, 1, 32, 12, 7, 3, lit=False)
c.fill(c.rect(37, 33, 39, 35), 'a'); c.fill(c.rect(37, 33, 38, 33), 'c')       # his pin
behind(c, 1)
# ---- in front (person 0), left
s0 = snap(c)
body(c, [(0, 48), (0, 41), (3, 37.5), (9, 35.5), (23, 35.5), (29, 37), (32, 41), (33, 48)])
c.fill(c.poly([(13, 35), (20, 35), (16.5, 39)]), 'B')                       # the open neckline
neck(c, 0, 14, 19, 29, 35)
c.fill(c.poly([(13, 35), (20, 35), (16.5, 39)]) - c.rect(13, 35, 20, 35), 'C')
hr = c.ellipse(16.5, 16.5, 11, 9)
hair(c, hr, 0, 14, 13, 10, 7.5)
face(c, 0, 9, 20, 16, 6, 8, view='f', eyes='calm', mouth='smile', jaw='oval', dk=True, look='iris')
c.fill(c.poly([(8.5, 16), (10, 12.6), (14, 12.6), (20, 12.4), (24, 13), (25, 16), (23, 14.6), (17, 14.6), (11, 14.6)]), 'F')
c.rim(hr, 'G', -1, -1, 1, only='F')
c.fill(c.rect(24, 40, 26, 42), 'c'); c.fill(c.rect(26, 41, 26, 42), 'a')     # her pin
hand(c, 9, 40, 0, 'flat')                                                   # hand on her heart
front = changed(c, s0)
c.edge(front, None)
# his hand on her shoulder, over everything
stamp(c, 24, 34, ['.1221', '11221', '.0110'], 1)
PORTRAIT = portrait(c, 'red.loyalists', 'Loyalists', 'red', [{'skin': 'brown', 'hair': 'black'}, {'skin': 'fair', 'hair': 'white'}])
