import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Recluse (white): someone who would rather be home, wrapped in a big white shawl pulled up to the chin, round glasses,
# long dark hair parted in the middle, a book held close. Wary eyes slid to the side, mouth pursed. Long face. Template: 1 person.
c = new()
b = body(c, [(3, 48), (4, 40), (9, 35.5), (17, 33.5), (30, 33.5), (38, 35.5), (43, 40), (44, 48)], 20, 38, 19, 11)
sh = c.poly([(10, 36), (16, 31), (24, 33), (32, 31), (38, 36), (34, 40), (24, 38), (14, 40)])
c.fill(sh, '3'); c.fill(sh & c.rect(26, 30, 40, 41), '2'); c.edge(sh, '1')
for x in range(12, 37, 4): c.fill(c.line(x, 41, x + 1, 47) & b, '2')               # knit ribs
neck(c, 20, 27, 28, 32)
face(c, 'long', 16, 19, eyes='right', brows='worried', mouth='pursed')
hair(c, [(15.5, 32), (14, 24), (14, 13), (16.5, 8.5), (22, 6.5), (28, 6.8), (32, 9.5), (33.5, 14), (33.5, 24), (32.5, 32), (31, 32),
         (31, 15), (27, 12.5), (20, 13.4), (17, 16), (17, 32)], 0, 23, 11, 13, 7)
c.fill(c.line(19, 9, 17, 30), 'G'); c.fill(c.line(30, 10, 32, 30), 'E')
c.fill(c.poly([(19.5, 13.6), (24, 8.6), (28.5, 13.6)]), 'C'); c.fill(c.poly([(24, 8.6), (28.5, 13.6), (26, 13.6)]), 'B')   # a centre parting
c.fill(c.line(24, 6, 24, 8), 'E')
c.put(17, 17, ['.ee...eee', 'e..e.e...e', '.ee...eee'])                          # round glasses
c.put(21, 18, ['e'])
# the book, held close (our left)
bk = c.poly([(6, 47.5), (7, 37), (17, 36.5), (17.5, 47.5)])
c.fill(bk, 'w'); c.fill(bk & c.rect(6, 36, 8, 48), 'u'); c.fill(bk & c.rect(9, 37, 17, 37), 'x'); c.edge(bk, 'u')
c.fill(c.rect(11, 40, 15, 41), 'c')
c.put(15, 41, ['CCC', 'CCCB', 'BCC.'])
PORTRAIT = portrait('trading.recluse', 'Recluse', 'white', [{'skin': 'olive', 'hair': 'darkbrown'}], c, accent='navy')
