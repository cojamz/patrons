import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _libf import *
# Launderers (colorless, counts as 2), scene version (Cory, Oct 29: "little scenes"). The same two partners, mid-laugh,
# now in a laundromat: a clothesline across the top with a shirt and two pegged banknotes, a front-loading washer on the
# right with bills tumbling in its porthole (the partner leans on it), and a wicker basket heaped with bills held by the
# curly-haired man in front. Setting in linen, grey and hair-brown wicker: lower contrast than the two of them.
c = Canvas()
# ---- clothesline (behind everyone): the line, a shirt on the left, two banknotes on the right, brown pegs
c.fill(c.rect(0, 2, 47, 2), 'i')
def bill(x, y):
    c.put(x, y, ['wwwwwww', 'wvvvvvw', 'wvwwwvw', 'wvvvvvw', 'wwwwwww'])
bill(0, 3); bill(26, 3)
c.put(37, 3, ['kkk..kkk',
              'kkkkkkkkk',
              'kkkkkkkkk',
              '.lkkkkkk.',
              '.lkkkkkk.',
              '.lkkkkkk.',
              '.lkkkkkk.'])                                                        # a shirt, sleeves out
c.fill(c.rect(37, 3, 39, 3), 'l'); c.fill(c.rect(37, 4, 37, 5), 'l')
for x in (1, 5, 27, 31, 38, 44): c.put(x, 1, ['M', 'M', 'M'])                          # pegs
# ---- behind (person 1), right
bodyB = c.poly([(22, 48), (24, 32), (28, 27.5), (38, 27), (44, 29), (47, 33), (47, 48)])
d = Canvas(); d.g = [r[:] for r in c.g]; c.g = [['.'] * 48 for _ in range(48)]
c.fill(bodyB, '2'); c.outside(bodyB, '1', 34, 34, 11, 8)
c.fill(c.rect(30, 21, 36, 27), 'I'); c.fill(c.rect(30, 21, 31, 27), 'J')
hairB = c.poly([(25.5, 17), (25.5, 11), (28, 8), (33, 6.6), (38, 7.4), (41, 10), (41.6, 15), (40.6, 19), (39.5, 13), (33, 11.5),
                (27.5, 13), (26.8, 18)])
c.fill(hairB, 'N'); c.outside(hairB, 'M', 33, 9.5, 8, 4.5)
blk(c, 26, 12, '''
|..KKKKKKKKKKK..
|.KKKKKKKKKKKJN.
|.KMMMKKKMMMKJN.
|.KJJJKKKJJJKJN.
|.KKzzKKKKzzKJJ.
|.KzKKzKKzKKzJJ.
|.KKKKKJKKKKKJJ.
|.KKKKJJKKKKKJJ.
|..KKIzzzIKKJJ..
|..KKKIIIKKKJJ..
|...JKKKKKKJI...
|....IJJJJJI....
''')
c.put(40, 15, ['J', 'I', 'I'])                                                    # ear
c.shift(c.mask_of('IJKL'), -1)
c.fill(c.rect(29, 9, 39, 10), 'k')                                                 # one plain pale hairband (critic: rollers read as a tiara)
c.g = [['.'] * 48 for _ in range(6)] + c.g[:42]
behind = c.filled()
for (x, y) in behind: d.set(x, y, c.get(x, y))
c.g = d.g
# ---- the washer, right, in front of the partner's body: enamel box, a control strip, the porthole with bills tumbling
wash = c.rect(31, 31, 47, 47)
c.fill(wash, 'k'); c.fill(c.rect(31, 31, 47, 31), 'l'); c.fill(c.rect(31, 31, 31, 47), 'l')
c.fill(c.rect(32, 33, 47, 34), 'i'); c.fill(c.rect(34, 33, 36, 34), '1')          # control strip, a dial
port = c.ellipse(40.5, 41.5, 6.2, 6.2)
c.fill(port, '2'); c.fill(c.ellipse(40.5, 41.5, 4.8, 4.8), '1')
c.put(36, 39, ['wwww', 'wvvw'])
c.put(40, 42, ['wwww', 'wvvw'])
c.put(41, 38, ['www', 'vvv'])
c.edge(wash, None)
# ---- in front (person 0), left
s0 = [r[:] for r in c.g]
body = torso(c, [(0, 48), (0, 40), (3, 37), (9, 35), (24, 35), (30, 37), (32, 41), (32, 48)], 14, 40, rx=(17, 21), ry=(10, 13), lite=None)
c.fill(c.rect(13, 29, 20, 35), 'A'); c.fill(c.rect(13, 32, 14, 35), 'B')
c.fill(c.poly([(11, 35), (13, 34.5), (16.5, 37.5), (20, 34.5), (22, 35), (16.5, 39)]), 'B')     # open collar
c.put(11, 33, ['22......22', '.22....22.'])                                       # collar points
# ---- face: 3/4 to our right (toward her), brows up, laughing. ruler x 8..25
blk(c, 8, 16, '''
|.ECCCCCCCCCCCCCBA.
|.ECDEEEECCCEEEBBA.
|.CCBBBBBCCBBBBBBA.
|.CBCCkzBDCBkzBBBA.
|.CACCzzBDCBzzBBBA.
|.CACCCCCDBCCCBBBA.
|.CBDDDCCCDBCCBBBA.
|..BCDDCCCDDABCBBA.
|..BCCCAzzzzABCBA..
|..BCCCCAAAABCBBA..
|...BCCCDDCCCBBA...
|....BBCCCCCBBA....
|.....ABBBBBBA.....
''')
c.put(8, 20, ['C', 'D', 'C'])
hair = c.poly([(8.5, 18), (7.5, 13), (9, 9.5), (12, 7.6), (16, 6.6), (20, 7), (23.5, 9), (25.5, 12.5), (25, 17), (23.5, 18),
               (22.6, 15.6), (16, 15.4), (11, 16), (9.6, 19)])
