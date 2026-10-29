import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Debutante (silver, id silver.gala): her first ball. A young woman with her dark hair up, a gold tiara set with a
# blue stone, delighted (brows up, a small open smile), a silver gown off the shoulder.
# Front view. Template: 1 person.
c = Canvas()
body = c.poly([(2, 48), (3, 41), (7, 37), (14, 35), (34, 35), (41, 37), (45, 41), (46, 48)])
c.fill(body, 'C'); c.outside(body, 'B', 20, 39, 20, 10)                           # bare shoulders
gown = c.poly([(2, 48), (3, 41), (6, 37.5), (13, 36.6), (19, 38), (24, 39.5), (29, 38), (35, 36.6), (42, 37.5), (45, 41), (46, 48)])
c.fill(gown, '3'); c.outside(gown, '2', 20, 41, 18, 8); c.outside(gown, '1', 18, 41, 24, 11); c.rim(gown, '4', 0, -1, 1, only='3')
c.fill(c.line(17, 37, 24, 40) | c.line(24, 40, 31, 37), '5')
neck(c, 20, 27, 28, 35)
c.fill(c.rect(21, 30, 22, 34), 'D')
f = face(c, (16, 10, 31, 28), 19, view='front', jaw='narrow', eyes='round', look=0, mouth='smile', brows='raised', ear=False)
# dark hair swept up into a bun, framing the temples
h = c.poly([(14.5, 24), (14.5, 15), (16, 10.5), (20, 8), (27, 8), (31, 10.5), (32.5, 15), (32.5, 24), (31, 24), (31, 15),
            (28, 12.8), (24, 13.5), (19, 12.8), (16.6, 15), (16.4, 24)])
c.fill(h, 'F'); c.outside(h, 'E', 21, 11, 10, 6); c.rim(h, 'G', -1, -1, 1, only='F')
bun = c.ellipse(24, 4.5, 4.5, 3.6); c.fill(bun, 'F'); c.outside(bun, 'E', 23, 3.6, 4, 3); c.rim(bun, 'G', -1, -1, 1, only='F')
# tiara: a gold band with three points and a blue stone
c.put(17, 7, ['....c.....c....', '...cdc...cdc...', '..c.......c.c..'][0:0])
tiara = ['......d......', '.c...c3c...c.', 'cbc.cb4bc.cbc', 'bbbbbbbbbbbbb']
c.put(18, 6, tiara)
c.put(24, 7, ['3'])
c.fill(c.line(10, 41, 13, 47) | c.line(35, 41, 33, 47), '2')                    # where the arms meet the gown
PORTRAIT = {'id': 'silver.gala', 'name': 'Debutante', 'kind': 'member', 'sphere': 'silver',
            'people': [{'skin': 'warmtan', 'hair': 'darkbrown'}], 'accent': 'navy', 'px': c.rows()}
