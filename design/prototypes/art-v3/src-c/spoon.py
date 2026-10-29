import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Upstart (silver, id silver.spoon): new money, eyeing whoever has most. A young man with slicked-back hair and a
# scheming side-glance (brows down, a small closed smile), loud silver suit, a big silver spoon held up like a prize.
# 3/4 to our right. Template: 1 person.
c = Canvas()
body = cloth(c, [(1, 48), (1, 40), (3, 36.5), (8, 34.5), (17, 33.5), (30, 33.5), (39, 34.5), (44, 36.5), (46, 40), (46, 48)])
shirt = c.poly([(19.5, 33), (28.5, 33), (24, 44.5)]); c.fill(shirt, 'v'); c.fill(shirt & c.rect(25, 33, 30, 45), 'u')
lapL = c.poly([(14.5, 33.5), (19.5, 33), (23.4, 44.6), (20.6, 44.6), (16, 38.5), (12.5, 35.8)])
lapR = c.poly([(28.5, 33), (33.5, 33.5), (35.5, 35.8), (32, 38.5), (27.4, 44.6), (24.6, 44.6)])
c.fill(lapL, '4'); c.edge(lapL, '1'); c.fill(lapR, '2'); c.rim(lapR, '3', -1, 0, 1); c.edge(lapR, '1')
neck(c, 20, 27, 28, 32)
f = face(c, (15, 10, 32, 28), 19, view='r', jaw='narrow', eyes='round', look=1, mouth='smile', brows='stern')
h = c.poly([(13.5, 21), (13.5, 13), (16, 8.5), (22, 6.4), (30, 6.8), (34, 9.5), (35.5, 13), (34, 15), (31, 13), (24, 12.5), (18, 13.6),
            (15.6, 21)])
c.fill(h, 'F'); c.outside(h, 'E', 22, 9, 12, 4.8); c.rim(h, 'G', -1, -1, 1, only='F')
for y in (9, 11): c.fill(c.line(18, y, 31, y - 1), 'G')                           # combed-back lines
# the silver spoon held up beside his face at a slant, bowl up-right, his fist round the handle
c.put(37, 2, ['...fggf', '..fhhggf', '.fhhgggf', 'fhhgggfe', 'fgggffe.', 'fgffee..', '.fee....', 'fe......'])
for i in range(10): c.put(36 - i // 2, 10 + i, ['fe'])
c.put(32, 19, ['.CCD', 'CCCC', 'BCCC', 'BBCB', '.BB.'])
PORTRAIT = {'id': 'silver.spoon', 'name': 'Upstart', 'kind': 'member', 'sphere': 'silver',
            'people': [{'skin': 'golden', 'hair': 'black'}], 'accent': 'violet', 'px': c.rows()}
