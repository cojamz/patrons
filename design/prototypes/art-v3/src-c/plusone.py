import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Plus-One (blue, counts as 2): a party invitation for two. In front, left: a woman with a big round crop of black
# curls, 3/4 to our right, warm smile, holding up the invitation (a card with a red wax seal). Behind, right, lower and
# a value darker: her plus-one, a fair man with a blond quiff and a red bow tie, delighted to be asked (brows up,
# open smile). Template: 2 people, front left.
c = Canvas()
# ---- behind (person 1), right
bodyB = c.poly([(22, 48), (24, 36), (28, 31), (38, 30), (45, 32.5), (47, 37), (47, 48)])
c.fill(bodyB, '2'); c.outside(bodyB, '1', 33, 36, 12, 8)
neck(c, 31, 36, 25, 30, p=1, back=True)
c.put(30, 30, ['vv.vv', 'vvuvv', 'uu.uu'])                                         # bow tie
fb = face(c, (27, 11, 39, 25), 20, p=1, back=True, view='front', jaw='narrow', mouth='smile', brows='raised', eyes='laugh', mouth_dy=3)
quiff = c.poly([(26, 17), (26, 12), (28, 8), (32, 6), (38, 6.5), (41, 9), (40.5, 15), (39.5, 13.5), (33, 12.4), (28, 13.4), (27.5, 17)])
c.fill(quiff, 'O'); c.outside(quiff, 'N', 31, 9, 9, 4.6)
# ---- in front (person 0), left
bodyA = c.poly([(0, 48), (0, 41), (3, 37), (9, 35), (22, 35), (28, 37), (31, 41), (32, 48)])
c.fill(bodyA, '3'); c.outside(bodyA, '2', 13, 40, 15, 10); c.outside(bodyA, '1', 11, 39, 19, 13)
c.rim(bodyA, '4', 0, -1, 1, only='3')
c.fill(c.poly([(11, 35), (20, 35), (15.5, 39)]), 'C'); c.fill(c.poly([(17, 35), (20, 35), (15.5, 39)]), 'B')   # neckline
neck(c, 13, 18, 28, 35)
f = face(c, (9, 11, 24, 28), 20, view='r', jaw='narrow', mouth='smile', brows='arch', eyes='round', look=1)
# curls: a big round crop, lit top-left, darker clusters for the curl mass
curls = c.ellipse(16.5, 15, 11, 10) - c.poly([(10, 18), (11, 15), (16, 14.2), (23, 15.2), (24.6, 18), (25, 29), (10, 29)])
c.fill(curls, 'F'); c.outside(curls, 'E', 14.5, 12.5, 9.5, 9); c.rim(curls, 'G', -1, -1, 1, only='F')
for (x, y) in ((10, 8), (16, 6), (21, 9), (8, 14), (13, 11), (24, 13), (18, 11)):
    c.put(x, y, ['GF', 'FE'])
c.edge(curls | (c.mask_of('ABCDyz!') & c.rect(0, 0, 25, 34)), None)
# the invitation: a card with a seal, in her hand
card = c.poly([(1, 47), (3, 37.5), (13, 38.5), (12, 48)])
c.fill(card, 'y'); c.fill(card & c.rect(10, 37, 14, 48), 'k')
c.put(6, 41, ['.vv', 'vvv', 'vvu'])
c.put(11, 44, ['.CD', 'CCC', 'BCC', '.BB'])
c.g = [[('y' if k == '!' else k) for k in r] for r in c.g]                  # glints share the eye white
# his eyes keep their whites and pupils (a step darker skin round them, not dead eyes)
seg(c, {   # his face, by hand: brows up, laughing eyes, a closed smile
    14: [(28, 'JJJJJJJJJJII')],
    15: [(28, 'JJJJJJJJJJII')],
    16: [(28, 'JJJJJJJJJIII')],
    17: [(28, 'JNNJJJNNJIII')],
    18: [(28, 'JJJJJJJJJIII')],
    19: [(28, 'JJzJJJJzJIII')],
    20: [(28, 'JzJzJJzJzIII')],
    21: [(28, 'JJJJJIJJJIII')],
    22: [(28, 'JJJJJIIJJII')],
    23: [(28, 'JJzJJJJzJII')],
    24: [(28, '.JJzzzzJII')],
    25: [(29, '.IIIIIII')],
})
c.put(40, 18, ['I', 'I', 'I'])
PORTRAIT = {'id': 'market.plusone', 'name': 'Plus-One', 'kind': 'member', 'sphere': 'blue',
            'people': [{'skin': 'brown', 'hair': 'black'}, {'skin': 'fair', 'hair': 'blonde'}], 'accent': 'red',
            'px': c.rows()}
