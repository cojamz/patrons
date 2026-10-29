import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Crew (magenta, counts as 2): a heist crew of two in black beanies and domino masks. In front, a woman with a pleased
# one-sided smile (the plan worked); behind (lower, darker), her partner, eyes sliding to check the coast is clear.
# Template: 2 people, front left.
c = Canvas()
# ---- behind (person 1), right
body(c, [(24, 48), (25, 34), (29, 31), (36, 30), (43, 31), (47, 34), (47, 48)], front=False)
neck(c, 1, 31, 36, 26, 30)
face(c, 1, 27, 20, 13, 4, 5, view='l', eyes='side', mouth='calm', jaw='square')
mk = c.poly([(26.4, 17.6), (28, 17), (33, 17.6), (38, 17), (40.4, 17.6), (40, 20.6), (36, 21), (33.4, 19.8), (31, 21), (27, 20.6)])
c.fill(mk, 'm'); c.put(28, 19, ['yz']); c.put(35, 19, ['yz'])
bn = c.poly([(26, 17), (26.4, 12), (29, 9), (34, 8.2), (38.4, 9.4), (40.6, 12.6), (40.8, 17)])
c.fill(bn, 'n'); c.outside(bn, 'm', 32.6, 12, 7, 4.6); c.fill(c.rect(26, 15, 41, 17) & bn, 'm')
behind(c, 1)
# ---- in front (person 0), left
s0 = snap(c)
body(c, [(0, 48), (0, 41), (3, 37.5), (9, 35.5), (23, 35.5), (29, 37), (32, 41), (33, 48)])
c.fill(c.poly([(10.6, 35.2), (22.4, 35.2), (21, 38.6), (12, 38.6)]), '2'); c.rim(c.poly([(10.6, 35.2), (22.4, 35.2), (21, 38.6), (12, 38.6)]), '4', 0, -1, 1)   # roll neck
neck(c, 0, 14, 19, 29, 34)
face(c, 0, 9, 20, 16, 6, 8, view='r', eyes='calm', mouth='smirk', jaw='oval')
c.fill(c.rect(20, 23, 26, 26) & c.mask_of('ABCD') & c.rect(0, 0, 9, 47), 'A')
mk = c.poly([(8, 17.4), (10, 16.6), (16, 17.4), (18, 18.4), (20, 17.4), (25.6, 16.6), (26, 17.4), (25.4, 21), (21, 21.6),
             (18, 20), (15, 21.6), (9.6, 21)])
c.fill(mk, 'n'); c.rim(mk, 'o', -1, -1, 1); c.fill(mk & c.rect(22, 16, 27, 22), 'm')
c.put(12, 19, ['y0z!'][0:0]); c.put(12, 19, ['yzz']); c.put(20, 19, ['yzz'])     # eyes in the mask's holes
c.put(13, 18, ['!']); c.put(21, 18, ['!'])
bn = c.poly([(7.6, 18), (7.8, 12), (10.6, 8.4), (16.5, 7), (22.6, 8.4), (25.4, 12), (25.8, 18)])
c.fill(bn, 'n'); c.outside(bn, 'm', 15.6, 11.6, 9, 5); c.rim(bn, 'o', -1, -1, 1, only='n')
c.fill(c.rect(7, 15, 26, 17) & bn, 'm'); c.fill(c.rect(7, 15, 26, 15) & bn, 'n')
for x in range(10, 25, 3): c.fill(c.rect(x, 16, x, 17) & bn, 'n')                 # ribbed cuff
front = changed(c, s0)
c.edge(front, None)
c.fill(c.mask_of('K'), 'J'); c.fill(c.mask_of('M'), 'N')
PORTRAIT = portrait(c, 'thieves.crew', 'Crew', 'magenta', [{'skin': 'tan', 'hair': 'black'}, {'skin': 'golden', 'hair': 'black'}])
