import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Late Riser (purple): just up and not happy about it, purple striped pyjamas, ginger bedhead sticking up, a sleep mask
# pushed up on the forehead, mid-yawn with the eyes shut. Front, oval face, freckles. Template: 1 person.
c = new()
b = body(c, [(3, 48), (4, 40), (9, 35.5), (17, 33.5), (30, 33.5), (38, 35.5), (43, 40), (44, 48)], 20, 38, 19, 11)
for x in range(6, 44, 5): c.fill(c.line(x, 36, x + 1, 47) & b, '2')
c.fill(c.poly([(20, 33), (28, 33), (24, 39)]), 'B')
cl = c.poly([(14, 33.5), (20, 33), (24, 39.5), (19, 39), (15, 36.5)]); cr = c.poly([(28, 33), (34, 33.5), (33, 36.5), (29, 39), (24, 39.5)])
c.fill(cl, '5'); c.fill(cr, '4'); c.edge(cl | cr, '1')                                  # pyjama collar points
neck(c, 19, 28, 28, 34)
face(c, 'oval', 15, 19, eyes='closed', brows='worried', mouth='yawn')
ear(c, 32, 18); ear(c, 13, 18, 'L')
hair(c, [(14, 18), (13.5, 11), (15, 7.5), (12, 4), (17.5, 5.6), (21, 4.4), (25, 6), (27, 1.6), (29.5, 6.4), (33, 7.4), (36.5, 10.5), (33.6, 12),
         (34, 18), (32.8, 18), (32, 15), (16, 15), (15.2, 18)], 0, 23, 10, 8, 5)                # one cowlick, flattened on the pillow side
# sleep mask pushed up: two padded eye cups joined at the bridge, a thin strap round the head
c.fill(c.line(13, 13, 34, 13), 'u')
mask = c.ellipse(19.5, 12.5, 3.8, 2.3) | c.ellipse(28, 12.5, 3.8, 2.3) | c.rect(22, 12, 25, 13)
c.fill(mask, 'w'); c.outside(mask, 'v', 22, 11.5, 9, 2); c.fill(c.ellipse(18.5, 11.6, 1.6, 0.8) | c.ellipse(27, 11.6, 1.6, 0.8), 'x')
c.edge(mask, 'u')
PORTRAIT = portrait('purple.lateriser', 'Late Riser', 'purple', [{'skin': 'freckled', 'hair': 'ginger'}], c, accent='rose')
