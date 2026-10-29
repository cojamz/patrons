import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *
# Anarchist (colorless): once per round, swap any two members within 2 cost. A cheerful punk: rose mohawk in four spikes, shaved
# sides, a stud in one ear, brows up and a cheeky closed smile. Studded jacket with wide lapels. Prop: a can of
# rose spray paint held up, mid-tag. Frontal. Template: 1 person.
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
can = c.rect(37, 21, 42, 33)
c.fill(can, 'f'); c.fill(c.rect(37, 21, 38, 33), 'g'); c.fill(c.rect(37, 21, 37, 33), 'g'); c.fill(c.rect(42, 21, 42, 33), 'e')
c.fill(c.rect(37, 26, 42, 28), 'w'); c.fill(c.rect(37, 26, 38, 28), 'x'); c.fill(c.rect(42, 26, 42, 28), 'v')     # label band
c.put(38, 18, ['.vv.', 'wwwv', 'gggf']); c.put(37, 18, ['u'])                       # cap and nozzle
c.put(32, 15, ['.x...', 'xwx.x', '.x.w.'])                                          # a puff of paint
hand = c.poly([(35, 31), (37.4, 29.6), (43, 30), (44, 34.4), (41, 36.4), (36, 36)])
c.fill(hand, 'C'); c.rim(hand, 'D', 0, -1, 1, only='C'); c.fill(hand & c.rect(41, 28, 47, 40), 'B'); c.edge(hand, 'A')
c.put(37, 32, ['BB.B'])
PORTRAIT = portrait('benders.anarchist', 'Anarchist', c, [{'skin': 'deep', 'hair': 'black'}], 'rose')
