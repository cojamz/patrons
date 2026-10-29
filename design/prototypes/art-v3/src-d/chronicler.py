import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Chronicler (green): the town's old record-keeper. Bald crown, white tufts over the ears, a short white beard, round
# spectacles, a short feather quill in his fist, dark nib down. Scholar's gown with a dark collar band. Pleased with himself.
# 3/4 to our right. Template: 1 person.
c = Canvas()
body = torso(c, 2, 45, 33)
c.fill(c.poly([(17, 33), (30, 33), (27, 40), (24, 42), (20, 40)]), '1')          # deep V of the gown
c.fill(c.poly([(14, 33.5), (18, 33), (22, 41.5), (19.5, 42), (15, 37)]), '4')     # collar band, lit side
c.fill(c.poly([(29, 33), (33, 33.5), (32, 37), (27.5, 42), (25.5, 41.5)]), '2')
c.fill(c.line(9, 40, 11, 47), '2')
neck(c, 20, 27, 28, 33)
face(c, 15, 32, 12, 28, 19, 26, [(19, 'i3r'), (28, 'i3r')], (22, ['.AAAA.', 'A....A']), jaw='round', hair='F',
     brows=[(19, -2, ['GGGG']), (28, -2, ['GGG'])], ear=(13, 'L'), mouth_y=24, lit=2)
# beard: short, white, round
beard = c.poly([(16, 27), (31.5, 27), (31, 28.5), (28, 30.6), (24, 31.8), (19.5, 30.6), (16.5, 28.5)])
c.fill(beard, 'G'); c.outside(beard, 'F', 22, 25, 8.5, 5.5); c.fill(beard & c.ellipse(19, 27.5, 2.4, 1), 'H')
                                      # moustache
c.put(20, 23, ['CCCCCCCCC', 'CCCCCCCCC', 'CCCCCCCCC', 'CCCCCCCCC'], keep='.'); c.put(22, 24, ['DD']); c.put(23, 25, ['uu']); c.put(23, 26, ['BB'])                                                # mouth, a pleased line
# bald crown, white tufts at the sides
crown = c.poly([(15, 15), (15.5, 11.5), (18.5, 9), (24, 8.2), (29, 9), (32.5, 11.5), (33, 15)])
c.fill(crown, 'C'); c.outside(crown, 'B', 22, 9, 9.5, 5); c.fill(crown & c.ellipse(20, 10.5, 3, 1.4), 'D'); c.fill(crown & c.rect(18, 12, 24, 14), 'D')
c.fill(c.rect(32, 11, 33, 15) & crown, 'A')
tuftL = c.poly([(14, 18.5), (14, 14.5), (15.6, 13), (16.4, 14.5), (16, 18.5)])
tuftR = c.poly([(31.5, 18.5), (31.5, 13.5), (33, 13.6), (33.6, 16), (33, 18.5)])
for t in (tuftL, tuftR): c.fill(t, 'G'); c.rim(t, 'H', -1, -1, 1); c.edge(t, 'E')
c.fill(tuftR, 'F')
# spectacles: two round rims and a bridge
c.put(18, 17, ['.eeee.', 'e....e', 'e...!e', '.eeee.'], keep='.')
c.put(27, 17, ['.eee.', 'e...e', 'e..!e', '.eee.'], keep='.')
c.put(24, 18, ['eee'])
# the quill, raised in his right hand
vane = c.poly([(43.5, 14), (45, 16), (42.5, 21), (39.5, 24.5), (38.5, 23.5), (40.5, 18)])
c.fill(vane, 'k'); c.fill(vane & c.poly([(43.5, 14), (41, 19), (38.5, 23.5)]), 'l')
c.fill(c.line(44, 15, 37, 27), 'j')
c.edge(vane, 'i')
c.put(34, 25, ['.CCDC', 'CDCDC', 'CCCCB', 'BCCCB', '.BBB.'])                                  # fist: knuckles lit
c.put(33, 27, ['D', 'C'])                                                                     # thumb
c.put(35, 30, ['zz', 'z.'])                                                                   # dark nib below the fist
# Lighting pass for 1x (deep skin): a D rim down the lit contour, the forehead plane carried down to the glasses,
# the cheekbone joined to the nose bridge under the near lens, the near cheek and jaw lit down to the beard so the
# lower face isn't a dark mass, a bounce (C) inside the shadow-side jaw (r would break the color cap).
lit = [(15, y) for y in range(19, 26)] + [(16, 26), (16, 22), (16, 23), (17, 23), (18, 23), (19, 23), (16, 24), (17, 24),
       (18, 24), (16, 25), (17, 25)] + [(x, 15) for x in range(17, 22)] + [(17, 16), (18, 16), (19, 16)] + \
      [(x, 21) for x in range(20, 26)] + [(25, 19), (25, 20)]
for (x, y) in lit:
    if c.get(x, y) in 'BC': c.set(x, y, 'D')
for y in range(21, 26):
    if c.get(31, y) == 'B': c.set(31, y, 'C')
# Critic round: one stepped highlight on the scalp, top-left; the rest of the scalp on the base tone.
SCALP = {9: (18, 21), 10: (17, 21), 11: (15, 20), 12: (16, 20), 13: (18, 20), 14: (18, 19)}
for y in range(8, 15):
    for x in range(14, 31):
        k = c.get(x, y)
        lo, hi = SCALP.get(y, (99, 0))
        if lo <= x <= hi and k in 'BCD': c.set(x, y, 'D')
        elif k == 'D' or (22 <= x <= 26 and 11 <= y <= 14 and k == 'B'): c.set(x, y, 'C')
PORTRAIT = {'id': 'echo.chronicler', 'name': 'Chronicler', 'kind': 'member', 'sphere': 'green',
            'people': [{'skin': 'deep', 'hair': 'white'}], 'accent': 'red', 'px': c.rows()}
