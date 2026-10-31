import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Gossip (purple): a neighbour with her hair still in rollers, a purple cardigan, one hand cupped beside her mouth to
# pass something on, eyes slid to the side to check who's listening. 3/4 to our left. Template: 1 person.
c = new()
b = body(c, [(3, 48), (4, 40), (9, 35.5), (17, 33.5), (30, 33.5), (38, 35.5), (43, 40), (44, 48)], 20, 38, 19, 11)
c.fill(c.line(24, 34, 24, 47), '1'); c.put(25, 37, ['k']); c.put(25, 41, ['k']); c.put(25, 45, ['k'])
c.fill(c.poly([(19, 33.5), (28, 33.5), (24, 37.5)]), 'B')
neck(c, 20, 28, 28, 34)
face(c, 'q34L', 15, 19, eyes='right', brows='arched', mouth='smirk')
ear(c, 31, 18)
hair(c, [(15, 21), (14.5, 13), (17, 9), (22, 7.5), (28, 7.6), (32.5, 10), (34, 14), (33.6, 21), (32.6, 21), (32, 15), (26, 12.6),
         (19, 13.4), (16.5, 15), (16, 21)], 0, 24, 10, 9.5, 5)
for x, y in ((16, 6), (21, 4), (26, 4), (31, 6)):                                     # rollers (rose)
    c.fill(c.rect(x, y, x + 3, y + 3), 'w'); c.fill(c.rect(x, y, x + 3, y), 'x'); c.fill(c.rect(x + 3, y + 1, x + 3, y + 3), 'v')
    c.edge(c.rect(x, y, x + 3, y + 3), 'u')
c.put(13, 12, ['ww', 'wv', 'vv'])
# her hand cupped beside her mouth, our left
hand = c.poly([(8, 31), (8, 24), (10, 22.5), (13, 22.5), (14.5, 25), (14.5, 31)])
c.fill(hand, 'C'); c.fill(hand & c.rect(13, 22, 15, 31), 'B'); c.fill(hand & c.rect(8, 23, 9, 26), 'D')
c.fill(c.line(10, 24, 10, 29), 'B'); c.fill(c.line(12, 24, 12, 29), 'B')
c.fill(c.poly([(8, 31), (14.5, 31), (15, 36), (8, 36)]), '3'); c.fill(c.rect(8, 31, 14, 31), '4')
c.edge(hand, 'A')
PORTRAIT = portrait('purple.gossip', 'Gossip', 'purple', [{'skin': 'olive', 'hair': 'auburn'}], c, accent='rose')
