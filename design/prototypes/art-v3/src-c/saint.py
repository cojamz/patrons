import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Patron Saint (silver): a serene woman under a silver veil, eyes closed, a gentle smile, a gold halo ring behind her
# head (tilted into an oval, never a cross), hands together at her chest. Front view. Template: 1 person.
c = Canvas()
halo = c.ellipse(24, 10, 15, 7) - c.ellipse(24, 10, 12.4, 5)
c.fill(halo, 'c'); c.fill(halo & c.rect(0, 0, 23, 9), 'd'); c.fill(halo & c.rect(25, 10, 47, 47), 'b')
body = cloth(c, [(2, 48), (3, 40), (8, 35.5), (17, 33.5), (30, 33.5), (39, 35.5), (44, 40), (45, 48)])
veil = c.poly([(10, 46), (11, 30), (13, 18), (16, 11), (22, 7.6), (26, 7.6), (32, 11), (35, 18), (37, 30), (38, 46), (33, 44),
               (32, 28), (31, 17), (17, 17), (16, 28), (15, 44)])
c.fill(veil, '4'); c.outside(veil, '3', 21, 16, 12, 18); c.outside(veil, '2', 19, 14, 15, 26); c.rim(veil, '5', -1, -1, 1, only='4')
neck(c, 20, 27, 28, 33)
f = face(c, (17, 11, 30, 28), 19, view='front', jaw='narrow', eyes='closed', mouth='smile', brows='arch', ear=False, top=(0,))
c.fill(veil & c.rect(0, 0, 47, 15), '4'); c.fill(c.rect(17, 15, 30, 16) & veil, '3')
c.rim(veil, '5', -1, -1, 1, only='4')
c.put(16, 15, ['3', '3']); c.put(31, 15, ['2', '2'])
c.put(18, 16, ['F.F' * 0])
# hands together in prayer at the chest
c.put(21, 36, ['.DB.BA.', '.DCBCA.', 'DDCBCBA', 'DCCBCBA', 'CCCBBBA', '.4433..', '.4433..'][0:7])   # two palms together, a centre split, silver cuffs
PORTRAIT = {'id': 'silver.saint', 'name': 'Patron Saint', 'kind': 'member', 'sphere': 'silver',
            'people': [{'skin': 'warmtan', 'hair': 'brown'}], 'accent': 'red', 'px': c.rows()}
