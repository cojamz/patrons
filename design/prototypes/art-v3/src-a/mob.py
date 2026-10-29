import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Mob (red, counts as 5): a cheering home crowd, not an angry one (round 2: cream pennant with a star, a waving open
# hand, closed-happy eyes on two faces). Front and centre a young man beaming, mouth closed
# (the darkest tone, the friendliest face, the biggest head); either side a freckled woman smiling and a man cheering
# with a red pennant; two more faces peek over their shoulders. Three tones across five people, no torches, no fists.
# Template: 3 people for the front three; the back two sit higher, smaller and two steps darker, eyes clear of the
# heads in front. The two at the back reuse the side people's skin ramps (only three skin slots).
c = Canvas()

def darker(mask, keys, d):
    for x, y in mask:
        k = c.get(x, y)
        if k in keys: c.set(x, y, step(k, d))

# ---- the back two (high, small, darkest clothes)
s = snap(c)
body(c, [(5, 30), (6, 21), (10, 17.5), (15, 17), (20, 18.5), (23, 22), (23, 30)], front=False)
neck(c, 2, 13, 17, 14, 18)
face(c, 2, 11, 10, 10, 3, 4, view='r', eyes='smile', mouth='smile', jaw='round', hp=0, ears=False, cheek=False)
h = c.poly([(10, 11), (10.4, 7.4), (12.5, 5.2), (16.5, 4.8), (20, 6), (21.4, 9), (21.2, 11), (20.4, 9), (17, 7.8), (12.4, 8),
            (11, 11)])
hair(c, h, 2, 15, 6, 5, 2.4, lit=False, hp=0)
body(c, [(24, 30), (25, 22), (28, 18.5), (33, 17), (38, 17.5), (42, 21), (43, 30)], front=False)
neck(c, 1, 30, 34, 14, 18)
face(c, 1, 27, 10, 10, 3, 4, view='l', eyes='laugh', mouth='smile', jaw='oval', ears=False, cheek=False)
h = c.poly([(26, 12), (26, 7.6), (28, 5.4), (32, 4.6), (35.6, 5.6), (37.6, 8), (37.6, 13), (36.4, 12), (36, 9), (33, 7.8),
            (28.6, 8), (27.2, 9.4), (27.2, 12)])
hair(c, h, 1, 31, 6, 5, 2.4, lit=False)
back = changed(c, s)
darker(back, 'IJKLQRST', -2); darker(back, '12345', -1)
# ---- the two at the sides (person 1 left, person 2 right)
s = snap(c)
body(c, [(0, 48), (0, 31), (3, 28.5), (8, 27.5), (14, 28), (18, 30), (20, 48)], front=False)
neck(c, 1, 7, 12, 23, 28)
face(c, 1, 4, 18, 12, 4, 6, view='r', eyes='laugh', mouth='smile', jaw='oval')
for x, y in ((6, 20), (12, 20)): c.set(x, y, 'J')                    # freckles
h = c.poly([(2.6, 22), (2.6, 15), (4.4, 11.6), (9, 10), (14, 10.8), (16.6, 13.6), (16.8, 20), (15.6, 19), (15.4, 15.4),
            (11, 14.4), (7, 14.2), (4.2, 16), (4, 22)])
hair(c, h, 1, 9, 12, 7, 3.4, lit=False)
c.fill(c.poly([(2.4, 20), (4.2, 20), (4.6, 26.5), (2.6, 26)]), 'M')         # hair down past the ear
arm = c.poly([(0, 30), (0, 13), (3.6, 12), (4.6, 20), (3.6, 30)])                  # her arm up, waving
c.fill(arm, '2'); c.rim(arm, '3', -1, 0, 1, only='2'); c.edge(arm, '1')
stamp(c, 0, 2, ['..3....', '3.3.3..', '2.2.2..', '2.2.2.3', '2.2.2.2', '212122.', '222221.', '122221.', '.1221..',
                '.112...', '.11....'], 1)   # an open hand: three fingers apart, the thumb out to the side
body(c, [(27, 48), (28, 30), (32, 28), (40, 27.5), (45, 28.5), (47, 31), (47, 48)], front=False)
neck(c, 2, 35, 40, 23, 28)
face(c, 2, 32, 18, 12, 4, 6, view='l', eyes='smile', mouth='o', jaw='square', hp=0, look='dot')
h = c.poly([(31, 17), (31.2, 13), (33.4, 11), (38, 10.4), (42.6, 11.2), (44.8, 14), (44.8, 18), (43.6, 17), (43, 14.6),
            (38, 13.8), (33, 14), (32.2, 17)])
hair(c, h, 2, 38, 12, 6, 2.6, lit=False, hp=0)
sides = changed(c, s)
darker(sides, 'IJKLQRST', -1)
# the pennant, held up by the man on the right
c.fill(c.rect(44, 1, 44, 29), 'y'); c.fill(c.rect(45, 1, 45, 29), '1')          # a pale pole
pn = c.poly([(43.6, 0.6), (43.6, 9.4), (31, 5)])                                     # a cream pennant flying sideways
c.fill(pn, 'y'); c.edge(pn, 'z')
c.put(36, 2, ['..3..', '33333', '.333.', '.3.3.'])                                    # a red five-point star
hand(c, 42, 27, 2, 'grip')
# ---- in front (person 0), centre: laughing
s0 = snap(c)
body(c, [(8, 48), (9, 41), (13, 37.5), (19, 36), (30, 36), (36, 37.5), (39, 41), (40, 48)])
c.fill(c.poly([(20, 36), (29, 36), (24.5, 40)]), 'C')
neck(c, 0, 21, 27, 30, 36)
face(c, 0, 17, 21, 15, 5, 8, view='f', eyes='smile', mouth='smile', jaw='oval', dk=True)
hr = c.poly([(15.8, 21), (15.6, 15.6), (17.4, 12.4), (21, 10.4), (24.5, 9.6), (28, 10.4), (31.6, 12.4), (33.4, 15.6), (33.2, 21),
             (32, 20), (31.6, 17), (28, 15.4), (21, 15.4), (17.4, 17), (17, 21)])
hair(c, hr, 0, 24, 12.5, 8.5, 4.5, lit=False)
for (x, y) in c.rect(17, 24, 21, 29) | c.rect(20, 27, 29, 29):              # lift the jaw ring so it never reads as a beard
    if c.get(x, y) == 'A': c.set(x, y, 'B')
    elif c.get(x, y) == 'B' and x < 21: c.set(x, y, 'C')
front = changed(c, s0)
c.edge(front, None)
c.fill(c.mask_of('T'), 'S')
c.fill(c.mask_of('S'), 'R')
c.put(6, 22, ['JJJJIII', 'JIJJIJII', '.JIIJJII', '.JJJJII'])    # her lower face in two tones, the smile drawn in
c.put(7, 19, ['KK']); c.set(12, 19, 'J')                     # a lit cheekbone
PORTRAIT = portrait(c, 'red.mob', 'Mob', 'red', [{'skin': 'deep', 'hair': 'black'}, {'skin': 'freckled', 'hair': 'auburn'},
                                              {'skin': 'olive', 'hair': 'black'}])
