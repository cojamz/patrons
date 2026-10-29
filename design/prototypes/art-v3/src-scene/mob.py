import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _liba import *

# Mob (red, counts as 5), scene version (Cory, Oct 29: "the mob should look like a mob, have pitchforks etc. those just
# look like fans"). An angry village mob: five faces, brows down, shouting. The two front-side men each raise a hay fork
# at the card's edges (fist on the pole, sleeve running down to the shoulder); a torch goes up in the middle in a fist
# between the two behind. Lead in front centre is the fair woman shouting; the deep-skinned man front left and the
# olive man front right are equals beside her. Tines in pale 'y' (ink outline, no new color), poles in hair brown,
# the flame in the sphere ramp with a pale core (fire on a red card, no new color).
c = Canvas()

def darker(mask, keys, d):
    for x, y in mask:
        k = c.get(x, y)
        if k in keys: c.set(x, y, step(k, d))

def fork(x, y, pole_to):
    """A hay fork, tines up (critic round 2): three 1px tines with 1px gaps at x, x+2, x+4; the outer two flare out
    1px just above the crossbar; a curved base; the pole at x+2."""
    for t in (0, 2, 4): c.fill(c.rect(x + t, y, x + t, y + 3), 'y')
    c.set(x - 1, y + 4, 'y'); c.set(x + 2, y + 4, 'y'); c.set(x + 5, y + 4, 'y')
    c.fill(c.rect(x - 1, y + 5, x + 5, y + 5), 'y'); c.fill(c.rect(x, y + 6, x + 4, y + 6), 'y')
    c.fill(c.rect(x + 2, y + 7, x + 2, pole_to), 'F')

def fist(p, x, y):
    """A 3x3 fist round a pole (critic round 2), lit top-left, with a 1px sleeve under it."""
    stamp(c, x, y, ['332', '322', '211'], p)
    c.fill(c.rect(x, y + 3, x + 2, y + 3), '2')

GRIP = ['.3322.',
        '332221',
        '000000',
        '322110',
        '.1110.']

def raised_arm(p, x0, top, mirror=False):
    """A forearm raised straight up at the card's edge, a fist on the pole: lit column, mid, shadow column; the elbow
    leaves the frame at the bottom outside corner."""
    stamp(c, x0, top, GRIP, p, mirror=mirror)
    xs = range(x0 + 1, x0 + 5) if not mirror else range(x0 + 1, x0 + 5)
    for y in range(top + 5, top + 14):
        if y < top + 9: row = tr('3221', p) if not mirror else tr('1223', p)      # bare forearm, sleeves rolled
        elif y == top + 9: row = '4444'                                            # the rolled cuff
        else: row = '4332' if not mirror else '2334'
        for i, x in enumerate(xs): c.set(x, y, row[i])
    el = c.poly([(x0 + (0 if not mirror else 2), top + 12), (x0 + (5 if not mirror else 7), top + 12), (x0 + (5 if not mirror else 7), top + 16), (-1 if not mirror else 48, top + 18), (-1 if not mirror else 48, top + 13)])
    for (x, y) in el:
        if c.get(x, y) == '.': c.set(x, y, '2' if y > top + 13 else '3')

# ---- the torch in the middle (behind the back two)
c.fill(c.rect(23, 12, 24, 24), 'F')
c.put(19, 0, ['.....3....',
              '....33....',
              '....3d3...',
              '...3dd3...',
              '...3ddd3..',
              '..33ddd3..',
              '..3dyyd33.',
              '.33dyyyd3.',
              '.33ddydd3.',
              '..33ddd3..',
              '...3333...'])
c.put(21, 11, ['EEEE', 'EEEE'])                                                     # the pitch-soaked wrap
# ---- the back two (smaller, a step darker), shouting either side of the torch
s = snap(c)
body(c, [(7, 34), (8, 27), (10, 25), (19, 25), (21, 27), (22, 34)], front=False)
neck(c, 2, 12, 16, 22, 25)
face(c, 2, 9, 18, 11, 4, 4, view='r', eyes='stern', mouth='open', jaw='square', hp=0, ears=False, cheek=False)
h = c.poly([(8.4, 18), (8.4, 14.6), (10, 12.6), (14.5, 12), (18.6, 12.8), (20.4, 15), (20.4, 17), (19, 15.6), (14, 15.2), (10, 15.6), (9.6, 18)])
hair(c, h, 2, 14, 13.5, 5, 2, lit=False, hp=0)
body(c, [(26, 34), (27, 27), (29, 25), (38, 25), (40, 27), (41, 34)], front=False)
neck(c, 0, 31, 35, 22, 25)
face(c, 0, 28, 18, 11, 4, 4, view='l', eyes='stern', mouth='stern', jaw='oval', ears=False, cheek=False)
h = c.poly([(27.4, 18), (27.4, 14), (29.6, 12), (34, 11.4), (37.6, 12.4), (39.6, 14.6), (39.6, 19), (38.4, 16), (34, 15), (29.4, 15.4), (28.6, 18)])
hair(c, h, 0, 33, 13, 5, 2, lit=False, hp=1)
c.rim(h, 'F', -1, -1, 1, only='N')
back = changed(c, s)
darker(back, 'ABCD', -1); darker(back, '12345', -1)
c.edge(back, None)
# the torch fist, between them: knuckles to us, the pole through it
stamp(c, 22, 14, ['3322', '3221', '2111'], 2)                                   # a fist round the torch

