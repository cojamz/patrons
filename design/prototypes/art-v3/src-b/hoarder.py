import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Hoarder (white): a wiry old man with wild white hair and a stubbled jaw, in a white undershirt and a baggy cardigan,
# hugging a bulging sack with a candlestick and a pan handle poking out. Worried brows, eyes slid sideways: is anyone
# after it? Long face. Template: 1 person.
c = new()
b = body(c, [(3, 48), (4, 40), (9, 35.5), (17, 33.5), (30, 33.5), (38, 35.5), (43, 40), (44, 48)], 20, 38, 19, 11)
c.fill(c.poly([(18, 33.5), (29, 33.5), (24, 38)]), 'B')
c.fill(c.line(18, 34, 21, 47), '1'); c.fill(c.line(29, 34, 27, 47), '1')
neck(c, 20, 27, 28, 34)
face(c, 'long', 16, 19, eyes='left', brows='worried', mouth='pursed')
ear(c, 32, 18); ear(c, 14, 18, 'L')
c.put(17, 25, ['.B.B.......']); c.put(18, 27, ['B.B.B.B'])                       # stubble
hair(c, [(14.5, 18), (12, 13), (13, 8), (11, 5), (16, 6), (18, 2.5), (22, 5.4), (25, 2), (28, 5), (33, 3.5), (32.6, 8), (36, 11),
         (33.4, 13), (34, 18), (32.6, 18), (31, 13.6), (17, 13.6), (15.6, 18)], 0, 23, 10, 8, 5)
# the sack, hugged to his chest, lower left
sack = c.poly([(5, 47.5), (4, 41), (7, 36.5), (12, 35), (18, 35.5), (22, 40), (22, 47.5)])
c.fill(sack, 's'); c.outside(sack, 'r', 12, 39, 8, 6); c.fill(sack & c.ellipse(9, 37.5, 3, 2), 't')
c.edge(sack, 'q'); c.put(10, 42, ['r', '.r'])                                     # two fold pixels
# the sack's neck, gathered and tied with cord
nk = c.poly([(12, 35.5), (14, 32), (14.6, 30), (16.4, 30), (17, 32), (18.5, 35.5)]) | c.poly([(12.5, 27), (15.5, 28.6), (18.5, 27), (17.5, 30), (13.5, 30)])
c.fill(nk, 's'); c.fill(nk & c.rect(16, 27, 19, 36), 'r'); c.edge(nk, 'q')
c.put(14, 31, ['kkk', '...k', '...k'])                                             # pale rope tie, a knot tail
# a gold candlestick leaning out of the sack: base, stem, cup, a lit candle (tilted, never upright)
c.put(4, 18, ['......dd.', '......dc.', '.....kj..', '.....kj..', '....kj...', '...bccb..', '....cb...', '....cb...', '...cb....', '..bcccb..', '.abbbba..'])
c.edge(c.mask_of('bcd') & c.rect(4, 18, 13, 29), 'a')
c.put(19, 39, ['.CCC', 'CCCC', 'BCCB', '.BB.'])
PORTRAIT = portrait('trading.hoarder', 'Hoarder', 'white', [{'skin': 'palepink', 'hair': 'grey'}], c)
