import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Pilgrim (yellow), batch d redraw of the round-3 sample: an elder at peace on the road. The hood is pushed back off
# the brow so the face sits in the light (eyes closed, a calm mouth, a long white beard); the hood's inside is only a
# thin shadow line. The cloak is shaded as cloth (lit shoulder, mid, a long diagonal fold, deep under the arm) over a
# darker tunic with a rope belt, not a flat slab. Scallop shell pinned at the shoulder, a gourd on the staff.
# 3/4 to our left (toward the light). Template: 1 person.
c = Canvas()
# ---- tunic under the cloak (dark, shows in the opening)
c.fill(c.poly([(17, 33), (30, 33), (32, 48), (15, 48)]), '2')
c.fill(c.poly([(24, 33), (30, 33), (32, 48), (26, 48)]), '1')
c.fill(c.rect(15, 44, 32, 45), 'q'); c.fill(c.rect(15, 44, 32, 44), 'r')                            # rope belt
# ---- cloak: two panels, shaded as cloth
cl = c.poly([(2, 48), (3, 40), (8, 35.5), (16, 33.4), (19, 33.4), (17, 40), (15, 48)])
cr = c.poly([(28, 33.4), (31, 33.4), (38, 35), (43, 39), (45, 48), (32, 48), (30, 40)])
c.shade(cl, '1234', 12, 33, 15, 18, [-0.15, 0.25, 0.62], flat=0.35)
c.shade(cr, '1234', 30, 33, 16, 18, [0.05, 0.38, 0.75], flat=0.35)
c.fill(c.line(9, 38, 12, 47), '2'); c.fill(c.line(10, 38, 13, 47), '4')                                # one long fold
c.edge(cl, '1'); c.edge(cr, '1')
neck(c, 20, 26, 28, 33)
face(c, 15, 32, 12, 28, 19, 19, [(15, 'shut3'), (21, 'shut4')], (17, ['AAAA']), jaw='long', hair='G',
     brows=[(15, -2, ['GG']), (21, -2, ['GGGG'])], plane=4, cheek=False, ear=None, mouth_y=24, lit=2)
c.put(21, 20, ['DDDD', 'DDD.', '.DD.'])
c.put(16, 13, ['DDDDD', 'DDDD'], keep='.')                                                           # lit brow
beard = c.poly([(14.5, 22.5), (16.5, 22.5), (16.5, 26), (24, 26), (29.5, 23), (31.5, 22.5), (31, 27),
                (28.5, 32), (25, 36.5), (21.5, 38), (18.5, 34.5), (15.5, 29), (14.5, 25.5)])
c.fill(beard, 'G'); c.outside(beard, 'F', 20.5, 27, 8.5, 9); c.fill(beard & c.ellipse(17.5, 25, 2.6, 2.2), 'H')
for x0, y0, x1, y1 in ((20, 29, 21, 35), (24, 28, 25, 34), (28, 27, 27, 31)): c.fill(c.line(x0, y0, x1, y1), 'F')
c.put(16, 22, ['HGGG.GG', '.GG..G.'], keep='.')
c.put(17, 24, ['.AA.', 'CDDC'])                                                  # a calm 2px lip, skin below
# ---- hood, pushed back: a soft roll framing the head, its inner edge a single shadow line
hood = c.poly([(10.5, 33), (10.5, 19), (12, 11), (16.5, 5.5), (24, 3.8), (31, 5.4), (35, 10), (37, 18), (36.5, 33),
               (33.5, 34), (32.5, 18), (31, 12.5), (26, 9.6), (20, 9.6), (15.5, 12.5), (14.4, 20), (14.4, 33)])
c.shade(hood, '1234', 17, 8, 13, 15, [-0.1, 0.3, 0.66], flat=0.3)
hole = c.poly([(32.5, 34), (32.5, 18), (31, 12.5), (26, 9.6), (20, 9.6), (15.5, 12.5), (14.4, 20), (14.4, 34)])
c.fill({(x, y) for (x, y) in hood if any((x + a, y + b) in hole for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)))}, '2')
c.edge(hood, '1')
# ---- the scallop shell, pinned at the lit shoulder: a fan, ribs to the hinge
fan = c.ellipse(8, 40, 4, 4) & c.rect(0, 0, 47, 40)
c.fill(fan, 'k'); c.fill(fan & c.ellipse(6.5, 37.5, 2.2, 1.6), 'l')
for tx in (5, 8, 11): c.fill(c.line(tx, 37 if tx != 8 else 36, 8, 41), 'j')
c.put(7, 41, ['jkj', '.j.']); c.edge(fan | c.rect(7, 41, 9, 42), 'i')
# ---- staff with a gourd, his hand on it
c.fill(c.rect(39, 3, 40, 47), 'r'); c.fill(c.rect(39, 3, 39, 47), 's'); c.fill(c.rect(39, 1, 40, 2), 's')
gourd = c.ellipse(42.5, 10, 2, 2) | c.ellipse(43, 14.5, 3, 3)
c.fill(gourd, 's'); c.outside(gourd, 'r', 42.5, 13.5, 2.8, 4.5); c.put(41, 12, ['kk', 'k.'])
c.fill(c.line(41, 5, 42, 8), 'q')
c.edge(c.rect(39, 1, 40, 47) | gourd, 'q')
c.put(37, 29, ['.CCD', 'CCCC', 'BCCB', '.BB.'])
PORTRAIT = {'id': 'yellow.pilgrim', 'name': 'Pilgrim', 'kind': 'member', 'sphere': 'yellow',
            'people': [{'skin': 'golden', 'hair': 'white'}], 'accent': 'red', 'px': c.rows()}
