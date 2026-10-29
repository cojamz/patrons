import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Heiress (white, counts as 2): new money and old. In front: a young heiress in a white gown and pearls, hair up in a
# smooth updo, a small gold tiara, proud closed smile. Behind and lower: her grand-aunt in a white hat with a gold band,
# pleased. Template: 2 people, front left.
c = new()
bodyB = c.poly([(22, 48), (25, 36), (29, 32.5), (38, 31.5), (44, 34), (47, 39), (47, 48)])
c.fill(bodyB, "2"); c.outside(bodyB, "1", 34, 37, 12, 9); c.rim(bodyB, "3", 0, -1, 1, only="2")
neck(c, 30, 36, 26, 32, n=1)
face(c, 'b13', 27, 19, n=1, eyes='closed', brows='level', mouth='smile')
hair(c, [(26.5, 19), (26, 14), (40.5, 14), (40.5, 19), (39.5, 19), (39, 16), (28, 16), (27.5, 19)], 1, 32, 11, 7, 4)
ht = c.poly([(23, 14.6), (26, 12.6), (28, 8), (33, 6.5), (38, 7), (40, 11), (43.5, 12.6), (44, 14.6)])
c.fill(ht, '3'); c.outside(ht, '2', 32, 9, 8, 4); c.fill(ht & c.rect(0, 11, 47, 12), 'c'); c.fill(ht & c.rect(23, 14, 47, 14), '1')
c.edge(ht, '1')
behind(c, 1)
bodyA = c.poly([(0, 48), (0, 41), (3, 37), (9, 35), (24, 35), (30, 37), (33, 41), (34, 48)])
c.fill(bodyA, "3"); c.outside(bodyA, "2", 14, 40, 17, 11); c.outside(bodyA, "1", 12, 39, 21, 14)
c.rim(bodyA, "4", 0, -1, 1, only="3"); c.edge(bodyA, "1")
gown = c.poly([(9, 35), (24, 35), (21, 40), (12, 40)]); c.fill(gown, 'C'); c.fill(gown & c.rect(19, 35, 25, 40), 'B')
neck(c, 13, 20, 28, 34)
face(c, 'f16', 9, 20, eyes='dark', brows='arched', mouth=None, glow=True, iris='r')
c.put(13, 25, ['B....B', '.ArrA.'])                                                # closed smile, warm lips
c.put(10, 21, ['DDDC', 'DDC.', 'DC..'])                                            # cheekbone, chamfered
ear(c, 24, 19)
c.put(24, 23, ['k', 'j'])
hair(c, [(8, 19), (7.6, 13), (9.5, 9), (14, 6.6), (20, 6.6), (24, 9), (25.6, 13), (25.4, 19), (24.4, 19), (24, 15), (18, 13.6), (11, 14), (9.4, 15.6), (9, 19)], 0, 15, 9, 9, 5)
up = c.ellipse(17, 5, 5, 3.2); c.fill(up, 'G'); c.outside(up, 'F', 16, 4.4, 4.4, 2.6); c.fill(up & c.ellipse(15, 3.6, 1.6, 0.9), 'H')
c.put(11, 7, ['..d...d...d..', '.cdc.cdc.cdc.', 'bcccccccccccb'])                  # tiara, three raised points
# pearls: one continuous two-tone loop low on the neckline, well off the mouth
c.put(10, 35, ['kikikikikik'])                                                     # pearls across the skin, pearl / grey-brown
c.put(9, 34, ['k...........'][:0])
# Lighting pass for 1x (very deep skin): one lit plane (forehead, near cheek, nose bridge, upper lip) with a single
# clean terminator down the far side of the nose, so the face parts from the black hair; the far side in C with B in
# the core; a warm bounce (wood r) inside the shadow-side jaw.
c.put(4, 14, [
    '....FFDDDDDDDDCCCBFFFFccccc',
    '....FDDDDDDDDDCCCBBBFFccccc',
    '....FDDDDDDDDCCCCBBBF222222',
    '....FDDDFFFDDFFCCBBBF111111',
    '....FDDFCCCDDCCFCBBBF.11111',
    '.....DBBzzCDBzzBCBBBBAMMJJJ',
    '.....DDzrzyDCrzyCBBBCAMMMMM',
    '.....DDDDDDDBCCCBBBrBAMMIII',
    '.....DDDDDDDBCCCBBBrA..JIzz',
    '.....DDDDDDDBCCCBBBrk..JJJJ',
    '......DDDDDAABCCBBrAk..JJJJ',
    '......DDDBDDCCBCBBrA...JJJJ',
    '.......DDCArrACCBBA.....JJJ',
    '........CCCCCCCBBA......IJJ',
])
# Critic round: the ring round the mouth and the chin lifted to the midtone (goatee read), shadow kept on the right
# jaw only; one midtone step on the nose seam.
for (x, y, k) in ((16, 25, 'D'), (17, 25, 'D'), (13, 26, 'r'), (18, 26, 'r'), (13, 27, 'r'), (14, 27, 'r'), (15, 27, 'r'),
                  (16, 27, 'r'), (17, 27, 'r'), (16, 21, 'r')):
    c.set(x, y, k)
PORTRAIT = portrait('trading.heiress', 'Heiress', 'white', [{'skin': 'verydeep', 'hair': 'black'}, {'skin': 'olive', 'hair': 'grey'}], c, accent='orange', merge={'H': 'G', 'K': 'J', 'N': 'M', 'd': 'c'}, minn=5)
