import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Go-Getter (purple): already moving on to the next thing, a purple track jacket zipped to the chin, a sweatband, a high
# ponytail, one fist pumped. Determined brows, a closed smile. 3/4 to our right. Template: 1 person.
c = new()
b = body(c, [(3, 48), (4, 40), (9, 35.5), (17, 33.5), (30, 33.5), (38, 35.5), (43, 40), (44, 48)], 20, 38, 19, 11)
c.fill(c.poly([(18, 32), (29, 32), (29, 36), (18, 36)]), '3'); c.fill(c.rect(18, 32, 29, 32), '4'); c.fill(c.rect(26, 33, 29, 36), '2')
c.fill(c.line(24, 33, 24, 47), 'f'); c.put(23, 33, ['ff'])
for x in (6, 41): c.fill(c.line(x, 38, x + (1 if x < 20 else -1), 47), 'k')        # white stripes down the sleeves
neck(c, 19, 27, 28, 32)
face(c, 'q34', 15, 19, eyes='right', brows='stern', mouth='smile')
ear(c, 30, 18)
hair(c, [(14.5, 18), (14, 12), (16.5, 8), (21, 6.4), (27, 6.6), (31, 8.5), (32.6, 12), (32.5, 17), (31.2, 14), (16, 14.6), (15.4, 18)],
     0, 22, 9, 9.5, 4)
c.fill(c.poly([(13.5, 11.5), (33, 11.5), (33, 13.6), (13.5, 13.6)]), 'w'); c.fill(c.rect(28, 12, 33, 13), 'v'); c.fill(c.rect(14, 11, 26, 11), 'x')
pt = c.poly([(27, 7), (30, 1.5), (35, 1), (38, 4), (37, 9), (34.5, 6), (31, 7.5), (29.5, 9)])
c.fill(pt, 'F'); c.fill(pt & c.ellipse(32, 2.5, 3, 1.5), 'G'); c.put(27, 6, ['vv', 'vv'])
# the fist, pumped beside her head (our right)
fist = c.poly([(36, 30), (36, 23), (38, 21.5), (44, 21.5), (45.5, 23.5), (45.5, 30)])
c.fill(fist, 'C'); c.fill(fist & c.rect(43, 21, 47, 30), 'B'); c.fill(fist & c.rect(36, 22, 39, 24), 'D')
c.put(37, 21, ['.D.D.C.C.'][:1])                                                # knuckle row
for x in (39, 41, 43): c.fill(c.rect(x, 22, x, 25), 'B')                        # between the fingers
c.put(36, 26, ['DDDDDC', 'BBBBBB'])                                             # the thumb across the front
arm = c.poly([(35, 30), (46, 30), (44, 39), (38, 39)]); c.fill(arm, '3'); c.fill(arm & c.rect(42, 30, 47, 40), '2')
c.fill(c.rect(35, 30, 46, 31), 'k')
c.edge(fist | arm, 'A')
PORTRAIT = portrait('purple.secondwind', 'Go-Getter', 'purple', [{'skin': 'tan', 'hair': 'darkbrown'}], c, accent='teal')
