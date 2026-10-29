import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Robin Hood (magenta): the merry outlaw who robs the top of the table. A pointed cap with a long feather, clean-shaven,
# a broad closed-mouth grin, a bow over his shoulder. 3/4 to our right. Template: 1 person.
c = Canvas()
body(c, [(1, 48), (2, 40), (7, 35.5), (16, 33.5), (31, 33.5), (40, 35.5), (45, 40), (46, 48)])
hood = c.poly([(12, 37), (14, 33), (20, 31), (28, 31), (34, 33), (36, 37), (30, 39.6), (24, 40.6), (18, 39.6)])
c.fill(hood, '2'); c.rim(hood, '4', -1, -1, 1); c.edge(hood, '1')                     # a hood bunched at his shoulders
neck(c, 0, 20, 27, 29, 32)
# the bow: a wooden arc across his back, the string a light line
bw = set()
for t in range(0, 41):
    import math
    a = math.radians(-60 + t * 3)
    bw.add((int(round(30 + 17 * math.cos(a))), int(round(29 + 17 * math.sin(a)))))
bw = {(x, y) for (x, y) in bw if 0 <= x < 48 and 0 <= y < 48}
c.fill(bw | {(x + 1, y) for (x, y) in bw}, 'r'); c.fill(bw, 's')
c.fill(c.line(39, 15, 39, 44), 'k')
face(c, 0, 15, 19, 18, 6, 9, view='r', eyes='smile', mouth='smile', jaw='oval', dk=True)
hr = c.poly([(14, 18.4), (14, 12.4), (34, 12.4), (34, 18.4), (32.6, 17.4), (32.4, 14.4), (16, 14.4), (15.6, 18.4)])
hair(c, hr, 0, 22, 15, 9, 3, lit=False)
c.fill(c.rect(14, 14, 15, 21) & hr, 'F')
# the cap: a pointed felt hat swept back to a tip, a turned-up brim, a long white feather
cap = c.poly([(13, 12.8), (14, 8.8), (18, 5.8), (25, 5.0), (32, 6.2), (39, 8.0), (44.6, 11.0), (36, 11.0), (35, 13.0)])
c.fill(cap, '3'); c.outside(cap, '2', 24, 10, 13, 4.2); c.rim(cap, '4', -1, -1, 1, only='3')
brim = c.poly([(12.4, 13.8), (13, 10.8), (35.6, 10.8), (36, 13.8)])
c.fill(brim, '2'); c.fill(brim & c.rect(0, 10, 47, 10), '4'); c.edge(brim, '1')
fe = c.poly([(21, 6.4), (17, 2.0), (12, -1.4), (14.6, -2.0), (19.6, 0.8), (23, 5.4)])
c.fill(fe, 'k'); c.fill(c.line(22, 5, 14, 0), 'i'); c.edge(fe, 'i')
for (x, y) in c.rect(15, 25, 33, 29):
    if c.get(x, y) == 'A': c.set(x, y, 'B')                                       # keep the jaw from reading as a beard
PORTRAIT = portrait(c, 'thieves.robinhood', 'Robin Hood', 'magenta', [{'skin': 'verydeep', 'hair': 'black'}])
