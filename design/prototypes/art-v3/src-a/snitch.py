import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Snitch (magenta): he will tell. Collar turned up, brows knotted, a bead of sweat, one open hand up by his mouth as he
# whispers it to our left. Comic and nervous, not menacing. 3/4 to our left. Template: 1 person.
c = Canvas()
body(c, [(1, 48), (2, 40), (7, 35.5), (16, 33.5), (31, 33.5), (40, 35.5), (45, 40), (46, 48)])
c.fill(c.poly([(19, 33), (29, 33), (24, 44)]), 'k')
col = c.poly([(13, 36), (14, 29), (19, 27.6), (21, 33), (24, 44), (17, 39)])
c.fill(col, '4'); c.rim(col, '5', -1, 0, 1); c.edge(col, '2')
colR = c.poly([(35, 36), (34, 29), (29, 27.6), (27, 33), (24, 44), (31, 39)])
c.fill(colR, '2'); c.rim(colR, '3', -1, 0, 1); c.edge(colR, '1')
neck(c, 0, 21, 27, 28, 32)
face(c, 0, 15, 19, 18, 6, 9, view='l', eyes='worried', mouth='o', jaw='oval', dk=True)
hr = c.poly([(14, 19), (14.4, 13), (17, 9.6), (22, 8.4), (27, 8.6), (31.6, 10.6), (33.8, 14), (33.6, 19), (32.4, 18),
             (31.6, 14.6), (27, 13.4), (21, 13.6), (16.6, 14.6), (15.6, 19)])
hair(c, hr, 0, 22, 10.5, 9, 4)
c.put(14, 15, ['y', 'y'])                                                         # a bead of sweat at his temple
# the open hand at the side of his mouth, fingers up, palm to us: a whisper, not a fist
sl = c.poly([(5, 48), (6, 38), (9, 31.6), (14, 31.6), (15, 38), (14, 48)])
c.fill(sl, '3'); c.rim(sl, '4', -1, 0, 1, only='3'); c.fill(c.rect(13, 33, 15, 48) & sl, '2'); c.edge(sl, '1')
c.put(9, 19, ['C.C.C.', 'CDCDCB', 'CDCDCB', 'CCCCCB', 'CCDCCB', 'BCCCBA', '.BCCB.', '.BCCB.', '.BCBA.', '.BBBA.', '..BA..', '..BA..'])
c.put(8, 23, ['C', 'CC', 'BC'])                                                    # thumb
c.edge(c.mask_of('CD') & c.rect(8, 19, 14, 31), 'A')
c.fill(c.mask_of('D') & c.rect(8, 19, 14, 24), 't')                                # lit fingertips
PORTRAIT = portrait(c, 'thieves.snitch', 'Snitch', 'magenta', [{'skin': 'deep', 'hair': 'black'}])
