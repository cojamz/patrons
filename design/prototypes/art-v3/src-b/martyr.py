import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Martyr (white, counts as 2): two quiet devotees ready to give everything. In front: a woman in a white hooded robe
# holding a lit candle, eyes closed, at peace. Behind and lower: a young man in a white hood, eyes closed, serene.
# Template: 2 people, front left.
c = new()
bodyB = c.poly([(22, 48), (25, 36), (29, 32.5), (38, 31.5), (44, 34), (47, 39), (47, 48)])
c.fill(bodyB, "2"); c.outside(bodyB, "1", 34, 37, 12, 9); c.rim(bodyB, "3", 0, -1, 1, only="2")
neck(c, 30, 36, 26, 32, n=1)
face(c, 'b13', 27, 19, n=1, eyes='closed', brows='level', mouth='smile')
hB = c.poly([(25, 32), (25, 16), (27, 10.5), (32, 8), (37, 8.5), (41, 11), (42.5, 16), (42.5, 32), (40, 32), (40, 15), (28, 15), (27.6, 32)])
c.fill(hB, '2'); c.outside(hB, '1', 32, 12, 9, 7)
behind(c, 1)
bodyA = c.poly([(0, 48), (0, 41), (3, 37), (9, 35), (24, 35), (30, 37), (33, 41), (34, 48)])
c.fill(bodyA, "3"); c.outside(bodyA, "2", 14, 40, 17, 11); c.outside(bodyA, "1", 12, 39, 21, 14)
c.rim(bodyA, "4", 0, -1, 1, only="3"); c.edge(bodyA, "1")
neck(c, 13, 20, 28, 34)
face(c, 'f16', 9, 20, eyes='closed', brows='level', mouth='smile', glow=True)

hood = c.poly([(5, 36), (5, 18), (7, 10), (12, 6), (19, 5.6), (24.5, 8), (27, 13), (28, 20), (28, 36), (25, 36), (25, 15), (8.5, 15), (8, 36)])
c.fill(hood, '3'); c.fill(hood & c.ellipse(11, 9, 5, 2.6), '4'); c.outside(hood, '2', 15, 13, 12, 14)
c.inner_edge(hood & c.rect(8, 14, 25, 36), lambda k: '1', sides=((1, 0), (0, 1), (-1, 0)))
c.fill(c.rect(9, 15, 24, 16) & c.mask_of('CDB'), 'B')
c.fill(c.line(9, 38, 13, 47), '2')
# the candle, held at the chest
cd = c.rect(17, 37, 20, 46); c.fill(cd, 'k'); c.fill(c.rect(19, 37, 20, 46), 'j'); c.fill(c.rect(17, 37, 20, 37), 'l'); c.edge(cd, 'i')
c.put(18, 32, ['.d', 'dc', 'cb', '.z'])
c.put(15, 42, ['CCCCCCB', 'BCCCCBB', '.BBBB..'])
PORTRAIT = portrait('trading.martyr', 'Martyr', 'white', [{'skin': 'coolbrown', 'hair': 'black'}, {'skin': 'golden', 'hair': 'brown'}], c)
