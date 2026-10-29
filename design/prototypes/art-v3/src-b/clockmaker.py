import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Clockmaker (purple): an old watchmaker, white hair in a bun, round wire spectacles, a purple work smock with a linen
# collar, holding up an open gold pocket watch she has just set. Pleased, small smile. True 3/4 to our right.
# Template: 1 person.
c = new()
b = body(c, [(3, 48), (4, 40), (9, 35.5), (17, 33.5), (30, 33.5), (38, 35.5), (43, 40), (44, 48)], 20, 38, 19, 11)
c.fill(c.line(10, 39, 12, 47), '2')
neck(c, 19, 27, 28, 34)
col = c.poly([(15, 33), (20, 32), (24, 35), (28, 32), (32, 33), (30, 36.5), (24, 37.5), (18, 36.5)])
c.fill(col, 'k'); c.fill(col & c.rect(25, 32, 33, 38), 'j'); c.edge(col, 'i')
face(c, 'q34', 15, 19, eyes='down', brows='raised', mouth='smile')
ear(c, 30, 18)
hair(c, [(14.5, 21), (14, 13), (16.5, 9), (21, 7), (27, 7), (31, 8.5), (32.6, 12), (32.5, 16), (31, 13.5), (26, 12.4),
         (20, 13), (16.5, 15), (15.5, 21)], 0, 22, 10, 10, 4.5)
bun = c.ellipse(30.5, 6.2, 3.6, 3.2)
c.fill(bun, 'G'); c.outside(bun, 'F', 29.5, 5.5, 3.2, 2.6); c.fill(bun & c.ellipse(29.5, 4.8, 1.4, 1), 'H'); c.edge(bun, 'E')
c.fill(c.line(20, 8, 24, 12), 'F'); c.fill(c.line(26, 8, 29, 11), 'F')         # combed strands

c.put(18, 19, ['CzzC']); c.put(25, 19, ['Czz'])                                 # 2px pupils, looking down
c.put(17, 19, ['b....b.bb...b', '.bbbb....bbb'])                                    # gold half-moon reading glasses
# the open pocket watch in her hand, lower right
w = c.ellipse(36.5, 39.5, 5.2, 5.2)
c.fill(w, 'c'); c.outside(w, 'b', 35.5, 38.5, 4.6, 4.6); c.fill(w & c.ellipse(35, 37, 2, 1.3), 'd')
dial = c.ellipse(36.5, 39.5, 3.6, 3.6)
c.fill(dial, 'k'); c.fill(dial & c.rect(36, 36, 40, 43), 'j') ; c.fill(dial & c.ellipse(35.5, 38.5, 2.6, 2.6), 'k')
c.put(36, 37, ['z', 'z', 'zzz'])                                                # the hands at three
c.put(35, 33, ['.bb.', 'b..b', '.cc.'])                                         # the bow
c.edge(w, 'a')
c.put(31, 42, ['.CCC', 'CCCB', 'BCCB', '.BB.'])                                 # fingers under it
c.fill(c.line(35, 45, 33, 47), 'b'); c.fill(c.line(36, 46, 35, 47), 'b')           # the chain
PORTRAIT = portrait('purple.clockmaker', 'Clockmaker', 'purple', [{'skin': 'porcelain', 'hair': 'white'}], c)
