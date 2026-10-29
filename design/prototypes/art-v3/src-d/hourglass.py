import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _kit import *

# Stunt Double (green): a stuntwoman between takes. Cropped hair, a plaster on her cheekbone, racing
# jumpsuit zipped to the throat, her red crash helmet with a white stripe under her arm. Chin up, proud, a small closed smile.
# 3/4 to our right. Template: 1 person.
c = Canvas()
body = torso(c, 2, 45, 33)
c.fill(c.rect(16, 30, 30, 34), '3'); c.fill(c.rect(16, 30, 30, 30), '4'); c.fill(c.rect(27, 31, 30, 34), '2')   # collar
c.fill(c.line(23, 30, 23, 47), '1'); c.put(22, 31, ['55', '54'])                                 # zip
c.fill(c.poly([(3, 40), (12, 36), (14, 48), (2, 48)]), '4'); c.fill(c.line(4, 41, 12, 37), '5')  # racing stripe
neck(c, 20, 26, 28, 30, keys='BC')
face(c, 15, 31, 13, 28, 19, 25, [(18, 'i4c'), (27, 'i3c')], (22, ['A...A', '.AAA.']), jaw='square', hair='F',
     brows=[(18, -2, ['FFFF']), (27, -2, ['FFF'])], ear=(13, 'L'), mouth_y=24, lit=3, iris='m')
c.put(28, 19, ['sss', 'sss'])                                                                  # plaster
hair = c.poly([(14, 17), (13.5, 12), (15.5, 8.6), (20, 6.8), (26, 6.8), (30.5, 8.6), (32.6, 12), (32.5, 18), (31, 15.5),
               (27, 13.6), (22, 14.2), (17, 13.4), (15.4, 16.5)])
c.fill(hair, 'F'); c.outside(hair, 'E', 21, 10, 10, 4.4); c.rim(hair, 'G', -1, -1, 1, only='F')
for x in (18, 22, 26): c.fill(c.line(x, 13, x + 2, 9), 'E')
c.edge(hair, 'E')
# helmet under her left arm (our right), visor stripe
hel = c.ellipse(40, 38, 7, 6.4)
c.fill(hel, 'v'); c.outside(hel, 'u', 38.5, 36.5, 6.6, 5.8); c.fill(hel & c.ellipse(37.5, 34.6, 2.6, 1.4), 'w')
c.fill(hel & c.rect(39, 31, 40, 36), 'k')                                                           # white stripe
vis = c.poly([(34, 37), (44, 36), (46.5, 38), (46.5, 41), (35, 41)])
c.fill(vis & hel, 'z'); c.fill(vis & hel & c.rect(0, 37, 40, 37), 'm')
c.edge(hel, 'u')
c.put(31, 39, ['.CCD', 'CCCC', 'BCCB', '.BB.'])
PORTRAIT = {'id': 'echo.hourglass', 'name': 'Stunt Double', 'kind': 'member', 'sphere': 'green',
            'people': [{'skin': 'verydeep', 'hair': 'black'}], 'accent': 'red', 'px': c.rows()}
