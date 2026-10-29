import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Panel (red, counts as 3): the judges. In front, the head judge, cropped hair, a pleased smile, holding
# up a score card. Behind left, a bald man with a moustache, eyebrows up; behind right, a woman with a bun, unconvinced.
# Template: 3 people. The two behind share a hair ramp (dark brown) to stay inside the color cap.
c = Canvas()
# ---- behind left (person 1)
body(c, [(0, 48), (0, 31), (3, 28.5), (8, 27.5), (14, 28), (18, 30), (20, 48)], front=False)
neck(c, 1, 7, 12, 23, 28)
crown = c.ellipse(10, 15.5, 6.6, 5.4)
c.fill(crown, 'K'); c.outside(crown, 'J', 9, 14.5, 6, 5)
face(c, 1, 4, 18, 12, 4, 6, view='r', eyes='surprised', mouth='o', jaw='square', ears=True, look='dot')
c.put(7, 20, ['NNN.NNN'][0:1]); c.put(7, 20, ['MNNNNNM'])                  # moustache
c.fill(c.rect(3, 15, 4, 18), 'M'); c.fill(c.rect(15, 15, 16, 18), 'M')
behind(c, 1)
# ---- behind right (person 2)
body(c, [(27, 48), (28, 30), (32, 28), (40, 27.5), (45, 28.5), (47, 31), (47, 48)], front=False)
neck(c, 2, 35, 40, 23, 28)
face(c, 2, 32, 18, 12, 4, 6, view='l', eyes='level', mouth='calm', jaw='oval')
hb = c.poly([(31, 19), (31, 13.5), (33.5, 11), (38, 10.4), (42.5, 11.4), (44.6, 14), (44.6, 19), (43.4, 18), (43, 15.2), (38, 14),
             (33, 14.8), (32.2, 19)])
hair(c, hb, 2, 38, 12, 6, 3, lit=False)
bun = c.ellipse(39, 8.6, 3, 2.6); hair(c, bun, 2, 38.5, 8, 2.8, 2.4, lit=False); c.edge(bun, 'U')
behind(c, 2)
# ---- in front (person 0), centre
s0 = snap(c)
body(c, [(8, 48), (9, 41), (13, 37.5), (19, 36), (30, 36), (36, 37.5), (39, 41), (40, 48)])
c.fill(c.poly([(19, 36), (30, 36), (24.5, 42)]), 'y')
lap = c.poly([(16, 37), (19, 36), (24.5, 43), (22, 43.5)]); c.fill(lap, '4'); c.edge(lap, '2')
neck(c, 0, 21, 27, 30, 36)
hr = c.poly([(16, 22), (15.6, 16), (17.5, 12.4), (22, 10.6), (27, 10.6), (31.4, 12.6), (33, 16), (32.8, 22), (31.6, 21),
             (31.4, 17.4), (28, 15.4), (21, 15.6), (17.6, 17.4), (17.4, 22)])
hair(c, hr, 0, 24, 13, 8, 4, lit=False)
face(c, 0, 17, 21, 15, 5, 8, view='f', eyes='smile', mouth='smile', jaw='oval', dk=True)
# the score card, held up in front of her shoulder
cd = c.rect(33, 31, 42, 39)
c.fill(cd, 'y')
c.put(35, 33, ['.z..zz.', 'zz.z..z', '.z.z..z', '.z..zz.'])                 # "10"
c.edge(cd, 'z')
hand(c, 35, 39, 0, 'grip')
front = changed(c, s0)
c.edge(front, None)
c.fill(c.mask_of('K'), 'J'); c.fill(c.mask_of('S'), 'R')
PORTRAIT = portrait(c, 'red.panel', 'Panel', 'red', [{'skin': 'verydeep', 'hair': 'black'}, {'skin': 'fair', 'hair': 'darkbrown'},
                                                  {'skin': 'tan', 'hair': 'darkbrown'}])
