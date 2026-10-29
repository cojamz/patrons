import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Early Bird (purple): up before everyone and delighted about it, a middle-aged man in a purple dressing gown with a
# linen collar, short dark hair, clean-shaven, a closed smile, holding up the alarm clock that just went off.
# Forehead, cheekbone and nose lit; warm brown irises. (Final review: no moustache, not another grey elder.)
# Front, round face. Template: 1 person.
c = new()
b = body(c, [(3, 48), (4, 40), (9, 35.5), (17, 33.5), (30, 33.5), (38, 35.5), (43, 40), (44, 48)], 20, 38, 19, 11)
lap = c.poly([(17, 33.5), (22, 33.5), (27, 47.5), (23, 48)]); c.fill(lap, '4'); c.edge(lap, '1')
lap2 = c.poly([(26, 33.5), (31, 33.5), (28, 48), (24.5, 48), (27, 40)]); c.fill(lap2, '2'); c.edge(lap2, '1')
neck(c, 19, 28, 28, 34)
c.fill(c.poly([(21, 33), (27, 33), (24.5, 39)]), 'k')
face(c, 'round', 15, 19, eyes='dark', brows='raised', mouth=None, glow=True, iris='r')
ear(c, 33, 18); ear(c, 13, 18, 'L')
c.put(21, 24, ['B....B', '.rrrr.'])                                               # closed smile, a warm brown line
c.put(17, 13, ['.DDD', 'DDD.', 'D...'])                                            # forehead plane, stepped
c.put(16, 20, ['DDDD', 'DDD.', 'DD..'])                                            # cheekbone, stepped
hair(c, [(14, 18), (14, 12), (16, 8.5), (21, 6.5), (27, 6.5), (31.5, 8.5), (34, 12), (34, 18), (32.8, 18), (32, 13.5), (26, 12),
         (21, 12.5), (16, 13.6), (15.2, 18)], 0, 23, 9.5, 9, 4)
# the alarm clock, ringing: twin bells, a round face, little feet
bod = c.ellipse(38.5, 39.5, 5.4, 5.4)
c.fill(bod, 'c'); c.outside(bod, 'b', 37.5, 38.5, 4.8, 4.8); c.fill(bod & c.ellipse(36, 36.5, 2, 1.2), 'd')
dial = c.ellipse(38.5, 39.5, 3.6, 3.6); c.fill(dial, 'k'); c.fill(dial & c.rect(39, 37, 42, 43), 'j')
c.put(38, 37, ['z', 'zzz'])
c.put(33, 32, ['.cc', 'cdcb', 'cbb.']); c.put(41, 32, ['.cc', 'cdcb', '.bbb'][::1])
c.put(35, 45, ['b......b'][:1]); c.edge(bod, 'a')
c.put(31, 30, ['f..', '.f.']); c.put(45, 29, ['..f', '.f.']); c.put(46, 34, ['f', 'f'])  # ringing
c.put(31, 41, ['.CCC', 'CCCB', 'BCCB', '.BB.'])
PORTRAIT = portrait('purple.earlybird', 'Early Bird', 'purple', [{'skin': 'verydeep', 'hair': 'black'}], c, accent='orange', merge={'f': 'j'})
