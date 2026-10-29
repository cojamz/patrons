import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Upstart (silver, id silver.spoon): new money, eyeing whoever has most. A young man with slicked-back hair and a
# scheming side-glance (brows down, a small closed smile), loud silver suit, a big silver spoon held at his chest like a prize.
# 3/4 to our right. Template: 1 person.
c = Canvas()
body = cloth(c, [(1, 48), (1, 40), (3, 36.5), (8, 34.5), (17, 33.5), (30, 33.5), (39, 34.5), (44, 36.5), (46, 40), (46, 48)])
shirt = c.poly([(19.5, 33), (28.5, 33), (24, 44.5)]); c.fill(shirt, 'v'); c.fill(shirt & c.rect(25, 33, 30, 45), 'u')
lapL = c.poly([(14.5, 33.5), (19.5, 33), (23.4, 44.6), (20.6, 44.6), (16, 38.5), (12.5, 35.8)])
lapR = c.poly([(28.5, 33), (33.5, 33.5), (35.5, 35.8), (32, 38.5), (27.4, 44.6), (24.6, 44.6)])
c.fill(lapL, '4'); c.edge(lapL, '1'); c.fill(lapR, '2'); c.rim(lapR, '3', -1, 0, 1); c.edge(lapR, '1')
neck(c, 20, 27, 28, 32)
f = face(c, (15, 10, 32, 28), 19, view='r', jaw='narrow', eyes='round', look=1, mouth='smile', brows='stern')
h = c.poly([(13.5, 21), (13.5, 13), (16, 8.5), (22, 6.4), (30, 6.8), (34, 9.5), (35.5, 13), (34, 15), (31, 13), (24, 12.5), (18, 13.6),
            (15.6, 21)])
c.fill(h, 'F'); c.outside(h, 'E', 22, 9, 12, 4.8); c.rim(h, 'G', -1, -1, 1, only='F')
for y in (9, 11): c.fill(c.line(18, y, 31, y - 1), 'G')                           # combed-back lines
# the silver spoon held at his chest like a prize: his hand round the handle, the bowl up beside his shoulder
bowl = c.ellipse(38, 30, 3.4, 4.4)
c.fill(bowl, 'g'); c.outside(bowl, 'f', 37, 29, 2.6, 3.4); c.fill(bowl & c.ellipse(36.8, 28.4, 1.2, 1.6), 'h'); c.edge(bowl, 'e')
for i in range(6): c.put(36 - i // 2, 34 + i, ['fe'])
c.put(30, 38, ['..DC..', '.CDCDC', 'CCCCCB', 'BCCCBB', '.BBBB.', '.2222.'])          # his hand: thumb, knuckles, cuff
PORTRAIT = {'id': 'silver.spoon', 'name': 'Upstart', 'kind': 'member', 'sphere': 'silver',
            'people': [{'skin': 'golden', 'hair': 'black'}], 'accent': 'violet', 'px': c.rows()}
