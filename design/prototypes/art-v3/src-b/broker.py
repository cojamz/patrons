import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Broker (white, counts as 2): a trading-floor pair. In front: a broker in a white shirt with the sleeves rolled and a
# loosened navy tie, a cream phone receiver at his ear, mid-call and pleased (brows up, closed smile). Behind and lower:
# a colleague in glasses with her hair up, smiling at the numbers. Template: 2 people, front left.
c = new()
bodyB = c.poly([(22, 48), (25, 36), (29, 32.5), (38, 31.5), (44, 34), (47, 39), (47, 48)])
c.fill(bodyB, "2"); c.outside(bodyB, "1", 34, 37, 12, 9); c.rim(bodyB, "3", 0, -1, 1, only="2")
neck(c, 30, 36, 26, 32, n=1)
c.fill(c.poly([(29, 32), (37, 32), (33, 36)]), 'J')
face(c, 'b13q', 27, 19, n=1, eyes='right', brows='level', mouth='smile')
hair(c, [(26.5, 21), (26, 14), (28, 10.5), (32, 9), (37, 9.5), (40, 12), (40.5, 18), (39.5, 18), (38.8, 15), (34, 13.6), (28, 14.5), (27.6, 21)], 1, 32, 11, 7, 4)
bun = c.ellipse(39, 9, 2.6, 2.4); c.fill(bun, 'N'); c.fill(bun & c.ellipse(38.4, 8.4, 1.5, 1.3), 'O')
behind(c, 1)
bodyA = c.poly([(0, 48), (0, 41), (3, 37), (9, 35), (24, 35), (30, 37), (33, 41), (34, 48)])
c.fill(bodyA, "3"); c.outside(bodyA, "2", 14, 40, 17, 11); c.outside(bodyA, "1", 12, 39, 21, 14)
c.rim(bodyA, "4", 0, -1, 1, only="3"); c.edge(bodyA, "1")
c.fill(c.poly([(12, 35), (21, 35), (16.5, 40)]), 'B')
c.fill(c.poly([(15, 38), (17.5, 38), (17.2, 40.2), (15.2, 40.2)]), 'v'); tie = c.poly([(15.2, 40.2), (17, 40.2), (19.5, 46.5), (17.5, 48), (16, 46)])
c.fill(tie, 'w'); c.fill(tie & c.rect(18, 40, 20, 48), 'v')                      # loosened tie, knot pulled down, slanted
c.fill(c.line(9, 36, 11, 47), '2'); c.fill(c.line(24, 36, 22, 47), '2')
neck(c, 13, 20, 28, 34)
face(c, 'f16', 9, 20, eyes='open', brows='raised', mouth='smile', glow=True, iris='i')
c.put(10, 15, ['DDDD', '.DD.'])
ear(c, 7, 19, 'L')
hair(c, [(8, 18), (8, 12), (10, 8.5), (16, 7), (22, 7.5), (25, 10.5), (25, 18), (24, 18), (23.4, 14), (10, 14), (9, 18)], 0, 15, 10, 8, 4.5)
# the phone receiver at his ear, curly cord
rc = c.poly([(22, 13), (26, 12), (28.5, 15), (27, 27), (24, 30), (21.5, 28.5), (24, 25.5), (25, 16), (22.5, 15.5)])
c.fill(rc, 'k'); c.fill(rc & c.rect(26, 12, 30, 30), 'j'); c.fill(rc & c.rect(22, 12, 25, 14), 'l'); c.edge(rc, 'i')   # cream handset
c.put(26, 30, ['.CCC', 'CCCB', 'CCBB', '.BB.'])
PORTRAIT = portrait('trading.broker', 'Broker', 'white', [{'skin': 'deep', 'hair': 'black'}, {'skin': 'porcelain', 'hair': 'brown'}], c, accent='navy', merge={'H': 'G', 'e': 'm', 'p': 'o', 'l': 'k', 'M': 'N'})
