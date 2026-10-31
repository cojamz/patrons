import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *
# Alchemist (colorless; card id freelancer): pay any member's colored part in any colors. An old alchemist with a
# cloud of white hair, brass goggles pushed up on her forehead, brows up in delight (round bright eyes, closed mouth) at the round flask of teal brew
# she holds up to the light (bubbles in the neck). High-collared lab coat. True 3/4 to our right. Template: 1 person.
c = Canvas()
body = torso(c, [(1, 48), (2, 41), (6, 36.5), (15, 34), (31, 34), (39, 36), (44, 40), (46, 48)], 18, 40)
c.fill(c.rect(20, 28, 27, 34), 'A'); c.fill(c.rect(20, 31, 21, 34), 'B')
col = c.poly([(16, 31.5), (20, 33.5), (24, 34), (24, 38.5), (21, 40), (15, 36)])
c.fill(col, '4'); c.edge(col, '1')
colR = c.poly([(24, 34), (28, 33.5), (32, 31.5), (33, 36), (27, 40), (24, 38.5)])
c.fill(colR, '2'); c.edge(colR, '1')
c.fill(c.line(24, 39, 24, 47), '1')
c.put(9, 41, ['1111', '1222', '1222'])                                             # breast pocket
# ---- wild white hair, a cloud behind the head
hair = c.poly([(9, 22), (8.5, 16), (10, 11), (9, 7), (13, 5), (15, 2.5), (20, 2.2), (24, 1), (28, 2.5), (33, 2.4), (35, 5.5),
               (38.5, 7), (37.5, 11), (39, 15), (37, 20), (34, 23), (33, 16), (16, 15), (14, 24), (11, 25)])
c.fill(hair, 'G'); c.outside(hair, 'F', 22, 9, 15, 10); c.rim(hair, 'H', -1, -1, 1, only='G')
for (x, y) in ((11, 15), (17, 5), (27, 4), (34, 8)): c.put(x, y, ['FF', '.FF'])     # locks
# ---- face, 3/4 to our right, brows up, small round mouth. ruler x 14..33
blk(c, 14, 15, '''
|.CCDDDDCCCCCCCCCBBA.
|.CCCFFFFCCCCCFFFBBA.
|.CCBBBBBBCCCBBBBBBA.
|.CBCCC!zBDCBC!zBBBA.
|.CACCCzzBDCBCzzBBBA.
|.CACCCCCCCDBCCCBBBA.
|.CBDDDCCCCDBCCCBBBA.
|..BCDDCCCCDDABCBBBA.
|..BCCCCCCCCBBBCBBBA.
|..BCCCCACCCACCCBBA..
|..BCCCCCCAAACCBBBA..
|...BCCCDDCCCCBBBA...
|....BBCCCCCCBBBA....
|.....ABBBBBBBBA.....
''')
c.put(13, 19, ['C', 'D', 'C'])
# ---- brass goggles pushed up on the forehead, strap round the hair
c.fill(c.poly([(9, 10.6), (38, 9.6), (38, 11.6), (9, 12.6)]), '1')
for x0 in (16, 24):
    c.put(x0, 9, ['.ddb.', 'dxwvb', 'dwvvb', '.bbb.'])
c.put(21, 10, ['bbb'])
# ---- the flask, held up in her hand
bulb = c.ellipse(39.5, 33, 5.6, 5.4)
neck = c.rect(38, 22, 40, 28)
glass = bulb | neck
c.fill(glass, ':')
c.fill(c.rect(37, 21, 41, 22), '4'); c.fill(c.rect(37, 22, 41, 22), '2')                      # lip
brew = bulb & c.rect(0, 31, 47, 47)
c.shade(brew, 'vwx', 38, 32, 6, 6, [0.0, 0.6])
c.fill(brew & c.rect(0, 31, 47, 31), 'x')
for p in ((39, 27), (38, 25), (40, 29), (36, 33), (41, 34)): c.set(*p, 'x')         # bubbles
c.put(35, 29, ['"', '"']); c.set(36, 28, '"')                                       # glint on the glass
wall = {(x, y) for (x, y) in glass if any((x + a, y + b) not in glass for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1)))}
c.fill(wall - c.rect(0, 21, 47, 22), '4'); c.fill((wall & c.rect(40, 23, 47, 47)) - c.rect(0, 21, 47, 22), '2')
hand = c.poly([(33, 40), (36, 37.5), (43, 37.5), (45.5, 40), (43, 43), (35, 43)])
c.fill(hand, 'C'); c.rim(hand, 'D', 0, -1, 1); c.fill(hand & c.rect(42, 35, 47, 47), 'B'); c.edge(hand, 'A')
c.put(35, 38, ['DCBCBCB'])                                                        # knuckles round the flask
PORTRAIT = portrait('benders.freelancer', 'Alchemist', c, [{'skin': 'freckled', 'hair': 'white'}], 'teal')
