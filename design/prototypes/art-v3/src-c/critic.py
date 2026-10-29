import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Critic (blue): a sharp critic, black hair scraped back into a tight top bun from a side part, round glasses and a blue turtleneck, unimpressed
# (level brows pulled in, a flat mouth), pencil poised over a little notepad. Front view. Template: 1 person.
c = Canvas()
# a tight top bun behind the crown (drawn first, the head overlaps it)
bun = c.ellipse(30, 6, 4.4, 3.8); c.fill(bun, 'F'); c.outside(bun, 'E', 29, 5, 3.6, 3); c.rim(bun, 'G', -1, -1, 1, only='F')
body = cloth(c, [(2, 48), (3, 40), (8, 35.5), (17, 33.5), (30, 33.5), (39, 35.5), (44, 40), (45, 48)])
neck(c, 20, 27, 28, 31)
tn = c.poly([(18.5, 29.5), (29.5, 29.5), (30.5, 35), (24, 36), (17.5, 35)])               # rolled turtleneck
c.fill(tn, '3'); c.rim(tn, '4', 0, -1, 1); c.fill(tn & c.rect(27, 29, 31, 36), '2'); c.edge(tn, '1')
c.fill(c.line(18, 33, 30, 33), '2')
f = face(c, (16, 9, 31, 28), 19, view='front', jaw='narrow', mouth='flat', brows='level', ear=True, eyes='none', socket=False)
# black hair scraped back from a side part, one swept wave across the forehead, ears showing
cap = c.poly([(15, 16), (15, 12), (18, 8.6), (24, 7.6), (30, 8.6), (32.6, 12), (32.6, 16), (31, 13), (26, 11.6), (21, 12.4), (17, 15.4)])
c.fill(cap, 'F'); c.outside(cap, 'E', 21, 10, 9, 3.6); c.rim(cap, 'G', -1, -1, 1, only='F')
c.fill(c.line(20, 8, 19, 11), 'E')                                               # the side part
c.put(15, 16, ['F', 'E'])
# round glasses
c.put(16, 17, ['.111.....111.', '1!DD11111!DD1', '1Czz1...1Czz1', '.111.....111.'])   # two navy-rimmed lenses, a 1px bridge row, a glint each
c.put(29, 18, ['B'])
# pencil and notepad
pad = c.rect(32, 37, 41, 47)
c.fill(pad, 'k'); c.fill(c.rect(32, 37, 41, 37), 'l'); c.fill(c.rect(40, 38, 41, 47), 'j')
for y in (40, 42, 44): c.fill(c.rect(33, y, 38, y), 'j')
c.edge(pad, '1')
pencil = c.line(26, 47, 34, 39) | c.line(27, 47, 35, 39)
c.fill(pencil, 'c'); c.fill(c.line(27, 47, 35, 39), 'b'); c.put(35, 38, ['z'])
c.put(23, 42, ['..D..', '.CDCD', 'CCCCB', 'BCCBB', '.BBB.'])                         # her hand on the pencil: thumb, knuckles
PORTRAIT = {'id': 'market.critic', 'name': 'Critic', 'kind': 'member', 'sphere': 'blue',
            'people': [{'skin': 'golden', 'hair': 'black'}], 'accent': 'red', 'px': c.rows()}
