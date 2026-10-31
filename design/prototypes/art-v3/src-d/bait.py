import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Bait (green): an angler who lets you take the lure. Bucket hat, fishing vest, a bright fish lure dangling from the
# line in front of him; a sly sideways look at it, small closed smile. 3/4 to our right. Template: 1 person.
c = Canvas()
body = torso(c, 2, 45, 33)
c.fill(c.poly([(18, 33), (29, 33), (23.5, 39)]), 'B')                                  # open collar
c.fill(c.poly([(13, 34), (18, 33), (22.5, 44), (20, 47), (14, 47)]), '2')               # vest panels over the shirt
c.fill(c.poly([(29, 33), (35, 34), (34, 47), (27, 47), (25, 44)]), '2')
for x, y in ((15, 40), (30, 40)): c.put(x, y, ['1111', '1441', '1111'])                # pocket flaps
c.rim(c.poly([(13, 34), (18, 33), (22.5, 44), (20, 47), (14, 47)]), '4', -1, 0, 1, only='2')
neck(c, 20, 27, 28, 33)
face(c, 15, 32, 13, 28, 19, 26, [(19, 'o4r'), (28, 'o3r')], (23, ['A...A', '.AAA.']), jaw='soft', hair='F',
     brows=[(19, -2, ['.FFF']), (28, -3, ['FFF'])], ear=(13, 'L'), mouth_y=24)
# bucket hat
crown = c.poly([(16, 14), (16.5, 8.5), (19, 6), (28, 5.6), (31, 7.5), (32, 14)])
c.fill(crown, '3'); c.outside(crown, '2', 22, 9, 8, 4.5); c.fill(crown & c.ellipse(20, 7.5, 3, 1.4), '4')
c.fill(crown & c.rect(0, 12, 47, 13), '1')
brim = c.poly([(11, 17), (13.5, 13.4), (34.5, 13.4), (37, 17), (34, 17.6), (30, 15.6), (18, 15.6), (14, 17.6)])
c.fill(brim, '3'); c.fill(brim & c.rect(0, 13, 47, 13), '4'); c.fill(brim & c.rect(29, 14, 47, 18), '2')
c.fill(brim & c.rect(0, 16, 47, 18), '2')
c.put(18, 16, ['BBBBBBBBBBBBB'])                                                     # the brim's shadow
c.put(16, 13, ['AA'])
# line and lure, dangling in front of him on the right
c.fill(c.line(44, 0, 44, 13), 'i')
lure = c.poly([(41.5, 14), (44, 13), (46.5, 14.5), (47, 18), (45.5, 21.5), (44, 22.5), (42.5, 21), (41, 17.5)])
c.fill(lure, 'v'); c.outside(lure, 'u', 43.5, 16.5, 2.6, 4.6); c.fill(lure & c.rect(0, 13, 43, 16), 'w')
c.put(43, 15, ['z']); c.put(42, 22, ['vvv', '.u.'])                                    # eye, tail
c.put(45, 24, ['e.', 'e.', 'ee'])                                                      # hook
PORTRAIT = {'id': 'echo.bait', 'name': 'Bait', 'kind': 'member', 'sphere': 'green',
            'people': [{'skin': 'golden', 'hair': 'brown'}], 'accent': 'orange', 'px': c.rows()}
