import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Hot Streak (purple): a lucky player on a roll, dark quiff, purple waistcoat over rolled shirtsleeves, holding up a
# pair of dice between two fingers. Delighted: brows up, a small open smile. Front, oval face. Template: 1 person.
c = new()
b = body(c, [(3, 48), (4, 40), (9, 35.5), (17, 33.5), (30, 33.5), (38, 35.5), (43, 40), (44, 48)], 20, 38, 19, 11)
sh = c.poly([(18, 33.5), (29, 33.5), (27.5, 48), (20.5, 48)]); c.fill(sh, 'k'); c.fill(sh & c.rect(25, 33, 30, 48), 'j')
c.fill(c.poly([(22.6, 34), (25.4, 34), (25.2, 36.2), (23.2, 36.2)]), 'o'); tie = c.poly([(23.2, 36.2), (25, 36.2), (27, 44.5), (25.4, 47), (23.8, 44.5)])
c.fill(tie, 'n'); c.fill(tie & c.rect(25, 36, 28, 47), 'm')               # black tie, knot and a slanted taper (no crossbar)
for y in (39, 43): c.put(20, y, ['c']); c.put(27, y, ['b'])
neck(c, 19, 28, 28, 34)
face(c, 'oval', 15, 19, eyes='dark', brows='raised', mouth='grin', iris='q')
ear(c, 32, 18); ear(c, 13, 18, 'L')
hair(c, [(14, 17), (14, 10), (16, 6), (22, 3), (30, 2.6), (35, 5), (33, 8), (33.6, 11), (33.6, 17), (32.6, 17), (32, 14), (26, 12.6),
         (19, 12), (16, 14), (15, 17)], 0, 22, 8, 11, 5)
c.fill(c.line(18, 8, 26, 4), 'F'); c.fill(c.line(21, 10, 29, 5), 'F')
# two dice held up, our right
for x0, y0 in ((35, 30), (40, 34)):
    d = c.rect(x0, y0, x0 + 5, y0 + 5)
    c.fill(d, 'k'); c.fill(c.rect(x0, y0, x0 + 5, y0), 'l'); c.fill(c.rect(x0 + 5, y0 + 1, x0 + 5, y0 + 5), 'j'); c.edge(d, 'i')
c.put(36, 32, ['z..', '.z.', '..z'][:3]); c.put(41, 36, ['z.z', '...', 'z.z'])
c.put(33, 36, ['.CCCD', 'CCCCC', 'BCCCB', '.BBB.'])                               # the fingers pinching the dice
PORTRAIT = portrait('purple.streak', 'Hot Streak', 'purple', [{'skin': 'warmtan', 'hair': 'darkbrown'}], c, merge={'i': 'j', 'm': 'n'})
