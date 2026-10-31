import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *
# Anarchist (colorless): once per round, swap any two members within 2 cost. A cheerful punk: rose mohawk in four spikes, shaved
# sides, a stud in one ear, brows up and a cheeky closed smile. Studded jacket with wide lapels. Prop: a can of
# rose spray paint held up (straight cylinder, domed cap, a grey mist puff off to the side). Frontal. Template: 1 person.
c = Canvas()
body = torso(c, [(1, 48), (2, 41), (6, 36.5), (15, 34), (32, 34), (40, 36.5), (44, 40), (46, 48)], 19, 40)
tee = c.poly([(19, 34), (29, 34), (27, 48), (21, 48)])
c.fill(tee, 'n'); c.fill(tee & c.rect(25, 30, 30, 47), 'm')
lapL = c.poly([(13, 34.4), (19.2, 34), (21.4, 48), (17, 48), (15.4, 40), (11.6, 37)])
lapR = c.poly([(28.8, 34), (35, 34.4), (36.4, 37), (32.6, 40), (31, 48), (26.6, 48)])
c.fill(lapL, '4'); c.edge(lapL, '1'); c.fill(lapR, '2'); c.edge(lapR, '1')
for (x, y) in ((8, 39), (11, 38), (36, 38), (39, 39)): c.put(x, y, ['4', '2'])      # studs on the shoulders
c.fill(c.rect(20, 28, 27, 34), 'A'); c.fill(c.rect(20, 31, 21, 34), 'B')
# ---- face, frontal; deep skin lit from the top-left so it reads at 1x. ruler x 14..33
blk(c, 14, 13, '''
|....BCCCCCCCCCB.....
|...BDDDDDCCCCCCB....
|..BDDDDDDCCCCCCBA...
|..BDDDCCCCCCCCCBA...
|..CDEEECCCCCEEECBA..
|..CCBBBBCDCCBBBBBA..
|..CCBzzBCDCCBzzBBBA.
|..CCyrzCCDCCyrzBBBA.
|..CDDDCCCDCCCCCCBBA.
|..CDDDDCCDBCCCCCBBA.
|..CCDCCCDDABCCCCBBA.
|..BCCCBCCCCCCBCCBBA.
|..BCCCCAAAAAACCCBBA.
|..BCCCCCBBBBCCCCBA..
|...BCCCCDDCCCCCBA...
|....BCCCCCCCCBBA....
|.....ABBBBBBBBA.....
''')
c.put(15, 18, ['D', 'D', 'C', 'B']); c.put(33, 18, ['A', 'B', 'A'])               # ears
c.put(15, 21, ['g'])                                                               # ear stud
# ---- shaved sides with a little stubble shadow, and the mohawk
dome = c.ellipse(23.5, 14.5, 9.2, 6.4) & c.rect(0, 0, 47, 13)
c.fill(dome, 'B'); c.fill(dome & c.ellipse(21, 13, 6, 4), 'C'); c.fill(dome & c.rect(29, 0, 47, 13), 'A')
mo = c.rect(20, 9, 27, 13)
for x0, top in ((19, 2), (21.6, 0), (24.4, 1), (27, 3)):                           # four spikes, gaps between the tips
    mo |= c.poly([(x0, 10), (x0 + 1.1, top), (x0 + 2.6, 10)])
c.fill(mo, 'w'); c.outside(mo, 'v', 22.5, 7, 4.5, 7); c.rim(mo, 'x', -1, 0, 1, only='w'); c.edge(mo, 'u')
c.fill(mo & c.rect(0, 12, 47, 13), 'v')
# ---- the spray can, held up
can = c.rect(37, 19, 42, 33)                                                       # a straight steel cylinder
c.fill(can, 'f'); c.fill(c.rect(37, 19, 38, 33), 'g'); c.fill(c.rect(42, 19, 42, 33), 'e')
c.fill(c.rect(37, 19, 42, 19), 'g')                                                 # rolled top rim
c.fill(c.rect(37, 24, 42, 28), 'w'); c.fill(c.rect(37, 24, 38, 28), 'x'); c.fill(c.rect(42, 24, 42, 28), 'v')     # rose label
c.put(37, 15, ['.wwww.', 'xwwwwv', 'xwwwwv', 'vvvvvv'])                              # domed cap, as wide as the can
c.put(39, 14, ['gg'])                                                              # nozzle button on top
c.put(43, 10, ['.44.', '4444', '.44.'])                                              # a soft grey mist puff, off to the side
hand = c.poly([(35, 31), (37.4, 29.6), (43, 30), (44, 34.4), (41, 36.4), (36, 36)])
c.fill(hand, 'C'); c.rim(hand, 'D', 0, -1, 1, only='C'); c.fill(hand & c.rect(41, 28, 47, 40), 'B'); c.edge(hand, 'A')
c.put(37, 32, ['BB.B'])
# Lighting pass for 1x (deep skin): a D rim down the lit contour, the forehead plane widened, the bridge lit from the
# brows down the nose, the cheekbone joined to it, the near cheek and jaw and the upper lip lit, so the lower face
# isn't a dark mass; a warm bounce (wood r) inside the shadow-side jaw.
lit = [(16, y) for y in range(17, 28)] + [(23, 15), (24, 15), (25, 15)] + [(x, 16) for x in range(17, 24)] + \
      [(22, 17), (23, 17), (24, 17), (22, 18), (24, 18), (22, 19), (22, 20), (21, 21), (22, 21), (21, 22), (22, 22),
       (20, 21), (17, 23), (19, 23), (20, 23), (17, 24), (18, 24), (19, 24), (22, 24), (23, 24), (24, 24), (17, 25), (18, 25), (19, 25), (17, 26), (18, 26), (19, 26)]
for (x, y) in lit:
    if c.get(x, y) in 'BC': c.set(x, y, 'D')
c.set(20, 24, 'C')                                                                  # no dark speck on the lit cheek
for y in range(20, 27):
    if c.get(31, y) == 'B' and c.get(32, y) == 'A': c.set(31, y, 'r')
PORTRAIT = portrait('benders.anarchist', 'Anarchist', c, [{'skin': 'deep', 'hair': 'black'}], 'rose')
