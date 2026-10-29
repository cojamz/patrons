import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Undertaker (white): a long, gaunt undertaker in a pale mourning coat and white cravat, black hair parted flat, a
# tailor's tape measure draped round his neck: he is sizing you up, kindly. Thin polite smile, eyes slid to you.
# Long face, front. Template: 1 person.
c = new()
b = body(c, [(5, 48), (6, 40), (10, 35.5), (18, 33.5), (29, 33.5), (37, 35.5), (41, 40), (42, 48)], 20, 38, 18, 11)
lapL = c.poly([(15, 34), (20, 33.5), (23, 46), (20.5, 46), (17, 39), (13.5, 36)])
lapR = c.poly([(27.5, 33.5), (32, 34), (33.5, 36), (31, 39), (27, 46), (24.5, 46)])
c.fill(lapL, '2'); c.edge(lapL, '1'); c.fill(lapR, '1')
cr = c.poly([(20, 32), (27.5, 32), (26.5, 38), (24, 41), (21, 38)]); c.fill(cr, '3'); c.fill(cr & c.rect(25, 32, 28, 41), '2'); c.edge(cr, '1')
neck(c, 20, 27, 28, 32)
face(c, 'long', 16, 19, eyes='left', brows='level', mouth='smirk')
ear(c, 32, 18); ear(c, 14, 18, 'L')
hair(c, [(15, 17), (15, 10), (17.5, 7), (23, 5.8), (29, 6.4), (32, 9), (32.6, 17), (31.4, 17), (31, 12.5), (22, 12), (17, 13), (16, 17)],
     0, 21, 8.5, 9, 4)
c.fill(c.line(21, 7, 19, 12), 'E')
# the tape measure round his neck, hanging down both sides, ticked
# the tape measure pulled taut between his two hands, black ticks every 2px
tape = c.rect(9, 39, 38, 41)
c.fill(tape, 'c'); c.fill(c.rect(9, 41, 38, 41), 'b'); c.fill(c.rect(9, 39, 38, 39), 'd')
for x in range(10, 38, 2): c.set(x, 39, 'z')
for x in range(14, 38, 6): c.set(x, 40, 'z')
c.edge(tape, 'a')
c.put(4, 37, ['.DCD.', 'CBCBC', 'CCCCB', 'BCCCB', '.BBB.', '..11.'])                    # his hands, pinching the ends
c.put(38, 37, ['.DCC.', 'CBCBB', 'CCCCB', 'BCCBB', '.BBB.', '.11..'])
PORTRAIT = portrait('trading.undertaker', 'Undertaker', 'white', [{'skin': 'porcelain', 'hair': 'black'}], c)
