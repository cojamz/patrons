import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# HR (colorless, counts as 3), batch f (from the round 3 sample), faces by hand. The department, polite closed smiles all round. In front: a
# manager in a black bob and glasses, blazer and blouse, clipboard. Behind left: a freckled redhead in shirt and tie.
# Behind right: an older woman with a grey bun and a turtleneck. Separated by value (front 3-4, behind 1-2) and collar.
# Template: 3 people.
c = Canvas()

def seg(rows):
    for y, parts in rows.items():
        for x, s in parts: c.put(x, y, [s])

# ---- behind left (person 1): shirt and tie
bodyL = c.poly([(0, 48), (0, 30), (3, 27), (8, 26), (13, 26), (18, 28), (20, 48)])
c.fill(bodyL, '2'); c.outside(bodyL, '1', 8, 31, 10, 6); c.rim(bodyL, '3', 0, -1, 1, only='2')
c.fill(c.rect(7, 21, 12, 26), 'I')
c.put(6, 25, ['33..33', '.3333.', '..11..', '..11..', '..11..', '..11..', '...1..'])
seg({
    11: [(5, 'KKKKKKKKKJ')],
    12: [(4, 'JKKKKKKKKKKJ')],
    13: [(4, 'JKMMMKKMMMKJ')],
    14: [(4, 'JKKKKKKKKKKJ')],
    15: [(4, 'JKKKzKKKKzKJ')],
    16: [(4, 'JKKKKKKJKKKJ')],
    17: [(4, 'JKKKKKKKJJKJ')],
    18: [(4, 'IKKJKKKKJKKJ')],
    19: [(4, 'IKKKIIIIKKJJ')],
    20: [(5, 'IKKKKKKKJJI')],
    21: [(6, 'IIIIIIIII')],
})
c.put(3, 14, ['K', 'J', 'I'])
hairL = c.poly([(3.5, 14), (3, 10), (5, 7.5), (10, 6.5), (15, 7.5), (16.5, 10), (16, 13), (14, 11.2), (10, 11), (6, 12), (4.5, 14)])
c.fill(hairL, 'N'); c.outside(hairL, 'M', 9.5, 8.5, 7, 4.2); c.fill(c.line(11, 7, 9, 11), 'M')
# ---- behind right (person 2): turtleneck
bodyR = c.poly([(27, 48), (28, 29), (32, 26.5), (41, 26), (45, 28), (47, 31), (47, 48)])
c.fill(bodyR, '2'); c.outside(bodyR, '1', 37, 31, 10, 6); c.rim(bodyR, '3', 0, -1, 1, only='2')
neckR = c.rect(34, 21, 41, 26)
c.fill(neckR, '2'); c.fill(c.rect(34, 21, 41, 21), '3'); c.fill(c.rect(40, 22, 41, 26), '1')
for x in (36, 38): c.fill(c.rect(x, 23, x, 26), '1')
seg({
    11: [(33, 'SSSSSSSSSR')],
    12: [(32, 'RSSSSSSSSSSR')],
    13: [(32, 'RSVVSSSSVVSR')],
    14: [(32, 'RSzzSSSSzzSR')],
    15: [(32, 'RzSSzSSzSSzR')],
    16: [(32, 'RSSSSSRSSSSR')],
    17: [(32, 'RSSSQRSSSSRR')],
    18: [(32, 'RSQSSSQSSSRR')],
    19: [(32, 'RSSQQQSSSSRR')],
    20: [(33, 'RSSSSSSSRR')],
    21: [(34, 'QQQQQQQQ')],
})
c.put(44, 14, ['R', 'Q', 'Q'])
hairR = c.poly([(31.5, 14), (32, 10), (35, 7.5), (40, 7), (44, 9), (45, 13), (44.5, 16), (43, 12.5), (38, 11), (34, 11.5), (32.5, 14)])
c.fill(hairR, 'V'); c.outside(hairR, 'U', 37, 9, 7.5, 3.6)
bun = c.ellipse(42.5, 6, 2.6, 2.4)
c.fill(bun, 'V'); c.outside(bun, 'U', 42, 5.5, 2.4, 2.2); c.edge(bun, 'U')
c.shift(c.mask_of('IJKLQRST'), -1)                                      # behind: skin a value darker
c.g = [['.'] * 48 for _ in range(3)] + c.g[:45]                         # and 3px lower (template depth rule)
# ---- in front (person 0)
hairF = c.poly([(14.5, 30), (14.5, 20), (15.5, 14), (19, 10.5), (25, 9.8), (30.5, 11), (32.6, 15), (33, 22), (32.6, 30), (31, 29), (31, 17), (17, 17), (17, 29)])
c.fill(hairF, 'F'); c.outside(hairF, 'E', 23, 18, 11, 14)
body = c.poly([(9, 48), (10, 40), (14, 37), (20, 35.5), (28, 35.5), (34, 37), (38, 40), (39, 48)])
c.fill(body, '3'); c.outside(body, '2', 22, 41, 14, 9); c.rim(body, '4', 0, -1, 1, only='3')
blouse = c.poly([(19.5, 35.5), (28.5, 35.5), (24, 43)])
c.fill(blouse, '4')
lapL = c.poly([(16, 36.4), (19.5, 35.5), (24, 43.5), (21.5, 44), (17.5, 39)])
lapR = c.poly([(28.5, 35.5), (32, 36.4), (30.5, 39), (26.5, 44), (24, 43.5)])
c.fill(lapL, '2'); c.fill(lapR, '2'); c.rim(lapL, '3', -1, 0, 1); c.edge(lapL, '1'); c.edge(lapR, '1')
c.fill(c.rect(20, 30, 27, 35), 'A'); c.fill(c.rect(20, 33, 21, 35), 'B')
blk(c, 17, 16, '''
|BBBBBBBBBBBBBBA
|CDDDDCCCCCCCCBA
|CEEECCCCEEECCBA
|CBBBBCCCBBBBCBA
|CzzzCCCCzzzCCBA
|zyzDzzzzyzDzCBA
|CzzzCDCCzzzCCBA
|CDDDCCDBCCCCCBA
|CCDCCDDACCCCCBA
|CCBCCCCCCBCCBBA
|CCCBAAAABCCCBBA
|BCCCCDDCCCCCBA.
|.BCCCCCCCCCBA..
|..ABBBBBBBBA...
''')
bangs = c.poly([(16, 17), (16.5, 13), (20, 10.6), (26, 10.2), (30.5, 11.2), (32.3, 14), (32, 17), (30, 15.2), (25, 15.6), (20, 15.2)])
c.fill(bangs, 'F'); c.outside(bangs, 'E', 22, 12, 10, 4)
c.edge(hairF | bangs | (c.mask_of('ABCDyz') & c.rect(16, 16, 31, 29)), None)
# clipboard against her chest, her hand on it
board = c.rect(29, 38, 38, 48)
c.fill(board, '1')
paper = c.rect(30, 40, 37, 48)
c.fill(paper, '4')
for y in (42, 44, 46): c.fill(c.rect(31, y, 35 if y != 44 else 36, y), '2')
c.put(32, 37, ['zzz'])
c.edge(board, 'z')
c.put(27, 41, ['.CD', 'CCC', 'BCC'])
PORTRAIT = {'id': 'benders.hr', 'name': 'HR', 'kind': 'member', 'sphere': 'colorless',
            'people': [{'skin': 'coolbrown', 'hair': 'black'}, {'skin': 'freckled', 'hair': 'ginger'}, {'skin': 'golden', 'hair': 'grey'}],
            'accent': 'teal', 'px': c.rows()}
