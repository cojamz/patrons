import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Twins (red, counts as 2): two freckled ginger kids, same bowl cut, same striped sweater, the same pleased little smile,
# heads tipped toward each other. Twins share a tone on purpose. Template: 2 people, front left.
c = Canvas()

def sweater(m, front):
    for y in range(0, 48, 4):
        c.fill(m & c.rect(0, y, 47, y + 1), '2' if front else '1')

# ---- behind (person 1), right
b1 = body(c, [(24, 48), (25, 34), (29, 31), (36, 30), (43, 31), (47, 34), (47, 48)], front=False)
sweater(b1, False)
neck(c, 1, 31, 36, 26, 30)
face(c, 1, 27, 20, 13, 4, 5, view='l', eyes='smile', mouth='smile', jaw='round', look='dot')
for x, y in ((29, 22), (36, 22)): c.set(x, y, 'J')
hb = c.poly([(25.6, 21), (25.6, 15), (27.6, 11.6), (33, 10.2), (38.5, 11.4), (41, 15), (41, 21), (39.6, 21), (39.6, 18), (26.8, 18), (26.8, 21)])
hair(c, hb, 1, 32, 12, 7, 3.5, lit=False)
c.fill(c.rect(27, 17, 40, 17) & hb, 'M')
behind(c, 1)
# ---- in front (person 0), left
s0 = snap(c)
b0 = body(c, [(0, 48), (0, 41), (3, 37.5), (9, 35.5), (23, 35.5), (29, 37), (32, 41), (33, 48)])
sweater(b0 & c.rect(0, 38, 47, 47), True)
c.fill(c.poly([(11, 35.4), (22, 35.4), (21, 37.5), (12, 37.5)]), '4')       # crew neck rib
neck(c, 0, 13, 19, 29, 34)
face(c, 0, 9, 20, 16, 6, 8, view='r', eyes='smile', mouth='smile', jaw='round', look='dot')
for x, y in ((12, 22), (22, 22)):
    if c.get(x, y) in 'CD': c.set(x, y, 'B')                             # freckles
hr = c.poly([(7, 22), (7, 15), (9.5, 10.5), (16, 8.6), (22.5, 10), (26.2, 15), (26.2, 22), (24.6, 22), (24.6, 18), (8.6, 18), (8.6, 22)])
hair(c, hr, 0, 15, 10, 9, 5)
c.fill(c.rect(9, 17, 25, 17) & hr, 'E'); c.fill(c.line(11, 11, 16, 9), 'H')
front = changed(c, s0)
c.edge(front, None)
c.fill(c.mask_of('K'), 'J')
PORTRAIT = portrait(c, 'red.twins', 'Twins', 'red', [{'skin': 'freckled', 'hair': 'ginger'}, {'skin': 'freckled', 'hair': 'ginger'}])
