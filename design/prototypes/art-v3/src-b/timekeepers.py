import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Timekeepers (purple, one person): the keeper of the town's time, an old man with white hair round a bald crown, white
# moustache and spectacles, a purple robe with a gold chain of office, holding a big hourglass. Serene. 3/4 to our
# left. Template: 1 person.
c = new()
b = body(c, [(3, 48), (4, 40), (9, 35.5), (17, 33.5), (30, 33.5), (38, 35.5), (43, 40), (44, 48)], 20, 38, 19, 11)
c.fill(c.line(12, 37, 18, 47), '2')
neck(c, 20, 28, 28, 34)
c.put(15, 34, ['c..............c', '.c............c.', '..cc........cc..', '....bccccccb....'])   # chain of office
c.put(21, 37, ['.cc.', 'cddc', 'bccb', '.bb.'])
face(c, 'q34L', 15, 19, eyes='closed', brows='level', mouth='smile', glow=True)
dome = c.ellipse(24, 14, 9, 6.5) & c.rect(0, 0, 47, 13)
c.fill(dome, 'C'); c.outside(dome, 'B', 22.5, 12.5, 8.5, 6); c.fill(dome & c.ellipse(20, 10.5, 2.6, 1.4), 'D')
fr = c.poly([(30.5, 9.5), (33.5, 11.5), (35, 16), (34.6, 21), (33, 24), (31.4, 23), (32, 16), (31, 12)]); c.fill(fr, 'G'); c.outside(fr, 'F', 32, 13, 2.6, 6)
fl = c.poly([(17.5, 9.5), (15, 12), (14, 16), (14.6, 21), (16, 22), (16.4, 15), (18, 12)]); c.fill(fl, 'G'); c.outside(fl, 'F', 16, 13, 2.4, 6)   # white fringe round the crown
c.put(15, 22, ['.FFE..EFF', 'FE......EF'][:1]); c.put(15, 23, ['E']); c.put(23, 23, ['E'])     # moustache: two dark wedges
c.put(16, 17, ['.ee....eeee.', 'e..eeee....e', 'e..e..e....e', '.ee....eeee.'])          # two framed lenses and a bridge
# the hourglass, held at our right
c.fill(c.rect(34, 30, 44, 31), 'r'); c.fill(c.rect(34, 46, 44, 47), 'q'); c.fill(c.rect(34, 30, 44, 30), 's')
c.fill(c.rect(35, 32, 35, 45), 'r'); c.fill(c.rect(43, 32, 43, 45), 'q')
gl = c.poly([(36, 32), (42, 32), (42, 34), (39.5, 39), (42, 44), (42, 46), (36, 46), (36, 44), (38.5, 39), (36, 34)])
c.fill(gl, 'k'); c.fill(gl & c.rect(36, 42, 42, 46), 'c'); c.fill(gl & c.rect(37, 34, 41, 35), 'c'); c.put(39, 39, ['c', 'c', 'c'])
c.fill(gl & c.rect(41, 32, 42, 46), 'j')
c.put(30, 40, ['.CCC', 'CCCC', 'BCCB', '.BB.'])
PORTRAIT = portrait('purple.timekeepers', 'Timekeepers', 'purple', [{'skin': 'brown', 'hair': 'grey'}], c)
