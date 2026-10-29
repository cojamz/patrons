import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Busker (green): a street guitarist playing with his eyes shut, a ginger beard and freckles, a knit beanie with a
# turned-up cuff. The guitar sits across his chest: round body low on our left, neck running up to our right.
# 3/4 to our left. Template: 1 person.
c = Canvas()
body = torso(c, 2, 45, 33)
c.fill(c.poly([(18, 33), (29, 33), (23.5, 38)]), 'B')
neck(c, 20, 27, 28, 33)
face(c, 15, 32, 13, 28, 19, 19, [(15, 'shut3'), (21, 'shut4')], (17, ['A...A', '.AAA.']), jaw='square', hair='F',
     plane=5, cheek=False, ear=(31, 'R'), mouth_y=24)
c.put(21, 20, ['DDD', '.DD'])
c.put(23, 21, ['B.B'], keep='.')                                                                # two freckles
beard = c.poly([(15, 22), (16.5, 22), (17, 25.5), (22, 26.3), (27, 22), (30.5, 21), (30.5, 26), (27, 30.5), (21, 31.5), (16.5, 28.5)])
c.fill(beard, 'G'); c.outside(beard, 'F', 21, 25, 9, 6); c.fill(beard & c.ellipse(18, 27, 2.2, 1.6), 'H')
c.put(17, 23, ['GGGGG'])
beanie = c.poly([(13.5, 15.5), (13.5, 9), (16, 5.5), (21, 3.6), (27, 4), (31.5, 6.5), (33.5, 10), (33.5, 15.5)])
c.fill(beanie, '3'); c.outside(beanie, '2', 21, 8, 10, 6); c.fill(beanie & c.ellipse(18, 7, 3, 1.6), '4')
cuff = c.rect(13, 12, 34, 15)
c.fill(cuff, '2'); c.fill(c.rect(13, 12, 34, 12), '4'); c.fill(c.rect(29, 13, 34, 15), '1')
for x in range(15, 33, 3): c.fill(c.rect(x, 13, x, 15), '1')
c.put(31, 16, ['F', 'FF'])
# guitar: the neck first, then the body over it
nk = c.poly([(16, 41), (43, 27.5), (44.5, 30), (17.5, 44)])
c.fill(nk, 'q'); c.fill(c.line(17, 41, 43, 28), 'r'); c.edge(nk, 'q')
for t in range(4): c.set(24 + t * 5, 39 - round(t * 2.5), 's')
hd = c.poly([(42, 27), (47.5, 24), (47.5, 29), (44.5, 31)])
c.fill(hd, 'q'); c.fill(hd & c.rect(42, 24, 47, 26), 'r')
gb = c.ellipse(9, 41, 8.5, 6.5) | c.ellipse(15.5, 42.5, 5.5, 5)
c.fill(gb, 'r'); c.outside(gb, 'q', 9.5, 40, 9, 6); c.fill(gb & c.ellipse(6.5, 38.5, 4, 2.2), 's')
hole = c.ellipse(12.5, 41.5, 2.2, 2.2); c.fill(hole, 'z')
c.fill(c.line(16, 42, 22, 39), 'q')
c.edge(gb, 'q')
c.put(29, 33, ['.CCD', 'CCCC', 'BCCB', '.BB.'])                                                  # fretting hand
c.put(6, 43, ['.CCD', 'CCCC', 'BCCB'])                                                            # strumming hand
PORTRAIT = {'id': 'echo.evergreen', 'name': 'Busker', 'kind': 'member', 'sphere': 'green',
            'people': [{'skin': 'freckled', 'hair': 'ginger'}], 'accent': 'red', 'px': c.rows()}
