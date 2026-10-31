import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Heir (silver): a young heir already bored by his fortune: neat side-parted hair, eyes rolled off to the side,
# a flat mouth, a silver waistcoat and cravat, the rolled-up will with its red wax seal tucked under his arm.
# 3/4 to our right. Template: 1 person.
c = Canvas()
body = cloth(c, [(1, 48), (1, 40), (3, 36.5), (8, 34.5), (17, 33.5), (30, 33.5), (39, 34.5), (44, 36.5), (46, 40), (46, 48)])
vest = c.poly([(17, 34), (31, 34), (32, 48), (16, 48)])
c.fill(vest, '2'); c.rim(vest, '3', -1, 0, 1); c.fill(c.line(24, 36, 24, 47), '1')
for y in (38, 41, 44): c.put(25, y, ['c'])
cravat = c.poly([(20.5, 32), (27.5, 32), (26, 38), (24, 39.5), (22, 38)])
c.fill(cravat, 'k'); c.fill(cravat & c.rect(25, 32, 30, 40), 'j'); c.edge(cravat, '1')
neck(c, 20, 27, 28, 32)
f = face(c, (15, 10, 32, 28), 19, view='r', jaw='narrow', eyes='round', look=1, mouth='flat', brows='level')
lift(c, f['m'] - c.mask_of('zy!') - c.rect(0, 27, 47, 28))   # deep skin: light the face so it reads at 1x
h = c.poly([(13.5, 20), (13.5, 13), (15.5, 9), (21, 6.6), (28, 6.8), (32.5, 9), (34, 13), (33.6, 19), (32, 14.6), (27, 13), (22, 13.6),
            (19, 12.4), (16.5, 14.6), (15.6, 20)])
c.fill(h, 'F'); c.outside(h, 'E', 21, 9, 11, 5); c.rim(h, 'G', -1, -1, 1, only='F')
c.fill(c.line(19, 8, 18, 12), 'E')                                               # the side part
c.fill(c.line(20, 8, 27, 7), 'G')
# the will: a rolled scroll under his arm, a red seal on a ribbon
scroll = c.poly([(2, 41), (4, 37.5), (18, 34.5), (20, 37.5), (18, 40.6), (4, 43.6)])
c.fill(scroll, 'k'); c.rim(scroll, 'l', 0, -1, 1, only='k'); c.fill(scroll & c.line(3, 43, 19, 40), 'j')
c.put(17, 35, ['jk', 'jjk', 'jj', 'j'][0:0])
c.put(17, 35, ['.jj', 'jkj', 'jjj', '.j.'])                                        # the roll's end
c.put(7, 43, ['.c...c', '.c...c', 'c.....c']); c.put(7, 38, ['.uuuu.', 'uvwvvu', 'uwvvvu', 'uvvvvu', '.uuuu.'])   # a round wax seal with a dark rim, two gold ribbon tails
PORTRAIT = {'id': 'silver.heir', 'name': 'Heir', 'kind': 'member', 'sphere': 'silver',
            'people': [{'skin': 'deep', 'hair': 'darkbrown'}], 'accent': 'red', 'px': c.rows()}
