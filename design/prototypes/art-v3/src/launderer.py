import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from draw import Canvas

# Launderers (colorless, counts as 2), round 3, faces by hand. In front: a young laundress, hair up in a bun, sleeves
# rolled, a wicker basket with three folded layers of linen, a small closed smile. Behind (3px lower, a value darker):
# her partner in a flat cap, the same quiet smile. No head-wrap, no grin (audit.md). Template: 2 people, front left.
c = Canvas()

def seg(rows):
    for y, parts in rows.items():
        for x, s in parts: c.put(x, y, [s])

# ---- behind (person 1), right
bodyB = c.poly([(22, 48), (24, 32), (28, 28), (38, 27.5), (44, 29.5), (47, 34), (47, 48)])
c.fill(bodyB, '2'); c.outside(bodyB, '1', 34, 35, 11, 8)
c.fill(c.rect(30, 22, 36, 28), 'I'); c.fill(c.rect(30, 22, 36, 23), 'I')
seg({
    14: [(27, 'KKKKKKKKKKKJM')],
    15: [(27, 'KMMKKKMMMKKJM')],
    16: [(27, 'KJJKKKJJJKKJM')],
    17: [(27, 'KzJKKKKzJKKJJ')],
    18: [(26, 'KKKKJKKKKKKKJJ')],
    19: [(27, 'KKJIKKKKKKKJJ')],
    20: [(27, 'KJKKKKJKKKJJ')],
    21: [(27, 'KKIIIIKKKKJJ')],
    22: [(28, 'JKKKKKKJJI')],
    23: [(29, 'IJJJJJJI')],
})
c.put(39, 15, ['J', 'JI', 'JI', 'I'])                                # ear
cap = c.poly([(26, 14), (26.5, 10), (29, 7.5), (35, 6.8), (40, 8.5), (41.5, 12), (40.5, 14.5), (27, 14.5)])
c.fill(cap, '2'); c.fill(cap & c.ellipse(31, 8.5, 5, 2), '3'); c.edge(cap, '1')
c.fill(c.poly([(23.5, 14), (27, 12.5), (34, 12.9), (33, 14.9), (25, 15.1)]), '1')      # the peak
c.shift(c.mask_of('IJKL'), -1)                                       # behind: a value darker
c.g = [['.'] * 48 for _ in range(3)] + c.g[:45]                      # and 3px lower (template depth rule)
# ---- in front (person 0), left
body = c.poly([(0, 48), (0, 40), (3, 37), (9, 35), (24, 35), (30, 37), (33, 41), (34, 48)])
c.fill(body, '3'); c.outside(body, '2', 14, 39, 17, 10); c.outside(body, '1', 12, 38, 21, 13); c.rim(body, '4', 0, -1, 1, only='3')
c.fill(c.rect(13, 29, 20, 34), 'A'); c.fill(c.rect(13, 32, 14, 34), 'B')
c.fill(c.poly([(11, 35), (13, 34.5), (16.5, 37.5), (20, 34.5), (22, 35), (16.5, 39)]), 'B')   # open collar
hair = c.poly([(6.5, 21), (6.5, 14), (8.5, 9.5), (13, 7), (19, 6.6), (24, 8.5), (26, 12.5), (25.5, 17), (23.5, 15),
               (16, 14.6), (10, 15.5), (8, 21)])
c.fill(hair, 'F'); c.outside(hair, 'E', 15, 11, 10, 5.5); c.rim(hair, 'G', -1, -1, 1, only='F')
bun = c.ellipse(7, 8, 3.2, 3)
c.fill(bun, 'F'); c.outside(bun, 'E', 6.5, 7.5, 3, 2.8); c.rim(bun, 'G', -1, -1, 1, only='F'); c.edge(bun, 'E')
seg({
    15: [(9, 'BBBBBBBBBBBBBBBA')],
    16: [(9, 'BCDDCCCCCCCCCCBA')],
    17: [(9, 'BCEEECCCCEEECCBA')],
    18: [(9, 'BBBBBCCCCBBBCCBA')],
    19: [(9, 'BCzzzCCCCzzCCCBA')],
    20: [(9, 'BCCzCCDCCCzCCCBA')],
    21: [(9, 'BDDDCCDBCCCCCCBA')],
    22: [(9, 'BCDDCCCDDBCCCCBA')],
    23: [(9, 'BCCCCCCCAACCCBBA')],
    24: [(9, 'BCCCBCCCCBCCCBBA')],
    25: [(9, 'BCCCCAAAACCCCBA')],
    26: [(10, 'BCCCCDDCCCCBBA')],
    27: [(11, 'BBCCCCCCBBBA')],
    28: [(12, 'ABBBBBBBAA')],
})
c.put(7, 19, ['.C', 'CA', 'CA', '.B'])
# arms: rolled sleeves, bare forearms down to the basket
for x0, d in ((3, 1), (27, -1)):
    arm = c.poly([(x0, 37), (x0 + 4, 37), (x0 + 4 + d, 43), (x0 + d, 43)])
    c.fill(arm, 'C'); c.rim(arm, 'B', 1 if d > 0 else -1, 0, 1)
    c.fill(c.rect(x0 - 1, 37, x0 + 4, 38), '4'); c.fill(c.rect(x0 - 1, 39, x0 + 4, 39), '2')
    c.edge(arm, 'A')
# three folded layers of linen in a wicker basket
for (x0, x1, y) in ((9, 28, 40), (10, 27, 38), (12, 25, 36)):
    c.fill(c.rect(x0, y, x1, y + 1), 'k'); c.fill(c.rect(x0, y, x1, y), 'l'); c.fill(c.rect(x1 - 2, y, x1, y + 1), 'i')
    c.set(x0, y + 1, 'i')
basket = c.poly([(4, 41.5), (32, 41.5), (31, 44.5), (29, 48), (7, 48), (5, 44.5)])
c.fill(basket, 'r')
for x in range(7, 31, 3): c.fill(c.rect(x, 44, x, 47) & basket, 'q')
c.fill(basket & c.rect(0, 43, 47, 43), 'q')
c.edge(basket, 'q')
c.put(4, 41, ['CC', 'BC']); c.put(30, 41, ['CB', 'CB'])                 # hands on the rim
PORTRAIT = {'id': 'benders.launderer', 'name': 'Launderers', 'kind': 'member', 'sphere': 'colorless',
            'people': [{'skin': 'olive', 'hair': 'darkbrown'}, {'skin': 'palepink', 'hair': 'brown'}], 'accent': 'red',
            'px': c.rows()}
