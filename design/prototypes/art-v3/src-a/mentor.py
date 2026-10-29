import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Mentor & Protégé (red, counts as 2). In front, the mentor: an older man, grey beard, round gold spectacles, a kind
# smile, an open book in his hands. Behind (lower, a value darker), the protégé leans in, eyes on the page, mouth open
# mid-question. Template: 2 people, front left.
c = Canvas()
# ---- behind (person 1), right
body(c, [(24, 48), (25, 34), (29, 31), (36, 30), (43, 31), (47, 34), (47, 48)], front=False)
neck(c, 1, 31, 36, 26, 30)
face(c, 1, 27, 20, 13, 4, 5, view='l', eyes='sideL', mouth='open', jaw='pointed', look='dot')
hb = c.poly([(25.6, 20), (25.5, 14), (27, 10.4), (29, 11.4), (30.5, 8.6), (33, 10.4), (35.5, 8.4), (37, 10.6), (40, 10.4),
             (41.2, 14), (41, 20), (39.6, 20), (39.4, 16), (36, 15.2), (33, 16), (29, 15), (27.2, 17), (27, 20)])
hair(c, hb, 1, 31, 11, 7, 4, lit=False)
behind(c, 1)
# ---- in front (person 0), left
s0 = snap(c)
body(c, [(0, 48), (0, 41), (3, 37.5), (9, 35.5), (23, 35.5), (29, 37), (32, 41), (33, 48)])
c.fill(c.poly([(12, 35.2), (21, 35.2), (16.5, 41)]), 'k'); c.fill(c.poly([(16.5, 35.2), (21, 35.2), (16.5, 41)]), 'j')
neck(c, 0, 13, 20, 29, 34)
face(c, 0, 9, 20, 16, 6, 8, view='f', eyes='calm', mouth='smile', jaw='square', look='iris')
hr = c.poly([(7.5, 21), (7.4, 15), (9, 11), (13, 9), (19, 8.6), (23.5, 10), (26, 14), (26, 21), (24.6, 21), (24.4, 16),
             (22, 14.2), (18, 13.6), (13, 14.4), (10.4, 16), (9.2, 21)])
hair(c, hr, 0, 16, 11, 9, 4.5)
c.fill(c.rect(11, 14, 22, 14) & hr, 'G')
# a short grey beard along the jaw, the smile kept clear
bd = c.poly([(8.8, 22), (9.5, 26), (12, 29.6), (17, 31), (22, 29.6), (24.4, 26), (25.2, 22), (24, 25.2), (21.5, 26.6),
             (21, 24.8), (13, 24.8), (12.5, 26.6), (10, 25.2)])
hair(c, bd, 0, 15, 24, 8, 6)
c.fill(c.rect(9, 29, 25, 31) & bd, 'E')
# round gold spectacles
c.put(11, 18, ['.AAA...AAA.', 'A...AAA...A', 'A...A.A...A', '.AAA...AAA.'])
c.put(12, 18, ['D'])
# the open book in both hands
bk = c.poly([(4, 47.5), (5, 41), (16.5, 42.2), (28, 41), (29, 47.5)])
c.fill(bk, 'k'); c.fill(c.poly([(16.5, 42.2), (28, 41), (29, 47.5), (16.5, 47.5)]), 'j')
c.fill(c.rect(16, 42, 17, 47), 'i')
for y in (44, 46): c.fill(c.rect(7, y, 14, y) | c.rect(19, y, 26, y), 'j')
c.fill(c.rect(4, 47, 29, 47), '1'); c.edge(bk, 'i')
hand(c, 1, 41, 0, 'grip'); hand(c, 28, 41, 0, 'grip', mirror=True)
front = changed(c, s0)
c.edge(front, None)
c.fill(c.mask_of('K'), 'J'); c.fill(c.mask_of('y'), 'B')
PORTRAIT = portrait(c, 'red.mentor', 'Mentor & Protégé', 'red', [{'skin': 'tan', 'hair': 'grey'}, {'skin': 'golden', 'hair': 'black'}])
