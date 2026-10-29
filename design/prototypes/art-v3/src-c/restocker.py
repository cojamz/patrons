import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Restocker (blue): a cheerful stock clerk, freckled and ginger, laughing with his eyes shut, a taped cardboard box
# up on his shoulder (our left), his hand steadying it, a blue shop apron over a white shirt. 3/4 to our left.
# Template: 1 person.
c = Canvas()
body = cloth(c, [(1, 48), (2, 41), (7, 36), (16, 33.5), (31, 33.5), (40, 36), (45, 41), (46, 48)])
apron = c.poly([(13, 48), (14, 38), (16, 37), (31, 37), (33, 38), (34, 48)])
c.fill(apron, '2'); c.outside(apron, '1', 20, 41, 11, 10); c.rim(apron, '3', 0, -1, 1, only='2'); c.edge(apron, '1')
c.fill(c.line(16, 37, 19, 33) | c.line(31, 37, 28, 33), '1')                   # the apron's neck straps
pocket = c.rect(19, 42, 28, 46); c.fill(pocket, '1'); c.fill(c.rect(19, 42, 28, 42), '3')
c.put(21, 33, ['y.....y', 'yy...yy'])                                           # white shirt collar
neck(c, 20, 27, 28, 33)
f = face(c, (15, 10, 32, 28), 19, view='l', jaw='round', eyes='laugh', mouth='grin', brows='raised')

# ginger hair, short and tufty
h = c.poly([(13.5, 19), (13, 13), (15, 9), (19, 6.5), (25, 6), (30, 7), (33.5, 10), (34.5, 15), (33.5, 19), (32, 14.5),
            (28, 12.6), (24, 13.4), (21, 12.4), (17, 14), (15.5, 19)])
c.fill(h, 'F'); c.outside(h, 'E', 21, 9, 11, 5.5); c.rim(h, 'G', -1, -1, 1, only='F')
c.put(17, 6, ['.F', 'FG']); c.put(25, 5, ['FF']); c.put(30, 6, ['F'])
# the box on his shoulder: lit top, front face, shadow side, brown tape
box = c.poly([(1, 33), (2, 17), (13, 16), (15, 33)])
c.fill(box, 's'); c.fill(c.poly([(2, 17), (5, 13), (16, 12.5), (13, 16)]), 't')
c.fill(c.poly([(13, 16), (16, 12.5), (17, 29), (15, 33)]), 'r')
c.fill(c.rect(7, 17, 8, 32) & box, 'r'); c.fill(c.line(8, 13, 10, 15) | c.line(9, 13, 11, 15), 'r')
c.edge(box, 'q')
c.put(11, 30, ['.CCD', 'CCCC', 'BCCB', '.BB.'])                                 # his hand under the box's corner
c.fill(c.line(14, 33, 16, 40) | c.line(13, 34, 15, 41), '4')                    # the raised sleeve
PORTRAIT = {'id': 'market.restocker', 'name': 'Restocker', 'kind': 'member', 'sphere': 'blue',
            'people': [{'skin': 'palepink', 'hair': 'ginger'}], 'accent': 'red', 'px': c.rows()}
