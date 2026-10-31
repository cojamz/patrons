import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _lib import *

# Majordomo (silver): head of the household staff. A long-faced older man, grey hair combed flat with grey side
# whiskers, brows level, a composed closed mouth, a silver tailcoat and white wing collar, a silver cloche on a tray
# held up on his gloved hand. 3/4 to our left. Template: 1 person.
c = Canvas()
body = cloth(c, [(1, 48), (2, 41), (7, 36), (16, 33.5), (31, 33.5), (40, 36), (45, 41), (46, 48)])
c.fill(c.poly([(19.5, 33), (28.5, 33), (27, 47), (21, 47)]), 'y'); c.fill(c.rect(25, 33, 28, 47) & c.poly([(19.5, 33), (28.5, 33), (27, 47), (21, 47)]), 'k')
lapL = c.poly([(14.5, 33.5), (19.5, 33), (22, 47), (19.5, 47), (16, 38.5), (12.5, 35.8)])
lapR = c.poly([(28.5, 33), (33.5, 33.5), (35.5, 35.8), (32, 38.5), (28.5, 47), (26, 47)])
c.fill(lapL, '2'); c.rim(lapL, '4', -1, 0, 1); c.edge(lapL, '1'); c.fill(lapR, '1'); c.edge(lapR, '1')
c.put(22, 33, ['mmmm', '.mm.'])                                                  # black tie
neck(c, 20, 27, 28, 32)
c.put(18, 31, ['yy.', '.yy']); c.put(27, 31, ['.yy', 'yy.'])                     # wing collar
f = face(c, (16, 9, 31, 29), 19, view='l', jaw='long', eyes='round', look=0, mouth='flat', brows='level')
hair(c, [(14.5, 16), (15, 10), (19, 7), (27, 6.6), (31, 8.5), (33, 12), (32.6, 16), (31, 12.5), (24, 11.5), (17, 12.6), (16.2, 16)], 21, 8, 10, 3)
c.put(15, 16, ['GF', 'GF', 'FF', 'FE', 'FE']); c.put(31, 16, ['FE', 'FE', 'EE', 'E.'])   # side whiskers
# a silver cloche on a tray, held up at his shoulder on a white-gloved hand
dome = c.ellipse(39, 27, 7.4, 6.6) - c.rect(0, 27, 47, 47)
c.fill(dome, 'g'); c.outside(dome, 'f', 37, 23.5, 5.6, 4.6); c.fill(dome & c.ellipse(36.5, 23.5, 2.2, 1.6), 'h')
c.edge(dome, 'e')
c.put(38, 19, ['ff', 'ee'])                                                          # the knob
c.put(30, 27, ['hgggggggggggggggggf', '.eeeeeeeeeeeeeeee.'])                       # the tray
c.put(34, 29, ['.ykykyk', 'yykkkkj', '.kkkkjj', '..jjjj.', '..1111.'])                  # gloved hand under the tray: knuckle row, thumb, cuff step
merge(c, {'m': 'z', '!': 'y'})
PORTRAIT = {'id': 'silver.majordomo', 'name': 'Majordomo', 'kind': 'member', 'sphere': 'silver',
            'people': [{'skin': 'palepink', 'hair': 'grey'}], 'accent': 'red', 'px': c.rows()}
