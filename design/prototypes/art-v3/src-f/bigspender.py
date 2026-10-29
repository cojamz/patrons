import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *
import math
# Big Spender (colorless): once per game, recruit twice this turn. A round, bald old charmer laughing with his eyes
# shut, white tufts over the ears, a double chin, green bow tie, dinner jacket with shawl lapels. Prop: a fan of
# green banknotes held up beside his face. Frontal. Template: 1 person.
c = Canvas()
body = torso(c, [(0, 48), (0, 40), (3, 36), (10, 33.5), (18, 32.5), (30, 32.5), (38, 33.5), (44, 36), (47, 40), (47, 48)], 18, 39)
shirt = c.poly([(19, 32.5), (29, 32.5), (24, 46)])
c.fill(shirt, 'k'); c.fill(shirt & c.rect(25, 32, 30, 47), 'j')
lapL = c.poly([(13, 33.5), (19.2, 32.5), (24, 46), (21, 46.5), (14.5, 38)])
lapR = c.poly([(28.8, 32.5), (35, 33.5), (33.5, 38), (27, 46.5), (24, 46)])
c.fill(lapL, '4'); c.rim(lapL, '5', -1, 0, 1); c.edge(lapL, '1'); c.fill(lapR, '2'); c.edge(lapR, '1')
c.fill(c.rect(19, 28, 28, 32), 'A'); c.fill(c.rect(19, 30, 20, 32), 'B')
c.put(19, 31, ['vw.....wv', 'vwwxuxwwv', 'uvvwuwvvu', '.u.....u.'])                # green bow tie
# ---- face, round and frontal. ruler x 14..33
blk(c, 14, 9, '''
|......BCCCCCCB......
|....BCDDDCCCCCBA....
|...BCDDDDCCCCCCBA...
|..BCDDDCCCCCCCCCBA..
|..BCDDCCCCCCCCCCBBA.
|.BCCCCCCCCCCCCCCCBA.
|.GCCCCCCCCCCCCCCCBG.
|.GCCFFFCCCCCFFFCCBG.
|.GCBBBBBCCCBBBBBCBG.
|.GCCBzzBCDCCBzzBCBG.
|.GCCzDDzCDCCzCCzBBG.
|.GCDDDCCCDBCCDDCBB..
|..CDDDCCCDDABCCCBBA.
|..BCCBCCCCCCCBCCBBA.
|..BCCCAzzzzzACCCBBA.
|..BCCCCAzzzACCCCBBA.
|..BCCCCCAAACCCCCBA..
|..BBCCCCCCCCCCCBBA..
|...BBBCDDDCCCBBBA...
|....ABBCCCCCBBBA....
''')
for cx, k in ((14.4, 'G'), (33.2, 'F')):                                          # white tufts behind the ears
    c.fill(c.ellipse(cx, 16.5, 2.1, 3.4), k, only='.G')
c.fill(c.mask_of('G') & c.rect(13, 18, 15, 23), 'F'); c.fill(c.mask_of('F') & c.rect(33, 17, 35, 23), 'E')
c.put(14, 18, ['DC', 'CB', 'CB', '.B']); c.put(32, 18, ['BA', 'BA', 'BA', 'A.'])   # ears in front of them
# ---- a fan of banknotes in his raised hand, beside his face
px, py = 38.5, 36
for ang in (-26, -7, 12, 31):
    a = math.radians(ang); ux, uy = math.sin(a), -math.cos(a); vx, vy = math.cos(a), math.sin(a)
    corners = [(px + ux * 2 + vx * s * 3.2, py + uy * 2 + vy * s * 3.2) for s in (-1, 1)]
    corners += [(px + ux * 12 + vx * s * 3.2, py + uy * 12 + vy * s * 3.2) for s in (1, -1)]
    note = c.poly(corners)
    c.fill(note, 'x'); c.rim(note, 'w', 1, 1, 1); c.edge(note, 'u')
    mx, my = px + ux * 8.5, py + uy * 8.5
    c.fill(c.ellipse(mx, my, 1.4, 1.6) & note, 'w')
hand = c.poly([(34, 36), (37, 32.5), (41, 32.5), (42.5, 36), (40, 39), (35, 39)])
c.fill(hand, 'C'); c.fill(hand & c.rect(38, 30, 47, 47), 'B'); c.rim(hand, 'D', 0, -1, 1, only='C'); c.edge(hand, 'A')
PORTRAIT = portrait('benders.bigspender', 'Big Spender', c, [{'skin': 'porcelain', 'hair': 'white'}], 'green')
