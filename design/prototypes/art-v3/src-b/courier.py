import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Courier (purple): a bike courier mid-run, cap on backwards, a leather bag strap across a purple windbreaker, a
# parcel tied with twine under one arm. Delighted: brows up, small open smile. Front, round face. Template: 1 person.
c = new()
b = body(c, [(3, 48), (4, 40), (9, 35.5), (17, 33.5), (30, 33.5), (38, 35.5), (43, 40), (44, 48)], 20, 38, 19, 11)
c.fill(c.line(36, 37, 38, 47), '1')
c.fill(c.poly([(18, 33), (29, 33), (28, 36), (19, 36)]), '2'); c.fill(c.rect(18, 33, 29, 33), '4')   # zip collar
c.fill(c.line(24, 36, 24, 47), '1')
strap = c.poly([(11, 34), (15, 34), (35, 48), (30, 48)])
c.fill(strap, 'r'); c.fill(strap & c.poly([(11, 34), (13, 34), (32, 48), (30, 48)]), 's'); c.edge(strap, 'q')
neck(c, 19, 28, 28, 34)
face(c, 'round', 15, 19, eyes='round', brows='raised', mouth='grin')
ear(c, 33, 18); ear(c, 13, 18, 'L')
hair(c, [(14, 18), (14, 13), (16, 11), (31, 11), (33.5, 13), (34, 18), (32.6, 18), (32, 14.5), (16, 14.5), (15.2, 18)], 0, 22, 13, 9, 4)
# backwards cap: a domed crown, the strap and the bill sticking out behind his right ear
cap = c.ellipse(24, 11.5, 10, 6.5) & c.rect(0, 0, 47, 12)
c.fill(cap, 'w'); c.outside(cap, 'v', 22, 9.5, 9, 5); c.fill(cap & c.ellipse(19.5, 7.5, 3, 1.4), 'x')
c.fill(c.rect(14, 12, 34, 12), 'v'); c.put(21, 11, ['uuuuu']); c.put(23, 4, ['vv'])
bill = c.poly([(31, 10), (39, 9.5), (41, 11), (38, 13), (32, 13)])
c.fill(bill, 'v'); c.fill(bill & c.rect(30, 12, 47, 13), 'u'); c.edge(bill, 'u')
# the parcel under his left arm (our right), twine across
box = c.poly([(30, 37), (44, 35.5), (45, 47.5), (31, 48)])
c.fill(box, 'r'); c.fill(box & c.poly([(30, 37), (44, 35.5), (44.5, 38), (30.5, 39.5)]), 's')
c.fill(box & c.rect(41, 36, 47, 48), 'q')
c.fill(c.line(36, 37, 38, 47), 'l'); c.edge(box, 'q')                              # one twine, angled
c.put(39, 44, ['.333', '3334', '2333', '.22.'])                                   # his sleeve over it
PORTRAIT = portrait('purple.courier', 'Courier', 'purple', [{'skin': 'warmtan', 'hair': 'black'}], c, accent='orange')
