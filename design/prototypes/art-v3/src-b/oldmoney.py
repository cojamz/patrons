import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Old Money (white): an old aristocrat in a white dinner jacket and black bow tie, silver hair combed back, a white
# handlebar moustache, a gold-rimmed monocle in his near eye. Proud, chin up, unhurried. 3/4 to our right.
# Template: 1 person.
c = new()
b = body(c, [(3, 48), (4, 40), (9, 35.5), (17, 33.5), (30, 33.5), (38, 35.5), (43, 40), (44, 48)], 20, 38, 19, 11)
sh = c.poly([(19, 33.5), (28, 33.5), (24, 44)]); c.fill(sh, 'k'); c.fill(sh & c.rect(24, 33, 30, 45), 'j')
lapL = c.poly([(14.5, 34), (19.5, 33.5), (23.4, 45), (20.6, 45), (16, 38.5), (12.5, 36)])
lapR = c.poly([(28.5, 33.5), (33.5, 34), (35.5, 36), (32, 38.5), (27.4, 45), (24.6, 45)])
c.fill(lapL, '3'); c.edge(lapL, '1'); c.fill(lapR, '2'); c.edge(lapR, '1')
c.put(21, 34, ['nn.nn', 'nonnn', 'nn.nn'])                                       # bow tie
c.put(9, 39, ['.uu', 'uvvu', 'uvu', '.u.'])                                       # a red carnation
neck(c, 19, 27, 28, 33)
face(c, 'q34', 15, 19, eyes='open', brows='level', mouth='flat')
ear(c, 30, 18)
c.put(16, 23, ['.GGGGGG.GGG', 'GFFFFFFFFFFG', 'F..........F'][:3])                 # handlebar moustache
c.put(15, 25, ['F'])
c.put(28, 25, ['F'])
hair(c, [(14.5, 18), (14.5, 11), (17, 7.5), (23, 6), (29, 6.6), (32.5, 9.5), (33, 14), (32.6, 19), (31.2, 19), (31, 13), (23, 12),
         (17, 12.6), (15.4, 18)], 0, 21, 9, 10, 4)
c.fill(c.line(18, 9, 30, 8), 'F'); c.fill(c.line(17, 11, 29, 10), 'F')
c.put(17, 16, ['.cc.', 'c..c', 'c..c', '.cc.']); c.fill(c.line(17, 20, 15, 31), 'b')  # monocle and its cord
PORTRAIT = portrait('trading.oldmoney', 'Old Money', 'white', [{'skin': 'fair', 'hair': 'grey'}], c)
