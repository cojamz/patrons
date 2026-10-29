import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *
# Launderers (colorless, counts as 2): worth 2; On Recruit, turn all your resources into one color. Two partners at
# the wash, mid-laugh. In front: a curly-haired man, sleeves rolled, a striped towel over his shoulder, forearms bare,
# brows up, laughing at the bubble floating off. Behind (3px lower, a value darker): his partner in
# teal hair curlers, eyes shut laughing. Soap bubbles drift up between them; a washed banknote is pegged to his towel (the money joke). Template: 2 people, front left.
c = Canvas()
# ---- behind (person 1), right
bodyB = c.poly([(22, 48), (24, 32), (28, 27.5), (38, 27), (44, 29), (47, 33), (47, 48)])
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
|.KKKKJJKKKKKJ..
|..KKIzzzIKKJJ..
|..KKKIIIKKKJJ..
|...JKKKKKKJI...
|....IJJJJJI....
''')
c.put(40, 15, ['J', 'I', 'I'])                                                    # ear
for x0 in (27, 32, 37):                                                            # three rounded rollers
    c.put(x0, 6, ['www', 'uuu'])
c.shift(c.mask_of('IJKL'), -1)
c.g = [['.'] * 48 for _ in range(6)] + c.g[:42]                                 # 3px lower again (critic, round 1)
# ---- in front (person 0), left
body = torso(c, [(0, 48), (0, 40), (3, 37), (9, 35), (24, 35), (30, 37), (33, 41), (34, 48)], 14, 40, rx=(17, 21), ry=(10, 13), lite=None)
c.fill(c.rect(13, 29, 20, 35), 'A'); c.fill(c.rect(13, 32, 14, 35), 'B')
c.fill(c.poly([(11, 35), (13, 34.5), (16.5, 37.5), (20, 34.5), (22, 35), (16.5, 39)]), 'B')     # open collar
for x0, x1 in ((0, 5), (29, 34)):                                                  # rolled sleeves, bare forearms
    arm = body & c.rect(x0, 41, x1, 47)
    c.fill(arm, 'C'); c.fill(arm & c.rect(x1 - 1, 41, x1, 47), 'B'); c.fill(arm & c.rect(x0, 41, x0, 47), 'D')
    c.fill(body & c.rect(x0, 38, x1, 38), '3'); c.fill(body & c.rect(x0, 39, x1, 39), '2'); c.fill(body & c.rect(x0, 40, x1, 40), '1')
c.fill(c.line(6, 41, 6, 47) | c.line(28, 41, 28, 47), '1')
c.put(11, 33, ['22......22', '.22....22.'])                                       # collar points
towel = c.poly([(3.5, 37), (6, 34.4), (10, 33.6), (13.4, 34.6), (12.6, 48), (7, 48), (7.4, 39), (5.5, 38.4)])
c.fill(towel, 'k'); c.fill(towel & c.rect(11, 30, 13, 47), 'i')
c.fill(towel & c.rect(0, 42, 47, 43), 'w'); c.fill(towel & c.rect(11, 42, 13, 43), 'u'); c.fill(towel & c.rect(0, 46, 47, 46), 'w')
c.fill(c.line(6, 35, 8, 38), 'i')                                                    # where it folds over the shoulder
c.edge(towel, 'i')
c.put(4, 36, ['...EE..', 'wwwEwww', 'wkkkkkw', 'wkuwukw', 'wkkkkkw', 'wwwwwww'])        # a washed banknote pegged to the towel
# ---- face: 3/4 to our right (toward her), brows up, laughing. ruler x 8..25
blk(c, 8, 16, '''
|.ECCCCCCCCCCCCCBA.
|.ECDEEEECCCEEEBBA.
|.CCBBBBBCCBBBBBBA.
|.CBCC!zBDCB!zBBBA.
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
# ---- bubbles drifting up between them
for (x, y, r) in ((23.5, 4.5, 3.6), (31, 2.5, 2.3), (44, 6, 2.6), (6, 4, 1.8)):
    bubble(c, x, y, r, 'k')
PORTRAIT = portrait('benders.launderer', 'Launderers', c, [{'skin': 'tan', 'hair': 'darkbrown'}, {'skin': 'fair', 'hair': 'blonde'}],
                    'teal')
