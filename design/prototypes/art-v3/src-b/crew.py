import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Shift Crew (purple, counts as 2): two workers clocking on. In front: a woman in a gold hard hat and purple coveralls,
# a lunch pail in hand, a warm closed smile. Behind and lower: a man in a flat cap with a moustache, nodding along.
# Template: 2 people, front left.
c = new()
# ---- behind (person 1), right
bodyB = c.poly([(22, 48), (25, 36), (29, 32.5), (38, 31.5), (44, 34), (47, 39), (47, 48)])
c.fill(bodyB, '2'); c.outside(bodyB, '1', 34, 37, 12, 9); c.rim(bodyB, '3', 0, -1, 1, only='2')
neck(c, 30, 36, 26, 32, n=1)
face(c, 'b13', 27, 19, n=1, eyes='open', brows='level', mouth='smile')
c.put(30, 23, ['NNNNNN', 'M....M'])
ear(c, 39, 18, n=1)
capB = c.poly([(26, 15), (27, 11), (31, 9), (38, 9), (41, 11.5), (44, 14), (42, 15.6), (26, 15.6)])
c.fill(capB, 'n'); c.fill(capB & c.rect(0, 9, 47, 10), 'o'); c.fill(capB & c.rect(38, 13, 47, 16), 'm')
behind(c, 1, drop=5)                                                   # template depth +2 (critic)
# ---- in front (person 0), left
bodyA = c.poly([(0, 48), (0, 41), (3, 37), (9, 35), (24, 35), (30, 37), (33, 41), (34, 48)])
c.fill(bodyA, '3'); c.outside(bodyA, '2', 14, 40, 17, 11); c.outside(bodyA, '1', 12, 39, 21, 14)
c.rim(bodyA, '4', 0, -1, 1, only='3'); c.edge(bodyA, '1')
c.put(8, 35, ['22......22', '.22....22.', '..222222..'])                            # bib straps
c.put(10, 39, ['2222', '2442', '2222'][:2])
neck(c, 13, 20, 28, 34)
face(c, 'f16', 9, 20, eyes='dark', brows='raised', mouth='smile', glow=True)
ear(c, 7, 19, 'L')
c.fill(c.poly([(8, 21), (8, 15), (24.5, 15), (24.5, 21), (23.6, 21), (23.4, 17), (9, 17), (8.8, 21)]), 'F')
hat = c.ellipse(16.5, 13.5, 9.5, 7.5) & c.rect(0, 0, 47, 13)
c.fill(hat, 'c'); c.outside(hat, 'b', 15, 12, 8.5, 6.5); c.fill(hat & c.ellipse(13, 9, 3, 1.6), 'd')
c.fill(c.rect(15, 6, 17, 13) & hat, 'b'); c.fill(c.rect(15, 6, 15, 13) & hat, 'd')
brim = c.poly([(4.5, 13.5), (28.5, 13.5), (27.5, 15.6), (5.5, 15.6)]); c.fill(brim, 'c'); c.fill(brim & c.rect(0, 15, 47, 15), 'b')
c.fill(brim & c.rect(22, 14, 47, 15), 'b'); c.edge(hat | brim, 'a')
# lunch pail
pail = c.rect(24, 40, 32, 47)
c.fill(pail, 'g'); c.fill(c.rect(24, 40, 32, 41), 'h'); c.fill(c.rect(30, 42, 32, 47), 'f'); c.fill(c.rect(24, 43, 32, 43), 'f')
c.put(26, 37, ['fffff', 'f...f', 'f...f']); c.edge(pail, 'e')
c.put(21, 41, ['.CCC', 'CCCB', 'BCCB', '.BB.'])
PORTRAIT = portrait('purple.crew', 'Shift Crew', 'purple', [{'skin': 'coolbrown', 'hair': 'black'}, {'skin': 'fair', 'hair': 'brown'}], c, merge={'a': 'b', 'd': 'c', 'm': 'n', 'F': 'n', 'e': 'f', 'h': 'g', 'o': 'n'})
