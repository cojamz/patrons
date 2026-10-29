import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Window Dresser (blue, counts as 3): the team that redoes the shop window. In front: the head dresser, a man with a
# neat high-top fade and a yellow tape measure round his neck, pleased with the new display (a closed smile). Behind
# left and right, lower and darker: two assistants, one in a ponytail, one with short hair, both looking at the window
# (us) and judging it. Template: 3 people.
c = Canvas()
behind3(c, 1, 'L', look=1, hair_pts=[(3, 21), (3, 14), (5, 10.6), (10, 9.6), (15, 11), (16.5, 15), (16, 18), (14.5, 14.6), (6, 14.6), (4.6, 21)])
c.put(1, 13, ['.N', 'NN', 'NM', 'M.'])                                               # ponytail
behind3(c, 2, 'R', look=-1, hair_pts=[(31, 18), (31.5, 13), (34, 10.4), (40, 10), (43.5, 12), (44.5, 18), (43, 14.6), (33, 14.6), (32.5, 18)],
        hair_lo='U', hair_hi='V')
# ---- in front (person 0)
body = c.poly([(9, 48), (10, 40), (14, 37), (20, 35.5), (28, 35.5), (34, 37), (38, 40), (39, 48)])
c.fill(body, '3'); c.outside(body, '2', 22, 41, 14, 9); c.rim(body, '4', 0, -1, 1, only='3')
c.fill(c.poly([(20, 35.5), (28, 35.5), (24, 40)]), 'y'); c.fill(c.poly([(24, 35.5), (28, 35.5), (24, 40)]), 'k')   # shirt
neck(c, 21, 27, 29, 35)
f = face(c, (17, 13, 31, 29), 21, view='r', jaw='square', eyes='round', look=0, mouth='smile', brows='level', ear=True)
lift(c, f['m'] - c.mask_of('zy!') - c.rect(0, 28, 47, 29))
fade = c.poly([(16.5, 20), (16.5, 13), (18, 8.5), (30, 8.5), (31.5, 13), (31.5, 18), (30.4, 16), (18, 16), (17.6, 20)])
c.fill(fade, 'F'); c.outside(fade, 'E', 23, 11, 8, 4); c.rim(fade, 'G', -1, -1, 1, only='F')
c.fill(c.rect(17, 15, 17, 19) | c.rect(31, 15, 31, 17), 'E')
# the tape measure draped round his neck, both ends hanging down his chest, black tick marks
for x0, x1 in ((18, 16), (29, 31)):
    tape = c.line(x0, 33, x1, 47) | c.line(x0 + 1, 33, x1 + 1, 47)
    c.fill(tape, 'c'); c.fill(c.line(x0 + 1, 33, x1 + 1, 47), 'b')
    for y in range(35, 47, 3): c.set(round(x0 + (x1 - x0) * (y - 33) / 14), y, 'z')
c.fill(c.line(19, 32, 29, 32) | c.line(19, 33, 29, 33), 'c'); c.fill(c.rect(20, 33, 28, 33), 'b')
merge(c, {'M': 'N', 'U': 'V', 'G': 'F', '4': '3', '!': 'y', 'k': 'y', 'b': 'c', 'w': 'v'})
PORTRAIT = {'id': 'market.windowdresser', 'name': 'Window Dresser', 'kind': 'member', 'sphere': 'blue',
            'people': [{'skin': 'coolbrown', 'hair': 'black'}, {'skin': 'golden', 'hair': 'brown'}, {'skin': 'palepink', 'hair': 'auburn'}],
            'accent': 'red', 'px': c.rows()}
