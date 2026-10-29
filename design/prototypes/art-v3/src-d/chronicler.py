import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Chronicler (green): the town's old record-keeper. Bald crown, white tufts over the ears, a short white beard, round
# spectacles, a quill raised as he writes it all down. Scholar's gown with a dark collar band. Pleased with himself.
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
beard = c.poly([(15.5, 22), (17, 22), (17.5, 26), (19.5, 27), (28.5, 27), (30, 26), (30.5, 22), (31.5, 22), (31, 26.5), (28, 30), (24, 31.2), (19.5, 30), (16.5, 27)])
c.fill(beard, 'G'); c.outside(beard, 'F', 22, 25, 8.5, 5.5); c.fill(beard & c.ellipse(18, 25, 2, 2), 'H')
                                      # moustache
c.put(21, 24, ['CCCCCCCC', 'CCCCCCCC'], keep='.'); c.put(23, 25, ['AA']); c.put(23, 26, ['DD'])                                                # mouth, a pleased line
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
vane = c.poly([(41.5, 4), (44, 6.5), (43, 12), (39.5, 19), (38, 18.5), (39, 10)])
c.fill(vane, 'k'); c.fill(vane & c.poly([(41.5, 4), (40, 10), (38.5, 17), (38, 18.5)]), 'l')
c.fill(c.line(42, 5, 37, 24), 'j')
c.edge(vane, 'i')
c.put(35, 21, ['.CCD', 'CCCC', 'BCCB', '.BB.'])
PORTRAIT = {'id': 'echo.chronicler', 'name': 'Chronicler', 'kind': 'member', 'sphere': 'green',
            'people': [{'skin': 'deep', 'hair': 'white'}], 'accent': 'red', 'px': c.rows()}
