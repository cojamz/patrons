import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Martyr (white, counts as 2): two quiet devotees ready to give everything, in plain white robes, bare-headed (no veils:
# final review, veils read as nun/hijab costume). In front: a woman with shoulder-length black hair, holding a lit
# candle, eyes closed, at peace. Behind and lower: a young man with short cropped curls, eyes closed, serene.
# Template: 2 people, front left.
c = new()
bodyB = c.poly([(22, 48), (25, 36), (29, 32.5), (38, 31.5), (44, 34), (47, 39), (47, 48)])
c.fill(bodyB, "2"); c.outside(bodyB, "1", 34, 37, 12, 9); c.rim(bodyB, "3", 0, -1, 1, only="2")
neck(c, 30, 36, 26, 32, n=1)
c.fill(c.poly([(29.5, 32), (36.5, 32), (33, 35)]), 'J')                            # plain round neckline
face(c, 'b13', 27, 19, n=1, eyes='closed', brows='level', mouth='smile')
hair(c, [(26.5, 18), (26, 13), (28, 10), (33, 8.6), (38, 9.4), (40.5, 12.5), (40.5, 18), (39.6, 18), (39, 14.6), (33, 13.6), (28, 14.6), (27.5, 18)], 1, 32, 11, 7, 4)
for x in (28, 31, 34, 37): c.put(x, 10, ['M.', '.M'])                               # cropped curls
behind(c, 1)
bodyA = c.poly([(0, 48), (0, 41), (3, 37), (9, 35), (24, 35), (30, 37), (33, 41), (34, 48)])
c.fill(bodyA, "3"); c.outside(bodyA, "2", 14, 40, 17, 11); c.outside(bodyA, "1", 12, 39, 21, 14)
c.rim(bodyA, "4", 0, -1, 1, only="3"); c.edge(bodyA, "1")
neck(c, 13, 20, 28, 34)
c.fill(c.poly([(12, 35), (21, 35), (16.5, 38.5)]), 'B')                              # plain round neckline
c.fill(c.line(9, 38, 13, 47), '2')
face(c, 'f16', 9, 20, eyes='closed', brows='level', mouth='smile', glow=True)
hair(c, [(7, 31), (6.5, 20), (7.5, 12), (10.5, 8), (16, 6.5), (22, 7.5), (25.5, 11), (26.5, 20), (26, 31), (24.4, 31), (24.4, 17),
         (23, 14), (17, 12.6), (11, 14), (9.4, 17), (9.2, 31)], 0, 16, 10, 12, 8)     # shoulder-length, side parting
c.fill(c.line(17, 7, 15, 12), 'E')
# the candle, held at the chest
cd = c.rect(17, 37, 20, 46); c.fill(cd, 'k'); c.fill(c.rect(19, 37, 20, 46), 'j'); c.fill(c.rect(17, 37, 20, 37), 'l'); c.edge(cd, 'i')
c.put(18, 32, ['.d', 'dc', 'cb', '.z'])
c.put(15, 42, ['CCCCCCB', 'BCCCCBB', '.BBBB..'])
PORTRAIT = portrait('trading.martyr', 'Martyr', 'white', [{'skin': 'coolbrown', 'hair': 'black'}, {'skin': 'golden', 'hair': 'brown'}], c)
