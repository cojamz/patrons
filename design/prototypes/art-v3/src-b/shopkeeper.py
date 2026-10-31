import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Shopkeeper (white): a corner-shop owner in a white shirt and long white apron, a bushy moustache and a pencil behind
# his ear, holding out a paper bag of groceries with a loaf sticking out. Warm closed smile. Front, round face.
# Template: 1 person.
c = new()
b = body(c, [(3, 48), (4, 40), (9, 35.5), (17, 33.5), (30, 33.5), (38, 35.5), (43, 40), (44, 48)], 20, 38, 19, 11)
apron = c.poly([(14, 36), (34, 36), (35, 48), (13, 48)])
c.fill(apron, '3'); c.fill(apron & c.rect(30, 36, 35, 48), '2'); c.edge(apron, '1')
c.fill(c.line(14, 36, 19, 33), '1'); c.fill(c.line(34, 36, 29, 33), '1')       # apron straps
c.put(21, 33, ['uuuuuu', '.uvvu.']); c.put(23, 32, ['uu'])                        # red bow tie
neck(c, 19, 28, 28, 33)
face(c, 'round', 15, 19, eyes='happy', brows='level', mouth='smile')
ear(c, 33, 18); ear(c, 13, 18, 'L')
c.put(17, 23, ['.FFFF..FFFF.', 'FFEEEFFEEEFF', 'E..........E'])                    # moustache
hair(c, [(14, 18), (14, 12), (16, 8.5), (21, 6.5), (27, 6.5), (31.5, 8.5), (34, 12), (34, 18), (32.8, 18), (32, 13.6), (24, 12),
         (16, 13.6), (15.2, 18)], 0, 23, 9.5, 9, 4)
c.fill(c.line(33, 12, 37, 17), 'c'); c.put(37, 17, ['m'])                          # pencil behind the ear
# paper bag with a loaf, lower right
bag = c.poly([(31, 37), (43, 36.5), (44, 48), (31, 48)])
c.fill(bag, 's'); c.fill(bag & c.rect(40, 36, 47, 48), 'r'); c.fill(bag & c.rect(31, 37, 44, 37), 't')
c.put(33, 38, ['qqqqqqqq'][:1]); c.edge(bag, 'q')
loaf = c.poly([(34, 37), (37, 29), (40, 28.5), (40.5, 31), (38, 37.5)])
c.fill(loaf, 'c'); c.fill(loaf & c.rect(38, 28, 41, 38), 'b'); c.put(37, 31, ['d', '.', 'd']); c.edge(loaf, 'a')
c.put(28, 41, ['.CCC', 'CCCC', 'BCCB', '.BB.'])
PORTRAIT = portrait('trading.shopkeeper', 'Shopkeeper', 'white', [{'skin': 'fair', 'hair': 'brown'}], c)
