import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Host (red): the life of the party. A round, balding man with a big moustache, laughing eyes, a black bow tie and a
# red velvet jacket with a shawl collar, raising a coupe of something fizzy. Front view. Template: 1 person.
c = Canvas()
body(c, [(1, 48), (2, 40), (7, 35.5), (16, 33.5), (31, 33.5), (40, 35.5), (45, 40), (46, 48)])
c.fill(c.poly([(19, 33), (29, 33), (24, 44)]), 'k')
shawlL = c.poly([(14, 34.2), (19, 33), (24, 45), (21, 45), (15, 38)])
shawlR = c.poly([(29, 33), (34, 34.2), (33, 38), (27, 45), (24, 45)])
c.fill(shawlL, '2'); c.rim(shawlL, '4', -1, 0, 1); c.edge(shawlL, '1')
c.fill(shawlR, '1'); c.rim(shawlR, '2', -1, 0, 1)
neck(c, 0, 20, 27, 29, 33)
c.put(20, 31, ['nn.nn', 'nnznn', 'nn.nn'])                           # bow tie
# bald crown, then the face
crown = c.ellipse(24, 15.5, 9.3, 7.5)
c.fill(crown, 'C'); c.outside(crown, 'B', 22.5, 14, 8.6, 7.2); c.fill(c.rect(19, 9, 22, 10) & crown, 'D')
face(c, 0, 15, 19, 18, 6, 9, view='f', eyes='laugh', mouth=None, jaw='round', dk=False)
# side hair, a fringe of it round the back
for pts in ([(13.5, 21), (13.5, 15), (15, 12.5), (17, 12.5), (16.6, 17), (15.6, 21)],
            [(31.4, 21), (30.8, 16), (31, 12.5), (33, 12.5), (34.4, 15), (34.4, 21)]):
    m = c.poly(pts); hair(c, m, 0, 14, 13, 3, 4)
# moustache: a broad brush with curled tips, over a smile
c.put(17, 22, ['F...........F'])
c.put(17, 23, ['FGGFF...FGGFF'])
c.put(18, 24, ['EFFFFEFFFFE'])
c.put(21, 25, ['AzzzA', '.CDD.'])                                  # laughing, mouth open under it
# the coupe, raised in his right hand (our right)
c.put(35, 24, ['.kkkkkkk.', 'jdddddddj', '.jcccccj.', '..jjjjj..', '....j....', '....j....', '....j....'])
c.put(36, 23, ['.!..!'])
arm = c.poly([(34, 48), (35, 40), (38, 34.5), (42, 34.5), (43.5, 40), (44, 48)])
c.fill(arm, '3'); c.rim(arm, '4', -1, -1, 1, only='3'); c.outside(arm, '2', 37, 38, 5, 9); c.edge(arm, '1')
c.put(37, 31, ['.CDC.', 'CCCCB', 'BCCBA', '.BBA.'])
PORTRAIT = portrait(c, 'red.host', 'Host', 'red', [{'skin': 'coolbrown', 'hair': 'darkbrown'}])
