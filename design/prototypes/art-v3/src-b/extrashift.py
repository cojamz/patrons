import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Extra Shift (purple): a nurse on her second shift in a row, purple scrubs, a stethoscope round her neck, blonde hair
# scraped into a ponytail. Tired eyes, a small proud smile: still going. 3/4 to our right. Template: 1 person.
c = new()
b = body(c, [(3, 48), (4, 40), (9, 35.5), (17, 33.5), (30, 33.5), (38, 35.5), (43, 40), (44, 48)], 20, 38, 19, 11)
v = c.poly([(19, 33.5), (28, 33.5), (24, 40)]); c.fill(v, 'A'); c.fill(v & c.rect(19, 33, 28, 34), 'B')
c.fill(c.line(19, 33, 24, 41), '2'); c.fill(c.line(28, 33, 24, 41), '2')
neck(c, 19, 27, 28, 34)
face(c, 'q34', 15, 19, eyes='tired', brows='level', mouth='smile')
ear(c, 30, 18)
hair(c, [(14.5, 19), (14, 12), (16.5, 8.5), (21, 6.6), (27, 6.8), (31, 8.5), (32.6, 12), (32.5, 17), (31, 13.6), (26, 12.4),
         (21, 13.3), (16.5, 14.6), (15.5, 19)], 0, 22, 9.5, 9.5, 4)
pt = c.poly([(30.5, 9), (36, 10.5), (39, 15), (38, 21), (35.5, 18), (33, 13), (30.5, 12)])
c.fill(pt, 'F'); c.fill(pt & c.ellipse(34, 11, 3, 2), 'G'); c.put(30, 9, ['vvv', 'vv.'])  # ponytail and its band
c.fill(c.line(21, 8, 19, 12), 'F')
# stethoscope: tubing round the neck, the chest piece on the left
# stethoscope: dark tubing round the neck, down to a silver chest piece
c.put(17, 31, ['n.........n', 'n..........n', '.n.........n', '.n........n.', '..n.......n.', '..n.......n.', '..n......n..', '.n.......n..', 'n........n..'])
c.put(13, 39, ['.gg.', 'ghhg', 'gggf', '.ff.'])
c.put(26, 38, ['ff', 'gf'])
c.fill(c.line(19, 33, 24, 40), '4'); c.fill(c.line(28, 33, 24, 40), '1')             # scrubs V-neck, piped
PORTRAIT = portrait('purple.extrashift', 'Extra Shift', 'purple', [{'skin': 'palepink', 'hair': 'blonde'}], c, accent='violet')
