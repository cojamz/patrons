import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Admirer (yellow): smitten. A young man in a sweater vest holds one red rose in front of his chest for someone off to our right, brows up,
# a hopeful closed smile. Short twists. 3/4 to our right. Template: 1 person.
c = Canvas()
body = torso(c, 2, 45, 33)
c.fill(c.poly([(17, 33), (30, 33), (23.5, 40)]), 'k'); c.fill(c.poly([(19, 33), (28, 33), (23.5, 36)]), 'j')
neck(c, 20, 27, 28, 33)
face(c, 15, 32, 13, 28, 19, 26, [(19, 'i4r'), (28, 'i3r')], (23, ['A...A', '.AAA.']), jaw='soft', hair='F',
     brows=[(19, -3, ['.FFF']), (28, -3, ['FF.'])], ear=(13, 'L'), mouth_y=24, lit=2, cheek=False)
c.put(17, 21, ['DD'])
hair = c.poly([(14, 16), (14, 11), (16.5, 7.6), (22, 6), (28, 6.4), (32, 9), (33.4, 13), (33, 16), (31, 14), (26, 13.2),
               (19, 13.6), (15.6, 16)])
c.fill(hair, 'F'); c.outside(hair, 'E', 22, 9.5, 10, 4)
for x in range(16, 33, 3):
    for y in (8, 11): c.put(x + (y % 2), y, ['G', 'E'])
c.edge(hair, 'E')
# the rose, held up
c.fill(c.line(31, 37, 27, 46), '1')
rose = c.ellipse(31.5, 34, 3.4, 3.2)
c.fill(rose, 'v'); c.outside(rose, 'u', 31, 33.5, 3.2, 3); c.put(30, 32, ['ww', 'wx'], keep='.'); c.put(31, 34, ['u'])
c.edge(rose, 'u')
c.put(28, 40, ['CD'])
PORTRAIT = {'id': 'yellow.admirer', 'name': 'Admirer', 'kind': 'member', 'sphere': 'yellow',
            'people': [{'skin': 'deep', 'hair': 'black'}], 'accent': 'red', 'px': c.rows()}
