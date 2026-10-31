import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Accomplice (magenta): the one who carries the loot. A young man in a flat cap, sheepish (brows up, a small smile),
# a lumpy sack of three things slung over his shoulder, his fist on the knot. 3/4 to our right. Template: 1 person.
c = Canvas()
body(c, [(1, 48), (2, 40), (7, 35.5), (16, 33.5), (31, 33.5), (40, 35.5), (45, 40), (46, 48)])
c.fill(c.poly([(18, 33.4), (29, 33.4), (27, 37), (20, 37)]), 'n'); c.rim(c.poly([(18, 33.4), (29, 33.4), (27, 37), (20, 37)]), 'o', 0, -1, 1)
for x in (12, 16, 30, 34): c.fill(c.line(x, 38, x + (1 if x < 24 else -1), 47), '2')   # waistcoat seams
neck(c, 0, 20, 27, 29, 33)
face(c, 0, 15, 19, 18, 6, 9, view='r', eyes='worried', mouth='smile', jaw='oval', look='iris')
hr = c.poly([(14, 22), (14, 15), (16, 13), (32.6, 13), (33.6, 16), (33.4, 21), (32, 20), (31.6, 16), (16.4, 16), (15.6, 22)])
hair(c, hr, 0, 20, 14, 8, 3, lit=False)
cap = c.poly([(13.5, 14), (14, 10), (17, 7.4), (24, 6.4), (31, 7.2), (34.6, 10.4), (35, 13.6), (24, 14.6)])
c.fill(cap, 'n'); c.fill(cap & c.ellipse(21, 9, 7, 2.8), 'o'); c.fill(cap & c.rect(30, 8, 47, 14), 'm'); c.edge(cap, 'm')
peak = c.poly([(20, 14.6), (24, 13.4), (36, 13), (38.6, 14.4), (36, 16.2), (22, 16.2)])
c.fill(peak, 'm'); c.fill(peak & c.rect(0, 13, 47, 13), 'n')
# the sack over his shoulder: a cinched neck by his fist, three lumps showing through the cloth
sk = c.poly([(33, 22), (36, 18.4), (41, 17), (45.6, 19), (47, 25), (47, 33), (45, 38), (40, 39.4), (35.6, 37.6), (33.4, 33),
             (34.6, 27.4)])
c.fill(sk, 'k'); c.outside(sk, 'j', 39, 26, 8, 10.5); c.outside(sk, 'i', 37.6, 25, 10, 13.6)
c.fill(c.line(36, 27, 41, 25) | c.line(36, 32, 42, 31), 'j')               # where the lumps press out
c.fill(c.line(41, 23, 43, 22) | c.line(39, 29, 41, 28) | c.line(40, 35, 42, 34), 'l')
c.edge(sk, 'i')
nk = c.poly([(29.6, 31), (31, 27.6), (34, 25), (35.6, 26.6), (33.6, 30), (31, 33)])
c.fill(nk, 'j'); c.rim(nk, 'k', -1, -1, 1); c.edge(nk, 'i')
c.put(28, 29, ['ii', 'ii'][0:0])
hand(c, 27, 31, 0, 'fist')
PORTRAIT = portrait(c, 'thieves.accomplice', 'Accomplice', 'magenta', [{'skin': 'olive', 'hair': 'darkbrown'}])
