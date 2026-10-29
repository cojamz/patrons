import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Understudy (green): a young actor who has learned every part, called on at the last minute. Neat side-parted hair,
# worried brows, mouthing his lines over an open script held in both hands. 3/4 to our left. Template: 1 person.
c = Canvas()
body = torso(c, 2, 45, 33)
c.fill(c.poly([(18, 33), (29, 33), (23.5, 39)]), 'k'); c.fill(c.poly([(20, 33), (27, 33), (23.5, 36)]), 'j')   # shirt
c.fill(c.poly([(21.5, 33.4), (25.5, 33.4), (23.5, 35.5)]), '1')                                         # bow tie
neck(c, 20, 26, 28, 33)
face(c, 15, 32, 13, 28, 19, 19, [(15, 'i3l'), (21, 'i4l')], (17, ['.AA.', 'AzzA', '.AA.']), jaw='soft', hair='F',
     brows=[(15, -3, ['FF']), (21, -3, ['FF..', '..FF'])], plane=5, cheek=False, ear=(31, 'R'), mouth_y=24)
c.put(22, 20, ['DDD', '.DD'])
hair = c.poly([(14, 17), (13.6, 11.5), (16, 8), (21, 6.4), (27, 6.8), (31.5, 9), (33.4, 13), (33, 18.5), (31.2, 17), (30, 14),
               (23, 13), (18, 13.6), (15.4, 17)])
c.fill(hair, 'F'); c.outside(hair, 'E', 21, 9.5, 10, 4.2); c.rim(hair, 'G', -1, -1, 1, only='F')
c.fill(c.line(18, 13, 18, 8), 'E'); c.fill(c.line(19, 13, 25, 8), 'G')                              # side part
c.edge(hair, 'E')
# the script, open, held up in both hands
pg = c.poly([(10, 38), (23.5, 40), (37, 38), (37, 47.6), (23.5, 48), (10, 47.6)])
c.fill(pg, 'k'); c.fill(pg & c.rect(24, 38, 37, 48), 'j'); c.fill(c.line(23, 40, 23, 47), 'i'); c.fill(c.line(24, 40, 24, 47), 'i')
for y in (42, 44, 46):
    c.fill(c.rect(13, y, 20, y), 'i' if y != 44 else 'j'); c.fill(c.rect(27, y, 34, y), 'i')
c.edge(pg, 'i')
c.put(6, 39, ['.CCD', 'CCCC', 'BCCB', '.BB.']); c.put(38, 39, ['DCC.', 'CCCC', 'BCCB', '.BB.'])
PORTRAIT = {'id': 'echo.understudy', 'name': 'Understudy', 'kind': 'member', 'sphere': 'green',
            'people': [{'skin': 'fair', 'hair': 'brown'}], 'accent': 'red', 'px': c.rows()}
