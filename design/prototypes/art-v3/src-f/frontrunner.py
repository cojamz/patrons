import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *
# Front-runner (colorless): you go first every round. A lean young runner already out ahead: spiky black hair swept
# back, a teal sweatband whose tails stream behind him, level brows, a set mouth. Crew-neck race tee with the bib
# "1" pinned on. True 3/4 to our right (ear on the lit side). Template: 1 person.
c = Canvas()
body = torso(c, [(2, 48), (3, 41), (7, 36.5), (16, 34), (31, 34), (39, 36), (43, 40), (45, 48)], 18, 40)
c.fill(c.line(9, 40, 10, 47), '2')
c.fill(c.rect(20, 28, 28, 34), 'A'); c.fill(c.rect(20, 31, 21, 34), 'B')
crew = c.poly([(18, 33.5), (24, 35.5), (30, 33.5), (31, 35), (24, 37.2), (17, 35)])
c.fill(crew, '2'); c.fill(crew & c.rect(0, 0, 22, 47), '4'); c.edge(crew, '1')
bib = c.rect(16, 39, 31, 47)
c.fill(bib, 'k'); c.fill(c.rect(16, 39, 31, 39), 'l'); c.fill(c.rect(29, 40, 31, 47), 'j')
c.put(22, 40, ['.zz', 'zzz', '.zz', '.zz', '.zz', '.zz', 'zzzz'])                 # the 1
# ---- face, 3/4 to our right. ruler x 14..33
blk(c, 14, 15, '''
|.ECCCCCCCCCCCCCCCBA.
|.ECDEEEEECCCCEEEBBA.
|.CCBBBBBBCCCBBBBBBA.
|.CBCzzzzBDCBzzzBBBA.
|.CACByz!BDCByzBBBBA.
|.CACCCCCCCDBCCCBBBA.
|.CBDDDCCCCDBCCCBBBA.
|..BCDDCCCCDDABCBBBA.
|..BCCCCCCCCBBBCBBBA.
|..BCCCCCAAAAABCBBA..
|..BCCCCCCBBCCCBBBA..
|...BCCCCDDCCCBBBA...
|....BBCCCCCCBBBA....
|.....ABBBBBBBBA.....
''')
c.put(13, 19, ['C', 'D', 'C'])                                                     # the ear's rim
# ---- spiky hair swept back (toward our left), lit rim on the top-left
hair = c.poly([(14.6, 15), (14.5, 10), (11, 8.5), (15, 7), (13, 4), (18, 4.6), (19, 1.5), (23, 4), (26, 1.6), (28, 4.2),
               (32, 3.4), (31.5, 6.4), (34, 8.5), (33.6, 15)])
c.fill(hair, 'F'); c.outside(hair, 'E', 22, 8, 10, 5); c.rim(hair, 'G', -1, -1, 1, only='F')
c.fill(c.line(17, 6, 20, 8) | c.line(23, 5, 25, 8), 'G')
# ---- sweatband, its tails streaming behind
band = c.poly([(14.5, 11.5), (33.6, 11), (33.6, 14.6), (14.5, 15)])
c.fill(band, 'w'); c.fill(band & c.rect(0, 11, 47, 11), 'x'); c.fill(band & c.rect(28, 12, 47, 15), 'v')
c.edge(band, 'u')
r1 = c.poly([(14.6, 11.4), (10.5, 10.4), (6, 8.6), (6.6, 10.8), (10.5, 12.6), (14.6, 13.6)])
c.fill(r1, 'w'); c.rim(r1, 'x', 0, -1, 1)
r2 = c.poly([(14.6, 13.4), (11, 14.4), (6.6, 15.8), (7.6, 17.6), (11.5, 16.2), (14.6, 15.2)])
c.fill(r2, 'v'); c.rim(r2, 'w', 0, -1, 1); c.edge(r1, 'u')
PORTRAIT = portrait('benders.frontrunner', 'Front-runner', c, [{'skin': 'golden', 'hair': 'black'}], 'teal')
