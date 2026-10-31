import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Regular (blue): the shop's regular, here every morning. A round-faced man in a blue flat cap and cardigan, warm
# closed smile, 3/4 to our right, a paper bag with a baguette in the crook of his arm. Template: 1 person.
c = Canvas()
body = cloth(c, [(2, 48), (3, 40), (8, 35.5), (17, 33.5), (30, 33.5), (39, 35.5), (44, 40), (45, 48)])
c.fill(c.line(24, 35, 24, 47), '2'); c.put(25, 38, ['1']); c.put(25, 42, ['1']); c.put(25, 46, ['1'])  # placket, buttons
neck(c, 20, 27, 28, 32)
c.put(18, 32, ['yyy.....yyy', '.yyyy.yyyy.', '..yyy.yyy..'])                  # shirt collar points
c.put(24, 33, ['2'])
f = face(c, (15, 10, 32, 28), 19, view='r', jaw='round', eyes='round', mouth='grin', brows='level')
# short hair at the back, above the ear
hair(c, [(13.5, 19), (13.5, 14), (17, 13), (17, 16), (15.5, 18)], 14, 14, 2, 3, lit=False)
# flat cap: a flat crown pulled forward, a short stiff brim
cap = c.poly([(12.5, 14.5), (13, 11), (17, 8.4), (26, 7.6), (33, 8.8), (36, 11.5), (35, 13.5), (16, 14.5)])
c.fill(cap, '3'); c.outside(cap, '2', 21, 9.5, 14, 3.6); c.rim(cap, '4', -1, -1, 1, only='3')
c.fill(c.line(18, 9, 30, 9), '4')                                             # the crown's front seam catches light
brim = c.poly([(18, 13.4), (36, 12.6), (38.5, 14.2), (35, 15.6), (19, 15.6)])
c.fill(brim, '2'); c.fill(brim & c.rect(0, 15, 47, 15), '1')
c.fill(c.rect(16, 16, 31, 16) & f['m'], 'B')                                 # the brim's shadow on the brow
# the paper bag with a baguette, held against his side (our left)
bag = c.poly([(4, 48), (5, 38), (15, 37.5), (16, 48)])
c.fill(bag, 'r'); c.fill(bag & c.rect(4, 38, 7, 48), 's'); c.fill(bag & c.rect(14, 38, 16, 48), 'q')
c.put(5, 37, ['srsrsrsrsr'])                                                   # the folded, torn top
loaf = c.poly([(8, 37.5), (11, 27), (13.8, 27.6), (12.2, 38)])
c.fill(loaf, 'c'); c.rim(loaf, 'd', -1, 0, 1); c.fill(loaf & c.rect(12, 29, 14, 38), 'b')
c.put(10, 31, ['bb']); c.put(11, 34, ['bb']); c.edge(loaf, 'q')
c.put(13, 41, ['CCD', 'BCC', '.BB'])                                         # his hand round the bag
PORTRAIT = {'id': 'market.regular', 'name': 'Regular', 'kind': 'member', 'sphere': 'blue',
            'people': [{'skin': 'tan', 'hair': 'brown'}], 'accent': 'red', 'px': c.rows()}
