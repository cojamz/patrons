import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Doppelganger (green): she holds up a mask of her own face on a stick, and both look at you sideways. Sleek black bob
# with a blunt fringe, high collar. The mask is a pale face of her own, two dark eye holes.
# 3/4 to our right. Template: 1 person.
c = Canvas()
body = torso(c, 2, 45, 33)
c.fill(c.poly([(17, 30), (30, 30), (31, 35), (16, 35)]), '2'); c.fill(c.rect(17, 30, 30, 30), '4')    # high collar
neck(c, 20, 26, 28, 30)
face(c, 15, 31, 13, 28, 19, 25, [(18, 'o4r'), (27, 'o3r')], (22, ['AAAA']), jaw='pointed', hair='F', ear=None,
     mouth_y=24)
c.put(22, 25, ['.DD'])
bob = c.poly([(13, 27), (13, 15), (14.5, 10.5), (18, 7.6), (24, 6.8), (29.5, 8), (32.6, 11.5), (33.5, 16), (33.5, 27),
              (31.4, 27.6), (31.2, 16.5), (16, 16.4), (15.2, 27.5)])
c.fill(bob, 'F'); c.outside(bob, 'E', 21, 13, 11, 10); c.rim(bob, 'G', -1, -1, 1, only='F')
c.fill(c.line(15, 16, 31, 16), 'E')
c.edge(bob, 'E')
# the mask on its stick: a pale face-only oval with two dark eye holes, gold-rimmed
c.fill(c.rect(40, 19, 41, 33), 'r'); c.fill(c.rect(41, 19, 41, 33), 'q')
mask = c.ellipse(40, 13, 5, 6.4)
c.fill(mask, 'D'); c.outside(mask, 'C', 39, 12, 4.6, 6); c.fill(mask & c.ellipse(38.5, 10, 2, 1.5), 'k' if False else 'D')
c.put(37, 12, ['zz..zz', 'zz..zz'])                                                   # two eye holes
c.put(39, 15, ['DB']); c.put(39, 17, ['BB'])
c.edge(mask, 'c')
c.put(38, 30, ['CCCD', 'CCCC', 'BCCB', 'BCCB', '.BB.'])                               # her fist round the stick
PORTRAIT = {'id': 'echo.doppel', 'name': 'Doppelganger', 'kind': 'member', 'sphere': 'green',
            'people': [{'skin': 'warmtan', 'hair': 'black'}], 'accent': 'red', 'px': c.rows()}
