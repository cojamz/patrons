import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Patriarch (red): the grand old head of a big family. Square-jawed, white hair swept back, a full white beard, proud
# and steady. Red smoking jacket with gold frogging; one hand on the gold knob of his cane. Front. Template: 1 person.
c = Canvas()
body(c, [(1, 48), (2, 40), (7, 35.5), (16, 33.5), (31, 33.5), (40, 35.5), (45, 40), (46, 48)])
c.fill(c.poly([(17, 34), (31, 34), (28, 37), (20, 37)]), '2')          # the jacket's quilted collar band
c.rim(c.poly([(17, 34), (31, 34), (28, 37), (20, 37)]), '4', 0, -1, 1)
for y in (39, 42, 45): c.put(20, y, ['abbcccbba'][0:1]); c.put(20, y, ['.cccccc.'])   # gold frogging
neck(c, 0, 20, 27, 29, 33)
face(c, 0, 15, 19, 18, 6, 9, view='f', eyes='proud', mouth=None, jaw='square', look='iris')
# white hair swept back, high forehead, full at the sides
hr = c.poly([(13.5, 22), (13, 15), (15, 9.5), (19, 6.6), (25, 6), (30.5, 7.5), (34, 11), (34.6, 16), (34.4, 22), (32.6, 22),
             (32.4, 15), (30, 12.2), (24, 11.6), (18, 12.6), (16, 15), (15.4, 22)])
hair(c, hr, 0, 22, 9.5, 11, 6)
c.fill(c.line(19, 9, 27, 8), 'H'); c.fill(c.line(17, 11, 21, 9), 'H')
# beard: from the cheeks down past the chin, the moustache over a level mouth
bd = c.poly([(15, 22), (16.4, 26), (19, 30.5), (24, 32.6), (29, 30.5), (31.6, 26), (33, 22), (31, 23.4), (28, 23.6),
             (25.5, 22.4), (22.5, 22.4), (20, 23.6), (17, 23.4)])
hair(c, bd, 0, 22, 23, 10, 8)
c.fill(c.rect(16, 30, 32, 33) & bd, 'E')
c.put(20, 23, ['GGHH..HHGG'][0:1]); c.put(19, 23, ['.GGGH..HGGG.'])
c.put(21, 25, ['FAAAAAF', '.FFGFF.'])                                 # mouth, set and level
c.edge(bd, 'E')
# cane: a gold knob, his hand over it
c.put(35, 34, ['.bcc.', 'bcddc', 'bccdc', '.bbc.'])
c.fill(c.rect(36, 38, 37, 48), 'r'); c.fill(c.rect(37, 38, 37, 48), 'q')
c.put(33, 36, ['.CDDC.', 'CCDCCB', 'BCCCBA', '.BBBA.'])
PORTRAIT = portrait(c, 'red.patriarch', 'Patriarch', 'red', [{'skin': 'olive', 'hair': 'white'}])
