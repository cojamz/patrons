import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Raiders (white, one person): a corporate raider in a sharp white suit, red hair slicked into a hard bob, dark
# glasses, a briefcase held up: she is here to take your followers and pay for them. A one-sided smile, eyes hidden.
# 3/4 to our right. Template: 1 person.
c = new()
b = body(c, [(3, 48), (4, 40), (9, 35.5), (17, 33.5), (30, 33.5), (38, 35.5), (43, 40), (44, 48)], 20, 38, 19, 11)
sh = c.poly([(19, 33.5), (28, 33.5), (24, 42)]); c.fill(sh, 'n'); c.fill(sh & c.rect(24, 33, 30, 42), 'm')
lapL = c.poly([(14.5, 34), (19.5, 33.5), (23.4, 44), (20.6, 44), (16, 38.5), (12.5, 36)])
lapR = c.poly([(28.5, 33.5), (33.5, 34), (35.5, 36), (32, 38.5), (27.4, 44), (24.6, 44)])
c.fill(lapL, '3'); c.edge(lapL, '1'); c.fill(lapR, '2'); c.edge(lapR, '1')
neck(c, 19, 27, 28, 33)
face(c, 'q34', 15, 19, eyes='open', brows='level', mouth='smirk')
ear(c, 30, 18)
hair(c, [(14, 27), (13.6, 13), (16, 8.5), (21, 6.4), (28, 6.6), (32, 9), (33.4, 14), (33.4, 27), (31.6, 27), (31.4, 15), (27, 12),
         (18, 14), (16, 17), (15.8, 27)], 0, 22, 10, 12, 6)
c.put(16, 17, ['nnnnnnnnnnnnn', 'nmmmnoonmmmn.', '.nnn....nnn..'])                 # dark glasses
c.put(17, 18, ['o'])
# the briefcase, lower right
bc = c.rect(31, 38, 45, 47)
c.fill(bc, 'r'); c.fill(c.rect(31, 38, 45, 38), 's'); c.fill(c.rect(43, 39, 45, 47), 'q'); c.edge(bc, 'q')
c.put(35, 35, ['qqqqqq', 'q....q', 'q....q']); c.put(37, 40, ['bcb'])
c.put(28, 41, ['.CCC', 'CCCC', 'BCCB', '.BB.'])
PORTRAIT = portrait('trading.raider', 'Raiders', 'white', [{'skin': 'freckled', 'hair': 'auburn'}], c)
