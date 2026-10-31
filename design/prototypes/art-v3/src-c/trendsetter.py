import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Trendsetter (blue, counts as 3): whatever she wears, everyone wears next. In front: a woman with a neat black crop
# in a red beret at a tilt, a cool closed smile, a blue scarf. Behind left and right, lower and darker: two
# followers in the very same red beret, side-eyeing her to get it right. Template: 3 people.
c = Canvas()
# behind left (person 1): fair, side-swept brown hair, admiring (brows up, a little "oh")
behind3(c, 1, 'L', look=1, brows='raised', mouth='o',
        hair_pts=[(3, 21), (3, 14), (5, 11), (14, 11), (16.4, 13), (16, 17), (13, 14.6), (8, 15.6), (5, 15), (4.6, 21)])
# behind right (person 2): olive, straight chin-length black hair, studying her (brows knit, mouth flat)
behind3(c, 2, 'R', look=-1, brows='worried', mouth='flat', jaw='square', hair_lo='U', hair_hi='V',
        hair_pts=[(31, 25), (31, 14), (33, 11), (42, 11), (44.5, 14), (44.5, 25), (43, 25), (42.6, 15), (33, 15), (32.6, 25)])
def beret(x, y, w, tilt):
    m = c.poly([(x, y + 3), (x + 1, y + 1), (x + w * .3, y - .4), (x + w * .75, y - .6), (x + w + tilt, y + 1.4), (x + w + tilt - .5, y + 3.4)])
    c.fill(m, 'v'); c.outside(m, 'u', x + w * .4, y + .4, w * .55, 2.6); c.rim(m, 'w', -1, -1, 1, only='v')
    c.put(round(x + w * .5), y - 2, ['u', 'u'])
    return m
beret(2, 9, 12, 3); beret(32, 8, 12, -1)                                    # the copies, at their own tilts
# ---- in front (person 0)
body = c.poly([(9, 48), (10, 40), (14, 37), (20, 35.5), (28, 35.5), (34, 37), (38, 40), (39, 48)])
c.fill(body, '3'); c.outside(body, '2', 22, 41, 14, 9); c.rim(body, '4', 0, -1, 1, only='3')
scarf = c.poly([(17, 33), (31, 33), (32, 37), (27, 39), (21, 39), (16, 37)])
c.fill(scarf, '4'); c.outside(scarf, '3', 22, 34, 8, 3.4); c.edge(scarf, '1')
c.fill(c.poly([(26, 38), (29, 38), (30, 46), (26, 46)]), '3'); c.fill(c.rect(29, 39, 30, 46), '2')   # scarf tail
neck(c, 21, 27, 29, 33)
f = face(c, (17, 13, 31, 29), 21, view='r', jaw='narrow', eyes='round', look=0, mouth='smile', brows='level', ear=True)
lift(c, f['m'] - c.rect(0, 0, 47, 13) - c.mask_of('zy!') - c.rect(0, 28, 47, 29))
c.fill(c.rect(31, 17, 31, 27) & f['m'], 'A')
c.put(24, 25, ['B...B', '.AAA.'])                                               # a cool closed smile

# short black hair, a neat crop, under the beret
h = c.poly([(15.5, 25), (15.5, 17), (17, 14), (31, 14), (32.5, 17), (32.5, 25), (31.2, 25), (31, 18), (17, 18), (16.8, 25)])
c.fill(h, 'F'); c.outside(h, 'E', 21, 16, 8, 6)
beret(14, 12, 17, 3)
c.put(15, 16, ['F', 'F']); c.put(32, 16, ['E', 'E'])
# one row of jaw shadow, then the neck in its own tones (no dark block under the chin); a lip tone under the mouth
c.put(21, 29, ['CCCCCBB', 'CCCCCBB']); c.put(25, 27, ['CC'])
c.g = [[{'M': 'N', 'U': 'V', '!': 'y'}.get(k, k) for k in r] for r in c.g]   # merge the tiny ramps steps
PORTRAIT = {'id': 'market.trendsetter', 'name': 'Trendsetter', 'kind': 'member', 'sphere': 'blue',
            'people': [{'skin': 'deep', 'hair': 'black'}, {'skin': 'fair', 'hair': 'brown'}, {'skin': 'olive', 'hair': 'black'}],
            'accent': 'red', 'px': c.rows()}
