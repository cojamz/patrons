import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Cashier (white): a young teller in a green eyeshade and a crisp white shirt with sleeve garters, a tall stack of
# gold coins held up in one hand, a polite closed smile. Front view, oval face. Template: 1 person.
c = new()
# ---- shirt: white, sloped shoulders, an open collar
b = body(c, [(3, 48), (4, 40), (9, 35.5), (17, 33.5), (30, 33.5), (38, 35.5), (43, 40), (44, 48)], 20, 38, 19, 11)
c.fill(c.line(36, 37, 38, 47), '1')
neck(c, 19, 28, 28, 34)
c.fill(c.poly([(19.5, 33), (28.5, 33), (24, 38.5)]), 'B'); c.fill(c.rect(19, 29, 28, 30), 'A')
c.put(17, 33, ['2222...', '.22222.', '..2222.', '...22..'])           # collar points, shadowed
c.put(26, 33, ['..22222', '.22222.', '.2222..', '..22...'])
c.fill(c.line(24, 39, 24, 47), '2'); c.put(25, 41, ['m']); c.put(25, 44, ['m'])   # placket, buttons
c.fill(c.rect(37, 41, 41, 42), 'v')          # sleeve garter (green)
face(c, 'oval', 15, 19, eyes='round', brows='arched', mouth='smile')
ear(c, 32, 18); ear(c, 13, 18, 'L')
# ---- hair: short, neat, parted, with volume above the shade
hair(c, [(14, 18), (14, 11), (16.5, 6.5), (21, 4.5), (27, 4.8), (31.5, 7), (33.5, 11), (33.5, 18), (32, 13.5), (16, 13.5), (15, 18)],
     0, 22, 8, 10, 4)
c.fill(c.line(20, 5, 18, 10), 'E')                                                    # the parting
# ---- eyeshade: a thin green band, the brim tipped down over the brow
c.fill(c.poly([(13.5, 11.5), (34.5, 11.5), (34.5, 13.4), (13.5, 13.4)]), 'v'); c.fill(c.rect(29, 12, 34, 13), 'u')
brim = c.poly([(10.5, 13.5), (37.5, 13.5), (35, 16.4), (13, 16.4)])
c.fill(brim, 'w'); c.fill(brim & c.rect(0, 16, 47, 16), 'v'); c.fill(brim & c.rect(28, 14, 47, 15), 'v')
c.fill(c.rect(15, 17, 32, 17) & c.mask_of('CDB'), 'B')                              # the brim's shadow on the brow
# ---- the coin stack in his hand, lower left
for y in range(45, 36, -2): put(c, 6, y, ['bccccccb', 'abbbbbba'])
put(c, 6, 35, ['.cccccc.', 'bccccccb'])
c.fill(c.rect(12, 35, 13, 46) & c.mask_of('bc'), 'a')
put(c, 4, 44, ['.CCD', 'CCCC', 'BCCC', '.BB.'])
c.edge(c.mask_of('abcd'), 'a')
PORTRAIT = portrait('trading.cashier', 'Cashier', 'white', [{'skin': 'golden', 'hair': 'darkbrown'}], c, accent='green')
