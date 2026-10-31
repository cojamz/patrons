import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Shopaholic (blue, counts as 2): two friends out shopping, never done. In front, right: a woman with long auburn
# waves and sunglasses pushed up on her head, thrilled (brows up, open smile), shopping bags up in both hands.
# Behind, left, lower and darker: her friend with a short dark-blonde bob, laughing, one more bag on her arm.
# Template: 2 people, mirrored (front right).
c = Canvas()
# ---- behind (person 1), left
bodyB = c.poly([(0, 48), (0, 33), (4, 30.5), (14, 30), (20, 32), (24, 37), (25, 48)])
c.fill(bodyB, '2'); c.outside(bodyB, '1', 9, 35, 12, 8)
neck(c, 11, 16, 25, 30, p=1, back=True)
face(c, (8, 11, 20, 25), 20, p=1, back=True, view='front', jaw='narrow', eyes='laugh', mouth='smile', brows='raised', mouth_dy=3, ear=False)
bob = c.poly([(6.5, 24), (6.5, 14), (9, 9.5), (14, 8), (19, 9.2), (21.5, 13), (21.5, 24), (19.6, 24), (19.5, 15), (16, 13.4),
              (10, 14.4), (8.4, 17), (8.4, 24)])
c.fill(bob, 'N'); c.outside(bob, 'M', 12, 12, 8, 9)
seg(c, {
    15: [(9, 'JJJJJJJJJII')],
    16: [(9, 'JJJJJJJJJII')],
    17: [(9, 'JNNJJJNNJII')],
    18: [(9, 'JJJJJJJJJII')],
    19: [(9, 'JJzJJJJzJII')],
    20: [(9, 'JzJzJJzJzII')],
    21: [(9, 'JJJJJIJJJII')],
    22: [(9, 'JJJJIIJJJII')],
    23: [(9, 'JJzJJJJzJI')],
    24: [(10, 'JJzzzzJII')],
    25: [(11, 'IIIIIII')],
})
# ---- in front (person 0), right
hairback = c.poly([(21, 36), (21.5, 18), (24, 12), (30, 9), (36, 9.5), (40, 13), (41.5, 20), (42, 36)])
c.fill(hairback, 'F'); c.outside(hairback, 'E', 29, 18, 11, 16)
body = c.poly([(15, 48), (16, 40), (19, 37), (25, 35), (37, 35), (43, 37), (46, 40), (47, 48)])
c.fill(body, '3'); c.outside(body, '2', 29, 40, 14, 9); c.outside(body, '1', 27, 39, 18, 13); c.rim(body, '4', 0, -1, 1, only='3')
neck(c, 28, 34, 28, 35)
c.fill(c.poly([(26, 35), (36, 35), (31, 39)]), 'C'); c.fill(c.poly([(31, 35), (36, 35), (31, 39)]), 'B')
f = face(c, (23, 11, 38, 28), 20, view='front', jaw='narrow', eyes='wide', look=0, mouth='open', brows='raised', ear=False)
waves = c.poly([(21, 33), (21.5, 19), (23, 14), (26, 11), (31, 10), (36, 10.6), (39.5, 13.5), (41, 19), (41.6, 33), (39.5, 33),
                (39, 20), (37, 15.4), (33, 14.2), (29, 15.6), (25, 15.4), (24.4, 20), (24, 33)])
c.fill(waves, 'F'); c.outside(waves, 'E', 29, 16, 12, 10); c.rim(waves, 'G', -1, -1, 1, only='F')
for y in (22, 27): c.put(21, y, ['G', 'F']); c.put(40, y, ['F', 'E'])            # waves down the sides
# sunglasses pushed up on her head
c.put(24, 9, ['.zzzz..zzzz.', 'zE!EEzzEE!Ez', '.zzzz..zzzz.'])
# shopping bags held up, two in front and one on the friend's arm
def bag(x, y, w, h, k):
    lo, mid, hi = k
    m = c.poly([(x, y + h), (x + 0.5, y), (x + w - 0.5, y), (x + w, y + h)])
    c.fill(m, mid); c.fill(m & c.rect(x + w - 2, y, x + w, y + h), lo); c.fill(m & c.rect(x, y, x + w, y), hi)
    n = w - 6                                                                       # a 2px arch handle in the bag's dark
    c.put(x + 2, y - 4, ['.' + lo * n + '.', lo * 2 + '.' * (n - 2) + lo * 2, lo + '.' * n + lo, lo + '.' * n + lo])
    return m
bag(1, 40, 8, 8, '234')
bag(16, 38, 10, 10, 'uvw'); bag(35, 39, 10, 9, 'uvw')
c.put(19, 32, ['.CD', 'CCC', 'BCB'])                                            # her hands on the handles
c.put(38, 33, ['DC.', 'CCB', 'BB.'])
PORTRAIT = {'id': 'market.shopaholic', 'name': 'Shopaholic', 'kind': 'member', 'sphere': 'blue', 'mirror': True,
            'people': [{'skin': 'warmtan', 'hair': 'darkbrown'}, {'skin': 'freckled', 'hair': 'blonde'}], 'accent': 'rose',
            'px': c.rows()}
