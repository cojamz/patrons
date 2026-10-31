import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Bouncer (purple): a big, calm doorman of a club, shaved head, short boxed beard, earpiece, purple bomber over a black
# tee. One open palm up: "not tonight" (turns get skipped). Stern, level eyes. Square face. Template: 1 person.
c = new()
b = body(c, [(0, 48), (0, 39), (5, 34.5), (15, 32.5), (32, 32.5), (42, 34.5), (47, 39), (47, 48)], 20, 38, 20, 11)
c.fill(c.line(7, 38, 9, 47), '2')
tee = c.poly([(18, 32.5), (29, 32.5), (27, 37), (20, 37)])
c.fill(tee, 'n'); c.fill(tee & c.rect(25, 32, 30, 37), 'm')
nl = c.ellipse(23.5, 32, 4, 2.6) & c.rect(0, 32, 47, 47)
c.put(15, 32, ['44...', '.444.', '..44.', '...4.']); c.put(28, 32, ['..222', '.222.', '.22..', '.2...'])  # bomber collar
c.fill(c.line(24, 38, 24, 47), '1'); c.put(23, 38, ['e', 'f']); c.fill(c.rect(23, 40, 23, 47), 'e')  # zip
neck(c, 18, 29, 27, 33)
c.fill(nl, 'A'); c.fill((c.ellipse(23.5, 32, 5, 3.6) - c.ellipse(23.5, 32, 4, 2.6)) & tee & c.rect(0, 32, 47, 47), 'o')   # tee crew neckline
# shaved head: the dome above the face
dome = c.ellipse(24, 15, 9.6, 7.5) & c.rect(0, 0, 47, 15)
c.fill(dome, 'C'); c.outside(dome, 'B', 22.5, 13.5, 9, 7); c.fill(dome & c.ellipse(19.5, 10.5, 3, 1.6), 'D')
face(c, 'square', 15, 19, eyes='open', brows='thick', mouth='flat')
ear(c, 32, 17); ear(c, 13, 17, 'L')
# beard: short and boxed, along the jaw, a moustache
beard = c.poly([(14.5, 22), (16, 22), (17, 27), (21, 28.5), (27, 28.5), (31, 26.5), (31.5, 22), (33.5, 22), (33, 27), (30, 30),
                (26, 31.5), (21, 31.5), (17, 30), (15, 27)])
c.fill(beard, 'F'); c.outside(beard, 'E', 22, 26, 9, 5)
c.put(19, 24, ['FFFFFFFFE']); c.put(21, 26, ['AAAA'])
c.put(34, 17, ['ff', 'f.', 'f.', 'f.', 'f.'])                                 # earpiece coil
# the open palm, held up beside his shoulder
palm = c.poly([(34, 46), (34, 34), (35, 31), (43, 31), (44, 34), (44, 46)])
c.fill(palm, 'C'); c.fill(palm & c.rect(41, 30, 47, 47), 'B')
fing = c.rect(34, 26, 35, 31) | c.rect(37, 24, 38, 31) | c.rect(40, 25, 41, 31) | c.rect(43, 27, 44, 31)   # fingers, gaps between
c.fill(fing, 'C'); c.fill(c.rect(34, 26, 34, 30), 'D'); c.fill(c.rect(38, 25, 38, 31) | c.rect(41, 26, 41, 31) | c.rect(44, 28, 44, 31), 'B')
c.fill(c.rect(34, 30, 44, 30) & c.mask_of('C'), 'C')
c.put(32, 33, ['.CC', 'CCC', 'CCB', '.CB'])                                    # thumb
c.fill(c.rect(34, 44, 44, 47), '3'); c.fill(c.rect(34, 44, 44, 44), '4')       # cuff
c.edge(palm | fing, 'A')
PORTRAIT = portrait('purple.bouncer', 'Bouncer', 'purple', [{'skin': 'golden', 'hair': 'darkbrown'}], c, accent='red')
