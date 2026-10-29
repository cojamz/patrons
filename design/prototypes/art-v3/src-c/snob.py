import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Snob (blue): nose in the air. A pale young man with a slick blond pompadour, eyes shut, brows up, lips pursed, a
# gold monocle on its chain over the near eye, a high collar and a silk ascot. 3/4 to our right. Template: 1 person.
c = Canvas()
body = cloth(c, [(1, 48), (1, 40), (3, 36.5), (8, 34.5), (17, 33.5), (30, 33.5), (39, 34.5), (44, 36.5), (46, 40), (46, 48)])
lapL = c.poly([(14.5, 33.5), (19.5, 33), (23, 44.6), (20.6, 44.6), (16, 38.5), (12.5, 35.8)])
lapR = c.poly([(28.5, 33), (33.5, 33.5), (35.5, 35.8), (32, 38.5), (27.4, 44.6), (25, 44.6)])
c.fill(lapL, '2'); c.rim(lapL, '4', -1, 0, 1); c.edge(lapL, '1'); c.fill(lapR, '2'); c.edge(lapR, '1')
ascot = c.poly([(19.5, 31), (28.5, 31), (27.5, 36), (25.5, 41), (22.5, 41), (20.5, 36)])
c.fill(ascot, 'w'); c.fill(ascot & c.rect(25, 31, 30, 42), 'v'); c.fill(c.line(24, 34, 24, 40), 'v'); c.edge(ascot, 'u')
c.put(23, 34, ['cc', 'bb'])                                                     # the pin
neck(c, 20, 27, 27, 31)
c.put(18, 29, ['yy', 'yyy', '.yy']); c.put(28, 29, ['.yy', 'yyy', 'yy.'])     # high collar points
# head tipped back: eye line raised a row, chin forward
f = face(c, (15, 8, 32, 27), 18, view='r', jaw='narrow', eyes='closed', mouth='pursed', brows='raised')
c.put(25, 21, ['AB'])                                                           # nostril seen from below
# slick blond pompadour, a high wave at the front
pomp = c.poly([(13.5, 18), (13, 11), (15, 6), (20, 2.8), (27, 2.5), (32.5, 4.5), (34, 8), (33.5, 12), (31, 10.5), (25, 9.6),
               (18, 11), (16, 13), (15.5, 18)])
c.fill(pomp, 'G'); c.outside(pomp, 'F', 19, 5, 12, 6); c.outside(pomp, 'E', 17, 4, 17, 11)
c.rim(pomp, 'H', -1, -1, 1, only='G')
c.fill(c.line(17, 6, 27, 4), 'H'); c.fill(c.line(16, 9, 22, 7), 'F')
# monocle: a gold ring round the near eye, the chain down to the lapel
c.put(16, 15, ['.cbc.', 'c...b', 'c...b', 'b...a', '.aba.'])
c.fill(c.line(17, 20, 15, 26) | c.line(15, 27, 15, 33) | c.line(16, 34, 17, 36), 'c')
PORTRAIT = {'id': 'market.snob', 'name': 'Snob', 'kind': 'member', 'sphere': 'blue',
            'people': [{'skin': 'porcelain', 'hair': 'blonde'}], 'accent': 'violet', 'px': c.rows()}
