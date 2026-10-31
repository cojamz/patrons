import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Dyer (yellow): a dyer at the vats, sleeves rolled, holding up a skein of fresh violet cloth that drips, proud of the
# colour. Grey crop, big grey moustache, a leather apron over a yellow smock. 3/4 to our right. Template: 1 person.
c = Canvas()
body = torso(c, 2, 45, 33)
apron = c.poly([(15, 37), (32, 37), (33, 48), (14, 48)])
c.fill(apron, 'r'); c.fill(apron & c.rect(28, 37, 33, 48), 'q'); c.fill(c.rect(15, 37, 32, 37), 's')
c.fill(c.line(16, 37, 19, 33), 'q'); c.fill(c.line(31, 37, 28, 33), 'q')
c.fill(c.poly([(18.5, 33), (28.5, 33), (23.5, 37)]), '2')
neck(c, 20, 27, 28, 33)
face(c, 15, 32, 13, 28, 19, 26, [(19, 'i4c'), (28, 'i3c')], (23, ['.AAA.']), jaw='square', hair='F',
     brows=[(19, -2, ['FFFF']), (28, -2, ['FFF'])], ear=(13, 'L'), mouth_y=25)
st = c.poly([(19, 22.6), (26, 22.4), (30.5, 23.4), (31, 25.5), (28, 24.8), (25, 24.6), (22, 24.8), (18, 25.4)])
c.fill(st, 'G'); c.outside(st, 'F', 23, 22.5, 6, 2); c.fill(st & c.rect(19, 22, 23, 23), 'H')
hair = c.poly([(14, 17), (14, 11), (17, 8), (24, 7), (30, 8), (33, 11), (33, 17), (31.5, 14), (24, 12.4), (16, 14)])
c.fill(hair, 'G'); c.outside(hair, 'F', 22, 9.5, 9, 3.5); c.rim(hair, 'H', -1, -1, 1, only='G'); c.edge(hair, 'F')
# the dyed skein, held up on his right (our right), dripping
sk = c.poly([(34, 9), (44, 9), (43.5, 14), (44.5, 22), (42.5, 30), (40, 26), (38, 31), (36, 25), (34.5, 20), (35, 14)])
c.fill(sk, 'v'); c.outside(sk, 'u', 37.5, 15, 6, 10); c.fill(c.line(37, 11, 37, 22), 'w'); c.fill(c.line(41, 12, 41, 20), 'u')
c.fill(c.rect(34, 9, 44, 10), 'w')
for x, y in ((40, 33), (37, 35), (43, 34)): c.put(x, y, ['v', 'u'])
c.put(37, 5, ['.CCD', 'CCCC', 'BCCB', '.BB.'])
c.put(36, 9, ['vv', 'vv'], keep='.')
PORTRAIT = {'id': 'yellow.dyer', 'name': 'Dyer', 'kind': 'member', 'sphere': 'yellow',
            'people': [{'skin': 'palepink', 'hair': 'grey'}], 'accent': 'violet', 'px': c.rows()}
