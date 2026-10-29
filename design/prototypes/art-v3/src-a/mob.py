import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Mob (red, counts as 5): a cheering home crowd, not an angry one. Final review: no one face leads the card. The front
# row is three equal heads side by side: a freckled woman in the centre cheering (open mouth), an olive man on the left
# holding up a cream pennant with a star, a deep-skinned man on the right laughing, eyes creased. Two more faces peek
# over their shoulders. Three tones across five people, no torches, no fists, no scowls.
c = Canvas()

def darker(mask, keys, d):
    for x, y in mask:
        k = c.get(x, y)
        if k in keys: c.set(x, y, step(k, d))

# ---- the back two, peeking between the front heads (reuse the olive and freckled ramps, a step darker)
s = snap(c)
body(c, [(5, 30), (6, 23), (9, 20.5), (14, 20), (19, 21), (22, 24), (22, 30)], front=False)
neck(c, 2, 11, 15, 17, 21)
face(c, 2, 8, 13, 10, 3, 4, view='r', eyes='smile', mouth='smile', jaw='round', hp=1, ears=False, cheek=False)
h = c.poly([(7, 14), (7.4, 9.4), (9.5, 7.2), (13.5, 6.8), (17, 8), (18.4, 11), (18.2, 13), (17.4, 11), (14, 9.8), (9.4, 10),
            (8, 14)])
hair(c, h, 2, 12, 8, 5, 2.4, lit=False, hp=1)
body(c, [(26, 30), (27, 24), (30, 21), (34, 20), (39, 20.5), (42, 23), (43, 30)], front=False)
neck(c, 0, 32, 36, 17, 21)
face(c, 0, 29, 13, 10, 3, 4, view='l', eyes='laugh', mouth='smile', jaw='oval', ears=False, cheek=False)
h = c.poly([(28, 15), (28, 9.6), (30, 7.4), (34, 6.6), (37.6, 7.6), (39.6, 10), (39.6, 15), (38.4, 14), (38, 11), (35, 9.8),
            (30.6, 10), (29.2, 11.4), (29.2, 15)])
hair(c, h, 0, 33, 8, 5, 2.4, lit=False)
back = changed(c, s)
darker(back, 'ABCDQRST', -1); darker(back, '12345', -1)

# ---- front row, three equal heads (w 14, eye row 26): left olive (person 2), right deep (person 1), centre freckled (0)
def front_body(x0, x1):
    body(c, [(x0, 48), (x0 + 0.5, 38), (x0 + 3, 35.4), ((x0 + x1) / 2, 34.6), (x1 - 3, 35.4), (x1 - 0.5, 38), (x1, 48)])

def cap(x0, p, hp, cy=19.4, lit=False):                       # short hair over a w-14 head at x0
    m = c.poly([(x0 - 1, 25), (x0 - 0.8, 21.4), (x0 + 1.4, 19), (x0 + 7, 17.8), (x0 + 12.6, 19), (x0 + 14.8, 21.4), (x0 + 14.8, 25),
                (x0 + 13.6, 24), (x0 + 13, 22.4), (x0 + 7, 21.6), (x0 + 1, 22.4), (x0 + 0.2, 25)])
    hair(c, m, p, x0 + 7, cy, 6.5, 2.8, lit=lit, hp=hp)

s1 = snap(c)
front_body(-3, 18)
neck(c, 2, 5, 10, 31, 35)
face(c, 2, 1, 26, 14, 4, 6, view='r', eyes='smile', mouth='o', jaw='square', hp=1, look='dot')
cap(1, 2, 1)
front_body(30, 51)
neck(c, 1, 37, 42, 31, 35)
face(c, 1, 33, 26, 14, 4, 6, view='l', eyes='smile', mouth='smile', jaw='oval', look='warm', dk=True, plane=True)
cap(33, 1, 1)
sides = changed(c, s1)
# the pennant, held up by the olive man on the left
c.fill(c.rect(0, 0, 0, 36), 'y'); c.fill(c.rect(1, 0, 1, 36), '1')               # a pale pole
pn = c.poly([(1.6, 0.4), (1.6, 8.4), (14, 4.4)])                                 # a cream pennant flying sideways
c.fill(pn, 'y'); c.edge(pn, 'z')
c.put(3, 2, ['..3..', '33333', '.333.', '.3.3.'])                                 # a red five-point star
hand(c, 0, 35, 2, 'grip')
# ---- centre front (person 0): drawn last, the same size as the other two
s0 = snap(c)
front_body(13.5, 34.5)
neck(c, 0, 21, 26, 31, 35)
face(c, 0, 17, 26, 14, 4, 6, view='f', eyes='smile', mouth='open', jaw='oval', look='iris')
for x, y in ((19, 28), (28, 28)):
    if c.get(x, y) in 'CD': c.set(x, y, 'B')                                       # freckles
h = c.poly([(15.6, 30), (15.6, 22), (17.6, 19.2), (24, 17.8), (30.4, 19.2), (32.4, 22), (32.4, 30), (31.2, 29), (31, 23.4),
            (28, 21.6), (20, 21.6), (17, 23.4), (16.8, 30)])
hair(c, h, 0, 24, 19, 7, 3)
front = changed(c, s0)
c.edge(front, None)
for a, b in (('D', 'C'), ('T', 'S'), ('G', 'F')): c.fill(c.mask_of(a), b)   # stay inside the color cap
if c.get(39, 21) == '2': c.set(39, 21, 'N')
PORTRAIT = portrait(c, 'red.mob', 'Mob', 'red', [{'skin': 'freckled', 'hair': 'auburn'}, {'skin': 'deep', 'hair': 'black'},
                                              {'skin': 'olive', 'hair': 'black'}])
