import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Patroness (blue): a grande dame of the shops, white hair swept up in a tall pompadour of curls, two strands of
# pearls, a touch of rose on the lips, a proud warm smile under arched brows. 3/4 to our left (light still from the
# top-left). Template: 1 person.
c = Canvas()
body = cloth(c, [(1, 48), (2, 41), (7, 36), (16, 34), (31, 34), (40, 36), (45, 41), (46, 48)])
chest = c.poly([(16.5, 34.5), (30.5, 34.5), (27.5, 39), (19.5, 39)])           # a scooped neckline
c.fill(chest, 'C'); c.fill(chest & c.rect(26, 34, 32, 40), 'B')
neck(c, 19, 27, 28, 34)
c.fill(c.rect(20, 30, 22, 33), 'D')
f = face(c, (15, 10, 32, 28), 19, view='l', jaw='narrow', mouth='smile', brows='arch', eyes='round', look=0)
# a little rose on the lips, kept small
m = f['mouth']
c.put(m[0] - 1, m[1], ['vvv']); c.set(19, 23, 'A'); c.set(24, 23, 'A'); c.put(m[0] - 1, m[1] + 1, ['DD'])
c.put(16, 20, ['DDD', 'DD.'])                                                  # cheek plane
# light on the deep skin (the ramp's tall warm top step): forehead, nose bridge, cheekbone, so features read at 1x
c.put(17, 13, ['DDDD', 'DDDDD', '.DDD']); c.put(20, 19, ['D', 'D', 'D'])
c.fill(c.rect(32, 13, 32, 26) & f['m'], 'A'); c.fill(c.rect(16, 28, 31, 28) & f['m'], 'A')
# hair: a soft rounded updo of curls, wider than tall, each curl a lit cluster with its own shadow
base = c.poly([(13, 21), (12.5, 13), (14.5, 8.6), (19, 6.4), (29, 6.4), (33.5, 8.6), (35.5, 13), (34.5, 20), (32.5, 15), (16, 14.5), (15, 21)])
c.fill(base, 'F'); c.outside(base, 'E', 23, 9, 12, 5.4); c.rim(base, 'G', -1, -1, 1, only='F')
for (x, y) in ((14, 10), (18, 8), (22, 7), (26, 7), (30, 8), (33, 11), (16, 12), (20, 11), (24, 10), (28, 11), (31, 13), (13, 15)):
    c.put(x, y, ['GH', 'FG'][0:1]); c.put(x, y + 1, ['EF'])
c.fill(c.rect(16, 15, 31, 15) & f['m'], 'A')
# two strands of pearls round the neck, a pearl earring
for (y0, sag, x0, x1) in ((33, 2, 19, 28), (36, 3, 17, 30)):
    for x in range(x0, x1 + 1):
        t = (x - x0) / (x1 - x0)
        y = y0 + round(sag * (1 - (2 * t - 1) ** 2))
        c.set(x, y, 'l' if x % 2 else 'k'); c.set(x, y + 1, 'j' if x % 2 else 'k')
c.put(33, 21, ['lk', 'kj'])
# eyes for the very deep face: warm brown irises with a 1px off-white each, a lid line, a clear brow row in the grey
for x in range(16, 28):
    if c.get(x, 16) in 'FE': c.set(x, 16, 'C')
    if c.get(x, 17) in 'FE': c.set(x, 17, 'C')
c.put(17, 16, ['EEEE...EEEE'])
c.put(17, 18, ['Bzz....Bzz.', 'yrqC...Cqry'])
c.put(18, 18, ['zz']); c.put(24, 18, ['zz'])
# Lighting pass for 1x (very deep skin): the hair's cast shadow only on the far half, one lit plane (near cheek, nose
# bridge, the bridge between the brows, upper lip) with a single clean terminator down the far side of the nose, the
# far side in C with B in the core, a warm bounce (wood r) inside the shadow-side jaw.
c.put(10, 15, [
    '...GHECCCCCCCAAAAAAAAAAEE....',
    '...EFEDEEEEDDDEEEECCBBAEE....',
    '...EEEDDDDDDDCCCCCCCBBAEE....',
    '...EEDBBzzDDCBzzzBCCBBABE....',
    '...EEDDyrqDDCCCqryCCBBABE....',
    '...EEDDDDDDDBCCCCCCBBrABA....',
    '.....DDDDDDBACCCCCCBBrAlk....',
    '.....DDDDDDDCCCCCCCBBrAkj....',
    '......DDDADDCBACCCBBrA.......',
    '......DDDCvvvCCCCCBBrA.......',
    '.......DDCDDCCCCCBBrA........',
    '........CCCCCCCBBBBA.........',
])
c.set(20, 21, 'r'); c.set(21, 22, 'r')                                             # critic: one midtone step on the seam
PORTRAIT = {'id': 'market.patroness', 'name': 'Patroness', 'kind': 'member', 'sphere': 'blue',
            'people': [{'skin': 'verydeep', 'hair': 'grey'}], 'accent': 'rose', 'px': c.rows()}
