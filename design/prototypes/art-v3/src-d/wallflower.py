import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Wallflower (green): shy at the party, half behind her long hair, round glasses, holding one small flower up at
# cheek height, a small sheepish smile, eyes sliding away. Chunky cardigan. 3/4 to our right. Template: 1 person.
c = Canvas()
body = torso(c, 2, 45, 33)
c.fill(c.poly([(18, 33), (29, 33), (23.5, 40)]), 'k')
for pts in ([(14, 34), (18, 33), (24, 43), (24, 48), (14, 48)], [(29, 33), (34, 34), (34, 48), (24, 48), (24, 43)]):
    c.fill(c.poly(pts), '2')
c.rim(c.poly([(14, 34), (18, 33), (24, 43), (24, 48), (14, 48)]), '4', -1, 0, 1, only='2')
for y in (38, 42, 46): c.put(24, y, ['c'])
neck(c, 20, 26, 28, 33)
face(c, 15, 31, 13, 28, 19, 25, [(18, 'i4r'), (27, 'i3r')], (22, ['A..A', '.AA.']), jaw='pointed', hair='F',
     brows=[(18, -3, ['..FF', 'FF..']), (27, -3, ['FF.', '..F'])], ear=None, mouth_y=24)
c.put(17, 17, ['.ffff.', 'f....f', 'f....f', '.ffff.'], keep='.'); c.put(26, 17, ['.fff.', 'f...f', 'f...f', '.fff.'], keep='.')
c.put(23, 18, ['fff'])
c.put(17, 22, ['ww'], keep='.')                                                                       # a blush
hair = c.poly([(13, 34), (12.5, 18), (13.5, 11.5), (17, 7.6), (23, 6.4), (29, 7.4), (32.6, 11), (33.4, 17), (33.2, 30),
               (31.2, 31), (31, 18), (28, 14), (21, 13.4), (16.5, 15), (15.4, 22), (15.4, 34)])
c.fill(hair, 'F'); c.outside(hair, 'E', 21, 13, 10.5, 9); c.rim(hair, 'G', -1, -1, 1, only='F')
c.fill(c.line(24, 7, 29, 13), 'E'); c.fill(c.line(17, 9, 14, 20), 'G')
c.edge(hair, 'E')
# the little flower, raised in her hand at cheek height
c.fill(c.line(36, 21, 36, 28), '1')
c.put(34, 17, ['.vv.', 'vwwv', 'vwcv', '.vv.'])
c.put(34, 27, ['.CCD', 'CCCC', 'BCCB', '.BB.'])
arm = c.poly([(34, 30.5), (38, 30.5), (39, 36), (35, 36)]); c.fill(arm, '2'); c.edge(arm, '1')
PORTRAIT = {'id': 'echo.wallflower', 'name': 'Wallflower', 'kind': 'member', 'sphere': 'green',
            'people': [{'skin': 'olive', 'hair': 'darkbrown'}], 'accent': 'rose', 'px': c.rows()}
