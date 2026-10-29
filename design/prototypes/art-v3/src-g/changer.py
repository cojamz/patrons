import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import Canvas, rows, portrait

# Money Changer (white, counts as 2), round 1. In front, left: the changer at her counter, a green eyeshade over
# short black curls, bright round eyes, a polite closed smile, two stacks of gold coins under her hand. Behind,
# right, smaller and a value darker: her customer, a cheerful man with a side part, holding up a banknote to swap.
# Template: 2 people, front left. Tones: front brown, behind golden (the darker tone is the one in front, at work).
c = Canvas()
# ---- behind (person 1), right
bodyB = c.poly([(24, 48), (26, 35), (30, 30.6), (37, 30), (44, 32), (47, 36), (47, 48)])
c.fill(bodyB, '2'); c.outside(bodyB, '1', 33, 35, 12, 8)
c.fill(c.rect(30, 25, 35, 30), 'I')
c.put(31, 30, ['44.44', '.444.'])                                         # his shirt collar
rows(c, 26, {
    13: "...JJJJJJJJI..",
    14: "..JJJJJJJJJJI.",
    15: ".JJJJJJJJJJJII",
    16: ".JNNNJJJNNNJII",
    17: ".JJJJJJJJJJJII",
    18: ".JJJJJJJJJJJII",
    19: ".JJzzJJJJzzJII",
    20: ".JzJJzJJzJJzII",
    21: ".JJJJJJIJJJJII",
    22: ".JJJJJIIJJJJI.",
    23: "..JJIJJJJIJJI.",
    24: "..IJJIIIIJJI..",
    25: "...IIJJJJII...",
})
c.put(39, 17, ['I', 'J', 'I'])                                            # far ear
hairB = c.ellipse(33, 12.4, 7.6, 5) | c.rect(26, 12, 27, 16)
hairB -= c.poly([(27.5, 30), (27.5, 15), (31, 13.2), (38, 13.6), (39.5, 16), (39.5, 30)])
c.fill(hairB, 'N'); c.fill(c.line(31, 8, 31, 13) & hairB, 'M')
c.edge(hairB, 'M')
# the banknote held up beside his face
note = c.poly([(39, 20), (46.6, 18.6), (47.4, 25), (39.8, 26.4)])
c.fill(note, '4'); c.fill(note & c.rect(45, 18, 47, 27), '3')
c.put(42, 21, ['vv', 'vv']); c.put(40, 20, ['3']); c.put(46, 25, ['2'])
c.edge(note, '2')
c.put(41, 26, ['.JJJ', 'JJJJI', 'JIJII', '.III.'])                       # his fingers
# ---- in front (person 0), left
bodyA = c.poly([(0, 48), (0, 40), (3, 37), (9, 35.4), (22, 35.4), (27, 37), (30, 41), (31, 48)])
c.fill(bodyA, '3'); c.outside(bodyA, '2', 13, 40, 15, 9); c.outside(bodyA, '1', 11, 39, 19, 12)
c.rim(bodyA, '4', 0, -1, 1, only='3')
c.fill(c.poly([(12, 35.4), (19, 35.4), (15.5, 39)]), '1')                  # open collar
c.fill(c.rect(13, 29, 19, 35), 'B'); c.fill(c.rect(13, 29, 19, 30), 'A'); c.fill(c.rect(18, 31, 19, 34), 'A')
c.fill(c.poly([(12, 35.4), (19, 35.4), (15.5, 39)]) & c.rect(0, 35, 47, 35), 'B')
rows(c, 8, {
    14: ".BCDDDDDCCCCCCCBA.",
    15: ".BCDDDDDCCCCCCCBA.",
    16: ".BCDDDDCDCCCCCCBA.",
    17: ".BCEEEECDCEEEEBBA.",
    18: ".BCBBBBCDBBBBBBBA.",
    19: ".BCBzzCCDBCBzzCBA.",
    20: ".BCyzzyCDBCyzzyBA.",
    21: ".BCByzBCDBCByzBBA.",
    22: ".BDDDCCCDDBCCCCBA.",
    23: ".BDDDCCCDDBCCCCBA.",
    24: ".BCDCCCAAABCCCBBA.",
    25: ".BCCCACCCCACCCBBA.",
    26: "..BCCCzzzzCCCCBA..",
    27: "..BCCCCCCCCCCBBA..",
    28: "...BBCCCCCCBBA....",
})
c.put(7, 19, ['.C', 'CD', 'CB', '.B'])                                    # near ear
# short black curls above the eyeshade
curls = c.ellipse(16.5, 10.4, 9, 5.6) | c.rect(8, 10, 10, 18) | c.rect(23, 10, 25, 17)
curls -= c.poly([(10.6, 30), (10.6, 15), (23, 15), (23, 30)])
c.fill(curls, 'F'); c.outside(curls, 'E', 15, 9, 8, 4.4)
for (x, y) in ((13, 7), (18, 6), (21, 8), (10, 9)): c.put(x, y, ['FE', 'E.'])
# the eyeshade: a green band and a stiff brim tilted down over the brow
c.fill(c.rect(9, 12, 24, 13), 'v'); c.fill(c.rect(20, 12, 24, 13), 'u')
brim = c.poly([(6, 14), (9, 13.4), (24.4, 13.4), (27.4, 14.6), (25, 16), (8, 16)])
c.fill(brim, 'v'); c.fill(brim & c.rect(21, 13, 47, 16), 'u')
c.edge(brim | c.rect(9, 12, 24, 13), 'u')
c.edge(curls | (c.mask_of('ABCDyzv') & c.rect(0, 0, 27, 34)), None)
# ---- the counter across the front, two stacks of gold coins, her hand on them
ctr = c.rect(0, 44, 47, 47)
c.fill(ctr, '2'); c.fill(c.rect(0, 44, 47, 44), '4'); c.fill(c.rect(0, 46, 47, 47), '1')
for (x, h) in ((0, 5), (6, 3), (11, 2)):
    top = 43 - h * 2
    c.put(x, top, ['.ccc.', 'ccccc'])
    for k in range(1, h): c.put(x, top + k * 2, ['cccca', 'aaaaa'])
    c.put(x, 42, ['cccca', 'aaaaa'])
    c.edge(c.rect(x, top, x + 4, 43) & c.mask_of('ac'), '1')
c.put(15, 39, ['.DDC', 'DCDCB', 'CBCBA', 'CCBA.', '.BA..'])                # her hand
PORTRAIT = portrait('trading.changer', 'Money Changer', 'white', c,
                    [{'skin': 'brown', 'hair': 'black'}, {'skin': 'golden', 'hair': 'brown'}], 'green')
c.put(20, 40, ['.cc.', 'c!cc', 'ccca', '.aa.']); c.edge(c.rect(20, 40, 23, 43) & c.mask_of('ac!'), '1')   # a loose coin
PORTRAIT['px'] = c.rows()
