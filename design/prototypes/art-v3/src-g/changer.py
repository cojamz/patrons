import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import Canvas, rows, portrait

# Money Changer (white, counts as 2), round 1. In front, left: the changer at her counter, a green eyeshade over
# short black curls, bright round eyes, a polite closed smile, two stacks of gold coins under her hand. Behind,
# right, smaller and a value darker: her customer, a cheerful man with a black side part, holding up a banknote to swap.
# Template: 2 people, front left. Tones: front brown, behind golden (the darker tone is the one in front, at work).
c = Canvas()
# ---- behind (person 1), right
bodyB = c.poly([(24, 48), (26, 37), (30, 32.6), (37, 32), (44, 34), (47, 38), (47, 48)])
c.fill(bodyB, '2'); c.outside(bodyB, '1', 33, 37, 12, 8)
c.fill(c.rect(30, 25, 35, 32), 'I')
c.put(31, 32, ['44.44', '.444.'])                                         # his shirt collar
rows(c, 26, {
    13: "...JJJJJJJJI..",
    14: "..JJJJJJJJJJI.",
    15: ".JJJJJJJJJJJII",
    16: ".JEEEJJJEEEJII",
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
c.fill(hairB, 'F'); c.fill(c.line(31, 8, 31, 13) & hairB, 'E')
c.edge(hairB, 'E')
# the banknote held up beside his face: a wide pale-green bill, a darker border and a centre oval
note = c.rect(37, 18, 47, 24)
c.fill(note, 'w'); c.fill(c.rect(37, 18, 47, 18) | c.rect(37, 24, 47, 24) | c.rect(37, 18, 37, 24), 'v')
c.put(41, 20, ['.vv.', 'v..v', '.vv.']); c.put(42, 21, ['uu'])
c.put(37, 24, ['.JJJ.', 'JJJJI', 'JIJJI', '.III.'])                       # his fingers holding its corner
# ---- in front (person 0), left
bodyA = c.poly([(0, 48), (0, 40), (3, 37), (9, 35.4), (22, 35.4), (27, 37), (30, 41), (31, 48)])
c.fill(bodyA, '3'); c.outside(bodyA, '2', 13, 40, 15, 9); c.outside(bodyA, '1', 11, 39, 19, 12)
c.rim(bodyA, '4', 0, -1, 1, only='3')
c.fill(c.poly([(12, 35.4), (19, 35.4), (15.5, 39)]), '1')                  # open collar
c.fill(c.rect(14, 29, 19, 35), 'B'); c.fill(c.rect(14, 29, 19, 30), 'A'); c.fill(c.rect(18, 31, 19, 34), 'A')
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
    27: ".BBCCCCCCCCCCBBA..",
    28: "..ABBCCCCCCBBA....",
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
for (x, h) in ((1, 5), (6, 3), (11, 2)):                                  # narrow coin columns, lit oval tops
    top = 43 - h * 2
    for k in range(h): c.put(x, top + k * 2 + 1, ['ccca', 'aaaa'])
    c.put(x, top, ['.dd.', 'dddc'])
c.put(12, 40, ['ccca', 'aaaa', 'ccca'])
c.put(13, 39, ['4'])
c.put(15, 39, ['.DD......',
               'DDDDDDDD.',
               'CCCCCCCCB',
               'CCBBBBBB.',
               'BCCCCCCB.'])                                            # her hand on the counter, two fingers out to the coin
c.put(13, 40, ['44', '44', '34', '33'])                                   # her white cuff
PORTRAIT = portrait('trading.changer', 'Money Changer', 'white', c,
                    [{'skin': 'brown', 'hair': 'black'}, {'skin': 'golden', 'hair': 'black'}], 'green')
c.put(24, 40, ['.dd.', 'dccc', 'ccca', '.aa.'])   # a loose coin under her fingertips
PORTRAIT['px'] = c.rows()
