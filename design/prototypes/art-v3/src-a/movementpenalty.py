import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Movement Penalty (red): a referee calling it. Red shirt with a black collar, whistle on a cord, close-cropped hair and
# a neat moustache, stern and level, holding a penalty card up by his head. 3/4 to our left. Template: 1 person.
c = Canvas()
body(c, [(1, 48), (2, 40), (7, 35.5), (16, 33.5), (31, 33.5), (40, 35.5), (45, 40), (46, 48)])
for x in (8, 14, 33, 39): c.fill(c.rect(x, 37, x + 1, 48) & c.mask_of('12345'), '1')   # referee's stripes, in the shadow red
col = c.poly([(16, 33.5), (20, 33), (24, 37.5), (28, 33), (32, 33.5), (31, 36), (24, 40), (17, 36)])
c.fill(col, 'n'); c.rim(col, 'o', 0, -1, 1); c.fill(c.poly([(20, 33), (28, 33), (24, 37.5)]), 'B')
neck(c, 0, 20, 27, 28, 33)
c.fill(c.line(19, 35, 23, 41) | c.line(29, 35, 25, 41), 'n')           # the whistle's cord
c.put(23, 41, ['cdd', 'bcc', '.b.'])                                 # whistle
face(c, 0, 15, 19, 18, 6, 9, view='l', eyes='stern', mouth=None, jaw='square', ears=True)
c.put(17, 23, ['.EFFFFE.', 'E......E'])                              # moustache
c.put(19, 25, ['AAAA'])                                              # a level mouth
hr = c.poly([(14.5, 19), (14.4, 13), (16.5, 9.5), (22, 8), (28, 8.4), (32, 10.5), (33.5, 14), (33.4, 19), (32, 19),
             (31.5, 14.4), (27, 13.4), (21, 13.6), (17, 14.6), (16, 19)])
hair(c, hr, 0, 22, 10.5, 10, 4.5)
c.fill(c.rect(14, 14, 33, 14) & hr, 'E')
# the card held up by his head, the arm raised
arm = c.poly([(39, 48), (37.5, 38), (37, 28), (40, 22), (43.5, 23), (42.5, 30), (43.5, 40), (45, 48)])
c.fill(arm, '3'); c.rim(arm, '4', -1, 0, 1, only='3'); c.outside(arm, '2', 39, 30, 4, 18); c.edge(arm, '1')
c.fill(c.rect(37, 34, 45, 35) & arm, '1')                            # the rolled-up sleeve's shadow
c.put(38, 18, ['.BCCB', 'BCCDB', 'BCCCB', '.BBA.'])                  # hand
card = c.rect(37, 7, 44, 17)
c.fill(card, 'c'); c.fill(c.rect(37, 7, 44, 7), 'd'); c.fill(c.rect(37, 7, 37, 17), 'd'); c.fill(c.rect(44, 8, 44, 17), 'b')
c.edge(card, 'b')
PORTRAIT = portrait(c, 'red.movementpenalty', 'Movement Penalty', 'red', [{'skin': 'golden', 'hair': 'darkbrown'}])
