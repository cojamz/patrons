import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Fan Club (green): the president of the fan club, beside herself. Two high puffs of hair, eyes wide and bright, laughing,
# a fan-club jacket, a pennant with a star waved over her shoulder. Facing us. Template: 1 person.
c = Canvas()
body = torso(c, 2, 45, 33)
c.fill(c.poly([(18, 33), (29, 33), (23.5, 38)]), 'B')
neck(c, 20, 27, 28, 33)
face(c, 15, 32, 14, 28, 19, 23, [(17, 'i4c'), (26, 'i4c')], (21, ['AAAAAA', 'AzzzzA', '.AzzA.', '..AA..']), jaw='soft', hair='F',
     brows=[(17, -4, ['.FF.', 'F..F']), (26, -4, ['.FF.', 'F..F'])], ear=None, mouth_y=24, lit=2, chin_lit=False, cheek=False)
c.put(16, 21, ['DD'])
c.put(17, 22, ['DD'], keep='.'); c.put(28, 22, ['BB'], keep='.')
hair = c.poly([(14, 19), (14, 14), (16, 11), (21, 9.6), (27, 9.6), (31, 11), (33, 14), (33, 19), (31.4, 15), (24, 13.4), (16.5, 15)])
c.fill(hair, 'F'); c.outside(hair, 'E', 21, 11.5, 9, 3); c.rim(hair, 'G', -1, -1, 1, only='F')
for cx in (13.5, 33.5):
    puff = c.ellipse(cx, 7, 5, 4.6)
    c.fill(puff, 'F'); c.outside(puff, 'E', cx - 1, 6, 4.4, 4); c.rim(puff, 'G', -1, -1, 1, only='F'); c.edge(puff, 'E')
c.edge(hair, 'E')
# pennant over her shoulder
c.fill(c.line(38, 4, 40, 40), 'r'); c.fill(c.line(39, 4, 41, 40), 'q')
pen = c.poly([(39, 2.5), (47.8, 9.5), (39.6, 17)])
c.fill(pen, 'v'); c.outside(pen, 'u', 40, 7, 9, 6); c.fill(pen & c.rect(0, 2, 47, 5), 'w'); c.put(40, 7, ['..c..', 'ccccc', '.ccc.', '.c.c.'])
c.put(37, 31, ['.CCD', 'CCCC', 'BCCB', '.BB.'])
PORTRAIT = {'id': 'echo.mirror', 'name': 'Fan Club', 'kind': 'member', 'sphere': 'green',
            'people': [{'skin': 'brown', 'hair': 'black'}], 'accent': 'orange', 'px': c.rows()}
