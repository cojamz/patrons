import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Grifter (magenta): a con man who never stops smiling. Straw boater with a magenta band, a pencil moustache, eyes
# slid to our left, a smooth closed smile, fanning three playing cards (pick one). 3/4 to our left. Template: 1 person.
c = Canvas()
body(c, [(1, 48), (2, 40), (7, 35.5), (16, 33.5), (31, 33.5), (40, 35.5), (45, 40), (46, 48)])
c.fill(c.poly([(19.5, 33), (28.5, 33), (24, 42)]), 'k')
c.put(21, 33, ['nnn.nnn', '.nnznn.', '..n.n..'])                                  # bow tie
lapL = c.poly([(15, 34), (19.5, 33), (24, 43), (21.5, 43.5), (17, 38.5), (13.5, 36)])
lapR = c.poly([(28.5, 33), (33, 34), (34.5, 36), (31, 38.5), (26.5, 43.5), (24, 43)])
c.fill(lapL, '4'); c.edge(lapL, '1'); c.fill(lapR, '2'); c.edge(lapR, '1')
neck(c, 0, 20, 27, 29, 32)
face(c, 0, 15, 19, 18, 6, 9, view='l', eyes='sideL', mouth='smile', jaw='square', look='iris')
c.put(18, 23, ['E......E'][0:0]); c.put(18, 23, ['EFFE.EFFE'][0:0]); c.put(19, 23, ['EFFFFFE'])      # pencil moustache
hr = c.poly([(14, 21), (14, 15), (34, 15), (34, 21), (32.6, 20), (32.4, 17), (16, 17), (15.6, 21)])
hair(c, hr, 0, 22, 15, 9, 3, lit=False)
crown = c.rect(17, 7, 31, 13)
c.fill(crown, 'c'); c.fill(c.rect(17, 7, 31, 7), 'd'); c.fill(c.rect(28, 8, 31, 13), 'b')
c.fill(c.rect(17, 11, 31, 12), '3'); c.fill(c.rect(28, 11, 31, 12), '2')
for x in range(18, 28, 3): c.set(x, 9, 'b')                                       # the straw weave, a few stitches
brim = c.poly([(9, 14.6), (12, 13), (36, 13), (39, 14.6), (37, 16), (11, 16)])
c.fill(brim, 'c'); c.fill(brim & c.rect(0, 13, 47, 13), 'd'); c.fill(brim & c.rect(0, 15, 47, 16), 'b')
c.edge(crown, 'b')
# three cards fanned in his hand
for (pts, fill) in (([(32, 33), (37, 30), (41, 38), (36, 41)], 'k'), ([(35, 30), (41, 29), (42, 38), (37, 39)], 'k'),
                    ([(38, 30.6), (44, 31.6), (42.6, 40.4), (37.6, 39)], 'y')):
    m = c.poly(pts); c.fill(m, fill); c.edge(m, 'i')
c.put(39, 32, ['x.x', 'xxx', '.x.']); c.put(36, 33, ['x']); c.put(38, 31, ['u'][0:0])
hand(c, 33, 38, 0, 'grip')
PORTRAIT = portrait(c, 'thieves.grifter', 'Grifter', 'magenta', [{'skin': 'tan', 'hair': 'darkbrown'}])