c.fill(hair, 'F'); c.outside(hair, 'E', 16, 11, 9, 5)
for (x, y) in ((11, 9), (16, 7.5), (21, 8), (8.5, 13)): c.fill(c.ellipse(x, y, 1.8, 1.6), 'F')      # curly bumps
# ---- the basket of bills he holds at the bottom: wicker in hair brown, a heap of green bills, his hands on the rim
bask = c.poly([(4, 40), (29, 40), (27, 48), (6, 48)])
mound = c.ellipse(16.5, 41, 11.5, 3.2)
c.fill(mound, 'v')
for (x, y) in ((6, 37), (18, 36), (11, 35), (21, 38), (9, 38)):                     # flat bills, back to front
    c.put(x, y, ['wwwwwww', 'wxxxxxw', 'vvvvvvv'])
c.fill(bask, 'N'); c.fill(c.rect(0, 40, 47, 41) & bask, 'M')
c.fill(c.rect(0, 44, 47, 44) & bask, 'M')
for x in range(8, 28, 4): c.fill(c.rect(x, 42, x, 47) & bask, 'M')               # wicker uprights
front = changed = {(x, y) for y in range(48) for x in range(48) if c.g[y][x] != s0[y][x] and c.g[y][x] != '.'}
c.set(10, 19, 'C'); c.set(10, 20, 'C'); c.set(10, 21, 'C')                         # cheek: one flat plane, no specks
for y in (22, 23):                                                                   # her eyes open (critic): lid, white, pupil
    for x in list(range(28, 33)) + list(range(34, 39)): c.set(x, y, 'J')
c.put(29, 22, ['JzJ', 'zJz']); c.put(35, 22, ['JzJ', 'zJz'])                          # ^ ^ laughing squints
c.put(2, 40, ['.DCC.', 'DCCCB', 'CCCBB', 'CBCBA', '.BBA.'])                          # his hands gripping the basket sides
c.put(27, 40, ['.CCB.', 'CCCBB', 'CCBBA', 'BCBBA', '.BAA.'])
c.edge(front, None)
PORTRAIT = portrait('benders.launderer', 'Launderers', c, [{'skin': 'tan', 'hair': 'darkbrown'}, {'skin': 'fair', 'hair': 'blonde'}],
                    'green')
