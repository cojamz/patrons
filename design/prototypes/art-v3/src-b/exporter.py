import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Exporter (white, counts as 2): a shipping pair. In front: a trader in a flat cap and white shirt, sleeves rolled,
# holding a stamped wooden crate, a warm grin. Behind and lower: his partner with a pencil, short hair,
# checking the manifest, pleased. Template: 2 people, front left.
c = new()
bodyB = c.poly([(22, 48), (25, 36), (29, 32.5), (38, 31.5), (44, 34), (47, 39), (47, 48)])
c.fill(bodyB, "2"); c.outside(bodyB, "1", 34, 37, 12, 9); c.rim(bodyB, "3", 0, -1, 1, only="2")
neck(c, 30, 36, 26, 32, n=1)
face(c, 'b13', 27, 19, n=1, eyes='down', brows='level', mouth='smile')
hair(c, [(26.5, 19), (26, 13), (28, 10), (33, 8.6), (38, 9.4), (40.5, 12.5), (40.5, 19), (39.5, 19), (39, 14.5), (33, 13.4), (28, 14.5), (27.5, 19)], 1, 32, 11, 7, 4)
c.fill(c.line(31, 10, 29, 14), 'M')
behind(c, 1, drop=5)
bodyA = c.poly([(0, 48), (0, 41), (3, 37), (9, 35), (24, 35), (30, 37), (33, 41), (34, 48)])
c.fill(bodyA, "3"); c.outside(bodyA, "2", 14, 40, 17, 11); c.outside(bodyA, "1", 12, 39, 21, 14)
c.rim(bodyA, "4", 0, -1, 1, only="3"); c.edge(bodyA, "1")
c.fill(c.poly([(12, 35), (21, 35), (16.5, 40)]), 'B')
c.fill(c.line(16, 40, 16, 47), '2')
neck(c, 13, 20, 28, 34)
face(c, 'f16', 9, 20, eyes='round', brows='raised', mouth='grin')
ear(c, 7, 19, 'L')
hair(c, [(8, 19), (8, 14), (25, 14), (25, 19), (24, 19), (23.4, 16), (10, 16), (9, 19)], 0, 15, 10, 8, 4.5)
cap = c.poly([(7.5, 15), (8, 10.5), (11, 8), (18, 7.5), (24, 8.6), (26, 11), (26, 13), (30, 14), (29, 16), (7.5, 16)])
c.fill(cap, 's'); c.outside(cap, 'r', 15, 10, 10, 4); c.fill(cap & c.rect(0, 15, 47, 16), 'q'); c.fill(cap & c.rect(24, 13, 47, 16), 'q')
c.edge(cap, 'q')
# the crate on his shoulder (our right), stamped
cr = c.poly([(1, 39), (17, 37.5), (18, 48), (1, 48)])
c.fill(cr, 'r'); c.fill(cr & c.rect(0, 37, 18, 39), 's'); c.fill(cr & c.rect(15, 37, 18, 48), 'q')
c.fill(c.line(1, 43, 15, 43), 'q'); c.fill(c.line(8, 40, 8, 47), 'q')
c.put(10, 44, ['uuu', 'u.u', 'uuu'])                                         # the export stamp
c.edge(cr, 'q')
c.put(17, 39, ['.CCC', 'CCCB', 'BCCB', '.BB.'])
PORTRAIT = portrait('trading.exporter', 'Exporter', 'white', [{'skin': 'tan', 'hair': 'darkbrown'}, {'skin': 'freckled', 'hair': 'blonde'}], c)