# ---- the two forks, raised by the front-side men at the card's edges
fork(3, 3, 21); fork(40, 3, 21)
fist(2, 4, 16); fist(0, 41, 16)                                                   # held up from behind the front row
# ---- front row: three equal heads (eye row 30)
def front_body(x0, x1):
    body(c, [(x0, 48), (x0 + 0.5, 41), (x0 + 3, 38.4), ((x0 + x1) / 2, 37.6), (x1 - 3, 38.4), (x1 - 0.5, 41), (x1, 48)])

s1 = snap(c)
front_body(-3, 17)
neck(c, 1, 7, 11, 35, 38)
face(c, 1, 4, 30, 12, 5, 5, view='r', eyes='stern', mouth='stern', jaw='square', look='warm', dk=True, ears=False)
m = c.poly([(3.4, 28), (3.4, 25), (5, 23), (8, 22.2), (12, 22.2), (15, 23.4), (16.4, 26), (16.4, 28), (15.4, 26.6), (13, 25.4), (8, 25.4), (5.4, 26.2), (4.4, 28)])   # close crop
hair(c, m, 1, 10, 23, 6, 2.2, lit=False)
c.rim(m, 'F', -1, -1, 1, only='N')
front_body(31, 51)
neck(c, 2, 37, 41, 35, 38)
face(c, 2, 33, 30, 12, 5, 5, view='l', eyes='stern', mouth='open', jaw='oval', hp=1, ears=False)
m = c.poly([(32.4, 29), (32.4, 24.4), (34, 22.4), (38, 21.4), (43, 21.8), (45.6, 24), (45.6, 28), (44.4, 26), (41, 25), (36, 26.6), (33.6, 26.2), (33.4, 29)])   # swept to one side
hair(c, m, 2, 39, 23, 6, 2.2, lit=False, hp=1)
c.rim(m, 'F', -1, -1, 1, only='N')
sides = changed(c, s1)
c.edge(sides, None)
# ---- centre lead, drawn last
s0 = snap(c)
front_body(13, 35)
neck(c, 0, 21, 26, 36, 38)
face(c, 0, 17, 30, 14, 5, 6, view='f', eyes='stern', mouth='open', jaw='round')
h = c.poly([(15.6, 33), (15.6, 25), (17.6, 22.6), (24, 21.4), (30.4, 22.6), (32.4, 25), (32.4, 33), (31.2, 31), (31, 26.4),
            (28, 25), (20, 25), (17, 26.4), (16.8, 33)])
hair(c, h, 0, 24, 23, 7, 3, lit=False)
front = changed(c, s0)
c.edge(front, None)
# shouting mouths 2x2 dark on the lead and the olive man (no tooth pixel: house rule; the deep-skinned man keeps a
# closed shout-line, house rule against open lips on very deep faces)
for (x0, x1) in ((17, 31), (33, 45)):
    zs = [(x, y) for y in range(33, 38) for x in range(x0, x1) if c.get(x, y) == 'z']
    if zs:
        y = min(v for _, v in zs); xs = sorted({u for u, v in zs if v == y})[:2]
        if len(xs) == 1: xs = [xs[0], xs[0] + 1]
        for x in xs: c.set(x, y, 'z'); c.set(x, y + 1, 'z')
c.put(36, 33, ['zz', 'zz', 'RR'])                                                   # the olive man's shout, up off the chin
# 1px shoulder seams between the three red shirts
lead = c.poly([(13, 48), (13.5, 41), (16, 38.4), (24, 37.6), (32, 38.4), (34.5, 41), (35, 48)])
for y in range(39, 48):
    xs = [x for (x, v) in lead if v == y]
    for x in (min(xs), max(xs)):
        if c.get(x, y) in '12345': c.set(x, y, '1')
for a, b in (('T', 'S'), ('D', 'C'), ('5', '4'), ('!', 'y')): c.fill(c.mask_of(a), b)   # stay inside the color cap
PORTRAIT = portrait(c, 'red.mob', 'Mob', 'red', [{'skin': 'fair', 'hair': 'brown'}, {'skin': 'deep', 'hair': 'black'},
                                              {'skin': 'olive', 'hair': 'black'}])
