import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Go-Between (yellow): a courier who carries word both ways. A peaked cap, a satchel strap across the chest, a sealed
# letter held up by the face, a knowing sideways look. 3/4 to our left. Template: 1 person.
c = Canvas()
body = torso(c, 2, 45, 33)
c.fill(c.poly([(18, 33), (29, 33), (23.5, 38)]), '1')
strap = c.poly([(30, 33.4), (34, 34), (17, 48), (12, 48)])
c.fill(strap, 'q'); c.fill(strap & c.line(31, 34, 14, 48), 'r')
c.put(9, 44, ['bc'])
neck(c, 20, 26, 28, 33)
face(c, 15, 32, 13, 28, 19, 19, [(15, 'o2l'), (21, 'o4l')], (17, ['AAA.', '...A']), jaw='round', hair='F',
     brows=[(15, -2, ['FF']), (21, -2, ['FFFF'])], plane=5, cheek=False, ear=(31, 'R'), mouth_y=24)
c.put(22, 20, ['DDD', '.DD'])
hair = c.poly([(28, 18), (28.5, 13), (33.5, 13), (33.8, 19), (32, 21)])
c.fill(hair, 'F'); c.fill(c.rect(33, 13, 33, 19) & hair, 'E')
cap = c.poly([(14, 14), (14.5, 9), (18, 6.4), (25, 5.8), (31, 7), (33.6, 10.5), (34, 14)])
c.fill(cap, '3'); c.outside(cap, '2', 22, 8.5, 10, 4.6); c.fill(cap & c.ellipse(19, 7.4, 3.6, 1.4), '4')
c.fill(c.rect(14, 12, 34, 14) & cap, '1'); c.fill(c.rect(14, 12, 34, 12) & cap, '2')
peak = c.poly([(9, 15.5), (11, 13.4), (22, 13.4), (21, 15.6)])
c.fill(peak, '2'); c.fill(peak & c.rect(0, 13, 47, 13), '4')
c.put(14, 16, ['BBBBBBB'])
c.edge(cap | peak, '1')
# the sealed letter by his face
let = c.poly([(34, 18), (44, 16), (45.5, 24), (35.5, 26)])
c.fill(let, 'k'); c.fill(let & c.line(34, 18, 40, 22), 'j'); c.fill(let & c.line(44, 16, 40, 22), 'j')
c.fill(let & c.rect(43, 16, 46, 26), 'j'); c.edge(let, 'i')
c.put(39, 21, ['uv', 'uu'])
c.put(34, 25, ['.CCD', 'CCCC', 'BCCB', '.BB.'])
PORTRAIT = {'id': 'yellow.gobetween', 'name': 'Go-Between', 'kind': 'member', 'sphere': 'yellow',
            'people': [{'skin': 'fair', 'hair': 'auburn'}], 'accent': 'red', 'px': c.rows()}
