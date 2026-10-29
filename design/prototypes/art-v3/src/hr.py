import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from draw import Canvas

# HR (colorless, counts as 3): the department. In front, a manager in glasses and a black bob with a clipboard;
# behind her, a young man with a side parting and a tie, and an older woman with a grey bun. Polite smiles all round.
c = Canvas()
# ---- behind left (person 1)
bodyL = c.poly([(0, 48), (0, 33), (3, 29.5), (8, 27.5), (15, 27.5), (20, 30), (22, 48)])
c.fill(bodyL, '3'); c.outside(bodyL, '2', 8, 32, 11, 7); c.rim(bodyL, '4', 0, -1, 1, only='3')
c.put(9, 27, ['kjjk', '.ji.', '.vu.', '.wv.', '.wv.'])                 # collar and tie
c.fill(c.rect(8, 22, 13, 27), 'I')
FACE_L = [
    '...KKKKKKKJ...',  # 12
    '..KLLKKKKKKJ..',  # 13
    '.KLLKKKKKKKJJ.',  # 14
    '.KKKNNNKKNNNJJ',  # 15
    'JKKMMMKKKMMMKJ',  # 16
    'JKKy!zKKKy!zKJ',  # 17
    'JKKJJKKKKJJKKJ',  # 18
    '.KKKKKKLKKKKKJ',  # 19
    '.KKKKKKKLLKKJ.',  # 20
    '.JKKKKKKJJKKJ.',  # 21
    '.JKKIKKKKKIKJ.',  # 22
    '..JKKIIIIIKJ..',  # 23
    '...JJKKKKJJ...',  # 24
    '.....IIII.....',  # 25
]
assert all(len(r) == 14 for r in FACE_L)
c.put(4, 12, FACE_L)
c.put(2, 16, ['.K', 'KJ', 'JI'])
hairL = c.poly([(3.5, 17), (3, 11), (6, 7.5), (11, 6.5), (16, 7.5), (18.5, 10.5), (18.5, 15), (17, 13), (14, 12), (10, 12.4), (7, 14.5), (5, 16)])
c.fill(hairL, 'O'); c.outside(hairL, 'N', 9, 9, 9, 4.5); c.fill(hairL & c.ellipse(8, 9, 3, 1.4), 'P')
c.fill(c.line(11, 8, 9, 12), 'M')                                   # the parting
# ---- behind right (person 2)
bodyR = c.poly([(26, 48), (27, 31), (31, 28), (38, 27.5), (44, 29.5), (47, 33), (47, 48)])
c.fill(bodyR, '3'); c.outside(bodyR, '2', 36, 32, 10, 7); c.rim(bodyR, '4', 0, -1, 1, only='3')
c.put(33, 27, ['ijji', '.jj.'])
c.fill(c.rect(34, 22, 39, 27), 'Q')
FACE_R = [
    '...SSSSSSSR...',  # 12
    '..STTSSSSSSR..',  # 13
    '.STTSSSSSSSRR.',  # 14
    '.SVVVSSVVVSSRR',  # 15
    '.SzzzSSzzzzSRR',  # 16
    '.S!zRSS!zyRSRR',  # 17
    '.SRRRSSRRRRSSR',  # 18
    'RSSSSTSSSSSSRR',  # 19
    'TTSSTSSSSSSRR.',  # 20
    'RQQSSSSSSSSRR.',  # 21
    '.SQSSSSQSSSRR.',  # 22
    '..SQQQQQSSRR..',  # 23
    '...RRSSSSRR...',  # 24
    '.....QQQQ.....',  # 25
]
assert all(len(r) == 14 for r in FACE_R)
c.put(30, 12, FACE_R)
c.put(44, 16, ['S.', 'RQ', 'Q.'])
hairR = c.poly([(30, 15), (30.5, 10), (34, 7.5), (39, 7), (43, 9), (44.5, 13), (44, 17), (42.5, 13), (38, 11.5), (33, 12), (31, 15.5)])
c.fill(hairR, 'W'); c.outside(hairR, 'V', 36, 9, 8, 4); c.fill(hairR & c.ellipse(34, 9, 3, 1.3), 'X')
bun = c.ellipse(42.5, 7, 2.8, 2.6)
c.fill(bun, 'W'); c.outside(bun, 'V', 42, 6.5, 2.5, 2.3); c.set(41, 6, 'X'); c.edge(bun, 'U')
c.shift(c.mask_of('12345ijkuvw'), -1)
# ---- in front (person 0)
hairF = c.poly([(13.5, 30), (13, 20), (14.5, 12), (19, 8.5), (25, 7.6), (31, 8.8), (34.5, 13), (35, 21), (34.5, 30), (31, 28), (17, 28)])
c.fill(hairF, 'F'); c.outside(hairF, 'E', 22, 16, 12, 13.5); c.fill(hairF & c.ellipse(20, 10.5, 5, 2.2), 'G')
c.fill(hairF & c.ellipse(18.5, 10, 2.5, 1.0), 'H')
body = c.poly([(9, 48), (10, 40), (14, 35), (20, 32.5), (29, 32.5), (35, 35), (38, 40), (39, 48)])
c.fill(body, '3'); c.outside(body, '2', 22, 39, 14, 11); c.outside(body, '1', 20, 38, 18, 14); c.rim(body, '4', 0, -1, 1, only='3')
blouse = c.poly([(20.5, 32.5), (28.5, 32.5), (24.5, 40)])
c.fill(blouse, 'k'); c.fill(c.line(25, 34, 25, 38), 'j'); c.edge(blouse, '1')
c.fill(c.rect(21, 28, 28, 33), 'A')
FACE = [
    '...BCCCCCCCCCCCBA..',  # 15
    '..BCDDCCCCCCCCCBBA.',  # 16
    '.BCDDCCCCCCCCCCCBBA',  # 17
    '.CCEEECCCCCEEEECCBA',  # 18
    '.CnnnnnCCCnnnnnnCBA',  # 19
    '.Cn!zynnnnny!zynBBA',  # 20
    '.CnCCDnCDCnCCCDnBBA',  # 21
    '.CBnnnBCDCBnnnnBBBA',  # 22
    '.CCBBBCCDCCBBBBCCBA',  # 23
    '.CDDCCCCDDCCCCCCCBA',  # 24
    '.CDCCCCCBAACCCCCCBA',  # 25
    '..CCCCCCCCCCCCCCBA.',  # 26
    '..CCACCCCCACCCCCBA.',  # 27
    '..BCCAzzzACCCCCBBA.',  # 28
    '...BCCCDDDCCCCBA...',  # 29
    '....BBCCCCCCBBA....',  # 30
    '......AAAAAAA......',  # 31
]
assert all(len(r) == 19 for r in FACE)
c.put(15, 14, FACE)
bangs = c.poly([(15, 17), (16, 12.5), (20, 10.5), (26, 10.2), (31, 11), (34, 14), (34, 18), (31, 15.5), (26, 15), (21, 15.3), (17, 16)])
c.fill(bangs, 'F'); c.outside(bangs, 'E', 23, 12, 10, 4.4); c.fill(bangs & c.ellipse(21, 12, 4, 1.4), 'G')
c.edge(hairF | bangs | c.mask_of('ABCDyz!'), None)
# clipboard, held against her chest
board = c.rect(28, 37, 37, 47)
c.fill(board, 'r'); c.rim(board, 's', -1, -1, 1); c.edge(board, 'q')
paper = c.rect(29, 39, 36, 47)
c.fill(paper, 'k'); c.rim(paper, 'l', -1, -1, 1)
for y in (41, 43, 45): c.fill(c.rect(30, y, 34 if y != 43 else 35, y), 'j')
c.put(31, 36, ['ghhg', 'gffg'])
c.put(26, 40, ['.CD', 'CCC', 'BCC'])                                # her hand on the board
PORTRAIT = {'id': 'benders.hr', 'name': 'HR', 'kind': 'member', 'sphere': 'colorless',
            'people': [{'skin': 'tan', 'hair': 'black'}, {'skin': 'porcelain', 'hair': 'ginger'}, {'skin': 'ebony', 'hair': 'grey'}],
            'accent': 'teal', 'px': c.rows()}
