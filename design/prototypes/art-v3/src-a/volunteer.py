import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Volunteer (red): "me! pick me!" A teenager with two round puffs of hair (round 2: recast deep, swapped with Snitch), clipboard at the ready, a red
# volunteer's vest over a white tee with a HELLO name tag. 3/4 to our right. Template: 1 person.
c = Canvas()
body(c, [(2, 48), (3, 40), (8, 35.5), (17, 34), (30, 34), (39, 35.5), (44, 40), (45, 48)])
tee = c.poly([(19.5, 33.5), (27.5, 33.5), (25.5, 48), (21.5, 48)])
c.fill(tee, 'k'); c.fill(c.rect(25, 34, 28, 48) & tee, 'j'); c.fill(c.rect(19, 34, 28, 34) & tee, 'l')
c.edge(tee, '1')
tag = c.rect(10, 38, 16, 42)
c.fill(tag, 'l'); c.fill(c.rect(10, 38, 16, 39), '3'); c.fill(c.rect(11, 41, 15, 41), 'j'); c.edge(tag, '1')
neck(c, 0, 21, 26, 29, 33)
face(c, 0, 15, 19, 18, 6, 9, view='r', eyes='surprised', mouth='smile', jaw='round', look='iris', dk=True)
hr = c.poly([(14, 20), (13.6, 14), (16, 10.4), (21, 9), (27, 9), (31.6, 10.4), (34, 14), (34, 20), (32.6, 18.4), (32, 14.6),
             (27, 13.4), (21, 13.4), (16.6, 14.6), (15.6, 20)])
hair(c, hr, 0, 23, 11, 10, 4)
for cx, cy in ((13.6, 11), (34.4, 11)):                             # two round puffs, tied with red bands
    pf = c.ellipse(cx, cy, 4.4, 4.2)
    hair(c, pf, 0, cx - 1, cy - 1, 4, 3.8); c.edge(pf, 'E')
    c.fill(c.rect(int(cx) - 1, int(cy) + 4, int(cx) + 1, int(cy) + 4), '3')
# the sign-up clipboard held against her chest, a pen clipped on (round 2: no raised hand; at 48px it read as a fist)
bd = c.poly([(30, 48), (31, 38), (40, 37.4), (41, 48)])
c.fill(bd, 'r'); c.fill(bd & c.rect(39, 35, 41, 48), 'q'); c.edge(bd, 'z')
c.fill(c.rect(32, 40, 39, 48), 'k'); c.fill(c.rect(38, 41, 39, 48), 'j')
for y in (43, 45, 47): c.fill(c.rect(33, y, 36, y), 'j')
c.put(33, 36, ['.zzzz.', 'zllllz', '.zkkz.'])                                 # the clip, bright metal-light
c.put(37, 40, ['....D.', '.DDDCB', 'ABBBCB', '.DDDCB', 'ABBBCB', '.DDCCB', '..BCBA'])   # her fingers round the board's edge, thumb up
c.edge(c.mask_of('BCD') & c.rect(37, 39, 44, 47), 'A')
for (x, y) in c.rect(17, 20, 27, 21):                                          # the cheek light: off the eye, out on the cheekbone
    if c.get(x, y) == 'D': c.set(x, y, 'C')
for (x, y) in ((19, 21), (20, 21), (21, 21), (18, 22), (19, 22), (26, 21)): c.set(x, y, 'D')
c.set(20, 22, 'D'); c.set(22, 21, 'C')
PORTRAIT = portrait(c, 'red.volunteer', 'Volunteer', 'red', [{'skin': 'deep', 'hair': 'black'}])
