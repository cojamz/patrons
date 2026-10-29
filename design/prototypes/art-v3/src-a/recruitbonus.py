import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Recruit Bonus (red, counts as 2): a welcome gift for every new face. In front, a delighted woman with her hair in a
# high puff, holding out a gold-wrapped present with a white bow; behind (lower, darker), a man in a paper party hat,
# smiling with his mouth closed. (Behind people are mid tones: a pale tone a step darker reads grey.) Template: 2 people, front left.
c = Canvas()
# ---- behind (person 1), right
body(c, [(24, 48), (25, 34), (29, 31), (36, 30), (43, 31), (47, 34), (47, 48)], front=False)
neck(c, 1, 31, 36, 26, 30)
face(c, 1, 27, 20, 13, 4, 5, view='l', eyes='smile', mouth='smile', jaw='square', look='dot')
hb = c.poly([(26, 19), (26, 14.5), (28, 12.5), (34, 12), (39, 12.6), (40.6, 15), (40.6, 19), (39.4, 18), (39, 16), (30, 15.6),
             (27.4, 17)])
hair(c, hb, 1, 33, 13, 7, 2.5, lit=False)
hat = c.poly([(28, 13.5), (33.5, 3), (39, 13.5)])                       # paper party hat, red and white bands
c.fill(hat, 'k'); c.fill(hat & (c.rect(0, 6, 47, 7) | c.rect(0, 10, 47, 11)), '2'); c.fill(c.poly([(34, 4), (39, 13.5), (36, 13.5)]), 'j')
c.fill(hat & c.rect(0, 6, 47, 7) & c.rect(35, 0, 47, 47), '1'); c.fill(hat & c.rect(0, 10, 47, 11) & c.rect(36, 0, 47, 47), '1')
c.put(33, 1, ['.c', 'cc'])
behind(c, 1)
# ---- in front (person 0), left
s0 = snap(c)
body(c, [(0, 48), (0, 41), (3, 37.5), (9, 35.5), (23, 35.5), (29, 37), (32, 41), (33, 48)])
neck(c, 0, 14, 19, 29, 35)
c.fill(c.poly([(12.5, 35.2), (21, 35.2), (16.5, 38.5)]), 'B')
face(c, 0, 9, 20, 16, 6, 8, view='r', eyes='laugh', mouth='smile', jaw='oval')
hr = c.poly([(7.6, 21), (7.4, 15), (9.6, 11.4), (14, 10), (20, 10), (24, 11.6), (26, 15), (25.8, 21), (24.4, 20), (24, 16),
             (21, 14.4), (15, 14.8), (11, 15.2), (9.2, 17), (9, 21)])
hair(c, hr, 0, 16, 12, 8, 3.5)
puff = c.ellipse(15.5, 6.2, 6, 4.6)
hair(c, puff, 0, 14.5, 5.5, 5.4, 4); c.edge(puff, 'E')
c.fill(c.rect(13, 10, 18, 10), '3')                                     # a red hair tie
# the present, held out in both hands
bx = c.rect(6, 39, 23, 47)
c.fill(bx, 'c'); c.fill(c.rect(6, 39, 23, 39), 'k'); c.fill(c.rect(19, 40, 23, 47), 'b'); c.fill(c.rect(6, 46, 23, 47), 'b')
c.fill(c.rect(13, 39, 15, 47), 'k'); c.fill(c.rect(15, 40, 15, 47), 'j')
c.put(9, 35, ['.kk...kk.', 'kkjk.kjkk', '.kkjkjkk.', '...jkj...'])  # the bow
c.edge(bx, 'b')
hand(c, 2, 40, 0, 'grip'); hand(c, 23, 40, 0, 'grip', mirror=True)
front = changed(c, s0)
c.edge(front, None)
c.fill(c.mask_of('K'), 'J')
c.fill(c.mask_of('a'), 'b')
PORTRAIT = portrait(c, 'red.recruitbonus', 'Recruit Bonus', 'red', [{'skin': 'warmtan', 'hair': 'darkbrown'}, {'skin': 'olive', 'hair': 'darkbrown'}])
