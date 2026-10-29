import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Critic (blue): a sharp critic in a black bob with blunt bangs, round glasses and a blue turtleneck, unimpressed
# (level brows pulled in, a flat mouth), pencil poised over a little notepad. Front view. Template: 1 person.
c = Canvas()
# hair behind the head first (the bob's back falls to the jaw)
back = c.poly([(12.5, 29), (12.5, 16), (15, 10), (21, 7.5), (27, 7.5), (33, 10), (35.5, 16), (35.5, 29), (31, 29), (17, 29)])
c.fill(back, 'F'); c.outside(back, 'E', 21, 15, 10, 13)
body = cloth(c, [(2, 48), (3, 40), (8, 35.5), (17, 33.5), (30, 33.5), (39, 35.5), (44, 40), (45, 48)])
neck(c, 20, 27, 28, 31)
tn = c.poly([(18.5, 29.5), (29.5, 29.5), (30.5, 35), (24, 36), (17.5, 35)])               # rolled turtleneck
c.fill(tn, '3'); c.rim(tn, '4', 0, -1, 1); c.fill(tn & c.rect(27, 29, 31, 36), '2'); c.edge(tn, '1')
c.fill(c.line(18, 33, 30, 33), '2')
f = face(c, (16, 9, 31, 28), 19, view='front', jaw='narrow', mouth='flat', brows='level', ear=False)
# blunt bangs and the bob's front, framing the face
bangs = c.poly([(14.5, 16.5), (15, 11), (19, 8.4), (27, 8), (32, 10), (33.5, 16.5)])
c.fill(bangs, 'F'); c.outside(bangs, 'E', 21, 10.5, 10, 4.6); c.rim(bangs, 'G', -1, -1, 1, only='F')
c.fill(c.line(16, 15, 32, 15) & bangs, 'E')
side = c.poly([(13, 29), (13.5, 16), (16.5, 16), (16.5, 29)]) | c.poly([(31.5, 29), (31.5, 16), (35, 16), (35, 29)])
c.fill(side, 'F'); c.fill(side & c.rect(32, 0, 47, 47), 'E'); c.rim(side, 'G', -1, 0, 1, only='F')
# round glasses
c.put(17, 17, ['.zzzz..zzzz.', 'z!CCCzzz!CCz', 'zCzzCz.zCzzz', '.zzzz...zzz.'])
c.put(29, 18, ['B'])
# pencil and notepad
pad = c.rect(32, 37, 41, 47)
c.fill(pad, 'k'); c.fill(c.rect(32, 37, 41, 37), 'l'); c.fill(c.rect(40, 38, 41, 47), 'j')
for y in (40, 42, 44): c.fill(c.rect(33, y, 38, y), 'j')
c.edge(pad, '1')
pencil = c.line(26, 47, 34, 39) | c.line(27, 47, 35, 39)
c.fill(pencil, 'c'); c.fill(c.line(27, 47, 35, 39), 'b'); c.put(35, 38, ['z'])
c.put(24, 43, ['.CCD', 'CCCC', 'BCCB', '.BB.'])                              # her hand on the pencil
PORTRAIT = {'id': 'market.critic', 'name': 'Critic', 'kind': 'member', 'sphere': 'blue',
            'people': [{'skin': 'golden', 'hair': 'black'}], 'accent': 'red', 'px': c.rows()}
