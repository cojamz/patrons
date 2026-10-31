import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Shoplifter (magenta): butter wouldn't melt. A grandmother with a white bun and a cardigan, eyes closed in perfect
# innocence, a sweet closed smile, and a baguette poking out of her big black handbag. Front. Template: 1 person.
c = Canvas()
body(c, [(2, 48), (3, 40), (8, 35.5), (17, 34), (30, 34), (39, 35.5), (44, 40), (45, 48)])
c.fill(c.poly([(18, 33.5), (29, 33.5), (24, 40)]), 'k')
c.put(19, 33, ['k.k.k.k.k.k'][0:0])
for y in (38, 41, 44): c.put(23, y, ['bc'])                                          # cardigan buttons, gold
c.fill(c.line(22, 40, 22, 47), '2')
neck(c, 0, 21, 26, 29, 33)
face(c, 0, 15, 19, 18, 6, 9, view='f', eyes='serene', mouth='smile', jaw='round')
c.put(18, 22, ['DD'][0:0])
hr = c.poly([(13.6, 22), (13.4, 15), (15.4, 10.4), (20, 8), (28, 8), (32.6, 10.4), (34.6, 15), (34.4, 22), (32.8, 21),
             (32.4, 15.6), (28, 13.4), (24, 14.2), (20, 13.4), (15.6, 15.6), (15.2, 22)])
hair(c, hr, 0, 21, 10, 10, 5)
c.fill(c.line(18, 12, 23, 10) | c.line(26, 10, 31, 12), 'G')
bun = c.ellipse(24, 5.4, 4.2, 3.4); hair(c, bun, 0, 23, 4.6, 3.8, 3); c.edge(bun, 'E')
# the handbag on her arm, a baguette sticking out
bg = c.poly([(28, 37), (43, 36), (44.6, 47.6), (27, 47.6)])
c.fill(bg, 'n'); c.outside(bg, 'm', 34, 40, 9, 8); c.rim(bg, 'o', -1, -1, 1, only='n'); c.edge(bg, 'm')
c.fill(c.rect(34, 40, 37, 41), 'b')                                                 # clasp
c.put(30, 32, ['.mmmmmmmmm.', 'm.........m', 'm.........m'][0:0])
ha = {(x, y) for (x, y) in c.ellipse(35.5, 36, 6, 4.4)} - c.ellipse(35.5, 36, 4.6, 3.2)
c.fill({p for p in ha if p[1] <= 36}, 'm')                                           # the handle
bt = c.poly([(37, 37), (41, 23), (44, 23.6), (41, 37.4)])
c.fill(bt, 'c'); c.rim(bt, 'd', -1, -1, 1); c.fill(c.line(43, 24, 40, 36), 'b'); c.edge(bt, 'b')
for (x, y) in ((41, 27), (40, 30), (39, 33)): c.put(x, y, ['dd'])                    # the slashes on top, lit
PORTRAIT = portrait(c, 'thieves.shoplifter', 'Shoplifter', 'magenta', [{'skin': 'freckled', 'hair': 'white'}])
