import sys, os; sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from draw import Canvas

# Kingpin (magenta): a heavy crime boss in a fedora, eyes in the brim's shadow, cigar in a smug mouth.
c = Canvas()
# suit: huge shoulders, wide peaked lapels with a satin sheen, dark shirt, gold tie
body = c.poly([(1, 48), (2, 40), (7, 35), (16, 32), (32, 32), (41, 35), (46, 40), (47, 48)])
c.fill(body, '2')
c.fill(body & c.ellipse(12, 37, 11, 5), '3')
c.outside(body, '1', 17, 36, 24, 16)
c.rim(body, '4', 0, -1, 1, only='3'); c.rim(body, '3', 0, -1, 1, only='2')
shirt = c.poly([(18.5, 32), (29.5, 32), (26, 45), (22, 45)])
c.fill(shirt, 'n'); c.fill(c.line(26, 33, 27, 36), 'm')
tie = c.poly([(22.5, 33), (25.5, 33), (25, 35), (26, 43), (24, 45.5), (22, 43), (23, 35)])
c.fill(tie, 'c'); c.fill(c.line(25, 36, 25, 43), 'b'); c.fill(c.rect(23, 33, 23, 34), 'd'); c.fill(c.line(23, 36, 23, 41), 'd')
lapL = c.poly([(15.5, 32), (19, 32), (23, 45), (17.5, 41), (19, 37), (13.5, 35)])
lapR = c.poly([(29, 32), (32.5, 32), (34.5, 35), (29, 37), (30.5, 41), (25, 45)])
c.fill(lapL, '4'); c.rim(lapL, '5', -1, 0, 1); c.fill(lapR, '2'); c.rim(lapR, '3', -1, 0, 1)
c.edge(lapL, '1'); c.edge(lapR, '1')
# fedora: pinched crown, magenta band, wide brim tipped down over the eyes
crown = c.poly([(14, 11.5), (15, 6.5), (18, 4.2), (22, 4.6), (24, 5.6), (26, 4.6), (30, 4.2), (33, 6.5), (34, 11.5)])
c.fill(crown, 'o'); c.outside(crown, 'n', 21, 7, 12, 7); c.fill(crown & c.ellipse(19, 5.5, 4, 1.8), 'p')
c.fill(crown & c.rect(14, 9, 34, 10), '3'); c.fill(crown & c.rect(30, 9, 34, 10), '2')
brim = c.poly([(7.5, 13.5), (11, 11.2), (37, 11.2), (41, 12.4), (39.5, 14.8), (30, 14.4), (18, 14.4), (10, 15.4)])
c.fill(brim, 'n'); c.fill(brim & c.rect(0, 11, 47, 11), 'o'); c.fill(brim & c.rect(9, 12, 20, 12), 'p')
c.fill(brim & c.rect(30, 14, 47, 15), 'm')
# face, by hand (x 13..34): lit side plane on the left, eyes in the brim's shade, nose turned to our right,
# a smug mouth with the cigar in its right corner
FACE = [
    '...EAAAAAAAAAAAAAAAA..',  # 15
    '...EBBBBBBBBBBBBBBBA..',  # 16
    '..EFEEEEEBBBEEEEBBBAA.',  # 17
    '..FBBzzzzBCBzzzBBBBAA.',  # 18
    '..ECByz!BCDCz!BCCCCBA.',  # 19
    '.BECCBBBCCDDBBCCCCCBA.',  # 20
    'CAECDDCCCCCDBCCCCCCBA.',  # 21
    'CAECDCCCCCCDDBCCCCCBA.',  # 22
    '.BBCCCCCCCCCDDACCCCBA.',  # 23
    '..BCCCCCCCBAAAACCCCBA.',  # 24
    '..BCCCBCCCCCCCCCBCCBA.',  # 25
    '..BCCBCCCCCCCCzCBCCBA.',  # 26
    '..ACCBCzAAAAAzrsssxgA.',  # 27
    '..ABCCCCDDDCCCqqqrwfA.',  # 28
    '...ABCCCCCCCCCCCCBA...',  # 29
    '....ABBCCDDCCCCBBA....',  # 30
    '......ABBCCCCBBAA.....',  # 31
    '.......AAAAAAAA.......',  # 32
]
assert all(len(r) == 22 for r in FACE)
c.fill(c.rect(19, 30, 29, 33), 'A')                                 # neck
c.put(19, 33, ['lkkk', '.kkj', '..kj']); c.put(26, 33, ['kkjj', 'kji.', 'ji..'])     # shirt collar points
c.put(13, 15, FACE)
c.put(31, 26, ['.h', 'h.'])                                         # a curl of smoke
PORTRAIT = {'id': 'thieves.kingpin', 'name': 'Kingpin', 'kind': 'member', 'sphere': 'magenta',
            'people': [{'skin': 'olive', 'hair': 'black'}], 'accent': 'orange', 'px': c.rows()}
