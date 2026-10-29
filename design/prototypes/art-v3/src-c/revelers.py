import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Revelers (silver, counts as 3): a party that never ends. In front: a laughing man with curly hair, eyes shut,
# popping a bottle of fizz that sprays up and over. Behind left and right, lower and darker: two friends laughing along.
# Bits of gold confetti in the air. Template: 3 people.
c = Canvas()
behind3(c, 1, 'L', eyes='laugh', mouth='smile', brows='raised',
        hair_pts=[(3, 22), (3, 14), (5, 10.4), (10, 9.4), (15, 10.6), (16.5, 14), (16.4, 22), (15, 15), (6, 14.6), (4.5, 22)])
behind3(c, 2, 'R', eyes='laugh', mouth='smile', brows='raised',
        hair_pts=[(31, 17), (31.5, 13), (34, 10.4), (40, 10), (43.5, 12), (44.5, 17), (43, 14.6), (33, 14.6), (32.5, 17)],
        hair_lo='U', hair_hi='V')
# ---- in front (person 0)
body = c.poly([(9, 48), (10, 40), (14, 37), (20, 35.5), (28, 35.5), (34, 37), (38, 40), (39, 48)])
c.fill(body, '3'); c.outside(body, '2', 22, 41, 14, 9); c.rim(body, '4', 0, -1, 1, only='3')
c.fill(c.poly([(20, 35.5), (28, 35.5), (24, 40)]), '1')
c.put(22, 35, ['zz.zz', 'zzzzz'])                                                    # loosened bow tie
neck(c, 21, 27, 29, 35)
f = face(c, (17, 13, 31, 29), 21, view='front', jaw='round', eyes='laugh', mouth='open', brows='raised', ear=True)
curls = c.poly([(16, 21), (15.5, 14), (18, 10), (24, 8.4), (30, 10), (32.5, 14), (32, 21), (30.5, 16), (18, 16), (17.5, 21)])
c.fill(curls, 'F'); c.outside(curls, 'E', 23, 11, 9, 5); c.rim(curls, 'G', -1, -1, 1, only='F')
for (x, y) in ((17, 11), (21, 9), (26, 9), (29, 12), (19, 13), (24, 12)): c.put(x, y, ['GF', 'FE'])
# the bottle: dark green glass held up at the right, the cork's spray arcing up
bottle = c.poly([(33, 47), (33, 38), (35, 35), (36, 30), (38, 30), (39, 35), (41, 38), (41, 47)])
c.fill(bottle, 'v'); c.fill(bottle & c.rect(39, 30, 41, 47), 'u'); c.fill(c.line(34, 39, 34, 46), 'w')
c.fill(c.rect(36, 30, 38, 32), 'c'); c.fill(c.rect(36, 39, 40, 43) & bottle, 'k')       # foil, label
c.put(31, 41, ['DC', 'CC', 'BB'])
for (x, y) in ((37, 28), (36, 26), (38, 25), (35, 23), (39, 23), (37, 21), (34, 20), (40, 20)): c.put(x, y, ['y'])
c.put(35, 24, ['y'])
merge(c, {'M': 'N', 'U': 'V', 'G': 'F', '4': '3', '!': 'y', 'k': 'y', 'b': 'c', 'w': 'v', 'D': 'C'})
PORTRAIT = {'id': 'silver.revelers', 'name': 'Revelers', 'kind': 'member', 'sphere': 'silver',
            'people': [{'skin': 'tan', 'hair': 'brown'}, {'skin': 'palepink', 'hair': 'blonde'}, {'skin': 'golden', 'hair': 'black'}],
            'accent': 'green', 'px': c.rows()}
