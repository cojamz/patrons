import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Muse (green): the one everyone copies. A laurel of green leaves on a high cloud of hair, eyes up and away, dreaming, a
# small closed smile, a draped gown pinned at the shoulder with a gold clasp. 3/4 to our left. Template: 1 person.
c = Canvas()
body = torso(c, 2, 45, 33)
c.fill(c.poly([(15, 33.5), (32, 33.4), (24, 41)]), '2')                                            # the drape's neckline
c.fill(c.line(16, 34, 24, 41), '4'); c.fill(c.line(24, 41, 31, 34), '1')
for x0 in (9, 13): c.fill(c.line(x0, 37, x0 + 4, 47), '2')                                        # folds from the clasp
c.fill(c.line(32, 38, 35, 47), '1')
c.put(9, 33, ['.bb.', 'bccb', 'bcdb', '.bb.'])                                                      # clasp
neck(c, 20, 26, 28, 33, keys='BC')
face(c, 15, 32, 13, 28, 19, 19, [(15, 'i3l'), (21, 'i4l')], (17, ['A..A', '.AA.', '.DD.']), jaw='pointed', hair='F',
     brows=[(15, -3, ['FF']), (21, -3, ['.FFF'])], socket=False, plane=5, cheek=False, ear=(30, 'R'), mouth_y=24, lit=3)
c.put(20, 17, ['D'], keep='.'); c.put(20, 18, ['D']); c.put(21, 20, ['DDD', 'DDD', '.DD'])
hair = c.ellipse(24.5, 8.5, 11.5, 7.5) | c.ellipse(32, 17, 4.4, 7.5)
hair -= c.poly([(14, 17), (14.5, 13.6), (29, 13.6), (29.5, 26), (14, 26)])
c.fill(hair, 'F'); c.outside(hair, 'E', 22, 7, 11, 7); c.rim(hair, 'G', -1, -1, 1, only='F')
for x, y in ((18, 3), (24, 2), (30, 3), (21, 6), (27, 6), (33, 8)): c.put(x, y, ['GG'], keep='.')
c.edge(hair, 'E'); c.fill(hair & c.rect(0, 0, 47, 47) - c.ellipse(24.5, 8.5, 11.5, 7.5), 'F'); c.rim(hair & c.rect(28, 13, 40, 30), 'G', -1, 0, 1, only='F')
# laurel: pairs of green leaves along the hairline, tips pointing back
for i, (x, y) in enumerate(((13, 13), (16, 11), (19, 10), (22, 9), (25, 9), (28, 10), (31, 11))):
    c.put(x, y, ['44.', '343', '.2.'] if i % 2 == 0 else ['.4.', '343', '.22'])
PORTRAIT = {'id': 'echo.muse', 'name': 'Muse', 'kind': 'member', 'sphere': 'green',
            'people': [{'skin': 'verydeep', 'hair': 'black'}], 'accent': 'red', 'px': c.rows()}
