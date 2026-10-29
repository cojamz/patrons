import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Roadie (green): the crew. Broad, bearded, a cap on backwards, a coil of grey cable with a plug slung over his shoulder,
# unimpressed and level. Facing us, a touch to our right. Template: 1 person.
c = Canvas()
body = torso(c, 0, 47, 32)
c.fill(c.poly([(18, 32), (29, 32), (28, 34), (19, 34)]), '1')                                     # crew neck
neck(c, 20, 27, 28, 32)
face(c, 15, 32, 13, 28, 19, 24, [(18, 'o4c'), (27, 'o3c')], (22, ['AAAA']), jaw='square', hair='F',
     brows=[(17, -2, ['FFFFF']), (27, -2, ['FFFF'])], ear=(13, 'L'), mouth_y=24)
beard = c.poly([(15, 21), (16.5, 21), (18, 24.5), (29, 24.5), (30.5, 21), (32, 21), (32, 26), (29, 30), (24, 31.2), (18.5, 30), (15.5, 26)])
c.fill(beard, 'F'); c.outside(beard, 'E', 22, 24.5, 9, 6); c.fill(beard & c.ellipse(18, 26, 2, 2), 'G')
c.put(21, 23, ['FFFFFFF'], keep='.'); c.put(22, 25, ['AAAA'])
cap = c.poly([(14, 15), (14.5, 10), (17, 7), (24, 5.6), (30, 6.6), (33, 9.5), (33.5, 15)])
c.fill(cap, '3'); c.outside(cap, '2', 21, 9, 9.5, 4.6); c.fill(cap & c.ellipse(19, 7.6, 3, 1.4), '4')
c.fill(c.rect(14, 14, 33, 15) & cap, '2')
c.put(21, 12, ['.11.', '1..1'], keep='.')                                                           # the strap gap
c.fill(c.poly([(32, 13), (37, 13.5), (37, 16), (33, 16)]), '2'); c.put(32, 13, ['1111'])           # peak, backwards
# cable coil over his left shoulder (our right)
for rx, ry in ((7, 5), (5.6, 4)):
    ring = c.ellipse(36, 37, rx, ry) - c.ellipse(36, 37, rx - 1.6, ry - 1.6)
    c.fill(ring, 'f'); c.fill(ring & c.rect(0, 0, 47, 35), 'g'); c.fill(ring & c.rect(38, 38, 47, 47), 'e')
c.fill(c.line(29, 41, 30, 44), 'f'); c.put(29, 44, ['eee', 'efe', 'eee', 'g.g'])        # the plug
PORTRAIT = {'id': 'echo.roadie', 'name': 'Roadie', 'kind': 'member', 'sphere': 'green',
            'people': [{'skin': 'tan', 'hair': 'darkbrown'}], 'accent': 'red', 'px': c.rows()}
