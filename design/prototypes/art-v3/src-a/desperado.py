import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Desperado (magenta): down on his luck and getting desperate. Sunburnt, a few days of blond stubble, a battered wide
# hat, a navy bandana knotted at the neck, brows knotted with worry. Front. Template: 1 person.
c = Canvas()
body(c, [(1, 48), (2, 40), (7, 35.5), (16, 33.5), (31, 33.5), (40, 35.5), (45, 40), (46, 48)])
neck(c, 0, 20, 27, 29, 33)
bn = c.poly([(16, 32), (32, 32), (31, 35.5), (24, 42), (17, 35.5)])
c.fill(bn, 'w'); c.outside(bn, 'v', 23, 34, 8, 4.5); c.rim(bn, 'x', 0, -1, 1, only='w'); c.edge(bn, 'u')
c.put(21, 36, ['x.x', '.x.'][0:0])
face(c, 0, 15, 19, 18, 6, 9, view='f', eyes='worried', mouth='worried', jaw='square', look='iris')
stub = c.poly([(16, 24), (18, 27.4), (21, 29), (27, 29), (30, 27.4), (32, 24), (30, 26.4), (27, 27.6), (21, 27.6), (18, 26.4)])
for (x, y) in stub:
    if c.get(x, y) in 'CDBA': c.set(x, y, 'E' if c.get(x, y) in 'BA' else 'F')   # stubble along the jaw, one cluster
c.fill(c.rect(17, 21, 19, 21) & c.mask_of('CD'), 'D')                  # sunburnt cheeks, lit
hr = c.poly([(14, 19), (14, 14), (34, 14), (34, 19), (32.4, 18), (32, 15.6), (16, 15.6), (15.6, 19)])
hair(c, hr, 0, 22, 14, 9, 3, lit=False)
crown = c.poly([(16, 13.6), (16.6, 7), (19, 4), (23, 4.6), (24, 6), (25, 4.6), (29, 4), (31.4, 7), (32, 13.6)])
c.fill(crown, 's'); c.outside(crown, 'r', 22, 7, 10, 6.5); c.fill(crown & c.rect(0, 11, 47, 12), 'q')
c.fill(c.line(24, 6, 24, 10), 'r')
brim = c.poly([(5, 14), (8, 12.4), (16, 12.6), (32, 12.6), (40, 12.4), (43, 14), (41, 15.6), (32, 15.2), (16, 15.2), (7, 15.6)])
c.fill(brim, 'r'); c.fill(brim & c.rect(0, 12, 47, 12), 's'); c.fill(brim & c.rect(0, 15, 47, 15), 'q')
c.fill(c.poly([(5, 14), (7, 12.8), (8, 14.2), (6.4, 15.4)]), 's')
PORTRAIT = portrait(c, 'thieves.desperado', 'Desperado', 'magenta', [{'skin': 'palepink', 'hair': 'blonde'}], accent='navy')
