import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Doorman (blue), batch c: the gatekeeper of a good club, finished from the sample. Top hat with a blue band, grey
# walrus moustache, stern and level eyes, 3/4 to our left. Greatcoat with a stand collar and two gold buttons; arms
# at his sides behind a velvet rope on a brass post (the folded arms read as stripes at 1x; the rope is the story). Template: 1 person.
c = Canvas()

# ---- greatcoat: sloped shoulders, double-breasted, arms at his sides
body = c.poly([(1, 48), (2, 41), (6, 36.5), (15, 33.5), (32, 33.5), (41, 36.5), (45, 41), (46, 48)])
c.fill(body, '3'); c.outside(body, '2', 19, 38, 20, 11); c.outside(body, '1', 17, 38, 26, 15)
c.rim(body, '4', 0, -1, 1, only='3')
c.fill(c.line(9, 39, 10, 47), '2'); c.fill(c.line(38, 39, 37, 47), '1')               # where the arms meet the coat
front = c.poly([(17, 34), (31, 34), (30, 48), (18, 48)])
c.fill(front, '2'); c.rim(front, '3', 1, 0, 1); c.fill(c.line(24, 35, 24, 47), '1')
for y in (37, 41): c.put(20, y, ['cc', 'bb']); c.put(27, y, ['cc', 'bb'])          # brass buttons
# ---- stand collar
collar = c.poly([(16.5, 30.5), (20, 29.6), (24, 31.2), (28, 29.6), (31.5, 30.5), (32, 34.4), (24, 35.4), (16, 34.4)])
c.fill(collar, '3'); c.rim(collar, '4', 0, -1, 1, only='3'); c.fill(collar & c.rect(26, 0, 47, 47), '2'); c.edge(collar, '1')
c.fill(c.line(24, 31, 24, 35), '1')
c.put(22, 31, ['yy.', 'y..'])                                                # white stock at the throat
c.fill(c.rect(19, 28, 27, 29), 'A')
# ---- the velvet rope: a brass post at the left, the rope swagging across in front of him
import math
for x in range(7, 48):
    t = (x - 7) / 40
    yc = round(40.5 + 5.2 * math.sin(math.pi * min(1, t * 1.15)))
    c.set(x, yc, 'w'); c.set(x, yc + 1, 'v'); c.set(x, yc + 2, 'u' if x < 0 else 'm')
post = c.rect(3, 39, 6, 47)
c.fill(post, 'b'); c.fill(c.rect(3, 39, 3, 47), 'c'); c.fill(c.rect(6, 39, 6, 47), 'a')
c.put(2, 34, ['.ccb.', 'cccbb', 'cbbba', '.aaa.'])                          # ball finial
c.put(2, 38, ['abbba'])
c.put(7, 40, ['cw', 'bv'])                                                   # the rope's hook
# ---- face (x 15..32), stern and level (from the sample)
seg(c, {
    14: [(15, 'BBBBBBBBBBBBAAAAAA')],
    15: [(15, 'CCCCCCCCCCCCBGFBAA')],
    16: [(15, 'CDDCCCCCCCCCBGFBAA')],
    17: [(15, 'CFFFCCFFFFFCBGFBAA')],
    18: [(15, 'BzzBCBzzzBBCBFFBBA')],
    19: [(15, 'CzyBCCzyyBCBFBBBBA')],
    20: [(15, 'CCCCDCBCCCCCBBBBBA')],
    21: [(15, 'CDDDBCCCCCCCBBBBAA')],
    22: [(15, 'CDDBACCCCCCCBBBBBA')],
    23: [(15, 'FGGGCGGFFCCCBBBBBA')],
    24: [(14, 'FGGGFCFGGFCCBBBBA')],
    25: [(14, 'F.'), (16, 'ABBBAFFCCBBBBA')],
    26: [(15, 'BCCCDDCCCCCBBBA')],
    27: [(16, 'BBCCCCCCCBBBA')],
    28: [(17, 'ABBBBBBBBAA')],
})
c.put(31, 17, ['.BA', 'BCA', 'BBA', 'BA.'])                                    # C-shaped ear, shadow side
# ---- top hat
crown = c.poly([(17, 11), (16.5, 1), (32.5, 0.5), (32, 11)])
c.fill(crown, 'n'); c.fill(crown & c.rect(17, 0, 20, 11), 'o'); c.fill(crown & c.rect(29, 0, 33, 11), 'm')
c.fill(crown & c.rect(0, 8, 47, 10), '3'); c.fill(crown & c.rect(29, 8, 47, 10), '2'); c.fill(crown & c.rect(0, 8, 47, 8), '4')
brim = c.poly([(11.5, 11), (14, 12), (35, 12), (37.5, 11), (36.5, 13.6), (12.5, 13.6)])
c.fill(brim, 'n'); c.fill(brim & c.rect(0, 11, 47, 12), 'o'); c.fill(brim & c.rect(30, 12, 47, 13), 'm')
c.g = [[('m' if k == 'z' else k) for k in r] for r in c.g]       # ink shares the hat's darkest step
PORTRAIT = {'id': 'market.doorman', 'name': 'Doorman', 'kind': 'member', 'sphere': 'blue',
            'people': [{'skin': 'fair', 'hair': 'grey'}], 'accent': 'red', 'px': c.rows()}
