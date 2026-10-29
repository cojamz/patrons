import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Weaver (yellow): a weaver looking down at her work, a long braid over her shoulder, a pale wooden shuttle with pointed ends in her hand
# trailing a line of thread. Calm, absorbed. 3/4 to our right. Template: 1 person.
c = Canvas()
body = torso(c, 2, 45, 33)
c.fill(c.poly([(18, 33), (29, 33), (28, 35), (19, 35)]), '1')
neck(c, 20, 26, 28, 33, keys='BC')
face(c, 15, 31, 13, 28, 19, 25, [(18, 'down4'), (27, 'down3')], (22, ['AAA']), jaw='soft', hair='F',
     brows=[(18, -2, ['FFFF']), (27, -2, ['FFF'])], ear=None, mouth_y=25, lit=3)
c.put(22, 26, ['DD'])
hair = c.poly([(13.6, 24), (13.2, 14), (15, 9.5), (19, 7.2), (24, 6.6), (29, 7.4), (32.6, 10.5), (33.4, 15), (33, 22),
               (31.2, 22), (31, 15.4), (27, 13), (20, 13.2), (15.6, 16), (15.4, 24)])
c.fill(hair, 'F'); c.outside(hair, 'E', 21, 11, 11, 6); c.rim(hair, 'G', -1, -1, 1, only='F')
c.fill(c.line(24, 7, 21, 13), 'E')
c.edge(hair, 'E')
# braid over her right shoulder (our left), down her front
braid = c.poly([(12.5, 24), (16, 24), (18, 42), (15, 42.5)])
c.fill(braid, 'F'); c.rim(braid, 'G', -1, 0, 1, only='F')
for y in range(25, 42, 2): c.fill(braid & c.line(13, y, 18, y + 2), 'E')                          # plaits, one rope
c.edge(braid, 'E')
c.put(15, 43, ['vv', 'uu'])
# the shuttle in her hand, a thread trailing
sh = c.poly([(19, 40), (27, 37.4), (38, 37.4), (47, 40), (38, 42.6), (27, 42.6)])
c.fill(sh, 'k'); c.fill(sh & c.rect(0, 41, 47, 43), 'j'); c.fill(sh & c.rect(0, 37, 47, 38), 'l')
c.fill(c.rect(29, 39, 36, 40), 'i'); c.fill(c.rect(30, 40, 35, 40), 'v')                             # slot, thread wound in it
c.edge(sh, 'i')
c.fill(c.line(30, 40, 19, 47), 'v')
c.put(39, 42, ['.CCD', 'CCCC', 'BCCB', '.BB.'])
PORTRAIT = {'id': 'yellow.weaver', 'name': 'Weaver', 'kind': 'member', 'sphere': 'yellow',
            'people': [{'skin': 'deep', 'hair': 'black'}], 'accent': 'red', 'px': c.rows()}
